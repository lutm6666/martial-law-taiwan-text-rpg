from pathlib import Path
import base64
import re

OUT = Path('assets/case1')
SRC = Path('assets-src/case1')
OUT.mkdir(parents=True, exist_ok=True)


def validate_write(name: str, data: bytes) -> None:
    if len(data) < 20000:
        raise SystemExit(f'Case 1 image too small: {name} ({len(data)} bytes)')
    if data[:4] != b'RIFF' or data[8:12] != b'WEBP':
        raise SystemExit(f'Invalid WebP header: {name}')
    target = OUT / f'{name}.webp'
    target.write_bytes(data)
    print(f'CASE1_IMAGE {name}: {len(data)} bytes -> {target}')


def b64_fragment(path: Path) -> str:
    """Read a raw Base64 chunk or one wrapped in generated JavaScript text."""
    text = path.read_text(encoding='utf-8').strip()
    compact = ''.join(text.split())
    if re.fullmatch(r'[A-Za-z0-9+/]*={0,2}', compact):
        return compact

    # Prefer explicitly quoted payloads.  Older connector/export passes used
    # slightly different spacing, quote styles and trailing punctuation, so do
    # not require the historical exact `+'...';` wrapper.
    quoted = re.findall(
        r"\+\s*(['\"])([A-Za-z0-9+/=]+)\1",
        text,
        flags=re.MULTILINE,
    )
    if quoted:
        return ''.join(payload for _quote, payload in quoted)

    # Recovery path for a raw chunk contaminated by a short wrapper/prefix.
    # A real image fragment is thousands of Base64 characters, whereas wrapper
    # identifiers are short.  Taking only long runs avoids feeding JS syntax to
    # base64.b64decode while preserving split image chunks.
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
        raise SystemExit(f'Base64 decode failed for {name}: {exc}')
    validate_write(name, data)


def js_fragment(path: Path) -> str:
    text = path.read_text(encoding='utf-8').strip()
    matches = re.findall(r"\+'([^']*)';", text)
    if not matches:
        matches = re.findall(r"'([^']*)';\s*$", text)
    if not matches:
        raise SystemExit(f'Cannot parse HQ image fragment: {path}')
    return matches[-1]


def from_js_parts(name: str, filenames: list[str]) -> None:
    payload = ''.join(js_fragment(Path(fn)) for fn in filenames)
    try:
        data = base64.b64decode(payload, validate=True)
    except Exception as exc:
        raise SystemExit(f'HQ JS Base64 decode failed for {name}: {exc}')
    validate_write(name, data)


# Fresh Base64 source chunks. b64_fragment intentionally accepts both raw
# chunks and historical connector-generated wrapper variants.
for image_name in ('tea', 'bookstall', 'failed'):
    from_b64_parts(image_name)

# These two complete HQ sets already exist as text chunks in the repository.
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
