from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Keep the production patch idempotent. Worker/teacher role actions explicitly
# make the runner remember that complete written pages went to the bookstall;
# persist the matching runner_account evidence so later bookstall logic does
# not incorrectly claim the player lacks that information.
continuity_marker = "if(['worker','teacher'].indexOf(state.role)!==-1)gain('runner_account');"
if continuity_marker not in text:
    old = "if(['worker','teacher','merchant','homemaker'].indexOf(state.role)!==-1)unlock('bookstall');return{complete:state.role!=='student'||has('wrapped_scrap'),lines:t[state.role]||['你換了一個熟悉的角度觀察市場。']}}}"
    new = "if(['worker','teacher'].indexOf(state.role)!==-1)gain('runner_account');if(['worker','teacher','merchant','homemaker'].indexOf(state.role)!==-1)unlock('bookstall');return{complete:state.role!=='student'||has('wrapped_scrap'),lines:t[state.role]||['你換了一個熟悉的角度觀察市場。']}}}"
    if old not in text:
        raise SystemExit('hotfix pattern not found: market role runner-account continuity')
    text = text.replace(old, new, 1)

# Visible version markers make stale GitHub Pages / Safari caches easy to spot.
text = text.replace('BUILD 4.0.2・DEBUG', 'BUILD 4.0.3・DEBUG')
text = text.replace('。BUILD 4.0.2', '。BUILD 4.0.3')

if text == original:
    print('Pages hotfix already present; no changes required')
    raise SystemExit(0)

path.write_text(text, encoding='utf-8')
print('Applied Pages continuity hotfix to index.html')
