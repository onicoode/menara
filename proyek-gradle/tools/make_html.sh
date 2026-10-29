#!/usr/bin/env bash
# Join the split game sources into the single page the app loads (app/src/main/assets/index.html).
# Order matters: va.js vaud.js vb.js vt.js vm.js vc.js vd.js vu.js (they share one closure opened in va.js, closed in vd.js).
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'P'
import re
vh=open('game-src/vh.html').read()
vh=re.sub(r'<link rel="preconnect"[^>]*>\n','',vh)
vh=re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\n','',vh)
js=''.join(open('game-src/'+f).read() for f in ['va.js','vaud.js','vb.js','vt.js','vm.js','vc.js','vd.js','vdemo.js','vtower.js','vdev.js','vu.js']).rstrip()
i=vh.index('<main')
font="""<style>
@font-face{font-family:'Pixelify Sans';font-weight:500;src:url(fonts/pixelify-sans-latin-500-normal.woff2) format('woff2')}
@font-face{font-family:'Pixelify Sans';font-weight:700;src:url(fonts/pixelify-sans-latin-700-normal.woff2) format('woff2')}
[hidden]{display:none!important}
html,body{margin:0;background:#0d0f19}
</style>
"""
html=('<!doctype html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n'
      +font+vh[:i].replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')+'</head>\n<body>\n'+vh[i:]+js+'\n</script>\n</body>\n</html>\n')
open('app/src/main/assets/index.html','w').write(html)
print('index.html updated')
P
