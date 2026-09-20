#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_FILE = path.join(ROOT, "data.js");
const MONITOR_DIR = path.join(ROOT, "monitor");
const STATE_FILE = path.join(MONITOR_DIR, "apple-price-state.json");
const REPORT_FILE = path.join(MONITOR_DIR, "latest-report.md");

const SOURCES = {
  us: "https://www.apple.com/shop/buy-iphone",
  cn: "https://www.apple.com.cn/shop/buy-iphone"
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const samplesIndex = args.indexOf("--samples-dir");
const samplesDir =
  samplesIndex >= 0 && args[samplesIndex + 1]
    ? path.resolve(args[samplesIndex + 1])
    : process.env.APPLE_WATCH_SAMPLES_DIR
      ? path.resolve(process.env.APPLE_WATCH_SAMPLES_DIR)
      : null;

function log(message) {
  console.log(`[apple-watch] ${message}`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalModelName(value) {
  const normalized = normalizeText(value).replace(/\s+/g, " ");
  const match = normalized.match(
    /iPhone(?:\s+(?:Duo|Air|\d+e?))(?:\s+Pro)?(?:\s+Max)?/i
  );
  return match ? match[0].replace(/\s+/g, " ") : null;
}

function modelNamesFromTitle(title) {
  const names = normalizeText(title)
    .split(/\s*(?:&|＆|和|\band\b)\s*/i)
    .map(canonicalModelName)
    .filter(Boolean);

  return [...new Set(names)];
}

function extractCapacityGB(value) {
  const match = normalizeText(value).match(/\b(\d+)\s*(GB|TB)\b/i);
  if (!match) return null;
  const amount = Number(match[1]);
  return match[2].toUpperCase() === "TB" ? amount * 1024 : amount;
}

function parsePrice(value) {
  const match = String(value ?? "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Math.round(Number(match[1])) : null;
}

function absoluteUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractText(html, pattern) {
  const match = html.match(pattern);
  return match ? normalizeText(match[1]) : "";
}

function parseCards(html, baseUrl) {
  const cards = [];
  const anchorPattern =
    /<a\s+href="([^"]+)"[^>]*data-display-name="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = absoluteUrl(match[1], baseUrl);
    if (!href || !href.includes("/buy-iphone/")) continue;

    const block = match[3];
    const title = extractText(
      block,
      /class="rf-hcard-content-title"[^>]*>([\s\S]*?)<\/div>/i
    );
    const eyebrow = extractText(
      block,
      /class="rf-hcard-content-eyebrow"[^>]*>([\s\S]*?)<\/div>/i
    );
    const priceBlock =
      block.match(/class="rf-hcard-scrim-price price"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ??
      "";
    const price = parsePrice(priceBlock);
    const modelNames = modelNamesFromTitle(title);

    if (!title || !modelNames.length || !price) continue;

    cards.push({
      title,
      eyebrow,
      href,
      price,
      currency: /RMB|￥/i.test(priceBlock) ? "CNY" : "USD",
      modelNames,
      isLaunchMark: /new|新款|pre-?order|预购|預購|即将/i.test(eyebrow)
    });
  }

  return cards;
}

function extractBalancedArray(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }

  return null;
}

function parseProductDetails(html) {
  const models = new Map();
  const marker = '"products":';
  let searchFrom = 0;

  while (true) {
    const markerIndex = html.indexOf(marker, searchFrom);
    if (markerIndex < 0) break;
    const arrayStart = html.indexOf("[", markerIndex + marker.length);
    if (arrayStart < 0) break;

    const arrayText = extractBalancedArray(html, arrayStart);
    if (!arrayText) break;

    searchFrom = arrayStart + arrayText.length;

    let products;
    try {
      products = JSON.parse(arrayText);
    } catch {
      continue;
    }

    for (const product of products) {
      if (!product || product.category !== "iphone") continue;
      const model = canonicalModelName(product.name);
      const price = Number(product?.price?.fullPrice);
      const gb = extractCapacityGB(product.name);

      if (!model || !Number.isFinite(price) || !gb) continue;

      const current = models.get(model);
      if (!current || price < current.price) {
        models.set(model, { price, gb });
      } else if (price === current.price && gb < current.gb) {
        current.gb = gb;
      }
    }
  }

  return Object.fromEntries(models);
}

async function readSample(name) {
  if (!samplesDir) return null;
  return fs.readFile(path.join(samplesDir, name), "utf8");
}

async function fetchText(url, sampleName) {
  const sample = await readSample(sampleName);
  if (sample !== null) {
    log(`reading sample ${sampleName}`);
    return sample;
  }

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": USER_AGENT,
          "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8"
        },
        redirect: "follow",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await delay(attempt * 1_500);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

function sampleNameForProduct(region, url) {
  const slug = new URL(url).pathname.split("/").filter(Boolean).at(-1);
  return `${region}-${slug}.html`;
}

function sortObject(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
  );
}

function stableCards(cards) {
  return cards
    .map((card) => ({
      title: card.title,
      eyebrow: card.eyebrow,
      price: card.price,
      currency: card.currency,
      modelNames: [...card.modelNames].sort()
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

function normalizeDetails(details) {
  const output = {};
  for (const [model, detail] of Object.entries(details)) {
    output[model] = {
      price: detail.price ?? null,
      gb: detail.gb ?? null
    };
  }
  return sortObject(output);
}

async function loadData() {
  const text = await fs.readFile(DATA_FILE, "utf8");
  const match = text.match(/window\.IPHONE_DATA\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error("Could not find window.IPHONE_DATA in data.js");

  let data;
  try {
    const context = { window: {} };
    vm.runInNewContext(match[0], context, { timeout: 1_000 });
    data = context.window.IPHONE_DATA;
  } catch (error) {
    throw new Error(`could not evaluate window.IPHONE_DATA in data.js: ${error.message}`);
  }

  if (!Array.isArray(data)) {
    throw new Error("window.IPHONE_DATA must be an array");
  }

  return { text, data, match };
}

function replaceData(text, data, match) {
  const replacement = `window.IPHONE_DATA = ${JSON.stringify(data, null, 2)};`;
  return text.slice(0, match.index) + replacement + text.slice(match.index + match[0].length);
}

function setUpdatedDate(text, date) {
  return text.replace(/updated:\s*"[^"]*"/, `updated: "${date}"`);
}

function modelExists(data, model, year = null) {
  return data.some(
    (entry) =>
      (year === null || entry.year === year) &&
      entry.models.some((item) => item.name === model)
  );
}

function buildCurrentDetails(region, cards, details) {
  const output = {};
  for (const card of cards) {
    const parsed = details.get(card.href) ?? {};
    for (const model of card.modelNames) {
      const product = parsed[model];
      output[model] = {
        price: product?.price ?? card.price,
        gb: product?.gb ?? null
      };
    }
  }
  return normalizeDetails(output);
}

async function fetchProductDetails(region, cards) {
  const cache = new Map();

  for (const card of cards) {
    if (cache.has(card.href)) continue;
    try {
      const html = await fetchText(card.href, sampleNameForProduct(region, card.href));
      const parsed = parseProductDetails(html);
      log(`${region} ${card.title}: parsed ${Object.keys(parsed).length} product detail(s): ${Object.keys(parsed).join(" | ")}`);
      cache.set(card.href, parsed);
    } catch (error) {
      log(`warning: ${region} product page failed: ${card.href}: ${error.message}`);
      cache.set(card.href, {});
    }
  }

  return buildCurrentDetails(region, cards, cache);
}

function compareCards(before, after) {
  const changes = [];
  const beforeMap = new Map(before.map((card) => [card.title, card]));
  const afterMap = new Map(after.map((card) => [card.title, card]));

  for (const [title, next] of afterMap) {
    const previous = beforeMap.get(title);
    if (!previous) {
      changes.push(`新增頁面卡片：${title}`);
      continue;
    }
    if (previous.price !== next.price) {
      changes.push(
        `${title} 頁面起售價：${previous.currency === "CNY" ? "RMB " : "$"}${previous.price.toLocaleString("en-US")} → ${next.currency === "CNY" ? "RMB " : "$"}${next.price.toLocaleString("en-US")}`
      );
    }
    if (previous.eyebrow !== next.eyebrow) {
      changes.push(
        `${title} 標籤：${previous.eyebrow || "無"} → ${next.eyebrow || "無"}`
      );
    }
  }

  for (const title of beforeMap.keys()) {
    if (!afterMap.has(title)) changes.push(`移除頁面卡片：${title}`);
  }

  return changes;
}

function compareDetails(before, after) {
  const changes = [];
  const models = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const model of [...models].sort()) {
    const previous = before[model] ?? {};
    const next = after[model] ?? {};
    if (previous.price !== next.price) {
      changes.push(
        `${model} 基準價：${previous.price ?? "未知"} → ${next.price ?? "未知"}`
      );
    }
    if (previous.gb !== next.gb) {
      changes.push(
        `${model} 起始容量：${previous.gb ?? "未知"}GB → ${next.gb ?? "未知"}GB`
      );
    }
  }

  return changes;
}

function modelRows(details, cardsByRegion) {
  const modelNames = new Set([
    ...Object.keys(details.us),
    ...Object.keys(details.cn),
    ...cardsByRegion.us.flatMap((card) => card.modelNames),
    ...cardsByRegion.cn.flatMap((card) => card.modelNames)
  ]);

  return [...modelNames]
    .sort((left, right) => {
      const leftPrice = details.us[left]?.price ?? Number.MAX_SAFE_INTEGER;
      const rightPrice = details.us[right]?.price ?? Number.MAX_SAFE_INTEGER;
      return leftPrice - rightPrice || left.localeCompare(right);
    })
    .map((model) => ({
      model,
      usd: details.us[model]?.price ?? null,
      cny: details.cn[model]?.price ?? null,
      gb: details.us[model]?.gb ?? details.cn[model]?.gb ?? null
    }));
}

function formatPrice(currency, value) {
  if (value === null || value === undefined) return "未知";
  return currency === "CNY"
    ? `RMB ${value.toLocaleString("en-US")}`
    : `$${value.toLocaleString("en-US")}`;
}

function buildReport({ now, dataChanges, pageChanges, detailChanges, rows }) {
  const lines = [
    "# Apple 官方價格監測更新",
    "",
    `**檢查時間：** ${now.toISOString()}`,
    "",
    `**官方來源：** [美國 Apple Store](${SOURCES.us})、[中國大陸 Apple Store](${SOURCES.cn})`,
    "",
    "## 自動更新 `data.js`",
    ""
  ];

  if (dataChanges.length) {
    for (const item of dataChanges) lines.push(`- ${item}`);
  } else {
    lines.push("- 無新機型需要寫入；既有歷年首發價保持不變。");
  }

  lines.push("", "## 官方頁面變動", "");
  const allChanges = [...pageChanges, ...detailChanges];
  if (allChanges.length) {
    for (const item of allChanges) lines.push(`- ${item}`);
  } else {
    lines.push("- 無價格、容量或陣容變動。");
  }

  lines.push("", "## 目前官方頁面起售資訊", "");
  lines.push("| 機型 | 美國 | 中國大陸 | 起始容量 |");
  lines.push("|---|---:|---:|---:|");

  for (const row of rows) {
    lines.push(
      `| ${row.model} | ${formatPrice("USD", row.usd)} | ${formatPrice("CNY", row.cny)} | ${row.gb ? `${row.gb}GB` : "未知"} |`
    );
  }

  lines.push(
    "",
    "> 此監測只把 Apple 官方頁面價格寫入「新出現的機型」。既有機型的歷史首發價不會被後續目前售價或促銷價覆蓋。"
  );

  return `${lines.join("\n")}\n`;
}

async function writeIfChanged(file, content) {
  let existing = null;
  try {
    existing = await fs.readFile(file, "utf8");
  } catch {
    // File does not exist yet.
  }

  if (existing === content) return false;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, "utf8");
  return true;
}

async function main() {
  log(`checking ${SOURCES.us}`);
  const usHtml = await fetchText(SOURCES.us, "us-buy.html");
  log(`checking ${SOURCES.cn}`);
  const cnHtml = await fetchText(SOURCES.cn, "cn-buy.html");

  const cardsByRegion = {
    us: parseCards(usHtml, SOURCES.us),
    cn: parseCards(cnHtml, SOURCES.cn)
  };

  if (!cardsByRegion.us.length || !cardsByRegion.cn.length) {
    throw new Error("Apple page parsing returned no iPhone cards");
  }

  log(`parsed ${cardsByRegion.us.length} US cards and ${cardsByRegion.cn.length} CN cards`);

  const productDetails = {
    us: await fetchProductDetails("us", cardsByRegion.us),
    cn: await fetchProductDetails("cn", cardsByRegion.cn)
  };

  const loaded = await loadData();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentYear = now.getFullYear();
  const currentEntry = loaded.data.find((entry) => entry.year === currentYear);

  const allCurrentModels = new Set([
    ...cardsByRegion.us.flatMap((card) => card.modelNames),
    ...cardsByRegion.cn.flatMap((card) => card.modelNames)
  ]);

  const candidates = [];
  for (const model of allCurrentModels) {
    if (modelExists(loaded.data, model, currentYear)) continue;

    const usCard = cardsByRegion.us.find((card) => card.modelNames.includes(model));
    const cnCard = cardsByRegion.cn.find((card) => card.modelNames.includes(model));
    const hasLaunchMark = Boolean(usCard?.isLaunchMark || cnCard?.isLaunchMark);
    const hasHistoricalEntry = modelExists(loaded.data, model);
    const usDetail = productDetails.us[model];
    const cnDetail = productDetails.cn[model];

    if (!hasHistoricalEntry || hasLaunchMark) {
      if (usDetail?.price && cnDetail?.price && usDetail.gb && cnDetail.gb) {
        candidates.push({
          name: model,
          usd: usDetail.price,
          cny: cnDetail.price,
          gb: Math.min(usDetail.gb, cnDetail.gb),
          isLaunchMark: hasLaunchMark
        });
      }
    }
  }

  const uniqueCandidates = [
    ...new Map(candidates.map((candidate) => [candidate.name, candidate])).values()
  ].sort((left, right) => left.usd - right.usd || left.name.localeCompare(right.name));

  const dataChanges = [];
  let nextDataText = loaded.text;

  if (uniqueCandidates.length) {
    const nextData = structuredClone(loaded.data);
    let targetEntry = nextData.find((entry) => entry.year === currentYear);
    if (!targetEntry) {
      targetEntry = { year: currentYear, models: [], cheapestUsd: 0, note: "" };
      nextData.push(targetEntry);
      nextData.sort((left, right) => left.year - right.year);
    }

    for (const candidate of uniqueCandidates) {
      targetEntry.models.push({
        name: candidate.name,
        usd: candidate.usd,
        cny: candidate.cny,
        gb: candidate.gb
      });
      dataChanges.push(
        `新增 ${candidate.name}：${formatPrice("USD", candidate.usd)} / ${formatPrice("CNY", candidate.cny)} / ${candidate.gb}GB`
      );
    }

    targetEntry.models.sort((left, right) => left.usd - right.usd || left.name.localeCompare(right.name));
    targetEntry.cheapestUsd = Math.min(...targetEntry.models.map((item) => item.usd));
    targetEntry.note =
      targetEntry.note ||
      `由 Apple 官方價格監測於 ${today} 自動加入；請按發表內容補充年度重點。`;

    nextDataText = replaceData(nextDataText, nextData, loaded.match);
    nextDataText = setUpdatedDate(nextDataText, today);
  }

  const nextState = {
    version: 1,
    lastChangedAt: now.toISOString(),
    sources: SOURCES,
    cards: {
      us: stableCards(cardsByRegion.us),
      cn: stableCards(cardsByRegion.cn)
    },
    details: {
      us: normalizeDetails(productDetails.us),
      cn: normalizeDetails(productDetails.cn)
    }
  };

  let previousState = null;
  try {
    previousState = JSON.parse(await fs.readFile(STATE_FILE, "utf8"));
  } catch {
    // First run: create a baseline without creating a notification issue.
  }

  if (!previousState) {
    if (!dryRun) {
      await writeIfChanged(STATE_FILE, `${JSON.stringify(nextState, null, 2)}\n`);
    }
    log("baseline state created; no update report on the first run");
    return;
  }

  const pageChanges = [
    ...compareCards(previousState.cards?.us ?? [], nextState.cards.us),
    ...compareCards(previousState.cards?.cn ?? [], nextState.cards.cn)
  ];
  const detailChanges = [
    ...compareDetails(previousState.details?.us ?? {}, nextState.details.us),
    ...compareDetails(previousState.details?.cn ?? {}, nextState.details.cn)
  ];
  const meaningfulChange =
    dataChanges.length || pageChanges.length || detailChanges.length;

  if (!meaningfulChange) {
    log("no meaningful Apple lineup or price changes");
    return;
  }

  const report = buildReport({
    now,
    dataChanges,
    pageChanges,
    detailChanges,
    rows: modelRows(nextState.details, cardsByRegion)
  });

  if (!dryRun) {
    if (dataChanges.length) {
      await fs.writeFile(DATA_FILE, nextDataText, "utf8");
    }
    await writeIfChanged(STATE_FILE, `${JSON.stringify(nextState, null, 2)}\n`);
    await writeIfChanged(REPORT_FILE, report);
  }

  log(
    `changes detected: ${dataChanges.length} data update(s), ${pageChanges.length + detailChanges.length} page detail change(s)`
  );
  process.stdout.write(`\n${report}`);
}

main().catch((error) => {
  console.error(`[apple-watch] failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});