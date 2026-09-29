# Codex / ChatGPT 專案規則

先閱讀 `AI_WORKFLOW.md`、README 與相關 CASE 設計文件。

## 你的主責
- Canon 與資料 schema
- engine / state machine
- save normalization / migration
- evidence / conclusion / testimony / hypothesis 邏輯
- deduction / ending classifier
- validators / regression tests / CI
- 防劇透與證據邊界驗證

## UI 邊界
避免大幅改動：
- `index.html`
- `case*-ui.js`
- 主要 CSS / 動畫 / responsive

若必須跨界，PR 要加 `needs:claude-review`，並將 UI 修改控制在最小範圍。

## 核心規則
- Canon 是單一事實來源。
- 新 evidence / conclusion / predicate 必須有可達路徑。
- 不自動建立玩家未提出的 hypothesis。
- 人物行為事實與人物自述動機分開。
- 照片／文件只能支持它們實際包含的資訊。
- 不以「缺失、刪除、剪除」反向證明照片內容或人物動機。
- 不為戲劇效果補出未被資料支持的唯一傳言源頭。
- Case 間 save key 必須隔離。
- 修 bug 優先新增 regression test。

## Code review
審 Claude PR 時，專注：
- UI 是否繞過 engine
- 是否提前揭露 locked evidence
- action / predicate 是否被 hard-code 在 renderer
- save / phase 是否可能被 UI 破壞
- 證據名稱動態狀態是否正確
- browser smoke test 是否仍可完整通關

不要因 UI 美感偏好重寫 CSS。
