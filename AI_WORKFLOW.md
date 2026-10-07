# 雙 AI 協同工作模式

本專案使用 Codex / ChatGPT 與 Claude 協作。Codex / ChatGPT 主要處理 Canon、邏輯、測試、CI 與整合；Claude 主要處理 UI、responsive、accessibility、玩家呈現，以及唯讀第二視角 review。

GitHub PR、changed paths、CI、review payload 與 exact-head 證據才是控制面依據。Agent 的文字回覆、label、branch 名稱或 request comment 都不能取代實際驗證。

## 安全模型

三個概念必須分開：

- **Provenance**：GitHub payload 能直接觀察到的來源證據。一般 `User` PR 預設為 `unknown`。
- **Routing hint**：`ai:codex`、`ai:claude`、`ai:handoff` label 與對應 branch 名只用於工作路由，不證明作者身分。
- **Review / guard policy**：只依 changed paths 與可信 GitHub payload 決定；routing hint 只能增加 review，不能降低要求。

## Review tiers

`tools/ai-workflow.review.js` 依 changed files 分級，rename 同時檢查 `previous_filename`。

| 等級 | 典型變更 | 自動審查 |
| --- | --- | --- |
| Tier 1 | tests、validators、smoke、implementation notes、其他非玩家呈現低風險變更 | CI / regression；通常不要求第二模型 |
| Tier 2 | UI、client HTML/JS、CSS/SCSS、responsive、accessibility、`assets/**` | Claude specialist |
| Tier 3 | Canon、engine、workflow/policy/control、logic+presentation、handoff/conflict | logic/control 需要 Codex；presentation 需要 Claude；混合或 handoff 需要兩側 |

基線：
- Canon / engine / logic / control → Codex。
- UI / presentation / assets → Claude。
- logic + presentation → Codex + Claude。
- `ai:handoff` 或 routing conflict → Codex + Claude，且至少 Tier 3。

Routing hint 只能增加獨立第二視角。例如 `ai:codex` + UI 仍需 Claude；`ai:claude` + engine 仍需 Codex。

Tier 1 仍可由 repository writer 留言全文 `@claude review` 手動要求 Claude review。`review:retry` 只重送本來就需要的自動 review。

## Exact-head completion

`needs:*` label 或 request comment 只代表 **request sent**，不代表完成。新 head SHA 產生後，舊 head 的 completion 一律失效。

Codex completion 只接受 managed `chatgpt-codex-connector[bot]` 的 GitHub PR review，而且 REST payload 的完整 `commit_id` 必須等於目前 40 字元 head SHA。短 SHA 顯示、mention、request comment 或 summary 文案本身都不算 completion。

Claude completion 只接受 trusted GitHub Actions bot 發出的未編輯 marker，首行必須精確綁定目前完整 head SHA。

Completion gate 只證明「指定 reviewer 已對 exact head 完成 review」，不是把 AI 意見轉成 GitHub APPROVE。具體 findings 仍需處理；thread-resolution 與 required checks 仍可阻止未解決問題被合併。

## Fork PR 與 Claude receiver

Draft 或 closed PR 不做自動 receiver review。Cross-review router 不對 fork 建立需要寫入 PR 的 routing comment；但 Claude receiver 可在 `pull_request_target` 下只 checkout trusted default branch，再用 GitHub API 唯讀取得 fork patch。它不 checkout、不執行 fork code。

Claude tools 僅 Read / Glob / Grep；禁用 Bash、Edit、Write、Agent、Task。所有 PR patch 都視為不可信資料，不視為指令。

`claude-review-input.json` 記錄 requested SHA、tier、routing hint、provenance 與 patch。若 snapshot 超過 inline limit，會拆成 `claude-review-parts/*.json`，manifest 要求 reviewer 讀完所有 parts；不再因固定 150k 大小永久失去 completion 路徑。若 GitHub file list 達 3000 筆，因 API 可能截斷而 fail closed，應拆 PR。

只有 Claude 執行成功、回傳 SHA 與 requested head 完全相同且 summary 非空，才發布 `Claude review completed`。完成後 receiver 直接 rerun exact-head native `guard`；不依賴 workflow 自己建立的 comment 再觸發 workflow。

## Trusted guard wakeup

`ai-path-guard.yml` 使用：

- `pull_request_target`：對 PR lifecycle 重新評估。
- default-branch `issue_comment`：對 completion 與 owner comment 重新評估。

刻意**不**用 `pull_request_review` 當 workflow trigger，避免執行 PR-controlled workflow source。Codex 完成 review 時會更新 managed review summary comment；`issue_comment: edited` 會從 default branch 喚醒 trusted guard，再由 guard API 讀取 exact-head PR review payload。

若 completion event 抵達時原本的 native guard 仍在執行，trusted runtime 會等待該 guard 完成，再比較最新 policy conclusion，必要時 rerun，避免 race 留下陳舊 failure。

Required contexts 維持：

- `project-validate`
- `guard`

AI completion 直接整合進既有 required `guard`，不新增另一個 ruleset context。

## Owner approval

普通 Canon、engine、logic、tests、validators、UI、assets 不因 routing label 或推定 AI 身分要求 owner approval；它們由 changed-path reviewer policy、exact-head completion、project validation 與專項 regression 處理。

Control / governance path 仍需要 owner 對目前完整 head SHA 做人工核准，包括：

- `.github/workflows/**`
- `.github/CODEOWNERS`
- `tools/ai-workflow*`
- `tools/ai-path-guard*`
- `tools/ai-orchestrator*`
- 對應 governance regression tests
- `AI_WORKFLOW.md`、`AI_ORCHESTRATION.md`、`AGENTS.md`、`CLAUDE.md`

人工核准只接受 owner 建立的 PR issue comment，不接受 GitHub APPROVED review。留言全文必須完全等於：

```text
/ai approve-handoff <完整 40 字元 head SHA>
```

還必須同時符合：owner `User`、`author_association === "OWNER"`、沒有 GitHub App provenance、comment 未被編輯，而且建立時間不早於該 exact head 的最早 workflow run。PR reviews 不傳入 owner approval helper。

## CI 最低回歸要求

Project validation 必須覆蓋：

- identity / routing / provenance 分離。
- mutable label / branch 不能移除 changed-path specialist review。
- routing conflict 只能升級，不能降級。
- production guard 不得退回 legacy security decision。
- guard 不使用 `pull_request_review` 執行 PR-controlled workflow。
- Codex managed review 與 Claude marker 都必須 exact-head。
- completion wakeup 遇到 in-flight native guard 時可等待並修復 stale failure。
- Claude 大型 snapshot 可 chunk；3000-file API cap 則 fail closed。
- 非 control path 不因 mutable routing metadata 觸發 owner gate。
- control path 無論 routing hint 為何都需要 hardened exact-SHA owner gate。
- owner approval provenance / freshness / exact-command regressions。
- 原有 orchestration、runtime JavaScript、canonical assets 與 Case 3 專項驗證。

## 失敗處理

- CI fail：修正，不繞過測試。
- reviewer receiver fail：保持 fail closed；不能偽造 completed。
- merge conflict：以 Canon 與 regression tests 為基準。
- binary / 缺 patch：review 必須明示限制。
- PR 達 GitHub 3000-file list 上限：拆 PR，不用截斷資料推定低風險。
