/**
 * SHRINEVA — Editorial / marketing content.
 * Facts belong in property.config.ts. This file holds copy that is not a
 * measured specification (demand engines, occupier factors, business-fit
 * narratives). Keep claims qualitative; do not invent footfall or returns.
 */
import { PROPERTY, PLAN } from './property.config';

const sqft = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export const CONTENT = {
  about:
    "Built with a long-term view of Varanasi's evolving commercial landscape, SHRINEVA combines a family-led vision with a practical approach to modern business space.",

  /** Property at a glance (home). Every figure is from the architect's sheets. */
  snapshot: [
    { value: `${PLAN.plot.areaSqM} sq m`, label: 'Plot area', sub: `≈ ${sqft(PLAN.plot.areaSqFt)} sq ft` },
    { value: PLAN.plot.frontage, label: 'Frontage, north-facing', sub: `on a ${PLAN.plot.roadWidthM} m wide road` },
    { value: 'Stilt + 3', label: 'Commercial floors', sub: 'Open stilt, three whole floors' },
    { value: `${sqft(PLAN.typical.floorArea.sqft)} sq ft`, label: 'Floor area, each floor', sub: `${sqft(PLAN.typical.carpet.sqft)} sq ft carpet` },
    { value: '8 persons', label: 'Passenger lift', sub: 'One lift, one staircase' },
    { value: 'Stilt', label: 'Parking level', sub: 'Capacity to be confirmed' },
  ],

  demandEngineStrip: [
    { kicker: 'Healthcare', line: 'Planned 400-bed Apollo hospital nearby' },
    { kicker: 'Education', line: 'NIFT Varanasi' },
    { kicker: 'Trade & Culture', line: 'Varanasi Trade Centre' },
    { kicker: 'Retail & F&B', line: 'Bliss Emporio mall under construction' },
    { kicker: 'Residential', line: 'Surrounding catchment' },
    { kicker: 'Connectivity', line: 'Ring Road · about 1 km' },
  ],

  occupierFactors: [
    { title: 'Location', copy: 'Apollo Hospital and NIFT about 60–70 m away, the Trade Centre about 330 m, Ring Road about 1 km by road.' },
    { title: 'Visibility', copy: `${PLAN.plot.frontage} of frontage on a ${PLAN.plot.roadWidthM} m road, plus a 40 ft glass-line frontage on each upper floor.` },
    { title: 'Access', copy: 'Open frontage with direct entry from the road, and east and west walkways to the lift and stair lobby.' },
    { title: 'Parking', copy: 'Parking on the open stilt level. Car and two-wheeler capacity will be confirmed against the sanctioned layout.' },
    { title: 'Flexibility', copy: 'One whole open floor plate, divided as required. Full-floor or subdivided occupation.' },
    { title: 'Infrastructure', copy: 'Planned provisions for power, DG backup, water, HVAC and internet; specifications in the leasing pack.' },
    { title: 'Brand presence', copy: 'Façade, projecting and building-level signage opportunities, subject to façade design finalisation.' },
    { title: 'Operability', copy: 'Commercial-ready infrastructure. F&B-related provisions subject to final tenant MEP design.' },
  ],

  architectureLevels: [
    {
      id: 'ground',
      label: 'Stilt',
      area: `${sqft(PLAN.stilt.structureZone.sqft)} sq ft structure zone`,
      note: `Open ground level, ${PLAN.stilt.floorToFloor} floor to floor. Lift and stair lobby, parking and arrival.`,
      route: '/floor-plans',
    },
    {
      id: 'floor-1',
      label: 'Floor 01',
      area: `${sqft(PLAN.typical.floorArea.sqft)} sq ft · ${sqft(PLAN.typical.carpet.sqft)} carpet`,
      note: 'One open floor plate, divided as required. The first-floor plan is typical for all three floors.',
      route: '/spaces/floor-1',
    },
    {
      id: 'floor-2',
      label: 'Floor 02',
      area: `${sqft(PLAN.typical.floorArea.sqft)} sq ft · ${sqft(PLAN.typical.carpet.sqft)} carpet`,
      note: 'Same plate as Floor 01.',
      route: '/spaces/floor-2',
    },
    {
      id: 'floor-3',
      label: 'Floor 03',
      area: `${sqft(PLAN.typical.floorArea.sqft)} sq ft · ${sqft(PLAN.typical.carpet.sqft)} carpet`,
      note: 'Same plate as Floor 01.',
      route: '/spaces/floor-3',
    },
  ],

  infrastructureEssentials: [
    'Planned provisions: DG backup, three-phase power, water and internet readiness (specifications in the leasing pack)',
    'HVAC provision for commercial occupation',
    `One ${PLAN.lift.adjective} lift (${PLAN.lift.clear} clear) and one staircase with 5′-3″ flights`,
    `Floor-to-floor height ${PLAN.stilt.floorToFloor} at stilt and ${PLAN.typical.floorToFloor} on upper floors`,
    'Parking on the open stilt level (capacity to be confirmed against the sanctioned layout)',
    'Façade and projecting signage opportunities',
    'Toilets, pantry, handover condition and clear ceiling height are agreed with each occupier',
  ],
};
