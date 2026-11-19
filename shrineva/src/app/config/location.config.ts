/**
 * SHRINEVA — short distance list for the location block and the footer.
 * Distances come from the owner's location sheet (property.config.ts → locationAnchors). Approximate; "≈" is added in the UI.
 * Vardhan Hospital, Lalpur: no distance is published here until the owner confirms it; it is listed as "Nearby" (Bada Lalpur, opposite the Trade Centre).
 * Order: nearest first, then the longer drives.
 */
export interface DistanceRow { id: string; name: string; value: string; note?: string; footer?: boolean; }

export const NEARBY_DISTANCES: DistanceRow[] = [
  { id: 'nift', name: 'NIFT Varanasi campus', value: '≈ 100 m', note: 'Near the plot', footer: true },
  { id: 'apollo', name: 'Apollo Hospital (upcoming)', value: 'Opposite', note: 'Under construction, not yet operational', footer: true },
  { id: 'trade', name: 'Varanasi Trade Centre', value: '≈ 330 m', note: 'Along the road', footer: true },
  { id: 'vardhan', name: 'Vardhan Hospital, Lalpur', value: 'Nearby', note: 'Bada Lalpur, opposite the Trade Centre', footer: true },
  { id: 'ring', name: 'Ring Road (NH 135B)', value: '≈ 1 km', note: 'By road', footer: true },
  { id: 'ganjari', name: 'Ganjari Cricket Stadium', value: '≈ 20 km', note: 'By road, approx.' },
];
