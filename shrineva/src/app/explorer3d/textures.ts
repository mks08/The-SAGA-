import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture } from 'three';

/** Small procedural textures, drawn once on canvases. No image downloads, so the 3D chunk is self-contained. */

function make(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, repeat = false): CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
  draw(ctx, w, h);
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = RepeatWrapping; t.wrapT = RepeatWrapping; }
  return t;
}

/** A tiny deterministic generator, so the texture is the same every time. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function noise(c: CanvasRenderingContext2D, w: number, h: number, amount: number, seed = 7): void {
  const r = rng(seed);
  const img = c.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * amount;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  c.putImageData(img, 0, 0);
}

/** Large-format stone tiles with fine joints. One tile cell is `cells` per texture width. */
export function tileTexture(base: string, joint: string, cells = 2, grain = 9): Texture {
  return make(512, 512, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    noise(c, w, h, grain);
    c.strokeStyle = joint; c.lineWidth = 3;
    const s = w / cells;
    for (let i = 0; i <= cells; i++) {
      c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, h); c.stroke();
      c.beginPath(); c.moveTo(0, i * s); c.lineTo(w, i * s); c.stroke();
    }
  }, true);
}

/** Blue-grey concrete with faint saw-cut joints, like the ground-level floor in the renders. */
export function concreteTexture(): Texture {
  return make(512, 512, (c, w, h) => {
    c.fillStyle = '#7d8590'; c.fillRect(0, 0, w, h);
    noise(c, w, h, 14, 11);
    c.strokeStyle = 'rgba(30,34,42,0.35)'; c.lineWidth = 2;
    const s = w / 2;
    for (let i = 0; i <= 2; i++) {
      c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, h); c.stroke();
      c.beginPath(); c.moveTo(0, i * s); c.lineTo(w, i * s); c.stroke();
    }
  }, true);
}

/** Brass jali screen: a square lattice of small cut-outs on a dark ground, like the screen on the west of the front. */
export function jaliTexture(): Texture {
  return make(256, 512, (c, w, h) => {
    c.fillStyle = '#2b2118'; c.fillRect(0, 0, w, h);
    const n = 8, s = w / n;
    for (let y = 0; y < h / s; y++) {
      for (let x = 0; x < n; x++) {
        const cx = x * s + s / 2, cy = y * s + s / 2;
        c.fillStyle = '#c9a15a';
        c.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
        c.fillStyle = '#7a5a26';
        c.beginPath(); c.arc(cx, cy, s * 0.26, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#e8cf96';
        c.beginPath(); c.arc(cx, cy, s * 0.12, 0, Math.PI * 2); c.fill();
      }
    }
    noise(c, w, h, 10, 5);
  }, true);
}

/** Dark plaque with brass letters, letter-spaced. Used for the crown sign and the name board. */
export function signTexture(text: string, aspect = 7): Texture {
  const w = 1400, h = Math.round(w / aspect);
  return make(w, h, (c) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2a231d'); g.addColorStop(1, '#171310');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e1bd72';
    c.textBaseline = 'middle';
    const size = Math.round(h * 0.5);
    c.font = `${size}px "Instrument Serif", Georgia, serif`;
    const spacing = size * 0.42;
    const chars = [...text];
    const widths = chars.map((ch) => c.measureText(ch).width + spacing);
    const total = widths.reduce((a, b) => a + b, 0) - spacing;
    let x = (w - total) / 2;
    chars.forEach((ch, i) => { c.fillText(ch, x, h / 2 + size * 0.04); x += widths[i]; });
  });
}

/** Soft radial glow, used for the pool of light under the building. */
export function glowTexture(): Texture {
  return make(256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(232,190,110,0.55)');
    g.addColorStop(0.45, 'rgba(120,96,70,0.22)');
    g.addColorStop(1, 'rgba(10,10,20,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
}

/** Asphalt with a faint speckle. */
export function asphaltTexture(): Texture {
  return make(256, 256, (c, w, h) => {
    c.fillStyle = '#2b2a2f'; c.fillRect(0, 0, w, h);
    noise(c, w, h, 16, 3);
  }, true);
}
