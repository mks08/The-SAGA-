/**
 * Floor model behind the space finder: the typical floor (Floors 1, 2 and 3 are identical) as plain geometry, in feet, with the
 * origin at the north-west corner of the floor plate (x runs east, y runs south, so y = 0 is the road side).
 *
 * Source of every number: the architect's typical-floor sheet (property.config.ts, PLAN.typical): 40′-6″ × 89′-6″, lift, lobby and
 * stair bay 12′-9″ × 27′-9″ on the east side about 28 ft behind the glass front, 4 ft east recess. The marketing carpet figure
 * (about 3,100 sq ft) is spread over the floor in proportion to area, so a whole floor always reads as the figure used on the site.
 *
 * It is a planning aid, not a drawing for construction: it shows how much floor a given area takes, how much road front comes with it,
 * and where the lift and stair bay constrains a split. Demising walls and the common passage are for the occupiers' architect.
 */
import { MARKETING_AREA } from './property.config';

export type Pt = [number, number];

export const FLOOR = {
  w: 40.5,
  l: 89.5,
  /** Lift, lift lobby and stair bay: common to every occupier, never leased. */
  core: { x: 23.75, y: 28.25, w: 12.75, l: 27.75 },
  /** East recess beside the core (outside the floor, shown on the drawing). */
  recess: { x: 36.5, y: 28.25, w: 4, l: 26.25 },
  /** Glass front line projects 5 ft beyond the front line. */
  glassFt: 5,
  /** Where the lift lobby opens onto the floor (west face of the core, measured from the front). */
  lobbyY: [34.9, 40],
  /** Fire exit at the rear, east end (marked on the architect's sheet). */
  fireExit: { x: 36.9, y: 89.5 },
};

/** Band edges from the front: the full-width front band, the band beside the core, the full-width rear band. */
const Y1 = FLOOR.core.y;
const Y2 = FLOOR.core.y + FLOOR.core.l;

/** Width available at depth y (the core and the east recess take the rest of the width beside it). */
export function eastEdge(y: number): number { return y >= Y1 && y < Y2 ? FLOOR.core.x : FLOOR.w; }

/** Floor area (gross, lift and stair bay excluded) between the front and depth y. */
export function usable(y: number): number {
  const c = Math.max(0, Math.min(y, FLOOR.l));
  return Math.min(c, Y1) * FLOOR.w
    + Math.max(0, Math.min(c, Y2) - Y1) * FLOOR.core.x
    + Math.max(0, c - Y2) * FLOOR.w;
}
export const USABLE_TOTAL = usable(FLOOR.l);

/** Carpet sq ft per sq ft of usable floor, so the whole floor reads as the site's carpet figure. */
export const CARPET_RATIO = MARKETING_AREA.carpetNum / USABLE_TOTAL;
export const toGross = (carpet: number): number => carpet / CARPET_RATIO;
export const toCarpet = (gross: number): number => gross * CARPET_RATIO;

/** Planning allowance for a common passage and demising walls when the floor is shared. An assumption, to be confirmed by the architect. */
export const PASSAGE_ALLOWANCE = 100;
/** A side-by-side split needs this much width left beside the core so the second occupier is one connected space. */
const MIN_CONNECT = 5;
const MIN_STRIP = 12;

/** Depth (from the front) at which the usable area reaches `gross`, by inverting usable(). */
export function depthFor(gross: number, from = 0): number {
  const target = usable(from) + gross;
  if (target >= USABLE_TOTAL) return FLOOR.l;
  let lo = from, hi = FLOOR.l;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (usable(mid) < target) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

/** The part of the floor between two depths, as a polygon that goes around the core. */
export function slicePoly(ya: number, yb: number, xw = 0): Pt[] {
  const stops = [ya, ...[Y1, Y2].filter((b) => b > ya + 1e-6 && b < yb - 1e-6), yb];
  const pts: Pt[] = [[xw, ya]];
  for (let i = 0; i < stops.length - 1; i++) {
    const x = eastEdge((stops[i] + stops[i + 1]) / 2);
    pts.push([x, stops[i]], [x, stops[i + 1]]);
  }
  pts.push([xw, yb]);
  return pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
}

export interface Region {
  id: string;
  poly: Pt[];
  carpet: number;
  gross: number;
  /** Length of glass front that comes with the region (0 when it does not touch the road side). */
  front: number;
  /** Depth from the road side to the back of the region, ft. */
  depth: number;
  /** Where the region starts, ft from the front. */
  from: number;
  /** West edge of the region, ft from the west wall. */
  x0: number;
  /** Set when the east edge is a straight line (a west strip) rather than following the core. */
  eastConst?: number;
}

export interface Plan {
  scheme: 'one' | 'stack' | 'side';
  regions: Region[];
  /** Floor left unallocated (vacant, common passage and walls). */
  spare: { gross: number; carpet: number; poly: Pt[] | null };
  fits: boolean;
  /** Carpet sq ft the request exceeds the floor by (0 when it fits). */
  shortBy: number;
  /** Carpet sq ft left once the common passage allowance is kept back (two occupiers). */
  slack: number;
  notes: string[];
}

function regionFrom(id: string, poly: Pt[], gross: number, front: number, from: number, to: number, x0 = 0, eastConst?: number): Region {
  return { id, poly, gross, carpet: toCarpet(gross), front, depth: to, from, x0, eastConst };
}

/** One occupier takes the front of the floor first, the full width of the glass front. */
export function planOne(carpet: number): Plan {
  const need = toGross(carpet);
  const fits = need <= USABLE_TOTAL + 1;
  const d = fits ? depthFor(need) : FLOOR.l;
  const g = fits ? need : USABLE_TOTAL;
  const region = regionFrom('A', slicePoly(0, d), g, FLOOR.w, 0, d);
  const rest = USABLE_TOTAL - g;
  return {
    scheme: 'one',
    regions: [region],
    spare: { gross: rest, carpet: toCarpet(rest), poly: rest > 1 && d < FLOOR.l ? slicePoly(d, FLOOR.l) : null },
    fits,
    shortBy: fits ? 0 : Math.round(carpet - MARKETING_AREA.carpetNum),
    slack: 0,
    notes: [],
  };
}

/** Two occupiers, one behind the other: the first takes the front, the second the floor behind. */
export function planStack(c1: number, c2: number): Plan {
  const g1 = toGross(c1), g2 = toGross(c2);
  const total = g1 + g2;
  const fits = total <= USABLE_TOTAL + 1;
  const scale = fits ? 1 : USABLE_TOTAL / total;
  const a = g1 * scale, b = g2 * scale;
  const d1 = depthFor(a);
  const d2 = depthFor(b, d1);
  const r1 = regionFrom('A', slicePoly(0, d1), a, FLOOR.w, 0, d1);
  const r2 = regionFrom('B', slicePoly(d1, d2), b, 0, d1, d2);
  const rest = Math.max(0, USABLE_TOTAL - a - b);
  return {
    scheme: 'stack',
    regions: [r1, r2],
    spare: { gross: rest, carpet: toCarpet(rest), poly: rest > 1 && d2 < FLOOR.l - 0.01 ? slicePoly(d2, FLOOR.l) : null },
    fits,
    shortBy: fits ? 0 : Math.round(c1 + c2 - MARKETING_AREA.carpetNum),
    slack: Math.round(toCarpet(USABLE_TOTAL - total - PASSAGE_ALLOWANCE)),
    notes: [],
  };
}

/** The widest west strip that still leaves the east occupier one connected space around the core. */
export const MAX_SIDE_STRIP_X = FLOOR.core.x - MIN_CONNECT;

/** Two occupiers side by side, both on the road: a strip on the west for the first, the rest of the east side for the second. */
export function planSide(c1: number, c2: number): Plan | null {
  const g1 = toGross(c1), g2 = toGross(c2);
  const xs = g1 / FLOOR.l;
  if (xs < MIN_STRIP || xs > MAX_SIDE_STRIP_X) return null;
  const eastAll = USABLE_TOTAL - xs * FLOOR.l;
  if (g2 > eastAll + 1) return null;
  // The east occupier takes the east side from the front to the depth that gives g2.
  const area = (d: number) => usable(d) - xs * d;
  let lo = 0, hi = FLOOR.l;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (area(mid) < g2) lo = mid; else hi = mid; }
  const d = (lo + hi) / 2;
  const west: Pt[] = [[0, 0], [xs, 0], [xs, FLOOR.l], [0, FLOOR.l]];
  const east = slicePoly(0, d, xs);
  const r1 = regionFrom('A', west, g1, xs, 0, FLOOR.l, 0, xs);
  const r2 = regionFrom('B', east, g2, FLOOR.w - xs, 0, d, xs);
  const rest = Math.max(0, eastAll - g2);
  return {
    scheme: 'side',
    regions: [r1, r2],
    spare: { gross: rest, carpet: toCarpet(rest), poly: rest > 1 && d < FLOOR.l - 0.01 ? slicePoly(d, FLOOR.l, xs) : null },
    fits: true,
    shortBy: 0,
    slack: Math.round(toCarpet(USABLE_TOTAL - g1 - g2 - PASSAGE_ALLOWANCE)),
    notes: [],
  };
}

/** Largest west strip (carpet sq ft) a side-by-side split allows. */
export const MAX_SIDE_CARPET = Math.floor(toCarpet(MAX_SIDE_STRIP_X * FLOOR.l) / 10) * 10;

/** Thousands separators without relying on the locale (the server and the browser must print the same text). */
export function fmt(n: number): string {
  const r = Math.round(n);
  return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
/** "about 1,000" style rounding to the nearest 10. */
export const about = (n: number): string => fmt(Math.round(n / 10) * 10);
export const feet = (n: number): string => (Math.round(n * 2) / 2).toString().replace(/\.0$/, '');

/** Column centres read from the architect's typical-floor drawing, ft from the north-west corner of the floor plate. Indicative. */
export const COLUMNS: Pt[] = [
  [2, 1.1], [2, 14.2], [2, 28.6], [2, 43.8], [2, 55.4], [2, 71.1], [2, 84.2],
  [24, 1.1], [24, 28.4], [24, 42.8], [24, 54.8], [24, 83.5],
  [36, 1.1], [36, 27.7], [36, 42.5], [36, 56], [36, 83.5],
];
