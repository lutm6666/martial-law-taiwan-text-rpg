# 雙 AI 協同工作模式

本專案採用 Codex / ChatGPT 與 Claude 分工協作。Codex / ChatGPT 主要處理 Canon、邏輯、測試與整合；Claude 主要處理 UI、responsive、accessibility 與玩家呈現，並提供唯讀第二視角審查。

GitHub Issue、PR、CI、路徑風險與 review 記錄是共同協作介面。任何 agent 的文字回覆都不能取代實際 CI、browser smoke、commit、PR 或 exact-head review 證據。

## 三個概念分開

安全政策刻意區分：

- **Provenance**：GitHub payload 能實際觀察到的來源證據。一般 `User` PR 即使顯示 repository owner，也可能是外部 agent 透過該帳號操作，因此預設是 `unknown`。
- **Routing hint**：`ai:codex`、`ai:claude`、`ai:handoff` label 與 `codex/*`、`claude/*`、`handoff/*` branch 名稱，只表示希望如何路由工作，不證明作者身分。
- **Review / guard policy**：依實際 changed paths 決定。routing hint 可以增加 review，但不能降低路徑本身要求。

因此 mutable label 或 branch name 不再作為安全身分邊界；衝突的 routing hints 會 fail toward `handoff`，只增加審查。

## 角色與工作偏好

### Codex / ChatGPT

主要負責：
- `case*-canon.js`
- `case*-engine.js`
- `CASE*_DESIGN.md`
- `CASE*_IMPLEMENTATION.md`
- tests、validators、browser smoke
- GitHub Actions、回歸測試、存檔相容性
- 證據鏈、推理條件、防劇透邊界與最終整合

Canon、engine、證據邊界或推理條件變更必須有相對應測試。

### Claude

直接派給 Claude 的實作任務主要負責：
- UI renderer
- HTML / CSS
- responsive、accessibility、tap targets
- interaction polish、手機版體驗

如果直接實作任務需要新的 state、predicate、evidence、ending、save migration 或 workflow/control 修改，應停止該實作範圍並 handoff，而不是在 UI 中模擬邏輯。

在 review 工作中 Claude 是唯讀第二視角，不執行 PR 程式、不修改檔案、不建立 commit、不 approve、不 merge。

這些角色是**工作分配規則**，不是由 PR label 推導出的安全身分。GitHub guard 不會因 `ai:claude` 或 `ai:codex` label 就宣稱已證明實作者。

## 三級 review policy

`tools/ai-workflow.review.js` 依 **changed files** 判斷風險；rename 同時檢查 `previous_filename`，避免改名降級。

| 等級 | 典型變更 | 自動審查 |
| --- | --- | --- |
| Tier 1 / local validation | tests、validators、smoke harness、implementation notes、其他低風險非玩家呈現變更 | 既有 CI／回歸；不因 routing hint 自動升級，除非是 handoff/conflict |
| Tier 2 / specialist review | UI、client HTML/JS、CSS/SCSS、responsive、accessibility、`assets/**` | 玩家呈現至少需要 Claude specialist review |
| Tier 3 / full-risk review | Canon、engine、workflow/policy/control、logic+presentation、handoff/conflict | logic/control 需要 Codex specialist；presentation 需要 Claude specialist；混合或 handoff 需要兩側 |

Reviewer 基線完全來自路徑：
- Canon／engine／logic／control → Codex specialist。
- UI／client presentation／assets → Claude specialist。
- logic + presentation → Codex + Claude。
- `ai:handoff` 或 routing conflict → Codex + Claude，且至少 Tier 3。

Routing hint 只能增加獨立第二視角。例如：
- `ai:codex` + UI → Claude specialist。
- `ai:codex` + engine/control → Codex specialist仍保留，另加 Claude independent review。
- `ai:claude` + engine → Codex specialist；改 label 不能移除 Codex review。
- `ai:claude` + UI → Claude specialist仍保留，另加 Codex independent review。
- 無可驗證 provenance / 無 routing hint → 直接依 changed paths 決定 reviewer，不因此找 owner。

Tier 1 仍可由 repository writer 留言全文：

```text
@claude review
```

手動要求 Claude review。`review:retry` 只重送本來就需要的自動 review。

## Issue 派工與分支

建議分支：
- Claude：`claude/<topic>` 或 `ai/claude-<issue>-<topic>`
- Codex：`codex/<topic>` 或 `ai/codex-<issue>-<topic>`
- Handoff：`handoff/<topic>`

禁止 AI 直接 push `main`。功能與協作控制修改一律走 PR。

Issue template 的 Workstream／Area 可準備 routing labels：
- Canon / Logic / State / Tests；Save / Migration；CI / Tests → `ai:codex`
- Frontend / UI / Responsive / Accessibility → `ai:claude`
- Art / Assets、Mixed、Unsure、Repository admin → `ai:handoff`

Routing label 只表示「路由已準備」，不代表 receiver 已接手，也不代表 PR 作者身分。真正接手與完成要有 receiver run、task、commit、PR 與驗證證據。

只有 GitHub Actions bot + Actions App id 15368 的控制 marker 被視為可信 workflow marker；這仍然只是 workflow provenance，不是 PR 作者 provenance。

## PR 交叉審查

`AI Cross Review` 從可信 base checkout 執行 `tools/ai-workflow.review.js`。同一份 path policy 決定：
- risk tier
- routing hint（若有）
- observed provenance（通常為 `unknown`）
- exact reviewer set
- `needs:*` labels
- review request comments

`needs:*` 或 request comment 只表示 **request sent**，不等於 receiver 完成。只有相同完整 head SHA 的 completed marker / run 證據才算該次 review 完成。

Draft、closed、fork PR 不自動送 review。新 head SHA 必須重新判斷；不能沿用舊 SHA completion。

## Claude review receiver

`claude-review.yml` 對 reviewer set 含 Claude 的自動 Tier 2／3 PR 啟動 Claude；Tier 1 自動事件在 prepare 階段停止。

安全邊界：
- checkout 可信 default branch，不 checkout／執行 PR head。
- PR patch 由 API 建立唯讀 `claude-review-input.json`。
- snapshot 分開記錄 `routing_hint` 與 `provenance`；不再以單一 `agent` 欄位暗示作者身分。
- Claude tools 僅 Read／Glob／Grep；禁用 Bash／Edit／Write／Agent／Task。
- Tier 2 聚焦 UX、a11y、readability、overflow、tap target、spoiler 與呈現資產。
- Tier 3 另外檢查靜態 patch 可見的 Canon／evidence boundary、state-facing risk、workflow/control safety。
- 二進位資產沒有文字 patch 時必須明示限制。
- 靜態 review 不得宣稱 runtime verification。

只有 Claude 執行成功、回傳 SHA 與 requested head 完全相同且 summary 非空，才發布 `Claude review completed`。

## 路徑 guard 與 owner approval

`ai-path-guard.yml` 使用 `pull_request_target`，只執行 trusted base policy，不 checkout PR head。production guard 固定載入 trusted base 的 `tools/ai-path-guard.runtime.js`。

### 日常程式變更

普通 Canon／engine／logic／tests／validators／UI／assets **不因 routing label 或推定 AI 身分而要求 owner approval**。它們由 changed-path review policy、project validation、專項 regression / browser smoke 等客觀驗證處理。

這是刻意的高自動化設計：因為 label/branch 無法證明 Codex 或 Claude 身分，所以不再使用「假定是某 agent」來決定安全 gate。

### Control / governance 變更

以下協作控制面仍需要 owner 對目前完整 head SHA 的人工核准，例如：
- `.github/workflows/**`
- `.github/CODEOWNERS`
- `tools/ai-workflow*`
- `tools/ai-path-guard*`
- `tools/ai-orchestrator*`
- 對應 governance regression tests
- `AI_WORKFLOW.md`、`AI_ORCHESTRATION.md`、`AGENTS.md`、`CLAUDE.md`

`ai:handoff` 本身是 routing escalation，不是作者證據，也不單獨觸發 owner gate；真正觸發人工 root-of-trust 的是 control/governance path。

owner approval 只接受 owner 建立的 PR issue comment，不接受 GitHub APPROVED review。留言必須在目前 head 已至少產生一個 workflow run 後建立，全文完全等於：

```text
/ai approve-handoff <完整 40 字元 head SHA>
```

raw REST payload 必須同時滿足：
- `user.login` 是 repository owner，`user.type === "User"`。
- `author_association === "OWNER"`。
- `performed_via_github_app` 欄位存在且嚴格等於 `null`。
- `created_at === updated_at`。
- `created_at` 不早於 GitHub 對該 exact head SHA 的最早 workflow run。
- body byte-for-byte exact match，不做 trim。

`performed_via_github_app === null` 只代表 GitHub 沒把留言歸因於 GitHub App，不是一般性的「實體鍵盤輸入」證明；因此人工 gate 同時綁 exact SHA、freshness 與 required checks。

Required contexts 維持：
- `project-validate`
- `guard`

## CI 最低回歸要求

Project validation 必須覆蓋：
- identity / routing / provenance 分離
- label 或 branch 改動不能移除 changed-path specialist review
- routing conflict 只能升級，不能降級
- production guard 不得退回 legacy `classifyPr()` / `evaluateGuard()` security decision
- 非 control path 不因 mutable routing metadata 觸發 owner gate
- control path 無論 routing hint 為何都需要 hardened exact-SHA owner gate
- owner approval provenance／freshness／exact-command regressions
- tier-aware Claude receiver schema 與 exact-head completion
- 原有 orchestration、runtime JavaScript、canonical assets、Case 3 專項驗證

## 失敗處理

- CI fail：讀 log 並修正，不繞過測試。
- reviewer receiver fail：保留失敗證據，可 rerun；不能標記 completed。
- merge conflict：以 Canon 與 regression tests 為基準。
- agent 無法啟動：改人工或另一 agent，不偽造 acknowledgement。
- binary／缺 patch：review 必須明示限制。

## Repository admin

Secrets、App credentials、branch rules、required checks 等外部設定由 owner 管理。Claude receiver 使用 `CLAUDE_CODE_OAUTH_TOKEN`；secret、認證、額度、rate limit 等錯誤必須顯示 failed，不能當成 review 完成。
