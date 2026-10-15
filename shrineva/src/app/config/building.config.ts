/**
 * SHRINEVA — building geometry for the 3D walkthrough and the generated 2D plan.
 *
 * Source: the architect's sheets SH-01 (parking level) and SH-02 (typical floor), 12.10.2026, read in feet, plot
 * coordinates: x runs west → east from the west boundary, z runs north → south from the road-side boundary.
 * The 3D model and the SVG plan are both drawn from these numbers, so they cannot drift apart.
 *
 * Everything the architect has not drawn is deliberately generic and marked "indicative" in the UI: façade finishes,
 * furniture presets, neighbours, trees and traffic. Clear ceiling height is not confirmed (see PLAN notes), so the
 * model uses a nominal 10′-6″ ceiling and says so.
 */
import { PLAN } from './property.config';

export const FT = 0.3048;

const plotW = 49 + 5.5 / 12; // 49′-5½″ as drawn on the sheet
const plotD = 115 + 6.5 / 12; // 115′-6½″

/** Grid rows (z of grid lines 1–7, ft) from the architect's column grid. */
const rows = [15.667, 29.792, 44.167, 59.417, 70.917, 86.667, 100.167];

export const BUILDING = {
  ft: FT,
  plot: { w: plotW, d: plotD, roadWidthM: PLAN.plot.roadWidthM },
  setbacks: { front: 15 + 8 / 12, rear: 15 + 4.5 / 12, east: 8 + 11.5 / 12, west: 5 },

  /** Structure zone: outer face of columns (35′-6″ × 84′-6″). */
  zone: { x0: 5, x1: 40.5, z0: rows[0], z1: rows[6] },
  rows,
  /** Column lines A, B, C (x of centre-lines, ft). */
  cols: { A: 5.625, B: 28, C: 39.875 },

  /** Typical floor plate: 1′-0″ west, 4′-0″ east and a 5′-0″ glass-line projection in front, 5′-0″ wall behind. */
  plate: { x0: 4, x1: 44.5, zGlass: rows[0] - 5, z1: rows[6] + 5 },
  /** East recess: 4′-0″ × 26′-3″, open to sky. */
  recess: { x0: 40.5, x1: 44.5, z0: 44.167, z1: 44.167 + 26.25 },

  /** Lift and stair bay, 12′-9″ × 27′-9″. */
  bay: { x0: 27.75, x1: 40.5, z0: 43, z1: 70.75 },
  /** Lobby opening, west side of the bay (and east side on the parking level). */
  lobby: { z0: 49.8, z1: 57 },
  services: { x0: 28.2, x1: 33.2, z0: 43.4, z1: 49.5 },
  lift: { x0: 33.75, x1: 33.75 + 6.125, z0: 43.4, z1: 43.4 + 5.417 },

  /** Heights in metres. Parking level 9′-6″, upper floors 11′-6″ (3.51 m). */
  h: {
    parking: 9.5 * FT,
    floor: 11.5 * FT,
    ceiling: 10.5 * FT, // nominal ceiling used in the model; clear height is to be confirmed
    slab: 0.26,
    parapet: 1.0,
    eye: 1.62,
  },

  /** Window openings drawn on the sheet (z ranges, ft). */
  windowsWest: [[19.7, 25.7], [34, 40.2], [48.7, 54.7], [62.2, 68.1], [75.8, 81.7], [90.3, 96.4]] as [number, number][],
  windowsEastN: [[18, 26.5], [29, 38]] as [number, number][],
  windowsEastS: [[73.3, 79], [82.9, 89.2], [92.5, 98.3]] as [number, number][],

  /** Direction and distance of the anchors, from the owner's location sheet (bearing from the plot, degrees from north). */
  anchors: [
    { id: 'apollo', label: 'Apollo Medics site', sub: '60–70 m · opposite side', bearing: 45, metres: 65 },
    { id: 'nift', label: 'NIFT Varanasi', sub: '60–70 m · opposite side', bearing: 315, metres: 65 },
  ],
  tradeCentre: { label: 'Varanasi Trade Centre', sub: 'about 330 m west on this road' },
};

/** Plan outline of an upper floor plate in plot feet, with the east recess notched out (clockwise from the north-west corner). */
export function plateOutline(): [number, number][] {
  const p = BUILDING.plate, r = BUILDING.recess;
  return [
    [p.x0, p.zGlass], [p.x1, p.zGlass], [p.x1, r.z0], [r.x0, r.z0], [r.x0, r.z1], [p.x1, r.z1], [p.x1, p.z1], [p.x0, p.z1],
  ];
}

/** Opening in each slab above a stair flight, plot feet. */
export const STAIR_HOLE = { x0: 28.5, x1: 40.2, z0: 57.6, z1: 70.3 };

export type LevelId = 0 | 1 | 2 | 3;

export interface LevelInfo {
  id: LevelId;
  label: string;
  short: string;
  /** Base height of the finished floor above the plinth, metres. */
  baseY: number;
  blurb: string;
  facts: string[];
}

const hp = BUILDING.h.parking;
const hf = BUILDING.h.floor;

export const LEVELS: LevelInfo[] = [
  {
    id: 0, label: 'Parking level', short: 'Parking', baseY: 0,
    blurb: 'Open to the road. Arrival, parking, a planted east walk and the lift and stair lobby.',
    facts: ['Open frontage, about 50 ft', '9′-6″ floor to floor', 'Lift and stair lobby, west and east entries'],
  },
  {
    id: 1, label: 'Floor 1', short: 'Floor 1', baseY: hp,
    blurb: 'One whole floor. Glass front on the road.',
    facts: ['3,519.75 sq ft floor area', '11′-6″ floor to floor', '8-person lift'],
  },
  {
    id: 2, label: 'Floor 2', short: 'Floor 2', baseY: hp + hf,
    blurb: 'The same open plate, one level up.',
    facts: ['3,519.75 sq ft floor area', 'Windows east and west', 'Solid rear wall'],
  },
  {
    id: 3, label: 'Floor 3', short: 'Floor 3', baseY: hp + 2 * hf,
    blurb: 'The same open plate, top floor, roof above.',
    facts: ['3,519.75 sq ft floor area', 'Divide as required', 'Roof above'],
  },
];

export const BUILDING_TOP = hp + 3 * hf;

export type Preset = 'open' | 'office' | 'clinic' | 'cafe';
export const PRESETS: { id: Preset; label: string; note: string }[] = [
  { id: 'open', label: 'Open plate', note: 'The floor as drawn: columns, lift, stair, glass.' },
  { id: 'office', label: 'Office', note: 'Illustrative desks and a meeting room. Not a design.' },
  { id: 'clinic', label: 'Clinic', note: 'Illustrative waiting area and consulting rooms. Not a design.' },
  { id: 'cafe', label: 'Café', note: 'Illustrative counter and seating. Not a design.' },
];

export type TimeOfDay = 'day' | 'golden' | 'night';
export const TIMES: { id: TimeOfDay; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'golden', label: 'Golden hour' },
  { id: 'night', label: 'Night' },
];

/** A guided-tour stop. Positions are plot feet; `look` is the point the camera faces. Heights are metres above the plinth. */
export interface TourStop {
  id: string;
  title: string;
  text: string;
  mode: 'outside' | 'inside';
  level: LevelId | null;
  /** Outside: azimuth (rad from north, + towards east), polar elevation (rad), radius (m). */
  orbit?: { theta: number; phi: number; r: number };
  /** Inside: eye position (ft) and yaw (rad from north, + towards east), pitch (rad). */
  eye?: { x: number; z: number; yaw: number; pitch?: number };
  dwell: number;
}

const D = Math.PI / 180;

export const TOUR: TourStop[] = [
  {
    id: 'road', title: 'From the road', mode: 'outside', level: null,
    orbit: { theta: 0.1, phi: 0.12, r: 34 },
    text: 'About 50 ft of open frontage on a 24 m road. Parking at street level, three floors above.', dwell: 5200,
  },
  {
    id: 'facade', title: 'The façade', mode: 'outside', level: null,
    orbit: { theta: 36 * D, phi: 0.3, r: 40 },
    text: 'Glass on Floor 1, timber screens on Floor 2, a terrace edge on Floor 3.', dwell: 5000,
  },
  {
    id: 'court', title: 'Parking level', mode: 'inside', level: 0,
    eye: { x: 22, z: 6, yaw: 168 * D, pitch: -0.02 },
    text: 'Open from the road. Park, then walk to the lift and stair at the back of the court.', dwell: 4800,
  },
  {
    id: 'east', title: 'East walk', mode: 'inside', level: 0,
    eye: { x: 44.4, z: 20, yaw: 158 * D, pitch: -0.03 },
    text: 'A Varanasi-inspired ghat wall with lit arches and painted panels, and planting along the walk.', dwell: 5200,
  },
  {
    id: 'west', title: 'West passage', mode: 'inside', level: 0,
    eye: { x: 3, z: 20, yaw: -158 * D, pitch: -0.02 },
    text: 'A light stone jali with a warm glow behind it. Quieter than the east wall.', dwell: 4600,
  },
  {
    id: 'lobby', title: 'Lift and stair', mode: 'inside', level: 0,
    eye: { x: 34, z: 56.2, yaw: 8 * D, pitch: 0 },
    text: 'A stone-framed 8-person lift and a railed staircase. West and east entries lead to the same lobby.', dwell: 5000,
  },
  {
    id: 'floor', title: 'A whole floor', mode: 'inside', level: 2,
    eye: { x: 24, z: 52, yaw: -62 * D, pitch: -0.03 },
    text: 'One open plate, 3,519.75 sq ft. Divide it as your business needs.', dwell: 5400,
  },
  {
    id: 'glass', title: 'The road view', mode: 'inside', level: 1,
    eye: { x: 14, z: 19, yaw: 14 * D, pitch: 0.02 },
    text: 'Floor-to-ceiling glass on the road, with the Apollo and NIFT sites across the way.', dwell: 5400,
  },
  {
    id: 'sky', title: 'Parking + 3', mode: 'outside', level: null,
    orbit: { theta: -48 * D, phi: 0.62, r: 58 },
    text: 'Four levels on a 525 sq m plot. Walk through it yourself: drag to look, tap the floor to move.', dwell: 4800,
  },
];

/** Quick jumps inside. */
export const WAYPOINTS: { id: string; label: string; eye: { x: number; z: number; yaw: number }; levels: LevelId[] }[] = [
  { id: 'front', label: 'Front', eye: { x: 24, z: 6, yaw: 0 }, levels: [0] },
  { id: 'east', label: 'East walk', eye: { x: 44.4, z: 20, yaw: 158 * D }, levels: [0] },
  { id: 'west', label: 'West jali', eye: { x: 3, z: 20, yaw: -158 * D }, levels: [0] },
  { id: 'entry', label: 'Lift', eye: { x: 34, z: 56.2, yaw: 8 * D }, levels: [0, 1, 2, 3] },
  { id: 'stair', label: 'Stair', eye: { x: 34, z: 51.4, yaw: 180 * D }, levels: [0, 1, 2, 3] },
  { id: 'glass', label: 'Road view', eye: { x: 14, z: 19, yaw: 14 * D }, levels: [1, 2, 3] },
  { id: 'rear', label: 'Rear', eye: { x: 24, z: 92, yaw: 180 * D }, levels: [1, 2, 3] },
];

export const WALKTHROUGH_NOTE =
  'Indicative 3D model drawn from the architect’s plan dimensions. Façade finishes, furniture, neighbours and surroundings are illustrative; the design is subject to change.';
