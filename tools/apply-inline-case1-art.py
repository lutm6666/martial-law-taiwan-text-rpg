from pathlib import Path
import re

ART_FILES = ('tea', 'print', 'market', 'bookstall', 'failed')

# ---- index.html: load the connector-safe text assets before the game engine ----
index_path = Path('index.html')
text = index_path.read_text(encoding='utf-8')
original = text

# Remove older Case 1 art script tags so this stays idempotent.
text = re.sub(r'\s*<script src="case1-art-(?:tea|print|market|bookstall|failed)\.js\?v=\d+"></script>\s*', '\n', text)

tags = '\n'.join(f'<script src="case1-art-{name}.js?v=8"></script>' for name in ART_FILES)
marker = '<script>\n(function(){'
if marker not in text:
    raise SystemExit('inline art patch: main inline engine marker not found')
text = text.replace(marker, tags + '\n' + marker, 1)

# Use data URIs already loaded into window.CASE1_ART instead of corrupt binary WebP files.
text, count = re.subn(
    r"var art=.*?;\nvar visualMeta=",
    "var art=window.CASE1_ART||{};\nvar visualMeta=",
    text,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit('inline art patch: Case 1 art map not found')

if text != original:
    index_path.write_text(text, encoding='utf-8')
    print('Case 1 now uses connector-safe inline art assets.')
else:
    print('Case 1 inline art assets already applied.')

# ---- Case 2 recap: replace the binary URLs immediately after the recap HTML is rendered ----
case2_path = Path('case2-engine.js')
c2 = case2_path.read_text(encoding='utf-8')
c2_original = c2

# Remove an older copy of this patch if present.
c2 = re.sub(
    r"\n\s*/\* CASE1_ART_RECAP_START \*/.*?/\* CASE1_ART_RECAP_END \*/",
    '',
    c2,
    flags=re.S,
)

pattern = r"(function renderRecord\(\)\{.*?box\.innerHTML=html;)(\n\})"
addon = r'''\1
 /* CASE1_ART_RECAP_START */
 var recapArt=window.CASE1_ART||{};
 var recapIds=['tea','print','market','bookstall'];
 box.querySelectorAll('.c2-recap-card img').forEach(function(img,i){
  var id=recapIds[i];
  if(id&&recapArt[id]) img.src=recapArt[id];
 });
 /* CASE1_ART_RECAP_END */\2'''
c2, count = re.subn(pattern, addon, c2, count=1, flags=re.S)
if count != 1:
    raise SystemExit('inline art patch: Case 2 renderRecord marker not found')

if c2 != c2_original:
    case2_path.write_text(c2, encoding='utf-8')
    print('Case 2 recap now uses the same inline art assets.')
else:
    print('Case 2 inline recap already applied.')
