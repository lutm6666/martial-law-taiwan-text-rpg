from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# BUILD 4.1.2: restore route unlocks from completed actions when loading older
# or partially-written v4 saves. Every successful market_role in the current
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

text = text.replace('BUILD 4.1.1・SAVE FIX', 'BUILD 4.1.2・ROUTE FIX')
text = text.replace('。BUILD 4.1.1', '。BUILD 4.1.2')

if text == original:
    print('Save/route fix already present; no changes required')
    raise SystemExit(0)

path.write_text(text, encoding='utf-8')
print('Applied BUILD 4.1.2 save/route continuity fix')
