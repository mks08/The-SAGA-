/**
 * SHRINEVA — building explorer (home page): the building render with a tappable outline for each level, and what the panel
 * beside it says about the level that is selected.
 *
 * Facts come from content.config.ts (LEVEL_INFO) and property.config.ts, so the explorer, the floor-plans page, the brochure,
 * the FAQ and llms.txt cannot disagree. Nothing here is a price, a rent or a promise about a specific floor.
 *
 * AVAILABILITY: floors 1 to 3 are all open for lease today (owner, 21 Nov 2026). When a floor is taken, change its entry in
 * LEVEL_STATUS below to 'reserved' or 'leased'; the badge, the tab, the llms.txt line and ChaiX follow.
 *
 * GEOMETRY: the outlines are traced on src/assets/images/explorer/building-740.webp, a plain crop of renders/facade-night.webp
 * made by tools/explorer/build-explorer-image.py (window 430, 25, 740 x 804). They are in that image's own pixel space
 * (EXPLORER_VIEW). Change the crop and they must be traced again. The render itself is never edited.
 */
import { LEVEL_INFO, Fact } from './content.config';
import { MARKETING_AREA } from './property.config';

export type LevelId = 'g' | 'f1' | 'f2' | 'f3';
export type LevelStatus = 'available' | 'reserved' | 'leased' | 'parking';

export const EXPLORER_IMAGE = {
  src740: 'assets/images/explorer/building-740.webp',
  src480: 'assets/images/explorer/building-480.webp',
  width: 740,
  height: 804,
  alt: 'Indicative 3D render of the SHRINEVA building from the road: open ground level, three glass floors and a lit crown sign',
};
export const EXPLORER_VIEW = { w: EXPLORER_IMAGE.width, h: EXPLORER_IMAGE.height };

/** Status of each level. The only line to change when a floor is leased. */
export const LEVEL_STATUS: Record<LevelId, LevelStatus> = { g: 'parking', f1: 'available', f2: 'available', f3: 'available' };

export const STATUS_LABEL: Record<LevelStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  leased: 'Leased',
  parking: 'Parking and arrival',
};

export interface ExplorerLevel {
  id: LevelId;
  /** Text on the marker and the tab (G, 1, 2, 3). */
  short: string;
  /** "Ground floor", "First floor"... as the owner names them. */
  title: string;
  /** What the level is used for. */
  use: 'Parking' | 'Commercial';
  status: LevelStatus;
  statusLabel: string;
  /** The large figure in the panel, and the line under it. */
  headline: string;
  headlineNote: string;
  summary: string;
  facts: Fact[];
  /** Which drawing set the plan comes from (PLAN_LEVELS ids). */
  planKey: 'ground' | 'typical';
  /** Where "plans in 2D and 3D" leads (floor-plans page fragment). */
  plansFragment: 'ground' | 'typical';
  /** Outline on the building image (points, EXPLORER_VIEW units). */
  outline: string;
  /** Slightly larger tap area (the crown sign counts as part of the top floor). Falls back to the outline. */
  hit?: string;
  /** Where the round marker sits, in EXPLORER_VIEW units (in the sky to the right of the building). */
  marker: { x: number; y: number };
  /** One line for assistants and the static text of the page. */
  text: string;
}

const gross = MARKETING_AREA.gross.replace('about', 'About');
const carpet = MARKETING_AREA.carpet;

const typicalFacts: Fact[] = LEVEL_INFO.typical.facts;

const floor = (id: 'f1' | 'f2' | 'f3', short: string, title: string, outline: string, hit: string | undefined, marker: { x: number; y: number }): ExplorerLevel => ({
  id, short, title, use: 'Commercial', status: LEVEL_STATUS[id], statusLabel: STATUS_LABEL[LEVEL_STATUS[id]],
  headline: gross, headlineNote: `gross, ${carpet} carpet`,
  summary: 'One open floor plate with a glass front on the road. Lease it whole, in part, or together with another floor.',
  facts: typicalFacts,
  planKey: 'typical', plansFragment: 'typical', outline, hit, marker,
  text: `${title}: commercial, ${gross.toLowerCase()} gross (${carpet} carpet), an open floor plate with a glass front on the road; ${STATUS_LABEL[LEVEL_STATUS[id]].toLowerCase()}.`,
});

/** Bottom to top, as the owner lists them. */
export const EXPLORER_LEVELS: ExplorerLevel[] = [
  {
    id: 'g', short: 'G', title: 'Ground floor', use: 'Parking', status: LEVEL_STATUS.g, statusLabel: STATUS_LABEL[LEVEL_STATUS.g],
    headline: 'Parking for 12+ cars', headlineNote: 'covered, open to the road',
    summary: 'The open ground level: parking for 12+ cars, entries on the west and east to the lift and stair lobby, and the road frontage.',
    facts: LEVEL_INFO.ground.facts,
    planKey: 'ground', plansFragment: 'ground',
    outline: '0,659 680,663 740,675 740,804 0,804',
    marker: { x: 692, y: 735 },
    text: 'Ground floor: parking for 12+ cars, covered and open to the road, with west and east entries to the lift and stair lobby.',
  },
  floor('f1', '1', 'First floor', '73,531 655,469 680,663 55,659', undefined, { x: 692, y: 566 }),
  floor('f2', '2', 'Second floor', '88,407 633,311 655,469 73,531', undefined, { x: 692, y: 392 }),
  floor('f3', '3', 'Third floor', '107,261 608,135 633,311 88,407', '135,254 140,185 585,92 608,135 633,311 88,407 107,261', { x: 692, y: 232 }),
];

/** Ways to lease, shown under the explorer heading (one source: content.config.ts LEASE_OPTIONS). */
export { LEASE_OPTIONS } from './content.config';

export const levelById = (id: LevelId): ExplorerLevel => EXPLORER_LEVELS.find((l) => l.id === id) as ExplorerLevel;
