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
const floorSqFt = Math.round(PLAN.typical.floorArea.sqft).toLocaleString('en-IN');
const carpetSqFt = Math.round(PLAN.typical.carpet.sqft).toLocaleString('en-IN');

const floorDesc = (n: number) =>
  `Floor ${n} at SHRINEVA, Bada Lalpur, Varanasi: ${floorSqFt} sq ft floor area (${carpetSqFt} sq ft carpet), one open floor plate with a 40 ft glass frontage on a ${PLAN.plot.roadWidthM} m road.`;

export const SEO_ROUTES: RouteSeo[] = [
  {
    path: '',
    title: 'SHRINEVA | Commercial Space for Lease, Bada Lalpur, Varanasi',
    description: `Whole commercial floors of ${floorSqFt} sq ft on a ${PLAN.plot.roadWidthM} m road in Bada Lalpur, Varanasi, about 60–70 m from Apollo Hospital and NIFT. Floor plans, 3D renders and leasing.`,
    h1: 'SHRINEVA — Commercial space for lease in Bada Lalpur, Varanasi',
    priority: 1.0,
    changefreq: 'weekly',
  },
  {
    path: 'property',
    title: 'The Property | SHRINEVA, Stilt + 3 Floors, Bada Lalpur',
    description: `A stilt + 3 commercial building on a ${PLAN.plot.areaSqM} sq m VDA-approved plot with ${PLAN.plot.frontage} frontage on a ${PLAN.plot.roadWidthM} m road. ${PLAN.lift.capacity} lift, ${floorSqFt} sq ft floors, 25+ car parking.`,
    h1: 'A Commercial Building Designed for Flexibility',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: 'spaces',
    title: 'Explore the Space | Commercial Floors at SHRINEVA, Varanasi',
    description: `Three identical commercial floors at SHRINEVA, each ${floorSqFt} sq ft (${carpetSqFt} sq ft carpet), above an open stilt level in Bada Lalpur, Varanasi. Whole-floor or divided as required.`,
    h1: 'Explore the Space',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: 'spaces/floor-1',
    title: 'Floor 1 | SHRINEVA Commercial Space, Bada Lalpur, Varanasi',
    description: floorDesc(1),
    h1: 'Floor 1',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: 'spaces/floor-2',
    title: 'Floor 2 | SHRINEVA Commercial Space, Bada Lalpur, Varanasi',
    description: floorDesc(2),
    h1: 'Floor 2',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: 'spaces/floor-3',
    title: 'Floor 3 | SHRINEVA Commercial Space, Bada Lalpur, Varanasi',
    description: floorDesc(3),
    h1: 'Floor 3',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: 'floor-plans',
    title: 'Floor Plans (2D & 3D) | SHRINEVA, Bada Lalpur, Varanasi',
    description: `Architect's stilt and first-floor plans in 2D, 3D and top view, with area statements: ${floorSqFt} sq ft floor area and ${carpetSqFt} sq ft carpet per floor. Download the plans as a PDF.`,
    h1: 'Floor Plans',
    priority: 0.9,
    changefreq: 'monthly',
    image: `${domain}/assets/images/og-shrineva.jpg`,
  },
  {
    path: 'location',
    title: 'Location | SHRINEVA near Apollo Hospital & NIFT, Varanasi',
    description: 'SHRINEVA is on a 24 m road in Bada Lalpur, about 60–70 m from Apollo Hospital and NIFT, 330 m from the Trade Centre and 1 km by road from Ring Road. Airport 19 km, Junction 9 km.',
    h1: 'Three Anchors. One Address.',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: 'growth',
    title: 'Growth Story | Apollo, NIFT & Trade Centre, Bada Lalpur',
    description: 'How Bada Lalpur, Varanasi is changing: the operating Trade Centre, Apollo Hospital (400 beds) and the NIFT campus under construction, and the demand they may bring.',
    h1: 'A Location Positioned for Growth',
    priority: 0.7,
    changefreq: 'monthly',
  },
  {
    path: 'business-fit',
    title: 'Business Fit | Clinics, Offices, Cafés, Stays at SHRINEVA',
    description: 'Healthcare, banking, cafés and restaurants, offices, education, retail and possible hotel or studio-apartment formats: how the whole-floor plates at SHRINEVA, Varanasi suit each.',
    h1: 'Built Around Business Needs',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: 'infrastructure',
    title: 'Infrastructure & Specifications | SHRINEVA, Varanasi',
    description: `DG backup, three-phase power, water, internet readiness, HVAC provision, an ${PLAN.lift.capacity} lift, ${PLAN.stilt.floorToFloor} stilt and ${PLAN.typical.floorToFloor} floor heights at SHRINEVA, Bada Lalpur.`,
    h1: 'Built for Serious Operators',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: 'gallery',
    title: 'Gallery | 3D Renders of SHRINEVA, Bada Lalpur, Varanasi',
    description: 'Indicative 3D renders of the SHRINEVA façade by day and night, the stilt court with its ghat mural and shrine, and the lift lobby. Design subject to change.',
    h1: 'Gallery',
    priority: 0.7,
    changefreq: 'monthly',
    image: `${domain}/assets/images/og-shrineva.jpg`,
  },
  {
    path: 'leasing',
    title: 'Leasing | Lease Commercial Space at SHRINEVA, Varanasi',
    description: `Lease a whole ${floorSqFt} sq ft floor at SHRINEVA, Bada Lalpur, Varanasi, or discuss dividing it. Long-term leases accepted. Commercial terms on request.`,
    h1: 'Lease a Space at SHRINEVA',
    priority: 0.9,
    changefreq: 'weekly',
  },
  {
    path: 'brokers',
    title: 'Brokers & Tenant Representatives | SHRINEVA, Varanasi',
    description: 'Available floors, plans and a direct leasing channel for tenant-representation consultants and commercial brokers at SHRINEVA, Bada Lalpur, Varanasi.',
    h1: 'For Tenant Representatives & Brokers',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: 'faq',
    title: 'FAQ | Leasing, Floors, Parking & Location at SHRINEVA',
    description: 'Answers on floor size, carpet area, parking, lift, power, F&B provisions, hotel and studio-apartment possibilities, and Apollo and NIFT timelines at SHRINEVA, Varanasi.',
    h1: 'Frequently Asked Questions',
    priority: 0.7,
    changefreq: 'monthly',
  },
  {
    path: 'contact',
    title: 'Contact & Site Visit | SHRINEVA, Bada Lalpur, Varanasi',
    description: `Schedule a site visit or request the leasing pack for SHRINEVA. Call ${PROPERTY.contact.phoneDisplay} or ${PROPERTY.contact.phone2Display}, or WhatsApp the leasing team.`,
    h1: "Let's Discuss Your Space",
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: 'privacy',
    title: 'Privacy Policy | SHRINEVA',
    description: 'How SHRINEVA collects and uses enquiry information submitted through srineva.com.',
    h1: 'Privacy Policy',
    priority: 0.2,
    changefreq: 'yearly',
  },
  {
    path: 'terms',
    title: 'Terms of Use | SHRINEVA',
    description: 'Terms of use for the SHRINEVA commercial leasing website.',
    h1: 'Terms of Use',
    priority: 0.2,
    changefreq: 'yearly',
  },
  {
    path: 'disclaimer',
    title: 'Disclaimer | SHRINEVA',
    description: 'Area, rendering, specification and future-development disclaimers for SHRINEVA, Bada Lalpur, Varanasi.',
    h1: 'Disclaimer',
    priority: 0.2,
    changefreq: 'yearly',
  },
];

export function seoForPath(path: string): RouteSeo {
  const normalized = path.replace(/^\//, '').replace(/\/$/, '');
  return SEO_ROUTES.find((r) => r.path === normalized) ?? SEO_ROUTES[0];
}

export const SEO_DOMAIN = domain;
