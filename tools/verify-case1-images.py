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

# V2 currently uses this SVG as the Rain Knocking scene. Parse the production asset so
# malformed/truncated XML cannot be published as a successful deployment.
v2_scene = ROOT / 'assets' / 'v2' / 'rain-ch1-scene.svg'
if not v2_scene.exists():
    raise SystemExit(f'Missing V2 scene image: {v2_scene}')
if v2_scene.stat().st_size < 256:
    raise SystemExit(f'V2 scene SVG suspiciously small: {v2_scene} ({v2_scene.stat().st_size} bytes)')
try:
    root = ET.parse(v2_scene).getroot()
except Exception as exc:
    raise SystemExit(f'V2 scene SVG parse failed: {v2_scene}: {exc}')
if root.tag.split('}')[-1].lower() != 'svg':
    raise SystemExit(f'V2 scene image is not an SVG root: {v2_scene} ({root.tag})')
if not (root.get('viewBox') or (root.get('width') and root.get('height'))):
    raise SystemExit(f'V2 scene SVG has no usable dimensions/viewBox: {v2_scene}')
print(f'IMAGE_OK v2/rain-ch1-scene: {v2_scene.stat().st_size} bytes')

print('All production scene images decoded or parsed successfully.')
