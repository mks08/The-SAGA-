/**
 * SHRINEVA — Route-level SEO configuration.
 * Consumed by SeoService (runtime) and by scripts/build-seo.js (static per-route
 * HTML shells, sitemap) so crawlers that do not run JavaScript still get the right
 * title, description, canonical and Open Graph tags for every URL.
 */
import { PROPERTY, PLAN } from './property.config';

export interface RouteSeo {
  path: string;
  title: string;
  description: string;
  h1: string;
  /** sitemap.xml */
  priority: number;
  changefreq: 'weekly' | 'monthly' | 'yearly';
  /** Optional page-specific image (defaults to the façade render). */
  image?: string;
  imageAlt?: string;
}

const domain = PROPERTY.domain.canonical;

const floorDesc = (n: number) =>
  `Floor ${n} at SHRINEVA, Bada Lalpur, Varanasi: about 3,500 sq ft gross (about 3,100 sq ft carpet), one open floor plate with a glass front on a 24 m road.`;

export const SEO_ROUTES: RouteSeo[] = [
  {
    path: '',
    title: 'Commercial Space for Lease, Bada Lalpur, Varanasi | SHRINEVA',
    description: 'Commercial and office space for lease on 24 m Stadium Road, Bada Lalpur, Varanasi, opposite the upcoming Apollo Hospital. Open floors of about 3,500 sq ft.',
    h1: 'Commercial & office space for lease in Bada Lalpur, Varanasi',
    priority: 1.0,
    changefreq: 'weekly',
  },
  {
    path: 'floor-plans',
    title: 'Floor Plans & Floor Area, SHRINEVA Bada Lalpur, Varanasi',
    description: 'Floor plans for SHRINEVA, Varanasi: ground-level layout and three identical open floors of about 3,500 sq ft gross, with lift, fire exit and parking. PDF.',
    h1: 'Floor Plans',
    priority: 0.9,
    changefreq: 'monthly',
    image: `${domain}/assets/images/og-shrineva.jpg`,
  },
  {
    path: 'healthcare-diagnostic-space',
    title: 'Clinic & Diagnostic Space Near Upcoming Apollo | SHRINEVA',
    description: 'Space for clinics, pathology labs and diagnostic centres opposite the upcoming Apollo Hospital, Bada Lalpur, Varanasi. Open floors, lift and parking.',
    h1: 'Clinic, Pathology Lab & Diagnostic Space Opposite the Upcoming Apollo Hospital, Varanasi',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: 'office-bank-coaching-space',
    title: 'Office, Bank & Coaching Space for Lease | SHRINEVA Varanasi',
    description: 'Bare-shell office, bank branch and coaching space on Stadium Road, Varanasi: floors of about 3,500 sq ft, 50 ft frontage, lift and 12+ car parking.',
    h1: 'Bare-Shell Office, Bank Branch & Coaching Institute Space in Varanasi',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: 'retail-showroom-cafe-space',
    title: 'Showroom, Retail & Café Space Near NIFT Varanasi | SHRINEVA',
    description: 'Main-road showroom, retail and café space near NIFT Varanasi: 50 ft frontage on a 24 m road in Bada Lalpur, with parking and lift. Food use needs approvals',
    h1: 'Main-Road Showroom, Retail & Café Space Near NIFT Varanasi',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: 'location-contact',
    title: 'Location, Map & Site Visit | SHRINEVA, Bada Lalpur, Varanasi',
    description: 'Find SHRINEVA on Stadium Road, Bada Lalpur, Varanasi: map, distances to NIFT, the upcoming Apollo Hospital and Ring Road, plus a site visit booking form.',
    h1: 'Location, Map & Site Visit',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: 'leasing',
    title: 'Lease Commercial Floors at SHRINEVA, Varanasi: Whole or Part',
    description: 'Lease a whole floor, part of a floor or several floors at SHRINEVA, Bada Lalpur, Varanasi. Open-shell floors of about 3,500 sq ft. Terms on request.',
    h1: 'Lease a Space at SHRINEVA',
    priority: 0.9,
    changefreq: 'weekly',
  },
  {
    path: 'property',
    title: 'The Property: 50 ft Frontage, Lift, Parking | SHRINEVA',
    description: `Commercial building on a ${PLAN.plot.areaSqM} sq m plot, Bada Lalpur, Varanasi: about 50 ft frontage on a 24 m road, 8-person lift, 12+ car parking, fire exits, Vastu.`,
    h1: 'A Commercial Building Designed for Flexibility',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: 'spaces',
    title: 'Commercial Floors for Lease, Bada Lalpur | SHRINEVA Varanasi',
    description: 'Three identical open floors at SHRINEVA, each about 3,500 sq ft gross and 3,100 sq ft carpet, in Bada Lalpur, Varanasi. Lease a whole floor or part of one.',
    h1: 'Explore the Space',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: 'spaces/floor-1',
    title: 'Floor 1 Commercial Space, SHRINEVA Bada Lalpur, Varanasi',
    description: floorDesc(1),
    h1: 'Floor 1',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: 'spaces/floor-2',
    title: 'Floor 2 Commercial Space, SHRINEVA Bada Lalpur, Varanasi',
    description: floorDesc(2),
    h1: 'Floor 2',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: 'spaces/floor-3',
    title: 'Floor 3 Commercial Space, SHRINEVA Bada Lalpur, Varanasi',
    description: floorDesc(3),
    h1: 'Floor 3',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: 'walkthrough',
    title: '3D Walkthrough of SHRINEVA Commercial Building, Varanasi',
    description: 'Explore an indicative 3D model of SHRINEVA, Bada Lalpur, Varanasi: orbit the building, open each floor and look around with mouse or touch. May change.',
    h1: '3D Walkthrough',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: 'business-fit',
    title: 'Which Businesses Suit SHRINEVA? Clinics, Banks, Offices',
    description: 'Floor plates at SHRINEVA, Bada Lalpur, Varanasi suit clinics, banks, offices, retail, cafés, coaching and wellness. Every use is subject to approvals.',
    h1: 'Built Around Business Needs',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: 'growth',
    title: 'Projects Near SHRINEVA: Apollo, NIFT, Trade Centre, Varanasi',
    description: 'Sourced status of projects near SHRINEVA, Bada Lalpur: the upcoming Apollo Hospital, NIFT Varanasi campus and Varanasi Trade Centre. No footfall claimed.',
    h1: 'Nearby Projects and Footfall Potential',
    priority: 0.7,
    changefreq: 'monthly',
  },
  {
    path: 'infrastructure',
    title: 'Specifications: Lift, Power, Parking | SHRINEVA, Varanasi',
    description: `Planned provisions at SHRINEVA, Varanasi: ${PLAN.lift.adjective} lift, power with DG backup, internet, ${PLAN.stilt.floorToFloor} ground level and ${PLAN.typical.floorToFloor} floor heights.`,
    h1: 'Built for Serious Operators',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: 'gallery',
    title: 'Gallery: 3D Renders of SHRINEVA, Bada Lalpur, Varanasi',
    description: 'Indicative 3D renders of the SHRINEVA facade by day and night, the ground-level court and lift lobby in Bada Lalpur, Varanasi. Design subject to change.',
    h1: 'Gallery',
    priority: 0.7,
    changefreq: 'monthly',
    image: `${domain}/assets/images/og-shrineva.jpg`,
  },
  {
    path: 'brokers',
    title: 'For Brokers & Tenant Representatives | SHRINEVA, Varanasi',
    description: 'Floors, plans and a direct leasing line for commercial brokers and tenant representatives at SHRINEVA, Bada Lalpur, Varanasi. Register a client brief here.',
    h1: 'For Tenant Representatives & Brokers',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: 'privacy-disclaimer',
    title: 'Privacy Policy & Approvals Disclaimer | SHRINEVA, Varanasi',
    description: 'How SHRINEVA uses enquiry details, plus the statutory approvals, construction status and rendering disclaimers for the Bada Lalpur, Varanasi building.',
    h1: 'Privacy Policy & Disclaimer',
    priority: 0.3,
    changefreq: 'yearly',
  },
  {
    path: 'terms',
    title: 'Terms of Use for the SHRINEVA Leasing Website | Varanasi',
    description: 'Terms of use for the SHRINEVA leasing website: information accuracy, indicative renders and enquiries for the Bada Lalpur, Varanasi commercial building.',
    h1: 'Terms of Use',
    priority: 0.2,
    changefreq: 'yearly',
  },
];

export function seoForPath(path: string): RouteSeo {
  const normalized = path.replace(/^\//, '').replace(/\/$/, '');
  return SEO_ROUTES.find((r) => r.path === normalized) ?? SEO_ROUTES[0];
}

export const SEO_DOMAIN = domain;
