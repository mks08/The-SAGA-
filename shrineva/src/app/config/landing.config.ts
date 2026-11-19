/**
 * SHRINEVA — intent landing pages (Google Ads message match + long-tail search) and the `?intent=` hero variants.
 * Three pages, one template (LandingPageComponent). Facts only: nothing here claims footfall, rent, approvals or tenants.
 * The Apollo Hospital is always "upcoming / under construction"; restaurants carry the approvals caveat.
 */
import { Faq } from './faq.config';
import { MARKETING_AREA } from './property.config';

export type IntentKey = 'healthcare' | 'office' | 'retail';

export interface LandingCard { title: string; text: string; }

export interface LandingPage {
  key: IntentKey;
  path: string;
  navLabel: string;
  eyebrow: string;
  h1: string;
  sub: string;
  /** Question-form H2 with the 40–60 word answer directly beneath it. */
  answerQ: string;
  answer: string;
  cards: LandingCard[];
  categoriesHeading: string;
  categories: string[];
  /** Pre-selected "Business category" on the enquiry form. */
  formCategory: string;
  /** Page-specific questions; the shared core questions are added by faqForPath(). */
  faq: Faq[];
  approvalNote: string;
}

const APPROVALS = 'Use of any floor is subject to floor suitability and applicable statutory approvals.';

export const LANDING_PAGES: LandingPage[] = [
  {
    key: 'healthcare',
    path: 'healthcare-diagnostic-space',
    navLabel: 'Healthcare & Diagnostics',
    eyebrow: 'Healthcare & diagnostics',
    h1: 'Clinic, Pathology Lab & Diagnostic Space Opposite the Upcoming Apollo Hospital, Varanasi',
    sub: 'Open floors on 24 m Stadium Road, Bada Lalpur, with the Apollo Hospital opposite (upcoming, under construction) and NIFT Varanasi about 100 m away.',
    answerQ: 'Is SHRINEVA suitable for a clinic, pathology lab or diagnostic centre?',
    answer: `SHRINEVA offers open, column-free floors of ${MARKETING_AREA.carpet} carpet directly opposite the upcoming Apollo Hospital on 24-metre-wide Stadium Road, with an 8-person lift, a fire exit on every level and 12+ car parking. The hospital is under construction and not yet operational. Healthcare use is subject to floor suitability and statutory approvals.`,
    cards: [
      { title: 'Directly opposite an upcoming hospital', text: 'The Apollo Hospital across Stadium Road is under construction and not yet operational. SHRINEVA makes no footfall claim; the location is simply opposite the site.' },
      { title: 'Open, column-free floors', text: `Each upper floor is ${MARKETING_AREA.gross} gross (${MARKETING_AREA.carpet} carpet) in one open plate, which can be planned for consulting rooms, sample collection, reporting and waiting areas. Part-floor leasing is possible.` },
      { title: 'Lift and fire exit', text: 'One 8-person passenger lift serves all floors, and every level has a dedicated fire exit.' },
      { title: 'Parking and road access', text: 'Parking for 12+ cars at ground level and about 50 ft of frontage on a 24-metre-wide road.' },
    ],
    categoriesHeading: 'Healthcare operators who can enquire',
    categories: ['Pathology laboratories', 'Diagnostic centres', 'Specialist clinics', 'Other healthcare operators'],
    formCategory: 'Healthcare / Diagnostic',
    faq: [
      {
        q: 'Is the Apollo Hospital next to SHRINEVA already open?',
        a: 'No. The Apollo Hospital opposite SHRINEVA is upcoming and under construction, so it is not yet operational. SHRINEVA therefore makes no claim about patient footfall. Healthcare tenants should plan around the building’s own specifications and the approvals their operation needs.',
      },
      {
        q: 'Can SHRINEVA host a pathology lab or diagnostic centre?',
        a: `Open floors of ${MARKETING_AREA.carpet} carpet can be planned for lab or diagnostic layouts, with an 8-person lift and fire exits on every level. Suitability depends on the chosen floor and the applicable statutory approvals for your operation. Share your requirement and we will confirm feasibility at a site visit.`,
      },
      {
        q: 'Can I lease part of a floor for a clinic?',
        a: 'Yes. Floors can be leased whole or in part, so a clinic can take a section of one floor. Part-floor sizes and availability are confirmed when you enquire, and each use remains subject to floor suitability and applicable statutory approvals.',
      },
    ],
    approvalNote: APPROVALS,
  },
  {
    key: 'office',
    path: 'office-bank-coaching-space',
    navLabel: 'Office, Bank & Coaching',
    eyebrow: 'Offices, banks & coaching',
    h1: 'Bare-Shell Office, Bank Branch & Coaching Institute Space in Varanasi',
    sub: 'Three open-shell floors on 24 m Stadium Road, Bada Lalpur: lease a whole floor, part of a floor or several floors.',
    answerQ: 'What office, bank or coaching space does SHRINEVA offer in Varanasi?',
    answer: `SHRINEVA offers three open-shell floors of ${MARKETING_AREA.gross} gross (${MARKETING_AREA.carpet} carpet) each on 24-metre-wide Stadium Road, Bada Lalpur, with about 50 ft of frontage, an 8-person lift, 12+ car parking and a fire exit on every level. Lease a whole floor, part of a floor, or several floors.`,
    cards: [
      { title: 'Frontage and parking for branches', text: 'About 50 ft of frontage on a 24 m road and parking for 12+ cars suit customer-facing branches. Bank, ATM and NBFC formats depend on the operator’s own requirements and approvals.' },
      { title: 'Open plates for offices', text: 'Column-free floor plates let corporate, IT and consulting teams plan their own layouts. The floors are open shells, so the fit-out is yours.' },
      { title: 'Space for institutes and coworking', text: 'A whole floor can be divided into classrooms or workspaces. NIFT Varanasi is about 100 m away, and Deendayal Hastkala Sankul (Varanasi Trade Centre) is nearby.' },
      { title: 'Lift, fire exit and Vastu', text: 'An 8-person passenger lift, a fire exit on every level and a Vastu-compliant layout.' },
    ],
    categoriesHeading: 'Businesses who can enquire',
    categories: ['Banks, ATMs and NBFCs', 'Insurance branches', 'Corporate and regional offices', 'IT companies and consulting firms', 'Coaching, education and training institutes', 'Coworking operators'],
    formCategory: 'Bank / NBFC',
    faq: [
      {
        q: 'Are the SHRINEVA floors fully fitted offices?',
        a: 'No. The upper floors are open shells, so tenants fit them out to their own layout, branding and requirements while construction at the building is ongoing. Fit-out scope, timelines and handover terms are agreed with each tenant during leasing discussions, so please share your space plan early.',
      },
      {
        q: 'Can I lease more than one floor at SHRINEVA?',
        a: `Yes. Floors can be leased whole, in part, or as multiple floors. The three upper floors share the same open layout of ${MARKETING_AREA.gross} gross, which helps teams that expect to grow across floors. Availability and terms are confirmed when you enquire.`,
      },
      {
        q: 'Is there parking for staff and visitors?',
        a: 'SHRINEVA provides parking for 12+ cars at ground level, with about 50 ft of frontage on a 24-metre-wide road. Exact parking arrangements for each tenant, including how many spaces suit your staff and visitor numbers, are confirmed during leasing discussions and the site visit.',
      },
    ],
    approvalNote: APPROVALS,
  },
  {
    key: 'retail',
    path: 'retail-showroom-cafe-space',
    navLabel: 'Retail, Showroom & Café',
    eyebrow: 'Retail, showrooms & cafés',
    h1: 'Main-Road Showroom, Retail & Café Space Near NIFT Varanasi',
    sub: 'About 50 ft of frontage on 24 m Stadium Road, Bada Lalpur, about 100 m from the NIFT Varanasi campus and opposite the upcoming Apollo Hospital.',
    answerQ: 'Is SHRINEVA suitable for a showroom, retail store or café in Varanasi?',
    answer: `SHRINEVA has about 50 ft of frontage on the 24-metre-wide Stadium Road in Bada Lalpur, about 100 metres from the NIFT Varanasi campus and opposite the upcoming Apollo Hospital. Floors offer ${MARKETING_AREA.carpet} carpet, 12+ car parking and an 8-person lift. Restaurant and café use is subject to municipal, fire and FSSAI approvals.`,
    cards: [
      { title: 'Main-road visibility', text: 'About 50 ft of frontage on a 24-metre-wide road, with a glass front on each upper floor.' },
      { title: 'Near NIFT and the Trade Centre', text: 'The NIFT Varanasi campus is about 100 m away, and Deendayal Hastkala Sankul (Varanasi Trade Centre) is about 330 m along the road. Fashion, design and textile businesses can enquire.' },
      { title: 'Parking for customers', text: 'Parking for 12+ cars at ground level, and an 8-person passenger lift to the upper floors.' },
      { title: 'Food businesses', text: 'Restaurants, cafés, bakeries and QSR brands can be considered, subject to municipal, fire and FSSAI approvals and floor suitability.' },
    ],
    categoriesHeading: 'Businesses who can enquire',
    categories: ['Retail showrooms', 'Fashion designers and boutiques', 'Textile businesses', 'Restaurants, cafés and bakeries', 'QSR brands'],
    formCategory: 'Retail / Showroom',
    faq: [
      {
        q: 'Can a restaurant or café operate at SHRINEVA?',
        a: 'Restaurants, cafés, bakeries and QSR brands can be considered, subject to floor suitability and the municipal, fire and FSSAI approvals each operation needs. Share your format and we will discuss feasibility, services and the right floor at a site visit.',
      },
      {
        q: 'How far is SHRINEVA from NIFT Varanasi and the Trade Centre?',
        a: 'The NIFT Varanasi campus is about 100 metres from SHRINEVA, and Deendayal Hastkala Sankul (Varanasi Trade Centre) is about 330 metres along the same road. The Apollo Hospital opposite is upcoming and under construction, so it is not yet operational.',
      },
      {
        q: 'Is the building ready for a showroom fit-out?',
        a: 'Not yet. Construction is ongoing and the upper floors are offered as open shells, so a showroom fit-out is planned with the tenant. Renders are marked indicative, and site photos show the current stage. Timelines and fit-out scope are agreed during leasing, so please share your brand’s fit-out requirements early.',
      },
    ],
    approvalNote: APPROVALS,
  },
];

export const landingByPath = (path: string) => LANDING_PAGES.find((l) => l.path === path);

/** `/?intent=` hero variants. The canonical URL stays `/`. Unknown values fall back to the default hero. */
export interface HeroIntent { key: string; title: string; sub: string; }

export const HERO_DEFAULT: HeroIntent = {
  key: 'default',
  title: 'Commercial & office space for lease in Bada Lalpur, Varanasi',
  sub: `Opposite the upcoming Apollo Hospital, about 100 m from NIFT Varanasi, on 24 m Stadium Road. Whole floors of ${MARKETING_AREA.gross}.`,
};

export const HERO_INTENTS: Record<string, HeroIntent> = {
  healthcare: {
    key: 'healthcare',
    title: 'Clinic & diagnostic space opposite the upcoming Apollo Hospital, Varanasi',
    sub: `Open floors of ${MARKETING_AREA.carpet} carpet for clinics, pathology labs and diagnostic centres. The hospital is under construction and not yet operational.`,
  },
  office: {
    key: 'office',
    title: 'Office, bank & coaching space on Stadium Road, Varanasi',
    sub: `Open-shell floors of ${MARKETING_AREA.gross} with 50 ft frontage, an 8-person lift and 12+ car parking. Lease a whole floor or part of one.`,
  },
  retail: {
    key: 'retail',
    title: 'Showroom, retail & café space near NIFT Varanasi',
    sub: 'About 50 ft of frontage on a 24 m main road in Bada Lalpur, about 100 m from the NIFT Varanasi campus. Food use is subject to approvals.',
  },
  floor: {
    key: 'floor',
    title: 'Whole-floor commercial space for lease, Bada Lalpur, Varanasi',
    sub: `Three identical open floors of ${MARKETING_AREA.gross} (${MARKETING_AREA.carpet} carpet). Lease one floor, part of a floor or several floors.`,
  },
};

/** Choices on the qualified commercial enquiry form (CommercialLeadFormComponent). */
export const LEAD_CATEGORIES = [
  'Healthcare / Diagnostic',
  'Bank / NBFC',
  'Office / IT / Corporate',
  'Retail / Showroom',
  'Restaurant / Café',
  'Coaching / Education',
  'Coworking / Fitness / Wellness',
  'Other',
];
export const LEAD_AREAS = ['Up to 1,000 sq ft', '1,000 to 2,000 sq ft', '2,000 to 3,500 sq ft (about one floor)', 'More than one floor', 'Not sure yet'];
export const LEAD_FLOORS = ['No preference', 'Floor 1', 'Floor 2', 'Floor 3'];
export const LEAD_TIMELINES = ['Immediately', 'Within 3 months', '3 to 6 months', 'Just exploring'];
