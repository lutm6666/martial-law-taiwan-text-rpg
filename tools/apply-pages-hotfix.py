from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Newer builds already contain the fixes this legacy production hotfix used to
# inject. Treat that state as success so the deploy workflow remains
# idempotent instead of failing because an old search pattern disappeared.
current_hotfix_markers = (
    "zhou_motive:{name:'周老闆的顧慮'",
    "need:'zhou_motive'",
    "var first=has('wrapped_scrap')?",
)
if all(marker in text for marker in current_hotfix_markers):
    print('Pages hotfix already present; no changes required')
    raise SystemExit(0)


def replace_once(old, new, label):
    global text
    if old not in text:
        raise SystemExit(f'hotfix pattern not found: {label}')
    text = text.replace(old, new, 1)

# Production build marker, useful for detecting stale Safari/GitHub Pages caches.
text = text.replace('BUILD 4.0・PROLOGUE', 'BUILD 4.0.1・HOTFIX')
text = text.replace('。BUILD 4.0', '。BUILD 4.0.1')

# Give Zhou's stated self-protection motive its own record so the deduction UI
# does not claim the borrowing ledger directly proves his motive.
replace_once(
    "waste_route:{name:'廢紙去向',type:'情報',desc:'印刷行的廢紙固定交給市場跑腿少年帶走。'},wrapped_scrap:",
    "waste_route:{name:'廢紙去向',type:'情報',desc:'印刷行的廢紙固定交給市場跑腿少年帶走。'},zhou_motive:{name:'周老闆的顧慮',type:'證詞',desc:'周老闆承認他真正擔心的是寫有人名的訪談紙從店裡流出，替自己與生意惹來麻煩。'},wrapped_scrap:",
    'zhou motive evidence'
)
replace_once(
    "gain('waste_route');unlock('market');state.flags.zhouCracked=true;",
    "gain('waste_route');gain('zhou_motive');unlock('market');state.flags.zhouCracked=true;",
    'gain zhou motive'
)
replace_once(
    "correct:'selfprotect',need:'print_ledger'",
    "correct:'selfprotect',need:'zhou_motive'",
    'deduction evidence for motive'
)

# Worker/teacher can jog the runner's memory through rapport even without the
# paper scrap. Do not narrate a paper scrap the player never obtained.
old_runner = "gain('runner_account');unlock('bookstall');return{complete:true,lines:['少年看過你手裡的紙角，終於想起來。那捆紙大多被拿去墊箱；幾張完整、又寫滿字的紙，他覺得拿來包吃的東西不妥，就交給舊書攤老闆。','舊書攤被標進地圖。']}}}"
new_runner = "gain('runner_account');unlock('bookstall');var first=has('wrapped_scrap')?'少年看過你手裡的紙角，終於想起來。那捆紙大多被拿去墊箱；幾張完整、又寫滿字的紙，他覺得拿來包吃的東西不妥，就交給舊書攤老闆。':(state.role==='worker'?'你先幫少年把手邊的貨搬完，再照印刷行、廢紙捆與那一天的順序慢慢問。他終於想起：幾張完整、又寫滿字的紙被他交給舊書攤老闆。':'你沒有逼少年立刻回答，而是把時間、地點一項項帶著他回想。他終於記起：幾張完整、又寫滿字的紙被他交給舊書攤老闆。');return{complete:true,lines:[first,'舊書攤被標進地圖。']}}}"
replace_once(old_runner, new_runner, 'runner conditional narration')

# Student role action previously referred to a paper scrap even when it had not
# been found yet.
replace_once(
    "student:['你把紙角上的「夜班」與先前記下的相鄰頁內容比對，句型很接近。']",
    "student:has('wrapped_scrap')?['你把紙角上的「夜班」與先前記下的相鄰頁內容比對，句型很接近。']:['你先把第 16、18 頁的內容與市場常見的包裝紙尺寸記下來；若能找到帶有相同字跡的紙角，就能進一步比對。']",
    'student market role narration'
)

# Normalize v4 saves before rendering failure/completion/game screens. This
# avoids crashes from partially written or earlier v4 state objects.
pattern = re.compile(r"function loadCase\(\)\{.*?\}function showEvidence", re.S)
replacement = """function loadCase(){var s=load();if(!s){$('bootStatus').textContent='找不到可讀取的案件存檔。';return}state=s;if(!state.flags)state.flags={};if(!state.flags.actionResults)state.flags.actionResults={};if(typeof state.flags.mistakes!=='number')state.flags.mistakes=0;if(!Array.isArray(state.unlocked))state.unlocked=['tea'];if(state.unlocked.indexOf('tea')===-1)state.unlocked.unshift('tea');if(!Array.isArray(state.visited))state.visited=['tea'];if(!Array.isArray(state.evidence))state.evidence=[];if(!Array.isArray(state.people))state.people=[];if(!Array.isArray(state.done))state.done=[];if(!Array.isArray(state.history))state.history=[];if(!locations[state.location])state.location='tea';if(!roles[state.role])state.role='student';if(typeof state.name!=='string'||!state.name.trim())state.name='無名調查者';if(typeof state.focus!=='number'||!isFinite(state.focus))state.focus=MAX_FOCUS;state.focus=Math.max(0,Math.min(MAX_FOCUS,state.focus));if(typeof state.deductionStep!=='number'||state.deductionStep<0)state.deductionStep=0;if(state.failed){failCase();return}if(state.finished){finishCase();return}currentTab='scene';showGame()}function showEvidence"""
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit('hotfix pattern not found: loadCase normalization')

if text == original:
    print('Pages hotfix already present; no changes required')
    raise SystemExit(0)

path.write_text(text, encoding='utf-8')
print('Applied Pages hotfix to index.html')
