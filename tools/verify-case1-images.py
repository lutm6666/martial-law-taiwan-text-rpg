from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

CASE1_EXPECTED = ('tea', 'print', 'market', 'bookstall', 'failed')
CASE1_MIN_SIZES = {name: (1200, 900) for name in CASE1_EXPECTED}


def verify_raster(path: Path, expected_format: str, min_size: tuple[int, int], label: str) -> None:
    if not path.exists():
        raise SystemExit(f'Missing image: {path}')
    if path.stat().st_size < 1024:
        raise SystemExit(f'Image file suspiciously small: {path} ({path.stat().st_size} bytes)')
    try:
        with Image.open(path) as img:
            fmt = img.format
            width, height = img.size
            img.load()  # Force full decoding; header-only/truncated images must fail here.
    except Exception as exc:
        raise SystemExit(f'Image decode failed: {path}: {exc}')
    if fmt != expected_format:
        raise SystemExit(f'Unexpected image format: {path} ({fmt}, expected {expected_format})')
    if width < min_size[0] or height < min_size[1]:
        raise SystemExit(f'Image dimensions too small: {path} ({width}x{height})')
    print(f'IMAGE_OK {label}: {width}x{height}, {path.stat().st_size} bytes')


for name in CASE1_EXPECTED:
    verify_raster(
        ROOT / 'assets' / 'case1' / f'{name}.webp',
        expected_format='WEBP',
        min_size=CASE1_MIN_SIZES[name],
        label=f'case1/{name}',
    )

# V2 currently renders this JPEG as the primary Rain Knocking scene on GitHub Pages.
# It previously broke without failing deployment, so keep it inside the production gate.
verify_raster(
    ROOT / 'assets' / 'v2' / 'rain-house-front.jpg',
    expected_format='JPEG',
    min_size=(320, 200),
    label='v2/rain-house-front',
)

# Safari falls back to this SVG if the JPEG cannot load. Parse it during deployment so
# malformed/truncated XML cannot silently ship as the only remaining scene asset.
fallback = ROOT / 'assets' / 'v2' / 'rain-ch1-scene.svg'
if not fallback.exists():
    raise SystemExit(f'Missing fallback image: {fallback}')
if fallback.stat().st_size < 256:
    raise SystemExit(f'Fallback SVG suspiciously small: {fallback} ({fallback.stat().st_size} bytes)')
try:
    root = ET.parse(fallback).getroot()
except Exception as exc:
    raise SystemExit(f'Fallback SVG parse failed: {fallback}: {exc}')
if root.tag.split('}')[-1].lower() != 'svg':
    raise SystemExit(f'Fallback image is not an SVG root: {fallback} ({root.tag})')
if not (root.get('viewBox') or (root.get('width') and root.get('height'))):
    raise SystemExit(f'Fallback SVG has no usable dimensions/viewBox: {fallback}')
print(f'IMAGE_OK v2/rain-ch1-scene fallback: {fallback.stat().st_size} bytes')

print('All production scene images decoded or parsed successfully.')
