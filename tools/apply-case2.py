from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Case 2 is a new gameplay stage, not a replacement for Case 1. Keep the
# visible build marker and runtime error diagnostic on the same version.
BUILD = '5.0.1'
text = re.sub(r'BUILD (?:4\.6|5\.0(?:\.\d+)?)・[^<]+', f'BUILD {BUILD}・CASE 02', text, count=1)
text = re.sub(r'(偵測到執行錯誤：[^\n]*?。BUILD )(?:4\.6|5\.0(?:\.\d+)?)', rf'\g<1>{BUILD}', text, count=1)

# GitHub Pages/browser caches can retain an old external JS file even after
# index.html changes. Normalize to one versioned script tag so Safari always
# receives the engine that belongs to this build.
script_tag = '<script src="case2-engine.js?v=2"></script>'
script_pattern = r'\s*<script src="case2-engine\.js\?v=\d+"></script>\s*'
text = re.sub(script_pattern, '\n', text)
marker = '</body>'
if marker not in text:
    raise SystemExit('case2: </body> marker not found')
text = text.replace(marker, script_tag + '\n' + marker, 1)

if text == original:
    print('Case 2 production hook already applied; no changes.')
else:
    path.write_text(text, encoding='utf-8')
    print(f'Applied Case 2 production hook, BUILD {BUILD}, and cache-busted engine tag.')
