from pathlib import Path
from PIL import Image

EXPECTED = ('tea', 'print', 'market', 'bookstall', 'failed')

for name in EXPECTED:
    path = Path('assets/case1') / f'{name}.webp'
    if not path.exists():
        raise SystemExit(f'Missing image: {path}')
    try:
        with Image.open(path) as img:
            fmt = img.format
            width, height = img.size
            img.load()  # Force a full decode; header-only/truncated WebP must fail here.
    except Exception as exc:
        raise SystemExit(f'Image decode failed: {path}: {exc}')
    if fmt != 'WEBP':
        raise SystemExit(f'Unexpected image format: {path} ({fmt})')
    if width < 640 or height < 480:
        raise SystemExit(f'Image dimensions too small: {path} ({width}x{height})')
    if path.stat().st_size < 20000:
        raise SystemExit(f'Image file suspiciously small: {path} ({path.stat().st_size} bytes)')
    print(f'IMAGE_OK {name}: {width}x{height}, {path.stat().st_size} bytes')

print('All Case 1 images decoded successfully.')
