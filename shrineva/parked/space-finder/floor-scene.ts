/**
 * Draws the typical floor (and the part of it an occupier takes) as plain SVG items, either as an isometric block diagram or as a
 * flat plan with the road at the top. Pure functions, no DOM: the same scene is built on the server and in the browser.
 * All geometry comes from floor-model.ts (the architect's dimensions).
 */
import { COLUMNS, FLOOR, Plan, Pt, Region, about, feet } from '../../config/floor-model';

export type View = 'iso' | 'plan';

export interface PolyItem { k: 'poly'; id: string; pts: string; fill: string; stroke?: string; sw?: number; op?: number; dash?: string; cls?: string; }
export interface LineItem { k: 'line'; id: string; x1: number; y1: number; x2: number; y2: number; stroke: string; sw: number; dash?: string; }
export interface TextItem { k: 'text'; id: string; x: number; y: number; t: string; size: number; weight?: number; fill: string; anchor?: 'start' | 'middle' | 'end'; rot?: number; ls?: number; cls?: string; }
export interface ChipItem { k: 'chip'; id: string; x: number; y: number; w: number; h: number; lines: string[]; stroke: string; fill: string; color: string; cls?: string; }
export type Item = PolyItem | LineItem | TextItem | ChipItem;
export interface Scene { vb: string; w: number; h: number; items: Item[]; }

export const COLOURS = {
  ink: '#1b1714', paper: '#f6f1e8', road: '#2a2622', brass: '#8a6a21',
  a: { top: '#e3b04b', side: '#b98a2a', side2: '#9d731f', text: '#6b4b0c' },
  b: { top: '#5aa79c', side: '#3f867c', side2: '#2f6b63', text: '#1f524b' },
  slab: { top: '#efe8d6', side: '#cfc6ae', side2: '#bdb297' },
  glass: '#cfe6e1', glassLine: '#7fb3a8',
};

const fi = (ft: number): string => {
  const t = Math.round(ft * 24) / 2;
  const f = Math.floor(t / 12);
  const i = t - f * 12;
  const w = Math.floor(i);
  return `${f}′-${w}${i - w ? '½' : ''}″`;
};

interface Proj { P(x: number, y: number, z?: number): Pt; vbW: number; vbH: number; }

function projection(view: View): Proj {
  if (view === 'plan') {
    const s = 6.4, ox = 62, oy = 92;
    return { P: (x, y) => [+(ox + x * s).toFixed(1), +(oy + y * s).toFixed(1)], vbW: 380, vbH: 740 };
  }
  const s = 5.3, ox = 490, oy = 82, c = 0.866;
  return {
    P: (x, y, z = 0) => {
      const v = FLOOR.l - y;
      return [+(ox + (x - v) * c * s).toFixed(1), +(oy + (x + v) * 0.5 * s - z * s * 0.95).toFixed(1)];
    },
    vbW: 700, vbH: 500,
  };
}

const area = (p: Pt[]): number => p.reduce((a, q, i) => { const n = p[(i + 1) % p.length]; return a + (q[0] * n[1] - n[0] * q[1]); }, 0) / 2;
const centroid = (p: Pt[]): Pt => {
  let a = 0, cx = 0, cy = 0;
  p.forEach((q, i) => { const n = p[(i + 1) % p.length]; const f = q[0] * n[1] - n[0] * q[1]; a += f; cx += (q[0] + n[0]) * f; cy += (q[1] + n[1]) * f; });
  a /= 2;
  return a ? [cx / (6 * a), cy / (6 * a)] : p[0];
};

export function buildScene(view: View, plan: Plan | null): Scene {
  const pr = projection(view);
  const iso = view === 'iso';
  const items: Item[] = [];
  const pts = (poly: Pt[], z = 0) => poly.map((p) => pr.P(p[0], p[1], z).join(',')).join(' ');
  const W = FLOOR.w, L = FLOOR.l;
  const outline: Pt[] = [[0, 0], [W, 0], [W, FLOOR.recess.y], [FLOOR.recess.x, FLOOR.recess.y], [FLOOR.recess.x, FLOOR.recess.y + FLOOR.recess.l], [W, FLOOR.recess.y + FLOOR.recess.l], [W, L], [0, L]];

  /** A prism: side faces that face the viewer (north and east), then the top. */
  const prism = (id: string, poly: Pt[], z0: number, z1: number, c: { top: string; side: string; side2: string }, extra: { op?: number; stroke?: string; sw?: number; cls?: string } = {}) => {
    if (!iso) {
      items.push({ k: 'poly', id: id + '-t', pts: pts(poly), fill: c.top, stroke: extra.stroke ?? '#1b1714', sw: extra.sw ?? 1.2, op: extra.op, cls: extra.cls });
      return;
    }
    const ccw = area(poly) > 0;
    const edges = poly.map((p, i) => ({ p, q: poly[(i + 1) % poly.length], i }));
    edges
      .map((e) => {
        const dx = e.q[0] - e.p[0], dy = e.q[1] - e.p[1];
        const n: Pt = ccw ? [dy, -dx] : [-dy, dx];
        return { ...e, n, depth: (e.p[0] + e.q[0]) / 2 - (e.p[1] + e.q[1]) / 2 };
      })
      .filter((e) => e.n[0] - e.n[1] > 1e-6)
      .sort((a, b) => a.depth - b.depth)
      .forEach((e) => {
        const quad = [pr.P(e.p[0], e.p[1], z0), pr.P(e.q[0], e.q[1], z0), pr.P(e.q[0], e.q[1], z1), pr.P(e.p[0], e.p[1], z1)].map((q) => q.join(',')).join(' ');
        items.push({ k: 'poly', id: `${id}-s${e.i}`, pts: quad, fill: e.n[0] > Math.abs(e.n[1]) * 0.5 && e.n[0] > -e.n[1] ? c.side2 : c.side, stroke: 'rgba(0,0,0,.18)', sw: 0.6, op: extra.op, cls: extra.cls });
      });
    items.push({ k: 'poly', id: id + '-t', pts: pts(poly, z1), fill: c.top, stroke: extra.stroke ?? 'rgba(0,0,0,.28)', sw: extra.sw ?? 0.8, op: extra.op, cls: extra.cls });
  };

  /* Background: the road on the north side. */
  if (iso) {
    const road: Pt[] = [[-60, -7], [W + 40, -7], [W + 40, -19], [-60, -19]];
    items.push({ k: 'poly', id: 'road', pts: pts(road), fill: COLOURS.road });
    const mid: Pt[] = [[-60, -13], [W + 40, -13]];
    items.push({ k: 'line', id: 'road-c', x1: pr.P(mid[0][0], mid[0][1])[0], y1: pr.P(mid[0][0], mid[0][1])[1], x2: pr.P(mid[1][0], mid[1][1])[0], y2: pr.P(mid[1][0], mid[1][1])[1], stroke: '#d9b45f', sw: 1.6, dash: '12 9' });
    const rl = pr.P(1.5, -11.2);
    items.push({ k: 'text', id: 'road-t', x: rl[0], y: rl[1], t: '24 m WIDE ROAD · NORTH', size: 12, weight: 700, fill: '#f6f1e8', rot: 30, ls: 1.2 });
  } else {
    items.push({ k: 'poly', id: 'road', pts: `0,0 ${pr.vbW},0 ${pr.vbW},${pr.P(0, -12)[1]} 0,${pr.P(0, -12)[1]}`, fill: COLOURS.road });
    items.push({ k: 'line', id: 'road-c', x1: 0, y1: 18, x2: pr.vbW, y2: 18, stroke: '#d9b45f', sw: 1.6, dash: '12 9' });
    items.push({ k: 'text', id: 'road-t', x: 14, y: 40, t: '24 m WIDE ROAD · NORTH', size: 12.5, weight: 700, fill: '#f6f1e8', ls: 1.2 });
  }

  /* The floor plate (ghost slab) and the glass front. */
  prism('slab', outline, -1.4, 0, COLOURS.slab, { stroke: '#8d8268', sw: 1.2 });
  const glass: Pt[] = [[0, -FLOOR.glassFt], [W, -FLOOR.glassFt], [W, 0], [0, 0]];
  items.push({ k: 'poly', id: 'glass', pts: pts(glass, 0.05), fill: COLOURS.glass, stroke: COLOURS.glassLine, sw: 1, op: 0.95 });

  /* Unallocated floor: outlined only. */
  if (plan?.spare.poly) items.push({ k: 'poly', id: 'spare', pts: pts(plan.spare.poly, 0.05), fill: 'rgba(138,106,33,.06)', stroke: '#8a6a21', sw: 1, dash: '5 4' });

  /* Occupier blocks and the lift and stair core, drawn far to near. */
  const regions: Region[] = plan ? [...plan.regions] : [];
  const H = 3.2;
  const col = (r: Region) => (r.id === 'A' ? COLOURS.a : COLOURS.b);
  const core: Pt[] = [[FLOOR.core.x, FLOOR.core.y], [FLOOR.core.x + FLOOR.core.w, FLOOR.core.y], [FLOOR.core.x + FLOOR.core.w, FLOOR.core.y + FLOOR.core.l], [FLOOR.core.x, FLOOR.core.y + FLOOR.core.l]];
  const Y1 = FLOOR.core.y, Y2 = FLOOR.core.y + FLOOR.core.l;

  interface Box { x0: number; x1: number; y0: number; y1: number; draw: () => void; }
  const boxes: Box[] = [];
  const rect = (x0: number, x1: number, y0: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  regions.forEach((r) => {
    if (!iso) {
      items.push({ k: 'poly', id: 'blk-' + r.id + '-t', pts: pts(r.poly), fill: col(r).top, stroke: '#1b1714', sw: 1.2, op: 0.9, cls: 'blk' });
      return;
    }
    // Split into the part in front of the core, the part beside it and the part behind it, so each can be ordered against the core.
    const bands: [number, number, number][] = [[0, Y1, r.eastConst ?? W], [Y1, Y2, r.eastConst ?? FLOOR.core.x], [Y2, L, r.eastConst ?? W]];
    bands.forEach(([b0, b1, xe], n) => {
      const ya = Math.max(r.from, b0), yb = Math.min(r.depth, b1);
      if (yb - ya < 0.05 || xe - r.x0 < 0.05) return;
      const poly = rect(r.x0, xe, ya, yb);
      boxes.push({ x0: r.x0, x1: xe, y0: ya, y1: yb, draw: () => prism(`blk-${r.id}${n}`, poly, 0, H, col(r), { stroke: col(r).top, sw: 0.7, cls: 'blk' }) });
    });
  });
  boxes.push({
    x0: FLOOR.core.x, x1: FLOOR.core.x + FLOOR.core.w, y0: Y1, y1: Y2,
    draw: () => {
      if (iso) prism('core', core, 0, 11.5, { top: '#4a433d', side: '#2e2925', side2: '#201c19' });
      else items.push({ k: 'poly', id: 'core-t', pts: pts(core), fill: '#fff', stroke: '#1b1714', sw: 1.6 });
    },
  });
  // A box is drawn before another when it is further from the viewer (west of it, or south of it).
  const farther = (a: Box, b: Box) => a.x1 <= b.x0 + 1e-6 || a.y0 >= b.y1 - 1e-6;
  const left = boxes.map((_, i) => i);
  while (left.length) {
    let at = left.findIndex((i) => left.every((j) => j === i || !farther(boxes[j], boxes[i])));
    if (at < 0) at = 0;
    boxes[left[at]].draw();
    left.splice(at, 1);
  }
  // Core labels sit on top of everything.
  const cc = pr.P(FLOOR.core.x + FLOOR.core.w / 2, FLOOR.core.y + FLOOR.core.l / 2, iso ? 11.5 : 0);
  items.push({ k: 'text', id: 'core-l1', x: cc[0], y: cc[1] - 2, t: 'LIFT', size: iso ? 12 : 11, weight: 700, fill: iso ? '#f6f1e8' : '#1b1714', anchor: 'middle', ls: 1 });
  items.push({ k: 'text', id: 'core-l2', x: cc[0], y: cc[1] + 13, t: 'STAIR', size: iso ? 12 : 11, weight: 700, fill: iso ? '#f6f1e8' : '#1b1714', anchor: 'middle', ls: 1 });

  /* Columns (plan view only). */
  if (!iso) COLUMNS.forEach((c, i) => {
    const a = pr.P(c[0] - 0.7, c[1] - 0.7), b = pr.P(c[0] + 0.7, c[1] + 0.7);
    items.push({ k: 'poly', id: 'col' + i, pts: `${a[0]},${a[1]} ${b[0]},${a[1]} ${b[0]},${b[1]} ${a[0]},${b[1]}`, fill: '#1b1714' });
  });

  /* Fire exit. */
  const fe = pr.P(FLOOR.fireExit.x, FLOOR.fireExit.y + (iso ? 1 : 3), 0);
  items.push({ k: 'chip', id: 'fire', x: fe[0] + (iso ? -8 : -4), y: fe[1] + (iso ? 24 : 15), w: 78, h: 20, lines: ['FIRE EXIT'], stroke: '#12804a', fill: '#12804a', color: '#ffffff' });

  /* Occupier labels: on the middle of the largest band of each region, away from the lift and stair core. */
  const labelAt = (r: Region): Pt => {
    const bands: [number, number, number][] = [[0, Y1, r.eastConst ?? W], [Y1, Y2, r.eastConst ?? FLOOR.core.x], [Y2, L, r.eastConst ?? W]];
    let best: { a: number; p: Pt } = { a: -1, p: centroid(r.poly) };
    bands.forEach(([b0, b1, xe]) => {
      const ya = Math.max(r.from, b0), yb = Math.min(r.depth, b1);
      const a = (yb - ya) * (xe - r.x0);
      if (yb - ya > 0.05 && a > best.a) best = { a, p: [(r.x0 + xe) / 2, (ya + yb) / 2] };
    });
    return best.p;
  };
  regions.forEach((r) => {
    const c = labelAt(r);
    const p = pr.P(c[0], c[1], H + 0.5);
    const word = plan && plan.regions.length > 1 ? `Occupier ${r.id === 'A' ? '1' : '2'}` : 'Your space';
    items.push({ k: 'chip', id: 'lab-' + r.id, x: p[0], y: p[1], w: iso ? 184 : 130, h: iso ? 48 : 42, lines: [word, `about ${about(r.carpet)} sq ft`], stroke: col(r).text, fill: '#ffffff', color: col(r).text, cls: 'chip-pop' });
  });

  /* Frontage brackets and the full-width dimension. */
  regions.filter((r) => r.front > 0).forEach((r) => {
    const x0 = r.id === 'A' ? 0 : W - r.front;
    const x1 = x0 + r.front;
    const a = pr.P(x0 + 0.4, -FLOOR.glassFt - 0.6 + (iso ? -1.6 : 0)), b = pr.P(x1 - 0.4, -FLOOR.glassFt - 0.6 + (iso ? -1.6 : 0));
    items.push({ k: 'line', id: 'fb-' + r.id, x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: col(r).text, sw: 3 });
  });

  if (!iso) {
    // Overall dimensions in feet and inches.
    const a = pr.P(0, L + 8), b = pr.P(W, L + 8);
    items.push({ k: 'line', id: 'dim-w', x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#1b1714', sw: 1 });
    items.push({ k: 'line', id: 'dim-w0', x1: a[0], y1: a[1] - 4, x2: a[0], y2: a[1] + 4, stroke: '#1b1714', sw: 1 });
    items.push({ k: 'line', id: 'dim-w1', x1: b[0], y1: b[1] - 4, x2: b[0], y2: b[1] + 4, stroke: '#1b1714', sw: 1 });
    items.push({ k: 'text', id: 'dim-wt', x: (a[0] + b[0]) / 2, y: a[1] + 17, t: fi(W), size: 11.5, weight: 700, fill: '#1b1714', anchor: 'middle' });
    // Depth of each occupier, on the right.
    regions.forEach((r) => {
      const x = W + 5.2 + (r.id === 'B' ? 5 : 0);
      const p = pr.P(x, r.from + 0.3), q = pr.P(x, r.depth - 0.3);
      if (q[1] - p[1] < 14) return;
      items.push({ k: 'line', id: 'dd-' + r.id, x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: col(r).text, sw: 1.6 });
      items.push({ k: 'line', id: 'dd0-' + r.id, x1: p[0] - 3, y1: p[1], x2: p[0] + 3, y2: p[1], stroke: col(r).text, sw: 1.6 });
      items.push({ k: 'line', id: 'dd1-' + r.id, x1: q[0] - 3, y1: q[1], x2: q[0] + 3, y2: q[1], stroke: col(r).text, sw: 1.6 });
      items.push({ k: 'text', id: 'ddt-' + r.id, x: p[0] + 5, y: (p[1] + q[1]) / 2, t: r.id === 'A' && plan?.scheme === 'side' ? `${feet(r.front)} ft wide` : `${feet(r.depth - r.from)} ft deep`, size: 10.5, weight: 700, fill: col(r).text, rot: 90, anchor: 'middle' });
    });
    // North arrow.
    items.push({ k: 'text', id: 'north', x: pr.vbW - 22, y: 62, t: 'N ↑', size: 13, weight: 700, fill: '#f6f1e8', anchor: 'middle' });
  }

  return { vb: `0 0 ${pr.vbW} ${pr.vbH}`, w: pr.vbW, h: pr.vbH, items };
}

/** Building stack for "more than one floor": ground plus three floors as slabs, the chosen floors filled. */
export function buildStack(count: number): Scene {
  const items: Item[] = [];
  const s = 3.6, ox = 322, oy = 168, c = 0.866;
  const P = (x: number, y: number, z: number): Pt => { const v = FLOOR.l - y; return [+(ox + (x - v) * c * s).toFixed(1), +(oy + (x + v) * 0.5 * s - z * s * 0.95).toFixed(1)]; };
  const W = FLOOR.w, L = FLOOR.l;
  const rect: Pt[] = [[0, 0], [W, 0], [W, L], [0, L]];
  const levels = [
    { id: 'g', z: 0, label: 'Ground · parking and entry', on: false },
    { id: 'f1', z: 14, label: 'Floor 1', on: count >= 1 },
    { id: 'f2', z: 28, label: 'Floor 2', on: count >= 2 },
    { id: 'f3', z: 42, label: 'Floor 3', on: count >= 3 },
  ];
  // Which floors are taken: Floor 1 first, then 2, then 3, counted from the lowest upper floor.
  levels.forEach((lv) => {
    const top = lv.on ? '#e3b04b' : '#efe8d6';
    const side = lv.on ? '#b98a2a' : '#cfc6ae';
    const side2 = lv.on ? '#9d731f' : '#bdb297';
    const quad = (a: Pt, b: Pt, z0: number, z1: number) => [P(a[0], a[1], z0), P(b[0], b[1], z0), P(b[0], b[1], z1), P(a[0], a[1], z1)].map((q) => q.join(',')).join(' ');
    items.push({ k: 'poly', id: lv.id + '-n', pts: quad([0, 0], [W, 0], lv.z, lv.z + 2.2), fill: side, stroke: 'rgba(0,0,0,.2)', sw: 0.6 });
    items.push({ k: 'poly', id: lv.id + '-e', pts: quad([W, 0], [W, L], lv.z, lv.z + 2.2), fill: side2, stroke: 'rgba(0,0,0,.2)', sw: 0.6 });
    items.push({ k: 'poly', id: lv.id + '-t', pts: rect.map((p) => P(p[0], p[1], lv.z + 2.2).join(',')).join(' '), fill: top, stroke: 'rgba(0,0,0,.3)', sw: 0.8 });
    // Labels sit to the right of the stack, level with each slab, joined by a hairline so they never cover the drawing.
    const lp = P(W, L, lv.z + 1.1);
    const lx = 470;
    items.push({ k: 'line', id: lv.id + '-ll', x1: lp[0] + 6, y1: lp[1], x2: lx - 6, y2: lp[1], stroke: lv.on ? '#8a6a21' : 'rgba(27,23,20,.3)', sw: 1, dash: '2 3' });
    items.push({ k: 'text', id: lv.id + '-l', x: lx, y: lp[1] + 4, t: lv.label, size: 13, weight: lv.on ? 700 : 500, fill: lv.on ? '#6b4b0c' : '#5b5249' });
    if (lv.on) items.push({ k: 'text', id: lv.id + '-m', x: lx, y: lp[1] + 19, t: 'in your plan', size: 10.5, weight: 600, fill: '#6b4b0c' });
  });
  return { vb: '0 0 700 430', w: 700, h: 430, items };
}
