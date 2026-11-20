/**
 * SHRINEVA — page copy that is shown on the site AND written into the static HTML (scripts/build-seo.js) and llms.txt.
 * Keeping it here means the page a visitor reads and the page a crawler reads can never disagree.
 * Figures come from property.config.ts and the printed brochure; nothing is invented.
 */
import { MARKETING_AREA, PLAN } from './property.config';

export interface Fact { label: string; value: string; }
export interface LevelInfo { id: 'ground' | 'typical'; title: string; value: string; label: string; sub: string; facts: Fact[]; }

const lift = `${PLAN.lift.adjective} lift, serves every level`;

/** Areas and facts per drawing set (floor plans page and home teaser). */
export const LEVEL_INFO: Record<'ground' | 'typical', LevelInfo> = {
  ground: {
    id: 'ground', title: 'Ground level',
    value: 'About 3,000 sq ft', label: 'Open to the road, parking for 12+ cars', sub: 'About 279 sq m',
    facts: [
      { label: 'Floor to floor', value: 'About 9.5 ft' },
      { label: 'Frontage', value: `${PLAN.plot.frontage} on a ${PLAN.plot.roadWidthM} m road` },
      { label: 'Parking', value: 'For 12+ cars' },
      { label: 'Entries', value: 'West and east, to the lift and stair lobby' },
      { label: 'Lift', value: lift },
      { label: 'Fire exit', value: 'On every level' },
    ],
  },
  typical: {
    id: 'typical', title: 'Floors 1, 2 and 3 (identical)',
    value: MARKETING_AREA.gross.replace('about', 'About'), label: 'Gross, on each of Floors 1, 2 and 3', sub: `${MARKETING_AREA.carpet.replace('about', 'About')} carpet`,
    facts: [
      { label: 'Floors', value: '1, 2 and 3 are identical' },
      { label: 'Floor to floor', value: 'About 11.5 ft' },
      { label: 'Front', value: 'Glass front facing the road' },
      { label: 'Lift', value: lift },
      { label: 'Fire exit', value: 'On every level' },
      { label: 'Condition', value: 'Open shell, fitted out by the tenant' },
    ],
  },
};

export const LEASING_POINTS: string[] = [
  `${MARKETING_AREA.gross} gross per floor (${MARKETING_AREA.carpet} carpet), in one open floor plate`,
  'Full-floor lease or subdivision, subject to requirement',
  'Long-term leases accepted',
  'Commercial use across Floors 1, 2 and 3, subject to floor suitability and applicable statutory approvals',
  'Fit-out and floor condition agreed with each occupier',
  'Brand visibility on a 24 m road, signage and ground-level parking',
];

export const LEASING_STEPS: { t: string; d: string }[] = [
  { t: 'Tell us what you need', d: 'Area, use and timing. Use the form, call or WhatsApp.' },
  { t: 'See it', d: 'Floor options, the brochure and a visit to the plot.' },
  { t: 'Agree the terms', d: 'Commercial terms, fit-out and floor condition, in writing.' },
];

/**
 * Space finder (leasing page): two taps, a starting suggestion, and the answers handed to the enquiry form.
 * Facts only: no availability, no price and no subdivision plan is promised. Part-floor sizes are confirmed by the leasing team.
 * Area labels must stay equal to LEAD_AREAS in landing.config.ts (they are what the form's "Area needed" select offers).
 */
/** Quick size choices for the space finder (carpet sq ft). `floors` > 1 means more than one floor. */
export interface FinderSize { label: string; carpet?: number; floors?: number; }
export const FINDER_SIZES: FinderSize[] = [
  { label: '500', carpet: 500 },
  { label: '1,000', carpet: 1000 },
  { label: '1,500', carpet: 1500 },
  { label: '2,000', carpet: 2000 },
  { label: 'Whole floor', carpet: MARKETING_AREA.carpetNum },
  { label: '2 floors', floors: 2 },
  { label: '3 floors', floors: 3 },
];

/** Maps a size to the form's "Area needed" options (equal to LEAD_AREAS in landing.config.ts). */
export function areaLabel(carpet: number, floors = 1): string {
  if (floors > 1) return 'More than one floor';
  if (carpet <= 1000) return 'Up to 1,000 sq ft';
  if (carpet <= 2000) return '1,000 to 2,000 sq ft';
  return '2,000 to 3,500 sq ft (about one floor)';
}

/** One line per business category (keys are LEAD_CATEGORIES values). */
export const SPACE_FINDER_NOTES: Record<string, string> = {
  'Healthcare / Diagnostic': 'Suitability for clinic, lab or diagnostic layouts depends on the floor and the statutory approvals you need.',
  'Bank / NBFC': 'About 50 ft of frontage on a 24 m road and a 10-passenger lift. Bank, ATM and NBFC formats depend on your own requirements.',
  'Office / IT / Corporate': 'Open floor plates with flexible tenant layouts, so you plan the office your way.',
  'Retail / Showroom': 'About 50 ft of frontage on a 24 m road, with parking for 12+ cars at ground level.',
  'Restaurant / Café': 'Food use needs municipal, fire and FSSAI approvals and floor suitability.',
  'Coaching / Education': 'Open floor plates can be planned as classrooms or batches; use is subject to approvals.',
  'Coworking / Fitness / Wellness': 'Open floor plates with flexible tenant layouts; use is subject to floor suitability and approvals.',
  'Other': 'Tell us the use and the leasing team will confirm suitability and approvals.',
};

/** Chip labels for the first question, mapped to the form's business categories. */
export const SPACE_FINDER_USES: { label: string; category: string }[] = [
  { label: 'Clinic, lab or diagnostics', category: 'Healthcare / Diagnostic' },
  { label: 'Bank or NBFC branch', category: 'Bank / NBFC' },
  { label: 'Office, IT or corporate', category: 'Office / IT / Corporate' },
  { label: 'Showroom or shop', category: 'Retail / Showroom' },
  { label: 'Restaurant or café', category: 'Restaurant / Café' },
  { label: 'Coaching or education', category: 'Coaching / Education' },
  { label: 'Fitness or coworking', category: 'Coworking / Fitness / Wellness' },
  { label: 'Something else', category: 'Other' },
];

/**
 * Project status and timeline (home, leasing and walkthrough pages, the brochure, FAQ, structured data and llms.txt).
 * One source, so a visitor, a search crawler and an AI assistant all read the same position.
 *
 * Wording rules (owner, 20 Nov 2026):
 *  - "Project completion", never "handover": tenants may ask for changes to their floor, and the works then continue to suit.
 *  - The month is a TARGET and always travels with "subject to approvals" (scripts/build-seo.js fails the build otherwise).
 *  - No stage has its own date and there is no fit-out stage: floors are offered as open shells.
 * To update: change a stage's `state`, `updated` and `updatedISO` (the sitemap and structured data use the ISO date).
 */
export type StageState = 'done' | 'active' | 'next' | 'target';
export interface ProjectStage { id: string; title: string; state: StageState; label: string; text: string; }
export const PROJECT_STATUS = {
  updated: 'November 2026',
  updatedISO: '2026-11-20',
  photosTaken: 'November 2026',
  completion: { label: 'Targeted project completion', value: 'March 2027', note: 'Subject to approvals' },
  lead: 'The concrete structure is complete. Brickwork, façade, lift and services are in progress, and project completion is targeted for March 2027, subject to approvals.',
  stages: [
    { id: 'structure', title: 'Concrete structure', state: 'done', label: 'Complete', text: 'Ground level and three upper floors.' },
    { id: 'works', title: 'Brickwork, façade, lift and services', state: 'active', label: 'In progress', text: 'The current stage of work on site.' },
    { id: 'final', title: 'Final works', state: 'next', label: 'Upcoming', text: 'Ground and boundary works, flooring and other finishing.' },
    { id: 'completion', title: 'Project completion', state: 'target', label: 'Target: March 2027', text: 'Subject to approvals.' },
  ] as ProjectStage[],
  changes: {
    title: 'Want changes to your floor?',
    text: 'Tell the leasing team early. Changes a tenant asks for are agreed during leasing and the works continue to suit, so completion for that floor follows the agreed scope.',
  },
  note: 'Status as of November 2026. Dates are targets and may change. The photographs show the building as it stands; renders elsewhere on this site are indicative.',
};

/**
 * Dated construction progress (walkthrough page). Empty until the owner supplies dated milestones or photos: the section
 * is not shown while this list is empty, so no undated or invented progress is ever displayed.
 * Add newest first, e.g. { date: '2026-12-05', title: 'Third-floor slab cast', text: 'One sentence of fact.', photo: 'assets/images/progress/2026-12-05.webp', alt: '...', width: 1600, height: 1200 }
 */
export interface ProgressUpdate { date: string; title: string; text: string; photo?: string; alt?: string; width?: number; height?: number; }
export const PROGRESS_UPDATES: ProgressUpdate[] = [];

/**
 * The home page "at a glance" bar. `value` is the number that counts up; `prefix` and `suffix` wrap it. Everything here is
 * a verified fact from property.config.ts or the brochure; nothing is a claim about demand, price or availability.
 */
export interface KeyFact { value?: number; text?: string; prefix?: string; suffix?: string; label: string; sub: string; icon: 'frontage' | 'road' | 'parking' | 'lift' | 'floor' | 'fire'; }
export const KEY_FACTS: KeyFact[] = [
  { value: PLAN.plot.frontageFt, prefix: '', suffix: ' ft', label: 'Road frontage', sub: 'About, on the road side', icon: 'frontage' },
  { value: PLAN.plot.roadWidthM, suffix: ' m', label: 'Wide road', sub: 'North-facing, 80 ft', icon: 'road' },
  { value: 12, suffix: '+', label: 'Covered parking', sub: 'Cars, at ground level', icon: 'parking' },
  { value: 10, suffix: '', label: 'Passenger lift', sub: 'Serves every level', icon: 'lift' },
  { value: MARKETING_AREA.grossNum, prefix: '≈ ', suffix: '', label: 'Sq ft per floor', sub: 'Gross, Floors 1 to 3', icon: 'floor' },
  { text: 'Every level', label: 'Fire exit', sub: 'Marked on each plan', icon: 'fire' },
];

/**
 * "What is available": the building as a stack, top floor first. Floors 1 to 3 are identical (architect's sheet SH-02).
 * Availability of individual floors is confirmed by the leasing team; the stack only states what each level is.
 */
export interface StackLevel { id: string; label: string; area: string; detail: string; tag: string; kind: 'floor' | 'ground'; }
export const STACK: StackLevel[] = [
  { id: 'f3', label: 'Floor 3', area: MARKETING_AREA.gross.replace('about', 'About'), detail: 'Open floor plate, glass front on the road', tag: 'For lease', kind: 'floor' },
  { id: 'f2', label: 'Floor 2', area: MARKETING_AREA.gross.replace('about', 'About'), detail: 'Open floor plate, glass front on the road', tag: 'For lease', kind: 'floor' },
  { id: 'f1', label: 'Floor 1', area: MARKETING_AREA.gross.replace('about', 'About'), detail: 'Open floor plate, glass front on the road', tag: 'For lease', kind: 'floor' },
  { id: 'g', label: 'Ground', area: 'About 3,000 sq ft', detail: 'Covered parking for 12+ cars, entries and lift lobby', tag: 'Parking and entry', kind: 'ground' },
];

export const LEASE_OPTIONS: string[] = ['A whole floor', 'Part of a floor', 'More than one floor'];

/**
 * Safety, access and building facts. Only facts the owner or the architect's sheets state are listed as facts.
 * Anything not yet confirmed (fire-fighting systems and clearances, power backup, water, connectivity) is NOT claimed:
 * it appears under ASK_ITEMS as a prompt to ask the leasing team. Move an item into SPEC_GROUPS once the owner confirms it.
 */
export interface SpecGroup { title: string; icon: 'fire' | 'lift' | 'building'; items: { label: string; value: string }[]; }
export const SPEC_GROUPS: SpecGroup[] = [
  {
    title: 'Fire safety and escape', icon: 'fire',
    items: [
      { label: 'Fire exit', value: 'On every level, marked on the plans' },
      { label: 'Staircase', value: `${PLAN.stilt.staircase.split(' · ')[0].replace(' flights', '')} wide flights from the ground level to Floor 3` },
      { label: 'Open sides', value: 'Open setbacks on all four sides of the building' },
      { label: 'Front setback', value: `${PLAN.setbacks[0].value} between the building and the road side` },
    ],
  },
  {
    title: 'Access and circulation', icon: 'lift',
    items: [
      { label: 'Passenger lift', value: `One ${PLAN.lift.adjective} lift, serving every level` },
      { label: 'Lift and stair lobby', value: 'One core on the east side, reached by west and east walkways' },
      { label: 'Parking', value: 'Covered, at ground level, for 12+ cars' },
      { label: 'Frontage', value: `About ${PLAN.plot.frontageFt} ft on a ${PLAN.plot.roadWidthM} m wide north-facing road` },
    ],
  },
  {
    title: 'The building', icon: 'building',
    items: [
      { label: 'Height', value: 'Ground level plus three floors' },
      { label: 'Floor to floor', value: 'About 11.5 ft on Floors 1 to 3, about 9.5 ft at ground level' },
      { label: 'Floor plate', value: 'Open-plan commercial floor plates with flexible tenant layouts' },
      { label: 'Front', value: 'Glass front facing the road' },
      { label: 'Orientation', value: 'Vastu compliant' },
      { label: 'Approval', value: 'VDA approved' },
    ],
  },
];

/** Not yet confirmed: shown as questions to put to the leasing team, never as features. */
export const ASK_ITEMS: string[] = ['Fire-fighting systems and clearances', 'Power and backup supply', 'Water supply', 'Fibre and connectivity', 'Floor condition and fit-out'];
