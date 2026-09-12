from pathlib import Path

for filename in ('index.html', 'case2-engine.js'):
    path = Path(filename)
    text = path.read_text(encoding='utf-8')
    updated = text.replace('assets/case1/tea.webp?v=6', 'assets/case1/tea.webp?v=7')
    updated = updated.replace('assets/case1/print.webp?v=6', 'assets/case1/print.webp?v=7')
    updated = updated.replace('assets/case1/market.webp?v=6', 'assets/case1/market.webp?v=7')
    updated = updated.replace('assets/case1/bookstall.webp?v=6', 'assets/case1/bookstall.webp?v=7')
    updated = updated.replace('assets/case1/failed.webp?v=6', 'assets/case1/failed.webp?v=7')
    if updated != text:
        path.write_text(updated, encoding='utf-8')
        print(f'Bumped Case 1 image cache URLs in {filename}.')
    else:
        print(f'No v6 Case 1 image URLs found in {filename}.')
