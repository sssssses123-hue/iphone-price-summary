// ============================================================
//  iPhone 歷年起售價格資料檔（2013–2026）
//  ------------------------------------------------------------
//  這是整站唯一需要編輯的資料檔：
//  新增年份、修改價格、更新說明，都在這裡完成，
//  重新整理網頁即自動更新，無需改其他檔案。
//
//  欄位說明：
//    year         西元年份
//    models       該年發表的機型（陣列）
//      name       機型名稱
//      usd        美國官網首發起售價（美元，數字）
//      cny        中國大陸官網起售價（人民幣，數字）
//      gb         起售容量（GB，數字）
//    cheapestUsd  該年「最便宜新款」的美元起售價（畫走勢圖用）
//    note         該年重點或里程碑說明
// ============================================================

window.SITE = {
  title: "iPhone Price Archive · 2013–2026",
  subtitle: "從 iPhone 5s 到摺疊 iPhone Duo，收藏每年首發價格、代表機型與產品設計的關鍵轉折。",
  heroTitle: "每一代 iPhone，｜價格與設計的進化史",
  updated: "2026-09-20"
};

window.IPHONE_DATA = [
  {
    year: 2013,
    models: [
      { name: "iPhone 5c", usd: 549, cny: 4488, gb: 16 },
      { name: "iPhone 5s", usd: 649, cny: 5288, gb: 16 }
    ],
    cheapestUsd: 549,
    note: "iPhone 5s 首搭 Touch ID 指紋辨識與 64 位元 A7 晶片；5c 為多彩聚碳酸酯機身的入門款。"
  },
  {
    year: 2014,
    models: [
      { name: "iPhone 6", usd: 649, cny: 5288, gb: 16 },
      { name: "iPhone 6 Plus", usd: 749, cny: 6088, gb: 16 }
    ],
    cheapestUsd: 649,
    note: "螢幕加大至 4.7 吋與 5.5 吋，正式進入大螢幕時代。"
  },
  {
    year: 2015,
    models: [
      { name: "iPhone 6s", usd: 649, cny: 5288, gb: 16 },
      { name: "iPhone 6s Plus", usd: 749, cny: 6088, gb: 16 }
    ],
    cheapestUsd: 649,
    note: "加入 3D Touch 壓力感應與 1200 萬畫素相機。"
  },
  {
    year: 2016,
    models: [
      { name: "iPhone SE（第 1 代）", usd: 399, cny: 3288, gb: 16 },
      { name: "iPhone 7", usd: 649, cny: 5388, gb: 32 },
      { name: "iPhone 7 Plus", usd: 769, cny: 6388, gb: 32 }
    ],
    cheapestUsd: 399,
    note: "iPhone SE 回歸 4 吋小螢幕；iPhone 7 取消 3.5mm 耳機孔並加入防水。"
  },
  {
    year: 2017,
    models: [
      { name: "iPhone 8", usd: 699, cny: 5888, gb: 64 },
      { name: "iPhone 8 Plus", usd: 799, cny: 6688, gb: 64 },
      { name: "iPhone X", usd: 999, cny: 8388, gb: 64 }
    ],
    cheapestUsd: 699,
    note: "十週年 iPhone X 採用全螢幕與 Face ID，旗艦首度突破 999 美元。"
  },
  {
    year: 2018,
    models: [
      { name: "iPhone XR", usd: 749, cny: 6499, gb: 64 },
      { name: "iPhone XS", usd: 999, cny: 8699, gb: 64 },
      { name: "iPhone XS Max", usd: 1099, cny: 9599, gb: 64 }
    ],
    cheapestUsd: 749,
    note: "iPhone XR 以 LCD 全螢幕與多彩配色，成為較親民的選擇。"
  },
  {
    year: 2019,
    models: [
      { name: "iPhone 11", usd: 699, cny: 5499, gb: 64 },
      { name: "iPhone 11 Pro", usd: 999, cny: 8699, gb: 64 },
      { name: "iPhone 11 Pro Max", usd: 1099, cny: 9599, gb: 64 }
    ],
    cheapestUsd: 699,
    note: "iPhone 11 起售價較 XR 調降 50 美元，並加入雙鏡頭與夜間模式。"
  },
  {
    year: 2020,
    models: [
      { name: "iPhone SE（第 2 代）", usd: 399, cny: 3299, gb: 64 },
      { name: "iPhone 12 mini", usd: 699, cny: 5499, gb: 64 },
      { name: "iPhone 12", usd: 799, cny: 6299, gb: 64 },
      { name: "iPhone 12 Pro", usd: 999, cny: 8499, gb: 128 },
      { name: "iPhone 12 Pro Max", usd: 1099, cny: 9299, gb: 128 }
    ],
    cheapestUsd: 399,
    note: "全系支援 5G、回歸方正邊框，並導入 MagSafe 磁吸配件。"
  },
  {
    year: 2021,
    models: [
      { name: "iPhone 13 mini", usd: 699, cny: 5199, gb: 128 },
      { name: "iPhone 13", usd: 799, cny: 5999, gb: 128 },
      { name: "iPhone 13 Pro", usd: 999, cny: 7999, gb: 128 },
      { name: "iPhone 13 Pro Max", usd: 1099, cny: 8999, gb: 128 }
    ],
    cheapestUsd: 699,
    note: "mini 與標準版起售容量提升至 128GB，售價與前代相同（等於變相降價）。"
  },
  {
    year: 2022,
    models: [
      { name: "iPhone SE（第 3 代）", usd: 429, cny: 3499, gb: 64 },
      { name: "iPhone 14", usd: 799, cny: 5999, gb: 128 },
      { name: "iPhone 14 Plus", usd: 899, cny: 6999, gb: 128 },
      { name: "iPhone 14 Pro", usd: 999, cny: 7999, gb: 128 },
      { name: "iPhone 14 Pro Max", usd: 1099, cny: 8999, gb: 128 }
    ],
    cheapestUsd: 429,
    note: "標準款沿用 A15 晶片；Pro 系列才有「動態島」與 A16。"
  },
  {
    year: 2023,
    models: [
      { name: "iPhone 15", usd: 799, cny: 5999, gb: 128 },
      { name: "iPhone 15 Plus", usd: 899, cny: 6999, gb: 128 },
      { name: "iPhone 15 Pro", usd: 999, cny: 7999, gb: 128 },
      { name: "iPhone 15 Pro Max", usd: 1199, cny: 9999, gb: 256 }
    ],
    cheapestUsd: 799,
    note: "全系改採 USB-C，動態島下放至標準款。"
  },
  {
    year: 2024,
    models: [
      { name: "iPhone 16", usd: 799, cny: 5999, gb: 128 },
      { name: "iPhone 16 Plus", usd: 899, cny: 6999, gb: 128 },
      { name: "iPhone 16 Pro", usd: 999, cny: 7999, gb: 128 },
      { name: "iPhone 16 Pro Max", usd: 1199, cny: 9999, gb: 256 }
    ],
    cheapestUsd: 799,
    note: "加入「相機控制」按鈕與 A18 晶片，強調 Apple Intelligence。"
  },
  {
    year: 2025,
    models: [
      { name: "iPhone 16e", usd: 599, cny: 4499, gb: 128 },
      { name: "iPhone 17", usd: 799, cny: 5999, gb: 256 },
      { name: "iPhone Air", usd: 999, cny: 7999, gb: 256 },
      { name: "iPhone 17 Pro", usd: 1099, cny: 8999, gb: 256 },
      { name: "iPhone 17 Pro Max", usd: 1199, cny: 9999, gb: 256 }
    ],
    cheapestUsd: 599,
    note: "推出首款超薄 iPhone Air；標準款容量升級至 256GB 但售價不變。"
  },
  {
    year: 2026,
    models: [
      { name: "iPhone 17e", usd: 699, cny: 5299, gb: 256 },
      { name: "iPhone Air", usd: 1099, cny: 8799, gb: 256 },
      { name: "iPhone 18 Pro", usd: 1199, cny: 9999, gb: 256 },
      { name: "iPhone 18 Pro Max", usd: 1299, cny: 10999, gb: 256 },
      { name: "iPhone Duo", usd: 1999, cny: 15999, gb: 256 }
    ],
    cheapestUsd: 699,
    note: "推出首款摺疊 iPhone Duo（1999 美元起）；iPhone 18 僅保留 Pro 系列，17e、Air 與 Pro 起售價均較前代上調。"
  }
];

// 重要節點（時間軸）
window.MILESTONES = [
  { year: "2013", title: "指紋辨識 × 64 位元", text: "iPhone 5s 首搭 Touch ID 與 A7 晶片，奠定安全與效能雙主軸。" },
  { year: "2014", title: "大螢幕時代", text: "iPhone 6 / 6 Plus 將螢幕拉大到 4.7 吋與 5.5 吋。" },
  { year: "2016", title: "小尺寸回歸", text: "iPhone SE 以 399 美元重現經典 4 吋設計，開拓平價路線。" },
  { year: "2017", title: "旗艦破千", text: "iPhone X 全螢幕 + Face ID，起售價首度來到 999 美元。" },
  { year: "2020", title: "5G 與方正邊框", text: "iPhone 12 系列支援 5G、導入 MagSafe 磁吸配件。" },
  { year: "2022", title: "晶片分層", text: "Pro 與標準款規格差距拉大，選購需更留意定位。" },
  { year: "2023", title: "全系 USB-C", text: "告別 Lightning，充電與傳輸更通用。" },
  { year: "2025", title: "更薄、更親民", text: "iPhone Air 登場；16e 開啟 599 美元親民價格線。" },
  { year: "2026", title: "摺疊機元年", text: "iPhone Duo 以 1999 美元起售登場；18 Pro 系列維持高階定位，產品線分層更明顯。" }
];

// 選購建議
window.ADVICE = [
  { icon: "💰", title: "預算優先", text: "iPhone 17e／16e（699／599 美元、5299／4499 元起）具備最新 A 系列晶片與 Apple Intelligence，是預算有限者的首選。" },
  { icon: "⚖️", title: "均衡之選", text: "iPhone 17（799 美元、約 5999 元起）容量已升級至 256GB，價格不變，一般用戶最划算。" },
  { icon: "🪶", title: "輕薄設計", text: "iPhone Air 主打超薄機身與便攜性；2026 年式起售價為 1099 美元、8799 元起。" },
  { icon: "📷", title: "影像／效能", text: "iPhone 18 Pro／Pro Max 或 iPhone 17 Pro 配備 Pro 相機系統與 ProMotion，適合攝影、遊戲與重度使用者。" },
  { icon: "📖", title: "摺疊大螢幕", text: "iPhone Duo（1999 美元、15999 元起）是首款摺疊 iPhone，適合追求大螢幕與新型態體驗者。" },
  { icon: "📱", title: "小手機／經典", text: "偏好一手掌握的用戶可考慮舊款 13 mini 或 SE 系列；收藏取向則可留意歷代經典機。" },
  { icon: "🛒", title: "入手時機", text: "新機發表後舊款通常會降價；搭配教育優惠、節日促銷與以舊換新，通常能再省一筆。" },
  { icon: "💾", title: "容量提醒", text: "近年標準款容量逐步上調（128→256GB），同價位下優先挑容量較大的版本更耐用。" }
];
