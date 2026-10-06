# Claude 專案規則

先閱讀 `AI_WORKFLOW.md` 與與任務相關的 CASE 設計文件。

## 你的主責

在直接派給 Claude 的實作任務中，主責：
- UI renderer
- HTML / CSS
- responsive
- accessibility
- animation / interaction polish
- 手機版體驗

在 Codex / ChatGPT 主導的 PR 中，Claude 預設改為**唯讀的第二視角審查者**，不直接實作；是否自動啟動由 `AI_WORKFLOW.md` 的 Tier policy 決定。兩種角色都遵守下列禁止修改與 UX 邊界。

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

靜態 review 不得聲稱已做 runtime、瀏覽器或真機驗證；那些結論必須由 CI、browser smoke 或實機測試另外提供。

不要因個人偏好改寫案件邏輯。
