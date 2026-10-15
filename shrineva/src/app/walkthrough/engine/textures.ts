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

/** Painted ghat panel: sun, temple spires, an arcade of arches, stepped ghats and the river. Drawn flat in warm sandstone tones. */
export function ghatTexture(): Texture {
  return make(1024, 640, (c, w, h) => {
    const sky = c.createLinearGradient(0, 0, 0, h * 0.62);
    sky.addColorStop(0, '#efd3a3'); sky.addColorStop(1, '#f8ead0');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    const sx = w * 0.5, sy = h * 0.33;
    const halo = c.createRadialGradient(sx, sy, 10, sx, sy, 190);
    halo.addColorStop(0, 'rgba(255,250,236,0.95)'); halo.addColorStop(1, 'rgba(255,250,236,0)');
    c.fillStyle = halo; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff8e8'; c.beginPath(); c.arc(sx, sy, 66, 0, Math.PI * 2); c.fill();
    const base = h * 0.6;
    const spire = (x: number, wd: number, ht: number, col: string): void => {
      c.fillStyle = col;
      c.beginPath(); c.moveTo(x - wd / 2, base);
      c.quadraticCurveTo(x - wd * 0.46, base - ht * 0.5, x, base - ht);
      c.quadraticCurveTo(x + wd * 0.46, base - ht * 0.5, x + wd / 2, base);
      c.closePath(); c.fill();
      c.fillRect(x - 2, base - ht - 30, 4, 30);
      c.beginPath(); c.arc(x, base - ht - 32, 6, 0, Math.PI * 2); c.fill();
    };
    spire(120, 120, 150, '#d2ab74'); spire(250, 84, 104, '#c79c66'); spire(780, 96, 126, '#c79c66'); spire(910, 130, 176, '#d2ab74'); spire(640, 64, 84, '#dcb985');
    // arcade
    const top = base, bot = h * 0.76;
    c.fillStyle = '#e9d5ae'; c.fillRect(0, top, w, bot - top);
    const n = 11, aw = w / n;
    for (let i = 0; i < n; i++) {
      const x = i * aw + aw * 0.2, ww = aw * 0.6, y0 = top + 20, y1 = bot - 6;
      c.fillStyle = '#8d6a42';
      c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y0 + ww * 0.5); c.quadraticCurveTo(x + ww / 2, y0 - ww * 0.35, x + ww, y0 + ww * 0.5); c.lineTo(x + ww, y1); c.closePath(); c.fill();
    }
    c.fillStyle = '#b48a58'; c.fillRect(0, top - 6, w, 8);
    // steps down to the water
    const s0 = bot, s1 = h * 0.87, steps = 7;
    for (let i = 0; i < steps; i++) {
      c.fillStyle = i % 2 ? '#d6bf98' : '#c9ae82';
      c.fillRect(0, s0 + (i * (s1 - s0)) / steps, w, (s1 - s0) / steps + 1);
    }
    // river
    const wat = c.createLinearGradient(0, s1, 0, h);
    wat.addColorStop(0, '#8db3b0'); wat.addColorStop(1, '#6f9a9a');
    c.fillStyle = wat; c.fillRect(0, s1, w, h - s1);
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3;
    for (let y = s1 + 16; y < h; y += 20) {
      c.beginPath();
      for (let x = 0; x <= w; x += 8) { const yy = y + Math.sin(x / 38 + y * 0.2) * 5; if (x === 0) c.moveTo(x, yy); else c.lineTo(x, yy); }
      c.stroke();
    }
    // a boat with a canopy
    c.fillStyle = '#5b4331';
    c.beginPath(); c.moveTo(250, s1 + 22); c.quadraticCurveTo(300, s1 + 46, 380, s1 + 22); c.lineTo(370, s1 + 18); c.lineTo(262, s1 + 18); c.closePath(); c.fill();
    c.fillStyle = '#c9a15a'; c.fillRect(290, s1 - 4, 60, 22);
    noise(c, w, h, 8);
  });
}

/** Stone lattice (jali) with real holes: alpha is cut out, so light placed behind it shows through. */
export function jaliStoneTexture(): Texture {
  return make(256, 256, (c, w, h) => {
    c.fillStyle = '#dccdac'; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'destination-out';
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const cx = (i + 0.5) * s, cy = (j + 0.5) * s, r = s * 0.4;
        c.beginPath(); c.moveTo(cx, cy - r); c.lineTo(cx + r, cy); c.lineTo(cx, cy + r); c.lineTo(cx - r, cy); c.closePath(); c.fill();
        c.beginPath(); c.arc(cx + s / 2, cy + s / 2, s * 0.1, 0, Math.PI * 2); c.fill();
      }
    }
    c.globalCompositeOperation = 'source-over';
  }, true);
}

/** Warm light for niches and the jali backing: brighter low and centred, darker at the edges, so a lit panel reads as a recess. */
export function warmGlowTexture(): Texture {
  return make(128, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c98642'); g.addColorStop(0.55, '#f2b66a'); g.addColorStop(1, '#ffe2ae');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const r = c.createRadialGradient(w / 2, h * 0.7, 6, w / 2, h * 0.7, h * 0.7);
    r.addColorStop(0, 'rgba(255,246,222,0.55)'); r.addColorStop(1, 'rgba(255,246,222,0)');
    c.fillStyle = r; c.fillRect(0, 0, w, h);
    const e = c.createLinearGradient(0, 0, w, 0);
    e.addColorStop(0, 'rgba(70,36,10,0.35)'); e.addColorStop(0.18, 'rgba(70,36,10,0)'); e.addColorStop(0.82, 'rgba(70,36,10,0)'); e.addColorStop(1, 'rgba(70,36,10,0.35)');
    c.fillStyle = e; c.fillRect(0, 0, w, h);
  });
}
