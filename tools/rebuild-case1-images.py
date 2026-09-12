from pathlib import Path
import base64
import re

OUT = Path('assets/case1')
SRC = Path('assets-src/case1')
OUT.mkdir(parents=True, exist_ok=True)


def validate_bytes(name: str, data: bytes) -> None:
    if len(data) < 20000:
        raise SystemExit(f'Case 1 image too small: {name} ({len(data)} bytes)')
    if data[:4] != b'RIFF' or data[8:12] != b'WEBP':
        raise SystemExit(f'Invalid WebP header: {name}')


def validate_write(name: str, data: bytes) -> None:
    validate_bytes(name, data)
    target = OUT / f'{name}.webp'
    target.write_bytes(data)
    print(f'CASE1_IMAGE {name}: {len(data)} bytes -> {target}')


def keep_existing(name: str, reason: str) -> None:
    target = OUT / f'{name}.webp'
    data = target.read_bytes() if target.exists() else b''
    validate_bytes(name, data)
    print(f'CASE1_IMAGE_FALLBACK {name}: keeping {len(data)}-byte committed asset ({reason})')


def b64_fragment(path: Path) -> str:
    """Read a raw Base64 chunk or one wrapped in generated JavaScript text."""
    text = path.read_text(encoding='utf-8').strip()
    compact = ''.join(text.split())
    if re.fullmatch(r'[A-Za-z0-9+/]*={0,2}', compact):
        return compact

    quoted = re.findall(
        r"\+\s*(['\"])([A-Za-z0-9+/=]+)\1",
        text,
        flags=re.MULTILINE,
    )
    if quoted:
        return ''.join(payload for _quote, payload in quoted)

    runs = re.findall(r'[A-Za-z0-9+/=]{256,}', text)
    if runs:
        return ''.join(runs)

    raise SystemExit(f'Cannot parse Base64 image fragment: {path}')


def from_b64_parts(name: str) -> None:
    parts = sorted(SRC.glob(f'{name}-*.b64'))
    if not parts:
        raise SystemExit(f'Missing Base64 image parts: {name}')
    payload = ''.join(b64_fragment(p) for p in parts)
    try:
        data = base64.b64decode(payload, validate=True)
    except Exception as exc:
        keep_existing(name, f'Base64 source decode failed: {exc}')
        return
    validate_write(name, data)


def js_fragment(path: Path) -> str:
    text = path.read_text(encoding='utf-8').strip()
    matches = re.findall(r"\+'([^']*)';", text)
    if not matches:
        matches = re.findall(r"'([^']*)';\s*$", text)
    if not matches:
        raise ValueError(f'Cannot parse HQ image fragment: {path}')
    return matches[-1]


def from_js_parts(name: str, filenames: list[str]) -> None:
    try:
        payload = ''.join(js_fragment(Path(fn)) for fn in filenames)
        data = base64.b64decode(payload, validate=True)
    except Exception as exc:
        # Source fragments are archival build inputs. A malformed fragment must
        # not take down GitHub Pages when the repository already contains a
        # valid production asset. The next workflow step performs a full Pillow
        # decode and dimension check before anything is deployed.
        keep_existing(name, f'HQ source decode failed: {exc}')
        return
    validate_write(name, data)


for image_name in ('tea', 'bookstall', 'failed'):
    from_b64_parts(image_name)

from_js_parts('print', [
    'case1-hq-print-1.js',
    'case1-hq-print-2.js',
    'case1-hq-print-3.js',
])
from_js_parts('market', [
    'case1-hq-market-1.js',
    'case1-hq-market-2.js',
    'case1-hq-market-3.js',
    'case1-hq-market-4a.js',
    'case1-hq-market-4b.js',
    'case1-hq-market-4c.js',
])

print('Case 1 image rebuild completed successfully.')
