#!/usr/bin/env python3
"""
Building explorer image: a plain crop of the finished facade render (no retouching), at two sizes.

The source is the site's own render, src/assets/images/renders/facade-night.webp (1600 x 829). The crop window below is in that
image's pixel coordinates. The explorer's floor outlines (src/app/config/explorer.config.ts) are traced in the cropped image's
own pixel space (WIN_W x WIN_H units), so the window must not change without re-tracing them.

Run from the project folder:  python3 tools/explorer/build-explorer-image.py
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
SRC = Image.open(os.path.join(ROOT, 'src', 'assets', 'images', 'renders', 'facade-night.webp')).convert('RGB')
OUT = os.path.join(ROOT, 'src', 'assets', 'images', 'explorer')
os.makedirs(OUT, exist_ok=True)

assert SRC.size == (1600, 829), SRC.size
WIN_X, WIN_Y, WIN_W, WIN_H = 430, 25, 740, 804

crop = SRC.crop((WIN_X, WIN_Y, WIN_X + WIN_W, WIN_Y + WIN_H))
for width, name in ((740, 'building-740.webp'), (480, 'building-480.webp')):
    h = round(crop.height * width / crop.width)
    img = crop if width == crop.width else crop.resize((width, h), Image.LANCZOS)
    img.save(os.path.join(OUT, name), 'WEBP', quality=82, method=6)
    print(name, img.size, os.path.getsize(os.path.join(OUT, name)) // 1024, 'KB')
