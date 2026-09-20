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

  var DEVICE_SPECS = {
    "iPhone 5c": { camera: "single", top: "home", body: "#ff7ca8", body2: "#e65584", edge: "#ffc0d6", screen: "#b93362", accent: "#ff8bb0", radius: 11 },
    "iPhone 5s": { camera: "single", top: "home", body: "#d8d8d8", body2: "#8b8d92", edge: "#f4f4f2", screen: "#426d95", accent: "#bfc7d2", radius: 11 },
    "iPhone 6": { camera: "single", top: "home", body: "#a8a9ae", body2: "#65676d", edge: "#e0e1e3", screen: "#436f95", accent: "#aab3bf", radius: 15 },
    "iPhone 6 Plus": { camera: "single", top: "home", body: "#a8a9ae", body2: "#65676d", edge: "#e0e1e3", screen: "#436f95", accent: "#aab3bf", radius: 15, tall: 1.06 },
    "iPhone 6s": { camera: "single", top: "home", body: "#c7a47d", body2: "#8b684b", edge: "#f0d7b8", screen: "#8b6a8e", accent: "#d7b18d", radius: 15 },
    "iPhone 6s Plus": { camera: "single", top: "home", body: "#c7a47d", body2: "#8b684b", edge: "#f0d7b8", screen: "#8b6a8e", accent: "#d7b18d", radius: 15, tall: 1.06 },
    "iPhone SE（第 1 代）": { camera: "single", top: "home", body: "#d5d5d7", body2: "#9a9ba0", edge: "#f5f5f5", screen: "#4d789d", accent: "#bcc4ce", radius: 11 },
    "iPhone 7": { camera: "single", top: "home", body: "#25262a", body2: "#050506", edge: "#72757d", screen: "#147da8", accent: "#4f5661", radius: 15 },
    "iPhone 7 Plus": { camera: "dual", top: "home", body: "#25262a", body2: "#050506", edge: "#72757d", screen: "#147da8", accent: "#4f5661", radius: 15, tall: 1.06 },
    "iPhone 8": { camera: "single", top: "home", body: "#d8c3a6", body2: "#9c7c5f", edge: "#f3e4d3", screen: "#bd9f78", accent: "#c9aa8a", radius: 15 },
    "iPhone 8 Plus": { camera: "dual", top: "home", body: "#d8c3a6", body2: "#9c7c5f", edge: "#f3e4d3", screen: "#bd9f78", accent: "#c9aa8a", radius: 15, tall: 1.06 },
    "iPhone X": { camera: "dual", top: "notch", body: "#d4d5d8", body2: "#8a8d94", edge: "#f5f5f7", screen: "#415f9b", accent: "#aab3c2", radius: 17 },
    "iPhone XR": { camera: "single", top: "notch", body: "#4b8bd0", body2: "#1d4e87", edge: "#8ebbec", screen: "#31568c", accent: "#77a9e2", radius: 17 },
    "iPhone XS": { camera: "dual", top: "notch", body: "#d3b487", body2: "#99784d", edge: "#f4dcb8", screen: "#6f567e", accent: "#d6bd94", radius: 17 },
    "iPhone XS Max": { camera: "dual", top: "notch", body: "#d3b487", body2: "#99784d", edge: "#f4dcb8", screen: "#6f567e", accent: "#d6bd94", radius: 17, tall: 1.07 },
    "iPhone 11": { camera: "dual-square", top: "notch", body: "#e9e4f3", body2: "#b8aed0", edge: "#f8f6ff", screen: "#6b57a5", accent: "#b7a9e3", radius: 18 },
    "iPhone 11 Pro": { camera: "triple-square", top: "notch", body: "#5c6760", body2: "#303a34", edge: "#9aa59d", screen: "#416a62", accent: "#82968b", radius: 18 },
    "iPhone 11 Pro Max": { camera: "triple-square", top: "notch", body: "#5c6760", body2: "#303a34", edge: "#9aa59d", screen: "#416a62", accent: "#82968b", radius: 18, tall: 1.07 },
    "iPhone SE（第 2 代）": { camera: "single", top: "home", body: "#1e1f24", body2: "#090a0d", edge: "#6f7178", screen: "#4a6e99", accent: "#6d747f", radius: 11 },
    "iPhone 12 mini": { camera: "dual-square", top: "notch", body: "#4f73c5", body2: "#263b76", edge: "#90afed", screen: "#3155a2", accent: "#7d9ce0", radius: 14, narrow: true },
    "iPhone 12": { camera: "dual-square", top: "notch", body: "#4f73c5", body2: "#263b76", edge: "#90afed", screen: "#3155a2", accent: "#7d9ce0", radius: 14 },
    "iPhone 12 Pro": { camera: "triple-square", top: "notch", body: "#6d7079", body2: "#34363d", edge: "#b1b4bc", screen: "#4a5160", accent: "#9196a1", radius: 14 },
    "iPhone 12 Pro Max": { camera: "triple-square", top: "notch", body: "#6d7079", body2: "#34363d", edge: "#b1b4bc", screen: "#4a5160", accent: "#9196a1", radius: 14, tall: 1.07 },
    "iPhone 13 mini": { camera: "dual-diagonal", top: "notch", body: "#f0a6bd", body2: "#b65d7b", edge: "#ffd0de", screen: "#a54872", accent: "#f2a7bd", radius: 14, narrow: true },
    "iPhone 13": { camera: "dual-diagonal", top: "notch", body: "#f0a6bd", body2: "#b65d7b", edge: "#ffd0de", screen: "#a54872", accent: "#f2a7bd", radius: 14 },
    "iPhone 13 Pro": { camera: "triple-square", top: "notch", body: "#8db7d4", body2: "#476f91", edge: "#c7e1f1", screen: "#486d92", accent: "#8fb8d6", radius: 14 },
    "iPhone 13 Pro Max": { camera: "triple-square", top: "notch", body: "#8db7d4", body2: "#476f91", edge: "#c7e1f1", screen: "#486d92", accent: "#8fb8d6", radius: 14, tall: 1.07 },
    "iPhone SE（第 3 代）": { camera: "single", top: "home", body: "#1f2024", body2: "#08090c", edge: "#72747b", screen: "#4b6e95", accent: "#6d747f", radius: 11 },
    "iPhone 14": { camera: "dual-diagonal", top: "notch", body: "#6f9dd4", body2: "#345e98", edge: "#a7c8ee", screen: "#365c90", accent: "#8aafe0", radius: 14 },
    "iPhone 14 Plus": { camera: "dual-diagonal", top: "notch", body: "#6f9dd4", body2: "#345e98", edge: "#a7c8ee", screen: "#365c90", accent: "#8aafe0", radius: 14, tall: 1.07 },
    "iPhone 14 Pro": { camera: "triple-square", top: "island", body: "#794982", body2: "#3e2046", edge: "#b78bc2", screen: "#713877", accent: "#a967b4", radius: 14 },
    "iPhone 14 Pro Max": { camera: "triple-square", top: "island", body: "#794982", body2: "#3e2046", edge: "#b78bc2", screen: "#713877", accent: "#a967b4", radius: 14, tall: 1.07 },
    "iPhone 15": { camera: "dual-diagonal", top: "island", body: "#9dc9dc", body2: "#5796b1", edge: "#cce9f3", screen: "#4e91ad", accent: "#acd5e3", radius: 14 },
    "iPhone 15 Plus": { camera: "dual-diagonal", top: "island", body: "#9dc9dc", body2: "#5796b1", edge: "#cce9f3", screen: "#4e91ad", accent: "#acd5e3", radius: 14, tall: 1.07 },
    "iPhone 15 Pro": { camera: "triple-square", top: "island", body: "#a59d92", body2: "#6c6258", edge: "#d8d0c6", screen: "#6e766f", accent: "#b8b0a5", radius: 14 },
    "iPhone 15 Pro Max": { camera: "triple-square", top: "island", body: "#a59d92", body2: "#6c6258", edge: "#d8d0c6", screen: "#6e766f", accent: "#b8b0a5", radius: 14, tall: 1.07 },
    "iPhone 16": { camera: "dual-vertical", top: "island", body: "#4a69b1", body2: "#1f3477", edge: "#8ba5e4", screen: "#3157a8", accent: "#7799e8", radius: 14 },
    "iPhone 16 Plus": { camera: "dual-vertical", top: "island", body: "#4a69b1", body2: "#1f3477", edge: "#8ba5e4", screen: "#3157a8", accent: "#7799e8", radius: 14, tall: 1.07 },
    "iPhone 16 Pro": { camera: "triple-square", top: "island", body: "#c7aa87", body2: "#8b6640", edge: "#e7d2b7", screen: "#8a6a53", accent: "#d7b994", radius: 14 },
    "iPhone 16 Pro Max": { camera: "triple-square", top: "island", body: "#c7aa87", body2: "#8b6640", edge: "#e7d2b7", screen: "#8a6a53", accent: "#d7b994", radius: 14, tall: 1.07 },
    "iPhone 16e": { camera: "single", top: "notch", body: "#eceef2", body2: "#a6adb8", edge: "#ffffff", screen: "#657083", accent: "#c1c7d0", radius: 14 },
    "iPhone 17": { camera: "dual-vertical", top: "island", body: "#9eb9ea", body2: "#5877bd", edge: "#d1e0ff", screen: "#5476c3", accent: "#9fc0ff", radius: 14 },
    "iPhone Air": { camera: "air", top: "island", body: "#bfe0f2", body2: "#72a8c5", edge: "#e6f6ff", screen: "#4f91b2", accent: "#a8d9ee", radius: 13, slim: true, bodyYear2026: "#e6c68e", body2Year2026: "#af8140" },
    "iPhone 17 Pro": { camera: "pro-plateau", top: "island", body: "#e27b45", body2: "#8d3e1d", edge: "#ffc09c", screen: "#a84a27", accent: "#f39a62", radius: 13 },
    "iPhone 17 Pro Max": { camera: "pro-plateau", top: "island", body: "#e27b45", body2: "#8d3e1d", edge: "#ffc09c", screen: "#a84a27", accent: "#f39a62", radius: 13, tall: 1.07 },
    "iPhone 17e": { camera: "single", top: "notch", body: "#f0b3cb", body2: "#b95783", edge: "#ffd8e6", screen: "#a54e78", accent: "#f2a8c5", radius: 14 },
    "iPhone 18 Pro": { camera: "pro-plateau", top: "island", body: "#7f2635", body2: "#3d0d17", edge: "#b75868", screen: "#6d1f2d", accent: "#a84254", radius: 13 },
    "iPhone 18 Pro Max": { camera: "pro-plateau", top: "island", body: "#7f2635", body2: "#3d0d17", edge: "#b75868", screen: "#6d1f2d", accent: "#a84254", radius: 13, tall: 1.07 },
    "iPhone Duo": { camera: "fold", top: "none", body: "#e9edf5", body2: "#8c96a8", edge: "#ffffff", screen: "#51678f", accent: "#b8c6de", radius: 15 }
  };

  function getDeviceSpec(name, year) {
    var spec = Object.assign({
      camera: "single", top: "home", body: "#80858e", body2: "#3f434a", edge: "#c4c8cf",
      screen: "#416a95", accent: "#8da5bc", radius: 14, narrow: false, slim: false, tall: 1
    }, DEVICE_SPECS[name] || {});

    if (name === "iPhone Air" && year === 2026) {
      spec.body = spec.bodyYear2026;
      spec.body2 = spec.body2Year2026;
      spec.edge = "#f4dfb9";
      spec.screen = "#b8863c";
      spec.accent = "#e4bd78";
    }
    if (/Pro Max|Plus|XS Max/.test(name)) spec.tall = Math.max(spec.tall, 1.07);
    if (/mini/.test(name)) spec.narrow = true;
    return spec;
  }

  function renderCamera(spec, id) {
    if (spec.camera === "fold") return "";
    var camera = "";
    if (spec.camera === "air") {
      camera = '<rect x="148" y="31" width="53" height="22" rx="11" fill="rgba(10,14,24,0.78)" stroke="rgba(255,255,255,0.2)"/><circle cx="161" cy="42" r="7.5" fill="url(#lens-' + id + ')"/><circle cx="161" cy="42" r="3" fill="#101827"/>';
    } else if (spec.camera === "pro-plateau") {
      camera = '<rect x="144" y="29" width="60" height="27" rx="14" fill="rgba(8,12,20,0.9)" stroke="rgba(255,255,255,0.18)"/>' +
        '<circle cx="155" cy="42" r="7" fill="url(#lens-' + id + ')"/><circle cx="170" cy="42" r="7" fill="url(#lens-' + id + ')"/><circle cx="185" cy="42" r="7" fill="url(#lens-' + id + ')"/><circle cx="195" cy="36" r="2.8" fill="#f8e4a5"/>';
    } else if (spec.camera === "triple-square") {
      camera = '<rect x="145" y="28" width="42" height="42" rx="12" fill="rgba(8,12,20,0.86)" stroke="rgba(255,255,255,0.15)"/>' +
        '<circle cx="156" cy="39" r="7" fill="url(#lens-' + id + ')"/><circle cx="176" cy="39" r="7" fill="url(#lens-' + id + ')"/><circle cx="166" cy="57" r="7" fill="url(#lens-' + id + ')"/><circle cx="181" cy="57" r="2.6" fill="#f8e4a5"/>';
    } else if (spec.camera === "dual-square" || spec.camera === "dual-diagonal" || spec.camera === "dual-vertical") {
      var firstX = spec.camera === "dual-diagonal" ? 153 : 156;
      var secondX = spec.camera === "dual-diagonal" ? 174 : 156;
      var firstY = spec.camera === "dual-diagonal" ? 38 : 39;
      var secondY = spec.camera === "dual-diagonal" ? 57 : 59;
      camera = '<rect x="145" y="28" width="42" height="42" rx="12" fill="rgba(8,12,20,0.86)" stroke="rgba(255,255,255,0.15)"/>' +
        '<circle cx="' + firstX + '" cy="' + firstY + '" r="7" fill="url(#lens-' + id + ')"/><circle cx="' + secondX + '" cy="' + secondY + '" r="7" fill="url(#lens-' + id + ')"/><circle cx="181" cy="57" r="2.5" fill="#f8e4a5"/>';
    } else if (spec.camera === "dual") {
      camera = '<rect x="151" y="30" width="27" height="42" rx="10" fill="rgba(8,12,20,0.86)" stroke="rgba(255,255,255,0.15)"/>' +
        '<circle cx="164.5" cy="43" r="7" fill="url(#lens-' + id + ')"/><circle cx="164.5" cy="60" r="7" fill="url(#lens-' + id + ')"/>';
    } else {
      camera = '<rect x="149" y="30" width="31" height="31" rx="10" fill="rgba(8,12,20,0.82)" stroke="rgba(255,255,255,0.15)"/><circle cx="164.5" cy="45.5" r="9" fill="url(#lens-' + id + ')"/>';
    }
    return camera;
  }

  function renderFoldable(spec, id) {
    return '<g transform="translate(34 13)">' +
      '<rect x="0" y="0" width="162" height="202" rx="17" fill="url(#body-' + id + ')" stroke="' + spec.edge + '" stroke-width="1.4"/>' +
      '<rect x="78" y="4" width="6" height="194" rx="3" fill="rgba(2,5,10,0.55)"/>' +
      '<rect x="8" y="8" width="66" height="186" rx="9" fill="url(#screen-' + id + ')"/>' +
      '<rect x="82" y="8" width="72" height="186" rx="9" fill="url(#screen-' + id + ')"/>' +
      '<circle cx="41" cy="63" r="22" fill="rgba(255,255,255,0.13)"/><circle cx="119" cy="124" r="31" fill="rgba(255,255,255,0.09)"/>' +
      '<rect x="92" y="18" width="29" height="7" rx="3.5" fill="rgba(5,9,16,0.72)"/>' +
      '<circle cx="156" cy="31" r="4" fill="#1a2230" stroke="rgba(255,255,255,0.26)"/>' +
      '<path d="M14 58 C 35 39 62 38 74 52" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M90 138 C 114 119 139 121 154 137" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-linecap="round"/>' +
      '</g>';
  }

  function renderDeviceSvg(record) {
    var spec = getDeviceSpec(record.name, record.year);
    var id = slug(record.id + "-device");
    var width = spec.narrow ? 70 : 78;
    var height = 202 * (spec.tall || 1) * (spec.slim ? 0.96 : 1);
    var xFront = 28;
    var xBack = 134;
    var y = 16;
    var frontTop = spec.top;
    var screenGradient = 'screen-' + id;
    var bodyGradient = 'body-' + id;
    var lensGradient = 'lens-' + id;

    var frontTopMarkup = "";
    if (frontTop === "home") {
      frontTopMarkup = '<circle cx="' + (xFront + width / 2) + '" cy="' + (y + height - 18) + '" r="6.5" fill="none" stroke="rgba(255,255,255,0.66)" stroke-width="1.3"/><rect x="' + (xFront + width / 2 - 3) + '" y="' + (y + height - 20.5) + '" width="6" height="6" rx="1.5" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="0.8"/>';
    } else if (frontTop === "notch") {
      frontTopMarkup = '<rect x="' + (xFront + width / 2 - 15) + '" y="' + (y + 5) + '" width="30" height="7" rx="3.5" fill="rgba(5,8,14,0.9)"/>';
    } else if (frontTop === "island") {
      frontTopMarkup = '<rect x="' + (xFront + width / 2 - 11) + '" y="' + (y + 5) + '" width="22" height="6.5" rx="3.25" fill="rgba(5,8,14,0.88)"/><circle cx="' + (xFront + width / 2 + 8) + '" cy="' + (y + 8.2) + '" r="1.5" fill="#4a7fd4"/>';
    }

    var screenHeight = frontTop === "home" ? height - 49 : height - 10;
    var screenY = y + (frontTop === "home" ? 5 : 5);
    var screenInset = 5;
    var bodyFill = 'url(#' + bodyGradient + ')';

    return '<svg class="device-svg" viewBox="0 0 240 240" role="img" aria-label="' + escapeHtml(record.name + ' 外觀示意圖') + '">' +
      '<defs>' +
      '<linearGradient id="' + bodyGradient + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + spec.edge + '"/><stop offset="0.25" stop-color="' + spec.body + '"/><stop offset="1" stop-color="' + spec.body2 + '"/></linearGradient>' +
      '<linearGradient id="' + screenGradient + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + spec.accent + '"/><stop offset="1" stop-color="' + spec.screen + '"/></linearGradient>' +
      '<radialGradient id="' + lensGradient + '"><stop offset="0" stop-color="#8bdcff"/><stop offset="0.32" stop-color="#244b80"/><stop offset="1" stop-color="#050812"/></radialGradient>' +
      '</defs>' +
      '<ellipse cx="120" cy="225" rx="83" ry="8" fill="rgba(0,0,0,0.2)"/>' +
      (spec.camera === "fold" ? renderFoldable(spec, id) :
        '<g>' +
          '<rect x="' + xFront + '" y="' + y + '" width="' + width + '" height="' + height + '" rx="' + spec.radius + '" fill="' + bodyFill + '" stroke="' + spec.edge + '" stroke-width="1.4"/>' +
          '<rect x="' + (xFront + screenInset) + '" y="' + screenY + '" width="' + (width - screenInset * 2) + '" height="' + (height - 10) + '" rx="' + Math.max(6, spec.radius - 4) + '" fill="url(#' + screenGradient + ')" stroke="rgba(255,255,255,0.23)" stroke-width="0.8"/>' +
          '<circle cx="' + (xFront + 19) + '" cy="' + (y + 56) + '" r="18" fill="rgba(255,255,255,0.11)"/><circle cx="' + (xFront + width - 20) + '" cy="' + (y + 122) + '" r="24" fill="rgba(255,255,255,0.08)"/>' +
          '<path d="M' + (xFront + 10) + ' ' + (y + 78) + ' C' + (xFront + 32) + ' ' + (y + 56) + ' ' + (xFront + 48) + ' ' + (y + 63) + ' ' + (xFront + 61) + ' ' + (y + 88) + '" fill="none" stroke="rgba(255,255,255,0.42)" stroke-width="2.2" stroke-linecap="round"/>' +
          frontTopMarkup +
          '<rect x="' + (xFront - 2) + '" y="' + (y + 50) + '" width="2" height="21" rx="1" fill="' + spec.edge + '"/><rect x="' + (xFront - 2) + '" y="' + (y + 82) + '" width="2" height="30" rx="1" fill="' + spec.edge + '"/>' +
        '</g>' +
        '<g>' +
          '<rect x="' + xBack + '" y="' + y + '" width="' + width + '" height="' + height + '" rx="' + spec.radius + '" fill="' + bodyFill + '" stroke="' + spec.edge + '" stroke-width="1.4"/>' +
          '<rect x="' + (xBack + 9) + '" y="' + (y + 14) + '" width="' + (width - 18) + '" height="' + (height - 28) + '" rx="' + Math.max(7, spec.radius - 4) + '" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.08)"/>' +
          '<path d="M' + (xBack + 15) + ' ' + (y + 102) + ' C' + (xBack + 25) + ' ' + (y + 70) + ' ' + (xBack + 55) + ' ' + (y + 52) + ' ' + (xBack + 66) + ' ' + (y + 28) + '" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.2" stroke-linecap="round"/>' +
          renderCamera(spec, id) +
          '<circle cx="' + (xBack + width / 2) + '" cy="' + (y + height * 0.57) + '" r="8" fill="rgba(255,255,255,0.12)"/>' +
        '</g>'
      ) +
      '</svg>';
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
      var accent = getDeviceSpec(item.name, item.year).accent;
      return '<article class="iphone-card' + (selected ? " is-selected" : "") + '" data-id="' + item.id + '" tabindex="0" style="--card-accent:' + accent + '66">' +
        '<div class="card-topline"><span class="card-year">' + item.year + '</span><span class="card-price">' + usd(item.usd) + '</span></div>' +
        '<div class="device-visual">' + renderDeviceSvg(item) + '</div>' +
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
    var spec = getDeviceSpec(item.name, item.year);

    content.innerHTML =
      '<div class="modal-hero">' +
        '<div class="modal-device">' + renderDeviceSvg(item) + '</div>' +
        '<div><span class="modal-kicker">' + item.year + ' · LAUNCH PRICE</span>' +
        '<h2 id="modal-title">' + escapeHtml(item.name) + '</h2>' +
        '<div class="modal-price">' + usd(item.usd) + '</div>' +
        '<div class="modal-cny">' + cny(item.cny) + ' · ' + item.gb + 'GB 起</div>' +
        '<p class="modal-note">' + escapeHtml(item.note) + '</p>' +
        '<div class="modal-facts">' +
          '<div class="fact"><small>美國首發</small><strong>' + usd(item.usd) + '</strong></div>' +
          '<div class="fact"><small>中國大陸首發</small><strong>' + cny(item.cny) + '</strong></div>' +
          '<div class="fact"><small>起始容量</small><strong>' + item.gb + 'GB</strong></div>' +
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