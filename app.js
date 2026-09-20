// ============================================================
//  app.js — iPhone Price Archive 互動與視覺渲染
// ============================================================

(function () {
  "use strict";

  var DATA = window.IPHONE_DATA || [];
  var SITE = window.SITE || {};
  var MILESTONES = window.MILESTONES || [];
  var ADVICE = window.ADVICE || [];
  var STORAGE_THEME = "iphone-archive-theme";
  var MAX_COMPARE = 3;

  var state = {
    query: "",
    year: "all",
    sort: "year-asc",
    view: "grid",
    compare: []
  };

  var records = DATA.flatMap(function (yearEntry) {
    return yearEntry.models.map(function (model) {
      var id = String(yearEntry.year) + "-" + slug(model.name);
      return {
        id: id,
        year: yearEntry.year,
        name: model.name,
        usd: model.usd,
        cny: model.cny,
        gb: model.gb,
        note: yearEntry.note || "",
        cheapestUsd: yearEntry.cheapestUsd
      };
    });
  });

  function byId(id) { return document.getElementById(id); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function usd(value) { return "$" + Number(value).toLocaleString("en-US"); }
  function cny(value) { return "RMB " + Number(value).toLocaleString("en-US"); }
  function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function setText(id, text) { var node = byId(id); if (node) node.textContent = text; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  var DEVICE_IMAGES = window.DEVICE_IMAGES || {};
  var DEVICE_IMAGE_SOURCES = window.DEVICE_IMAGE_SOURCES || {};
  var ACCENT_BY_MODEL = {
    "iPhone 5c": "#ff7ca8", "iPhone 5s": "#e7c98b", "iPhone 6": "#a8a9ae", "iPhone 6s": "#c7a47d",
    "iPhone SE（第 1 代）": "#d5d5d7", "iPhone 7": "#4d515a", "iPhone 8": "#d8c3a6", "iPhone X": "#c8cbd2",
    "iPhone XR": "#4b8bd0", "iPhone XS": "#d3b487", "iPhone 11": "#b9a6e8", "iPhone 11 Pro": "#6d8276",
    "iPhone SE（第 2 代）": "#353942", "iPhone 12": "#4f73c5", "iPhone 12 Pro": "#8392a8",
    "iPhone 13": "#f0a6bd", "iPhone 13 Pro": "#8db7d4", "iPhone SE（第 3 代）": "#353942",
    "iPhone 14": "#6f9dd4", "iPhone 14 Pro": "#a568b3", "iPhone 15": "#9dc9dc", "iPhone 15 Pro": "#b8b0a5",
    "iPhone 16": "#4a69b1", "iPhone 16 Pro": "#d7b994", "iPhone 16e": "#c1c7d0", "iPhone 17": "#7da4ea",
    "iPhone Air": "#a8d9ee", "iPhone 17 Pro": "#f39a62", "iPhone 17e": "#f2a8c5", "iPhone 18 Pro": "#a84254",
    "iPhone Duo": "#b8c6de"
  };

  function getAccent(name, year) {
    if (name === "iPhone Air" && year === 2026) return "#e4bd78";
    return ACCENT_BY_MODEL[name] || "#7da4ea";
  }

  function getDeviceSizeClass(name) {
    if (/mini/.test(name)) return "is-mini";
    if (/Plus/.test(name)) return "is-plus";
    if (/Max/.test(name)) return "is-max";
    if (/Duo/.test(name)) return "is-fold";
    return "is-standard";
  }

  function renderDeviceImage(record) {
    var src = DEVICE_IMAGES[record.name] || "assets/iphone-17-family.jpg";
    var sizeClass = getDeviceSizeClass(record.name);
    return '<figure class="device-image-frame">' +
      '<span class="product-image-label">Product image</span>' +
      '<img class="device-image ' + sizeClass + '" src="' + escapeHtml(src) + '" alt="' + escapeHtml(record.name + " 真實產品圖") + '" loading="lazy" decoding="async">' +
      '</figure>';
  }
  function renderMeta() {
    document.title = SITE.title || "iPhone Price Archive";
    var heroTitle = byId("site-title");
    if (heroTitle) {
      var heroParts = String(SITE.heroTitle || SITE.title || "每一代 iPhone，｜價格與設計的進化史").split("｜");
      heroTitle.innerHTML = escapeHtml(heroParts[0]) + (heroParts[1] ? "<br><span>" + escapeHtml(heroParts[1]) + "</span>" : "");
    }
    setText("site-subtitle", SITE.subtitle || "從第一代到最新機型，收藏每一年的價格與設計轉折。");
    setText("site-updated", "更新日期：" + (SITE.updated || ""));

    if (!DATA.length) return;
    var years = DATA.map(function (entry) { return entry.year; });
    var values = DATA.map(function (entry) { return entry.cheapestUsd; });
    setText("stat-span", years[0] + "–" + years[years.length - 1]);
    setText("stat-lowest", usd(Math.min.apply(null, values)));
    setText("stat-highest", usd(Math.max.apply(null, values)));
    setText("stat-now", usd(DATA[DATA.length - 1].cheapestUsd));
  }

  function populateYears() {
    var select = byId("year-filter");
    if (!select) return;
    var years = DATA.map(function (entry) { return entry.year; });
    select.innerHTML = '<option value="all">全部年份</option>' + years.map(function (year) {
      return '<option value="' + year + '">' + year + " 年</option>";
    }).join("");
  }

  function filteredRecords() {
    var query = state.query.trim().toLowerCase();
    var rows = records.filter(function (item) {
      var matchesQuery = !query || [item.name, item.year, item.usd, item.cny].join(" ").toLowerCase().indexOf(query) >= 0;
      var matchesYear = state.year === "all" || String(item.year) === String(state.year);
      return matchesQuery && matchesYear;
    });

    rows.sort(function (a, b) {
      if (state.sort === "year-desc") return b.year - a.year || a.name.localeCompare(b.name);
      if (state.sort === "price-asc") return a.usd - b.usd || a.year - b.year;
      if (state.sort === "price-desc") return b.usd - a.usd || b.year - a.year;
      return a.year - b.year || a.usd - b.usd || a.name.localeCompare(b.name);
    });
    return rows;
  }

  function renderCards(rows) {
    var grid = byId("iphone-grid");
    if (!grid) return;
    if (!rows.length) {
      grid.innerHTML = '<div class="empty-state card"><strong>沒有找到符合條件的機型</strong><span>試著清除搜尋或切換年份。</span></div>';
      return;
    }

    grid.innerHTML = rows.map(function (item) {
      var selected = state.compare.indexOf(item.id) >= 0;
      var accent = getAccent(item.name, item.year);
      return '<article class="iphone-card' + (selected ? " is-selected" : "") + '" data-id="' + item.id + '" tabindex="0" style="--card-accent:' + accent + '66">' +
        '<div class="card-topline"><span class="card-year">' + item.year + '</span><span class="card-price">' + usd(item.usd) + '</span></div>' +
        '<div class="device-visual">' + renderDeviceImage(item) + '</div>' +
        '<h3 class="card-title">' + escapeHtml(item.name) + '</h3>' +
        '<div class="card-subline"><strong>' + usd(item.usd) + '</strong><span>' + cny(item.cny) + ' · ' + item.gb + 'GB</span></div>' +
        '<p class="card-note">' + escapeHtml(item.note) + '</p>' +
        '<div class="card-footer"><span class="capacity-pill">' + item.gb + 'GB 起</span><button class="compare-toggle" type="button" data-compare="' + item.id + '">' + (selected ? "已加入比較" : "+ 加入比較") + '</button></div>' +
      '</article>';
    }).join("");
  }

  function renderTable() {
    var tbody = byId("price-tbody");
    if (!tbody || !DATA.length) return;
    var filtered = filteredRecords();
    var grouped = new Map();
    filtered.forEach(function (item) {
      if (!grouped.has(item.year)) grouped.set(item.year, []);
      grouped.get(item.year).push(item);
    });

    var years = Array.from(grouped.keys());
    tbody.innerHTML = years.length ? years.map(function (year) {
      var items = grouped.get(year);
      var yearEntry = DATA.filter(function (entry) { return entry.year === year; })[0];
      var modelsHtml = items.map(function (item) {
        return '<div class="model-row"><span class="model-name">' + escapeHtml(item.name) + '</span><span class="model-price">' + usd(item.usd) + ' / ' + cny(item.cny) + '</span><span class="model-gb">' + item.gb + 'GB</span></div>';
      }).join("");
      return '<tr><td class="td-year">' + year + '</td><td class="td-models">' + modelsHtml + '</td><td class="td-cheapest"><span class="badge">' + usd(yearEntry.cheapestUsd) + '</span></td><td class="td-note">' + escapeHtml(yearEntry.note || "") + '</td></tr>';
    }).join("") : '<tr><td colspan="4">沒有找到符合條件的機型</td></tr>';
  }

  function updateResultCount(rows) {
    setText("result-count", "顯示 " + rows.length + " 款機型");
  }

  function renderExplorer() {
    var rows = filteredRecords();
    renderCards(rows);
    renderTable();
    updateResultCount(rows);
  }

  function findRecord(id) {
    return records.filter(function (item) { return item.id === id; })[0];
  }

  function openDetail(id) {
    var item = findRecord(id);
    var modal = byId("detail-modal");
    var content = byId("modal-content");
    if (!item || !modal || !content) return;

    content.innerHTML =
      '<div class="modal-hero">' +
        '<div class="modal-device">' + renderDeviceImage(item) + '</div>' +
        '<div><span class="modal-kicker">' + item.year + ' · LAUNCH PRICE</span>' +
        '<h2 id="modal-title">' + escapeHtml(item.name) + '</h2>' +
        '<div class="modal-price">' + usd(item.usd) + '</div>' +
        '<div class="modal-cny">' + cny(item.cny) + ' · ' + item.gb + 'GB 起</div>' +
        '<p class="modal-note">' + escapeHtml(item.note) + '</p>' +
        '<div class="modal-facts">' +
          '<div class="fact"><small>美國首發</small><strong>' + usd(item.usd) + '</strong></div>' +
          '<div class="fact"><small>中國大陸首發</small><strong>' + cny(item.cny) + '</strong></div>' +
          '<div class="fact"><small>起始容量</small><strong>' + item.gb + 'GB</strong></div>' +
        '</div>' +
        '<p class="modal-source">產品影像來源：<a href="' + escapeHtml(DEVICE_IMAGE_SOURCES[item.name] || "#") + '" target="_blank" rel="noopener">Wikipedia／Wikimedia 機型頁面</a></p>' +
        '</div></div>' +
      '</div>';
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    var modal = byId("detail-modal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function updateCompareTray() {
    var tray = byId("compare-tray");
    var chips = byId("compare-chips");
    if (!tray || !chips) return;
    chips.innerHTML = state.compare.map(function (id) {
      var item = findRecord(id);
      if (!item) return "";
      return '<span class="compare-chip">' + escapeHtml(item.name) + ' <button type="button" data-remove="' + id + '" aria-label="移除">×</button></span>';
    }).join("");
    tray.hidden = state.compare.length === 0;
  }

  function toggleCompare(id) {
    var index = state.compare.indexOf(id);
    if (index >= 0) {
      state.compare.splice(index, 1);
    } else if (state.compare.length < MAX_COMPARE) {
      state.compare.push(id);
    } else {
      window.alert("最多可以比較 " + MAX_COMPARE + " 款 iPhone。");
    }
    renderExplorer();
    updateCompareTray();
  }

  function openCompare() {
    if (state.compare.length < 2) {
      window.alert("請至少選擇 2 款 iPhone 進行比較。");
      return;
    }
    var items = state.compare.map(findRecord).filter(Boolean);
    var modal = byId("detail-modal");
    var content = byId("modal-content");
    if (!modal || !content) return;
    var rows = [
      ["年份", function (item) { return item.year + " 年"; }],
      ["美國首發", function (item) { return usd(item.usd); }],
      ["中國大陸首發", function (item) { return cny(item.cny); }],
      ["起始容量", function (item) { return item.gb + "GB"; }],
      ["當年度入門款", function (item) { return usd(item.cheapestUsd); }],
      ["年度重點", function (item) { return item.note; }]
    ];
    content.innerHTML = '<span class="modal-kicker">SIDE BY SIDE</span><h2 id="modal-title">iPhone 規格比較</h2>' +
      '<table class="compare-table"><thead><tr><th>項目</th>' + items.map(function (item) { return '<th>' + escapeHtml(item.name) + '</th>'; }).join("") + '</tr></thead><tbody>' +
      rows.map(function (row) {
        return '<tr><th>' + row[0] + '</th>' + items.map(function (item) { return '<td>' + escapeHtml(row[1](item)) + '</td>'; }).join("") + '</tr>';
      }).join("") + '</tbody></table>';
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }
  function renderChart() {
    var box = byId("trend-chart");
    if (!box || DATA.length < 2) return;
    var W = 960, H = 360, padL = 58, padR = 28, padT = 40, padB = 46;
    var values = DATA.map(function (entry) { return entry.cheapestUsd; });
    var years = DATA.map(function (entry) { return entry.year; });
    var rawMin = Math.min.apply(null, values), rawMax = Math.max.apply(null, values);
    var yMin = Math.floor((rawMin - 40) / 100) * 100;
    var yMax = Math.ceil((rawMax + 40) / 100) * 100;
    var innerW = W - padL - padR, innerH = H - padT - padB;
    function x(index) { return padL + (innerW * index) / (values.length - 1); }
    function y(value) { return padT + innerH - ((value - yMin) / (yMax - yMin)) * innerH; }
    var points = values.map(function (value, index) { return { x: x(index), y: y(value), value: value, year: years[index], note: DATA[index].note }; });
    var line = points.map(function (point, index) { return (index === 0 ? "M" : "L") + point.x.toFixed(1) + " " + point.y.toFixed(1); }).join(" ");
    var area = line + " L" + points[points.length - 1].x.toFixed(1) + " " + (padT + innerH).toFixed(1) + " L" + points[0].x.toFixed(1) + " " + (padT + innerH).toFixed(1) + " Z";
    var gridHtml = "";
    for (var tick = yMin; tick <= yMax; tick += 100) {
      var ty = y(tick);
      gridHtml += '<line class="grid" x1="' + padL + '" y1="' + ty.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + ty.toFixed(1) + '"/>' +
        '<text class="axis" x="' + (padL - 10) + '" y="' + (ty + 4).toFixed(1) + '" text-anchor="end">$' + tick + '</text>';
    }
    var dotsHtml = points.map(function (point, index) {
      return '<circle class="dot" data-index="' + index + '" cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="5"></circle>';
    }).join("");
    var valHtml = points.map(function (point) { return '<text class="val" x="' + point.x.toFixed(1) + '" y="' + (point.y - 12).toFixed(1) + '" text-anchor="middle">' + usd(point.value) + '</text>'; }).join("");
    var yearHtml = points.map(function (point) { return '<text class="year" x="' + point.x.toFixed(1) + '" y="' + (padT + innerH + 28).toFixed(1) + '" text-anchor="middle">' + point.year + '</text>'; }).join("");

    box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="歷年起售價格走勢">' +
      '<defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5c9dff" stop-opacity="0.42"/><stop offset="100%" stop-color="#5c9dff" stop-opacity="0.02"/></linearGradient></defs>' +
      gridHtml + '<path class="area" d="' + area + '"/><path class="line" d="' + line + '"/>' + dotsHtml + valHtml + yearHtml + '</svg>';

    var tooltip = byId("chart-tooltip");
    var stage = document.querySelector(".chart-stage");
    all(".dot", box).forEach(function (dot) {
      function show() {
        var point = points[Number(dot.getAttribute("data-index"))];
        if (!tooltip || !stage) return;
        tooltip.innerHTML = '<span>' + point.year + ' 年最便宜新款</span><strong>' + usd(point.value) + '</strong><span>' + escapeHtml(point.note || "") + '</span>';
        var rect = stage.getBoundingClientRect();
        var dotRect = dot.getBoundingClientRect();
        tooltip.style.left = (dotRect.left - rect.left + dotRect.width / 2) + "px";
        tooltip.style.top = (dotRect.top - rect.top) + "px";
        tooltip.hidden = false;
        all(".dot", box).forEach(function (node) { node.classList.remove("is-active"); });
        dot.classList.add("is-active");
      }
      dot.addEventListener("mouseenter", show);
      dot.addEventListener("focus", show);
      dot.addEventListener("mouseleave", function () { if (tooltip) tooltip.hidden = true; dot.classList.remove("is-active"); });
      dot.setAttribute("tabindex", "0");
    });

    var first = values[0], last = values[values.length - 1];
    var delta = last - first;
    setText("chart-delta", (delta >= 0 ? "+" : "") + usd(delta) + " · " + years[0] + " → " + years[years.length - 1]);
  }

  function renderMilestones() {
    var wrap = byId("milestone-list");
    if (!wrap) return;
    wrap.innerHTML = MILESTONES.map(function (item) {
      return '<li class="milestone"><span class="ms-year">' + escapeHtml(item.year) + '</span><div class="ms-body"><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.text) + '</p></div></li>';
    }).join("");
  }

  function renderAdvice() {
    var wrap = byId("advice-grid");
    if (!wrap) return;
    wrap.innerHTML = ADVICE.map(function (item) {
      return '<article class="advice-card"><div class="advice-icon">' + escapeHtml(item.icon) + '</div><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.text) + '</p></article>';
    }).join("");
  }
  function initTheme() {
    var saved = null;
    try { saved = window.localStorage.getItem(STORAGE_THEME); } catch (error) { saved = null; }
    if (saved === "light") document.documentElement.setAttribute("data-theme", "light");
  }

  function toggleTheme() {
    var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    if (next === "dark") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
    try { window.localStorage.setItem(STORAGE_THEME, next); } catch (error) { /* ignore */ }
  }

  function initReveal() {
    var elements = all(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach(function (node) { node.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    elements.forEach(function (node) { observer.observe(node); });
  }

  function initScrollUI() {
    var nav = byId("site-nav");
    var progress = byId("scroll-progress");
    var topButton = byId("back-to-top");
    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var height = document.documentElement.scrollHeight - window.innerHeight;
      if (nav) nav.classList.toggle("is-scrolled", scrollTop > 22);
      if (progress) progress.style.width = clamp(height ? scrollTop / height * 100 : 0, 0, 100) + "%";
      if (topButton) topButton.classList.toggle("is-visible", scrollTop > 640);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
    if (topButton) topButton.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  function initNav() {
    var toggle = byId("menu-toggle");
    var links = byId("nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    all("a", links).forEach(function (link) {
      link.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function randomCompare() {
    if (records.length < 2) return;
    var shuffled = records.slice().sort(function () { return Math.random() - 0.5; });
    state.compare = shuffled.slice(0, 2).map(function (item) { return item.id; });
    renderExplorer();
    updateCompareTray();
    window.setTimeout(function () {
      var explorer = byId("explorer");
      if (explorer) explorer.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(openCompare, 420);
    }, 80);
  }

  function bindEvents() {
    var search = byId("search-input");
    var year = byId("year-filter");
    var sort = byId("sort-mode");
    var grid = byId("iphone-grid");
    var clear = byId("clear-filters");
    var theme = byId("theme-toggle");
    var heroCompare = byId("hero-compare");
    var compareClear = byId("compare-clear");
    var compareOpen = byId("compare-open");
    var modal = byId("detail-modal");

    if (search) search.addEventListener("input", function () { state.query = search.value; renderExplorer(); });
    if (year) year.addEventListener("change", function () { state.year = year.value; renderExplorer(); });
    if (sort) sort.addEventListener("change", function () { state.sort = sort.value; renderExplorer(); });
    if (theme) theme.addEventListener("click", toggleTheme);
    if (heroCompare) heroCompare.addEventListener("click", randomCompare);
    if (compareClear) compareClear.addEventListener("click", function () { state.compare = []; renderExplorer(); updateCompareTray(); });
    if (compareOpen) compareOpen.addEventListener("click", openCompare);

    all(".view-button").forEach(function (button) {
      button.addEventListener("click", function () {
        state.view = button.getAttribute("data-view");
        all(".view-button").forEach(function (node) { node.classList.toggle("is-active", node === button); });
        var gridView = byId("iphone-grid");
        var tableView = byId("table-view");
        if (gridView) gridView.classList.toggle("is-hidden", state.view !== "grid");
        if (tableView) tableView.classList.toggle("is-hidden", state.view !== "table");
      });
    });

    if (clear) clear.addEventListener("click", function () {
      state.query = "";
      state.year = "all";
      state.sort = "year-asc";
      if (search) search.value = "";
      if (year) year.value = "all";
      if (sort) sort.value = "year-asc";
      renderExplorer();
    });

    if (grid) {
      grid.addEventListener("click", function (event) {
        var compareButton = event.target.closest("[data-compare]");
        if (compareButton) {
          event.stopPropagation();
          toggleCompare(compareButton.getAttribute("data-compare"));
          return;
        }
        var card = event.target.closest(".iphone-card");
        if (card) openDetail(card.getAttribute("data-id"));
      });
      grid.addEventListener("keydown", function (event) {
        var card = event.target.closest(".iphone-card");
        if (card && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          openDetail(card.getAttribute("data-id"));
        }
      });
    }

    var tray = byId("compare-tray");
    if (tray) tray.addEventListener("click", function (event) {
      var remove = event.target.closest("[data-remove]");
      if (remove) toggleCompare(remove.getAttribute("data-remove"));
    });

    if (modal) modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-modal]")) closeModal();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal();
    });
  }

  function init() {
    populateYears();
    renderMeta();
    renderExplorer();
    renderChart();
    renderMilestones();
    renderAdvice();
    initTheme();
    initReveal();
    initScrollUI();
    initNav();
    bindEvents();
    updateCompareTray();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();