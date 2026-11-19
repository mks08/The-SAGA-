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

/** Hero: the finalised building by day and by night (960 / 1920 px wide, same framing). */
export const HERO_VIEWS = [
  {
    id: 'day', label: 'Day',
    src960: `${H}hero-day-960.webp`, src1920: `${H}hero-day-1920.webp`,
    alt: 'Indicative 3D render of the SHRINEVA commercial building by day: open ground level and three floors with glass fronts and a sandstone-clad side, Bada Lalpur, Varanasi',
  },
  {
    id: 'night', label: 'Night',
    src960: `${H}hero-night-960.webp`, src1920: `${H}hero-night-1920.webp`,
    alt: 'Indicative 3D render of the SHRINEVA commercial building at night: lit floors, glass fronts and illuminated crown, Bada Lalpur, Varanasi',
  },
] as const;
export const HERO_W = 1920;
export const HERO_H = 995;

const render = (id: string, title: string, caption: string, alt: string, height = 829): MediaItem => ({
  id, group: 'Walkthrough', title, caption, alt,
  src: `${R}${id}.webp`, thumb: `${R}${id}-sm.webp`, width: 1600, height,
});

/**
 * The guided walkthrough: from the road to the upper floor. Final renders, unretouched; order tells the story.
 * `day` marks the daylight view so the tour can show a small Day / Night chip.
 */
export const TOUR_STOPS: MediaItem[] = [
  render('facade-day', 'From the road, by day', 'The building from Stadium Road: open ground level, three glass floors and a sandstone side wall.',
    'Indicative 3D render of the SHRINEVA building seen from the road by day, with three glass floors above an open ground level'),
  render('facade-night', 'From the road, at night', 'Lit floors and a lit crown, so the building reads clearly after dark.',
    'Indicative 3D render of the SHRINEVA building at night with lit glass floors and an illuminated crown'),
  render('entrance', 'The entrance', 'A planted forecourt and an entrance sign at the foot of the building.',
    'Indicative 3D render of the SHRINEVA entrance with a planted forecourt, sign pylon and lit canopy'),
  render('east-walkway', 'East walkway', 'A covered, lit walkway along the east side of the ground level.',
    'Indicative 3D render of the covered east walkway with a timber-slat ceiling, stone cladding and a planted wall'),
  render('ground-level', 'The ground level', 'Open ground level with parking for 12+ cars and clear sight lines to the road.',
    'Indicative 3D render of the open ground level with columns, linear lighting and parking space'),
  render('lift-lobby', 'Lift and stair lobby', 'The lift and stair core that serves every floor, with a clearly marked first-floor entry.',
    'Indicative 3D render of the lift and stair lobby with a stone-clad staircase and the first-floor lift entrance'),
  render('night-street', 'The road at night', 'Frontage of about 50 ft on a 24 m wide road.',
    'Indicative 3D render of the SHRINEVA building on its road at night', 705),
];

/** The finalised renders, for structured data and landing pages. */
export const RENDERS: MediaItem[] = TOUR_STOPS;

const plan = (id: string, group: string, title: string, caption: string, alt: string, width: number, height: number): MediaItem => ({
  id, group, title, caption, alt, src: `${P}${id}.webp`, thumb: `${P}${id}-sm.webp`, width, height,
  // The drawings are tall and detailed: the lightbox can open them at full width.
  ...(height > 2000 ? { zoomSrc: `${P}${id}.webp`, zoomWidth: width } : {}),
});

export const PLAN_LEVELS = [
  {
    id: 'ground',
    tab: 'Ground level',
    title: 'Ground level',
    views: [
      { id: '2d', label: 'Floor plan', item: plan('plan-ground', 'Ground level', 'Ground level: floor plan',
        'Ground-level plan with the lift and stair core, entries and the open frontage. About 3,000 sq ft.',
        'Architect\'s floor plan of the SHRINEVA ground level with column grid, lift and stair core and entries', 1819, 2451) },
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
      { id: '2d', label: 'Floor plan', item: plan('plan-typical', 'Floors 1–3', 'Floors 1–3: floor plan',
        'One open floor plate, about 3,500 sq ft gross and about 3,100 sq ft carpet, repeated on Floors 1, 2 and 3.',
        'Architect\'s typical floor plan of SHRINEVA for Floors 1 to 3 showing the open floor plate, lift and stair core and area statement', 1819, 2451) },
      { id: '3d', label: '3D view', item: plan('typical-3d', 'Floors 1–3', 'Floors 1–3: 3D view',
        'Open floor plate with a glass front on the road, lift and staircase.',
        '3D cutaway of a typical SHRINEVA upper floor showing the open floor plate, glass front, lift and staircase', 1300, 814) },
    ],
  },
];

export const FLOOR_PLANS_PDF = 'assets/shrineva-floor-plans.pdf';

/** The brochure (PDF, 6 pages, A4) and its website card. */
export const BROCHURE = {
  href: 'assets/shrineva-brochure.pdf',
  plansHref: FLOOR_PLANS_PDF,
  cover: 'assets/images/brochure-cover.webp',
  coverWidth: 910,
  coverHeight: 1226,
  size: '9 MB',
  pages: 6,
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
  photo('apollo-side', 'View towards the Apollo Hospital site', 'The upcoming Apollo Hospital is under construction opposite the plot.',
    'Photograph from the SHRINEVA building towards the road and the construction site of the upcoming Apollo Hospital', 1200, 750),
  photo('nift-side', 'View towards NIFT', 'NIFT Varanasi is about 100 m away.',
    'Photograph from the SHRINEVA building towards the NIFT Varanasi side with a construction crane in view', 1331, 695),
  photo('front-night', 'The building at night', 'The frame lit at night while construction continues.',
    'Night photograph of the SHRINEVA building under construction with string lights on the frame', 900, 1200),
];

/** The illustrated 3D location map (not to scale): Ring Road, Trade Centre, NIFT, Apollo and the plot. */
export const LOCATION_MAP: MediaItem = {
  id: 'location-3d', group: 'Location', title: 'Location map (3D, not to scale)',
  caption: 'Illustrative 3D map: Ring Road, Trade Centre, NIFT, the Apollo hospital site (upcoming) and SHRINEVA on the 24 m road. Not to scale.',
  alt: 'Illustrative 3D map of Bada Lalpur showing the Varanasi Ring Road, the Varanasi Trade Centre, NIFT, the upcoming Apollo hospital site and SHRINEVA on the 24 m wide road',
  src: 'assets/images/map/location-3d.webp', thumb: 'assets/images/map/location-3d-sm.webp', width: 1800, height: 947,
};
