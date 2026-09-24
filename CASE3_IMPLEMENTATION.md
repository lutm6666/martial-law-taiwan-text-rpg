# 第三案實作規格｜第十三張底片

狀態：第一階段系統規格。依據 CASE3_DESIGN.md Canon 候選基準，不接入正式案件選單、不改動 Case 1／2 runtime。

## 1. Runtime 邊界

第三案採與第二案相同的「薄入口＋延遲載入正式 runtime」方向，但使用完全獨立 namespace。

建議檔案：
- `case3-film-canon.js`：純資料、規則與題目定義。
- `case3-film-engine.js`：狀態、渲染、互動與存檔。
- 後續正式接入時才修改 `case2-engine.js` 的案件選擇器／第二案結案入口。

本階段不建立上述 runtime 檔案；先固定 schema 與依賴圖。

### Save namespace
`mist-taiwan-case3-film-v1`

不得讀寫：
- Case 1 的 `mist-taiwan-case-save-v4`
- Case 2 既有 rain save key

## 2. State schema

```js
{
  version: 1,
  playerName: "",
  phase: "investigate", // investigate | deduction | done
  loc: "studio",

  visited: ["studio"],
  unlocked: ["studio", "darkroom", "alley", "newsstand"],

  evidence: [],       // E01...
  conclusions: [],    // C01...
  testimonies: [],    // T01...
  hypotheses: {},     // key -> { status, revision, createdAt }

  actionsDone: {},    // action id -> true
  observations: {},   // observation id -> true
  frameAnalysis: {
    personMovement: false,
    movingObject: false,
    fixedBackground: false,
    continuityComplete: false,
    handoffSupported: false
  },

  keys: {
    b084: false,
    packageMarkPartial: false,
    m317: false
  },

  flags: {
    b084SeenOutsideStudio: false,
    b084LedgerMatched: false,
    xiulianSawPhoto: false,
    strongerInterpretationKnown: false,
    xiulianAccessWindowKnown: false,
    looseFilmProcedureKnown: false,
    e10Found: false,
    e10Verified: false,
    xiulianAdmission: false
  },

  deduction: {
    index: 0,
    answers: [],
    ending: null
  }
}
```

### 正規化原則
載入舊／損壞存檔時：
- 非陣列 collection 回復空陣列。
- 非物件 flags/actionsDone/observations/hypotheses 回復空物件。
- loc 不在合法 locations 時回 studio。
- phase 非合法值時依 finished 狀態回 investigate 或 done。
- 不因 schema migration 自動授予證據或結論。
- 所有 unlock 必須可由現有 state 重新推導。

## 3. 資料 schema

### locations
```js
{
  studio: {
    name: "明光照相館",
    sub: "前台與完成件區",
    actions: [...]
  }
}
```

硬規則：name/sub 只能描述已知場所或中性環境，不描述案件答案。

### evidence
```js
{
  E01: {
    name: "A-217 接觸印樣",
    type: "照片／文件",
    description: "...",
    images: [],
    dynamicName: null
  }
}
```

E10 特例：
- 未驗證：`舊零片中的單格負片`
- C14 完成後：`A-217 第 13 格原片`

### conclusions
```js
{
  C01: {
    text: "...",
    requires: { evidence:["E01","E02"], observations:[] }
  }
}
```

Conclusion 不得由單一 action 直接硬塞；必須由條件函式確認 prerequisite。

### testimonies
```js
{
  T01: {
    speaker: "蔡阿成",
    text: "...",
    verification: "unverified" // unverified | partially_supported | supported
  }
}
```

verification 可因後續證據改變，但原始 testimony 文本不改寫。

### hypotheses
只有玩家實際選擇建立時才產生。

```js
hypotheses.H_SIDE_DOOR = {
  status: "active", // active | revised | withdrawn
  revision: 0,
  createdAt: "alley",
  text: "側門可能被刻意用來避開他人視線。"
}
```

新證據不得自動替玩家撤回假說；只解鎖 review action。

## 4. 初始地圖與自由調查

案件開始後：

**立即可去**
- studio｜明光照相館
- darkroom｜暗房／工作間
- alley｜後巷側門
- newsstand｜街口書報攤

其中 studio 為起點；其餘三處在完成開場基本檢查後開放。

**條件開放**
- chen_home｜陳家：取得「秀蓮曾看過 B-084」的自然線索後。
- supplier｜照相材料行：`frameAnalysis.continuityComplete && keys.packageMarkPartial`
- loose_film_search：不是新 location；屬 studio 回訪 action。需 `flags.looseFilmProcedureKnown` 且缺片時間窗已縮小。
- final_xiulian_followup：不是新 location；陳家回訪 action。需 `flags.e10Verified`。

禁止用「完成第 N 場」作為唯一解鎖條件。

## 5. 場景依賴圖

```text
                         ┌──────────── darkroom ────────────┐
                         │                                  │
START → studio opening ──┼──────────── alley ───────────────┼──→ frame continuity
                         │                                  │          │
                         └──────────── newsstand ────────────┘          │
                                      │                                │
                                      ├→ B-084 key → studio ledger     │
                                      │                 │              │
                                      └→ Xiulian lead → chen_home      │
                                                                        │
B-084 enlargement → partial package mark ────────────────────────────────┤
                                                                        ▼
                                           [continuity + package mark]
                                                        │
                                                        ▼
                                                    supplier
                                                        │
                                      M-317 full key + supplier record
                                                        │
                                                        ▼
                                          studio receiving ledger
                                                        │
                                                        ▼
                                              business context

darkroom/workflow + B-084 ledger → missing window narrowed
chen_home + E09 duty record      → Xiulian access opportunity
                     │
                     └──────────────┐
                                    ▼
                        studio loose-film procedure
                                    │
                                    ▼
                           search old loose films
                                    │
                                  E10
                                    │
                         final frame verification
                                    │
                                  C14
                                    │
                       chen_home final follow-up
                                    │
                         Xiulian admission + detail
                                    │
                                    ▼
                              final deduction
```

## 6. 關鍵 unlock predicates

以 predicate 集中管理，不把條件散落在 button render code。

```js
canTracePackage(state) =
  state.frameAnalysis.continuityComplete &&
  state.keys.packageMarkPartial

canFindB084Ledger(state) =
  state.keys.b084

canCheckReceivingLedger(state) =
  state.keys.m317

canVisitChenHome(state) =
  state.flags.xiulianSawPhoto

canSearchLooseFilms(state) =
  state.flags.looseFilmProcedureKnown &&
  hasConclusion("C_MISSING_WINDOW")

canVerifyE10(state) =
  hasEvidence("E10") &&
  state.frameAnalysis.continuityComplete

canFinalAskXiulian(state) =
  state.flags.e10Verified &&
  state.flags.xiulianAccessWindowKnown
```

任何 predicate 只回答「玩家是否具有執行理由／所需資訊」，不得暗示 predicate 成立後的答案。

## 7. 影格比對 mechanic

玩家不需要固定比較三對照片。系統追蹤三個 observation category：

- `personMovement`
- `movingObject`
- `fixedBackground`

每類至少完成一個有效比較後：
```js
continuityComplete =
  personMovement &&
  movingObject &&
  fixedBackground
```

完成後建立：
- C04｜現有證據一致支持第 13 格屬於這組連續拍攝影像。
- C05｜第 12～14 格共同支持紙袋由一名男子轉到另一名男子手中。

不得在此階段寫入兩名男子姓名。

## 8. 包件追查

partial mark 來源：B-084 放大照片只能辨認局部 `…317` 與部分材料行標記。

只有影格連續性已完成時，UI 才允許把這個標記作為「照片中實際交接物」的追查入口。

supplier 完成後：
- E07｜材料行配送簿
- keys.m317 = true

回 studio 查 receiving ledger：
- E08｜明光照相館收貨紀錄

兩者成立後才建立業務背景 conclusion。

## 9. 秀蓮線的狀態化對話

### 未完成 M-317 線
秀蓮：
> 「哥哥說那只是店裡的貨。」

紀錄為 testimony，狀態 unverified。

### 已完成 E07＋E08
相同說法可以標記為 supported by independent records，但 UI 不把她的話改寫成「她說的是真的」。

### 9/21 接觸機會
E09 是例行店務／值班紀錄中的一行，不是為案件特製的便條。

只建立：
> 9/21 晚秀蓮屬於能接觸 A-217 的人員之一。

不得自動建立「秀蓮剪片」假說。

## 10. E10 最終原片流程

1. 玩家先知道照相館如何處理無法歸件的單格負片。
2. 解鎖「查看舊零片」。
3. 取得 E10，名稱仍為「舊零片中的單格負片」。
4. 使用既有影格比對能力與 E01／12／14 驗證。
5. 驗證依據：影像一致、序列連續、片幅／齒孔／外觀一致、裁切位置相容。
6. flags.e10Verified = true。
7. E10 顯示名稱更新為「A-217 第 13 格原片」。
8. 解鎖陳家最終回訪。
9. 主角只說「第 13 格找到了」，不透露位置。
10. 秀蓮自行說出舊零片藏匿細節，再承認剪片。

行為結論與動機 testimony 分開保存。

## 11. Deduction gate

最終六問不以「蒐集全部證物」為條件，而以必要結論完成為 gate。

最低必要：
- 原片曾存在且 9/19 仍可使用。
- frame continuity complete。
- handoff supported。
- E07＋E08 business context。
- E10 verified。
- Xiulian admission recorded。

六問順序依 CASE3_DESIGN.md，不在題目標題洩漏答案。

## 12. Ending classifier

六問不是單純答對數計分。

錯誤答案依推理類型累積：
- `image_literalism`
- `overcorrection`
- `forced_origin`

若六題全部符合 evidence boundary → `evidence_boundary` 正確結局。

若失敗，依玩家實際選擇中最明確的錯誤類型決定對應結局；不得因單一早期假說存在就判錯，因為假說可以被修正／撤回。

## 13. UI renderer 需求

Case 3 的紀錄頁至少需要四個 filter：
- 證物 E
- 結論 C
- 證詞／時間 T
- 假說 H

手機版不新增第五個底部 tab；沿用「紀錄」tab 內部切換，避免底部導航過密。

H 卡片顯示：
- 目前狀態
- 建立時的原始文字
- 後續修正紀錄
- 支持／衝突的新資料

E10 dynamic name 必須由 verified flag 決定。

## 14. 防劇透測試

每個 action 定義需有：
- label
- hint
- requires
- effects

code review 時檢查 label/hint 不得引用 effects 才會揭示的資訊。

例如：
```js
{
  id:"inspect_loose_films",
  label:"查看舊零片",
  hint:"依照相館的整理方式，檢查尚未歸件的單格負片。",
  requires:["looseFilmProcedureKnown","missingWindowKnown"],
  effects:["gain:E10"]
}
```

禁止：
`label:"尋找被秀蓮藏起的第13格"`

## 15. 第一階段驗收條件

開始寫 runtime 前，規格必須能通過：
1. 正向路徑：studio → darkroom → alley → newsstand → supplier → chen_home → final。
2. 亂序路徑：studio → newsstand → chen_home → darkroom → alley → supplier → final。
3. 另一亂序路徑：studio → darkroom → alley → supplier lead pending → newsstand → supplier → chen_home → final。
4. 任一路徑都不能在 E07＋E08 前把「正常收貨」升格為已驗證事實。
5. 任一路徑都不能在 E10 驗證前把它命名為第13格原片。
6. 任一路徑都不能自動建立玩家未選過的 H。
7. Case 3 save 不得改變 Case 1／2 localStorage。
