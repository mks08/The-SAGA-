/**
 * SHRINEVA — FAQs. Single source for the visible FAQ list AND the FAQPage JSON-LD,
 * so the structured data always matches what visitors can read.
 * Facts come from property.config.ts (architect's sheets SH-01 / SH-02, 12.10.2026).
 */
import { PROPERTY, PLAN } from './property.config';

const n2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface Faq { q: string; a: string; }

export const FAQS: Faq[] = [
  {
    q: 'What is SHRINEVA?',
    a: `SHRINEVA is a commercial building at D-15, Bada Lalpur, Chandmari, Varanasi: an open stilt level plus three whole commercial floors on a ${PLAN.plot.areaSqM} sq m VDA-approved plot, with ${PLAN.plot.frontage} of frontage on a ${PLAN.plot.roadWidthM} m wide road.`,
  },
  {
    q: 'Where is SHRINEVA located?',
    a: `${PROPERTY.address.full}. The plot faces north on the same road as Apollo Hospital and NIFT Varanasi (about 60–70 m away), about 330 m from the Varanasi Trade Centre and about 1 km by road from the Varanasi Ring Road.`,
  },
  {
    q: 'How big is each floor?',
    a: `Each floor is ${n2(PLAN.typical.floorArea.sqft)} sq ft (${n2(PLAN.typical.floorArea.sqm)} sq m) of floor area, with ${n2(PLAN.typical.carpet.sqft)} sq ft (${n2(PLAN.typical.carpet.sqm)} sq m) of carpet area, which is ${PLAN.typical.carpet.pct}% of the floor area. The first-floor plan is typical for Floors 1, 2 and 3. Areas are computed from the architect's dimensions; certified areas will be issued by the architect.`,
  },
  {
    q: 'Can a floor be divided?',
    a: 'Each floor is one open floor plate that can be divided as required. Whole-floor leasing is available, and subdivision may be considered depending on your requirement. Share your space requirement and the leasing team will confirm feasibility.',
  },
  {
    q: 'How many cars can be parked?',
    a: `The owner's brief is ${PROPERTY.parking.totalCars} cars across the open stilt level and its setbacks. The exact parking layout is to be confirmed by the architect.`,
  },
  {
    q: 'When will Apollo Hospital and NIFT open?',
    a: 'Both are under construction on the same road. Opening in 2027 is the expected timeline and is subject to the institutions concerned. NIFT Varanasi classes have been running since July 2024, and building work on its permanent campus began in January 2025.',
  },
  {
    q: 'What is the stilt level used for?',
    a: `The stilt is an open ground level, ${PLAN.stilt.floorToFloor} floor to floor, with a ${n2(PLAN.stilt.structureZone.sqft)} sq ft structure zone. It holds parking and arrival, with west and east walkways to the lift and stair lobby. The road side is fully open: no gate and no wall across the ${PLAN.plot.frontage} frontage.`,
  },
  {
    q: 'What are the lift, staircase and floor height?',
    a: `One passenger lift for ${PLAN.lift.capacity} (${PLAN.lift.clear} clear) and one staircase with 5′-3″ flights. Floor-to-floor height is ${PLAN.stilt.floorToFloor} at the stilt and ${PLAN.typical.floorToFloor} on the upper floors. Clear ceiling height is to be confirmed.`,
  },
  {
    q: 'Is DG backup, three-phase power and HVAC available?',
    a: 'DG backup, three-phase power, water and internet readiness are available, with HVAC provision for commercial operation. Sanctioned load and the final system are determined by the occupier’s requirement.',
  },
  {
    q: 'Can restaurants and cafés operate here?',
    a: 'Yes, subject to approvals. Provisions for kitchen exhaust routing, LPG pipeline, kitchen drainage, fresh air and AC outdoor units can be accommodated, subject to final tenant MEP design. The leasing pack has the technical notes.',
  },
  {
    q: 'Is signage possible?',
    a: `Façade and projecting signage are possible, and building-level signage is planned subject to façade design finalisation. Each upper floor has a 40 ft glass-line frontage facing the ${PLAN.plot.roadWidthM} m road.`,
  },
  {
    q: 'What businesses is SHRINEVA suited to?',
    a: 'Healthcare and diagnostics, pharmacy, banking and insurance, cafés and restaurants, corporate and professional offices, education and training, fashion and design, fitness and wellness, retail, and possible hotel or studio-apartment formats. These are suitability notes, not exclusive use permissions.',
  },
  {
    q: 'Are hotels or studio apartments possible?',
    a: 'Yes, as a business possibility. Premium stays such as studio apartments for visitors, families and professionals, and boutique hotel or serviced-stay formats, can be considered on the typical floor plate. This is not an exclusive floor assignment, and final use is subject to applicable building, fire and local-use approvals.',
  },
  {
    q: 'How far are the airport, railway station and city landmarks?',
    a: 'By road: Varanasi Ring Road about 1 km, Sarnath about 7 km (about 20 minutes), Varanasi Junction (Cantt) station about 9 km, Kashi Vishwanath Temple about 12 km, Lal Bahadur Shastri International Airport about 19 km (about 30 minutes) and Ganjari International Cricket Stadium about 20 km (a rough estimate).',
  },
  {
    q: 'Are the 3D images and plans final?',
    a: 'No. The 3D images are indicative visualisations: finishes and surroundings are illustrative and the design is subject to change. The floor plans are issued for discussion; entry arrangements are indicative and remain subject to the architect’s drawings and statutory approvals.',
  },
  {
    q: 'Are long-term leases available?',
    a: 'Yes, long-term leases are accepted. Commercial terms are shared on request.',
  },
  {
    q: 'How do I get the floor plans or visit the site?',
    a: `Download the plans (PDF) from the Floor Plans page, or call ${PROPERTY.contact.phoneDisplay} or ${PROPERTY.contact.phone2Display}, message on WhatsApp, or use the “Schedule a site visit” button.`,
  },
  {
    q: 'How can brokers and tenant representatives reach leasing?',
    a: `Tenant-representation consultants and brokers can write to ${PROPERTY.contact.email} or use the brokers page to register a requirement.`,
  },
];

/** The six shown on the home page. */
export const HOME_FAQ_COUNT = 6;
