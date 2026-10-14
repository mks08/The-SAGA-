import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture } from 'three';

/** Small procedural textures, drawn once on canvases. No image downloads, so the 3D chunk stays self-contained. */

function make(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, repeat = false): CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d')!;
  draw(ctx, w, h);
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = RepeatWrapping; t.wrapT = RepeatWrapping; }
  return t;
}

function noise(c: CanvasRenderingContext2D, w: number, h: number, amount: number): void {
  const img = c.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  c.putImageData(img, 0, 0);
}

/** Large-format stone tiles with fine joints. One texture tile is `tileM` metres wide when `repeat` is set to 1/tileM. */
export function tileTexture(base = '#d9d1c2', joint = '#b9ae9b', cells = 2): Texture {
  return make(512, 512, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    noise(c, w, h, 10);
    c.strokeStyle = joint; c.lineWidth = 3;
    const s = w / cells;
    for (let i = 0; i <= cells; i++) {
      c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, h); c.stroke();
      c.beginPath(); c.moveTo(0, i * s); c.lineTo(w, i * s); c.stroke();
    }
  }, true);
}

/** Vertical timber slats. */
export function timberTexture(): Texture {
  return make(256, 256, (c, w, h) => {
    const slats = 12;
    const sw = w / slats;
    for (let i = 0; i < slats; i++) {
      const l = 36 + Math.random() * 8;
      c.fillStyle = `hsl(28 48% ${l}%)`;
      c.fillRect(i * sw, 0, sw - 2, h);
      c.fillStyle = 'rgba(20,10,4,0.55)';
      c.fillRect(i * sw + sw - 2, 0, 2, h);
    }
    noise(c, w, h, 14);
  }, true);
}

/** Copper-toned jaali panel with a flowing wave motif (indicative of the façade screens). */
export function jaaliTexture(): Texture {
  return make(256, 512, (c, w, h) => {
    c.fillStyle = '#b97a45'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(70,32,10,0.7)'; c.lineWidth = 4;
    for (let y = -20; y < h + 20; y += 26) {
      c.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const yy = y + Math.sin((x / w) * Math.PI * 4 + y * 0.05) * 9;
        if (x === 0) c.moveTo(x, yy); else c.lineTo(x, yy);
      }
      c.stroke();
    }
    c.fillStyle = 'rgba(60,28,10,0.55)'; c.fillRect(0, 0, 10, h); c.fillRect(w - 10, 0, 10, h);
    noise(c, w, h, 12);
  });
}

/** Dark brown plaque, brass lettering. */
export function signTexture(text: string, mark = true): Texture {
  return make(1400, 260, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#3b2f27'); g.addColorStop(1, '#241c17');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#c9a15a'; c.lineWidth = 4; c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = '#d9b46a';
    c.textBaseline = 'middle'; c.textAlign = 'center';
    c.font = `${Math.round(h * 0.56)}px "Instrument Serif", Georgia, serif`;
    const tx = mark ? w / 2 + 70 : w / 2;
    // letter-spaced
    const spacing = 14;
    const widths = [...text].map((ch) => c.measureText(ch).width + spacing);
    const total = widths.reduce((a, b) => a + b, 0) - spacing;
    let x = tx - total / 2;
    c.textAlign = 'left';
    [...text].forEach((ch, i) => { c.fillText(ch, x, h / 2 + 4); x += widths[i]; });
    if (mark) {
      c.textAlign = 'center';
      c.font = `${Math.round(h * 0.52)}px "Instrument Serif", Georgia, serif`;
      c.fillText('SG', tx - total / 2 - 90, h / 2 + 2);
    }
  });
}

/** Soft vertical gradient used for glow planes. */
export function glowTexture(): Texture {
  return make(64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
}

/** Asphalt with faint speckle. */
export function asphaltTexture(): Texture {
  return make(256, 256, (c, w, h) => {
    c.fillStyle = '#34322f'; c.fillRect(0, 0, w, h);
    noise(c, w, h, 26);
  }, true);
}
