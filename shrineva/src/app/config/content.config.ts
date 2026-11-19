/**
 * SHRINEVA — page copy that is shown on the site AND written into the static HTML (scripts/build-seo.js) and llms.txt.
 * Keeping it here means the page a visitor reads and the page a crawler reads can never disagree.
 * Figures come from property.config.ts and the printed brochure; nothing is invented.
 */
import { MARKETING_AREA, PLAN } from './property.config';

export interface Fact { label: string; value: string; }
export interface LevelInfo { id: 'ground' | 'typical'; title: string; value: string; label: string; sub: string; facts: Fact[]; }

const lift = `${PLAN.lift.capacity.replace(' passengers', '-person')} passenger lift, serves every level`;

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
      { label: 'Handover', value: 'Open shell, fitted out by the tenant' },
    ],
  },
};

export const LEASING_POINTS: string[] = [
  `${MARKETING_AREA.gross} gross per floor (${MARKETING_AREA.carpet} carpet), in one open floor plate`,
  'Full-floor lease or subdivision, subject to requirement',
  'Long-term leases accepted',
  'Commercial use across Floors 1, 2 and 3, subject to floor suitability and applicable statutory approvals',
  'Fit-out and handover condition agreed with each occupier',
  'Brand visibility on a 24 m road, signage and ground-level parking',
];

export const LEASING_STEPS: { t: string; d: string }[] = [
  { t: 'Tell us what you need', d: 'Area, use and timing. Use the form, call or WhatsApp.' },
  { t: 'See it', d: 'Floor options, the brochure and a visit to the plot.' },
  { t: 'Agree the terms', d: 'Commercial terms, fit-out and handover condition, in writing.' },
];

/**
 * Space finder (leasing page): two taps, a starting suggestion, and the answers handed to the enquiry form.
 * Facts only: no availability, no price and no subdivision plan is promised. Part-floor sizes are confirmed by the leasing team.
 * Area labels must stay equal to LEAD_AREAS in landing.config.ts (they are what the form's "Area needed" select offers).
 */
export interface FinderResult { area: string; title: string; text: string; }

export const SPACE_FINDER_AREAS: FinderResult[] = [
  { area: 'Up to 1,000 sq ft', title: 'A part of one floor',
    text: `Each upper floor is ${MARKETING_AREA.carpet} carpet in one open plate, so a smaller section can be planned within it. Part-floor sizes are confirmed when you enquire.` },
  { area: '1,000 to 2,000 sq ft', title: 'A larger part of one floor',
    text: `A good part of an upper floor (${MARKETING_AREA.carpet} carpet). The exact split is agreed with the leasing team.` },
  { area: '2,000 to 3,500 sq ft (about one floor)', title: 'About one whole floor',
    text: `One upper floor is ${MARKETING_AREA.gross} gross (${MARKETING_AREA.carpet} carpet), offered as an open shell that you plan and fit out.` },
  { area: 'More than one floor', title: 'Two or more floors',
    text: `Floors 1, 2 and 3 are identical, each ${MARKETING_AREA.gross} gross. Taking more than one floor can be discussed with the leasing team.` },
  { area: 'Not sure yet', title: 'Start with a visit',
    text: 'See the open floor plate on site and the leasing team will help you size it against your plan.' },
];

/** One line per business category (keys are LEAD_CATEGORIES values). */
export const SPACE_FINDER_NOTES: Record<string, string> = {
  'Healthcare / Diagnostic': 'Suitability for clinic, lab or diagnostic layouts depends on the floor and the statutory approvals you need.',
  'Bank / NBFC': 'About 50 ft of frontage on a 24 m road and an 8-person lift. Bank, ATM and NBFC formats depend on your own requirements.',
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
 * Dated construction progress (walkthrough page). Empty until the owner supplies dated milestones or photos: the section
 * is not shown while this list is empty, so no undated or invented progress is ever displayed.
 * Add newest first, e.g. { date: '2026-12-05', title: 'Third-floor slab cast', text: 'One sentence of fact.', photo: 'assets/images/progress/2026-12-05.webp', alt: '...', width: 1600, height: 1200 }
 */
export interface ProgressUpdate { date: string; title: string; text: string; photo?: string; alt?: string; width?: number; height?: number; }
export const PROGRESS_UPDATES: ProgressUpdate[] = [];
