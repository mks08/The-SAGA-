/**
 * SHRINEVA — image catalogue: the finalised 3D renders, the architect's floor plans (as printed in the brochure),
 * the real photographs of the building as it stands today, the location map and the brochure download.
 * Every render is an indicative 3D visualisation and is subject to change. Photographs show construction progress.
 */

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
const F = 'assets/images/photos/';
const H = 'assets/images/hero/';

/** Hero: the finalised building render (960 / 1920 px wide). One image, preloaded, so it is the first thing that paints. */
export const HERO = {
  src960: `${H}hero-day-960.webp`, src1920: `${H}hero-day-1920.webp`,
  alt: 'Indicative 3D render of the SHRINEVA commercial building: open ground level and three floors with glass fronts and a sandstone-clad side, Bada Lalpur, Varanasi',
};
export const HERO_W = 1920;
export const HERO_H = 995;

const render = (id: string, title: string, caption: string, alt: string, height = 829): MediaItem => ({
  id, group: 'Walkthrough', title, caption, alt,
  src: `${R}${id}.webp`, thumb: `${R}${id}-sm.webp`, width: 1600, height,
});

/**
 * The guided walkthrough: from the road to the upper floor. Final renders, unretouched; order tells the story.
 * No time-of-day labels: every stop is simply a view of the building.
 */
export const TOUR_STOPS: MediaItem[] = [
  render('facade-day', 'From the road', 'The building from the 24 m road: open ground level, three glass floors and a sandstone side wall.',
    'Indicative 3D render of the SHRINEVA building seen from the road, with three glass floors above an open ground level'),
  render('night-street', 'The road frontage', 'About 50 ft of frontage on a 24 m wide north-facing road.',
    'Indicative 3D render of the SHRINEVA building on its road frontage', 705),
  render('facade-night', 'The facade, lit', 'Lit floors and an illuminated crown, so the building reads clearly from the road.',
    'Indicative 3D render of the SHRINEVA facade with lit glass floors and an illuminated crown'),
  render('entrance', 'The entrance', 'A planted forecourt and an entrance sign at the foot of the building.',
    'Indicative 3D render of the SHRINEVA entrance with a planted forecourt, sign pylon and lit canopy'),
  render('east-walkway', 'East walkway', 'A covered, lit walkway along the east side of the ground level.',
    'Indicative 3D render of the covered east walkway with a timber-slat ceiling, stone cladding and a planted wall'),
  render('ground-level', 'The ground level', 'Open ground level with parking for 12+ cars and clear sight lines to the road.',
    'Indicative 3D render of the open ground level with columns, linear lighting and parking space'),
  render('lift-lobby', 'Lift and stair lobby', 'The lift and stair core that serves every floor, with a clearly marked first-floor entry.',
    'Indicative 3D render of the lift and stair lobby with a stone-clad staircase and the first-floor lift entrance'),
];

/**
 * Approximate camera positions for the walkthrough's "you are here" mini plan, in feet from the plot's north-west corner
 * (x east, y south; negative y is on the road). They show roughly where each view is taken, not a surveyed position.
 */
export const TOUR_PINS: Record<string, { x: number; y: number; chapter: string }> = {
  'facade-day': { x: 24.7, y: -14, chapter: 'Outside' },
  'night-street': { x: 33, y: -12, chapter: 'Outside' },
  'facade-night': { x: 17, y: -12, chapter: 'Outside' },
  'entrance': { x: 24.7, y: 9, chapter: 'Arrival' },
  'east-walkway': { x: 46, y: 20, chapter: 'Arrival' },
  'ground-level': { x: 20, y: 46, chapter: 'Inside' },
  'lift-lobby': { x: 35, y: 58, chapter: 'Inside' },
};

/** The finalised renders, for structured data and landing pages. */
export const RENDERS: MediaItem[] = TOUR_STOPS;

const plan = (id: string, group: string, title: string, caption: string, alt: string, width: number, height: number): MediaItem => ({
  id, group, title, caption, alt, src: `${P}${id}.webp`, thumb: `${P}${id}-sm.webp`, width, height,
});

export const PLAN_LEVELS = [
  {
    id: 'ground',
    tab: 'Ground level',
    title: 'Ground level',
    views: [
      { id: '2d', label: 'Floor plan', item: plan('plan-ground-sheet', 'Ground level', 'Ground level: floor plan',
        'Ground-level plan with the lift and stair core, entries and the open frontage. About 3,000 sq ft.',
        'Architect\'s floor plan of the SHRINEVA ground level with column grid, lift and stair core and entries', 1010, 1900) },
      { id: '3d', label: '3D view', item: plan('ground-3d', 'Ground level', 'Ground level: 3D view',
        'Open ground level with the lift and stair core, west and east entries and the open frontage.',
        '3D cutaway of the SHRINEVA ground level showing the lift and stair core, entries and open frontage', 1300, 814) },
    ],
  },
  {
    id: 'typical',
    tab: 'Floors 1–3',
    title: 'Floors 1, 2 and 3 (identical)',
    views: [
      { id: '2d', label: 'Floor plan', item: plan('plan-typical-sheet', 'Floors 1–3', 'Floors 1–3: floor plan',
        'One open floor plate, about 3,500 sq ft gross and about 3,100 sq ft carpet, repeated on Floors 1, 2 and 3.',
        'Architect\'s typical floor plan of SHRINEVA for Floors 1 to 3 showing the open floor plate, glass front, lift and stair core and fire exit', 1000, 1805) },
      { id: '3d', label: '3D view', item: plan('typical-3d', 'Floors 1–3', 'Floors 1–3: 3D view',
        'Open floor plate with a glass front on the road, lift and staircase.',
        '3D cutaway of a typical SHRINEVA upper floor showing the open floor plate, glass front, lift and staircase', 1300, 814) },
    ],
  },
];

export const FLOOR_PLANS_PDF = 'assets/shrineva-floor-plans.pdf';

/** The brochure (PDF, 4 pages, A4) and its website card. */
export const BROCHURE = {
  href: 'assets/shrineva-brochure.pdf',
  plansHref: FLOOR_PLANS_PDF,
  cover: 'assets/images/brochure-cover.webp',
  coverWidth: 909,
  coverHeight: 1287,
  size: '1.9 MB',
  pages: 4,
};

/** Real photographs, taken on site. They show construction progress, not the finished building. */
const photo = (id: string, title: string, caption: string, alt: string, width: number, height: number): MediaItem => ({
  id, group: 'On site', title, caption, alt, src: `${F}${id}.webp`, thumb: `${F}${id}-sm.webp`, width, height,
});

export const SITE_PHOTOS: MediaItem[] = [
  photo('front-day', 'The building today', 'The concrete frame of the upper floors, seen from the road.',
    'Photograph of the SHRINEVA building under construction, seen from the road: concrete frame of three upper floors', 1088, 1500),
  photo('ground-level', 'Ground level', 'The open ground level as built so far.',
    'Photograph of the open ground level of the SHRINEVA building under construction', 1600, 1200),
  photo('upper-floor-south', 'Upper floor, looking south', 'An upper floor as built so far, looking south.',
    'Photograph of an upper floor of the SHRINEVA building under construction, looking south', 1600, 1200),
  photo('upper-floor-north', 'Upper floor, looking north', 'The same floor, looking north.',
    'Photograph of an upper floor of the SHRINEVA building under construction looking north', 1200, 750),
  photo('apollo-side', 'View towards the upcoming Apollo Hospital site', 'The upcoming Apollo Hospital is under construction opposite the plot.',
    'Photograph from the SHRINEVA building towards the road and the construction site of the upcoming Apollo Hospital', 1200, 750),
  photo('nift-side', 'View towards NIFT', 'NIFT Varanasi is about 100 m away.',
    'Photograph from the SHRINEVA building towards the NIFT Varanasi side with a construction crane in view', 1331, 695),
  photo('frame-lights', 'The frame with lights', 'The frame of the building, seen from the road, with string lights on it.',
    'Photograph of the SHRINEVA building frame seen from the road with string lights on each floor', 900, 1200),
];

