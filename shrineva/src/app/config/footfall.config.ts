/**
 * SHRINEVA — nearby projects and footfall drivers.
 * Every row has a source link and an "as of" date so the page never presents a plan or a forecast as a fact.
 * Update `FOOTFALL_AS_OF` whenever rows change.
 *
 * Rules for editing:
 *  - Do not add a visitor, footfall or growth number for this building or road. None is sourced.
 *  - Do not add an opening date unless the owning institution has published it.
 *  - City-level items stay labelled "indirect".
 *  - Distances for the three anchors come from the owner's location sheet (property.config.ts → locationAnchors).
 */

export const FOOTFALL_AS_OF = '14 October 2026';

export interface NearbyProject {
  id: string;
  name: string;
  /** Short name for chips and the radar. */
  short: string;
  kind: 'Healthcare' | 'Education' | 'Trade & events';
  distance: string;
  /** Metres from the plot, for the schematic radar only. */
  distanceM: number;
  /** Compass bearing from the plot in degrees (0 = north), from the owner's location sheet. */
  bearing: number;
  /** One state word shown as a pill: what is true today. */
  state: 'Operating' | 'Under construction' | 'Plan approved';
  /** One line for the radar card and the home page. */
  line: string;
  status: string;
  facts: string[];
  brings: string;
  caveat?: string;
  source: { label: string; url: string };
}

export interface CityDriver {
  id: string;
  name: string;
  facts: string;
  whyIndirect: string;
  source: { label: string; url: string };
}

export const NEARBY_PROJECTS: NearbyProject[] = [
  {
    id: 'apollo',
    name: 'Apollo Medics hospital',
    short: 'Apollo hospital',
    kind: 'Healthcare',
    distance: 'About 60–70 m',
    distanceM: 65,
    bearing: 45,
    state: 'Plan approved',
    line: '400-bed hospital: patients, families and staff, every day.',
    status: 'VDA building plan approved (reported September 2025). No opening date announced.',
    facts: [
      '400 beds, multi-specialty',
      'Double basement, ground and 7 floors; 365 car parking spaces',
      'Estimated investment about ₹189 crore',
    ],
    brings: 'Patients, attendants, doctors and hospital staff every day of the week.',
    caveat: 'The published report names Varanasi, not Bada Lalpur; the position opposite the plot is from the owner\'s location sheet.',
    source: { label: 'Digital Health News', url: 'https://www.digitalhealthnews.com/vda-approves-400-bed-apollo-medics-hospital-in-varanasi' },
  },
  {
    id: 'nift',
    name: 'NIFT Varanasi',
    short: 'NIFT',
    kind: 'Education',
    distance: 'About 60–70 m',
    distanceM: 65,
    bearing: 315,
    state: 'Under construction',
    line: 'Design campus on 7.5 acres: classes run today, campus rising.',
    status: 'Classes since July 2024 in temporary space. Main campus construction started January 2025.',
    facts: [
      'Permanent campus on 7.5 acres',
      'Foundation programme and B.Des. in Fashion Communication, Fashion Design and Fashion Interiors',
      'Completion date not stated by NIFT',
    ],
    brings: 'Students, faculty, visiting parents, guest lecturers and exhibition visitors.',
    source: { label: 'NIFT Varanasi', url: 'https://nift.ac.in/varanasi' },
  },
  {
    id: 'hastkala',
    name: 'Deendayal Hastkala Sankul (Varanasi Trade Centre)',
    short: 'Trade Centre',
    kind: 'Trade & events',
    distance: 'About 330 m',
    distanceM: 330,
    bearing: 280, // west along the same road (schematic: drawn on the road line)
    state: 'Operating',
    line: '1,000-seat hall and 50 marts: delegates and buyers, in bursts.',
    status: 'Operating. First phase opened December 2016, fully dedicated September 2017.',
    facts: [
      'About 43,450 sq m built up',
      '1,000-seat convention hall and 500-seat atrium hall',
      '50 marts, crafts museum, 18 guest rooms and 81 dorm beds',
      'Two-level basement parking',
    ],
    brings: 'Exhibitors, delegates, craft buyers and event guests, in bursts around events.',
    caveat: 'The district page publishes facilities but no visitor counts.',
    source: { label: 'Varanasi district administration', url: 'https://varanasi.nic.in/dhs/' },
  },
];

export const CITY_DRIVERS: CityDriver[] = [
  {
    id: 'ropeway',
    name: 'Kashi ropeway',
    facts: '3.75 km, Cantt to Godowlia, five stations. Over 94% complete in September 2026; operations expected 24 November 2026, subject to readiness. Forecast ridership about 96,000 a day.',
    whyIndirect: 'No station at Bada Lalpur. Ridership is a forecast.',
    source: { label: 'Swarajya, 30 Sept 2026', url: 'https://swarajyamag.com/news-brief/varanasis-urban-ropeway-project-reaches-95-per-cent-completion-operations-expected-by-november' },
  },
  {
    id: 'airport',
    name: 'Varanasi airport new terminal',
    facts: 'New terminal for about 6 million passengers a year, about 75,600 sq m. On 24 June 2026 the aviation minister asked for completion within six months.',
    whyIndirect: 'Brings more visitors to the city, not specifically to this road.',
    source: { label: 'Aviation & Defence Universe, 26 June 2026', url: 'https://www.aviation-defence-universe.com/minister-naidu-reviews-new-varanasi-terminal-under-construction/' },
  },
  {
    id: 'corridors',
    name: 'Elevated highway corridors',
    facts: 'Cabinet approved two corridors in July 2026: 46 km from NH-19 to the Ring Road (over ₹14,400 crore) and 43 km along the Varuna river (about ₹11,000 crore). No completion date given.',
    whyIndirect: 'The Ring Road is about 1 km by road from the plot, so access should improve, but timing is open.',
    source: { label: 'Drishti IAS, 17 July 2026', url: 'https://www.drishtiias.com/state-pcs-current-affairs/ccea-approves-two-elevated-highway-projects-for-varanasi/print_manually' },
  },
  {
    id: 'tourism',
    name: 'Varanasi tourism',
    facts: 'About 11 crore visits in 2024 against 9.3 crore in 2023; about 3.1 lakh foreign tourists in 2024.',
    whyIndirect: 'Counts visits, mostly pilgrims, concentrated in the old city. Secondary report of state and ministry data.',
    source: { label: 'Organiser, 7 Oct 2025', url: 'https://organiser.org/2025/10/07/319729/bharat/up-varanasi-surpasses-goa-and-shimla-to-become-indias-fastest-growing-tourism-hub-over-11-crore-visitors-in-2024/' },
  },
];

/** How footfall builds. This is reasoning from the facilities above, not measured data. */
export const FOOTFALL_LAYERS = [
  { id: 'patients', icon: 'cross', who: 'Patients, attendants and hospital staff', short: 'Patients & staff', when: 'Every day', needs: 'Diagnostics, pharmacy, clinics, cafés, short stays' },
  { id: 'students', icon: 'cap', who: 'Students, faculty and campus visitors', short: 'Students & faculty', when: 'Weekdays in term', needs: 'Cafés, stationery and fashion supplies, banks, fitness' },
  { id: 'delegates', icon: 'hall', who: 'Exhibitors, delegates and event guests', short: 'Delegates & guests', when: 'Event days and weekends', needs: 'Restaurants, serviced stays, offices, retail' },
  { id: 'residents', icon: 'home', who: 'Residents and local businesses', short: 'Residents & locals', when: 'Every day', needs: 'Everyday retail, F&B, banking, services' },
];

/** What the site must not claim. Shown on the Nearby Projects page and used as an editing checklist. */
export const FOOTFALL_NOT_CLAIMED = [
  'No footfall or visitor figure for this building or road. None is published by any source reviewed.',
  'No opening year for Apollo or NIFT. Neither institution has announced one in the sources reviewed.',
  'No claim that city-level projects will raise footfall at the building.',
];

/** Headline for the first page. "Potential" is deliberate: it is reasoning from the facilities, not a measured count. */
export const FOOTFALL_HEADLINE = {
  kicker: 'Footfall potential',
  title: 'A hospital, a design campus and a trade centre, all within 350 m.',
  sub: 'Three anchors of different kinds put patients, students and delegates on this road across the week.',
  anchorsWithin350m: NEARBY_PROJECTS.filter((p) => p.distanceM <= 350).length,
};

export const FOOTFALL_NOTE =
  `Reviewed ${FOOTFALL_AS_OF} from public sources linked on each card. Plans and forecasts can change; nothing here is a footfall count.`;
