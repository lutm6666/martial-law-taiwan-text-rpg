from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# The Case 2 engine is a new gameplay stage, not a replacement for Case 1.
text = re.sub(r'BUILD 4\.6・HQ ASSETS', 'BUILD 5.0・CASE 02', text, count=1)
text = re.sub(r'BUILD 5\.0・[^<]+', 'BUILD 5.0・CASE 02', text, count=1)

script_tag = '<script src="case2-engine.js?v=1"></script>'
if script_tag not in text:
    marker = '</body>'
    if marker not in text:
        raise SystemExit('case2: </body> marker not found')
    text = text.replace(marker, script_tag + '\n' + marker, 1)

if text == original:
    print('Case 2 production hook already applied; no changes.')
else:
    path.write_text(text, encoding='utf-8')
    print('Applied Case 2 production hook and BUILD 5.0 marker.')
