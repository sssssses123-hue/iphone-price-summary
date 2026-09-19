# iPhone Launch Price History (2013–2026)

A simple, static website for Apple fans that records the launch starting price of every iPhone from **2013 to 2026**, together with a price-trend chart, key milestones and buying advice. All content lives in a single data file, so the whole site can be updated without touching any other code.

## Features

- Year-by-year launch prices (US$ MSRP + China CNY reference)
- "Cheapest new iPhone each year" trend chart (SVG, auto-generated)
- Key milestones timeline
- Buying advice for different needs and budgets
- Hand-crafted inline SVG illustration (no external assets, works offline)
- Data / presentation separation: edit one file to update the whole site

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | Page structure and hero illustration |
| `styles.css` | Colors, fonts and layout |
| `data.js` | **All prices, text, milestones and advice (edit this)** |
| `app.js` | Reads `data.js` and renders the table, chart and cards |
| `編輯說明.md` | Editing guide (Traditional Chinese) |

## How to Preview

Double-click `index.html`, or open it in any browser. No server or build step is required.

## How to Edit Content

1. Open `data.js` in any text editor (keep the file encoded as UTF-8).
2. To change a price, edit the `usd` / `cny` / `gb` fields.
3. To add a year, append a new object to `window.IPHONE_DATA`.
4. To change milestones or buying advice, edit `window.MILESTONES` / `window.ADVICE`.
5. Save and refresh the browser.

See `編輯說明.md` for a detailed guide (in Traditional Chinese).

## How to Deploy

This is a static site, so any static hosting service works:

- **GitHub Pages**: upload the files to a repository, then enable Pages (`Settings → Pages → Deploy from a branch → main → /(root)`).
- **Netlify Drop**: drag the `iphone-price-site` folder to <https://app.netlify.com/drop>.

## License

Free to use for personal reference. Price data is compiled from public sources and may change as Apple updates its lineup.

---

# iPhone 歷年起售價格全記錄（2013–2026）

給果粉的純靜態網站，記錄 **2013–2026** 每一年 iPhone 的起售價格，並附價格走勢圖、重要節點與選購建議。所有內容集中在單一資料檔，只需改一個檔案即可更新全站，不用碰其他程式碼。

## 功能特色

- 逐年起售價格（美元全款價 + 中國大陸人民幣參考價）
- 「每年最便宜新款」價格走勢圖（SVG 自動產生）
- 重要節點時間軸
- 依需求與預算的選購建議
- 內建 SVG 插圖，無外部資源、可離線開啟
- 資料與版面分離：改一個檔案即可更新全站

## 檔案結構

| 檔案 | 用途 |
|------|------|
| `index.html` | 頁面結構與首頁插圖 |
| `styles.css` | 配色、字體與版面 |
| `data.js` | **所有價格、文字、節點與選購建議（改這個）** |
| `app.js` | 讀取 `data.js`，渲染表格、走勢圖與卡片 |
| `編輯說明.md` | 編輯教學（繁體中文） |

## 如何預覽

直接雙擊 `index.html`，或用任何瀏覽器開啟。不需要伺服器或建置步驟。

## 如何編輯內容

1. 用文字編輯器開啟 `data.js`（保持檔案為 UTF-8 編碼）。
2. 改價格：修改 `usd`／`cny`／`gb` 欄位。
3. 新增年份：在 `window.IPHONE_DATA` 陣列最後加一筆物件。
4. 改節點／建議：修改 `window.MILESTONES` 或 `window.ADVICE`。
5. 存檔後重新整理瀏覽器。

詳細教學請見 `編輯說明.md`。

## 如何部署

這是純靜態網站，任何靜態託管服務都可用：

- **GitHub Pages**：把檔案上傳到倉庫，再到 `Settings → Pages` 選擇 `Deploy from a branch → main → /(root)`。
- **Netlify Drop**：把 `iphone-price-site` 資料夾拖到 <https://app.netlify.com/drop>。

## 授權

個人參考可自由使用；價格資料整理自公開來源，可能隨官方更新而變動。
