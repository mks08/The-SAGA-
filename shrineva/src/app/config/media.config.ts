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
  /** Optional larger image shown when the visitor zooms in the lightbox. */
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

export const RENDER_GROUPS = ['Exterior', 'Parking-level court', 'Lift lobby'];

export const RENDERS: MediaItem[] = [
  render('facade-golden', 'Exterior', 'Façade at golden hour', 'The façade when the sun goes low.',
    'Indicative render of the SHRINEVA façade at golden hour: parking plus three floors with glass fronts, timber screens and the SHRINEVA sign, Bada Lalpur, Varanasi'),
  render('facade-night', 'Exterior', 'Façade at night', 'Warm and secure: lit ledges, brass lockup, crown blade.',
    'Indicative night render of the lit SHRINEVA façade with brass lettering and illuminated floors'),
  render('entry-portal', 'Exterior', 'East entry portal', 'The primary entrance: flat canopy with teak-slat soffit.',
    'Indicative render of the SHRINEVA east entry portal with a flat canopy and teak-slat soffit', 489),
  render('parking-night', 'Parking-level court', 'Parking-level court at night', 'Lit timber soffit, backlit ghat mural, light slots on the west wall.',
    'Indicative render of the open parking-level court at night with a lit timber soffit, planters and a backlit ghat mural'),
  render('east-mural', 'Parking-level court', 'Ghat mural wall', 'Backlit sandstone artwork in a Ganga-wave pattern.',
    'Indicative render of a backlit sandstone mural with Varanasi ghats and a Ganga-wave pattern on the east wall'),
  render('east-shrine', 'Parking-level court', 'Hanuman ji shrine', 'Small temple on the east wall, opposite the lift-lobby entrance.',
    'Indicative render of a small Hanuman ji shrine set into the east wall of the parking-level walkway'),
  render('west-side', 'Parking-level court', 'West side', 'Same palette, quieter: the wall steps up and gets heavier towards the south.',
    'Indicative render of the quieter west-side walkway with sandstone columns and slot lighting'),
  render('east-lobby', 'Lift lobby', 'Lift lobby entrance', 'Open to the walk: stair, lift and stone floor with brass inlay.',
    'Indicative render of the lift lobby entrance with a stair, lift and stone floor with brass inlay'),
  render('lift-lobby', 'Lift lobby', 'Lift lobby', 'Brass-framed lift and a stone floor with inlay.',
    'Indicative render of the brass-framed passenger lift in the ground-level lift lobby'),
];

export const PLAN_LEVELS = [
  {
    id: 'stilt',
    tab: 'Parking level',
    title: 'Parking-Level Floor Plan',
    sheet: PLAN.stilt.sheet,
    views: [
      {
        id: '2d',
        label: '2D plan',
        item: {
          id: 'parking-2d', group: 'Parking level', title: 'Parking-Level Floor Plan — 2D',
          caption: 'Open ground level, north-facing plot. Sheet SH-01, 12.10.2026.',
          alt: 'Architect\'s 2D parking-level floor plan of SHRINEVA with column grid, lift and stair bay and dimensions',
          src: `${P}parking-2d.webp`, thumb: `${P}parking-2d-sm.webp`, width: 1400, height: 2581,
          zoomSrc: `${P}parking-2d.webp`, zoomWidth: 1400,
        } as MediaItem,
      },
      {
        id: '3d',
        label: '3D cutaway',
        item: {
          id: 'parking-3d', group: 'Parking level', title: 'Parking Level — 3D cutaway',
          caption: 'Structure zone, lift and stair bay, west and east entries, open frontage.',
          alt: '3D cutaway of the SHRINEVA parking level showing the structure zone, lift and stair bay, entries and open frontage',
          src: `${P}parking-3d.webp`, thumb: `${P}parking-3d-sm.webp`, width: 1600, height: 1067,
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
          caption: 'Whole floor with a glass front on the road. Sheet SH-02, 12.10.2026. Typical for Floors 1, 2 and 3.',
          alt: 'Architect\'s 2D first-floor plan of SHRINEVA showing the open floor plate, column grid, lift and stair bay and area statement',
          src: `${P}typical-2d.webp`, thumb: `${P}typical-2d-sm.webp`, width: 1400, height: 2581,
          zoomSrc: `${P}typical-2d.webp`, zoomWidth: 1400,
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
  id: 'top-view', group: 'Top view', title: 'Top view — parking level and first floor',
  caption: 'Parking level (9′-6″ floor to floor, fully open frontage) beside the first floor (11′-6″ floor to floor, open floor plate).',
  alt: 'Top view of the SHRINEVA parking level beside the first floor, with areas and dimensions',
  src: `${P}top-view.webp`, thumb: `${P}top-view-sm.webp`, width: 1600, height: 1656,
};

export const FLOOR_PLANS_PDF = 'assets/shrineva-floor-plans.pdf';

/** The short leasing dossier (A4 landscape PDF) and its website card. Built by scripts/pdf/build_pdfs.py. */
export const DOSSIER = {
  href: 'assets/shrineva-dossier.pdf',
  plansHref: FLOOR_PLANS_PDF,
  cover: 'assets/images/dossier-cover.webp',
  size: '4 MB',
};

/** The illustrated 3D location map (not to scale): Ring Road, Trade Centre, NIFT, Apollo and the plot. */
export const LOCATION_MAP: MediaItem = {
  id: 'location-3d', group: 'Location', title: 'Location map (3D, not to scale)',
  caption: 'Illustrative 3D map: Ring Road, Trade Centre, NIFT, Apollo hospital site and SHRINEVA on the 24 m road. Not to scale.',
  alt: 'Illustrative 3D map of Bada Lalpur showing the Varanasi Ring Road, the Varanasi Trade Centre, NIFT, the Apollo hospital site and SHRINEVA on the 24 m wide road',
  src: 'assets/images/map/location-3d.webp', thumb: 'assets/images/map/location-3d-sm.webp', width: 1800, height: 947,
};

/**
 * Short drive-in and floor-tour film (home page, after the location block).
 * `available` stays false until assets/video/shrineva-tour.mp4 and the poster exist; chapters are seconds into the film.
 * The film is an illustrative animation over the 3D map plus the indicative 3D model. Locations are approximate.
 */
export interface TourChapter { id: string; label: string; start: number; }
export const TOUR_VIDEO = {
  available: true,
  src: 'assets/video/shrineva-tour.mp4',
  poster: 'assets/video/shrineva-tour-poster.webp',
  posterWidth: 1280,
  posterHeight: 720,
  durationSec: 88,
  uploadDate: '2026-10-15',
  title: 'SHRINEVA: drive-in from Ring Road and floor tour',
  description: 'An illustrative map flight from Ring Road to Stadium Road in Bada Lalpur, Varanasi: the Trade Centre and Vardhan Hospital facing each other, NIFT, the Apollo hospital site and SHRINEVA, followed by an indicative 3D tour of the ground and first floors.',
  chapters: [
    { id: 'drive', label: 'Drive in from Ring Road', start: 0 },
    { id: 'nearby', label: 'Trade Centre · Vardhan Hospital', start: 12 },
    { id: 'anchors', label: 'NIFT · Apollo · the plot', start: 19 },
    { id: 'ground', label: 'Ground floor', start: 37 },
    { id: 'first', label: 'First floor', start: 65 },
  ] as TourChapter[],
};
