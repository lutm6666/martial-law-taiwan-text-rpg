from pathlib import Path
import base64
import io
import re
from PIL import Image

NAMES = ('tea', 'print', 'market', 'bookstall', 'failed')

for name in NAMES:
    path = Path(f'case1-art-{name}.js')
    text = path.read_text(encoding='utf-8')
    match = re.search(r"data:image/webp;base64,([A-Za-z0-9+/=]+)", text)
    if not match:
        raise SystemExit(f'INLINE_ART_FAIL {name}: data URI not found')
    try:
        data = base64.b64decode(match.group(1), validate=True)
    except Exception as exc:
        raise SystemExit(f'INLINE_ART_FAIL {name}: Base64 decode error: {exc}')
    if data[:4] != b'RIFF' or data[8:12] != b'WEBP':
        raise SystemExit(f'INLINE_ART_FAIL {name}: invalid WebP signature')
    try:
        with Image.open(io.BytesIO(data)) as img:
            if img.format != 'WEBP':
                raise SystemExit(f'INLINE_ART_FAIL {name}: unexpected format {img.format}')
            width, height = img.size
            img.load()
    except Exception as exc:
        raise SystemExit(f'INLINE_ART_FAIL {name}: image decode error: {exc}')
    if width < 320 or height < 240:
        raise SystemExit(f'INLINE_ART_FAIL {name}: dimensions too small {width}x{height}')
    print(f'INLINE_ART_OK {name}: {width}x{height}, {len(data)} bytes')

print('All five inline Case 1 images decode successfully.')
