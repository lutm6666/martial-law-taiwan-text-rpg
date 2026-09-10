# 部署架構

## 目前正式架構

```text
玩家（iPhone Safari / 桌面瀏覽器）
            ↓
      GitHub Pages
            ↓
 index.html + CSS + JavaScript
            ↓
   localStorage 本機存檔
```

目前遊戲是純前端網站，因此 GitHub Pages 已足以提供完整遊玩功能。

## GitHub Pages 自動部署

Repository 已包含：

```text
.github/workflows/pages.yml
```

當 `main` branch 有新的 commit 時，GitHub Actions 會：

1. Checkout 最新版本。
2. 設定 GitHub Pages。
3. 將 Repository 內容打包成 Pages artifact。
4. 部署到 GitHub Pages。

因此日常更新流程是：

```text
修改遊戲 → commit 到 main → GitHub Actions → GitHub Pages 更新
```

不需要另外把相同內容同步到 Netlify。

## GitHub Pages 可以直接支援的遊戲功能

只要功能能在瀏覽器前端完成，目前都可以繼續直接加入：

- 主線、支線與多結局劇情
- 條件式與身分限定選項
- 角色屬性、壓力、聲望、疑心
- 道具、裝備、任務物品
- 圖片、事件 CG、背景圖與 CSS 動畫
- 音效與背景音樂（之後若加入）
- localStorage 本機存檔
- 行動裝置與 iPhone Safari UI
- 事件紀錄與圖鑑
- 純前端成就系統

## 哪些功能未來才需要後端

GitHub Pages 本身不執行伺服器程式。如果未來加入下列功能，才需要額外後端服務：

- 玩家帳號與登入
- 跨裝置雲端存檔
- 全玩家排行榜
- 多人共享資料
- 管理員後台資料庫
- 需要隱藏金鑰的第三方 API
- 伺服器端事件或資料驗證

到那個階段再評估 Netlify、Supabase、Firebase 或其他服務即可；目前不把其中任何一個設為遊戲必要依賴。

## 專案原則

目前開發優先維持：

- GitHub Pages 單獨即可遊玩
- 手機優先
- 不依賴建置工具才能啟動
- 不因外部服務失效而讓主遊戲無法開啟
- 新增圖片與劇情時仍控制載入量，避免 iPhone Safari 體驗惡化
