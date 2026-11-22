/**
 * SHRINEVA - plan dimensions for the lift-off 3D floor view in the building explorer.
 *
 * Source: the architect's sheets SH-01 (ground level) and SH-02 (typical floor), read in feet. Plot coordinates: x runs west to east
 * from the west boundary, z runs north to south from the road-side boundary. The 3D view is drawn from these numbers, so it cannot
 * drift from the plans shown beside it. Everything the architect has not drawn (finishes, furniture) is left out on purpose: the
 * floors are offered as open shells, so the view shows the plan and nothing else.
 *
 * World axes in the 3D scene (metres): x east, y up, z south. The road is on the north side (negative z).
 */
export const FT = 0.3048;

const plotW = 49 + 5.5 / 12; // 49'-5 1/2" as drawn on the sheet
const plotD = 115 + 6.5 / 12; // 115'-6 1/2"

/** Grid rows (z of grid lines 1 to 7, ft) from the architect's column grid. */
export const ROWS = [15.667, 29.792, 44.167, 59.417, 70.917, 86.667, 100.167];

export const DIM = {
  plot: { w: plotW, d: plotD },
  /** Structure zone: outer face of the columns (35'-6" x 84'-6"). */
  zone: { x0: 5, x1: 40.5, z0: ROWS[0], z1: ROWS[6] },
  /** Typical floor plate: 1' west, 4' east and a 5' glass-line projection in front, 5' walled strip behind. */
  plate: { x0: 4, x1: 44.5, zGlass: ROWS[0] - 5, z1: ROWS[6] + 5 },
  /** East recess: 4' x 26'-3", open to sky. */
  recess: { x0: 40.5, x1: 44.5, z0: 44.167, z1: 44.167 + 26.25 },
  /** Lift and stair bay, 12'-9" x 27'-9". */
  bay: { x0: 27.75, x1: 40.5, z0: 43, z1: 70.75 },
  /** Lift lobby opening, west side of the bay (the east side too on the ground level). */
  lobby: { z0: 49.8, z1: 57 },
  services: { x0: 28.2, x1: 33.2, z0: 43.4, z1: 49.5 },
  lift: { x0: 33.75, x1: 39.875, z0: 43.4, z1: 48.8 },
  /** Opening in each slab above the stair flights. */
  stairHole: { x0: 28.5, x1: 40.2, z0: 57.6, z1: 70.3 },
  /** Fire exit through the rear wall, east end (SH-02). */
  fireExit: { x0: 38.8, x1: 42.9 },
  /** Window openings drawn on the sheet (z ranges, ft). */
  windowsWest: [[19.7, 25.7], [34, 40.2], [48.7, 54.7], [62.2, 68.1], [75.8, 81.7], [90.3, 96.4]] as [number, number][],
  windowsEastN: [[18, 26.5], [29, 38]] as [number, number][],
  windowsEastS: [[73.3, 79], [82.9, 89.2], [92.5, 98.3]] as [number, number][],
};

/** Heights in metres. Ground level about 9.5 ft, floors about 11.5 ft floor to floor (as stated on the site). */
export const H = {
  ground: 9.5 * FT,
  floor: 11.5 * FT,
  slab: 0.26,
  wall: 0.23,
  /** Height the selected floor's walls are cut to, so the whole plan can be seen from any angle. */
  cut: 0.95,
};

/** Column centres read from the architect's typical-floor drawing: [x, z] in plot feet, plus the footprint (ft). */
export interface ColumnSpec { x: number; z: number; w: number; d: number }
const REL_WEST = [1.1, 14.2, 28.6, 43.8, 55.4, 71.1, 84.2];
const REL_B = [1.1, 28.4, 42.8, 54.8, 83.5];
const REL_C = [1.1, 27.7, 42.5, 56, 83.5];
const A = 5.625, B = 28, C = 39.875;
export const COLUMNS: ColumnSpec[] = [
  ...REL_WEST.map((r, i): ColumnSpec => (i === 0 || i === REL_WEST.length - 1 ? { x: A, z: ROWS[0] + r, w: 1.25, d: 2 } : { x: A, z: ROWS[0] + r, w: 2, d: 1 })),
  ...REL_B.map((r): ColumnSpec => ({ x: B, z: ROWS[0] + r, w: 1.25, d: 2 })),
  ...REL_C.map((r): ColumnSpec => ({ x: C, z: ROWS[0] + r, w: 1.25, d: 2 })),
];

/** Plan outline of an upper floor plate in plot feet, with the east recess notched out (clockwise from the north-west corner). */
export function plateOutline(): [number, number][] {
  const p = DIM.plate, r = DIM.recess;
  return [
    [p.x0, p.zGlass], [p.x1, p.zGlass], [p.x1, r.z0], [r.x0, r.z0], [r.x0, r.z1], [p.x1, r.z1], [p.x1, p.z1], [p.x0, p.z1],
  ];
}

/** Plot feet to world metres: x from the plot centre line, z from the road-side boundary. */
const cxm = DIM.plot.w / 2;
export const wx = (x: number): number => (x - cxm) * FT;
export const wz = (z: number): number => z * FT;

export type LevelKey = 'g' | 'f1' | 'f2' | 'f3';
export const LEVEL_ORDER: LevelKey[] = ['g', 'f1', 'f2', 'f3'];

/** Finished-floor height of each level above the ground slab, metres. */
export const BASE_Y: Record<LevelKey, number> = {
  g: 0,
  f1: H.ground,
  f2: H.ground + H.floor,
  f3: H.ground + 2 * H.floor,
};
export const ROOF_Y = H.ground + 3 * H.floor;

/** Centre of the floor plate (world metres): where the camera looks. */
export const PLATE_CENTRE = {
  x: wx((DIM.plate.x0 + DIM.plate.x1) / 2),
  z: wz((DIM.plate.zGlass + DIM.plate.z1) / 2),
};
export const PLOT_CENTRE = { x: 0, z: wz(DIM.plot.d / 2) };
