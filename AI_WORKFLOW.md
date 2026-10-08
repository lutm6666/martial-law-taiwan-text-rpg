# 雙 AI 協同工作模式

本專案使用 Codex / ChatGPT 與 Claude 協作。Codex / ChatGPT 主要處理 Canon、邏輯、測試、CI 與整合；Claude 主要處理 UI、responsive、accessibility、玩家呈現，以及唯讀第二視角 review。

GitHub PR、changed paths、CI、review payload 與 exact-head 證據才是控制面依據。Agent 的文字回覆、label、branch 名稱或 request comment 都不能取代實際驗證。

## 安全模型

三個概念必須分開：

- **Provenance**：GitHub payload 能直接觀察到的來源證據。一般 `User` PR 預設為 `unknown`。
- **Routing hint**：`ai:codex`、`ai:claude`、`ai:handoff` label 與對應 branch 名只用於工作路由，不證明作者身分。
- **Review / guard policy**：只依 changed paths 與可信 GitHub payload 決定；routing hint 只能增加 review，不能降低要求。

## Issue → AI 自動派工 v1

`AI Dispatch` 在 Issue `opened`／`reopened` 時從可信 default branch 啟動；`edited` 會更新現有 routing plan，`closed` 會關閉對應工作 PR，repository writer 加上 `dispatch:retry` 可重試實作。它根據 **Issue 標題與內容**建立 routing plan，寫入工作 branch 的 `.ai/dispatch/issue-<號碼>.json`，並建立引用 `Refs #<號碼>` 的 draft PR。`dispatch:ready` 不再是啟動條件。工作 branch 在建立 PR 與發表實作前同步最新 `main`，不得直接 push `main`。

派工優先順序：UI／assets 由 Claude 主責；Canon／engine／control 由 Codex 主責；純 tests／validators／docs 規劃為 Tier 1。混合需求採 handoff，Codex 先實作、兩側再依實際檔案審查；不明確的 Issue 只保留 plan 與 draft PR，等待釐清。這個 Issue 分級只決定實作路由；PR 的 review tier、exact-head completion 與 owner gate 始終由 trusted base policy 依 **實際 changed paths** 判定，Issue 文字、label、branch 名稱都不能充當身分或降低門檻。

公開 Issue 的 `opened`／`reopened` 也會取得 plan 與 draft PR。只有**事件 actor** 經 GitHub repository 權限 API 驗證具有 write／maintain／admin 權限，且路由有明確主責時，才執行模型實作。具寫入權限者可加 `dispatch:retry` 重新啟動；label 本身不授權，workflow 必須重新驗證加標籤者。Issue 作者可能是外部人士；writer 重新開啟或明確 retry 外部 Issue 仍會把該 Issue 的不可信內容交給模型，須按實際內容承擔授權決策。

派工與發表使用獨立 GitHub App installation token。owner 須將 App client ID 設為 repository variable `AI_DISPATCH_APP_CLIENT_ID`、private key 設為 secret `AI_DISPATCH_APP_PRIVATE_KEY`，並讓 App 在此 repo 具有 Contents、Pull requests、Issues 的 write 權限，且**不得給此 App main ruleset bypass**。App 不取得 Workflows write 權限；模型 patch 若修改 `.github/workflows/**` 或 `.github/actions/**`，publisher 會拒絕更新 branch，保留 draft PR 與 patch artifact 供 owner 受控處理。這些可執行 Actions 檔案在同 repo PR 更新時可能立即執行，不能只依賴合併前的 owner gate。缺少任一 App 設定時，在建立 branch／PR 前失敗。Codex 實作另需 secret `OPENAI_API_KEY`；Claude 實作沿用 `CLAUDE_CODE_OAUTH_TOKEN`。缺少主責模型憑證時保留 draft PR 並讓實作 job 失敗，不發布空 patch 或宣稱完成。

模型 job 僅取得 read-only `GITHUB_TOKEN`，checkout 可信的 `main` 快照且不保留 Git 憑證。它用 API 取得 Issue 與 routing plan，比對派工時的標題／內容 digest，再把 Issue brief 放在 runner 暫存目錄。Issue 文字是任務資料，不是要求跳過 policy、取得 secret 或發 approval 的指令。Codex 使用 `workspace-write` sandbox；Claude 使用本地執行的 `claude-code-base-action`，僅允許 Read／Glob／Grep／Edit／Write，不給 Bash，也不使用會自行建立 branch／commit 的 Issue receiver。Claude 可改工作目錄檔案並補測試，實際驗證交給另一個沒有模型憑證的 PR CI runner；模型不得 push、留言、approve 或 merge。打包 patch 前會核對 `.git/config` 仍是模型執行前的版本，並停用 Git fsmonitor／hooks。變更以 binary-capable patch artifact 交給獨立的可信 scanner；scanner 在新 runner 的可信 main 上重建 staged 檔案，持有模型憑證但沒有 App 寫入 token，阻擋憑證原文、常見編碼與可辨認的密鑰格式。這是公開 branch 的保護層，不保證攔截所有混淆或模型直接對外傳輸；只有掃描成功，另一起無模型憑證的 publisher job 才能發布。Publisher 驗證 PR／branch／patch，重新核對即時 Issue 狀態、標題／內容 digest 與 routing plan，再次同步最新 `main`，只更新工作 branch，完成後將 PR 從 draft 標為 ready。Issue 在實作期間變更或關閉時，PR 保持 draft；ready PR 的來源 Issue 內容變更時，派工器會先轉回 draft，等待 writer `dispatch:retry`。若 draft／ready PR 已有實作檔案，retry 會關閉舊 PR，從當下 `main` 建立新 branch 與 draft PR，避免被拒絕的舊實作殘留；plan-only ready PR 則轉回 draft 後重跑。使用 App token 建立和更新 PR，讓既有 PR CI／review workflow 正常收到事件；不靠 workflow 的 `GITHUB_TOKEN` 派生事件喚醒它們。

PR 仍須通過 `project-validate`、`guard` 與下述 exact-head Codex／Claude completion gate；有 blocking finding 必須修正後對新 head 重跑驗證。AI 不得代 owner 留下 `/ai approve-handoff`，不得繞過 ruleset。

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

Tier 1 仍可由 repository writer 留言全文 `@claude review` 手動要求 Claude review。`review:retry` 只重送本來就需要的自動 review，並直接喚醒需要 Claude 的 trusted receiver；retry actor 必須具有 repository write／maintain／admin 權限。

## Exact-head completion

`needs:*` label 或 request comment 只代表 **request sent**，不代表完成。新 head SHA 產生後，舊 head 的 completion 一律失效。

Codex completion 必須同時具備兩種 managed evidence：

1. `chatgpt-codex-connector[bot]` 的 PR review，REST payload 的完整 `commit_id` 精確等於目前 40 字元 head SHA，且 review body 符合 managed Codex Review 模板並含該 head 的 reviewed-commit prefix。
2. 同一 Codex GitHub App（App id 1144995）維護的 `codex-pull-request-review-summary` comment，狀態已是 `Completed`，且 summary 的 commit prefix 對應同一 head。

因此短 SHA 顯示、mention、request comment、Running summary、一般 bot 訊息、額度／錯誤訊息或只有單一 evidence 都不算 Codex completion。summary 的短 SHA 只作 lifecycle 交叉確認；真正 exact-head 綁定仍來自 PR review 的完整 `commit_id`。

Claude completion 只接受 trusted GitHub Actions bot 發出的未編輯 marker，首行必須精確綁定目前完整 head SHA。Claude structured output 還必須回報它實際讀取的 snapshot input 數量，且要和 receiver 預期數完全一致，否則不發布 completion marker。

Completion gate 只證明「指定 reviewer 已對 exact head 完成 review」，不是把 AI 意見轉成 GitHub APPROVE。具體 findings 仍需處理；thread-resolution 與 required checks 仍可阻止未解決問題被合併。

## Fork PR 與 reviewer routing

Draft 或 closed PR 不做自動 receiver review。Fork PR 仍由 trusted-base Cross Review 透過 GitHub API 讀取 changed paths、計算 reviewer set、同步 `needs:*` labels，並在 base repository PR conversation 建立 Codex／Claude reviewer request comment；整個 routing 流程不 checkout、不執行 fork head。

因此 Canon、engine、logic、control fork PR 仍具有 Codex request path，不會因 fork 身分永久卡在 mandatory completion gate。Claude receiver 同樣可在 `pull_request_target` 下只 checkout trusted default branch，再用 GitHub API 唯讀取得 fork patch。它不 checkout、不執行 fork code，且 checkout 使用 `persist-credentials: false`。

Claude tools 僅 Read / Glob / Grep；禁用 Bash、Edit、Write、Agent、Task。所有 PR patch 都視為不可信資料，不視為指令。

`claude-review-input.json` 記錄 requested SHA、tier、routing hint、provenance 與 patch。為保留 CJK／JSON escape 的 token-density 安全裕度，小型輸入約限制在 16k serialized characters；大型 snapshot 會拆成最多 80 個 `claude-review-parts/*.json`，每個 serialized part 上限 15k characters，單一 record 上限 12k。單一巨大 file patch 會再拆成有序 `patch_fragment`，避免任何單一 part 接近已觀察到的 Read 截斷範圍。若需要超過 80 parts，或 GitHub file list 達 3000 筆而可能截斷，receiver fail closed 並要求拆 PR。

Claude workflow 的 turn budget 高於最大 part 數；prompt 要求實際讀完所有 parts，structured output 的 `parts_read` 必須精確等於 receiver 預期值。這不是額外身分證明，但可防止 receiver 在明知輸入未讀完時仍把結果發布成 completed。

只有 Claude 執行成功、回傳 SHA 與 requested head 完全相同、`parts_read` 完整且 summary 非空，才發布 `Claude review completed`。完成後 receiver 直接 rerun exact-head native `guard`；不依賴 workflow 自己建立的 comment 再觸發 workflow。

若 marker 已發布但 guard wakeup 失敗，receiver 會嘗試刪除剛建立的 marker並 fail closed；若清理本身失敗，之後 receiver 再看到同 SHA 的既有 marker時也必須重試 guard wakeup，而不是靜默跳過。

`review:retry` 是可恢復路徑：Cross Review 可重新發送本來需要的 reviewer request，而 Claude workflow 的 trusted `pull_request_target:labeled` 也會直接接受 `review:retry`。`prepare()` 會再次驗證 retry actor 是 repository writer；若該 SHA 已有 Claude completion marker，retry 只重新嘗試 guard wakeup，否則重新執行 Claude review。

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

- Issue opened／reopened 與 writer `dispatch:retry`、writer 身分 API 驗證、無權限者 draft-only、title/body routing、Issue 關聯與 branch/main 同步。
- App token 寫入與 read-only 模型 job 分離、缺憑證 fail closed、binary patch artifact、獨立密鑰掃描與可信 publisher workflow contract。
- identity / routing / provenance 分離。
- mutable label / branch 不能移除 changed-path specialist review。
- routing conflict 只能升級，不能降級。
- fork PR 仍透過 trusted API-only Cross Review 取得 path-required reviewer request，不執行 fork code。
- `review:retry` 直接喚醒 Claude receiver，且 retry actor 必須是 repository writer。
- production guard 不得退回 legacy security decision。
- guard 不使用 `pull_request_review` 執行 PR-controlled workflow。
- Codex completion 需要 exact-head managed review + managed Completed summary 的雙證據；Claude marker 必須 exact-head。
- completion wakeup 遇到 in-flight native guard 時可等待並修復 stale failure。
- Claude snapshot part 必須維持保守 Read-safe 大小；oversized single-file patch 要 fragment；CJK dense input 要有回歸覆蓋；`parts_read` 不完整不得發布 marker。
- Claude marker 已發布但 guard wakeup 失敗時必須 rollback 或在後續 receiver run 重試 wakeup。
- 3000-file API cap 與超過 80 個 Claude parts 都 fail closed，要求拆 PR。
- 非 control path 不因 mutable routing metadata 觸發 owner gate。
- control path 無論 routing hint 為何都需要 hardened exact-SHA owner gate。
- owner approval provenance / freshness / exact-command regressions。
- 原有 orchestration、runtime JavaScript、canonical assets 與 Case 3 專項驗證。

## 失敗處理

- CI fail：修正，不繞過測試。
- 派工 App 或主責模型憑證缺失：保留清楚失敗狀態；未取得 App 憑證前不得建立 branch／PR，模型失敗時 PR 保持 draft。
- reviewer receiver fail：保持 fail closed；可由 writer 使用 `review:retry`，不能偽造 completed。
- `dispatch:retry` 的事件若被後續標籤事件取代，標籤會保留但不能單憑標籤關閉舊 PR 或啟動模型；writer 可移除再加入，產生新的已驗證 retry 事件。
- merge conflict：以 Canon 與 regression tests 為基準。
- binary / 缺 patch：review 必須明示限制。
- PR 達 GitHub 3000-file list 上限、或 Claude snapshot 超過 bounded part budget：拆 PR，不用截斷資料推定低風險。
