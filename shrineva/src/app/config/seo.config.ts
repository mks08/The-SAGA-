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
    path: 'walkthrough',
    title: '3D Walkthrough: SHRINEVA Building, Bada Lalpur, Varanasi',
    description: 'Walk through the final 3D design of SHRINEVA, Bada Lalpur, Varanasi, from the road to the lift lobby, by day and night. Indicative; subject to change.',
    h1: 'Walk through SHRINEVA before you visit',
    priority: 0.8,
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
