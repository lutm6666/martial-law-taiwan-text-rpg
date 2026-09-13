from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
EXPECTED = ('tea', 'print', 'market', 'bookstall', 'failed')
# Require high-resolution assets for all five Case 1 scenes.
MIN_SIZES = {name: (1200, 900) for name in EXPECTED}

for name in EXPECTED:
    path = ROOT / 'assets/case1' / f'{name}.webp'
    if not path.exists():
        raise SystemExit(f'Missing image: {path}')
    if path.stat().st_size < 1024:
        raise SystemExit(f'Image file suspiciously small: {path} ({path.stat().st_size} bytes)')
    try:
        with Image.open(path) as img:
            fmt = img.format
            width, height = img.size
            img.load()  # Force a full decode; header-only/truncated WebP must fail here.
    except Exception as exc:
        raise SystemExit(f'Image decode failed: {path}: {exc}')
    if fmt != 'WEBP':
        raise SystemExit(f'Unexpected image format: {path} ({fmt})')
    if width < MIN_SIZES[name][0] or height < MIN_SIZES[name][1]:
        raise SystemExit(f'Image dimensions too small: {path} ({width}x{height})')
    print(f'IMAGE_OK {name}: {width}x{height}, {path.stat().st_size} bytes')

print('All Case 1 images decoded successfully.')
