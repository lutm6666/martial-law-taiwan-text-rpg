# 雙 AI 協同工作模式

本專案採用「Claude 主責前端／體驗、Codex 主責 Canon／邏輯／測試」的分工模式。GitHub Issue、PR、CI 與路徑守門規則是共同協作介面。

## 角色

### Codex / ChatGPT
主責：
- `case*-canon.js`
- `case*-engine.js`
- `CASE*_DESIGN.md`
- `CASE*_IMPLEMENTATION.md`
- `tools/test-*`
- `tools/validate-*`
- GitHub Actions、回歸測試、存檔相容性、證據鏈與防劇透邏輯

原則：
- 不主動大改 UI／CSS；若必須跨界，PR 必須標記 `needs:claude-review`。
- Canon、證據邊界、推理條件變更必須附測試。
- 不得用 UI 文案替代資料層判定。

### Claude
主責：
- `index.html`
- `case*-ui.js`
- CSS、動畫、responsive、accessibility
- 視覺層、互動層、手機體驗

原則：
- 不得自行修改 Canon、engine、tests、validators、CI 或案件核心規格。
- 如 UI 需求必須改動邏輯，停止實作並建立 handoff，交由 Codex 處理。
- 必須遵守 Canon 的防劇透與證據邊界。

### 人工 / Handoff
適用：
- 美術資產生成與最終取捨
- 同時跨 Canon 與 UI 的大型重構
- 高風險劇情變更
- 需要改 branch protection、required checks、secrets 等 repository admin 設定

## 分支命名

- Claude：`claude/<topic>` 或 `ai/claude-<issue>-<topic>`
- Codex：`codex/<topic>` 或 `ai/codex-<issue>-<topic>`
- 協作／人工：`handoff/<topic>`

禁止 AI 直接 push `main`。所有功能修改一律走 PR。

## Issue 派工

使用「AI task」Issue template。workflow 會依 Workstream 自動加標籤：

- Canon / Logic / State / Tests → `ai:codex`
- Frontend / UI / Responsive / Accessibility → `ai:claude`
- Art / Assets → `ai:handoff`
- Mixed / Cross-boundary → `ai:handoff`

派工留言會包含對應 agent 指令與本檔案連結。

## PR 交叉審查

- Claude PR → 自動標記 `needs:codex-review`，要求 Codex 檢查 Canon、證據鏈、存檔、劇透與 regression。
- Codex PR → 自動標記 `needs:claude-review`，要求 Claude 檢查 UI、responsive、可讀性與互動退化。
- Handoff PR → 兩邊都要 review。

## 路徑守門

Claude PR 不得修改：
- `case*-canon.js`
- `case*-engine.js`
- `CASE*_DESIGN.md`
- `CASE*_IMPLEMENTATION.md`
- `tools/test-*`
- `tools/validate-*`
- `.github/workflows/**`
- `AI_WORKFLOW.md`
- `AGENTS.md`

Codex 若修改 UI 主要檔案，CI 不直接 fail，但會要求 Claude review。

## CI

合併前至少必須通過：
- `Project validation / validate`
- `AI Path Guard / guard`

Case 3 相關檔案若有變動，Project validation 會另外執行：
- schema validator
- state-engine regression tests
- headless Chrome browser smoke playthrough

## Handoff 規則

如果主責 agent 發現工作超出自己的檔案邊界：
1. 不偷偷修改另一方主責檔案。
2. 在 Issue/PR 留下「需要另一方處理的具體項目」。
3. 加上 `ai:handoff`。
4. 由另一方接手後再繼續。

## 失敗處理

- CI fail：先讀 log，不得繞過測試。
- merge conflict：以 Canon 與現有 regression test 為基準，不用舊 UI 蓋回新邏輯。
- agent 無法啟動：保留派工標籤與 handoff 訊息，改由人工或另一 agent 接手。
- 不可用 force push、刪除測試、停用 guard 來讓 PR 通過。

## Repository admin 建議

若 GitHub App 權限無法自動設定 branch protection，請在 Settings → Branches / Rulesets 對 `main` 啟用：
- Require a pull request before merging
- Require status checks to pass
- Required: `Project validation / validate`
- Required: `AI Path Guard / guard`
- Require conversation resolution
- Block force pushes
- Do not allow deletions

Codex GitHub Code Review 若已連接，建議在 Codex 設定中開啟本 repo 的 Automatic reviews。Claude GitHub App 若已連接，保留 `@claude` trigger。
