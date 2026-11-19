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
