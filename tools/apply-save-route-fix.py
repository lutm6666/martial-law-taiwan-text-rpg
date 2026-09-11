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
elif "if(state.done.indexOf('market_role')!==-1)unlock('bookstall');" not in text:
    raise SystemExit('save-route fix pattern not found')

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

# Visible build/diagnostic markers make stale Safari/GitHub Pages caches easy
# to distinguish while keeping repeated deployments idempotent.
text = text.replace('BUILD 4.1.2・ROUTE FIX', 'BUILD 4.1.3・SOURCE FIX')
text = text.replace("。BUILD 4.1.2'", "。BUILD 4.1.3'")
text = text.replace('BUILD 4.1.1・SAVE FIX', 'BUILD 4.1.3・SOURCE FIX')
text = text.replace("。BUILD 4.1.1'", "。BUILD 4.1.3'")
# Repair diagnostic strings damaged by the old non-idempotent 4.1-prefix
# replacement without touching later legitimate versions.
text = re.sub(r"。BUILD 4\.1\.(?:2|3)(?:\.1)+(?=')", "。BUILD 4.1.3", text)

if text == original:
    print('Save/route/source fix already present; no changes required')
    raise SystemExit(0)

path.write_text(text, encoding='utf-8')
print('Applied BUILD 4.1.3 source continuity fix')
