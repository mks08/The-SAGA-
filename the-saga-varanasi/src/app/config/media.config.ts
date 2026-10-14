/**
 * SHRINEVA — image catalogue (renders and architect's drawings).
 * Every render is an indicative 3D visualisation and is subject to change.
 */
import { PLAN } from './property.config';

export interface MediaItem {
  id: string;
  group: string;
  title: string;
  caption: string;
  alt: string;
  /** Full-size image for the lightbox / large display. */
  src: string;
  /** Small image for grids. */
  thumb: string;
  width: number;
  height: number;
  /** Optional higher-resolution sheet shown in the lightbox (e.g. full 2D sheet). */
  zoomSrc?: string;
  zoomWidth?: number;
}

const R = 'assets/images/renders/';
const P = 'assets/images/plans/';

const render = (id: string, group: string, title: string, caption: string, alt: string, height = 639): MediaItem => ({
  id, group, title, caption, alt,
  src: `${R}${id}.webp`,
  thumb: `${R}${id}-sm.webp`,
  width: 1024,
  height,
});

export const RENDER_GROUPS = ['Exterior', 'Stilt court', 'Lift lobby'];

export const RENDERS: MediaItem[] = [
  render('facade-golden', 'Exterior', 'Façade at golden hour', 'The façade when the sun goes low.',
    'Indicative render of the SHRINEVA façade at golden hour: stilt plus three floors with glass fronts, timber screens and the SHRINEVA sign, Bada Lalpur, Varanasi'),
  render('facade-night', 'Exterior', 'Façade at night', 'Warm and secure: lit ledges, brass lockup, crown blade.',
    'Indicative night render of the lit SHRINEVA façade with brass lettering and illuminated floors'),
  render('entry-portal', 'Exterior', 'East entry portal', 'The primary entrance: flat canopy with teak-slat soffit.',
    'Indicative render of the SHRINEVA east entry portal with a flat canopy and teak-slat soffit', 489),
  render('stilt-night', 'Stilt court', 'Stilt court at night', 'Lit timber soffit, backlit ghat mural, light slots on the west wall.',
    'Indicative render of the open stilt court at night with a lit timber soffit, planters and a backlit ghat mural'),
  render('east-mural', 'Stilt court', 'Ghat mural wall', 'Backlit sandstone artwork in a Ganga-wave pattern.',
    'Indicative render of a backlit sandstone mural with Varanasi ghats and a Ganga-wave pattern on the east wall'),
  render('east-shrine', 'Stilt court', 'Hanuman ji shrine', 'Small temple on the east wall, opposite the lift-lobby entrance.',
    'Indicative render of a small Hanuman ji shrine set into the east wall of the stilt walkway'),
  render('west-side', 'Stilt court', 'West side', 'Same palette, quieter: the wall steps up and gets heavier towards the south.',
    'Indicative render of the quieter west-side walkway with sandstone columns and slot lighting'),
  render('east-lobby', 'Lift lobby', 'Lift lobby entrance', 'Open to the walk: stair, lift and stone floor with brass inlay.',
    'Indicative render of the lift lobby entrance with a stair, lift and stone floor with brass inlay'),
  render('lift-lobby', 'Lift lobby', 'Lift lobby', 'Brass-framed lift and a stone floor with inlay.',
    'Indicative render of the brass-framed passenger lift in the stilt-level lift lobby'),
];

export const PLAN_LEVELS = [
  {
    id: 'stilt',
    tab: 'Stilt',
    title: 'Stilt Floor Plan',
    sheet: PLAN.stilt.sheet,
    views: [
      {
        id: '2d',
        label: '2D plan',
        item: {
          id: 'stilt-2d', group: 'Stilt', title: 'Stilt Floor Plan — 2D',
          caption: 'Open ground level, north-facing plot. Sheet SH-01, 12.10.2026.',
          alt: 'Architect\'s 2D stilt floor plan of SHRINEVA with column grid, lift and stair bay, setbacks and dimensions',
          src: `${P}stilt-2d.webp`, thumb: `${P}stilt-2d-sm.webp`, width: 1400, height: 2581,
          zoomSrc: `${P}stilt-2d-sheet.webp`, zoomWidth: 1800,
        } as MediaItem,
      },
      {
        id: '3d',
        label: '3D cutaway',
        item: {
          id: 'stilt-3d', group: 'Stilt', title: 'Stilt Level — 3D cutaway',
          caption: 'Structure zone, lift and stair bay, west and east entries, open frontage.',
          alt: '3D cutaway of the SHRINEVA stilt level showing the structure zone, lift and stair bay, entries and open frontage',
          src: `${P}stilt-3d.webp`, thumb: `${P}stilt-3d-sm.webp`, width: 1600, height: 1067,
        } as MediaItem,
      },
    ],
  },
  {
    id: 'typical',
    tab: 'Floors 1–3',
    title: 'First Floor Plan (typical for Floors 1, 2 and 3)',
    sheet: PLAN.typical.sheet,
    views: [
      {
        id: '2d',
        label: '2D plan',
        item: {
          id: 'typical-2d', group: 'Typical floor', title: 'First Floor Plan — 2D',
          caption: 'Whole floor, 40 ft road frontage. Sheet SH-02, 12.10.2026. Typical for Floors 1, 2 and 3.',
          alt: 'Architect\'s 2D first-floor plan of SHRINEVA showing the open floor plate, column grid, lift and stair bay and area statement',
          src: `${P}typical-2d.webp`, thumb: `${P}typical-2d-sm.webp`, width: 1400, height: 2581,
          zoomSrc: `${P}typical-2d-sheet.webp`, zoomWidth: 1800,
        } as MediaItem,
      },
      {
        id: '3d',
        label: '3D cutaway',
        item: {
          id: 'typical-3d', group: 'Typical floor', title: 'First Floor — 3D cutaway',
          caption: 'Open floor plate, east recess, 5′-0″ glass-line projection, lift and staircase.',
          alt: '3D cutaway of the SHRINEVA first floor showing the open floor plate, glass-line projection, east recess, lift and staircase',
          src: `${P}typical-3d.webp`, thumb: `${P}typical-3d-sm.webp`, width: 1600, height: 1067,
        } as MediaItem,
      },
    ],
  },
];

export const TOP_VIEW: MediaItem = {
  id: 'top-view', group: 'Top view', title: 'Top view — stilt level and first floor',
  caption: 'Stilt level (9′-6″ floor to floor, fully open frontage) beside the first floor (11′-6″ floor to floor, open floor plate).',
  alt: 'Top view of the SHRINEVA stilt level beside the first floor, with areas and dimensions',
  src: `${P}top-view.webp`, thumb: `${P}top-view-sm.webp`, width: 1600, height: 1656,
};

export const LOCATION_MAP: MediaItem = {
  id: 'location-map', group: 'Location', title: 'Location map — three anchors, one address',
  caption: 'Schematic illustration, not to scale. Building shapes are indicative.',
  alt: 'Schematic map of SHRINEVA on Stadium Road, Bada Lalpur, with Apollo Hospital, NIFT, Deendayal Hastkala Sankul and Varanasi Ring Road',
  src: `${P}location-map.webp`, thumb: `${P}location-map-sm.webp`, width: 1800, height: 947,
};

export const FLOOR_PLANS_PDF = 'assets/shrineva-floor-plans.pdf';
