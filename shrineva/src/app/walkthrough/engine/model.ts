import {
  BoxGeometry, CylinderGeometry, ExtrudeGeometry, Group, IcosahedronGeometry, Mesh, MeshStandardMaterial, PlaneGeometry,
  PointLight, Shape, ShapeGeometry, Path,
} from 'three';
import { BUILDING, BUILDING_TOP, LEVELS, LevelId, LevelInfo, STAIR_HOLE, plateOutline } from '../../config/building.config';

import { Batcher } from './batch';
import { Mats } from './materials';

/** Plot feet → world metres. World: x east, y up, z south; the road is on the north (−z). Origin: plot centre line, road-side boundary. */
const FT = BUILDING.ft;
const cxm = BUILDING.plot.w / 2;
export const wx = (x: number): number => (x - cxm) * FT;
export const wz = (z: number): number => z * FT;
export const ftX = (X: number): number => X / FT + cxm;
export const ftZ = (Z: number): number => Z / FT;

const B_ = BUILDING;
const WALL = 0.23; // 9″ external wall
const SLAB = B_.h.slab;

export interface LevelRig {
  info: LevelInfo;
  group: Group;
  /** Ceiling plane and light strips: hidden when the floor is cut open for a top-down look. */
  ceiling: Group;
  /** Illustrative furniture for the selected preset. */
  furniture: Group;
  light: PointLight;
  offset: number;
  target: number;
}

export interface BuildingModel {
  root: Group;
  levels: LevelRig[];
  roof: Group;
  dispose(): void;
}

/* ── geometry helpers ─────────────────────────────────────────────────────────── */

function plateShape(flipZ: boolean, withHole: boolean): Shape {
  const s = new Shape();
  plateOutline().forEach(([x, z], i) => {
    const X = wx(x), Z = flipZ ? -wz(z) : wz(z);
    if (i === 0) s.moveTo(X, Z); else s.lineTo(X, Z);
  });
  s.closePath();
  if (withHole) {
    const h = new Path();
    const a = STAIR_HOLE;
    const pts: [number, number][] = [[a.x0, a.z0], [a.x1, a.z0], [a.x1, a.z1], [a.x0, a.z1]];
    pts.forEach(([x, z], i) => {
      const X = wx(x), Z = flipZ ? -wz(z) : wz(z);
      if (i === 0) h.moveTo(X, Z); else h.lineTo(X, Z);
    });
    h.closePath();
    s.holes.push(h);
  }
  return s;
}

/** A horizontal slab from a shape, top face at y = top. */
function slabMesh(shape: Shape, top: number, thick: number, capMat: MeshStandardMaterial, edgeMat: MeshStandardMaterial): Mesh {
  const g = new ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, top - thick, 0);
  const m = new Mesh(g, [capMat, edgeMat]);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

interface Opening { a: number; b: number }
interface WallSpec { y0: number; h: number; sill?: number; head?: number; t?: number }

/** Wall running along z (fixed x). Openings are z ranges in metres; each gets a glass pane and a slim frame. */
function wallAlongZ(B: Batcher, m: Mats, xc: number, z0: number, z1: number, w: WallSpec, openings: Opening[] = []): void {
  const t = w.t ?? WALL, sill = w.sill ?? 0.9, head = w.head ?? 2.45;
  let cur = z0;
  for (const o of [...openings].sort((p, q) => p.a - q.a)) {
    B.span(m.cream, xc - t / 2, w.y0, cur, xc + t / 2, w.y0 + w.h, o.a);
    B.span(m.cream, xc - t / 2, w.y0, o.a, xc + t / 2, w.y0 + sill, o.b);
    B.span(m.cream, xc - t / 2, w.y0 + head, o.a, xc + t / 2, w.y0 + w.h, o.b);
    B.span(m.glass, xc - 0.02, w.y0 + sill, o.a, xc + 0.02, w.y0 + head, o.b);
    B.span(m.frame, xc - 0.04, w.y0 + sill, o.a, xc + 0.04, w.y0 + head, o.a + 0.05);
    B.span(m.frame, xc - 0.04, w.y0 + sill, o.b - 0.05, xc + 0.04, w.y0 + head, o.b);
    B.span(m.frame, xc - 0.04, w.y0 + sill - 0.04, o.a, xc + 0.04, w.y0 + sill, o.b);
    B.span(m.frame, xc - 0.04, w.y0 + head, o.a, xc + 0.04, w.y0 + head + 0.04, o.b);
    cur = o.b;
  }
  B.span(m.cream, xc - t / 2, w.y0, cur, xc + t / 2, w.y0 + w.h, z1);
}

/** Wall running along x (fixed z). */
function wallAlongX(B: Batcher, m: Mats, zc: number, x0: number, x1: number, w: WallSpec, openings: Opening[] = [], mat?: MeshStandardMaterial): void {
  const t = w.t ?? WALL, sill = w.sill ?? 0.9, head = w.head ?? 2.45;
  const wallMat = mat ?? m.cream;
  let cur = x0;
  for (const o of [...openings].sort((p, q) => p.a - q.a)) {
    B.span(wallMat, cur, w.y0, zc - t / 2, o.a, w.y0 + w.h, zc + t / 2);
    B.span(wallMat, o.a, w.y0, zc - t / 2, o.b, w.y0 + sill, zc + t / 2);
    B.span(wallMat, o.a, w.y0 + head, zc - t / 2, o.b, w.y0 + w.h, zc + t / 2);
    cur = o.b;
  }
  B.span(wallMat, cur, w.y0, zc - t / 2, x1, w.y0 + w.h, zc + t / 2);
}

const ftRange = (r: [number, number][]): Opening[] => r.map(([a, b]) => ({ a: wz(a), b: wz(b) }));

/* ── pieces ───────────────────────────────────────────────────────────────────── */

function columns(B: Batcher, m: Mats, y0: number, h: number): void {
  const c = B_.cols, rows = B_.rows;
  const cw = 1.25 * FT, cd = 2.0 * FT;
  const pts: [number, number][] = [
    [c.A, rows[0] + 1.0], [c.B, rows[0] + 1.0], [c.C, rows[0] + 1.0],
    [c.A, rows[6] - 1.0], [c.B, rows[6] - 1.0], [c.C, rows[6] - 1.0],
  ];
  for (const [x, z] of pts) B.box(m.cream, wx(x), y0 + h / 2, wz(z), cw, h, cd);
  // pilasters on the west wall line, grid rows 2–6
  for (let i = 1; i <= 5; i++) B.box(m.cream, wx(c.A), y0 + h / 2, wz(rows[i]), cw, h, cd);
}

function lobbyAndCore(B: Batcher, m: Mats, y0: number, H: number, levelId: LevelId): void {
  const bay = B_.bay, lb = B_.lobby;
  const t = 0.2;
  const west: Opening[] = [{ a: wz(lb.z0), b: wz(lb.z1) }];
  // bay perimeter: north, south, east, west (with the lobby opening)
  B.span(m.cream, wx(bay.x0), y0, wz(bay.z0) - t / 2, wx(bay.x1), y0 + H, wz(bay.z0) + t / 2);
  B.span(m.cream, wx(bay.x0), y0, wz(bay.z1) - t / 2, wx(bay.x1), y0 + H, wz(bay.z1) + t / 2);
  // west wall with the lobby opening
  B.span(m.cream, wx(bay.x0) - t / 2, y0, wz(bay.z0), wx(bay.x0) + t / 2, y0 + H, west[0].a);
  B.span(m.cream, wx(bay.x0) - t / 2, y0, west[0].b, wx(bay.x0) + t / 2, y0 + H, wz(bay.z1));
  // east wall: solid on the floors, with the east entry on the parking level
  if (levelId === 0) {
    B.span(m.cream, wx(bay.x1) - t / 2, y0, wz(bay.z0), wx(bay.x1) + t / 2, y0 + H, west[0].a);
    B.span(m.cream, wx(bay.x1) - t / 2, y0, west[0].b, wx(bay.x1) + t / 2, y0 + H, wz(bay.z1));
    B.span(m.cream, wx(bay.x1) - t / 2, y0 + 2.4, west[0].a, wx(bay.x1) + t / 2, y0 + H, west[0].b);
  } else {
    B.span(m.cream, wx(bay.x1) - t / 2, y0, wz(bay.z0), wx(bay.x1) + t / 2, y0 + H, wz(bay.z1));
  }
  // wall between the lobby and the lift / services, with the lift door
  const zl = wz(49.5);
  const lx0 = wx(B_.lift.x0), lx1 = wx(B_.lift.x1);
  const lw = 1.1, lcx = (lx0 + lx1) / 2;
  B.span(m.cream, wx(bay.x0), y0, zl - 0.1, lcx - lw / 2, y0 + H, zl + 0.1);
  B.span(m.cream, lcx + lw / 2, y0, zl - 0.1, wx(bay.x1), y0 + H, zl + 0.1);
  B.span(m.cream, lcx - lw / 2, y0 + 2.15, zl - 0.1, lcx + lw / 2, y0 + H, zl + 0.1);
  // brass frame and two door leaves
  B.span(m.brass, lcx - lw / 2 - 0.06, y0, zl + 0.08, lcx - lw / 2, y0 + 2.2, zl + 0.14);
  B.span(m.brass, lcx + lw / 2, y0, zl + 0.08, lcx + lw / 2 + 0.06, y0 + 2.2, zl + 0.14);
  B.span(m.brass, lcx - lw / 2 - 0.06, y0 + 2.15, zl + 0.08, lcx + lw / 2 + 0.06, y0 + 2.22, zl + 0.14);
  B.span(m.liftDoor, lcx - lw / 2, y0, zl + 0.02, lcx - 0.01, y0 + 2.15, zl + 0.06);
  B.span(m.liftDoor, lcx + 0.01, y0, zl + 0.02, lcx + lw / 2, y0 + 2.15, zl + 0.06);
  // services door and partition
  B.span(m.woodDark, wx(30), y0, zl + 0.02, wx(31.2), y0 + 2.1, zl + 0.06);
  B.span(m.cream, wx(33.45) - 0.08, y0, wz(bay.z0), wx(33.45) + 0.08, y0 + H, zl);

  // stair: two flights and a landing, solid steps
  const n = levelId === 0 ? 19 : 24;
  const L = levelId === 0 ? 10 : 12;
  const rH = H / n;
  const zTop = 57.5, zBot = 67.5;
  const runUp = (zBot - zTop) / (L - 1);
  const runDown = (zBot - zTop) / (n - L);
  const eastX: [number, number] = [34.6, 39.85];
  const westX: [number, number] = [28.6, 33.85];
  for (let k = 1; k < L; k++) {
    const za = zTop + (k - 1) * runUp, zb = zTop + k * runUp;
    B.span(m.concrete, wx(eastX[0]), y0, wz(za), wx(eastX[1]), y0 + k * rH, wz(zb));
  }
  B.span(m.concrete, wx(westX[0]), y0, wz(zBot), wx(eastX[1]), y0 + L * rH, wz(70.3));
  for (let j = L + 1; j < n; j++) {
    const idx = j - L;
    const za = zBot - idx * runDown, zb = zBot - (idx - 1) * runDown;
    B.span(m.concrete, wx(westX[0]), y0, wz(za), wx(westX[1]), y0 + j * rH, wz(zb));
  }
}

/* ── the building ─────────────────────────────────────────────────────────────── */

export function buildBuilding(m: Mats): BuildingModel {
  const root = new Group();
  const levels: LevelRig[] = [];
  const x0 = wx(B_.plate.x0), x1 = wx(B_.plate.x1);
  const zF = wz(B_.plate.zGlass);
  const cx = (x0 + x1) / 2;

  for (const info of LEVELS) {
    const g = new Group();
    const ceilingGroup = new Group();
    const furniture = new Group();
    const B = new Batcher();
    const y0 = info.baseY;
    const H = info.id === 0 ? B_.h.parking : B_.h.floor;
    const yTop = y0 + H;

    if (info.id === 0) {
      // paved plot, boundary walls on west / east / south, open to the road
      const plot = new Shape();
      const pw = B_.plot.w, pd = B_.plot.d;
      [[0, 0], [pw, 0], [pw, pd], [0, pd]].forEach(([x, z], i) => { if (i === 0) plot.moveTo(wx(x), -wz(z)); else plot.lineTo(wx(x), -wz(z)); });
      plot.closePath();
      g.add(slabMesh(plot, 0, 0.2, m.paving, m.concrete));
      const bw = 1.8;
      B.span(m.cream, wx(0) - WALL / 2, 0, wz(0), wx(0) + WALL / 2, bw, wz(pd));
      B.span(m.cream, wx(pw) - WALL / 2, 0, wz(0), wx(pw) + WALL / 2, bw, wz(pd));
      B.span(m.cream, wx(0), 0, wz(pd) - WALL / 2, wx(pw), bw, wz(pd) + WALL / 2);
      B.span(m.brass, wx(0) - WALL / 2 - 0.01, bw, wz(0), wx(0) + WALL / 2 + 0.01, bw + 0.03, wz(pd));
      B.span(m.brass, wx(pw) - WALL / 2 - 0.01, bw, wz(0), wx(pw) + WALL / 2 + 0.01, bw + 0.03, wz(pd));
      columns(B, m, 0, H - SLAB);
      lobbyAndCore(B, m, 0, H, 0);

      // two entrance pillars with brass plaques
      for (const px of [9, 41]) {
        B.box(m.taupe, wx(px), 1.4, wz(1.2), 0.55, 2.8, 0.55);
        B.box(m.cream, wx(px), 2.85, wz(1.2), 0.65, 0.1, 0.65);
        B.box(m.plaqueGlow, wx(px), 1.9, wz(1.2) + 0.29, 0.3, 0.42, 0.03);
      }
      // east entry portal: flat canopy with a timber soffit and the name board
      const pxA = wx(41.2), pxB = wx(48.6);
      B.span(m.cream, pxA, 2.85, wz(0.6), pxB, 3.1, wz(6));
      B.span(m.cream, pxA, 0, wz(0.9), pxA + 0.4, 2.85, wz(0.9) + 0.4);
      B.span(m.cream, pxB - 0.4, 0, wz(0.9), pxB, 2.85, wz(0.9) + 0.4);
      B.span(m.cream, pxA, 0, wz(5.4), pxA + 0.35, 2.85, wz(5.4) + 0.35);
      const soffit = new Mesh(new PlaneGeometry(pxB - pxA, wz(5.4) - wz(0.6)), m.timber);
      soffit.rotation.x = Math.PI / 2; soffit.position.set((pxA + pxB) / 2, 2.84, (wz(0.6) + wz(6)) / 2);
      g.add(soffit);
      const portalSign = new Mesh(new PlaneGeometry(2.0, 0.42), m.sign);
      portalSign.position.set((pxA + pxB) / 2, 3.28, wz(0.6) - 0.005); portalSign.rotation.y = Math.PI;
      g.add(portalSign);
      B.box(m.frame, (pxA + pxB) / 2, 3.28, wz(0.6) + 0.02, 2.06, 0.46, 0.04);
      // planters along the frontage and two trees
      B.span(m.cream, wx(14), 0, wz(1.2), wx(36), 0.45, wz(1.2) + 0.45);
      B.span(m.green, wx(14) + 0.04, 0.45, wz(1.2) + 0.05, wx(36) - 0.04, 0.62, wz(1.2) + 0.4);
      for (const tx of [17, 33]) g.add(tree(m, wx(tx), wz(9.5), 3.5));
      // timber soffit under the first-floor slab, with the stair opening
      const soff = new Mesh(new ShapeGeometry(plateShape(false, true)), m.timber);
      soff.rotation.x = Math.PI / 2;
      soff.position.y = H - SLAB - 0.004;
      // ShapeGeometry lies in XY; rotating +90° about X turns its normal downwards and maps shape y to world z
      soff.receiveShadow = true;
      ceilingGroup.add(soff);
      // light strips in the soffit
      lightStrips(ceilingGroup, m, H - SLAB - 0.03);
    } else {
      const withHole = true;
      const slab = slabMesh(plateShape(true, withHole), y0, SLAB, m.floor, m.concrete);
      g.add(slab);
      const wh = { y0, h: H };
      // west wall, east wall (north and south of the recess), rear wall
      wallAlongZ(B, m, x0 + WALL / 2, wz(B_.rows[0]), wz(B_.plate.z1), wh, ftRange(B_.windowsWest));
      wallAlongZ(B, m, x1 - WALL / 2, wz(B_.rows[0]), wz(B_.recess.z0), wh, ftRange(B_.windowsEastN));
      wallAlongZ(B, m, x1 - WALL / 2, wz(B_.recess.z1), wz(B_.plate.z1), wh, ftRange(B_.windowsEastS));
      wallAlongX(B, m, wz(B_.plate.z1) - WALL / 2, x0, x1, wh);
      // notch walls round the east recess
      wallAlongX(B, m, wz(B_.recess.z0) - WALL / 2, wx(B_.recess.x0), x1, wh);
      wallAlongX(B, m, wz(B_.recess.z1) + WALL / 2, wx(B_.recess.x0), x1, wh);
      // glass returns on the sides of the 5′ front projection
      B.span(m.glass, x0, y0, zF, x0 + 0.04, yTop - 0.55, wz(B_.rows[0]));
      B.span(m.glass, x1 - 0.04, y0, zF, x1, yTop - 0.55, wz(B_.rows[0]));
      columns(B, m, y0, H - SLAB);
      lobbyAndCore(B, m, y0, H, info.id);
      facade(g, B, m, info.id, y0, yTop, x0, x1, zF, cx);

      // ceiling plane at the nominal height + light strips
      const cy = y0 + B_.h.ceiling;
      const ceil = new Mesh(new ShapeGeometry(plateShape(false, true)), m.ceiling);
      ceil.rotation.x = Math.PI / 2; ceil.position.y = cy;
      ceil.receiveShadow = true;
      ceilingGroup.add(ceil);
      lightStrips(ceilingGroup, m, cy - 0.02);
    }

    B.build(g);
    g.add(ceilingGroup);
    g.add(furniture);

    const light = new PointLight('#ffdcae', 0, 22, 1.6);
    light.position.set(cx, y0 + (info.id === 0 ? 2.3 : B_.h.ceiling - 0.4), wz(55));
    g.add(light);

    root.add(g);
    levels.push({ info, group: g, ceiling: ceilingGroup, furniture, light, offset: 0, target: 0 });
  }

  /* roof */
  const roof = new Group();
  {
    const Br = new Batcher();
    const top = BUILDING_TOP;
    roof.add(slabMesh(plateShape(true, true), top, 0.3, m.roofTop, m.cream));
    const ph = 1.0;
    const hp = { y0: top, h: ph, t: 0.2 };
    wallAlongZ(Br, m, x0 + 0.1, zF, wz(B_.plate.z1), hp);
    wallAlongZ(Br, m, x1 - 0.1, zF, wz(B_.recess.z0), hp);
    wallAlongZ(Br, m, x1 - 0.1, wz(B_.recess.z1), wz(B_.plate.z1), hp);
    wallAlongX(Br, m, wz(B_.plate.z1) - 0.1, x0, x1, hp);
    wallAlongX(Br, m, wz(B_.recess.z0) - 0.1, wx(B_.recess.x0), x1, hp);
    wallAlongX(Br, m, wz(B_.recess.z1) + 0.1, wx(B_.recess.x0), x1, hp);
    Br.span(m.cream, wx(B_.recess.x0) - 0.1, top, wz(B_.recess.z0), wx(B_.recess.x0) + 0.1, top + ph, wz(B_.recess.z1));
    // taller front band for the name board, with a cantilevered edge
    Br.span(m.cream, x0 - 0.1, top - 0.25, zF - 0.7, x1 + 0.1, top, zF + 0.1);
    Br.span(m.cream, x0 - 0.1, top, zF - 0.1, x1 + 0.1, top + 1.5, zF + 0.15);
    Br.span(m.frame, x0 - 0.18, top + 1.5, zF - 0.78, x1 + 0.18, top + 1.58, zF + 0.22);
    // stair head-room above the stair opening
    const sx0 = wx(27.75), sx1 = wx(40.5), sz0 = wz(56.6), sz1 = wz(71);
    Br.span(m.cream, sx0, top, sz0, sx1, top + 2.5, sz1);
    Br.span(m.concrete, sx0 - 0.1, top + 2.5, sz0 - 0.1, sx1 + 0.1, top + 2.62, sz1 + 0.1);
    Br.build(roof);
    const board = new Mesh(new PlaneGeometry(5.4, 1.0), m.sign);
    board.position.set(cx, top + 0.78, zF - 0.14);
    board.rotation.y = Math.PI;
    roof.add(board);
    const boardFrame = new Mesh(new BoxGeometry(5.5, 1.1, 0.04), m.frame);
    boardFrame.position.set(cx, top + 0.78, zF - 0.1);
    roof.add(boardFrame);
  }
  levels[3].group.add(roof);

  return {
    root, levels, roof,
    dispose: () => root.traverse((o) => { (o as Mesh).geometry?.dispose(); }),
  };
}

/* ── façade (front glass line), different on each floor ──────────────────────── */

function facade(g: Group, B: Batcher, m: Mats, id: LevelId, y0: number, yTop: number, x0: number, x1: number, zF: number, cx: number): void {
  const pier = 0.9;
  const fh = yTop - y0;
  const fascia = 0.55;
  // piers and slab-edge band
  B.span(m.cream, x0, y0, zF - 0.1, x0 + pier, yTop, zF + 0.35);
  B.span(m.cream, x1 - pier, y0, zF - 0.1, x1, yTop, zF + 0.35);
  B.span(m.cream, x0, yTop - fascia, zF - 0.12, x1, yTop, zF + 0.3);
  const gx0 = x0 + pier, gx1 = x1 - pier;
  const gy0 = y0, gy1 = yTop - fascia;

  const pane = (a: number, b: number): void => {
    B.span(m.glass, a, gy0, zF - 0.02, b, gy1, zF + 0.02);
    B.span(m.frame, a, gy0, zF - 0.05, a + 0.05, gy1, zF + 0.05);
    B.span(m.frame, b - 0.05, gy0, zF - 0.05, b, gy1, zF + 0.05);
    B.span(m.frame, a, gy1 - 0.05, zF - 0.05, b, gy1, zF + 0.05);
    B.span(m.frame, a, gy0 + fh * 0.62, zF - 0.04, b, gy0 + fh * 0.62 + 0.04, zF + 0.04);
  };
  const jaali = (a: number, b: number): void => {
    const mesh = new Mesh(new PlaneGeometry(b - a, gy1 - gy0), m.jaali);
    mesh.position.set((a + b) / 2, (gy0 + gy1) / 2, zF + 0.01);
    mesh.rotation.y = Math.PI;
    g.add(mesh);
    B.span(m.frame, a, gy0, zF - 0.04, a + 0.04, gy1, zF + 0.04);
    B.span(m.frame, b - 0.04, gy0, zF - 0.04, b, gy1, zF + 0.04);
  };

  if (id === 1) {
    const n = 6, w = (gx1 - gx0) / n;
    for (let i = 0; i < n; i++) pane(gx0 + i * w, gx0 + (i + 1) * w);
    // planter on the slab edge
    B.span(m.cream, gx0, yTop, zF - 0.2, gx1, yTop + 0.28, zF + 0.1);
    B.span(m.green, gx0 + 0.04, yTop + 0.28, zF - 0.16, gx1 - 0.04, yTop + 0.46, zF + 0.06);
  } else {
    const sp = 1.3;
    const spx0 = cx - sp, spx1 = cx + sp;
    B.span(m.taupe, spx0, y0, zF - 0.15, spx1, yTop, zF + 0.3);
    B.span(m.brass, cx - 0.2, y0 + 0.2, zF - 0.17, cx - 0.17, yTop - 0.2, zF - 0.15);
    B.span(m.brass, cx + 0.17, y0 + 0.2, zF - 0.17, cx + 0.2, yTop - 0.2, zF - 0.15);
    const sides: [number, number][] = [[gx0, spx0], [spx1, gx1]];
    for (const [a, b] of sides) {
      const n = 4, w = (b - a) / n;
      for (let i = 0; i < n; i++) {
        const a1 = a + i * w, b1 = a + (i + 1) * w;
        if (id === 2 && (i === 1 || i === 2)) jaali(a1, b1); else pane(a1, b1);
      }
    }
    if (id === 3) {
      // glass balustrade and brass rail along the lower part
      B.span(m.glassPartition, gx0, y0 + 0.02, zF - 0.28, gx1, y0 + 1.05, zF - 0.26);
      B.span(m.brass, gx0, y0 + 1.05, zF - 0.3, gx1, y0 + 1.09, zF - 0.24);
    }
    if (id === 2) {
      B.span(m.cream, gx0, yTop, zF - 0.2, gx1, yTop + 0.25, zF + 0.1);
      B.span(m.green, gx0 + 0.04, yTop + 0.25, zF - 0.16, gx1 - 0.04, yTop + 0.42, zF + 0.06);
    }
  }
}

/** Long light strips on a ceiling, clear of the lift and stair bay. */
function lightStrips(into: Group, m: Mats, y: number): void {
  const B = new Batcher();
  const xs = [11, 20, 33];
  const bay = B_.bay;
  for (const xf of xs) {
    for (let zf = 14; zf < 103; zf += 6.2) {
      const inBay = xf > bay.x0 - 1 && zf > bay.z0 - 3 && zf < bay.z1 + 1;
      if (inBay && xf > 28) continue;
      if (zf > bay.z0 - 3 && zf < bay.z1 + 1 && xf >= 27) continue;
      B.box(m.strip, wx(xf), y, wz(zf), 0.12, 0.03, 1.9);
    }
  }
  B.box(m.strip, wx(34), y, wz(53.4), 3.0, 0.03, 0.12);
  B.build(into, { cast: false, receive: false });
}

/* ── small things ─────────────────────────────────────────────────────────────── */

export function tree(m: Mats, x: number, z: number, h: number): Group {
  const t = new Group();
  const trunk = new Mesh(new CylinderGeometry(0.1, 0.16, h * 0.5, 7), m.trunk);
  trunk.position.y = h * 0.25; trunk.castShadow = true;
  t.add(trunk);
  const blob = (dx: number, dy: number, dz: number, r: number, mat: MeshStandardMaterial) => {
    const b = new Mesh(new IcosahedronGeometry(r, 1), mat);
    b.position.set(dx, h * 0.55 + dy, dz); b.castShadow = true;
    t.add(b);
  };
  blob(0, h * 0.18, 0, h * 0.3, m.green);
  blob(h * 0.14, h * 0.02, h * 0.05, h * 0.22, m.greenDark);
  blob(-h * 0.13, h * 0.06, -h * 0.06, h * 0.22, m.green);
  t.position.set(x, 0, z);
  return t;
}
