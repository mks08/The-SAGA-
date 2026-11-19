/**
 * SHRINEVA — visible FAQ content. The SAME items feed the on-page FAQ blocks, the FAQPage JSON-LD, the static HTML written
 * by scripts/build-seo.js and llms.txt, so the markup can never drift from what visitors read.
 * Answers are written to be quoted on their own: 40–60 words, answer first, facts only (property.config.ts, owner's brief).
 * Rules: the Apollo Hospital is always "upcoming / under construction"; no approvals, rents or footfall figures are claimed.
 */
import { PROPERTY, MARKETING_AREA } from './property.config';

export interface Faq { q: string; a: string; }

const p1 = PROPERTY.contact.phoneDisplay;
const p2 = PROPERTY.contact.phone2Display;

/** Answer-first block at the top of the home page body (visible, and repeated in the static HTML and llms.txt). 40–60 words. */
export const HOME_ANSWER: Faq = {
  q: 'Where can I lease commercial space in Bada Lalpur, Varanasi?',
  a: `SHRINEVA is a commercial building on Stadium Road, Bada Lalpur, Varanasi, opposite the upcoming Apollo Hospital and about 100 metres from NIFT Varanasi. Three open floors of ${MARKETING_AREA.gross} gross can be leased whole or in part, with an 8-person lift, parking for 12+ cars and about 50 ft of frontage on a 24-metre road.`,
};

/** The five tenant questions asked most often, plus the two transparency answers. */
export const CORE_FAQ: Faq[] = [
  {
    q: 'Where is SHRINEVA located in Varanasi and how wide is the access road?',
    a: 'SHRINEVA is at Plot No. D-15, Lalpur Housing Scheme, Stadium Road, Bada Lalpur, Varanasi 221003, directly opposite the upcoming Apollo Hospital and about 100 metres from the NIFT Varanasi campus. It has about 50 ft of frontage on the 24-metre-wide Stadium Road, with quick connectivity to the Varanasi Ring Road.',
  },
  {
    q: 'What is the carpet area and gross area per floor at SHRINEVA?',
    a: `Each of the three upper floors has ${MARKETING_AREA.gross} gross area and ${MARKETING_AREA.carpet} carpet area as one open, column-free floor plate. Floors can be leased whole or in part. Areas are approximate and subject to final measurement, and the floors are offered as open shells while construction is ongoing.`,
  },
  {
    q: 'How much car parking and lift capacity does SHRINEVA provide?',
    a: 'SHRINEVA offers parking for 12+ cars at ground level and one 8-person passenger lift serving every floor. Each level has a dedicated fire exit, and the layout is Vastu-compliant. Exact parking and floor arrangements for a tenant are confirmed during the site visit and leasing discussion.',
  },
  {
    q: 'Which businesses can lease space at SHRINEVA?',
    a: 'SHRINEVA suits pathology labs, diagnostic centres and clinics; banks, NBFCs and insurance branches; corporate and IT offices; retail showrooms and boutiques; restaurants and cafés; and coaching institutes, coworking, fitness and wellness centres. Every use is subject to floor suitability and applicable statutory approvals, including municipal, fire and FSSAI approvals for food businesses.',
  },
  {
    q: 'How do I book a site visit or contact the SHRINEVA leasing office?',
    a: `Call ${p1} or ${p2}, message the leasing team on WhatsApp at ${p1}, or fill in the enquiry form on this page. Site visits and leasing enquiries are handled Monday to Sunday, 9:30 AM to 7:30 PM IST.`,
  },
];

export const STATUS_FAQ: Faq[] = [
  {
    q: 'Is the SHRINEVA building complete and ready to move in?',
    a: 'No. Construction at SHRINEVA is ongoing, and the upper floors are offered as open shells that tenants fit out themselves. Images labelled as renders are indicative, while site photos show the current progress. Handover details are agreed with each tenant during leasing.',
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
      return CORE_FAQ;
    case 'location-contact':
      return [...CORE_FAQ, ...STATUS_FAQ];
    case 'healthcare-diagnostic-space':
    case 'office-bank-coaching-space':
    case 'retail-showroom-cafe-space':
      return [...extra, ...CORE_FAQ.slice(0, 2), CORE_FAQ[4], STATUS_FAQ[1]];
    default:
      return [];
  }
}
