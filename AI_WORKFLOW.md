# 雙 AI 協同工作模式

本專案採用「Codex / ChatGPT 主責 Canon、邏輯、測試與整合；Claude 主責前端實作，並在 Codex 主導的玩家呈現變更上提供第二視角審查」的協作方式。目標不是讓兩個 AI 重複做同一件事，而是用不同專長降低單一模型盲點。

GitHub Issue、PR、CI、路徑守門與 review 記錄是共同協作介面；任何 agent 的文字回覆都不能取代實際 CI、browser smoke、commit 或 PR 證據。

## 角色

### Codex / ChatGPT

主責：
- `case*-canon.js`
- `case*-engine.js`
- `CASE*_DESIGN.md`
- `CASE*_IMPLEMENTATION.md`
- tests、validators、browser smoke
- GitHub Actions、回歸測試、存檔相容性
- 證據鏈、推理條件、防劇透邊界與最終整合

原則：
- Canon、engine、證據邊界或推理條件變更必須有相對應測試。
- 不用 UI 文案替代資料層判定。
- Codex 若修改玩家呈現層，仍依既有 ownership／owner guard 規則處理。

### Claude

直接派給 Claude 的實作任務主責：
- UI renderer
- HTML / CSS
- responsive、accessibility、tap targets
- interaction polish、手機版體驗

在 Codex / ChatGPT 主導的 PR 中，Claude 預設改為唯讀第二視角，檢查：
- 可讀性、overflow、手機 UX
- 玩家看到的文案與圖片是否提前暴露線索或破壞證據邊界

Claude review 不執行 PR 程式、不修改檔案、不建立 commit、不 approve、不 merge；具體禁止修改範圍以 `CLAUDE.md` 與 guard 為準。

### Handoff / 人工

適用：
- 同時跨 Canon／logic 與 UI／asset 的大型改動
- 美術資產的最終取捨
- workflow／policy／guard 等協作控制層修改
- repository admin、secrets、required checks、branch rules 等外部設定

## 三級 review policy

第二個 AI 不再對每一個 PR 都自動啟動。`tools/ai-workflow.review.js` 會依 **實際 changed files** 判斷風險；rename 同時檢查 `previous_filename`，避免把受保護檔案改名後降級。

| 等級 | 典型變更 | 自動第二 AI |
| --- | --- | --- |
| Tier 1 / local validation | tests、validators、smoke harness、implementation notes、其他明確不影響玩家畫面或核心邏輯的局部變更 | 不自動啟動；只跑既有 CI／回歸 |
| Tier 2 / counterpart review | UI、非 `tools/`／`.github/` 的 client HTML/JS、CSS／SCSS、responsive、accessibility、`assets/**` 玩家呈現資產 | 自動要求對側 AI review |
| Tier 3 / full-risk review | Canon、engine、`CASE*_DESIGN.md`、workflow／policy／control、logic+presentation 混合、handoff | 自動要求對側 review；handoff 要兩邊 review；既有 owner guard 照常執行 |

具體效果：
- Codex Tier 1 PR：不再為了純測試／純 validator 修改自動消耗 Claude review。
- Codex Tier 2／3 PR：自動要求 Claude review。
- Claude Tier 2 PR：自動要求 Codex review。
- 新增的 client renderer 即使未採 `case*-ui.js` 命名，只要位於 `tools/`、`.github/` 之外的 HTML/JS，也預設至少 Tier 2；已知 Canon／engine／control 先按其高風險規則分類，不會因 `.js` 副檔名誤判成純 UI。
- `assets/**` 預設視為玩家呈現資產，因此圖片、音訊、字型或未來的呈現資料至少 Tier 2；二進位 patch 若無法供 reviewer 讀取，review 必須明確標示限制，不能宣稱已檢查內容。
- Handoff Tier 3 PR：Codex + Claude 都要 review。
- Human branch 會依 changed paths 推斷 review 需求，但不推斷作者身分；純 UI 會按 Claude ownership 路由，純 asset 仍保留 human ownership但要求 Claude review，logic+presentation 則升為 handoff。
- Tier 1 若先前殘留 `needs:codex-review`／`needs:claude-review` 或無意義的 `review:retry`，workflow 會清除。

Tier 1 仍可由 repository writer 在 PR 留言全文：

```text
@claude review
```

手動要求 Claude review。這是 opt-in escalation，不會改變 guard 或 owner approval 規則。

`review:retry` 只重送本來就需要的自動交叉審查；它不把 Tier 1 強制升級。Tier 1 若要第二 AI，使用人工 review 入口。

## 為什麼分級

雙 AI 的價值是獨立視角，不是增加 agent 數量。標準順序是：

```text
實作者
  ↓
自動測試 / browser smoke
  ↓
需要時才啟動第二 AI 靜態審查
  ↓
修正
  ↓
最終 CI / guard
```

Claude 的靜態 review 不能宣稱已做瀏覽器實測；CI 通過也不能宣稱 Claude 已 review。兩種證據分開記錄。

## 分支命名

- Claude：`claude/<topic>` 或 `ai/claude-<issue>-<topic>`
- Codex：`codex/<topic>` 或 `ai/codex-<issue>-<topic>`
- Handoff：`handoff/<topic>`

禁止 AI 直接 push `main`。功能與協作控制修改一律走 PR。

## Issue 派工

使用 AI task template 與 `dispatch:ready`。只解析精確的 Workstream／Area；Goal 或 Constraints 中的關鍵字不參與 routing。

| 分類 | 路由 |
| --- | --- |
| Canon / Logic / State / Tests；Save / Migration；CI / Tests | `ai:codex` + `area:logic` |
| Frontend / UI / Responsive / Accessibility | `ai:claude` + `area:ui` |
| Art / Assets | `ai:handoff` + `area:art` |
| Mixed / Cross-boundary；Unsure；未知分類 | `ai:handoff` |
| Repository admin / Settings | `ai:handoff` + `area:admin` |

Routing label 只表示「路由已準備」，不代表接收端已接手。真正接手要有 receiver run／task 證據；完成要有 commit／PR 與驗證結果。

只有 GitHub Actions bot + Actions App id 15368 的控制 marker 被視為可信；人工偽造 marker 不能阻止派工或 review。

## PR 交叉審查

`AI Cross Review` 從可信 base checkout 執行 `tools/ai-workflow.review.js`。同一份 tier policy 同時決定：
- risk tier
- inferred ownership（只用於 review routing，不宣稱作者身分）
- exact reviewer set
- `needs:*` labels
- review request comments

因此不再先算一套 `plan.reviewers`、再交給另一套分類器重新決定 reviewer；避免 human UI／asset 或未來新路徑出現「receiver 已跑但 request label/comment 不一致」。

Tier 2／3 的 request：
- reviewer 含 Codex → `needs:codex-review`
- reviewer 含 Claude → `needs:claude-review`
- Handoff → 兩者

Draft、closed、fork PR 不自動送 review。新 head SHA 重新判斷 tier 並重新去重；不能沿用舊 SHA 的 completed marker。

`needs:*` 或 request comment 只表示 **request sent**，不等於 receiver 完成。只有明確的 completed marker、run link 與相同完整 head SHA 才能視為該次 review 完成。

## Claude review receiver

`claude-review.yml` 對自動 Tier 2／3、且 reviewer set 含 Claude 的 PR 啟動 Claude；Tier 1 的自動事件會在 prepare 階段直接停止，不呼叫模型。

人工 writer 的 `@claude review` 仍可在任何 tier 執行。

安全邊界：
- checkout 可信 default branch 控制程式，不 checkout／執行 PR head。
- PR patch 由 API 建立唯讀 `claude-review-input.json`。
- snapshot 包含 exact head SHA、review tier、reasons 與 file patches。
- Claude tools 僅 Read／Glob／Grep；禁用 Bash／Edit／Write／Agent／Task。
- Tier 2 主要檢查 UX、a11y、readability、overflow、tap target、spoiler 與可取得 patch 的玩家呈現資產。
- Tier 3 另外檢查靜態 patch 可見的 Canon／evidence boundary、state-facing risk、workflow/control safety。
- Claude 不得把靜態閱讀描述成 runtime verification。
- 二進位資產沒有文字 patch 時，只能確認路徑、風險層級與周邊程式，不能把它當作完成內容審查。

只有 Claude 執行成功、回傳 SHA 與 requested head 完全相同且 summary 非空，控制程式才發布 `Claude review completed`。

目前 workflow 使用 `tools/ai-workflow.claude-review.js`。既有 `tools/claude-review.js` 暫留作相容／舊回歸基準，但同樣列入 Tier 3 control path，避免日後修改時被當成普通檔案。

## 路徑守門與 owner approval

`ai-path-guard.yml` 使用 `pull_request_target`，只執行 trusted base policy，不 checkout PR head。production guard 固定載入 trusted base 的 `tools/ai-path-guard.runtime.js`；CI 會檢查不得指回舊的弱版 `tools/ai-workflow.js#runGuard`。

既有 ownership 邊界維持：
- Claude 不得修改 Canon、engine、核心設計、tests、validators、workflow、policy、guard/control。
- Claude 若需要跨界，先改成 sole `ai:handoff`。
- Codex 修改既有受 guard 規範的 UI／CSS、任何 handoff、任何 guard/control 修改，都需要 owner 對 **目前完整 head SHA** 的核准。

owner approval 只接受 owner 親自建立的 PR issue comment，不再接受 GitHub APPROVED review。留言必須在目前 head 已經至少產生一個 workflow run 之後建立，全文必須完全等於：

```text
/ai approve-handoff <完整 40 字元 head SHA>
```

核准留言的 raw REST payload 必須同時滿足：
- `user.login` 是 repository owner，`user.type === "User"`。
- `author_association === "OWNER"`。
- `performed_via_github_app` 欄位存在且嚴格等於 `null`；GitHub App／ChatGPT Codex Connector 代發不算人工核准。
- `created_at === updated_at`，任何已記錄編輯都使核准失效。
- `created_at` 不早於 GitHub 對該 exact head SHA 記錄到的最早 workflow run。
- body 不做 trim；前後空白、換行、短 SHA、舊 SHA 或額外文字都不接受。

`performed_via_github_app === null` 只代表 GitHub 沒有把留言歸因於 GitHub App，不是「實體鍵盤輸入」的一般性證明。因此 control-path 核准仍綁 exact SHA、freshness 與 required checks。AI 不得代替 owner 留下這個核准。新 commit 會使舊 SHA 核准失效。owner approval 與 Claude/Codex review 是兩種不同證據，互不替代。

Required contexts 維持：
- `project-validate`
- `guard`

不可 force push、刪除測試、停用 guard 或偽造 check 來讓 PR 通過。

## CI

`Project validation` 必須驗證：
- `tools/ai-workflow.js`
- tier policy 與 tier-aware Claude receiver 語法
- hardened owner approval helper、production guard runtime 與 workflow contract
- owner approval provenance／freshness／exact-command 回歸測試
- 原有 AI workflow regression tests
- `tools/test-ai-workflow.review.js` 的分級與 exact-routing 回歸
- orchestration regressions
- runtime JavaScript 與 canonical assets
- Case 3 有關變更時另跑 schema、engine regression、desktop/mobile browser smoke

分級 policy 的最低回歸案例包括：
- smoke／validator-only Codex PR → Tier 1，無自動 Claude。
- UI Codex PR → Tier 2，Claude review。
- UI Claude PR → Tier 2，Codex review。
- 新命名 client renderer／HTML → 至少 Tier 2。
- `assets/**` → 至少 Tier 2；Codex／human asset 會要求 Claude review。
- Canon／engine／workflow／legacy receiver → Tier 3。
- logic+asset 或 logic+UI → Tier 3。
- handoff → Tier 3 + 雙邊 review。
- logic+presentation human PR → Tier 3 handoff review。
- rename Canon → 仍為 Tier 3。
- Tier 1 新 head 會清理 stale `needs:*`／`review:retry`。
- tier policy 的 `reviewers` 必須與實際建立的 label/comment 完全一致。
- Tier 1 仍可人工 `@claude review`。

## 失敗處理

- CI fail：先讀 log，不繞過測試。
- reviewer receiver fail：保留失敗證據，可 rerun；不能標記 completed。
- merge conflict：以 Canon 與現有 regression test 為基準。
- agent 無法啟動：改人工或另一 agent，不偽造 acknowledgement。
- binary／缺 patch：review 必須明確標示限制。

## Repository admin

Secrets、App credentials、branch rules、required checks 等外部設定由 owner 管理。Claude receiver 使用 `CLAUDE_CODE_OAUTH_TOKEN`；secret 缺失、認證失敗、額度或 rate limit 錯誤都必須顯示 failed，不能當成 review 完成。
