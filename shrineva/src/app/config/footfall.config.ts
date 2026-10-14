/**
 * SHRINEVA — nearby projects and footfall drivers.
 * Every row has a source, an "as of" date and a confidence label so the page never
 * presents a plan or a forecast as a fact. Update `FOOTFALL_AS_OF` whenever rows change.
 *
 * Rules for editing:
 *  - Do not add a visitor, footfall or growth number for this building or road. None is sourced.
 *  - Do not add an opening date unless the owning institution has published it.
 *  - City-level items stay labelled "indirect".
 */

export const FOOTFALL_AS_OF = '14 October 2026';

export type Confidence = 'High' | 'Medium' | 'Low';

export interface NearbyProject {
  id: string;
  name: string;
  kind: 'Healthcare' | 'Education' | 'Trade & events' | 'Retail';
  distance: string;
  status: string;
  facts: string[];
  brings: string;
  confidence: Confidence;
  caveat?: string;
  source: { label: string; url: string };
}

export interface CityDriver {
  id: string;
  name: string;
  facts: string;
  whyIndirect: string;
  confidence: Confidence;
  source: { label: string; url: string };
}

export const NEARBY_PROJECTS: NearbyProject[] = [
  {
    id: 'apollo',
    name: 'Apollo Medics hospital',
    kind: 'Healthcare',
    distance: 'About 60–70 m',
    status: 'VDA building plan approved (reported September 2025). No opening date announced.',
    facts: [
      '400 beds, multi-specialty',
      'Double basement, ground and 7 floors; 365 car parking spaces',
      'Estimated investment about ₹189 crore',
    ],
    brings: 'Patients, attendants, doctors and hospital staff every day of the week.',
    confidence: 'Medium',
    caveat: 'The published report names Varanasi, not Bada Lalpur; the position opposite the plot is from the owner\'s location sheet.',
    source: { label: 'Digital Health News', url: 'https://www.digitalhealthnews.com/vda-approves-400-bed-apollo-medics-hospital-in-varanasi' },
  },
  {
    id: 'nift',
    name: 'NIFT Varanasi',
    kind: 'Education',
    distance: 'About 60–70 m',
    status: 'Classes since July 2024 in temporary space. Main campus construction started January 2025.',
    facts: [
      'Permanent campus on 7.5 acres',
      'Foundation programme and B.Des. in Fashion Communication, Fashion Design and Fashion Interiors',
      'Completion date not stated by NIFT',
    ],
    brings: 'Students, faculty, visiting parents, guest lecturers and exhibition visitors.',
    confidence: 'High',
    source: { label: 'NIFT Varanasi', url: 'https://nift.ac.in/varanasi' },
  },
  {
    id: 'hastkala',
    name: 'Deendayal Hastkala Sankul (Varanasi Trade Centre)',
    kind: 'Trade & events',
    distance: 'About 330 m',
    status: 'Operating. First phase opened December 2016, fully dedicated September 2017.',
    facts: [
      'About 43,450 sq m built up',
      '1,000-seat convention hall and 500-seat atrium hall',
      '50 marts, crafts museum, 18 guest rooms and 81 dorm beds',
      'Two-level basement parking',
    ],
    brings: 'Exhibitors, delegates, craft buyers and event guests, in bursts around events.',
    confidence: 'High',
    caveat: 'The district page publishes facilities but no visitor counts.',
    source: { label: 'Varanasi district administration', url: 'https://varanasi.nic.in/dhs/' },
  },
  {
    id: 'bliss',
    name: 'Bliss Emporio mall',
    kind: 'Retail',
    distance: 'Same locality; distance not measured',
    status: 'Under construction per the developer. No possession or opening date is stated on its website.',
    facts: [
      'Ring Road Phase-1, Chandmari, Bada Lalpur',
      'About 6 lakh sq ft built up, about 4 lakh sq ft retail',
    ],
    brings: 'Shoppers and diners, a second draw on evenings and weekends.',
    confidence: 'Medium',
    caveat: 'Figures come from the developer\'s own page.',
    source: { label: 'Bliss Emporio', url: 'https://blissemporio.com/' },
  },
];

export const CITY_DRIVERS: CityDriver[] = [
  {
    id: 'ropeway',
    name: 'Kashi ropeway',
    facts: '3.75 km, Cantt to Godowlia, five stations. Over 94% complete in September 2026; operations expected 24 November 2026, subject to readiness. Forecast ridership about 96,000 a day.',
    whyIndirect: 'No station at Bada Lalpur. Ridership is a forecast.',
    confidence: 'Medium',
    source: { label: 'Swarajya, 30 Sept 2026', url: 'https://swarajyamag.com/news-brief/varanasis-urban-ropeway-project-reaches-95-per-cent-completion-operations-expected-by-november' },
  },
  {
    id: 'airport',
    name: 'Varanasi airport new terminal',
    facts: 'New terminal for about 6 million passengers a year, about 75,600 sq m. On 24 June 2026 the aviation minister asked for completion within six months.',
    whyIndirect: 'Brings more visitors to the city, not specifically to this road.',
    confidence: 'Medium',
    source: { label: 'Aviation & Defence Universe, 26 June 2026', url: 'https://www.aviation-defence-universe.com/minister-naidu-reviews-new-varanasi-terminal-under-construction/' },
  },
  {
    id: 'corridors',
    name: 'Elevated highway corridors',
    facts: 'Cabinet approved two corridors in July 2026: 46 km from NH-19 to the Ring Road (over ₹14,400 crore) and 43 km along the Varuna river (about ₹11,000 crore). No completion date given.',
    whyIndirect: 'The Ring Road is about 1 km by road from the plot, so access should improve, but timing is open.',
    confidence: 'Medium',
    source: { label: 'Drishti IAS, 17 July 2026', url: 'https://www.drishtiias.com/state-pcs-current-affairs/ccea-approves-two-elevated-highway-projects-for-varanasi/print_manually' },
  },
  {
    id: 'tourism',
    name: 'Varanasi tourism',
    facts: 'About 11 crore visits in 2024 against 9.3 crore in 2023; about 3.1 lakh foreign tourists in 2024.',
    whyIndirect: 'Counts visits, mostly pilgrims, concentrated in the old city. Secondary report of state and ministry data.',
    confidence: 'Low',
    source: { label: 'Organiser, 7 Oct 2025', url: 'https://organiser.org/2025/10/07/319729/bharat/up-varanasi-surpasses-goa-and-shimla-to-become-indias-fastest-growing-tourism-hub-over-11-crore-visitors-in-2024/' },
  },
];

/** How footfall builds. This is reasoning from the facilities above, not measured data. */
export const FOOTFALL_LAYERS = [
  { who: 'Patients, attendants and hospital staff', when: 'Every day', needs: 'Diagnostics, pharmacy, clinics, cafés, short stays' },
  { who: 'Students, faculty and campus visitors', when: 'Weekdays in term', needs: 'Cafés, stationery and fashion supplies, banks, fitness' },
  { who: 'Exhibitors, delegates and event guests', when: 'Event days and weekends', needs: 'Restaurants, serviced stays, offices, retail' },
  { who: 'Mall visitors and Ring Road through-traffic', when: 'Evenings and weekends', needs: 'Retail, F&B, services' },
];

/** What the site must not claim. Shown in the page footer note and used as an editing checklist. */
export const FOOTFALL_NOT_CLAIMED = [
  'No footfall or visitor figure for this building or road. None is published by any source reviewed.',
  'No opening year for Apollo or NIFT. Neither institution has announced one in the sources reviewed.',
  'No claim that city-level projects will raise footfall at the building.',
];

export const FOOTFALL_NOTE =
  `Reviewed ${FOOTFALL_AS_OF} from public sources linked above. Plans and forecasts can change. Confidence labels describe the source, not the outcome.`;
