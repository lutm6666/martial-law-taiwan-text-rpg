# 霧中的臺灣｜歷史推理解謎

《霧中的臺灣》是一款以 1958 年臺北為背景、手機優先的純前端文字推理解謎遊戲。

## 目前正式版本

主角背景固定為 **民俗家學調查者**；玩家只需要輸入姓名。遊戲目前包含：

- 第一案〈失落的三頁〉：追查三頁訪談筆記如何從茶行、印刷行、市場一路流到舊書攤。
- 第二案〈雨夜敲門〉：調查 201 號房的雨夜敲門、前租客許月琴的紀錄，以及許秋蘭尋找姐姐遺物的過程。
- 第三案〈第十三張底片〉：Canon 骨架已建立，將以底片、接觸印樣、取景位置與影格順序作為核心推理；目前尚未接入正式遊戲。
- 第二案最終推理共 6 題，依序檢驗人物辨認、時間線、現場痕跡、物品保管鏈、未拆封信件與失蹤原因的證據邊界。
- 以物證、證詞、時間線與可驗證的現場資訊進行推理。
- 第一案 7 張正式證物圖；第二案 12 張正式證物圖與 7 張正式場景圖。
- localStorage 本機存檔。
- iPhone Safari 與一般桌面瀏覽器可直接遊玩。

正式公開頁面：
https://lutm6666.github.io/martial-law-taiwan-text-rpg/

## 正式執行鏈

正式首頁只依賴以下檔案：

```text
index.html
├─ case1-unified-engine.js
├─ case2-engine.js
│  ├─ case2-rain-canon.js        （案件二需要時載入）
│  └─ case2-rain-canon-engine.js （案件二需要時載入）
```

正式圖片資源：

```text
assets/case1/
assets/v2/canon/
```

其中第一案證物使用 `assets/case1/evidence01.png` ～ `evidence07.png`；第二案 Canon 圖片集中在 `assets/v2/canon/`。

## 專案結構

- `index.html`：正式 UI 與共用樣式。
- `case1-unified-engine.js`：第一案資料、調查流程、推理與存檔。
- `case2-engine.js`：第二案入口與延遲載入控制。
- `case2-rain-canon.js`：第二案 Canon、證物、人物、場景與推理資料。
- `case2-rain-canon-engine.js`：第二案執行引擎。
- `assets/`：正式圖片資源；歷史素材統一放在 `archive/`。
- `assets-src/`：部分場景圖片的可重建來源，不是瀏覽器執行依賴。
- `tools/`：驗證與維護工具。
- `archive/`：過去版本與舊式模組，只供追溯，不屬於正式執行鏈。
- `CASE3_DESIGN.md`：第三案 Canon 骨架、證物鏈、影格玩法與最終推理設計。
- `.github/workflows/pages.yml`：GitHub Pages 驗證與部署。

## 雙 AI 協同開發

本 repo 已加入 Claude × Codex 的 GitHub 協同模式：

- Claude 主責 UI、CSS、responsive、accessibility 與互動 polish。
- Codex / ChatGPT 主責 Canon、engine、state、tests、CI、證據鏈與防劇透邏輯。
- Issue `opened`／`reopened` 時，`AI Dispatch` 依標題與內容建立 routing plan、工作 branch 與引用來源 Issue 的 draft PR。具 repository 寫入權限的事件 actor 會自動啟動主責 AI 實作；公開 Issue 也會建 plan／PR，但須由 writer 使用 `dispatch:retry` 啟動模型。
- UI／assets 優先交 Claude，Canon／engine／control 優先交 Codex，純 tests／validators／docs 規劃為 Tier 1。模型產生的 patch 經可信 publisher 驗證並同步最新 `main` 後，才更新工作 branch；AI 不直接 push `main`。
- PR 由 `AI Path Guard` 檢查檔案責任邊界，並由 `AI Cross Review` 要求另一個 agent 交叉審查。
- `Project validation` 是合併前的共同 CI；Case 3 有變動時會自動加跑 schema、regression 與 headless Chrome smoke test。

required checks 使用 `project-validate`、`guard`；請求留言不代表 agent 已接收或完成 review。

自動實作需先由 owner 設定 dispatch GitHub App 的 `AI_DISPATCH_APP_CLIENT_ID`（variable）與 `AI_DISPATCH_APP_PRIVATE_KEY`（secret），授予 App Contents、Pull requests、Issues 的 write 權限，並依主責模型設定 `OPENAI_API_KEY` 或 `CLAUDE_CODE_OAUTH_TOKEN`。App 不授予 Workflows write；模型產生的 Actions workflow／local action 變更會停在 draft PR 與 patch artifact，待 owner 受控處理。缺少憑證會停止對應階段；owner exact-SHA approval 仍只用於 control／governance 變更。

詳細角色、branch 命名、SHA 綁定的 owner 核准與接收端限制見 `AI_WORKFLOW.md`。Agent 專用規則分別位於 `CLAUDE.md` 與 `AGENTS.md`。

## 部署方式

每次 `main` 更新後，GitHub Actions 會先檢查正式 JavaScript 語法與必要圖片數量，再建立精簡的 `_site` 目錄。Pages 只發布正式入口、正式引擎與正式圖片，不再把 `tools/`、`assets-src/` 或 `archive/` 一起公開。

詳細流程見 `DEPLOYMENT.md`。

## 開發原則

- 固定以目前 Canon 為準，不讓舊版腳本覆蓋正式資料。
- 場景觀察、證物、證詞與推理條件必須能互相核對。
- 調查選項的結果採「取代場景正文」顯示：初到地點顯示場景介紹，選擇行動後由該行動結果接管主要閱讀區；不得把舊場景正文與新結果持續堆疊。後續案件沿用此模式。
- 回訪已到過的地點時，主要閱讀區先顯示符合當下狀態的回訪敘述；一次性事件只在首次觸發時顯示事件文本／事件圖，之後回訪恢復一般場景圖與事件消失後的文字。
- 最終推理的錯誤結局依錯誤類型區分（怪談化、錯誤指控、超出證據），重要結論必須在前段調查中有可追溯來源。
- 最終推理依「人物辨認→紀錄可信度→時間線→物品保管鏈→證據邊界→最終結論」遞進；錯誤答案只提供提示，不直接揭露正解，失敗結局依整體錯誤類型而不是最後一次誤答決定。
- 物證圖片只對應實際存在的遊戲物件；證詞與流程情報不偽造成文件。
- 新增或修改檔案後，檢查 JavaScript 語法、資源路徑、解鎖可達性與證物鏈。
- 保持純前端與手機優先；除非未來需要帳號、跨裝置雲端存檔或伺服器資料，否則不引入必要後端。
