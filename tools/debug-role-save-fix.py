from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# 1) Existing 4.0.x saves may have print_role marked done with cached prose,
# but without the real role evidence introduced in 4.1. Make the action
# recomputable, and migrate affected saves so the button becomes actionable.
old_dynamic = "dynamic={print_waste:1,market_role:1,book_owner:1}"
new_dynamic = "dynamic={print_waste:1,print_role:1,market_role:1,book_owner:1}"
if old_dynamic in text:
    text = text.replace(old_dynamic, new_dynamic, 1)

migration_anchor = "if(!roles[state.role])state.role='student';"
migration_code = "var roleClue={student:'student_context',worker:'worker_handling',clerk:'clerk_audit',reporter:'reporter_last_touch',teacher:'teacher_context',merchant:'merchant_flow',veteran:'veteran_boundary',homemaker:'homemaker_network'}[state.role];if(state.done.indexOf('print_role')!==-1&&roleClue&&state.evidence.indexOf(roleClue)===-1){state.done=state.done.filter(function(id){return id!=='print_role'});delete state.flags.actionResults.print_role;}"
if migration_code not in text:
    if migration_anchor not in text:
        raise SystemExit('debug patch pattern not found: loadCase role migration')
    text = text.replace(migration_anchor, migration_anchor + migration_code, 1)

# 2) Clerk market route was recording runner_account even though the player had
# only reconstructed a routine from stallholders. Keep the route unlock, but
# let the actual runner evidence be established later at the bookstall.
old_clerk = "else if(state.role==='clerk'){gain('clerk_audit');gain('runner_account');unlock('bookstall');lines=['你把三家攤販說的收紙日期逐一排在一起，發現它們指向同一個固定跑腿少年。','其中一名攤販補充：完整的紙通常會被送去舊書攤。固定流程比任何單一證詞都更可靠。'];}"
new_clerk = "else if(state.role==='clerk'){gain('clerk_audit');unlock('bookstall');lines=['你把三家攤販說的收紙日期逐一排在一起，發現它們指向同一個固定跑腿少年。','其中一名攤販補充：完整的紙通常會被送去舊書攤。你先把這條固定流程記下，尚不能把它當成少年本人的證詞。'];}"
if old_clerk in text:
    text = text.replace(old_clerk, new_clerk, 1)

# Visible build marker helps distinguish a stale Safari cache from this fix.
text = text.replace('BUILD 4.1・ROLE PATHS', 'BUILD 4.1.1・SAVE FIX')
text = text.replace('。BUILD 4.1', '。BUILD 4.1.1')

if text == original:
    print('Role/save debug fixes already present; no changes required')
    raise SystemExit(0)

path.write_text(text, encoding='utf-8')
print('Applied role/save continuity debug fixes to index.html')
