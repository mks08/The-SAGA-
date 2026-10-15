/**
 * SHRINEVA — key features and project status, as stated by the owner (15 October 2026).
 * These are the owner's specifications, not certificates: no certification, rating or approval number is claimed.
 * Keep wording short; the home page shows them as one line each.
 */

export const PROJECT_STATUS = {
  asOf: '15 October 2026',
  stage: 'Under construction',
  progress: 'Structure almost complete',
  handover: 'March 2027',
  modifications: 'Floor-wise modifications can be considered as per your requirement.',
  note: 'Timeline as planned by the owner; subject to approvals and site conditions.',
};

export interface KeyFeature { id: string; title: string; line: string; /** SVG path data, 24×24 stroke icon */ icon: string; }

export const KEY_FEATURES: KeyFeature[] = [
  { id: 'vastu', title: 'Vastu compliant', line: 'Planned to Vastu principles.', icon: 'M12 3l2.6 5.4L21 9.3l-4.5 4.3 1.1 6.1L12 16.6 6.4 19.7l1.1-6.1L3 9.3l6.4-.9L12 3z' },
  { id: 'column-free', title: 'Column-free structure', line: 'Open floor plates, columns kept to the edges.', icon: 'M4 4h16v16H4zM4 9h16M9 4v16' },
  { id: 'fire', title: 'Fire safety', line: 'Fire-safety provisions built in.', icon: 'M12 3c1 3.2 4.5 5 4.5 9a4.5 4.5 0 0 1-9 0c0-1.7.8-2.8 1.6-3.8.2 1.2.8 1.9 1.4 2.3C10.2 7.6 10.8 5.2 12 3z' },
  { id: 'security', title: '24×7 safety', line: 'Round-the-clock security.', icon: 'M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3zM9 12l2 2 4-4' },
  { id: 'dining', title: 'Fine dining', line: 'Planned for restaurants and fine dining.', icon: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-2 6 0 8v10' },
  { id: 'office', title: 'Offices', line: 'Whole-floor offices, one or many.', icon: 'M4 21V6l8-3 8 3v15M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4' },
  { id: 'open-plot', title: '4-side open plot', line: 'Open on all four sides: light, air, access.', icon: 'M4 4h16v16H4zM9 9h6v6H9z' },
];

/** Building services the owner listed. Fire safety and security already appear as features above. */
export const BUILDING_SERVICES = ['Parking', 'Internet', 'DG power backup'];

export const FEATURES_NOTE = 'As specified by the owner; subject to final design and approvals.';

/** "I am looking for" choices on the short enquiry forms. */
export const NEED_OPTIONS = ['Office', 'Restaurant / fine dining', 'Clinic / diagnostics', 'Retail / showroom', 'Studio / serviced stay', 'Other'];
