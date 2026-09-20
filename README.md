# iPhone Launch Price History (2013–2026)

🌐 **Live site:** https://sssssses123-hue.github.io/iphone-price-summary/

A static website for Apple fans that records the launch starting price of each iPhone from **2013 to 2026**, together with a price-trend chart, key milestones and buying advice.

## Features

- Year-by-year launch prices (US$ MSRP + China mainland CNY reference)
- "Cheapest new iPhone each year" trend chart (SVG, generated in the browser)
- Key milestone timeline
- Buying advice for different needs and budgets
- Hand-crafted inline SVG illustration; no external image assets
- Data / presentation separation: edit one data file to update the whole site
- Automated checks against Apple's official US and China store pages

## Automated Apple price monitoring

The repository includes:

- `.github/workflows/apple-price-watch.yml` runs daily at **02:23 UTC / 10:23 Asia–Shanghai** and can also be started manually from the Actions tab.
- `scripts/check-apple-prices.mjs` reads the official Apple US and China `Buy iPhone` pages, plus each product page, and compares price, starting capacity, lineup and launch labels with the stored baseline.

When a **new model** is found with an official US price, China price and starting capacity, the workflow appends it to `data.js`, commits the verified data and lets GitHub Pages publish the update.

When an **existing model** changes price, capacity or lineup status, the workflow commits the monitoring state and opens a GitHub Issue. Historical launch prices are deliberately not overwritten by later retail prices or promotions.

The monitoring state is stored in `monitor/apple-price-state.json`; the latest notified change is written to `monitor/latest-report.md`.

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | Page structure and hero illustration |
| `styles.css` | Colors, fonts and layout |
| `data.js` | **All prices, text, milestones and advice (edit this)** |
| `app.js` | Reads `data.js` and renders the table, chart and cards |
| `scripts/check-apple-prices.mjs` | Official Apple page monitor and update writer |
| `monitor/apple-price-state.json` | Baseline used to detect meaningful changes |
| `.github/workflows/apple-price-watch.yml` | Daily GitHub Actions schedule and notification |
| `編輯說明.md` | Editing and maintenance guide (Traditional Chinese) |

## How to Preview

Double-click `index.html`, or open it in any browser. No server or build step is required.

To test the monitor without network access:

```powershell
node scripts/check-apple-prices.mjs --samples-dir "path\to\saved-apple-html" --dry-run
```

## How to Edit Content

1. Open `data.js` in any text editor (keep the file encoded as UTF-8).
2. To change a price, edit the `usd` / `cny` / `gb` fields.
3. To add a year, append a new object to `window.IPHONE_DATA`.
4. To change milestones or buying advice, edit `window.MILESTONES` / `window.ADVICE`.
5. Save and refresh the browser.

See `編輯說明.md` for the complete Traditional Chinese guide.

## How to Deploy

This is a static site, so any static hosting service works:

- **GitHub Pages**: upload the files to a repository, then enable Pages (`Settings → Pages → Deploy from a branch → main → /(root)`).
- **Netlify Drop**: drag the `iphone-price-site` folder to <https://app.netlify.com/drop>.

## Data Notes

Launch prices are compiled from official Apple product and store pages. The 2026 update includes the official starting prices for iPhone 17e, iPhone Air, iPhone 18 Pro, iPhone 18 Pro Max and the first foldable iPhone Duo. Apple prices and regional availability can change; the automation keeps the historical record separate from current retail pricing.

## License

Free to use for personal reference.

---

# iPhone 歷年起售價格全記錄（2013–2026）

🌐 **線上網站：** https://sssssses123-hue.github.io/iphone-price-summary/

給果粉的純靜態網站，記錄 **2013–2026** 每一年 iPhone 的首發起售價，並附價格走勢圖、重要節點與選購建議。

## 功能特色

- 逐年起售價格（美國首發價 + 中國大陸人民幣參考價）
- 「每年最便宜新款」價格走勢圖（瀏覽器自動產生 SVG）
- 重要節點時間軸
- 依需求與預算的選購建議
- 內建 SVG 插圖，不依賴外部圖片
- 資料與版面分離：改一個資料檔即可更新全站
- 每日自動檢查 Apple 美國與中國大陸官方商店頁面

## Apple 價格自動監測

- `.github/workflows/apple-price-watch.yml` 每天 **UTC 02:23／北京時間 10:23** 執行，也可在 GitHub Actions 頁面手動啟動。
- `scripts/check-apple-prices.mjs` 會讀取 Apple 官方美、中 `Buy iPhone` 頁面及各機型購買頁，比對價格、起始容量、陣容與新機標籤。
- 發現**新機型**且美、中價格與起始容量都可從官方頁面確認時，會自動寫入 `data.js`、提交到 GitHub，GitHub Pages 隨後發布新版本。
- 既有機型若價格、容量或陣容狀態改變，會提交監測狀態並開啟 GitHub Issue 通知；**不會用後來零售價或促銷價改寫歷史首發價**。
- 基準資料位於 `monitor/apple-price-state.json`，最近一次通知內容位於 `monitor/latest-report.md`。

## 檔案結構

| 檔案 | 用途 |
|------|------|
| `index.html` | 頁面結構與首頁插圖 |
| `styles.css` | 配色、字體與版面 |
| `data.js` | **所有價格、文字、節點與選購建議（改這個）** |
| `app.js` | 讀取 `data.js`，渲染表格、走勢圖與卡片 |
| `scripts/check-apple-prices.mjs` | Apple 官方頁面監測與自動更新程式 |
| `monitor/apple-price-state.json` | 判斷實質變動的基準資料 |
| `.github/workflows/apple-price-watch.yml` | 每日排程與 GitHub Issue 通知 |
| `編輯說明.md` | 編輯與維護教學（繁體中文） |

## 如何預覽

直接雙擊 `index.html`，或用任何瀏覽器開啟。不需要伺服器或建置步驟。

如要在沒有網路時測試監測程式：

```powershell
node scripts/check-apple-prices.mjs --samples-dir "已儲存的 Apple HTML 資料夾" --dry-run
```

## 如何編輯內容

1. 用文字編輯器開啟 `data.js`（保持 UTF-8 編碼）。
2. 改價格：修改 `usd`、`cny`、`gb` 欄位。
3. 新增年份：在 `window.IPHONE_DATA` 陣列加入一筆物件。
4. 改節點或建議：修改 `window.MILESTONES`、`window.ADVICE`。
5. 存檔後重新整理瀏覽器。

詳細教學請見 `編輯說明.md`。

## 如何部署

這是純靜態網站，任何靜態託管服務都可用：

- **GitHub Pages**：把檔案上傳到倉庫，再到 `Settings → Pages` 選擇 `Deploy from a branch → main → /(root)`。
- **Netlify Drop**：把 `iphone-price-site` 資料夾拖到 <https://app.netlify.com/drop>。

## 資料說明

首發價整理自 Apple 官方產品與商店頁面。2026 年資料已按官方頁面更新 iPhone 17e、iPhone Air、iPhone 18 Pro、iPhone 18 Pro Max 與首款摺疊機 iPhone Duo 的起售資訊。Apple 價格與地區供應可能變動；自動化會將「歷史首發價」和「目前售價」分開處理。

## 授權

個人參考可自由使用。