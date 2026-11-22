import {
  BufferAttribute, BufferGeometry, CircleGeometry, EdgesGeometry, ExtrudeGeometry, Group, LineBasicMaterial, LineSegments, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, Path, PlaneGeometry, Shape,
} from 'three';
import { Batcher } from './batch';
import { MatSet, SharedTextures } from './materials';
import { BASE_Y, COLUMNS, DIM, H, LevelKey, ROOF_Y, plateOutline, wx, wz } from './plan-dims';

/**
 * The building, drawn from the architect's plan dimensions (plan-dims.ts): ground level, three identical floors and the roof.
 * Each level is split in two so the selected floor can be shown as a cutaway:
 *   base  - slab, walls cut to H.cut, columns, lift, stair, glass front, name board (always shown)
 *   upper - the walls above the cut, window glass, the dark fascia, the jali screen (hidden on the selected floor)
 * and a ghost: the same envelope as faint brass edges, shown when the level has been lifted away.
 */

export type RigKey = LevelKey | 'roof';

export interface RigState { offset: number; base: number; upper: number; ghost: number }

export interface LevelRig {
  key: RigKey;
  /** Moves up when the level is lifted away. */
  root: Group;
  base: Group;
  upper: Group;
  ghost: Group;
  baseMats: MatSet;
  upperMats: MatSet;
  fillMat: MeshBasicMaterial;
  edgeMat: LineBasicMaterial;
  meshes: Mesh[];
  y0: number;
  state: RigState;
  goal: RigState;
  castOn: boolean;
}

export interface BuildingModel {
  root: Group;
  rigs: LevelRig[];
  extras: Group;
  textures: SharedTextures;
  dispose(): void;
}

const T = H.wall;
const CUT = H.cut;

/* ── helpers ──────────────────────────────────────────────────────────────────────────── */

function polyShape(pts: [number, number][], holes: [number, number][][] = []): Shape {
  // The shape lies in XY and is later rotated so that its y becomes world -z: hence the sign flip.
  const s = new Shape();
  pts.forEach(([x, z], i) => { if (i === 0) s.moveTo(wx(x), -wz(z)); else s.lineTo(wx(x), -wz(z)); });
  s.closePath();
  for (const h of holes) {
    const p = new Path();
    h.forEach(([x, z], i) => { if (i === 0) p.moveTo(wx(x), -wz(z)); else p.lineTo(wx(x), -wz(z)); });
    p.closePath();
    s.holes.push(p);
  }
  return s;
}

const rectPts = (x0: number, z0: number, x1: number, z1: number): [number, number][] => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

/** A horizontal slab from a shape, top face at y = top. Materials: [caps, edges]. */
function slabGeo(shape: Shape, top: number, thick: number): ExtrudeGeometry {
  const g = new ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, top - thick, 0);
  return g;
}

function slabMesh(shape: Shape, top: number, thick: number, cap: MeshStandardMaterial, edge: MeshStandardMaterial): Mesh {
  const m = new Mesh(slabGeo(shape, top, thick), [cap, edge]);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function plateShape(stairHole: boolean): Shape {
  const s = DIM.stairHole;
  return polyShape(plateOutline(), stairHole ? [rectPts(s.x0, s.z0, s.x1, s.z1)] : []);
}

interface Opening { a: number; b: number; sill: number; head: number; glass: boolean }

const windows = (r: [number, number][]): Opening[] => r.map(([a, b]) => ({ a: wz(a), b: wz(b), sill: CUT, head: 2.45, glass: true }));

interface Ctx { Bb: Batcher; Bu: Batcher; mb: MatSet; mu: MatSet; y0: number; h: number }

/**
 * A wall run. The part below the cut height is in the base group, everything above it in the upper group, so the selected floor
 * is left as a low wall that shows the whole plan from any angle.
 */
function wallRun(c: Ctx, axis: 'z' | 'x', fixed: number, a0: number, a1: number, ops: Opening[] = [], t = T): void {
  const box = (B: Batcher, mat: MeshStandardMaterial, ya: number, yb: number, p0: number, p1: number): void => {
    if (p1 - p0 <= 1e-4 || yb - ya <= 1e-4) return;
    if (axis === 'z') B.span(mat, fixed - t / 2, ya, p0, fixed + t / 2, yb, p1);
    else B.span(mat, p0, ya, fixed - t / 2, p1, yb, fixed + t / 2);
  };
  const solid = (p0: number, p1: number): void => {
    box(c.Bb, c.mb.wall, c.y0, c.y0 + CUT, p0, p1);
    box(c.Bu, c.mu.wall, c.y0 + CUT, c.y0 + c.h, p0, p1);
  };
  let cur = a0;
  for (const o of [...ops].sort((p, q) => p.a - q.a)) {
    solid(cur, o.a);
    if (o.sill > 0) box(c.Bb, c.mb.wall, c.y0, c.y0 + Math.min(o.sill, CUT), o.a, o.b);
    box(c.Bu, c.mu.wall, c.y0 + o.head, c.y0 + c.h, o.a, o.b);
    if (o.glass) {
      // glass in the opening, with a slim frame at each jamb
      if (axis === 'z') c.Bu.span(c.mu.glass, fixed - 0.02, c.y0 + CUT, o.a, fixed + 0.02, c.y0 + o.head, o.b);
      else c.Bu.span(c.mu.glass, o.a, c.y0 + CUT, fixed - 0.02, o.b, c.y0 + o.head, fixed + 0.02);
      box(c.Bu, c.mu.frame, c.y0 + CUT, c.y0 + o.head, o.a, o.a + 0.05);
      box(c.Bu, c.mu.frame, c.y0 + CUT, c.y0 + o.head, o.b - 0.05, o.b);
    }
    cur = o.b;
  }
  solid(cur, a1);
}

/** The lift car standing at a level: a brass-framed glass cabin. */
function liftCar(c: Ctx): void {
  const cx = wx((DIM.lift.x0 + DIM.lift.x1) / 2), cz = wz((DIM.lift.z0 + DIM.lift.z1) / 2 - 0.4);
  const w = 1.55, d = 1.45, hh = 2.25, y = c.y0 + 0.03;
  c.Bb.span(c.mb.charcoal, cx - w / 2, y, cz - d / 2, cx + w / 2, y + 0.1, cz + d / 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.Bb.span(c.mb.brass, cx + sx * (w / 2 - 0.04), y + 0.1, cz + sz * (d / 2 - 0.04), cx + sx * w / 2, y + hh, cz + sz * d / 2);
  c.Bb.span(c.mb.charcoal, cx - w / 2, y + hh, cz - d / 2, cx + w / 2, y + hh + 0.08, cz + d / 2);
  c.Bb.span(c.mb.liftGlass, cx - w / 2, y + 0.1, cz - d / 2, cx - w / 2 + 0.02, y + hh, cz + d / 2);
  c.Bb.span(c.mb.liftGlass, cx + w / 2 - 0.02, y + 0.1, cz - d / 2, cx + w / 2, y + hh, cz + d / 2);
  c.Bb.span(c.mb.liftGlass, cx - w / 2, y + 0.1, cz - d / 2, cx + w / 2, y + hh, cz - d / 2 + 0.02);
}

/** The lift and stair bay: walls, lobby opening, glass lift shaft, lift doors and the two-flight stair. */
function core(c: Ctx, ground: boolean): void {
  const bay = DIM.bay, t = 0.2;
  const bx0 = wx(bay.x0), bx1 = wx(bay.x1), bz0 = wz(bay.z0), bz1 = wz(bay.z1);
  const zl = wz(49.5);
  const la = wz(DIM.lobby.z0), lb = wz(DIM.lobby.z1);
  const solid = (x0: number, z0: number, x1: number, z1: number, mb = c.mb.wallInner, mu = c.mu.wallInner): void => {
    c.Bb.span(mb, x0, c.y0, z0, x1, c.y0 + CUT, z1);
    c.Bu.span(mu, x0, c.y0 + CUT, z0, x1, c.y0 + c.h, z1);
  };
  const partX = wx(33.45);
  // north wall west of the lift, south wall, west wall with the lobby opening
  solid(bx0, bz0 - t / 2, partX, bz0 + t / 2);
  solid(bx0, bz1 - t / 2, bx1 + t / 2, bz1 + t / 2);
  solid(bx0 - t / 2, bz0 - t / 2, bx0 + t / 2, la);
  solid(bx0 - t / 2, lb, bx0 + t / 2, bz1);
  // east wall: solid beside the stair, and on the ground level an east entry opens to the same lobby
  if (ground) {
    solid(bx1 - t / 2, zl, bx1 + t / 2, la);
    solid(bx1 - t / 2, lb, bx1 + t / 2, bz1);
    c.Bu.span(c.mu.wallInner, bx1 - t / 2, c.y0 + 2.4, la, bx1 + t / 2, c.y0 + c.h, lb);
  } else {
    solid(bx1 - t / 2, zl, bx1 + t / 2, bz1);
  }
  // partition between the lift and services (north) and the lobby (south), with the lift door
  const lcx = wx((DIM.lift.x0 + DIM.lift.x1) / 2), lw = 1.1;
  solid(bx0, zl - 0.1, lcx - lw / 2, zl + 0.1);
  solid(lcx + lw / 2, zl - 0.1, bx1, zl + 0.1);
  c.Bu.span(c.mu.wallInner, lcx - lw / 2, c.y0 + 2.15, zl - 0.1, lcx + lw / 2, c.y0 + c.h, zl + 0.1);
  c.Bb.span(c.mb.brass, lcx - lw / 2 - 0.06, c.y0, zl + 0.08, lcx - lw / 2, c.y0 + 2.2, zl + 0.14);
  c.Bb.span(c.mb.brass, lcx + lw / 2, c.y0, zl + 0.08, lcx + lw / 2 + 0.06, c.y0 + 2.2, zl + 0.14);
  c.Bu.span(c.mu.brass, lcx - lw / 2 - 0.06, c.y0 + 2.15, zl + 0.08, lcx + lw / 2 + 0.06, c.y0 + 2.22, zl + 0.14);
  // services shaft: a solid block west of the lift (hatched on the architect's sheet)
  c.Bb.span(c.mb.step, wx(DIM.services.x0), c.y0, wz(DIM.services.z0), wx(DIM.services.x1), c.y0 + c.h - H.slab, wz(DIM.services.z1));
  // glass lift shaft: north and east faces are glass, framed in brass
  const gz = bz0 - 0.04, gx = bx1 + 0.04;
  c.Bb.span(c.mb.liftGlass, partX, c.y0, gz - 0.02, bx1, c.y0 + c.h, gz + 0.02);
  c.Bb.span(c.mb.liftGlass, gx - 0.02, c.y0, bz0, gx + 0.02, c.y0 + c.h, zl);
  for (const [px, pz] of [[partX, gz], [bx1, gz], [gx, zl]] as [number, number][]) c.Bb.span(c.mb.brass, px - 0.05, c.y0, pz - 0.05, px + 0.05, c.y0 + c.h, pz + 0.05);
  liftCar(c);

  // stair: two flights and a landing, solid steps (the slab above has an opening for it)
  const n = ground ? 19 : 24, L = ground ? 10 : 12;
  const rH = c.h / n;
  const zTop = 57.5, zBot = 67.5;
  const runUp = (zBot - zTop) / (L - 1), runDown = (zBot - zTop) / (n - L);
  const eastX: [number, number] = [34.6, 39.85], westX: [number, number] = [28.6, 33.85];
  for (let k = 1; k < L; k++) c.Bb.span(c.mb.step, wx(eastX[0]), c.y0, wz(zTop + (k - 1) * runUp), wx(eastX[1]), c.y0 + k * rH, wz(zTop + k * runUp));
  c.Bb.span(c.mb.step, wx(westX[0]), c.y0, wz(zBot), wx(eastX[1]), c.y0 + L * rH, wz(70.3));
  for (let j = L + 1; j < n; j++) {
    const idx = j - L;
    c.Bb.span(c.mb.step, wx(westX[0]), c.y0, wz(zBot - idx * runDown), wx(westX[1]), c.y0 + j * rH, wz(zBot - (idx - 1) * runDown));
  }
}

function columns(c: Ctx, top: number, clad: boolean): void {
  const mat = clad ? c.mb.cladding : c.mb.column;
  for (const k of COLUMNS) c.Bb.box(mat, wx(k.x), (c.y0 + top) / 2, wz(k.z), k.w * 0.3048, top - c.y0, k.d * 0.3048);
}

/** The faint brass envelope shown for a level that has been lifted away. */
function ghostOf(shape: Shape, y0: number, h: number, fill: MeshBasicMaterial, edge: LineBasicMaterial): Group {
  const g = new Group();
  const geo = slabGeo(shape, y0 + h, h);
  g.add(new Mesh(geo, fill));
  const lines = new LineSegments(new EdgesGeometry(geo, 25), edge);
  g.add(lines);
  return g;
}

/** Every mesh in the base and upper groups (the ghost is not included): these are the ones that cast and receive shadows. */
function collect(rig: LevelRig): void {
  rig.meshes = [];
  for (const g of [rig.base, rig.upper]) g.traverse((o) => { if (o instanceof Mesh) rig.meshes.push(o); });
}

function newRig(key: RigKey, y0: number, tex: SharedTextures): LevelRig {
  const root = new Group(), base = new Group(), upper = new Group(), ghost = new Group();
  root.add(base, upper, ghost);
  const fillMat = new MeshBasicMaterial({ color: '#d9b25f', transparent: true, opacity: 0, depthWrite: false });
  const edgeMat = new LineBasicMaterial({ color: '#ecd199', transparent: true, opacity: 0, depthWrite: false });
  const s = (): RigState => ({ offset: 0, base: 1, upper: 1, ghost: 0 });
  return { key, root, base, upper, ghost, baseMats: new MatSet(tex), upperMats: new MatSet(tex), fillMat, edgeMat, meshes: [], y0, state: s(), goal: s(), castOn: true };
}

/* ── the levels ───────────────────────────────────────────────────────────────────────── */

function buildGround(tex: SharedTextures): LevelRig {
  const rig = newRig('g', 0, tex);
  const c: Ctx = { Bb: new Batcher(), Bu: new Batcher(), mb: rig.baseMats, mu: rig.upperMats, y0: 0, h: H.ground };
  const { plot, zone } = DIM;
  // the paved plot and the structure zone (the covered parking floor) inside it
  rig.base.add(slabMesh(polyShape(rectPts(0, 0, plot.w, plot.d)), 0, 0.2, c.mb.paving, c.mb.slabEdge));
  rig.base.add(slabMesh(polyShape(rectPts(zone.x0, zone.z0, zone.x1, zone.z1)), 0.05, 0.05, c.mb.structure, c.mb.slabEdge));
  // boundary walls on the west, east and rear; the road side is open
  const bw = 1.4;
  c.Bb.span(c.mb.wall, wx(0) - T / 2, 0, 0, wx(0) + T / 2, bw, wz(plot.d));
  c.Bb.span(c.mb.wall, wx(plot.w) - T / 2, 0, 0, wx(plot.w) + T / 2, bw, wz(plot.d));
  c.Bb.span(c.mb.wall, wx(0), 0, wz(plot.d) - T / 2, wx(plot.w), bw, wz(plot.d) + T / 2);
  c.Bb.span(c.mb.coping, wx(0) - T / 2 - 0.02, bw, 0, wx(0) + T / 2 + 0.02, bw + 0.05, wz(plot.d));
  c.Bb.span(c.mb.coping, wx(plot.w) - T / 2 - 0.02, bw, 0, wx(plot.w) + T / 2 + 0.02, bw + 0.05, wz(plot.d));
  c.Bb.span(c.mb.coping, wx(0), bw, wz(plot.d) - T / 2 - 0.02, wx(plot.w), bw + 0.05, wz(plot.d) + T / 2 + 0.02);
  columns(c, H.ground - H.slab, true);
  core(c, true);
  // fire exit: a green strip on the floor at the rear, east end, as marked on SH-01
  c.Bb.span(c.mb.exit, wx(40.6), 0.06, wz(zone.z1 + 0.6), wx(41.4), 0.09, wz(zone.z1 + 4.2));
  c.Bb.span(c.mb.exit, wx(39.7), 0.06, wz(zone.z1 + 4.2), wx(42.3), 0.09, wz(zone.z1 + 4.9));
  c.Bb.build(rig.base);
  collect(rig);
  return rig;
}

function buildFloor(key: 'f1' | 'f2' | 'f3', tex: SharedTextures): LevelRig {
  const y0 = BASE_Y[key], hh = H.floor, yTop = y0 + hh;
  const rig = newRig(key, y0, tex);
  const c: Ctx = { Bb: new Batcher(), Bu: new Batcher(), mb: rig.baseMats, mu: rig.upperMats, y0, h: hh };
  const { plate, recess } = DIM;
  const x0 = wx(plate.x0), x1 = wx(plate.x1), zF = wz(plate.zGlass), zC = wz(15.667), zR = wz(plate.z1);

  rig.base.add(slabMesh(plateShape(true), y0, H.slab, c.mb.floor, c.mb.slabEdge));

  // west wall, east wall north and south of the recess, the notch walls and the rear wall (with the fire exit)
  wallRun(c, 'z', x0 + T / 2, zC, zR, windows(DIM.windowsWest));
  wallRun(c, 'z', x1 - T / 2, zC, wz(recess.z0), windows(DIM.windowsEastN));
  wallRun(c, 'z', x1 - T / 2, wz(recess.z1), zR, windows(DIM.windowsEastS));
  wallRun(c, 'x', wz(recess.z0) - T / 2, wx(recess.x0), x1);
  wallRun(c, 'x', wz(recess.z1) + T / 2, wx(recess.x0), x1);
  const exitOp: Opening = { a: wx(DIM.fireExit.x0), b: wx(DIM.fireExit.x1), sill: 0, head: 2.1, glass: false };
  wallRun(c, 'x', zR - T / 2, x0, x1, [exitOp]);
  // green fire-exit frame
  c.Bb.span(c.mb.exit, exitOp.a - 0.06, y0, zR - T - 0.02, exitOp.a, y0 + 2.1, zR + 0.02);
  c.Bb.span(c.mb.exit, exitOp.b, y0, zR - T - 0.02, exitOp.b + 0.06, y0 + 2.1, zR + 0.02);
  c.Bu.span(c.mu.exit, exitOp.a - 0.06, y0 + 2.1, zR - T - 0.02, exitOp.b + 0.06, y0 + 2.22, zR + 0.02);

  columns(c, yTop - H.slab, false);
  core(c, false);

  /* The glass front, 5 ft in front of the column line: glass with dark fins, glass returns at the sides. On the selected floor only the
     lowest 0.95 m stays (base), the same cut as the walls, so nothing stands between the viewer and the plan. */
  const fascia = 0.95;
  const gTop = yTop - fascia;
  const gCut = y0 + H.cut;
  for (const B of [[c.Bb, c.mb, y0, gCut], [c.Bu, c.mu, gCut, gTop]] as [Batcher, MatSet, number, number][]) {
    const [b, m, ya, yb] = B;
    b.span(m.glass, x0, ya, zF - 0.02, x1, yb, zF + 0.02);
    b.span(m.glass, x0, ya, zF, x0 + 0.04, yb, zC);
    b.span(m.glass, x1 - 0.04, ya, zF, x1, yb, zC);
  }
  const pitch = 0.96, n = Math.round((x1 - x0) / pitch);
  for (let i = 0; i <= n; i++) {
    const fx = x0 + 0.05 + (i * (x1 - x0 - 0.1)) / n;
    c.Bb.span(c.mb.fin, fx - 0.035, y0 + 0.02, zF - 0.34, fx + 0.035, gCut, zF - 0.02);
    c.Bu.span(c.mu.fin, fx - 0.035, gCut, zF - 0.34, fx + 0.035, gTop, zF - 0.02);
  }
  c.Bb.span(c.mb.frame, x0, y0, zF - 0.06, x1, y0 + 0.06, zF + 0.04);
  // the dark fascia band over each floor, with a thin lit brass line under it
  c.Bu.span(c.mu.charcoal, x0, gTop, zF - 0.36, x1, yTop, zF + 0.1);
  c.Bu.span(c.mu.brass, x0, gTop - 0.04, zF - 0.37, x1, gTop, zF - 0.34);
  c.Bu.span(c.mu.charcoal, x0, y0, zF - 0.1, x0 + 0.5, gTop, zF + 0.1);
  // the jali screen at the east end of the front, from floor to fascia
  const jw = 2.7, jh = hh;
  const jg = new PlaneGeometry(jw, jh);
  const uv = jg.attributes['uv'] as BufferAttribute;
  const rx = jw / 0.13 / 8, ry = jh / 0.13 / 16;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rx, uv.getY(i) * ry);
  const jali = new Mesh(jg, c.mu.jali);
  jali.position.set(x1 - jw / 2 - 0.05, y0 + jh / 2, zF - 0.4);
  jali.rotation.y = Math.PI;
  jali.receiveShadow = true;
  rig.upper.add(jali);
  c.Bu.span(c.mu.frame, x1 - jw - 0.09, y0, zF - 0.42, x1 - jw - 0.05, yTop, zF - 0.36);
  c.Bu.span(c.mu.frame, x1 - 0.05, y0, zF - 0.42, x1 - 0.01, yTop, zF - 0.36);

  // first floor only: the name board on the slab edge over the open ground level
  if (key === 'f1') {
    c.Bb.span(c.mb.charcoal, x0, y0 - 0.95, zF - 0.36, x1, y0, zF + 0.1);
    const bd = new Mesh(new PlaneGeometry(x1 - x0 - 0.6, (x1 - x0 - 0.6) / 16), c.mb.board);
    bd.position.set((x0 + x1) / 2, y0 - 0.5, zF - 0.372);
    bd.rotation.y = Math.PI;
    rig.base.add(bd);
  }

  c.Bb.build(rig.base);
  c.Bu.build(rig.upper);
  collect(rig);
  rig.ghost.add(ghostOf(plateShape(false), y0 - H.slab, hh, rig.fillMat, rig.edgeMat));
  return rig;
}

function buildRoof(tex: SharedTextures): LevelRig {
  const rig = newRig('roof', ROOF_Y, tex);
  const c: Ctx = { Bb: new Batcher(), Bu: new Batcher(), mb: rig.baseMats, mu: rig.upperMats, y0: ROOF_Y, h: 1 };
  const { plate, recess } = DIM;
  const x0 = wx(plate.x0), x1 = wx(plate.x1), zF = wz(plate.zGlass), zR = wz(plate.z1);
  const top = ROOF_Y;
  rig.base.add(slabMesh(plateShape(false), top, 0.3, c.mb.roofTop, c.mb.wall));
  const p = 1.0, pt = 0.2;
  c.Bb.span(c.mb.wall, x0, top, zF, x0 + pt, top + p, zR);
  c.Bb.span(c.mb.wall, x1 - pt, top, zF, x1, top + p, wz(recess.z0));
  c.Bb.span(c.mb.wall, x1 - pt, top, wz(recess.z1), x1, top + p, zR);
  c.Bb.span(c.mb.wall, x0, top, zR - pt, x1, top + p, zR);
  c.Bb.span(c.mb.wall, wx(recess.x0), top, wz(recess.z0), x1, top + p, wz(recess.z0) + pt);
  c.Bb.span(c.mb.wall, wx(recess.x0), top, wz(recess.z1) - pt, x1, top + p, wz(recess.z1));
  c.Bb.span(c.mb.wall, wx(recess.x0), top, wz(recess.z0), wx(recess.x0) + pt, top + p, wz(recess.z1));
  // stair head-room
  c.Bb.span(c.mb.wallInner, wx(27.75), top, wz(56.6), wx(40.5), top + 2.5, wz(71));
  c.Bb.span(c.mb.step, wx(27.65), top + 2.5, wz(56.5), wx(40.6), top + 2.62, wz(71.1));
  // the crown: a tall dark band on the front edge with the lit name
  const ch = 1.7;
  c.Bb.span(c.mb.charcoal, x0, top - 0.25, zF - 0.36, x1, top + ch, zF + 0.12);
  c.Bb.span(c.mb.brass, x0, top + ch, zF - 0.38, x1, top + ch + 0.06, zF + 0.14);
  const sw = x1 - x0 - 1.6;
  const crown = new Mesh(new PlaneGeometry(sw, sw / 9), c.mb.crown);
  crown.position.set((x0 + x1) / 2, top + 0.9, zF - 0.372);
  crown.rotation.y = Math.PI;
  rig.base.add(crown);
  c.Bb.build(rig.base);
  collect(rig);
  rig.ghost.add(ghostOf(plateShape(false), top - 0.3, 0.3 + ch, rig.fillMat, rig.edgeMat));
  return rig;
}

/** The ground the building stands on: a pool of light, the footpath and the 24 m road on the north side. */
function buildExtras(tex: SharedTextures): { group: Group; dispose: () => void } {
  const group = new Group();
  const disposables: { dispose(): void }[] = [];
  const glowMat = new MeshBasicMaterial({ map: tex.glow, transparent: true, depthWrite: false });
  const glow = new Mesh(new CircleGeometry(46, 48), glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, -0.06, wz(DIM.plot.d / 2) - 4);
  group.add(glow);
  disposables.push(glowMat, glow.geometry);

  const asphalt = new MeshStandardMaterial({ map: tex.asphalt, roughness: 1, metalness: 0 });
  const foot = new MeshStandardMaterial({ color: '#8f8a80', roughness: 1, metalness: 0 });
  const line = new MeshStandardMaterial({ color: '#efe0b0', roughness: 0.9, emissive: '#efe0b0', emissiveIntensity: 0.25 });
  disposables.push(asphalt, foot, line);
  const road = new Mesh(new PlaneGeometry(130, 24), asphalt);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.04, -2.6 - 12);
  road.receiveShadow = true;
  const fp = new Mesh(new PlaneGeometry(130, 2.6), foot);
  fp.rotation.x = -Math.PI / 2;
  fp.position.set(0, -0.035, -1.3);
  fp.receiveShadow = true;
  group.add(road, fp);
  disposables.push(road.geometry, fp.geometry);
  const B = new Batcher();
  for (let x = -60; x < 60; x += 6) B.span(line, x, -0.03, -14.7, x + 3, -0.02, -14.55);
  B.build(group, { cast: false, receive: false });
  return { group, dispose: () => disposables.forEach((d) => d.dispose()) };
}

export function buildModel(): BuildingModel {
  const textures = new SharedTextures();
  const root = new Group();
  const rigs: LevelRig[] = [buildGround(textures), buildFloor('f1', textures), buildFloor('f2', textures), buildFloor('f3', textures), buildRoof(textures)];
  rigs.forEach((r) => root.add(r.root));
  const extras = buildExtras(textures);
  root.add(extras.group);
  return {
    root, rigs, extras: extras.group, textures,
    dispose: () => {
      root.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry && m.geometry instanceof BufferGeometry) m.geometry.dispose();
      });
      rigs.forEach((r) => { r.baseMats.dispose(); r.upperMats.dispose(); r.fillMat.dispose(); r.edgeMat.dispose(); });
      extras.dispose();
      textures.dispose();
    },
  };
}

/* ── labels ───────────────────────────────────────────────────────────────────────────── */

export interface LabelDef {
  id: string;
  text: string;
  x: number; y: number; z: number;
  /** Which selected level shows it. */
  levels: LevelKey[];
  tone?: 'gold' | 'green' | 'plain';
  /** Lower number = kept longer on narrow screens. */
  priority: number;
}

const F: LevelKey[] = ['f1', 'f2', 'f3'];

/** Labels on the plan. Every word is already on the site (floor plans page and brochure); nothing here is new information. */
export function labelsFor(): LabelDef[] {
  const out: LabelDef[] = [];
  for (const k of F) {
    const y = BASE_Y[k];
    out.push(
      { id: `${k}-front`, text: 'Glass front · road side', x: wx(24.25), y: y + 0.2, z: wz(DIM.plate.zGlass) + 1.3, levels: [k], tone: 'gold', priority: 1 },
      { id: `${k}-lift`, text: 'Lift', x: wx(36.8), y: y + 2.7, z: wz(45.5), levels: [k], priority: 3 },
      { id: `${k}-stair`, text: 'Stair', x: wx(34.2), y: y + 2.2, z: wz(64.5), levels: [k], priority: 3 },
      { id: `${k}-exit`, text: 'Fire exit', x: wx(40.8), y: y + 0.5, z: wz(DIM.plate.z1) + 1.0, levels: [k], tone: 'green', priority: 2 },
      { id: `${k}-recess`, text: 'East recess · open to sky', x: wx(46.2), y: y + 0.2, z: wz(57.3), levels: [k], priority: 4 },
      { id: `${k}-plate`, text: 'Open floor plate', x: wx(17), y: y + 0.4, z: wz(58), levels: [k], tone: 'plain', priority: 2 },
      { id: `${k}-w`, text: '40′-6″', x: wx(24.25), y: y + 0.2, z: wz(DIM.plate.z1) + 2.2, levels: [k], tone: 'plain', priority: 5 },
      { id: `${k}-l`, text: '89′-6″', x: wx(DIM.plate.x0) - 1.6, y: y + 0.2, z: wz(60), levels: [k], tone: 'plain', priority: 5 },
    );
  }
  out.push(
    { id: 'g-front', text: 'Open frontage · 50 ft', x: 0, y: 0.4, z: wz(7), levels: ['g'], tone: 'gold', priority: 1 },
    { id: 'g-west', text: 'West entry', x: wx(DIM.bay.x0) - 1.0, y: 1.7, z: wz(53.4), levels: ['g'], priority: 2 },
    { id: 'g-east', text: 'East entry', x: wx(DIM.bay.x1) + 1.0, y: 1.7, z: wz(53.4), levels: ['g'], priority: 2 },
    { id: 'g-bay', text: 'Lift and stair bay', x: wx(34), y: 3.1, z: wz(60), levels: ['g'], priority: 3 },
    { id: 'g-park', text: 'Parking', x: wx(15), y: 0.3, z: wz(76), levels: ['g'], tone: 'plain', priority: 1 },
    { id: 'g-exit', text: 'Fire exit', x: wx(41), y: 0.4, z: wz(DIM.zone.z1 + 6.4), levels: ['g'], tone: 'green', priority: 3 },
  );
  return out;
}

/** Brass dimension lines on the plan (the overall width and length drawn on the architect's sheet). */
export function dimensionLines(level: LevelKey): number[] {
  if (level === 'g') return [];
  const y = BASE_Y[level] + 0.12;
  const x0 = wx(DIM.plate.x0), x1 = wx(DIM.plate.x1), zR = wz(DIM.plate.z1), zC = wz(15.667);
  const wl = x0 - 1.2, d = 0.35;
  const seg = (ax: number, az: number, bx: number, bz: number): number[] => [ax, y, az, bx, y, bz];
  return [
    ...seg(x0, zR + 1.2, x1, zR + 1.2), ...seg(x0, zR + 1.2 - d, x0, zR + 1.2 + d), ...seg(x1, zR + 1.2 - d, x1, zR + 1.2 + d),
    ...seg(wl, zC, wl, zR), ...seg(wl - d, zC, wl + d, zC), ...seg(wl - d, zR, wl + d, zR),
  ];
}

