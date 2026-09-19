// ============================================================
//  app.js — 讀取 data.js 的資料並渲染網頁
//  一般情形下不需要修改本檔；若要調整版面或動畫才動這裡。
// ============================================================

(function () {
  "use strict";

  var DATA = window.IPHONE_DATA || [];
  var SITE = window.SITE || {};
  var MILESTONES = window.MILESTONES || [];
  var ADVICE = window.ADVICE || [];

  function byId(id) { return document.getElementById(id); }
  function usd(n) { return "$" + n.toLocaleString("en-US"); }
  function cny(n) { return n.toLocaleString("zh-TW") + " 元"; }

  function setText(id, text) {
    var node = byId(id);
    if (node) node.textContent = text;
  }

  // 頁首與統計資訊
  function renderMeta() {
    document.title = (SITE.title || "iPhone 價格記錄");
    setText("site-title", SITE.title || "");
    setText("site-subtitle", SITE.subtitle || "");
    setText("site-updated", "更新日期：" + (SITE.updated || ""));

    if (!DATA.length) return;
    var years = DATA.map(function (d) { return d.year; });
    var values = DATA.map(function (d) { return d.cheapestUsd; });
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var first = DATA[0];
    var last = DATA[DATA.length - 1];

    setText("stat-span", years[0] + "–" + years[years.length - 1]);
    setText("stat-lowest", usd(min));
    setText("stat-highest", usd(max));
    setText("stat-now", usd(last.cheapestUsd));
  }

  // 價格表格
  function renderTable() {
    var tbody = byId("price-tbody");
    if (!tbody || !DATA.length) return;

    var html = "";
    DATA.forEach(function (d) {
      var modelsHtml = d.models.map(function (m) {
        return '<div class="model-row">' +
          '<span class="model-name">' + escapeHtml(m.name) + '</span>' +
          '<span class="model-price">' + usd(m.usd) + ' / ' + cny(m.cny) + '</span>' +
          '<span class="model-gb">' + m.gb + 'GB</span>' +
          '</div>';
      }).join("");

      html += '<tr>' +
        '<td class="td-year">' + d.year + '</td>' +
        '<td class="td-models">' + modelsHtml + '</td>' +
        '<td class="td-cheapest"><span class="badge">' + usd(d.cheapestUsd) + '</span></td>' +
        '<td class="td-note">' + escapeHtml(d.note || "") + '</td>' +
        '</tr>';
    });
    tbody.innerHTML = html;
  }

  // 價格走勢圖（SVG）
  function renderChart() {
    var box = byId("trend-chart");
    if (!box || DATA.length < 2) return;

    var W = 960, H = 360;
    var padL = 58, padR = 28, padT = 40, padB = 46;
    var values = DATA.map(function (d) { return d.cheapestUsd; });
    var years = DATA.map(function (d) { return d.year; });

    var rawMin = Math.min.apply(null, values);
    var rawMax = Math.max.apply(null, values);
    var yMin = Math.floor((rawMin - 40) / 100) * 100;
    var yMax = Math.ceil((rawMax + 40) / 100) * 100;

    var innerW = W - padL - padR;
    var innerH = H - padT - padB;

    function x(i) { return padL + (innerW * i) / (values.length - 1); }
    function y(v) { return padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH; }

    var pts = values.map(function (v, i) { return { x: x(i), y: y(v), v: v, year: years[i] }; });

    var line = pts.map(function (p, i) {
      return (i === 0 ? "M" : "L") + p.x.toFixed(1) + " " + p.y.toFixed(1);
    }).join(" ");

    var area = line +
      " L" + pts[pts.length - 1].x.toFixed(1) + " " + (padT + innerH).toFixed(1) +
      " L" + pts[0].x.toFixed(1) + " " + (padT + innerH).toFixed(1) + " Z";

    // 網格與 Y 軸刻度
    var gridHtml = "";
    var tick = yMin;
    while (tick <= yMax) {
      var ty = y(tick);
      gridHtml += '<line class="grid" x1="' + padL + '" y1="' + ty.toFixed(1) +
        '" x2="' + (W - padR) + '" y2="' + ty.toFixed(1) + '"/>' +
        '<text class="axis" x="' + (padL - 10) + '" y="' + (ty + 4).toFixed(1) + '" text-anchor="end">' +
        "$" + tick + '</text>';
      tick += 100;
    }

    var dotsHtml = pts.map(function (p) {
      return '<circle class="dot" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="5">' +
        '<title>' + p.year + ' 年最便宜新款：' + usd(p.v) + '</title></circle>';
    }).join("");

    var valHtml = pts.map(function (p) {
      return '<text class="val" x="' + p.x.toFixed(1) + '" y="' + (p.y - 12).toFixed(1) + '" text-anchor="middle">' +
        usd(p.v) + '</text>';
    }).join("");

    var yearHtml = pts.map(function (p) {
      return '<text class="year" x="' + p.x.toFixed(1) + '" y="' + (padT + innerH + 28).toFixed(1) + '" text-anchor="middle">' +
        p.year + '</text>';
    }).join("");

    box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="歷年起售價格走勢">' +
      '<defs>' +
      '<linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#0a84ff" stop-opacity="0.35"/>' +
      '<stop offset="100%" stop-color="#0a84ff" stop-opacity="0.02"/>' +
      '</linearGradient>' +
      '</defs>' +
      gridHtml +
      '<path class="area" d="' + area + '"/>' +
      '<path class="line" d="' + line + '"/>' +
      dotsHtml +
      valHtml +
      yearHtml +
      '</svg>';
  }

  // 重要節點
  function renderMilestones() {
    var wrap = byId("milestone-list");
    if (!wrap) return;
    var html = MILESTONES.map(function (m) {
      return '<li class="milestone">' +
        '<span class="ms-year">' + escapeHtml(m.year) + '</span>' +
        '<div class="ms-body">' +
        '<h3>' + escapeHtml(m.title) + '</h3>' +
        '<p>' + escapeHtml(m.text) + '</p>' +
        '</div></li>';
    }).join("");
    wrap.innerHTML = html;
  }

  // 選購建議
  function renderAdvice() {
    var wrap = byId("advice-grid");
    if (!wrap) return;
    var html = ADVICE.map(function (a) {
      return '<article class="advice-card">' +
        '<div class="advice-icon">' + escapeHtml(a.icon) + '</div>' +
        '<h3>' + escapeHtml(a.title) + '</h3>' +
        '<p>' + escapeHtml(a.text) + '</p>' +
        '</article>';
    }).join("");
    wrap.innerHTML = html;
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function init() {
    renderMeta();
    renderTable();
    renderChart();
    renderMilestones();
    renderAdvice();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
