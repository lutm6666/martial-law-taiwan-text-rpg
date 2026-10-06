# Claude 專案規則

先閱讀 `AI_WORKFLOW.md` 與任務相關的 CASE 設計文件。

## 你的主責

在直接派給 Claude 的實作任務中，主要負責：
- UI renderer
- HTML / CSS
- responsive
- accessibility
- animation / interaction polish
- 手機版體驗

在 Codex / ChatGPT 主導的 PR 中，Claude 預設是**唯讀的第二視角審查者**；是否自動啟動由 `AI_WORKFLOW.md` 的 changed-path Tier policy 決定。

## 直接實作任務的範圍限制

若直接派給 Claude 的 UI 工作需要修改下列領域，停止擴大實作範圍並提出 handoff：
- `case*-canon.js`
- `case*-engine.js`
- `CASE*_DESIGN.md`
- `CASE*_IMPLEMENTATION.md`
- `tools/test-*`
- `tools/validate-*`
- `.github/workflows/**`
- `AGENTS.md`
- `CLAUDE.md`、`AI_WORKFLOW.md`、guard／workflow 控制程式

如果 UI 需求需要新的 state、predicate、evidence、ending 或 save migration，請留下 handoff，不要自行在 UI 中模擬邏輯。

這一節是**工作範圍規則**，不是 GitHub 能以 label 證明的安全身分。`ai:claude` label 與 `claude/*` branch 都只是 routing hint；它們不能證明 PR 真由 Claude 建立。因此 production guard 不會用 mutable label 判斷作者。

實際安全與品質邊界由 changed paths 執行：
- Canon／engine／logic 路徑保留 Codex specialist review。
- UI／player-facing presentation／assets 保留 Claude specialist review。
- logic + presentation 需要兩側 review。
- routing hint 可以增加獨立 review，但不能移除路徑 specialist。
- workflow／policy／guard／governance 等 control paths 另外需要 repository owner 對 exact head SHA 的 hardened 人工核准。

因此如果一個標成 `ai:claude` 的 PR 真的出現 engine 變更，不能靠改 label 逃過 Codex review；但也不會因為一個不可驗證的 label 就把所有普通變更都升成人工 owner gate。

## Review 模式

Claude review 必須唯讀：
- 不執行 PR 程式。
- 不 Edit／Write／Bash。
- 不建立 commit。
- 不 approve 或 merge。
- 不把靜態閱讀描述成 runtime、browser 或真機驗證。

review 時依 changed paths 聚焦：
- responsive 退化
- overflow / tap target / viewport
- record / map / deduction 的可讀性
- UI 是否把 canon 結論提前說出來
- 桌面與手機操作是否一致
- Tier 3 時額外檢查靜態 patch 可見的 workflow/control、Canon/evidence-boundary 與 state-facing risk

## UX 規則

- 手機優先。
- 場景名只描述地方；按鈕只描述玩家正在做的動作。
- 不用按鈕文字、圖片標題、CSS class 或 loading 文案提前暴露證據結論。
- 一次性事件不要在回訪時重播。
- 行動結果取代主要閱讀區，不把舊正文無限堆疊。
- 所有必要線索不得依賴 AI 圖片中的可讀文字。

不要因個人偏好改寫案件邏輯。
