import {
  BufferGeometry, ExtrudeGeometry, IcosahedronGeometry, MeshStandardMaterial, Path, PlaneGeometry, PointLight, Shape, ShapeGeometry,
  SphereGeometry, CylinderGeometry, ConeGeometry,
} from 'three';
import { BUILDING } from '../../config/building.config';
import { Batcher } from './batch';
import { Mats } from './materials';

/**
 * Ground-floor character: the east wall (Varanasi ghat motifs, lit niches, a planted edge along the walkway), the west wall
 * (a light stone jali with warm light behind it), the south wall (a few lights and one niche), plus the lift portal, lobby
 * finish and stair detail. Everything is drawn from the plot dimensions and is indicative.
 * Coordinates are metres in world axes (x east, y up, z south); plot feet are converted with wx/wz.
 */
const FT = BUILDING.ft;
const cxm = BUILDING.plot.w / 2;
const wx = (x: number): number => (x - cxm) * FT;
const wz = (z: number): number => z * FT;
const WALL = 0.23;

/** Small deterministic random so the planting is the same on every load. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** Pointed arch outline: base on y = 0, straight sides up to `rect`, apex at rect + rise. */
function archPath(p: Shape | Path, w: number, rect: number, rise: number, from = 0): void {
  const hw = w / 2;
  p.moveTo(-hw, from);
  p.lineTo(-hw, rect);
  p.quadraticCurveTo(-hw, rect + rise * 0.82, 0, rect + rise);
  p.quadraticCurveTo(hw, rect + rise * 0.82, hw, rect);
  p.lineTo(hw, from);
  p.lineTo(-hw, from);
}

/** Frame (stone ring) and lit back panel of an arched niche, in a local frame: x along the wall, y up, +z towards the viewer. */
function archParts(w: number, rect: number, rise: number, frame: number, depth: number, from = 0): { ring: BufferGeometry; glow: BufferGeometry } {
  const outer = new Shape();
  archPath(outer, w + 2 * frame, rect, rise + frame * 0.7, from);
  const hole = new Path();
  archPath(hole, w, rect, rise, from);
  outer.holes.push(hole);
  const inner = new Shape();
  archPath(inner, w, rect, rise, from);
  const glow = new ShapeGeometry(inner);
  // ShapeGeometry uses metres as UVs; remap to 0..1 so the glow texture spans the opening
  const pos = glow.attributes['position'], uv = glow.attributes['uv'];
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) - from) / (rect + rise - from));
  return { ring: new ExtrudeGeometry(outer, { depth, bevelEnabled: false }), glow };
}

/** Rotate a local-frame geometry so its +z faces `normalYaw`, then move it to (x, y, z). */
function put(B: Batcher, mat: MeshStandardMaterial, g: BufferGeometry, x: number, y: number, z: number, normalYaw: number): void {
  g.rotateY(normalYaw);
  g.translate(x, y, z);
  B.geo(mat, g);
}

const FACE_WEST = -Math.PI / 2; // normal pointing −x: used on the east wall
const FACE_EAST = Math.PI / 2; // normal pointing +x: used on the west wall
const FACE_NORTH = Math.PI; // normal pointing −z: used on the south wall
const FACE_SOUTH = 0; // normal pointing +z: used on the lift wall

/** A lit, arched niche with a small brass lamp on a stone shelf. */
function niche(B: Batcher, Bg: Batcher, m: Mats, x: number, y: number, z: number, yaw: number, w: number, rect: number, rise: number, frame: number): void {
  const { ring, glow } = archParts(w, rect, rise, frame, 0.14);
  put(B, m.sandstoneLight, ring, x, y, z, yaw);
  // glow panel a hair in front of the wall plane, offset along the normal
  const nx = Math.sin(yaw), nz = Math.cos(yaw);
  put(Bg, m.glowWarm, glow, x + nx * 0.006, y, z + nz * 0.006, yaw);
  // shelf and lamp
  const sx = x + nx * 0.1, sz = z + nz * 0.1;
  B.box(m.sandstone, sx, y + 0.03, sz, Math.abs(nz) > 0.5 ? w * 0.85 : 0.2, 0.06, Math.abs(nz) > 0.5 ? 0.2 : w * 0.85);
  B.box(m.brass, sx, y + 0.085, sz, 0.14, 0.05, 0.14);
  B.box(m.lampGlow, sx, y + 0.14, sz, 0.035, 0.07, 0.035);
}

function smallTree(B: Batcher, m: Mats, x: number, y: number, z: number, h: number, r: () => number): void {
  const trunk = new CylinderGeometry(0.045, 0.07, h * 0.55, 6);
  trunk.translate(x, y + h * 0.275, z);
  B.geo(m.trunk, trunk);
  const blobs: [number, number, number, number, MeshStandardMaterial][] = [
    [0, 0.62, 0, 0.3, m.green], [0.16, 0.5, 0.06, 0.22, m.leafLight], [-0.15, 0.55, -0.07, 0.23, m.greenDark], [0.02, 0.8, -0.04, 0.2, m.green],
  ];
  for (const [dx, dy, dz, rr, mat] of blobs) {
    const g = new IcosahedronGeometry(rr * (h / 2.6) * (0.9 + r() * 0.2), 1);
    g.translate(x + dx * (h / 2.6), y + dy * h, z + dz * (h / 2.6));
    B.geo(mat, g);
  }
}

/** Chhatri: four slim posts, a small roof slab, a dome and a brass finial. */
function chhatri(B: Batcher, m: Mats, cx: number, y: number, cz: number): void {
  const s = 0.72, p = 0.07, ph = 0.56;
  B.box(m.sandstone, cx, y + 0.045, cz, s + 0.14, 0.09, s + 0.14);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(m.sandstoneLight, cx + (dx * (s - p)) / 2, y + 0.09 + ph / 2, cz + (dz * (s - p)) / 2, p, ph, p);
  B.box(m.sandstone, cx, y + 0.09 + ph + 0.03, cz, s + 0.2, 0.06, s + 0.2);
  const dome = new SphereGeometry(0.34, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.scale(1, 0.95, 1);
  dome.translate(cx, y + 0.09 + ph + 0.06, cz);
  B.geo(m.sandstoneLight, dome);
  const stem = new ConeGeometry(0.035, 0.2, 6);
  stem.translate(cx, y + 0.09 + ph + 0.06 + 0.34 * 0.95 + 0.08, cz);
  B.geo(m.brass, stem);
}

export interface GroundResult { lights: PointLight[]; }

/** East wall, west wall and south wall of the parking level. `B` carries solid parts, `Bg` the unshadowed glow and jali parts. */
export function groundWalls(B: Batcher, Bg: Batcher, m: Mats): GroundResult {
  const lights: PointLight[] = [];
  const pw = BUILDING.plot.w, pd = BUILDING.plot.d;
  const r = rng(7);

  /* ── east wall: ghat arches, mural panels, stepped crown, chhatris, planted edge ───────────────────────── */
  {
    const xi = wx(pw) - WALL / 2; // inner face, towards the walkway
    const zA = wz(6.4), zB = wz(pd) - 0.45;
    const N = 11, pitch = (zB - zA) / N;
    const hb = 2.4;
    B.span(m.creamWarm, xi, 1.8, zA - 0.2, xi + WALL, hb, wz(pd) + WALL / 2);

    const featureBay = 4;
    for (let i = 0; i <= N; i++) {
      const z = zA + i * pitch;
      B.box(m.sandstoneDark, xi - 0.09, hb / 2, z, 0.18, hb, 0.34);
      B.box(m.sandstone, xi - 0.12, 0.1, z, 0.24, 0.2, 0.46);
      B.box(m.sandstone, xi - 0.12, hb - 0.07, z, 0.24, 0.14, 0.46);
      B.box(m.brass, xi - 0.186, hb / 2 + 0.05, z, 0.012, hb - 0.7, 0.05);
      B.box(m.brass, xi - 0.12, hb + 0.2, z, 0.07, 0.22, 0.07);
    }

    const chhatriBays = [1, 6, 9];
    for (let i = 0; i < N; i++) {
      const zc = zA + (i + 0.5) * pitch;
      const inner = pitch - 0.34;
      if (i === featureBay) {
        niche(B, Bg, m, xi, 0.3, zc, FACE_WEST, 1.5, 1.2, 0.72, 0.13);
        // ghat steps in front of the feature niche, narrowing towards the wall
        for (let k = 0; k < 3; k++) B.span(m.sandstoneLight, xi - 0.9 + k * 0.26, 0, zc - 1.0 + k * 0.12, xi - 0.1, 0.1 + k * 0.1, zc + 1.0 - k * 0.12);
      } else if (i % 2 === 0) {
        niche(B, Bg, m, xi, 0.58, zc, FACE_WEST, 1.1, 1.0, 0.55, 0.1);
      } else {
        // mural panel with a slim stone frame
        const pw_ = inner - 0.3, ph = 1.3, y0 = 0.72;
        const plane = new PlaneGeometry(pw_, ph);
        plane.translate(0, ph / 2, 0);
        put(B, m.ghat, plane, xi - 0.004, y0, zc, FACE_WEST);
        B.box(m.sandstoneLight, xi - 0.04, y0 + ph + 0.04, zc, 0.08, 0.08, pw_ + 0.16);
        B.box(m.sandstoneLight, xi - 0.04, y0 - 0.04, zc, 0.08, 0.08, pw_ + 0.16);
        B.box(m.sandstoneLight, xi - 0.04, y0 + ph / 2, zc - pw_ / 2 - 0.04, 0.08, ph, 0.08);
        B.box(m.sandstoneLight, xi - 0.04, y0 + ph / 2, zc + pw_ / 2 + 0.04, 0.08, ph, 0.08);
        B.box(m.brass, xi - 0.085, y0 - 0.1, zc, 0.012, 0.025, pw_ + 0.16);
      }
      // crown: a coping band, then either a chhatri or stepped ghat blocks
      B.box(m.sandstone, xi - 0.02, hb + 0.04, zc, 0.3, 0.08, pitch - 0.1);
      if (chhatriBays.includes(i)) {
        chhatri(B, m, xi + WALL / 2, hb + 0.08, zc);
      } else {
        for (let k = 0; k < 3; k++) B.box(m.sandstoneLight, xi + 0.04, hb + 0.13 + k * 0.1, zc, 0.2, 0.1, inner * (0.78 - k * 0.27));
      }
    }

    // planted edge along the wall, with a break for the feature steps
    const kerbX0 = xi - 0.8, kerbX1 = xi - 0.06;
    const runs: [number, number][] = [
      [zA + 0.2, zA + featureBay * pitch - 0.1],
      [zA + (featureBay + 1) * pitch + 0.1, zB - 0.2],
    ];
    for (const [za, zb] of runs) {
      B.span(m.sandstone, kerbX0, 0, za, kerbX0 + 0.1, 0.44, zb);
      B.span(m.sandstoneLight, kerbX0 - 0.02, 0.44, za, kerbX0 + 0.12, 0.47, zb);
      B.span(m.soil, kerbX0 + 0.1, 0.28, za, kerbX1, 0.42, zb);
      B.span(m.sandstone, kerbX0, 0, za - 0.1, kerbX1, 0.47, za);
      B.span(m.sandstone, kerbX0, 0, zb, kerbX1, 0.47, zb + 0.1);
      // soft edge light along the kerb
      B.span(m.lampGlow, kerbX0 - 0.012, 0.3, za + 0.15, kerbX0, 0.34, zb - 0.15);
      // shrubs
      for (let z = za + 0.25; z < zb - 0.2; z += 0.5) {
        const rr = 0.2 + r() * 0.14;
        const g = new IcosahedronGeometry(rr, 1);
        g.translate(kerbX0 + 0.28 + r() * 0.3, 0.42 + rr * 0.78, z + (r() - 0.5) * 0.2);
        B.geo([m.green, m.greenDark, m.leafLight][Math.floor(r() * 3)], g);
      }
    }
    // slim trees between bays
    for (const i of [2, 7, 10]) smallTree(B, m, xi - 0.5, 0.42, zA + i * pitch, 2.5, r);
    // big pots either side of the feature steps
    for (const s of [-1, 1]) {
      const zc = zA + (featureBay + 0.5) * pitch + s * 1.3;
      const pot = new CylinderGeometry(0.26, 0.2, 0.5, 10);
      pot.translate(xi - 0.45, 0.25, zc);
      B.geo(m.sandstoneDark, pot);
      for (let k = 0; k < 3; k++) {
        const g = new IcosahedronGeometry(0.2 + k * 0.02, 1);
        g.translate(xi - 0.45 + (k - 1) * 0.1, 0.62 + k * 0.1, zc + (k - 1) * 0.08);
        B.geo(m.green, g);
      }
    }
    for (const zf of [30, 82]) {
      const l = new PointLight('#ffc98a', 0, 9, 1.4);
      l.position.set(xi - 1.3, 1.9, wz(zf));
      lights.push(l);
    }
  }

  /* ── west wall: a light stone jali with warm light behind it ───────────────────────────────────────────── */
  {
    const xw = wx(0) + WALL / 2; // inner face, towards the 5 ft passage
    const zA = wz(2.6), zB = wz(pd) - 0.4;
    const hb = 2.1;
    B.span(m.creamWarm, xw - WALL, 1.8, zA - 0.2, xw, hb, wz(pd) + WALL / 2);
    const n = Math.round((zB - zA) / 1.45), pitch = (zB - zA) / n;
    for (let i = 0; i <= n; i++) {
      const z = zA + i * pitch;
      B.box(m.sandstone, xw + 0.04, hb / 2, z, 0.1, hb, 0.12);
      B.box(m.lampGlow, xw + 0.1, 0.2, z, 0.03, 0.2, 0.05); // small uplight on every post
    }
    const y0 = 0.72, y1 = 1.9;
    for (let i = 0; i < n; i++) {
      const zc = zA + (i + 0.5) * pitch, wd = pitch - 0.12;
      const back = new PlaneGeometry(wd, y1 - y0);
      back.translate(0, (y1 - y0) / 2, 0);
      put(Bg, m.glowWarm, back, xw + 0.004, y0, zc, FACE_EAST);
      const jali = new PlaneGeometry(wd, y1 - y0);
      const uv = jali.attributes['uv'];
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * (wd / 0.5), uv.getY(k) * ((y1 - y0) / 0.5));
      jali.translate(0, (y1 - y0) / 2, 0);
      put(Bg, m.jaliStone, jali, xw + 0.04, y0, zc, FACE_EAST);
      B.box(m.sandstone, xw + 0.05, y0 - 0.03, zc, 0.12, 0.06, wd + 0.1);
      B.box(m.sandstone, xw + 0.05, y1 + 0.03, zc, 0.12, 0.06, wd + 0.1);
    }
    B.span(m.sandstoneLight, xw - 0.04, hb - 0.02, zA - 0.2, xw + 0.1, hb + 0.07, wz(pd) + WALL / 2);
    B.span(m.brass, xw + 0.1, y1 + 0.075, zA, xw + 0.112, y1 + 0.095, zB);
    const l = new PointLight('#ffc98a', 0, 8, 1.5);
    l.position.set(xw + 0.7, 1.3, wz(60));
    lights.push(l);
  }

  /* ── south wall: a few lights and one small niche ────────────────────────────────────────────────────── */
  {
    const zs = wz(pd) - WALL / 2; // inner face, towards the court
    const x0 = wx(0) + WALL / 2 + 0.9, x1 = wx(pw) - WALL / 2 - 1.4;
    niche(B, Bg, m, (x0 + x1) / 2, 0.62, zs, FACE_NORTH, 0.9, 0.62, 0.4, 0.07);
    for (const f of [0.08, 0.28, 0.72, 0.92]) {
      const x = x0 + (x1 - x0) * f;
      B.box(m.brass, x, 1.38, zs - 0.03, 0.16, 0.34, 0.06);
      B.box(m.lampGlow, x, 1.38, zs - 0.065, 0.08, 0.26, 0.02);
    }
    B.span(m.brass, x0 - 0.4, 1.58, zs - 0.012, x1 + 0.4, 1.6, zs);
  }

  return { lights };
}

/** The stone portal round the lift door and the finish of the lobby wall. `zl` is the wall plane between the lobby and the lift. */
export function liftPortal(B: Batcher, Bg: Batcher, m: Mats, y0: number, zl: number, lcx: number, lw: number): void {
  const face = zl + 0.1;
  const w = lw + 0.1;
  const { ring, glow } = archParts(w, 2.15, 0.36, 0.17, 0.1);
  put(B, m.sandstoneLight, ring, lcx, y0, face, FACE_SOUTH);
  // lunette above the door: lit, with the LIFT sign in it
  const lun = new Shape();
  archPath(lun, w, 2.15, 0.36, 2.15);
  const lg = new ShapeGeometry(lun);
  const lp = lg.attributes['position'], lu = lg.attributes['uv'];
  for (let i = 0; i < lp.count; i++) lu.setXY(i, (lp.getX(i) + w / 2) / w, (lp.getY(i) - 2.15) / 0.36);
  put(Bg, m.glowWarm, lg, lcx, y0, face + 0.006, FACE_SOUTH);
  const sign = new PlaneGeometry(0.5, 0.093);
  sign.translate(lcx, y0 + 2.27, face + 0.012);
  B.geo(m.liftSign, sign);
  // call plate
  B.box(m.brass, lcx + 0.9, y0 + 1.1, face + 0.012, 0.08, 0.16, 0.02);
  B.box(m.lampGlow, lcx + 0.9, y0 + 1.14, face + 0.026, 0.025, 0.025, 0.012);
}

/** Ground lobby: polished stone inlay with a brass border, a stone dado on the lift wall and a cove light. */
export function lobbyFinish(B: Batcher, m: Mats, zl: number, x0: number, x1: number, servicesX: [number, number], portalX: [number, number], H: number): void {
  const zLo = zl + 0.12, zHi = wz(57.45);
  B.span(m.floor, x0 + 0.12, 0.002, zLo, x1 - 0.12, 0.016, zHi);
  const bz0 = zLo + 0.22, bz1 = zHi - 0.22, bx0 = x0 + 0.4, bx1 = x1 - 0.4;
  B.span(m.brass, bx0, 0.016, bz0, bx1, 0.02, bz0 + 0.025);
  B.span(m.brass, bx0, 0.016, bz1 - 0.025, bx1, 0.02, bz1);
  B.span(m.brass, bx0, 0.016, bz0, bx0 + 0.025, 0.02, bz1);
  B.span(m.brass, bx1 - 0.025, 0.016, bz0, bx1, 0.02, bz1);
  // dado on the lift wall, in three runs round the services door and the lift portal
  const runs: [number, number][] = [[x0 + 0.1, servicesX[0] - 0.05], [servicesX[1] + 0.05, portalX[0]], [portalX[1], x1 - 0.1]];
  for (const [a, b] of runs) {
    if (b - a < 0.1) continue;
    B.span(m.sandstoneDark, a, 0, zl + 0.1, b, 0.92, zl + 0.15);
    B.span(m.brass, a, 0.92, zl + 0.1, b, 0.94, zl + 0.16);
  }
  // cove light along the top of the lift wall
  B.span(m.lampGlow, x0 + 0.1, H - 0.28, zl + 0.1, x1 - 0.1, H - 0.25, zl + 0.16);
}

export interface StairSpec {
  y0: number; H: number; n: number; L: number; rH: number;
  zTop: number; zBot: number; eastX: [number, number]; westX: [number, number];
  ground: boolean;
}

/** Stone treads, railings (glass with a brass handrail, wall handrails), step lights and a STAIRS sign. */
export function stairDetail(B: Batcher, Bg: Batcher, m: Mats, s: StairSpec): void {
  const { y0, n, L, rH, zTop, zBot, eastX, westX } = s;
  const runUp = (zBot - zTop) / (L - 1);
  const runDown = (zBot - zTop) / (n - L);
  const ex0 = wx(eastX[0]), ex1 = wx(eastX[1]), wx0 = wx(westX[0]), wx1 = wx(westX[1]);

  // treads
  for (let k = 1; k < L; k++) {
    const za = wz(zTop + (k - 1) * runUp), zb = wz(zTop + k * runUp);
    B.span(m.stoneTread, ex0, y0 + k * rH, za - 0.035, ex1, y0 + k * rH + 0.03, zb);
  }
  B.span(m.stoneTread, wx0, y0 + L * rH, wz(zBot), ex1, y0 + L * rH + 0.03, wz(70.3));
  for (let j = L + 1; j < n; j++) {
    const idx = j - L;
    const za = wz(zBot - idx * runDown), zb = wz(zBot - (idx - 1) * runDown);
    B.span(m.stoneTread, wx0, y0 + j * rH, za, wx1, y0 + j * rH + 0.03, zb + 0.035);
  }

  // rails: a line from (z1, y1) to (z2, y2) at a given x
  const rail = (x: number, z1: number, y1: number, z2: number, y2: number, glass: boolean): void => {
    const dz = z2 - z1, dy = y2 - y1, len = Math.hypot(dz, dy);
    const ang = -Math.atan2(dy, dz);
    const mz = (z1 + z2) / 2, my = (y1 + y2) / 2;
    B.box(m.brass, x, my + 0.92, mz, 0.05, 0.045, len, 0, ang);
    if (glass) {
      B.box(m.glassPartition, x, my + 0.48, mz, 0.02, 0.8, len, 0, ang);
      const posts = Math.max(2, Math.round(len / 1.25));
      for (let i = 0; i <= posts; i++) {
        const f = i / posts;
        B.box(m.brass, x, y1 + dy * f + 0.46, z1 + dz * f, 0.04, 0.92, 0.04);
      }
    } else {
      for (const f of [0.15, 0.85]) B.box(m.brass, x, y1 + dy * f + 0.8, z1 + dz * f, 0.03, 0.13, 0.03);
    }
  };
  const eY1 = y0 + rH, eY2 = y0 + (L - 1) * rH;
  const wY1 = y0 + L * rH, wY2 = y0 + (n - 1) * rH;
  // well side (glass) and wall side (handrail only)
  rail(wx(34.62) - 0.03, wz(zTop), eY1, wz(zBot), eY2, true);
  rail(wx(33.83) + 0.03, wz(zBot), wY1, wz(zTop), wY2, true);
  rail(wx(40.45) - 0.12, wz(zTop), eY1, wz(zBot), eY2, false);
  rail(wx(27.8) + 0.12, wz(zBot), wY1, wz(zTop), wY2, false);

  // a soft light on the face of every third riser (east flight) and a lit sign at the foot of the stair
  for (let k = 3; k < L; k += 3) {
    const za = wz(zTop + (k - 1) * runUp);
    Bg.span(m.lampGlow, ex0 + 0.1, y0 + k * rH - 0.05, za - 0.012, ex1 - 0.1, y0 + k * rH - 0.02, za);
  }
  const sign = new PlaneGeometry(0.5, 0.093);
  sign.translate(wx(37.2), y0 + 1.95, wz(zTop) - 0.5);
  sign.rotateY(0);
  B.geo(m.stairSign, sign);
}
