from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Case 2 is a new gameplay stage, not a replacement for Case 1. Keep the
# visible build marker and runtime error diagnostic on the same version.
BUILD = '5.0.4'
text = re.sub(r'BUILD (?:4\.6|5\.0(?:\.\d+)?)・[^<]+', f'BUILD {BUILD}・CASE 02', text, count=1)
text = re.sub(r'(偵測到執行錯誤：[^\n]*?。BUILD )(?:4\.6|5\.0(?:\.\d+)?)', rf'\g<1>{BUILD}', text, count=1)

# Case 1 can be completed through several role-specific evidence routes. Some
# routes prove the waste-paper flow and recover the pages without ever getting
# the runner's first-hand account. Keep the ending limited to facts every
# successful route actually establishes instead of inventing testimony the
# player may never have obtained.
old_ending = '你把三頁紙按頁碼放回阿川面前。它們不是被誰刻意偷走，而是在印刷行整理時混進廢紙，跟著跑腿少年到了市場，最後被舊書攤老闆夾進破字典。'
new_ending = '你把三頁紙按頁碼放回阿川面前。現有證物支持它們在印刷行整理時混進廢紙，沿著日常廢紙流向到了市場，最後在舊書攤的破字典裡被找回；至於每一段究竟經過誰的手，只有取得對應證詞時才能進一步確認。'
if old_ending in text:
    text = text.replace(old_ending, new_ending, 1)
elif new_ending not in text:
    raise SystemExit('case1: ending continuity text not found')

# The Case 2 engine also writes the build label when the player enters Case 2.
# Keep that runtime label synchronized with the page build; otherwise Safari
# cache diagnosis becomes misleading immediately after entering the case.
engine_path = Path('case2-engine.js')
engine = engine_path.read_text(encoding='utf-8')
engine_original = engine
engine = re.sub(r"build\.textContent='BUILD 5\.0(?:\.\d+)?・CASE 02'", f"build.textContent='BUILD {BUILD}・CASE 02'", engine, count=1)
if f"BUILD {BUILD}・CASE 02" not in engine:
    raise SystemExit('case2: runtime build marker not found')

# A syntactically valid but incomplete localStorage object used to pass load()
# unchanged. On Safari this can happen after an older build or an interrupted
# write and later crash in code that assumes arrays/objects exist. Normalize
# the stored shape and restore only invariant starting records, while keeping
# legitimate investigation progress intact.
old_load = "function load(){var v=parse(CASE2_KEY);return v&&v.caseId==='case2'?v:null}"
new_load = """function normalizeSave(v){if(!v||v.caseId!=='case2')return null;var p=case1Profile();v.version=1;v.name=typeof v.name==='string'&&v.name.trim()?v.name.trim():p.name;v.role=roles[v.role]?v.role:p.role;v.focus=typeof v.focus==='number'&&isFinite(v.focus)?Math.max(0,Math.min(MAX_FOCUS,Math.floor(v.focus))):MAX_FOCUS;v.witnessIndex=typeof v.witnessIndex==='number'&&isFinite(v.witnessIndex)?Math.max(0,Math.min(witnesses.length-1,Math.floor(v.witnessIndex))):0;v.pressed=v.pressed&&typeof v.pressed==='object'&&!Array.isArray(v.pressed)?v.pressed:{};v.solved=v.solved&&typeof v.solved==='object'&&!Array.isArray(v.solved)?v.solved:{};v.evidence=Array.isArray(v.evidence)?v.evidence.filter(function(id){return !!evidence[id]}):[];['margin_note','recovered_pages',roleClue(v.role)].forEach(function(id){if(v.evidence.indexOf(id)===-1)v.evidence.push(id)});v.people=Array.isArray(v.people)?v.people.filter(function(id){return !!people[id]}):[];['achuan','qiuyue'].forEach(function(id){if(v.people.indexOf(id)===-1)v.people.push(id)});v.flags=v.flags&&typeof v.flags==='object'&&!Array.isArray(v.flags)?v.flags:{};v.finalStep=typeof v.finalStep==='number'&&isFinite(v.finalStep)?Math.max(0,Math.min(finalQuestions.length,Math.floor(v.finalStep))):0;v.finished=!!v.finished;v.failed=v.finished?false:(!!v.failed||v.focus<=0);v.feedback=typeof v.feedback==='string'?v.feedback:'';v.history=Array.isArray(v.history)?v.history:[];return v}\nfunction load(){return normalizeSave(parse(CASE2_KEY))}"""
if old_load in engine:
    engine = engine.replace(old_load, new_load, 1)
elif 'function normalizeSave(v)' not in engine:
    raise SystemExit('case2: save loader hook not found')

if engine != engine_original:
    engine_path.write_text(engine, encoding='utf-8')

# GitHub Pages/browser caches can retain an old external JS file even after
# index.html changes. Normalize to one versioned script tag so Safari always
# receives the engine that belongs to this build.
script_tag = '<script src="case2-engine.js?v=5"></script>'
script_pattern = r'\s*<script src="case2-engine\.js\?v=\d+"></script>\s*'
text = re.sub(script_pattern, '\n', text)
marker = '</body>'
if marker not in text:
    raise SystemExit('case2: </body> marker not found')
text = text.replace(marker, script_tag + '\n' + marker, 1)

if text == original:
    print('Case 2 production hook already applied; no index changes.')
else:
    path.write_text(text, encoding='utf-8')
    print(f'Applied Case 2 production hook, BUILD {BUILD}, cache-busted engine tag, Case 2 save normalization, and Case 1 ending continuity fix.')
