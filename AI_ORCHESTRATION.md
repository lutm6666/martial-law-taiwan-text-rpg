# Single-window AI orchestration

這一層的目的不是要求 owner 管理多個 AI，而是讓 owner 只提出目標，由主控者負責拆分、隔離、驗證與整合。

## 核心模型

```text
owner
  ↓
orchestrator
  ↓
task DAG
  ├─ codex task   → isolated worktree / codex/*
  ├─ claude task  → isolated worktree / claude/*
  └─ handoff task → isolated worktree / handoff/*
  ↓
handoff/orch-<plan>
  ↓
PR → guard + project-validate → main
```

Git worktree 只解決檔案系統隔離；它不代表 Agent 已接手，也不取代 `AI_WORKFLOW.md` 的 ownership、review、CI 或 owner approval。

## 安全不變量

1. AI 不直接 push `main`。
2. 每個 task 有明確 agent、branch、allowed path scope、acceptance criteria 與 dependencies。
3. 沒有依賴關係的平行 task 不得有重疊 path scope；有重疊時必須明確排序。
4. 預設最多同時三個 active tasks；增加並行度必須是有意識的決定。
5. task branch 不直接整合到 `main`；先回到單一 integration branch。
6. integration branch 使用 `handoff/orch-*`，最終仍走 PR、`guard` 與 `project-validate`。
7. worktree 清理不得刪除 dirty worktree；task branch 預設保留，讓事故可回溯。
8. Agent 完成聲明不是完成證據；至少需要 commit SHA、changed files、tests run 與 unresolved risks。
9. Runtime 資源（port、database、container name 等）仍需另外隔離；worktree 本身不處理這些衝突。
10. Issue routing / PR review receiver 的驗證狀態仍以 `AI_WORKFLOW.md` 為準，不因 orchestrator 存在而自動視為可用。

## Plan 格式

Plan 是 JSON。最小範例：

```json
{
  "id": "case3-next",
  "goal": "完成下一輪 Case 3 改善",
  "base": "main",
  "maxParallel": 3,
  "tasks": [
    {
      "id": "logic",
      "agent": "codex",
      "goal": "修改 Canon / engine 並補回歸測試",
      "paths": ["case3-film-canon.js", "case3-film-engine.js", "tools/test-case3-engine.js"],
      "acceptance": ["Case 3 regression passes"]
    },
    {
      "id": "ui",
      "agent": "claude",
      "goal": "依既有 contract 改善手機 UI",
      "paths": ["case3-film-ui.js", "case3-preview.html"],
      "acceptance": ["No spoiler regression", "Mobile layout remains usable"]
    }
  ]
}
```

若 `ui` 必須等待 `logic` 完成，加入：

```json
"dependsOn": ["logic"]
```

## 指令

只驗證 plan：

```bash
node tools/ai-orchestrator.js validate path/to/plan.json
```

顯示實際排程 wave：

```bash
node tools/ai-orchestrator.js plan path/to/plan.json
```

建立 integration branch、task branches 與 worktrees：

```bash
node tools/ai-orchestrator.js materialize path/to/plan.json
```

預設 worktree 位於 repository 同層的：

```text
<repo>-worktrees/<plan-id>/
```

可使用 `--root PATH` 改位置。

查看 task worktree 是否存在、dirty file 數量與相對 integration branch 的 ahead commit 數：

```bash
node tools/ai-orchestrator.js status path/to/plan.json
```

安全清理 clean worktrees：

```bash
node tools/ai-orchestrator.js cleanup path/to/plan.json
```

`cleanup` 不刪 task branches，而且遇到 dirty worktree 會直接拒絕。

## Orchestrator 的責任

主控者在每一輪必須：

- 把需求轉成 task DAG，而不是盲目增加 Agent。
- 先固定 shared contract，再拆前端／邏輯工作。
- 對每個 task 指定最小 path scope。
- 只讓真正獨立的 task 同一 wave 執行。
- 收到 task 結果後先驗證，再整合到 integration branch。
- integration branch 通過完整測試後才開往 `main` 的 PR。
- 遇到 semantic conflict 時停止自動整合，回到 contract / Canon 判定。

對 owner 而言，預期介面維持單一窗口：描述目標、提供實測回饋、做產品決策。branch、worktree、Agent 分工與驗證由 orchestrator 處理。
