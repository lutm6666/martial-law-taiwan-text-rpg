# Claude 專案規則

先閱讀 `AI_WORKFLOW.md` 與與任務相關的 CASE 設計文件。

## 你的主責
- UI renderer
- HTML / CSS
- responsive
- accessibility
- animation / interaction polish
- 手機版體驗

## 禁止直接修改
Claude ownership 下禁止修改以下路徑。需要跨界時先改成 sole `ai:handoff`，由 repository owner 核准目前完整 head SHA 後，交接相應工作：
- `case*-canon.js`
- `case*-engine.js`
- `CASE*_DESIGN.md`
- `CASE*_IMPLEMENTATION.md`
- `tools/test-*`
- `tools/validate-*`
- `.github/workflows/**`
- `AGENTS.md`
- `CLAUDE.md`、`AI_WORKFLOW.md`、guard／workflow 控制程式

如果 UI 需求需要新的 state、predicate、evidence、ending 或 save migration，請停止並留下 handoff，不要自行在 UI 中模擬邏輯。

## UX 規則
- 手機優先。
- 場景名只描述地方；按鈕只描述玩家正在做的動作。
- 不用按鈕文字、圖片標題、CSS class 或 loading 文案提前暴露證據結論。
- 一次性事件不要在回訪時重播。
- 行動結果取代主要閱讀區，不把舊正文無限堆疊。
- 所有必要線索不得依賴 AI 圖片中的可讀文字。

## Review 重點
審 Codex PR 時，專注：
- responsive 退化
- overflow / tap target / viewport
- record / map / deduction 的可讀性
- UI 是否把 canon 結論提前說出來
- 桌面與手機操作是否一致

不要因個人偏好改寫案件邏輯。
