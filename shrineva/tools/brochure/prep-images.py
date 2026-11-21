"""Shrinks the brochure's images so the PDF stays small: photos to JPEG, flat plan art to palette PNG."""
import os, sys
from PIL import Image
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
imgs = os.path.join(root, 'src/assets/images')
out = os.path.join(os.path.dirname(__file__), 'img')
os.makedirs(out, exist_ok=True)

def jpg(src, name, w, q=80):
    im = Image.open(src).convert('RGB')
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, name), 'JPEG', quality=q, optimize=True, progressive=True)

def png(src, name, w=None, colors=128):
    im = Image.open(src).convert('RGB')
    if w and im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im = im.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE)
    im.save(os.path.join(out, name), 'PNG', optimize=True)

jpg(f'{imgs}/hero/hero-day-1920.webp', 'hero.jpg', 1500, 80)
for n in ('entrance', 'lift-lobby', 'facade-day'):
    jpg(f'{imgs}/renders/{n}.webp', f'{n}.jpg', 900, 80)
# Site photographs are used uncropped; the front view is portrait, the others landscape.
for n in ('front-day', 'ground-level', 'upper-floor-south', 'upper-floor-north', 'apollo-side', 'nift-side'):
    jpg(f'{imgs}/photos/{n}.webp', f'site-{n}.jpg', 1000 if n != 'front-day' else 900, 78)
jpg(f'{imgs}/plans/typical-3d.webp', 'typical-3d.jpg', 1100, 82)
jpg(f'{imgs}/plans/ground-3d.webp', 'ground-3d.jpg', 1100, 82)
png(f'{imgs}/plans/plan-typical-sheet.webp', 'plan-typical.png', None, 96)
png(f'{imgs}/plans/plan-ground-sheet.webp', 'plan-ground.png', None, 96)
png(os.path.join(os.path.dirname(__file__), 'site-plan.png'), 'site-plan.png', 1100, 96)
# The same lockup as the website: the SG monogram beside the SHRINEVA wordmark (src/app/components/brand-logo).
im = Image.open(f'{imgs}/logo-wordmark.webp').convert('RGBA'); im.save(os.path.join(out, 'logo.png'), 'PNG', optimize=True)
im = Image.open(f'{imgs}/logo-mark.webp').convert('RGBA'); im.save(os.path.join(out, 'mark.png'), 'PNG', optimize=True)
print('prepared', sorted(os.listdir(out)))
