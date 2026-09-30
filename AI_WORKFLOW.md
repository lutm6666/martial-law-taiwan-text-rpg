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
- 不主動大改 UI／CSS；跨界須由 owner 核准目前 head SHA，並要求 Claude review。
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

## Issue 派工與接收證據

使用「AI task」模板並保留 `dispatch:ready`。只解析精確的 Workstream／Area 欄位；Goal 或 Constraints 中的關鍵字不影響路由。

| 分類欄位 | 路由 | 區域 |
| --- | --- | --- |
| Canon / Logic / State / Tests；Canon / Logic / State；Save / Migration；CI / Tests | `ai:codex` | `area:logic` |
| Frontend / UI / Responsive / Accessibility；Frontend / UI | `ai:claude` | `area:ui` |
| Art / Assets | `ai:handoff` | `area:art` |
| Mixed / Cross-boundary；Unsure；未知或缺少分類 | `ai:handoff` | `area:logic` |
| Repository admin / Settings | `ai:handoff` | `area:admin` |

非 repository writer 的一般事件進入 handoff；權限 API 的 403／5xx 則讓 workflow fail，不能當作無權限而默默派給 handoff。重複分類欄位會明確 fail，互相矛盾的分類會要求 owner 確認。

派送以 Issue number 串行，執行時讀取最新 body、state 與 labels。只增刪本流程管理的 `ai:*`、`area:*` 標籤，保留其他標籤。可信的 Actions 控制留言會原地更新；內容／路由 revision 相同則不重發。只信任 `github-actions[bot]`、Bot 類型及 GitHub Actions App id 15368 的 marker；舊版可信 v1 記錄會遷移。

**路由準備不是已接手。** 本版不在 Issue 發送未驗證的 `@codex Implement`／`@claude Implement`：Codex Issue → 自動實作尚未驗證，repo 也沒有 Claude receiver workflow。請手動建立 agent 任務並附上 Issue、規則與驗收條件。確認接手要有接收端 run／任務連結，完成要有對應 commit／PR 與驗證結果。[Issue #7](https://github.com/lutm6666/martial-law-taiwan-text-rpg/issues/7) 的既有「設定完成」記錄不足以證明兩個接收端都可運作。

修改 body 會重新分類；repository writer 加 `dispatch:retry` 可重新準備同一 revision。重試成功才移除該標籤，失败時保留供人工調查。修復 API／token 問題後也可重跑失敗 run。關閉或取消 `dispatch:ready` 的 Issue 不派送。concurrency 僅提供互斥，不保證每個中間事件都保留；最新狀態為準。

## PR 交叉審查

- Claude PR → `needs:codex-review`，發送 `@codex review`。
- Codex PR → `needs:claude-review`，發送 `@claude` review 請求。
- Handoff PR → 兩邊都要 review。
- Draft、關閉與 fork PR 不自動送 agent 請求。

依 PR number 串行，依 agent + head SHA 去重，執行前讀取最新 PR。可信舊 marker 仍可去重；人工貼相同 marker 不會阻止請求。新 SHA 重新發送；writer 加 `review:retry` 可明確重送，全部成功後才移除標籤。所有 API 錯誤都會 fail，部分成功的請求可用 marker 恢復。

`needs:*` 與請求留言只表示 **request sent**，不能表示 receiver 已接收／review 完成。尤其 Actions token 產生的留言不會再觸發一般 `issue_comment` Actions workflow；外部 App 是否接收須分別驗證。Claude receiver 的 workflow、credential 與 bot actor 政策仍需另外設定；本次不修改外部設定。若已有 Codex Automatic reviews，須由 owner 決定單一請求來源，避免 Automatic reviews 與 workflow mention 兩邊都送；目前去重範圍只涵蓋本 workflow。

## 路徑守門與 handoff

`ai-path-guard.yml` 對 PR 事件使用 `pull_request_target`，只 checkout 當前 base SHA 的 policy；不 checkout／執行 PR head。以 API 取得 head SHA、完整 changed files、comments 與 reviews，以原生 GitHub Actions job **`guard`** 提供 required context，另發布 `ai-ownership-policy` 作為 head SHA 的診斷紀錄。單獨用 Checks API 建立同名成功紀錄，在本 repo 的 ruleset 實測仍顯示 expected，因此 required guard 必須保留原生 job。owner review 事件會重跑原生 guard；Issue comment 事件則檢查最新 PR 並更新該 head 上最近完成的原生 guard，找不到時明確 fail。

路由 label 必須只有一個；label 與 branch ownership 衝突時 fail。唯一的 `ai:handoff` 可覆蓋原 branch 所有權。一般 human branch 不推測 agent 身分。

Claude 不得改動 Canon、engine、核心設計、tests、validators、workflow、policy 文件與 guard 程式；即使有 owner 核准仍必須先改成 sole `ai:handoff`。rename 同時檢查原路徑與目的路徑。Codex 改 UI／CSS、任何 handoff、任何 guard／協作控制檔修改，都必須先由 repository owner 核准 **目前完整 head SHA**。

owner 可用正式 APPROVED review（最新狀態、commit id 必須等於 head SHA），或親自留言：

```text
/ai approve-handoff <完整 40 字元 head SHA>
```

留言須為 owner 本人、User 類型、全文精確符合指令。owner 自己開 PR 時可使用留言；AI 不得代寫 owner 核准。新 commit 使舊核准失效。owner 核准不代表 AI review 已完成。此規則是協作責任邊界；有 repository write 權限者本身可修改其他 Actions workflow，因此不把它宣稱為對任意 writer 的完整隔離。

## CI 與首次遷移

目前 ruleset 的 required check context 是 **`project-validate`**、**`guard`**，來源是 GitHub Actions App；workflow 顯示名稱不是 context。保持名稱不變，本次不修改 ruleset／branch protection。

`Project validation` 會執行 `node tools/test-ai-workflow.js`。Case 3 相關檔案有變動時另跑 schema validator、engine regression 與 Chrome smoke playthrough。

PR #10 已合併，首次遷移已完成。原 bootstrap 只用來安裝新 base policy，現在必須移除，避免後續 PR 的 skipped `guard` 與真正的原生 `guard` 同名。原生 check 的 `external_id` 是 GitHub 產生的 UUID，不能以「external_id 為空」判斷；owner 留言更新需匹配目前 head SHA、Actions App、完成且非 skipped 的原生 Actions job URL。

用下列最小案例驗證實際 Actions／receiver 行為；成功的政策檢查仍不能代表 receiver 已接收。

| 驗證案例 | 預期結果 |
| --- | --- |
| writer 開 logic Issue，Goal 包含 UI 字樣 | sole `ai:codex` + `area:logic`；一則 route-prepared 控制留言 |
| 同 Issue 重跑 opened／labeled；保留其他 label | 不新增留言；其他 label 保留 |
| 人工貼 dispatch／review marker | 不抑制可信請求 |
| 改分類成 UI，或 writer 加 retry | 舊 owned label 清除；同控制留言更新；retry 成功後移除 |
| actor 權限 API 403／5xx | run fail，不能誤落 handoff |
| 同 SHA 重複 PR 事件；再推新 SHA | 每 agent／SHA 一次；新 SHA 再請求一次 |
| Claude rename engine 到普通檔名 | `guard` failure，原路徑仍被保護 |
| Codex UI／handoff／policy 修改沒有核准 | `guard` failure；加目前 SHA 的 owner 指令後 success |
| 已核准後再推 commit；多個 ai label | `guard` failure，須重新核准／消除衝突 |
| Checks API 權限不足 | workflow fail／required `guard` 未通過；不偽造成功 |
| PR 修改自己的 guard 為 always-pass | 仍執行 base policy，變更不影響本 PR 的守門結果 |
| Claude review 請求只有留言而無 receiver run | 保持 request sent；人工接手，不能宣稱 review 完成 |

本機回歸使用 API mock，不證明 App／credential／token 的真實環境權限。接收端與首次 base 切換必須以 Actions logs、head Check Run 與 agent 任務／review 記錄驗證。

## 失敗處理

- CI fail：先讀 log，不得繞過測試。
- merge conflict：以 Canon 與現有 regression test 為基準，不用舊 UI 蓋回新邏輯。
- agent 無法啟動：保留派工標籤與 handoff 訊息，改由人工或另一 agent 接手。
- 不可用 force push、刪除測試、停用 guard 來讓 PR 通過。

## Repository admin 設定

目前 required contexts 維持 `project-validate` 與 `guard`。CI 失敗先讀 log；required check 名稱、token／App 權限、receiver credentials 等外部設定須由 owner 另行檢查。本修正不變更這些設定，也不安裝或啟用新的 receiver。
