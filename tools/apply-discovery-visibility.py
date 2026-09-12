from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Remove the retired legacy text-RPG entry point from the title screen and init code.
text = re.sub(r'\n\s*<button id="legacyLink"[^>]*>開啟舊版文字 RPG</button>', '', text, count=1)
text = text.replace("$('legacyLink').onclick=function(){location.href='legacy.html'};", '')

# Discovery-gated actions: an action should not reveal information the player has
# not actually learned yet. Hidden means unknown, rather than a disabled spoiler.
if 'function actionVisible(id)' not in text:
    marker = 'function renderScene(){'
    if marker not in text:
        raise SystemExit('discovery patch pattern not found: renderScene')
    helper = """function actionVisible(id){
 if(id==='market_runner')return has('waste_route')||has('worker_handling')||has('runner_account');
 if(id==='book_owner')return has('runner_account')||has('merchant_flow')||has('homemaker_network')||has('student_context')||done('book_stub');
 if(id==='book_search')return has('runner_account')||has('merchant_flow')||has('homemaker_network')||(state.role==='student'&&has('student_context'))||done('book_owner');
 if(id==='book_pages')return has('archive_pages');
 return true;
}
"""
    text = text.replace(marker, helper + marker, 1)

text = text.replace('loc.actions.forEach(function(id){', 'loc.actions.filter(actionVisible).forEach(function(id){', 1)

# Re-checking the bookseller must not invent a prior statement from the runner.
# Some routes establish runner_account from the bookseller himself, so keep the
# confirmation source-neutral on repeated visits.
text = text.replace('這和少年的說法一致。', '這和目前已確認的紙張交接一致。')

# Visible build marker for cache/debug verification.
text = re.sub(r'BUILD 4\.2(?:\.\d+)?・[A-Z ]+', 'BUILD 4.2.1・CONTINUITY', text)
text = re.sub(r'。BUILD 4\.2(?:\.\d+)?', '。BUILD 4.2.1', text)
text = re.sub(r'BUILD 4\.1(?:\.\d+)?・[A-Z ]+', 'BUILD 4.2.1・CONTINUITY', text)
text = re.sub(r'。BUILD 4\.1(?:\.\d+)?', '。BUILD 4.2.1', text)

if text == original:
    print('Discovery/continuity cleanup already present; no changes required')
    raise SystemExit(0)

path.write_text(text, encoding='utf-8')
print('Applied discovery-gated actions, continuity wording fix, and removed legacy entry point')
