# Archive

此目錄保存《霧中的臺灣》早期開發版本與已被現行 Canon 取代的模組。

## 重要

- 這些檔案 **不是正式遊戲執行鏈的一部分**。
- 正式入口固定為 repository 根目錄的 `index.html`。
- 正式引擎固定為根目錄的 `case1-unified-engine.js`、`case2-engine.js`、`case2-rain-canon.js`與 `case2-rain-canon-engine.js`。
- GitHub Pages 部署不會包含此目錄。

## 子目錄

- `legacy-runtime/`：舊版遊戲引擎、預覽頁、舊 UI/CSS 與過渡模組。
- `legacy-art-js/`：早期以 JavaScript/Base64 分段保存的第一案圖片來源。
- `legacy-v2-assets/`：第二案 Canon 定稿前使用的舊場景／概念素材。

保留這些檔案是為了追溯與必要時比對歷史實作；新增功能或 Debug 時不應從這裡選擇執行版本。
