# 霧中的臺灣｜戒嚴時期歷史文字 RPG

一款以 1958 年臺灣社會為背景的手機優先（mobile-first）互動文字 RPG。

## 正式發布方式

本專案目前以 **GitHub Pages** 作為正式發布方式，不依賴 Netlify 才能運作。

每次 `main` branch 更新後，`.github/workflows/pages.yml` 會自動部署最新版本至 GitHub Pages。遊戲目前為純前端架構，因此劇情、選項、角色屬性、道具裝備、事件視覺、localStorage 存檔與 iPhone Safari 操作都能直接在 GitHub Pages 執行。

Netlify 暫時不是必要元件。只有未來加入帳號、跨裝置雲端存檔、排行榜、伺服器 API 或其他後端功能時，才需要另外評估 Netlify、Supabase、Firebase 或其他後端服務。

更多說明見 [`DEPLOYMENT.md`](DEPLOYMENT.md)。

## 目前版本

- 純 HTML / CSS / JavaScript，無需安裝套件
- 針對 iPhone Safari 與行動裝置調整
- 8 種角色背景：學生、工人、公務員、記者、教師、商人、退伍軍人、持家者
- 觀察、知識、沉著、人情四項能力
- 壓力、聲望、疑心三項狀態
- 多條分支路線與多個結局
- 身分限定與條件式選項
- 道具與裝備系統
- 事件紀錄
- localStorage 本機自動存檔、手動保存與讀取
- 場景視覺層與高壓狀態呈現
- 選項後果不預先顯示，降低「看數字選答案」的情況
- 不依賴外部字型、框架或 CDN

## 執行方式

正式遊玩建議使用 GitHub Pages。若只是在本機測試，也可以直接開啟 `index.html`。

GitHub Pages 的部署由 GitHub Actions 自動完成，不需要再手動把檔案同步到 Netlify。

## 歷史題材說明

本作為歷史題材虛構作品。角色與主要事件為創作，部分制度、社會氛圍與時代背景取材自史實。遊戲以呈現普通人在特定時代條件下的選擇與不確定性為目的，不替任何政治立場背書。

## 專案結構

- `index.html`：遊戲介面與各模組載入入口
- `style.css`：手機優先樣式、場景視覺與高壓狀態效果
- `game-v4.js`：主要劇情、角色狀態、選擇、道具、裝備與存檔系統
- `role-narrative-v1.js` / `role-narrative-v2.js`：身分差異化敘事
- `choice-bridges-v2.js`：選項與場景銜接修正
- `logic-audit-v1.js`：劇情邏輯與狀態補強
- `history.js`：史實節點呈現
- `tension-visuals-v1.js`：場景視覺、緊張感與選項資訊隱藏層
- `.github/workflows/pages.yml`：GitHub Pages 自動部署
- `.nojekyll`：避免 GitHub Pages 套用 Jekyll 處理
