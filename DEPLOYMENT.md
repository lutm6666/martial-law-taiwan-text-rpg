# 部署架構

## 正式架構

```text
玩家（iPhone Safari / 桌面瀏覽器）
            ↓
      GitHub Pages
            ↓
      _site/
            ↓
index.html + 正式 JavaScript + 正式圖片
            ↓
      localStorage
```

正式遊戲仍是純前端網站，不需要建置框架或後端服務。

## 自動部署

`.github/workflows/pages.yml` 只監聽 `main`。

每次 `main` 有新 commit 時會依序：

1. Checkout repository。
2. 設定 GitHub Pages。
3. 用 Node.js 語法檢查正式 JavaScript。
4. 執行 `tools/verify-javascript.js`，確認 `index.html` 直接載入的腳本可解析。
5. 確認第一案與第二案正式圖片數量，並驗證第三案 manifest、資料與狀態引擎。
6. 使用 `tools/build-pages.js` 建立乾淨的 `_site`，檢查所有延遲載入腳本與第三案 21 張圖片。
7. `tools/test-pages-bundle.js` 驗證正式入口／路由依賴、圖片、開發檔排除與乾淨重建；PR CI 與 Pages 使用同一建置方式。
8. 將 `_site` 上傳為 Pages artifact 並部署。

## 目前會發布的檔案

```text
_site/
├─ index.html
├─ .nojekyll
├─ case1-unified-engine.js
├─ case2-engine.js
├─ case2-rain-canon.js
├─ case2-rain-canon-engine.js
├─ case3-film-canon.js
├─ case3-art-manifest.js
├─ case3-film-engine.js
├─ case3-film-ui.js
└─ assets/
   ├─ case1/
   ├─ v2/
   │  └─ canon/
   └─ case3/
```

## 不會發布

以下仍可留在 repository 供開發與追溯，但不進入 Pages artifact：

- `archive/`
- `assets-src/`
- `tools/`
- README、部署文件與其他開發資料
- 舊版預覽頁與舊式執行模組
- `assets/v2/` 中已被 Canon 取代的舊預覽素材

這可避免歷史版本被誤當成正式入口，也降低 Pages artifact 的冗餘。

## 日常更新流程

```text
修改遊戲
  ↓
工作分支提交 → PR 驗證與 review → 合併 main
  ↓
Actions 驗證
  ↓
建立 _site
  ↓
GitHub Pages 部署
```

若驗證失敗，部署工作會停止，不會把有語法錯誤或關鍵圖片缺失的版本發布出去。

## 何時需要後端

目前不需要。只有未來加入玩家帳號、跨裝置雲端存檔、排行榜、多人共享資料、管理員資料庫或需要保密金鑰的 API 時，才需要評估額外後端服務。
