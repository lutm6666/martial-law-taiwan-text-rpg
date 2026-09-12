from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Visible build label. Support both the first visual build and already-polished pages.
text = re.sub(r'BUILD 4\.(?:3|4|5)・[^<]+', 'BUILD 4.5・HQ VISUALS', text, count=1)

# Keep the JavaScript runtime error diagnostic in sync with the visible build.
text = text.replace("。BUILD 4.2.1'", "。BUILD 4.5'", 1)
text = text.replace("。BUILD 4.4'", "。BUILD 4.5'", 1)

# The earlier visual integration loaded aggressively compressed data-URI JS assets.
# Remove those runtime tags; the high-quality WebP files below are now the source of truth.
for tag in (
    '<script src="case1-art-tea.js?v=1"></script>',
    '<script src="case1-art-print.js?v=1"></script>',
    '<script src="case1-art-market.js?v=1"></script>',
    '<script src="case1-art-bookstall.js?v=1"></script>',
    '<script src="case1-art-failed.js?v=1"></script>',
):
    text = text.replace(tag + '\n', '').replace(tag, '')

# Use direct, cache-busted image files instead of low-resolution data URIs.
hq_art = (
    "var art={"
    "tea:'assets/case1/tea.webp?v=5',"
    "print:'assets/case1/print.webp?v=5',"
    "market:'assets/case1/market.webp?v=5',"
    "bookstall:'assets/case1/bookstall.webp?v=5',"
    "failed:'assets/case1/failed.webp?v=5'"
    "};\nvar visualMeta="
)
text, n_art = re.subn(r"var art=.*?;\nvar visualMeta=", hq_art, text, count=1, flags=re.S)
if n_art != 1:
    raise SystemExit('visual polish: art source marker not found')

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

# The whole image is the observation target. Only a quiet line of text sits below it.
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
    print('HQ visual polish already applied; no changes.')
else:
    path.write_text(text, encoding='utf-8')
    print('Applied high-quality Case 1 WebP assets and subtle image observation UI.')
