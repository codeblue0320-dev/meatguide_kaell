#!/usr/bin/env python3
"""모든 CSS/JS를 index.html에 인라인해 단일 파일(preview.html)을 만듭니다."""
import base64, pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
html = (ROOT / 'index.html').read_text(encoding='utf-8')

# CSS 인라인
css = (ROOT / 'css/style.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="css/style.css">',
                    '<style>\n' + css + '\n</style>')

# JS 인라인
for src in ['js/data-beef.js', 'js/data-pork.js', 'js/data-sub-beef.js', 'js/data-sub-pork.js',
            'js/data-prep.js', 'js/data-guide.js', 'js/app.js']:
    js = (ROOT / src).read_text(encoding='utf-8')
    html = html.replace('<script src="%s"></script>' % src,
                        '<script>\n' + js + '\n</script>')

# 파비콘을 data URI 로 인라인
b64 = base64.b64encode((ROOT / 'icons/icon-192.png').read_bytes()).decode('ascii')
html = re.sub(r'<link rel="icon"[^>]*>', '', html)
html = html.replace('</title>',
                    '</title>\n<link rel="icon" type="image/png" href="data:image/png;base64,%s">' % b64,
                    1)  # head 의 첫 </title> 에만 (app.js 안의 SVG <title> 은 건드리지 않도록)

# 단일 파일에서는 manifest / service worker / apple-touch-icon 제거
html = html.replace('<link rel="manifest" href="manifest.json">', '')
html = re.sub(r'<link rel="apple-touch-icon"[^>]*>', '', html)
html = re.sub(r"<script>\s*if \('serviceWorker'.*?</script>", '', html, flags=re.S)

out = ROOT / 'preview.html'
out.write_text(html, encoding='utf-8')
print('preview.html %.1f KB' % (out.stat().st_size / 1024))
