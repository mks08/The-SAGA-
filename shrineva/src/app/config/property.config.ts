/**
 * SHRINEVA — Canonical Property Data Model
 * ─────────────────────────────────────────────────────────────────────────
 * Single source of truth for every fact, figure and contact detail shown
 * anywhere on the site (components, SEO meta, JSON-LD, sitemap, forms).
 *
 * RULES:
 *  - Never hard-code a property fact directly in a component/template.
 *    Import it from here instead.
 *  - Never invent a value. If a fact is not yet confirmed, leave it as
 *    `null` and gate its rendering in the component (see `isConfirmed`
 *    helpers below). Do not print "TBD" to public visitors — hide the row.
 *  - Distances are editable in one place (`locationAnchors`) with a
 *    source/date so they can be corrected without touching the UI.
 */

export type FactStatus = 'confirmed' | 'provision' | 'enquire';

export interface TechnicalFact {
  label: string;
  value: string | null;
  status: FactStatus;
  note?: string;
}

export interface LocationAnchor {
  name: string;
  category: 'healthcare' | 'education' | 'trade' | 'connectivity' | 'landmark';
  /** Free-text relationship, e.g. "Opposite", "Diagonally across", "~1 km via Ring Road" */
  relation: string;
  /** Numeric distance in km when known. Use distanceDisplay for visitor-facing copy. */
  distanceKm: number | null;
  /** Visitor-facing distance, e.g. "50 m", "~6 km". */
  distanceDisplay: string | null;
  /** Compass direction from the plot, e.g. "North-east". */
  direction?: string;
  /** One-line factual detail shown on cards. */
  detail?: string;
  /** Status label, e.g. "Under construction". */
  status?: string;
  /** Optional drive time in minutes — only set when verified. */
  driveMinutes: number | null;
  source: string;
}

export interface GrowthStage {
  phase: string;
  title: string;
  status: 'confirmed' | 'under-construction' | 'planned' | 'potential';
  points: string[];
}

/** Public-source references for neighbourhood / institutional claims. Not shown as URLs unless needed. */
export const SOURCES = {
  niftCampus: {
    claim: 'NIFT Varanasi permanent campus, approximately 7.5 acres, including modification of the existing Trade Facilitation Centre.',
    source: 'NBCC / NIFT announcements, 2023–24 (campus construction PMC ~₹216–218 crore).',
    url: 'https://realtynmore.com/nbcc-signs-mou-to-construct-varanasi-nift/',
  },
  niftOperational: {
    claim: 'NIFT Varanasi is already operational from Blocks C & D of the Trade Facilitation Centre, Bada Lalpur, Chandmari.',
    source: 'NIFT Varanasi official campus page.',
    url: 'https://www.nift.ac.in/varanasi',
  },
  apolloMedics: {
    claim: 'Apollo Medics greenfield multi-specialty hospital in Varanasi, publicly reported as a ~400-bed project under development.',
    source: 'Reported VDA building-plan approval coverage; environmental-clearance filings cite a related hospital project at this corridor. Bed count in public reports varies (~400–457).',
    url: 'https://www.digitalhealthnews.com/vda-approves-400-bed-apollo-medics-hospital-in-varanasi',
  },
  hastkala: {
    claim: 'Deendayal Hastkala Sankul (Trade Facilitation Centre & Crafts Museum) is an existing trade, exhibition and cultural facility at Bada Lalpur, Chandmari.',
    source: 'District Varanasi / Government of Uttar Pradesh — Deendayal Hastkala Sankul page (land area listed as 7.93 acres).',
    url: 'https://varanasi.nic.in/dhs/',
  },
  blissEmporio: {
    claim: 'Bliss Emporio is a planned commercial / retail development on Ring Road Phase-1, Chandmari, Bada Lalpur.',
    source: 'Developer project website (described as under construction; no opening date stated; not a SHRINEVA asset).',
    url: 'https://blissemporio.com/',
  },
  airportAai: {
    claim: 'Lal Bahadur Shastri Airport is listed by AAI as 18 km from Varanasi Railway Station.',
    source: 'Airports Authority of India — Lal Bahadur Shastri International Airport, Varanasi.',
    url: 'https://www.aai.aero/en/node/2919',
  },
};

export interface FloorDefinition {
  id: 'floor-1' | 'floor-2' | 'floor-3';
  label: string;
  route: string;
  carpetAreaSqFt: number;
  /** Recommended categories — NOT exclusive legal use restrictions. */
  suggestedFit: string[];
  leaseFormat: string[];
}

/**
 * Architect's plan data — SHRINEVA Floor Plans sheets SH-01 (Stilt, R1) and SH-02 (First floor, R2),
 * dated 12.10.2026. Areas are computed from the dimensions shown and are NOT certified carpet areas.
 */
export const PLAN = {
  sheetDate: '12.10.2026',
  note: "Dimensions follow the architect's CAD plan dated 27.04.26 and the owner's brief. Areas are computed from the dimensions shown and are not certified; certified areas will be issued by the architect. Not for construction.",
  plot: {
    areaSqM: 525,
    areaSqFt: 5651,
    frontage: '49′-5½″',
    frontageFt: 49.46,
    depth: '115′-6½″',
    facing: 'North',
    roadWidthM: 24,
    approval: 'Plot (approval and sanction documents to be confirmed)',
  },
  setbacks: [
    { side: 'Front · North', value: '15′-8″' },
    { side: 'Rear · South', value: '15′-4½″' },
    { side: 'Side · East', value: '8′-11½″' },
    { side: 'Side · West', value: '5′-0″' },
  ],
  stilt: {
    sheet: 'SH-01',
    structureZone: { sqft: 2999.75, sqm: 278.69, size: '35′-6″ × 84′-6″ to outer face of columns' },
    liftStairBay: { sqft: 353.81, sqm: 32.87, size: '12′-9″ × 27′-9″' },
    openArea: { sqft: 2645.94, sqm: 245.82 },
    floorToFloor: '9′-6″',
    boundaryWalls: 'West, east and south',
    frontage: 'Open to the road at ground level; entrance and boundary treatment as per the final drawings',
    entries: 'West and east walkways to the lift and stair lobby',
    staircase: '5′-3″ flights · 19 risers',
  },
  typical: {
    sheet: 'SH-02',
    appliesTo: 'Floors 1, 2 and 3',
    floorArea: { sqft: 3519.75, sqm: 327.0, size: '40′-6″ × 89′-6″ less east recess' },
    liftStairBay: { sqft: 353.81, sqm: 32.87 },
    externalWalls: { sqft: 148.69, sqm: 13.81 },
    carpet: { sqft: 3017.25, sqm: 280.31, pct: 85.7 },
    floorToFloor: '11′-6″ (3.51 m)',
    frontage: '40 ft · 40′-6″ glass line',
    projections: 'Front 5′-0″ glass line · Rear 5′-0″ · East 4′-0″ · West 1′-0″',
    daylight: 'Glass front, windows east and west, solid rear wall',
    staircase: '5′-3″ flights · 24 risers',
    eastRecess: '4′-0″ × 26′-3″',
  },
  lift: { capacity: '8 passengers', adjective: '8-passenger', clear: '6′-1½″ × 5′-5″', count: 1 },
};

export const PROPERTY = {
  brand: {
    name: 'SHRINEVA',
    monogram: 'SG',
    tagline: 'COMMERCIAL · STILT + 3 FLOORS',
    legalNote: 'A family-promoted commercial development in Bada Lalpur, Varanasi.',
  },

  domain: {
    canonical: 'https://srineva.com',
    siteName: 'SHRINEVA',
  },

  contact: {
    /** Enquiry-form recipient only. Not shown on pages. */
    email: 'neerajsingh250@gmail.com',
    /** Public leasing email. Leave empty until a domain mailbox (e.g. leasing@shrineva.com) exists and is tested. */
    publicEmail: '',
    // Email and both phone numbers are taken from the owner's enquiry sheet (Floor Plans PDF, 12.10.2026).
    phoneDisplay: '+91 73557 70378',
    phoneE164: '+917355770378',
    phone2Display: '+91 81140 80609',
    phone2E164: '+918114080609',
    whatsappDisplay: '+91 81140 80609',
    whatsappE164: '918114080609',
    whatsappMessage:
      'Hello, I am interested in leasing space at SHRINEVA, D-15 Bada Lalpur, Varanasi. I would like to know the available floor/area options.',
    hours: 'Site visits by appointment',
  },

  address: {
    line1: 'D-15, Bada Lalpur, Chandmari',
    line2: 'Near Apollo Hospital & NIFT',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    pin: '221003',
    country: 'India',
    full: 'D-15, Bada Lalpur, Chandmari, near Apollo Hospital & NIFT, Varanasi, Uttar Pradesh 221003',
    // NOTE: insert the verified Google Maps place / plus-code once the exact pin is finalised.
    googleMapsUrl: 'https://maps.google.com/?q=Bada+Lalpur+Chandmari+Varanasi',
    embedSrc: 'https://maps.google.com/maps?q=Bada+Lalpur+Chandmari+Varanasi&t=&z=15&ie=UTF8&iwloc=&output=embed',
  },

  structure: {
    type: 'Commercial building · stilt + 3 floors',
    configuration: 'Stilt + 3 commercial floors',
    groundUse: 'Open stilt level for arrival, parking and brand visibility',
    commercialFloors: 3,
  },

  /**
   * Area hierarchy — always label the specific figure being shown.
   * All figures come from the architect's sheets and are computed, not certified.
   */
  area: {
    plotAreaSqM: PLAN.plot.areaSqM,
    plotAreaSqFt: PLAN.plot.areaSqFt,
    floorAreaPerFloorSqFt: PLAN.typical.floorArea.sqft,
    carpetAreaPerFloorSqFt: PLAN.typical.carpet.sqft,
    totalCommercialCarpetSqFt: Math.round(PLAN.typical.carpet.sqft * 3),
    totalFloorAreaSqFt: Math.round(PLAN.typical.floorArea.sqft * 3),
    explainer:
      'Floor area is 3,519.75 sq ft per floor; carpet area is 3,017.25 sq ft (85.7%). Both are computed from the architect\'s dimensions. Certified areas will be issued by the architect.',
  },

  site: {
    roadFrontageFt: 49.46,
    roadFrontageDisplay: PLAN.plot.frontage,
    roadWidthM: PLAN.plot.roadWidthM,
    facing: PLAN.plot.facing,
  },

  parking: {
    totalCars: null as number | string | null, // not confirmed: needs a dimensioned layout against the sanctioned plan
    summary: 'Stilt-level parking; car and two-wheeler capacity to be confirmed against the sanctioned layout',
    covered: true,
    level: 'Stilt',
    twoWheelerCount: null as number | null, // not yet confirmed — do not invent
  },

  access: {
    lifts: 1,
    liftType: 'Passenger lift',
    liftCapacity: PLAN.lift.capacity,
    staircases: '1 staircase with 5′-3″ flights',
    floorToFloorFt: 11.5,
    stiltHeight: PLAN.stilt.floorToFloor,
    typicalHeight: PLAN.typical.floorToFloor,
  },

  infrastructure: {
    confirmed: [
      { label: 'Passenger Lift', value: '1 lift · 8 passengers · 6′-1½″ × 5′-5″', status: 'confirmed' },
      { label: 'Staircase', value: '5′-3″ flights', status: 'confirmed' },
      { label: 'Floor-to-Floor Height', value: 'Stilt 9′-6″ · upper floors 11′-6″ (3.51 m)', status: 'confirmed' },
      { label: 'Road Frontage', value: '49′-5½″ on a 24 m road', status: 'confirmed' },
    ] as TechnicalFact[],
    provisional: [
      { label: 'DG Backup', value: 'Planned provision', status: 'provision', note: 'Capacity and arrangement to be confirmed in the leasing pack.' },
      { label: 'Water Supply', value: 'Planned provision', status: 'provision', note: 'Source and storage to be confirmed in the leasing pack.' },
      { label: 'Internet / Fibre Readiness', value: 'Planned provision', status: 'provision', note: 'Carrier availability to be confirmed.' },
      { label: 'Three-Phase Power', value: 'Planned provision', status: 'provision', note: 'Sanctioned load to be confirmed.' },
      { label: 'HVAC Provision', value: 'Provision for commercial operation', status: 'provision', note: 'Subject to final tenant MEP design.' },
      { label: 'Car and two-wheeler parking', value: null, status: 'enquire', note: 'Capacity to be confirmed against the sanctioned layout.' },
      {
        label: 'Sanctioned Electrical Load',
        value: null,
        status: 'enquire',
        note: 'Determined based on final tenant/business requirement. Technical details available on request.',
      },
      {
        label: 'Kitchen Exhaust Routing',
        value: 'Can be accommodated (open setbacks)',
        status: 'provision',
        note: 'Provision / subject to final tenant MEP design.',
      },
      {
        label: 'LPG Pipeline',
        value: 'Provision will be taken',
        status: 'provision',
        note: 'Provision / subject to final tenant MEP design.',
      },
      {
        label: 'Kitchen Drainage',
        value: 'Can connect to sewer',
        status: 'provision',
        note: 'Provision / subject to final tenant MEP design.',
      },
      {
        label: 'Fresh-Air Provision',
        value: 'Possible (open setbacks)',
        status: 'provision',
        note: 'Provision / subject to final tenant MEP design.',
      },
      {
        label: 'AC Outdoor Unit Placement',
        value: 'Cantilever/projected beam configuration permits placement',
        status: 'provision',
        note: 'Provision / subject to final tenant MEP design.',
      },
      { label: 'Handover condition, clear ceiling height, toilets and pantry', value: null, status: 'enquire', note: 'To be confirmed — agreed with each occupier.' },
      { label: 'Signage Zone Width', value: null, status: 'enquire' },
      { label: 'Projecting Signage Limits', value: null, status: 'enquire' },
    ] as TechnicalFact[],
  },

  signage: {
    facadeSignage: true,
    projectingSignage: true,
    buildingSignage: 'Planned / possible, subject to façade design finalisation',
  },

  leasing: {
    fullFloorAvailable: true,
    subdivisionConsidered: true,
    longTermAccepted: true,
    pricingDisclosure: 'Commercial terms on request',
  },

  floors: [
    {
      id: 'floor-1',
      label: 'Floor 1',
      route: '/spaces/floor-1',
      carpetAreaSqFt: 3017.25,
      suggestedFit: ['Healthcare', 'F&B', 'Retail', 'BFSI', 'Corporate office', 'Education / training', 'Fitness & wellness', 'Professional services', 'Hotel / serviced stay', 'Studio apartment'],
      leaseFormat: ['Full floor', 'Subdivision subject to requirement'],
    },
    {
      id: 'floor-2',
      label: 'Floor 2',
      route: '/spaces/floor-2',
      carpetAreaSqFt: 3017.25,
      suggestedFit: ['Healthcare', 'F&B', 'Retail', 'BFSI', 'Corporate office', 'Education / training', 'Fitness & wellness', 'Professional services', 'Hotel / serviced stay', 'Studio apartment'],
      leaseFormat: ['Full floor', 'Subdivision subject to requirement'],
    },
    {
      id: 'floor-3',
      label: 'Floor 3',
      route: '/spaces/floor-3',
      carpetAreaSqFt: 3017.25,
      suggestedFit: ['Healthcare', 'F&B', 'Retail', 'BFSI', 'Corporate office', 'Education / training', 'Fitness & wellness', 'Professional services', 'Hotel / serviced stay', 'Studio apartment'],
      leaseFormat: ['Full floor', 'Subdivision subject to requirement'],
    },
  ] as FloorDefinition[],

  /**
   * Neighbourhood distances supplied for the Bada Lalpur site (Apollo / NIFT /
   * Hastkala / Ring Road). Airport and railway figures are approximate driving
   * distances from the Apollo Hospital / Bada Lalpur corridor — not GPS-traced
   * from a final cadastral pin.
   */
  locationAnchors: [
    {
      name: 'Apollo Hospital',
      category: 'healthcare',
      relation: 'Same road, opposite side',
      distanceKm: 0.065,
      distanceDisplay: '≈ 60–70 m',
      direction: 'North-east',
      status: 'Plan approved · opening date not announced',
      detail: '400 beds. Multi-specialty hospital; VDA-approved plan reported: double basement, ground and 7 floors; 365 car parking spaces.',
      driveMinutes: null,
      source: 'SHRINEVA location sheet (12.10.2026). Digital Health News (Apollo plan approval, Sept 2025).',
    },
    {
      name: 'NIFT Varanasi',
      category: 'education',
      relation: 'Same road, opposite side',
      distanceKm: 0.065,
      distanceDisplay: '≈ 60–70 m',
      direction: 'North-west',
      status: 'Classes since July 2024 · campus under construction',
      detail: 'Permanent campus on 7.5 acres; main campus construction started January 2025; completion date not stated.',
      driveMinutes: null,
      source: 'SHRINEVA location sheet (12.10.2026). NBM&CW, Realty n More, NIFT.',
    },
    {
      name: 'Varanasi Trade Centre (Deendayal Hastkala Sankul)',
      category: 'trade',
      relation: 'West along the same road',
      distanceKm: 0.33,
      distanceDisplay: '≈ 330 m',
      direction: 'West',
      status: 'Operating',
      detail: '1,000-seat convention hall, 50 marts; 7.93 acres, 43,450 sq m built-up; two-level basement parking; 18 guest rooms and 81 dorm beds.',
      driveMinutes: null,
      source: 'SHRINEVA location sheet (12.10.2026): nearest block measured on satellite imagery; main hall about 470 m. Varanasi district administration.',
    },
    {
      name: 'Varanasi Ring Road (NH 135B)',
      category: 'connectivity',
      relation: 'By road',
      distanceKm: 1,
      distanceDisplay: '1 km',
      detail: 'About 0.6 km straight-line, about 1 km by road.',
      driveMinutes: null,
      source: 'SHRINEVA location sheet (12.10.2026).',
    },
    {
      name: 'Lal Bahadur Shastri International Airport',
      category: 'connectivity',
      relation: 'By road',
      distanceKm: 19,
      distanceDisplay: '19 km',
      detail: 'About 30 minutes.',
      driveMinutes: 30,
      source: 'SHRINEVA location sheet (12.10.2026); travel time per the Ministry of Textiles tender for the Trade Facilitation Centre.',
    },
    {
      name: 'Varanasi Junction (Cantt) railway station',
      category: 'connectivity',
      relation: 'By road',
      distanceKm: 9,
      distanceDisplay: '9 km',
      driveMinutes: null,
      source: 'SHRINEVA location sheet (12.10.2026).',
    },
    {
      name: 'Kashi Vishwanath Temple',
      category: 'landmark',
      relation: 'By road',
      distanceKm: 12,
      distanceDisplay: '12 km',
      driveMinutes: null,
      source: 'SHRINEVA location sheet (12.10.2026).',
    },
    {
      name: 'Sarnath',
      category: 'landmark',
      relation: 'By road',
      distanceKm: 7,
      distanceDisplay: '7 km',
      detail: 'About 20 minutes.',
      driveMinutes: 20,
      source: 'SHRINEVA location sheet (12.10.2026); travel time per the Ministry of Textiles tender.',
    },
    {
      name: 'Ganjari International Cricket Stadium',
      category: 'landmark',
      relation: 'By road',
      distanceKm: 20,
      distanceDisplay: '20 km',
      detail: '30,000 seats · nearing completion. Distance is a rough estimate.',
      driveMinutes: null,
      source: 'SHRINEVA location sheet (12.10.2026). Khel Now (stadium, Sept 2026).',
    },
  ] as LocationAnchor[],

  growthTimeline: [
    {
      phase: 'TODAY',
      title: 'An Operating Trade Anchor',
      status: 'confirmed',
      points: [
        'Varanasi Trade Centre (Deendayal Hastkala Sankul) is operating about 330 m west: 1,000-seat convention hall, 50 marts, two-level basement parking',
        'NIFT Varanasi classes have been running since July 2024',
        'Existing residential catchment and local businesses; Ring Road about 1 km by road',
      ],
    },
    {
      phase: 'UNDER CONSTRUCTION',
      title: 'Institutional Anchors and a Mall, Same Locality',
      status: 'under-construction',
      points: [
        'Apollo Medics hospital, 400 beds, about 60–70 m north-east: VDA-approved plan reported with double basement, ground and 7 floors and 365 car parking spaces; opening date not announced',
        'NIFT permanent campus on 7.5 acres, about 60–70 m north-west: main campus construction started January 2025; completion date not stated',
        'Bliss Emporio mall, Ring Road Phase-1, Chandmari: about 6 lakh sq ft built, under construction per the developer',
      ],
    },
    {
      phase: 'EMERGING',
      title: 'Commercialisation',
      status: 'planned',
      points: [
        'Patients and families, students and faculty, exhibitors and delegates will all pass this stretch of road',
        'Potential demand for clinics, diagnostics, pharmacy, cafés, banks, retail, offices and premium stays such as studio apartments',
        'Retail is arriving: a mall of about 6 lakh sq ft is under construction on Ring Road Phase-1, Chandmari',
      ],
    },
    {
      phase: 'POTENTIAL',
      title: 'Multiple Demand Engines',
      status: 'potential',
      points: [
        'Healthcare + education + trade and culture + residential catchment',
        'City reference points within reach: Sarnath 7 km, Varanasi Junction 9 km, Kashi Vishwanath 12 km, airport 19 km',
        'A stronger institutional-commercial corridor is a possibility, not a guaranteed outcome',
      ],
    },
  ] as GrowthStage[],

  businessCategories: [
    'Healthcare',
    'Diagnostics',
    'Pharmacy',
    'Bank / BFSI',
    'Insurance',
    'F&B',
    'Retail',
    'Corporate Office',
    'IT/ITES',
    'Education',
    'Fitness/Wellness',
    'Fashion/Design',
    'Hotel / Serviced Stay',
    'Studio Apartment',
    'Other',
  ],

  spaceRequiredOptions: [
    'Full Floor',
    '1,000–1,500 sq ft',
    '1,500–2,000 sq ft',
    '2,000–3,000 sq ft',
    'Multiple floors',
    'Other',
  ],

  preferredFloorOptions: ['Any', 'Floor 1', 'Floor 2', 'Floor 3'],

  images: {
    hero: 'assets/images/renders/facade-golden.webp',
    logo: 'assets/images/shrineva-logo.webp',
    og: 'https://srineva.com/assets/images/og-shrineva.jpg',
  },

  legal: {
    areaDisclaimer:
      'Areas are computed from the architect\'s dimensions and are not certified. Specifications are subject to final architectural, sanctioned and technical documentation.',
    useDisclaimer:
      'Tenant use is subject to applicable approvals, building regulations, fire and safety requirements and technical feasibility.',
      futureDisclaimer:
      'Development references are based on publicly available information reviewed on 14 October 2026 and may change. No opening dates are stated for projects whose owners have not announced them. No footfall figure is published for this building or road.',
    renderDisclaimer:
      'Indicative 3D visualisation. Finishes and surroundings are illustrative and the design is subject to change. Dimensions are as per the floor plans.',
  },
};

export type PropertyConfig = typeof PROPERTY;

/** Builds a wa.me deep link with a URL-encoded message. */
export function waLink(message: string = PROPERTY.contact.whatsappMessage): string {
  return `https://wa.me/${PROPERTY.contact.whatsappE164}?text=${encodeURIComponent(message)}`;
}

