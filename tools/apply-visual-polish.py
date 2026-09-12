from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Build label.
text = re.sub(r'BUILD 4\.3・VISUAL CLUES', 'BUILD 4.4・VISUAL POLISH', text, count=1)
# Keep the JavaScript runtime error diagnostic in sync with the visible build.
# A stale value makes Safari/cache reports look like an older page is loaded.
text = text.replace("。BUILD 4.2.1'", "。BUILD 4.4'", 1)

# Remove the conspicuous observation button from the visual card.
text = re.sub(r'<button id="observeSceneBtn" type="button">.*?</button>', '', text, count=1)

# Add/override subtle visual interaction styles.
marker = '@media(min-width:640px)'
css = (
    '.scene-visual{cursor:default}.scene-visual img{image-rendering:auto;cursor:pointer;touch-action:manipulation}'
    '.scene-visual .visual-note{text-align:center;padding:8px 12px;color:#89877d;font-size:.69rem;letter-spacing:.02em;'
    'background:#151713;border-top:1px solid #2d3028;user-select:none}'
    '.scene-visual.seen .visual-note{color:#8f8c81}'
    '.scene-visual img:focus-visible{outline:2px solid #b69b5f;outline-offset:-2px}'
    '\n'
)
if css not in text:
    if marker not in text:
        raise SystemExit('visual polish: CSS marker not found')
    text = text.replace(marker, css + marker, 1)

# Replace renderVisual so the image itself is the interaction target and
# the only affordance is the quiet caption beneath it.
pattern = r"function renderVisual\(\)\{.*?\}\nfunction observeScene\(\)\{"
replacement = (
    "function renderVisual(){ensureVisualState();var box=$('sceneVisual'),img=$('sceneImage'),note=$('visualNote'),id=state.location,m=visualMeta[id];"
    "if(!m||!art[id]){box.classList.add('hidden');return}"
    "box.classList.remove('hidden');box.classList.toggle('seen',!!state.flags.visualSeen[id]);"
    "img.src=art[id];img.alt=m.alt;img.setAttribute('role','button');img.setAttribute('aria-label','觀察'+m.alt);img.tabIndex=0;"
    "note.textContent=state.flags.visualSeen[id]?'已觀察｜再次點擊圖片可重新查看':'點擊圖片查看細節';"
    "img.onclick=observeScene;img.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();observeScene();}};}\n"
    "function observeScene(){"
)
text, n = re.subn(pattern, replacement, text, count=1, flags=re.S)
if n != 1 and "點擊圖片查看細節" not in text:
    raise SystemExit('visual polish: renderVisual marker not found')

if text == original:
    print('Visual polish already applied; no changes.')
else:
    path.write_text(text, encoding='utf-8')
    print('Applied subtle image observation UI and visual quality CSS.')
