"""Prepare the location map for the brochure's last page.

img/location-map-source.jpg is the illustrated map from the first brochure. Two of its labels must not be
printed as they are: the road is called "Stadium Road" (the brochure only says "24 m wide road") and the
hospital is "Apollo Hospitals" with no "upcoming". This script removes those two labels from the road and
the Apollo marker and writes new ones. Nothing else in the map is touched. Output: img/location-map.jpg
"""
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont
import os
here = os.path.dirname(os.path.abspath(__file__))
src = cv2.imread(os.path.join(here, 'img', 'location-map-source.jpg'))
H, W = src.shape[:2]
FONT = '/usr/share/fonts/truetype/google-fonts/'
def font(name, size):
    return ImageFont.truetype(FONT + name, size)

# ---- 1. road label ----
def top(x): return 705 - 0.1 * (x - 660)
def bot(x): return 737 - 0.1 * (x - 660)
x0, x1 = 700, 1138
mask = np.zeros((H, W), np.uint8)
mn = src.min(axis=2)
for x in range(x0, x1):
    y0, y1 = int(top(x)) + 3, int(bot(x)) - 3
    col = mn[y0:y1, x]
    mask[y0:y1, x][col > 150] = 255
band = np.zeros((H, W), np.uint8)
for x in range(x0 - 6, x1 + 6):
    band[int(top(x)) + 2:int(bot(x)) - 1, x] = 255
mask = cv2.dilate(mask, np.ones((5, 5), np.uint8)) & band
out = cv2.inpaint(src, mask, 4, cv2.INPAINT_TELEA)
# dashed centre line across the cleaned stretch, same rhythm as the rest of the road
for x in range(x0 - 4, x1 + 6, 14):
    xa, xb = x, x + 9
    ya, yb = (top(xa) + bot(xa)) / 2 + 0.2, (top(xb) + bot(xb)) / 2 + 0.2
    cv2.line(out, (int(xa), int(ya)), (int(xb), int(yb)), (190, 192, 198), 2, cv2.LINE_AA)
img = Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB)).convert('RGBA')
# new label, laid along the road (drawn at 4x and shrunk, so the spacing is even)
SS = 4
txt = '24 m  WIDE  ROAD'
f = font('Poppins-Bold.ttf', 25 * SS)
track = 3.4 * SS
w_ = int(sum(f.getlength(c) + track for c in txt)) + 10 * SS
lay = Image.new('RGBA', (w_, 44 * SS), (0, 0, 0, 0))
d = ImageDraw.Draw(lay)
x = 5 * SS
for c in txt:
    d.text((x, 6 * SS), c, font=f, fill=(252, 252, 250, 255))
    x += f.getlength(c) + track
lay = lay.rotate(5.0, expand=True, resample=Image.BICUBIC)
lay = lay.resize((lay.width // SS, lay.height // SS), Image.LANCZOS)
cx, cy = 918, (top(918) + bot(918)) / 2
img.alpha_composite(lay, (int(cx - lay.width / 2), int(cy - lay.height / 2)))

# ---- 2. Apollo label ----
arr = np.array(img.convert('RGB'))
sub = arr[338:396, 1466:1724].astype(int)
lum = sub.mean(axis=2)
m2 = np.zeros((H, W), np.uint8)
m2[338:396, 1466:1724][lum < 135] = 255
m2 = cv2.dilate(m2, np.ones((9, 9), np.uint8))
m2[:, :1466] = 0; m2[:, 1724:] = 0; m2[:338] = 0; m2[396:] = 0
bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
bgr = cv2.inpaint(bgr, m2, 6, cv2.INPAINT_TELEA)
img = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)).convert('RGBA')
fb = font('Poppins-Bold.ttf', 29 * SS)
fm = font('Poppins-Medium.ttf', 22 * SS)
a, b = 'Apollo Hospital', ' (upcoming)'
wa, wb = fb.getlength(a), fm.getlength(b)
lay = Image.new('RGBA', (int(wa + wb) + 8 * SS, 46 * SS), (0, 0, 0, 0))
d = ImageDraw.Draw(lay)
d.text((4 * SS, 0), a, font=fb, fill=(29, 34, 66, 255))
d.text((4 * SS + wa, 6 * SS), b, font=fm, fill=(112, 74, 16, 255))
lay = lay.resize((lay.width // SS, lay.height // SS), Image.LANCZOS)
img.alpha_composite(lay, (int(1595 - lay.width / 2), 343))
img.convert('RGB').save(os.path.join(here, 'img', 'location-map.jpg'), quality=91, optimize=True)
print('wrote img/location-map.jpg', img.size)
