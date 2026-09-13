from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Restore route unlocks from completed actions when loading older or
# partially-written v4 saves. Every successful market_role in the current
# design unlocks the bookstall, so the completed action is a safe source of
# truth even when the saved `unlocked` array is stale or incomplete.
old = "if(state.evidence.indexOf('runner_account')!==-1)unlock('bookstall');if(state.evidence.indexOf('consent_note')!==-1||state.done.indexOf('book_pages')!==-1)state.flags.deductionReady=true;"
new = "if(state.evidence.indexOf('runner_account')!==-1)unlock('bookstall');if(state.done.indexOf('market_role')!==-1)unlock('bookstall');if(state.evidence.indexOf('consent_note')!==-1||state.done.indexOf('book_pages')!==-1)state.flags.deductionReady=true;"
if old in text:
    text = text.replace(old, new, 1)
elif new not in text and "state.done.indexOf('market_role')!==-1||state.done.indexOf('book_owner')!==-1" not in text:
    raise SystemExit('save-route fix pattern not found')

# Recover every route that can be proven from already-completed actions.
# Without this, a partially-written Safari/localStorage snapshot can retain
# `done` while losing `unlocked`; replaying a completed non-dynamic action does
# not execute its unlock side effect again, which can permanently trap a save.
old_route = "if(state.evidence.indexOf('waste_route')!==-1||state.evidence.indexOf('zhou_motive')!==-1)unlock('market');if(state.evidence.indexOf('runner_account')!==-1)unlock('bookstall');if(state.done.indexOf('market_role')!==-1)unlock('bookstall');state.flags.deductionReady="
new_route = "if(state.done.indexOf('tea_ask')!==-1)unlock('print');if(state.evidence.indexOf('waste_route')!==-1||state.evidence.indexOf('zhou_motive')!==-1||state.done.indexOf('print_zhou')!==-1)unlock('market');if(state.evidence.indexOf('runner_account')!==-1||state.done.indexOf('market_runner')!==-1||state.done.indexOf('market_role')!==-1||state.done.indexOf('book_owner')!==-1||state.done.indexOf('book_search')!==-1||state.done.indexOf('book_stub')!==-1||state.done.indexOf('book_pages')!==-1)unlock('bookstall');state.flags.deductionReady="
if old_route in text:
    text = text.replace(old_route, new_route, 1)
elif new_route not in text:
    raise SystemExit('case1 completed-action route recovery pattern not found')

# A valid location is not necessarily an unlocked location. If the `unlocked`
# array was partially written, loading a stale location could either jump the
# player into a future scene or strand them somewhere the map says is locked.
# Reconcile current/visited locations only after route reconstruction.
location_guard = "if(state.unlocked.indexOf(state.location)===-1){state.location='tea';for(var vi=state.visited.length-1;vi>=0;vi--){if(state.unlocked.indexOf(state.visited[vi])!==-1){state.location=state.visited[vi];break}}}state.visited=state.visited.filter(function(id){return state.unlocked.indexOf(id)!==-1});if(state.visited.indexOf(state.location)===-1)state.visited.push(state.location);"
route_anchor = new_route + "state.evidence.indexOf('consent_note')!==-1||state.done.indexOf('book_pages')!==-1;"
if location_guard not in text:
    if route_anchor not in text:
        raise SystemExit('case1 location reconciliation anchor not found')
    text = text.replace(route_anchor, route_anchor + location_guard, 1)

# Guard against an older role-patch template accidentally restoring a clerk
# branch that labels second-hand market routine information as direct runner
# testimony. Current narrative intentionally delays runner_account until the
# bookstall owner confirms the delivery.
text = text.replace(
    "else if(state.role==='clerk'){gain('clerk_audit');gain('runner_account');unlock('bookstall');lines=['你把三家攤販說的收紙日期逐一排在一起，發現它們指向同一個固定跑腿少年。','其中一名攤販補充：完整的紙通常會被送去舊書攤。固定流程比任何單一證詞都更可靠。'];}",
    "else if(state.role==='clerk'){gain('clerk_audit');unlock('bookstall');lines=['你把三家攤販說的收紙日期逐一排在一起，發現它們指向同一個固定跑腿少年。','其中一名攤販補充：完整的紙通常會被送去舊書攤。你先把這條固定流程記下，尚不能把它當成少年本人的證詞。'];}",
    1,
)

# BUILD 4.1.3: reporter/veteran market-role branches explicitly send the
# player to the bookstall as the first-hand source. Requiring a separate
# print-role clue after that instruction created an unannounced backtrack and
# contradicted the branch text. Their interviewing/observation role itself is
# sufficient to obtain the owner's first-hand confirmation; clerk still
# requires clerk_audit so the procedural route remains distinct.
old_owner_gate = "if(has('reporter_last_touch')||has('veteran_boundary')||has('clerk_audit')){gain('runner_account');"
new_owner_gate = "if(state.role==='reporter'||state.role==='veteran'||has('clerk_audit')){gain('runner_account');"
if old_owner_gate in text:
    text = text.replace(old_owner_gate, new_owner_gate, 1)
elif new_owner_gate not in text:
    raise SystemExit('bookstall first-hand source fix pattern not found')

# BUILD 4.1.4: runner_account can be established either by the runner himself
# (worker/teacher/common route) or independently by the bookseller who received
# the pages (clerk/reporter/veteran route). Calling the record "少年說法" falsely
# claims that every role heard the runner directly. Use source-neutral wording
# while keeping the same evidence id and all gameplay requirements intact.
text = text.replace(
    "runner_account:{name:'少年說法',type:'證詞',desc:'少年把較完整、寫滿字的紙交給舊書攤老闆。'},",
    "runner_account:{name:'紙張交接確認',type:'證詞',desc:'可確認跑腿少年把較完整、寫滿字的紙交給舊書攤老闆；來源可能是少年本人或收紙老闆的第一手確認。'},",
    1,
)
text = text.replace('少年說法加入案件紀錄。', '紙張交接確認加入案件紀錄。')
text = text.replace("['runner','少年說法']", "['runner','紙張交接確認']", 1)

# Case 1 save integrity: `deductionReady`, `finished`, and `failed` are derived
# states. Older/partially-written localStorage snapshots must not be able to
# open deduction early, jump straight to the ending, or remain failed with
# positive focus. Rebuild those states from facts the player actually has.
old_integrity = "if(state.evidence.indexOf('consent_note')!==-1||state.done.indexOf('book_pages')!==-1)state.flags.deductionReady=true;if(state.focus<=0&&!state.finished)state.failed=true;if(state.finished){finishCase();return}if(state.failed){failCase();return}"
new_integrity = "state.flags.deductionReady=state.evidence.indexOf('consent_note')!==-1||state.done.indexOf('book_pages')!==-1;var canFinish=state.flags.deductionReady&&state.deductionStep>=deduction.length&&deduction.every(function(step){return state.evidence.indexOf(step.need)!==-1});state.finished=!!canFinish;state.failed=!state.finished&&state.focus<=0;if(state.finished){finishCase();return}if(state.failed){failCase();return}"
if old_integrity in text:
    text = text.replace(old_integrity, new_integrity, 1)
elif "var canFinish=state.flags.deductionReady&&state.deductionStep>=deduction.length&&deduction.every(function(step){return state.evidence.indexOf(step.need)!==-1});state.finished=!!canFinish;state.failed=!state.finished&&state.focus<=0;if(state.finished){finishCase();return}if(state.failed){failCase();return}" not in text:
    raise SystemExit('case1 derived-state normalization pattern not found')

# Visible build/diagnostic markers make stale Safari/GitHub Pages caches easy
# to distinguish while keeping repeated deployments idempotent.
text = text.replace('BUILD 5.1.4・CASE 02', 'BUILD 5.1.6・CASE 02')
text = text.replace("。BUILD 5.1.4'", "。BUILD 5.1.6'")
text = text.replace('case2-engine.js?v=10', 'case2-engine.js?v=12')
text = text.replace('BUILD 4.1.3・SOURCE FIX', 'BUILD 4.1.4・EVIDENCE FIX')
text = text.replace("。BUILD 4.1.3'", "。BUILD 4.1.4'")
text = text.replace('BUILD 4.1.2・ROUTE FIX', 'BUILD 4.1.4・EVIDENCE FIX')
text = text.replace("。BUILD 4.1.2'", "。BUILD 4.1.4'")
text = text.replace('BUILD 4.1.1・SAVE FIX', 'BUILD 4.1.4・EVIDENCE FIX')
text = text.replace("。BUILD 4.1.1'", "。BUILD 4.1.4'")
# Repair diagnostic strings damaged by the old non-idempotent 4.1-prefix
# replacement without touching later legitimate versions.
text = re.sub(r"。BUILD 4\.1\.(?:2|3|4)(?:\.1)+(?=')", "。BUILD 4.1.4", text)

if text == original:
    print('Save/route/source/evidence fixes already present; no changes required')
    raise SystemExit(0)

path.write_text(text, encoding='utf-8')
print('Applied Case 1 route/save integrity and continuity fixes')
