import {
  BoxGeometry, BufferGeometry, ExtrudeGeometry, Group, IcosahedronGeometry, Mesh, MeshStandardMaterial, Path, PlaneGeometry, PointLight, Shape, ShapeGeometry,
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

/** Arch-shaped fill (jali, mural) for an opening: UVs are metres × `uvScale`, or 0..1 over the opening when `unit` is set. */
function archFill(w: number, rect: number, rise: number, uvScale: number, unit = false): BufferGeometry {
  const sh = new Shape();
  archPath(sh, w, rect, rise, 0);
  const g = new ShapeGeometry(sh);
  const pos = g.attributes['position'], uv = g.attributes['uv'];
  const H = rect + rise;
  for (let i = 0; i < pos.count; i++) {
    if (unit) uv.setXY(i, (pos.getX(i) + w / 2) / w, pos.getY(i) / H);
    else uv.setXY(i, (pos.getX(i) + w / 2) * uvScale, pos.getY(i) * uvScale);
  }
  return g;
}

/**
 * A small wall shrine cut into the water wall opposite the lift lobby: a pointed arch in pale stone with warm light inside, a stone
 * plinth, three brass lamps, and a little stepped crown with a brass finial. `xf` is the face of the backing stone.
 */
function shrine(B: Batcher, Bg: Batcher, m: Mats, xf: number, y: number, zc: number): void {
  const w = 0.56, rect = 0.56, rise = 0.34, frame = 0.075;
  const { ring, glow } = archParts(w, rect, rise, frame, 0.1);
  put(B, m.sandstoneLight, ring, xf, y, zc, FACE_WEST);
  put(Bg, m.glowWarm, glow, xf - 0.012, y, zc, FACE_WEST);
  // plinth and lamps
  B.box(m.sandstoneLight, xf - 0.1, y + 0.03, zc, 0.2, 0.06, w * 0.86);
  B.box(m.brass, xf - 0.1, y + 0.075, zc, 0.22, 0.03, w * 0.5);
  for (const dz of [-0.17, 0.17]) {
    const cup = new CylinderGeometry(0.045, 0.03, 0.03, 10);
    cup.translate(xf - 0.1, y + 0.105, zc + dz);
    B.geo(m.brass, cup);
    B.box(m.lampGlow, xf - 0.1, y + 0.14, zc + dz, 0.02, 0.04, 0.02);
  }
  const stem = new CylinderGeometry(0.012, 0.02, 0.2, 8);
  stem.translate(xf - 0.1, y + 0.2, zc);
  B.geo(m.brass, stem);
  const bowl = new CylinderGeometry(0.05, 0.03, 0.035, 10);
  bowl.translate(xf - 0.1, y + 0.315, zc);
  B.geo(m.brass, bowl);
  B.box(m.lampGlow, xf - 0.1, y + 0.355, zc, 0.024, 0.05, 0.024);
  // crown: three narrowing steps, a brass kalash on top
  const ty = y + rect + rise + frame * 0.7;
  B.box(m.sandstoneLight, xf - 0.06, ty + 0.025, zc, 0.12, 0.05, w + 0.2);
  B.box(m.sandstone, xf - 0.055, ty + 0.075, zc, 0.1, 0.05, w * 0.7);
  B.box(m.sandstoneLight, xf - 0.05, ty + 0.125, zc, 0.08, 0.05, w * 0.42);
  const kal = new SphereGeometry(0.036, 10, 8);
  kal.translate(xf - 0.05, ty + 0.18, zc);
  B.geo(m.brass, kal);
  const fin = new ConeGeometry(0.014, 0.07, 6);
  fin.translate(xf - 0.05, ty + 0.24, zc);
  B.geo(m.brass, fin);
}

/** A lit arched jali bay: stone frame, carved screen, warm light behind. Local frame as `put`. */
function jaliArch(B: Batcher, Bg: Batcher, m: Mats, x: number, y: number, z: number, yaw: number, w: number, rect: number, rise: number, frame: number): void {
  const { ring, glow } = archParts(w, rect, rise, frame, 0.15);
  put(B, m.sandstoneLight, ring, x, y, z, yaw);
  const nx = Math.sin(yaw), nz = Math.cos(yaw);
  put(Bg, m.glowWarm, glow, x + nx * 0.006, y, z + nz * 0.006, yaw);
  put(Bg, m.jaliStone, archFill(w, rect, rise, 2), x + nx * 0.045, y, z + nz * 0.045, yaw);
  // a slim brass sill and a small hanging lamp at the apex
  const sx = x + nx * 0.1, sz = z + nz * 0.1;
  B.box(m.brass, sx, y - 0.015, sz, Math.abs(nz) > 0.5 ? w + 2 * frame : 0.1, 0.03, Math.abs(nz) > 0.5 ? 0.1 : w + 2 * frame);
}

/** Green wall: bronze frame, dark backing and a lot of small leaves, with a soft light along the foot. */
function greenPanel(B: Batcher, Bg: Batcher, m: Mats, x: number, z: number, yaw: number, w: number, y0: number, y1: number, r: () => number): void {
  const nx = Math.sin(yaw), nz = Math.cos(yaw);
  const along = Math.abs(nz) > 0.5 ? 'x' : 'z';
  const box = (cx: number, cy: number, cz: number, sw: number, sh: number, sd: number, mat: MeshStandardMaterial): void => {
    // sw along the wall, sd out of the wall
    if (along === 'x') B.box(mat, cx, cy, cz, sw, sh, sd); else B.box(mat, cx, cy, cz, sd, sh, sw);
  };
  box(x + nx * 0.03, (y0 + y1) / 2, z + nz * 0.03, w, y1 - y0, 0.06, m.greenDark);
  // frame
  box(x + nx * 0.09, y0 - 0.03, z + nz * 0.09, w + 0.16, 0.06, 0.16, m.bronze);
  box(x + nx * 0.09, y1 + 0.03, z + nz * 0.09, w + 0.16, 0.06, 0.16, m.bronze);
  for (const s of [-1, 1]) {
    const ox = along === 'x' ? s * (w / 2 + 0.04) : 0, oz = along === 'x' ? 0 : s * (w / 2 + 0.04);
    box(x + ox + nx * 0.09, (y0 + y1) / 2, z + oz + nz * 0.09, 0.06, y1 - y0 + 0.12, 0.16, m.bronze);
  }
  const cols = Math.max(4, Math.round(w / 0.2)), rows = Math.round((y1 - y0) / 0.19);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const u = ((i + 0.5 + (j % 2) * 0.5) / cols - 0.5) * w * 0.96 + (r() - 0.5) * 0.05;
      const yy = y0 + 0.08 + (j + 0.5) * ((y1 - y0 - 0.12) / rows) + (r() - 0.5) * 0.05;
      const rr = 0.07 + r() * 0.05;
      const g = new IcosahedronGeometry(rr, 0);
      g.scale(1, 0.8, 0.5);
      g.rotateZ(r() * Math.PI);
      const gx = along === 'x' ? x + u : x, gz = along === 'x' ? z : z + u;
      g.translate(gx + nx * (0.07 + r() * 0.05), yy, gz + nz * (0.07 + r() * 0.05));
      B.geo([m.wallLeaf, m.wallLeafDark, m.wallLeafLight][Math.floor(r() * 3)], g);
    }
  }
  box(x + nx * 0.13, y0 + 0.02, z + nz * 0.13, w * 0.92, 0.035, 0.03, m.lampGlow);
  box(x + nx * 0.13, y1 - 0.03, z + nz * 0.13, w * 0.92, 0.03, 0.03, m.lampGlow);
}

export interface GroundResult { lights: PointLight[]; }

/** East wall, west wall and south wall of the parking level. `B` carries solid parts, `Bg` the unshadowed glow and jali parts. */
export function groundWalls(B: Batcher, Bg: Batcher, m: Mats): GroundResult {
  const lights: PointLight[] = [];
  const pw = BUILDING.plot.w, pd = BUILDING.plot.d;
  const r = rng(7);

  /* ── east wall: carved jali arches alternating with lit water walls, a small shrine niche, planted beds ─── */
  {
    const xi = wx(pw) - WALL / 2; // inner face, towards the walkway
    const zA = wz(6.4), zB = wz(pd) - 0.45;
    const N = 11, pitch = (zB - zA) / N;
    const hb = 2.5;
    B.span(m.creamWarm, xi, 1.8, zA - 0.2, xi + WALL, hb, wz(pd) + WALL / 2);

    const featureBay = 4;
    const isWater = (i: number): boolean => i % 2 === 1;
    const chhatriBays = [2, 6, 10];

    // pilasters between bays: fluted stone with a brass inlay and a stepped cap
    for (let i = 0; i <= N; i++) {
      const z = zA + i * pitch;
      B.box(m.sandstoneDark, xi - 0.09, hb / 2, z, 0.18, hb, 0.34);
      B.box(m.sandstone, xi - 0.12, 0.1, z, 0.26, 0.2, 0.48);
      B.box(m.sandstone, xi - 0.12, hb - 0.07, z, 0.26, 0.14, 0.48);
      B.box(m.sandstoneLight, xi - 0.1, hb + 0.03, z, 0.3, 0.06, 0.54);
      B.box(m.brass, xi - 0.186, hb / 2 + 0.05, z, 0.012, hb - 0.7, 0.05);
      B.box(m.brass, xi - 0.12, hb + 0.2, z, 0.07, 0.22, 0.07);
    }

    for (let i = 0; i < N; i++) {
      const zc = zA + (i + 0.5) * pitch;
      const inner = pitch - 0.34;

      if (i === featureBay) {
        // a granite water wall with a small lit shrine niche in the middle, one low step in front
        const ww = inner - 0.15, y0 = 0.5, y1 = 2.18;
        B.box(m.granite, xi - 0.045, (y0 + y1) / 2, zc, 0.06, y1 - y0, ww);
        for (const s of [-1, 1]) B.box(m.sandstoneLight, xi - 0.075, (y0 + y1) / 2, zc + s * (ww / 2 + 0.045), 0.12, y1 - y0 + 0.16, 0.09);
        B.box(m.sandstoneLight, xi - 0.075, y1 + 0.04, zc, 0.12, 0.08, ww + 0.18);
        B.box(m.sandstoneLight, xi - 0.075, y0 - 0.04, zc, 0.12, 0.08, ww + 0.18);
        // two sheets of water either side of the niche
        const sheetW = (ww - 1.05) / 2;
        for (const s of [-1, 1]) {
          const sheet = new PlaneGeometry(sheetW, y1 - y0 - 0.12);
          sheet.translate(0, (y1 - y0 - 0.12) / 2, 0);
          put(Bg, m.waterfall, sheet, xi - 0.09, y0 + 0.02, zc + s * (0.525 + sheetW / 2), FACE_WEST);
          B.box(m.brass, xi - 0.1, y1 - 0.05, zc + s * (0.525 + sheetW / 2), 0.07, 0.05, sheetW);
        }
        shrine(B, Bg, m, xi - 0.075, 0.82, zc);
        // shared basin
        basin(B, Bg, m, xi, zc, inner - 0.1);
      } else if (isWater(i)) {
        const ww = inner - 0.2, y0 = 0.52, y1 = 2.2;
        B.box(m.granite, xi - 0.045, (y0 + y1) / 2, zc, 0.06, y1 - y0, ww);
        for (const s of [-1, 1]) B.box(m.sandstoneLight, xi - 0.075, (y0 + y1) / 2, zc + s * (ww / 2 + 0.045), 0.12, y1 - y0 + 0.16, 0.09);
        B.box(m.sandstoneLight, xi - 0.075, y1 + 0.04, zc, 0.12, 0.08, ww + 0.18);
        B.box(m.sandstoneLight, xi - 0.075, y0 - 0.04, zc, 0.12, 0.08, ww + 0.18);
        const sheet = new PlaneGeometry(ww - 0.1, y1 - y0 - 0.12);
        sheet.translate(0, (y1 - y0 - 0.12) / 2, 0);
        put(Bg, m.waterfall, sheet, xi - 0.09, y0 + 0.02, zc, FACE_WEST);
        // brass lip with small spouts, and a soft wash of light on the granite
        B.box(m.brass, xi - 0.1, y1 - 0.05, zc, 0.07, 0.05, ww - 0.04);
        for (let k = 0; k < 5; k++) {
          const sp = new CylinderGeometry(0.018, 0.018, 0.12, 8);
          sp.rotateZ(Math.PI / 2);
          sp.translate(xi - 0.15, y1 - 0.06, zc + (k - 2) * ((ww - 0.4) / 4));
          B.geo(m.brass, sp);
        }
        basin(B, Bg, m, xi, zc, inner - 0.1);
      } else {
        // carved jali arch with the warm light behind it
        jaliArch(B, Bg, m, xi, 0.42, zc, FACE_WEST, inner - 0.5, 0.95, 0.78, 0.12);
        B.span(m.sandstone, xi - 0.09, 0, zc - inner / 2, xi, 0.4, zc + inner / 2);
        // planted bed in front of the bay
        const za = zc - pitch / 2 + 0.12, zb = zc + pitch / 2 - 0.12, kx0 = xi - 0.82, kx1 = xi - 0.06;
        B.span(m.sandstone, kx0, 0, za, kx0 + 0.1, 0.44, zb);
        B.span(m.sandstoneLight, kx0 - 0.02, 0.44, za, kx0 + 0.12, 0.47, zb);
        B.span(m.soil, kx0 + 0.1, 0.28, za, kx1, 0.42, zb);
        B.span(m.sandstone, kx0, 0, za - 0.1, kx1, 0.47, za);
        B.span(m.sandstone, kx0, 0, zb, kx1, 0.47, zb + 0.1);
        B.span(m.lampGlow, kx0 - 0.012, 0.3, za + 0.15, kx0, 0.34, zb - 0.15);
        for (let z = za + 0.25; z < zb - 0.2; z += 0.46) {
          const rr = 0.2 + r() * 0.15;
          const g = new IcosahedronGeometry(rr, 1);
          g.translate(kx0 + 0.28 + r() * 0.3, 0.42 + rr * 0.78, z + (r() - 0.5) * 0.2);
          B.geo([m.green, m.greenDark, m.leafLight][Math.floor(r() * 3)], g);
        }
        smallTree(B, m, xi - 0.5, 0.42, zc, 2.45, r);
      }

      // crown: a coping band, then a chhatri over some jali bays and a lit brass cove over the rest
      B.box(m.sandstone, xi - 0.02, hb + 0.04, zc, 0.3, 0.08, pitch - 0.1);
      B.box(m.sandstoneLight, xi - 0.02, hb + 0.1, zc, 0.22, 0.04, pitch - 0.14);
      if (chhatriBays.includes(i)) {
        chhatri(B, m, xi + WALL / 2, hb + 0.12, zc);
      } else {
        B.box(m.brass, xi + 0.04, hb + 0.17, zc, 0.04, 0.05, inner * 0.8);
        for (let k = 0; k < 5; k++) B.box(m.sandstoneLight, xi + 0.04, hb + 0.24, zc + (k - 2) * (inner / 5), 0.12, 0.14, 0.1);
      }
    }
    for (const zf of [30, 82]) {
      const l = new PointLight('#ffc98a', 0, 9, 1.4);
      l.position.set(xi - 1.3, 1.9, wz(zf));
      lights.push(l);
    }
  }

  /* ── west wall: tall arched jali bays alternating with green walls, a lit cornice ───────────────────────── */
  {
    const xw = wx(0) + WALL / 2; // inner face, towards the 5 ft passage
    const zA = wz(2.6), zB = wz(pd) - 0.4;
    const hb = 2.5;
    B.span(m.creamWarm, xw - WALL, 1.8, zA - 0.2, xw, hb, wz(pd) + WALL / 2);
    const n = Math.max(2, Math.round((zB - zA) / 2.3)), pitch = (zB - zA) / n;
    for (let i = 0; i <= n; i++) {
      const z = zA + i * pitch;
      B.box(m.sandstoneLight, xw + 0.06, hb / 2, z, 0.12, hb, 0.2);
      B.box(m.brass, xw + 0.125, hb / 2, z, 0.012, hb - 0.5, 0.04);
      B.box(m.sandstone, xw + 0.06, 0.08, z, 0.16, 0.16, 0.26);
      B.box(m.lampGlow, xw + 0.14, 0.34, z, 0.025, 0.2, 0.05);
    }
    for (let i = 0; i < n; i++) {
      const zc = zA + (i + 0.5) * pitch, wd = pitch - 0.26;
      if (i % 2 === 0) {
        jaliArch(B, Bg, m, xw, 0.4, zc, FACE_EAST, wd - 0.36, 1.2, 0.62, 0.09);
      } else {
        greenPanel(B, Bg, m, xw, zc, FACE_EAST, wd - 0.22, 0.5, 2.1, r);
      }
      B.box(m.sandstone, xw + 0.05, 0.2, zc, 0.1, 0.4, wd);
      B.box(m.sandstoneLight, xw + 0.06, hb + 0.03, zc, 0.22, 0.06, pitch - 0.02);
    }
    B.span(m.sandstoneLight, xw - 0.04, hb - 0.02, zA - 0.2, xw + 0.14, hb + 0.07, wz(pd) + WALL / 2);
    B.span(m.brass, xw + 0.14, hb - 0.12, zA, xw + 0.16, hb - 0.1, zB);
    B.span(m.lampGlow, xw + 0.1, hb - 0.2, zA, xw + 0.14, hb - 0.17, zB); // cove light under the cornice
    const l = new PointLight('#ffc98a', 0, 8, 1.5);
    l.position.set(xw + 0.7, 1.3, wz(60));
    lights.push(l);
  }

  /* ── south (back) wall: a ghat mural arch flanked by jali arches and green walls ─────────────────────── */
  {
    const zs = wz(pd) - WALL / 2; // inner face, towards the court
    const xL = wx(0) + WALL / 2, xR = wx(pw) - WALL / 2;
    const hb = 2.7;
    B.span(m.creamWarm, xL, 1.8, zs, xR, hb, zs + WALL);
    // elements left to right: green, jali, green, mural, green, jali, green
    const els: { k: 'g' | 'j' | 'm'; w: number }[] = [{ k: 'g', w: 1.6 }, { k: 'j', w: 2.0 }, { k: 'g', w: 1.6 }, { k: 'm', w: 3.3 }, { k: 'g', w: 1.6 }, { k: 'j', w: 2.0 }, { k: 'g', w: 1.6 }];
    const gap = 0.16, total = els.reduce((a, e) => a + e.w, 0) + gap * (els.length + 1);
    let x = (xL + xR) / 2 - total / 2 + gap;
    for (let i = 0; i <= els.length; i++) {
      const px = i === 0 ? x - gap / 2 : x - gap / 2;
      B.box(m.sandstoneLight, px, hb / 2, zs - 0.07, 0.16, hb, 0.14);
      B.box(m.sandstone, px, 0.08, zs - 0.09, 0.22, 0.16, 0.2);
      B.box(m.brass, px, hb / 2, zs - 0.145, 0.04, hb - 0.5, 0.012);
      if (i === els.length) break;
      const e = els[i], xc = x + e.w / 2;
      if (e.k === 'g') {
        greenPanel(B, Bg, m, xc, zs, FACE_NORTH, e.w - 0.2, 0.5, 2.25, r);
      } else if (e.k === 'j') {
        jaliArch(B, Bg, m, xc, 0.4, zs, FACE_NORTH, e.w - 0.3, 1.25, 0.7, 0.1);
      } else {
        const w = e.w - 0.4, rect = 1.35, rise = 1.0, frame = 0.14;
        const { ring, glow } = archParts(w, rect, rise, frame, 0.17);
        put(B, m.sandstoneLight, ring, xc, 0.4, zs, FACE_NORTH);
        put(Bg, m.glowWarm, glow, xc, 0.4, zs - 0.006, FACE_NORTH);
        put(Bg, m.ghat, archFill(w, rect, rise, 1, true), xc, 0.4, zs - 0.02, FACE_NORTH);
        // brass lamps either side, and a stone step
        for (const s of [-1, 1]) {
          B.box(m.brass, xc + s * (w / 2 + frame + 0.2), 1.5, zs - 0.07, 0.1, 0.3, 0.1);
          B.box(m.lampGlow, xc + s * (w / 2 + frame + 0.2), 1.5, zs - 0.13, 0.06, 0.22, 0.02);
        }
        B.span(m.sandstoneLight, xc - w / 2 - 0.2, 0, zs - 0.45, xc + w / 2 + 0.2, 0.12, zs - 0.1);
      }
      B.box(m.sandstone, xc, 0.2, zs - 0.06, e.w, 0.4, 0.12);
      x += e.w + gap;
    }
    B.span(m.sandstoneLight, xL, hb - 0.02, zs - 0.16, xR, hb + 0.07, zs + WALL);
    B.span(m.brass, xL, hb - 0.12, zs - 0.18, xR, hb - 0.1, zs - 0.16);
    B.span(m.lampGlow, xL, hb - 0.2, zs - 0.16, xR, hb - 0.17, zs - 0.12);
    // a few ficus trees in the corners of the court
    for (const tx of [3, 47]) smallTree(B, m, wx(tx), 0, zs - 1.1, 2.6, r);
  }

  return { lights };
}

/** A low sandstone water trough fitted to the foot of a water wall, with a rippling surface and a soft under-light. */
function basin(B: Batcher, Bg: Batcher, m: Mats, xi: number, zc: number, w: number): void {
  const x0 = xi - 0.64, x1 = xi - 0.04, top = 0.42;
  B.span(m.sandstone, x0, 0, zc - w / 2, x0 + 0.08, top, zc + w / 2);
  B.span(m.sandstone, x0, 0, zc - w / 2, x1, top, zc - w / 2 + 0.08);
  B.span(m.sandstone, x0, 0, zc + w / 2 - 0.08, x1, top, zc + w / 2);
  B.span(m.sandstoneLight, x0 - 0.02, top, zc - w / 2 - 0.02, x0 + 0.1, top + 0.03, zc + w / 2 + 0.02);
  B.span(m.sandstone, x0 + 0.08, 0, zc - w / 2 + 0.08, x1, 0.2, zc + w / 2 - 0.08);
  const surf = new PlaneGeometry(x1 - x0 - 0.08, w - 0.16);
  surf.rotateX(-Math.PI / 2);
  surf.translate((x0 + 0.08 + x1) / 2, top - 0.05, zc);
  Bg.geo(m.basin, surf);
  B.span(m.lampGlow, x0 + 0.1, top - 0.1, zc - w / 2 + 0.1, x0 + 0.13, top - 0.07, zc + w / 2 - 0.1);
}

/** A slim stone and bronze frame round the glass lift doors, with a small lit LIFT sign. `zl` is the wall plane between the lobby and the lift. */
export function liftPortal(B: Batcher, Bg: Batcher, m: Mats, y0: number, zl: number, lcx: number, lw: number): void {
  const face = zl + 0.1;
  const w = lw + 0.1;
  B.box(m.sandstoneLight, lcx - w / 2 - 0.04, y0 + 1.2, face + 0.03, 0.08, 2.4, 0.06);
  B.box(m.sandstoneLight, lcx + w / 2 + 0.04, y0 + 1.2, face + 0.03, 0.08, 2.4, 0.06);
  B.box(m.sandstoneLight, lcx, y0 + 2.4, face + 0.03, w + 0.16, 0.08, 0.06);
  B.box(m.brass, lcx, y0 + 2.45, face + 0.035, w + 0.2, 0.014, 0.07);
  const sign = new PlaneGeometry(0.44, 0.082);
  sign.translate(lcx, y0 + 2.57, face + 0.012);
  B.geo(m.liftSign, sign);
  B.box(m.brass, lcx + 0.82, y0 + 1.1, face + 0.012, 0.07, 0.15, 0.02);
  B.box(m.lampGlow, lcx + 0.82, y0 + 1.14, face + 0.026, 0.022, 0.022, 0.012);
}

/**
 * The glass lift: a slim bronze frame and clear glass on the road (north) and east sides of the shaft, on every level.
 * `zl` is the wall plane towards the lobby; the glass runs from the services partition to the east wall.
 */
export function liftShaftGlass(B: Batcher, m: Mats, y0: number, H: number, slab: number, x0: number, x1: number, zN: number, zL: number): void {
  const h = H - slab, t = 0.05;
  const mull = (x: number, z: number): void => B.box(m.bronze, x, y0 + h / 2, z, t, h, t);
  // north face (towards the road)
  B.span(m.liftGlass, x0, y0, zN - 0.012, x1, y0 + h, zN + 0.012);
  mull(x0, zN); mull(x1, zN); mull((x0 + x1) / 2, zN);
  B.span(m.bronze, x0, y0, zN - 0.04, x1, y0 + 0.1, zN + 0.04);
  B.span(m.bronze, x0, y0 + h - 0.1, zN - 0.04, x1, y0 + h, zN + 0.04);
  B.span(m.bronze, x0, y0 + h * 0.5 - 0.02, zN - 0.025, x1, y0 + h * 0.5 + 0.02, zN + 0.025);
  // east face
  B.span(m.liftGlass, x1 - 0.012, y0, zN, x1 + 0.012, y0 + h, zL);
  mull(x1, zL); mull(x1, (zN + zL) / 2);
  B.span(m.bronze, x1 - 0.04, y0, zN, x1 + 0.04, y0 + 0.1, zL);
  B.span(m.bronze, x1 - 0.04, y0 + h - 0.1, zN, x1 + 0.04, y0 + h, zL);
  B.span(m.bronze, x1 - 0.025, y0 + h * 0.5 - 0.02, zN, x1 + 0.025, y0 + h * 0.5 + 0.02, zL);
}

/** One glass door leaf with a bronze stile on its meeting edge and slim top and bottom rails. Origin at the foot, middle of the leaf. */
export function glassLeaf(m: Mats, w: number, h: number, meetSide: 1 | -1, castShadow = false): Group {
  const leaf = new Group();
  const part = (mat: MeshStandardMaterial, sx: number, sy: number, sz: number, x: number, y: number): void => {
    const mesh = new Mesh(new BoxGeometry(sx, sy, sz), mat);
    mesh.position.set(x, y, 0);
    mesh.castShadow = castShadow && mat !== m.liftGlass;
    leaf.add(mesh);
  };
  part(m.liftGlass, w, h, 0.012, 0, h / 2);
  part(m.bronze, 0.035, h, 0.03, (w / 2 - 0.0175) * meetSide, h / 2);
  part(m.bronze, w, 0.04, 0.03, 0, h - 0.02);
  part(m.bronze, w, 0.04, 0.03, 0, 0.02);
  return leaf;
}

export interface LiftCar { group: Group; leaves: [Group, Group]; openBy: number; closedX: number }

/** The lift car: bronze frame, clear glass, a brass handrail, a lit ceiling. Origin at the middle of the floor; the door side faces +z. */
export function buildLiftCar(m: Mats): LiftCar {
  const group = new Group();
  const w = 1.7, d = 1.55, hgt = 2.3;
  const add = (mat: MeshStandardMaterial, sx: number, sy: number, sz: number, x: number, y: number, z: number): void => {
    const mesh = new Mesh(new BoxGeometry(sx, sy, sz), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = mat !== m.liftGlass && mat !== m.cabinLight;
    group.add(mesh);
  };
  add(m.stoneTread, w, 0.06, d, 0, 0.03, 0);
  add(m.brass, w + 0.02, 0.025, 0.03, 0, 0.07, d / 2);
  add(m.brass, w + 0.02, 0.025, 0.03, 0, 0.07, -d / 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(m.bronze, 0.055, hgt, 0.055, sx * w / 2, hgt / 2, sz * d / 2);
  add(m.bronze, w + 0.06, 0.07, d + 0.06, 0, hgt + 0.035, 0);
  add(m.cabinLight, w - 0.2, 0.02, d - 0.2, 0, hgt - 0.01, 0);
  // clear glass on the road (north), east and west sides
  add(m.liftGlass, w, hgt - 0.1, 0.014, 0, hgt / 2 + 0.02, -d / 2);
  add(m.liftGlass, 0.014, hgt - 0.1, d, w / 2, hgt / 2 + 0.02, 0);
  add(m.liftGlass, 0.014, hgt - 0.1, d, -w / 2, hgt / 2 + 0.02, 0);
  // lobby side: a 1.0 m opening between two fixed panels, with two sliding leaves
  const open = 1.0, fixedW = (w - open) / 2, dh = hgt - 0.18;
  for (const s of [-1, 1]) {
    add(m.liftGlass, fixedW, dh, 0.014, s * (open / 2 + fixedW / 2), dh / 2 + 0.04, d / 2);
    add(m.bronze, 0.03, dh, 0.03, s * (open / 2), dh / 2 + 0.04, d / 2);
  }
  add(m.bronze, w, 0.04, 0.03, 0, hgt - 0.12, d / 2);
  const leafW = open / 2;
  const leaves: [Group, Group] = [glassLeaf(m, leafW, dh, 1), glassLeaf(m, leafW, dh, -1)];
  leaves[0].position.set(-leafW / 2, 0.04, d / 2 - 0.03);
  leaves[1].position.set(leafW / 2, 0.04, d / 2 - 0.03);
  group.add(leaves[0], leaves[1]);
  add(m.brass, 0.04, 0.04, d - 0.2, w / 2 - 0.05, 0.95, 0);
  add(m.brass, 0.04, 0.04, d - 0.2, -w / 2 + 0.05, 0.95, 0);
  add(m.brass, w - 0.2, 0.04, 0.04, 0, 0.95, -d / 2 + 0.05);
  return { group, leaves, openBy: fixedW, closedX: leafW / 2 };
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
