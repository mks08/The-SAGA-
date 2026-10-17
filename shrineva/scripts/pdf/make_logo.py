"""Cut the cream background out of the SHRINEVA logo so it sits cleanly on any page colour in the PDFs."""
import numpy as np, sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(float)
bg = np.array([245., 242., 234.])
lum = a @ np.array([.299, .587, .114]); bgl = bg @ np.array([.299, .587, .114])
d = (bgl - lum) / (bgl - 95.0)
alpha = np.clip((d - 0.10) * 1.25, 0, 1)
al = np.maximum(alpha, 1e-3)[..., None]
col = np.clip((a - bg * (1 - al)) / al, 0, 255)
col[alpha < 0.02] = [150, 108, 40]
rgba = np.dstack([col, alpha * 255]).astype('uint8')
Image.fromarray(rgba, 'RGBA').save(out)
