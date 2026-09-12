from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Idempotent build label.
text = re.sub(r'BUILD 4\.2(?:\.\d+)?・[^<]+', 'BUILD 4.3・VISUAL CLUES', text, count=1)

# Visual investigation CSS.
if '.scene-visual{' not in text:
    marker = '@media(min-width:640px)'
    css = ".scene-visual{margin:0 0 12px;overflow:hidden;padding:0;position:relative;background:#111}.scene-visual img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#111}.scene-visual button{position:absolute;right:10px;bottom:42px;border:1px solid rgba(255,255,255,.3);background:rgba(15,15,12,.84);color:#eee7d8;border-radius:999px;padding:8px 11px;font-size:.76rem;cursor:pointer;-webkit-tap-highlight-color:transparent}.scene-visual .visual-note{display:block;margin:0;padding:9px 12px;background:#181a16;color:#aaa799;font-size:.76rem;line-height:1.5}.scene-visual.seen{border-color:#665d42}.scene-visual.seen button{background:rgba(52,49,35,.9)}.fail-visual{margin:0 0 15px;border-radius:14px;overflow:hidden;border:1px solid #5d443e;background:#111}.fail-visual img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}\n"
    if marker not in text:
        raise SystemExit('visual patch: CSS marker not found')
    text = text.replace(marker, css + marker, 1)

# Scene image / observation UI.
if 'id="sceneVisual"' not in text:
    old = '<section id="scenePanel"><p class="screen-title">現場調查</p><article class="scene card">'
    new = '<section id="scenePanel"><p class="screen-title">現場調查</p><figure id="sceneVisual" class="scene-visual card"><img id="sceneImage" alt=""><button id="observeSceneBtn" type="button">觀察場景</button><figcaption id="visualNote" class="visual-note">場景圖也可能藏著調查入口。</figcaption></figure><article class="scene card">'
    if old not in text:
        raise SystemExit('visual patch: scenePanel marker not found')
    text = text.replace(old, new, 1)

# Failure illustration and consequence story.
if 'id="failImage"' not in text:
    old = '<article class="fail-card card">\n    <p class="eyebrow">CASE FAILED</p><h2>推論失去可信度</h2>'
    new = '<article class="fail-card card">\n    <div class="fail-visual"><img id="failImage" alt="案件失敗後的夜間茶行"></div>\n    <p class="eyebrow">CASE FAILED</p><h2>推論失去可信度</h2>'
    if old not in text:
        raise SystemExit('visual patch: fail image marker not found')
    text = text.replace(old, new, 1)

old_fail = '<p>你把太多沒有被證明的猜測當成事實。到最後，就連真正重要的證詞也開始被錯誤的前提拖著走。</p>\n    <p id="failDetail" class="note"></p>'
new_fail = '<p>你把傳聞當成了證據，先一步找錯了人。</p>\n    <p>第二天，市場裡已經有人在談你昨晚四處追問姓名的事。周老闆收起笑容，跑腿少年也不肯再多看你一眼。</p>\n    <p>阿川把剩下的筆記收進布袋，低聲說：「先停在這裡吧。再問下去，事情會比三頁紙更麻煩。」</p>\n    <p>幾天後，秋月的名字從工廠裡悄悄消失了。</p>\n    <p id="failDetail" class="note"></p>'
if old_fail in text:
    text = text.replace(old_fail, new_fail, 1)
elif '你把傳聞當成了證據，先一步找錯了人。' not in text:
    raise SystemExit('visual patch: failure story marker not found')

# Tutorial text tells the player that scene observation is a mechanic.
old_tutorial = '教學案件：先調查，再推論。身分切入不只改變對話，也可能取得獨有情報、跳過前置條件或提早開啟調查路線。'
new_tutorial = '教學案件：先觀察現場，再調查與推論。場景圖中的物件可能決定接下來能問什麼；身分切入也可能取得獨有情報、跳過前置條件或提早開啟調查路線。'
if old_tutorial in text:
    text = text.replace(old_tutorial, new_tutorial, 1)

# Load image data before the inline engine.
if 'case1-art-tea.js' not in text:
    marker = '<script>\n(function(){'
    tags = '<script src="case1-art-tea.js?v=1"></script>\n<script src="case1-art-print.js?v=1"></script>\n<script src="case1-art-market.js?v=1"></script>\n<script src="case1-art-bookstall.js?v=1"></script>\n<script src="case1-art-failed.js?v=1"></script>\n'
    if marker not in text:
        raise SystemExit('visual patch: inline script marker not found')
    text = text.replace(marker, tags + marker, 1)

# Art metadata used by the investigation engine.
if 'var visualMeta={' not in text:
    marker = "var roles={student:'學生',worker:'工人',clerk:'公務員',reporter:'記者',teacher:'教師',merchant:'商人',veteran:'退伍軍人',homemaker:'持家者'};\n"
    insert = "var art=window.CASE1_ART||{};\nvar visualMeta={\n tea:{alt:'1958 年臺北茶行・傍晚',note:'傍晚。桌上的訪談冊與散頁值得仔細看。'},\n print:{alt:'1958 年臺北印刷行・午後',note:'午後。工作檯、帳簿與成捆紙張都可能留下流程痕跡。'},\n market:{alt:'1958 年臺北市場・白天',note:'白天。市場人多、物流快；先分清楚你真正知道要找誰。'},\n bookstall:{alt:'1958 年臺北舊書攤・下午',note:'午後。舊書堆裡仍可利用的紙常被另外保存。'}\n};\n"
    if marker not in text:
        raise SystemExit('visual patch: roles marker not found')
    text = text.replace(marker, marker + insert, 1)

# New saves carry visual observation state; old saves get it lazily.
text = text.replace("flags:{actionResults:{},mistakes:0},focus:MAX_FOCUS", "flags:{actionResults:{},mistakes:0,visualSeen:{}},focus:MAX_FOCUS", 1)
if 'function ensureVisualState()' not in text:
    marker = "function done(id){return state.done.indexOf(id)!==-1}\n"
    helper = "function ensureVisualState(){if(!state.flags)state.flags={actionResults:{},mistakes:0};if(!state.flags.actionResults)state.flags.actionResults={};if(!state.flags.visualSeen)state.flags.visualSeen={};}\n"
    if marker not in text:
        raise SystemExit('visual patch: done() marker not found')
    text = text.replace(marker, marker + helper, 1)

# Set failure art once the active game state is shown.
old_show = "function showGame(){hideAll();$('gameScreen').classList.remove('hidden');$('playerLabel').textContent=state.name+'・'+roles[state.role];renderFocus();setTab(currentTab)}"
new_show = "function showGame(){ensureVisualState();hideAll();$('gameScreen').classList.remove('hidden');$('playerLabel').textContent=state.name+'・'+roles[state.role];if(art.failed&&$('failImage'))$('failImage').src=art.failed;renderFocus();setTab(currentTab)}"
if old_show in text:
    text = text.replace(old_show, new_show, 1)
elif 'if(art.failed' not in text:
    raise SystemExit('visual patch: showGame marker not found')

# Image itself becomes a clue discovery step.
if 'function renderVisual()' not in text:
    marker = "function appendLines(lines){var box=$('sceneBody');box.innerHTML='';lines.forEach(function(t,i){var p=document.createElement('p');p.textContent=t;if(i===lines.length-1&&lines.length>1&&/收音機|制服|人名|報紙|麻煩/.test(t))p.className='atmosphere';box.appendChild(p)})}\n"
    functions = "function renderVisual(){ensureVisualState();var box=$('sceneVisual'),img=$('sceneImage'),btn=$('observeSceneBtn'),note=$('visualNote'),id=state.location,m=visualMeta[id];if(!m||!art[id]){box.classList.add('hidden');return}box.classList.remove('hidden');box.classList.toggle('seen',!!state.flags.visualSeen[id]);img.src=art[id];img.alt=m.alt;note.textContent=state.flags.visualSeen[id]?'已觀察：'+m.note:'點擊「觀察場景」。圖片中的物件可能決定你接下來能問什麼。';btn.textContent=state.flags.visualSeen[id]?'再次觀察':'觀察場景';btn.onclick=observeScene;img.onclick=observeScene;}\nfunction observeScene(){ensureVisualState();var id=state.location;state.flags.visualSeen[id]=true;var sets={tea:['你把視線從阿川移到桌面。訪談冊裝訂處有幾道不自然的斷口，像是幾張紙一起離開。','現在你知道該先檢查缺頁位置，而不是立刻猜誰拿走了紙。'],print:['午後光線照進工作檯。一本借物簿攤在紙堆旁，頁面上有連續的日期欄。','你先記住這本簿冊。它可能把「記得」變成可以核對的時間。'],market:['白日市場裡，一名少年抱著成捆紙張穿過攤位；花生攤附近也堆著幾張包裝紙。','如果你已知道印刷行的廢紙由跑腿少年帶走，現在你終於能辨認該找的是誰。'],bookstall:['午後斜光照進書攤。一本文字工具書攤得比其他書更開，書頁間露出幾張不同紙色的邊角。','只有在你已追到紙張可能流向舊書攤時，這個細節才值得進一步翻找。']};var lines=sets[id]||['你重新掃過現場，把真正看見的事實與自己的猜測分開。'];state.flags.lastResult={location:id,lines:lines};state.history.push({type:'observe',location:id});save();renderScene();}\n"
    if marker not in text:
        raise SystemExit('visual patch: appendLines marker not found')
    text = text.replace(marker, marker + functions, 1)

# Replace action visibility rules so noticing the object is a prerequisite,
# while role/evidence routes remain valid and old saves remain playable.
pattern = r"function actionVisible\(id\)\{.*?\n\}\nfunction renderScene\(\)\{"
replacement = "function actionVisible(id){\n ensureVisualState();\n if(id==='tea_index')return !!state.flags.visualSeen.tea||has('missing_index');\n if(id==='print_ledger')return !!state.flags.visualSeen.print||has('print_ledger')||has('clerk_audit');\n if(id==='market_runner')return ((!!state.flags.visualSeen.market)&&(has('waste_route')||has('worker_handling')))||has('runner_account');\n if(id==='book_owner')return has('runner_account')||has('merchant_flow')||has('homemaker_network')||has('student_context')||done('book_stub');\n if(id==='book_search')return (!!state.flags.visualSeen.bookstall)&&(has('runner_account')||has('merchant_flow')||has('homemaker_network')||(state.role==='student'&&has('student_context'))||done('book_owner'));\n if(id==='book_pages')return has('archive_pages');\n return true;\n}\nfunction renderScene(){"
text, n = re.subn(pattern, replacement, text, count=1, flags=re.S)
if n != 1 and 'state.flags.visualSeen.market' not in text:
    raise SystemExit('visual patch: actionVisible marker not found')

# Render the visual card before scene text/actions.
old_render = "function renderScene(){var loc=locations[state.location];"
new_render = "function renderScene(){ensureVisualState();renderVisual();var loc=locations[state.location];"
if old_render in text:
    text = text.replace(old_render, new_render, 1)
elif 'function renderScene(){ensureVisualState();renderVisual();' not in text:
    raise SystemExit('visual patch: renderScene marker not found')

if text == original:
    print('Case 1 visual clues already applied; no changes.')
else:
    path.write_text(text, encoding='utf-8')
    print('Applied Case 1 visual clue integration.')
