/**
 * SHRINEVA — visible FAQ content. The SAME items feed the on-page FAQ blocks, the FAQPage JSON-LD, the static HTML written
 * by scripts/build-seo.js and llms.txt, so the markup can never drift from what visitors read.
 * Answers are written to be quoted on their own: 40–60 words, answer first, facts only (property.config.ts, owner's brief).
 * Rules: the Apollo Hospital is always "upcoming / under construction"; no approvals, rents or footfall figures are claimed.
 */
import { PROPERTY, MARKETING_AREA } from './property.config';

import { HI } from './hindi.config';

export interface Faq { q: string; a: string; }

const p1 = PROPERTY.contact.phoneDisplay;
const p2 = PROPERTY.contact.phone2Display;
const EMAIL = PROPERTY.contact.publicEmail;

/** Answer-first block at the top of the home page body (visible, and repeated in the static HTML and llms.txt). 40–60 words. */
export const HOME_ANSWER: Faq = {
  q: 'Where can I lease commercial space in Bada Lalpur, Varanasi?',
  a: `SHRINEVA is a commercial building on a 24 m wide north-facing road in Bada Lalpur, Varanasi, opposite the upcoming Apollo Hospital and about 100 metres from NIFT Varanasi. Three open floors of ${MARKETING_AREA.gross} gross can be leased whole or in part, with a 10-passenger lift, parking for 12+ cars and about 50 ft of frontage.`,
};

/** The five tenant questions asked most often, plus the two transparency answers. */
export const CORE_FAQ: Faq[] = [
  {
    q: 'Where is SHRINEVA located in Varanasi and how wide is the access road?',
    a: 'SHRINEVA is at Plot No. D-15, Lalpur Housing Scheme, Bada Lalpur, Varanasi 221003, directly opposite the upcoming Apollo Hospital and about 100 metres from the NIFT Varanasi campus. It has about 50 ft of frontage on a 24-metre-wide north-facing road, with quick connectivity to the Varanasi Ring Road.',
  },
  {
    q: 'What is the carpet area and gross area per floor at SHRINEVA?',
    a: `Each of the three upper floors has ${MARKETING_AREA.gross} gross area and ${MARKETING_AREA.carpet} carpet area as open-plan commercial floor plates with flexible tenant layouts. Floors can be leased whole or in part. Areas are approximate and subject to final measurement, and the floors are offered as open shells while construction is ongoing.`,
  },
  {
    q: 'How much car parking and lift capacity does SHRINEVA provide?',
    a: 'SHRINEVA offers parking for 12+ cars at ground level and one 10-passenger lift serving every floor. Each level has a dedicated fire exit, and the layout is Vastu-compliant. Exact parking and floor arrangements for a tenant are confirmed during the site visit and leasing discussion.',
  },
  {
    q: 'Which businesses can lease space at SHRINEVA?',
    a: 'SHRINEVA suits pathology labs, diagnostic centres and clinics; banks, NBFCs and insurance branches; corporate and IT offices; retail showrooms and boutiques; restaurants and cafés; and coaching institutes, coworking, fitness and wellness centres. Every use is subject to floor suitability and applicable statutory approvals, including municipal, fire and FSSAI approvals for food businesses.',
  },
  {
    q: 'How do I book a site visit or contact the SHRINEVA leasing office?',
    a: `Call ${p1} or ${p2}, message the leasing team on WhatsApp at ${p1}, email ${EMAIL}, or fill in the enquiry form on this page to request a site visit. The leasing team confirms a time with you.`,
  },
];

export const STATUS_FAQ: Faq[] = [
  {
    q: 'When will the SHRINEVA building be complete and ready for tenants?',
    a: 'Project completion at SHRINEVA is targeted for March 2027, subject to approvals. The concrete structure is complete, and brickwork, façade, lift and services are in progress, followed by final works on the ground, boundary and flooring. Floors are offered as open shells. Dates are targets and may change.',
  },
  {
    q: 'Is the Apollo Hospital opposite SHRINEVA already operational?',
    a: 'No. The Apollo Hospital opposite SHRINEVA is upcoming and under construction, so it is not yet operational. The NIFT Varanasi campus is about 100 metres away. SHRINEVA does not claim any footfall figures from either project; please judge the building on its own specifications.',
  },
];

/** FAQ blocks per route path. Routes not listed show none (and carry no FAQPage markup). */
export function faqForPath(path: string, extra: Faq[] = []): Faq[] {
  switch (path) {
    case '':
    case 'leasing':
      return [...CORE_FAQ, STATUS_FAQ[0]];
    case 'location-contact':
      return [...CORE_FAQ, ...STATUS_FAQ];
    case 'hi':
      return HI.faq;
    case 'healthcare-diagnostic-space':
    case 'office-bank-coaching-space':
    case 'retail-showroom-cafe-space':
      return [...extra, ...CORE_FAQ.slice(0, 2), CORE_FAQ[4], STATUS_FAQ[1]];
    default:
      return [];
  }
}
