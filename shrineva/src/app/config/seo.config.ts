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
  `Floor ${n} at SHRINEVA, Bada Lalpur, Varanasi: ${floorSqFt} sq ft floor area (${carpetSqFt} sq ft carpet), one open floor plate with a glass front on a ${PLAN.plot.roadWidthM} m road.`;

export const SEO_ROUTES: RouteSeo[] = [
  {
    path: '',
    title: 'Commercial Space for Lease, Bada Lalpur Varanasi | SHRINEVA',
    description: `VDA-approved Parking + 3 building for lease on a ${PLAN.plot.roadWidthM} m road in Bada Lalpur, Varanasi, 60–70 m from the Apollo Medics site and NIFT. ${floorSqFt} sq ft floors, 3D walkthrough.`,
    h1: 'SHRINEVA — Commercial space for lease in Bada Lalpur, Varanasi',
    priority: 1.0,
    changefreq: 'weekly',
  },
  {
    path: 'property',
    title: 'The Property | SHRINEVA, Parking + 3 Floors, Bada Lalpur',
    description: `A VDA-approved Parking + 3 commercial building on a ${PLAN.plot.areaSqM} sq m plot with ${PLAN.plot.frontage} frontage on a ${PLAN.plot.roadWidthM} m road. An ${PLAN.lift.adjective} lift, ${floorSqFt} sq ft floors, ground-level parking.`,
    h1: 'A Commercial Building Designed for Flexibility',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: 'spaces',
    title: 'Explore the Space | Commercial Floors at SHRINEVA, Varanasi',
    description: `Three identical floors at SHRINEVA, each ${floorSqFt} sq ft (${carpetSqFt} sq ft carpet), above an open parking level in Bada Lalpur, Varanasi. Whole floor or divided.`,
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
    description: `Architect's parking-level and typical-floor plans in 2D, 3D and top view: ${floorSqFt} sq ft floor area and ${carpetSqFt} sq ft carpet per floor. Download the PDF.`,
    h1: 'Floor Plans',
    priority: 0.9,
    changefreq: 'monthly',
    image: `${domain}/assets/images/og-shrineva.jpg`,
  },
  {
    path: 'walkthrough',
    title: '3D Walkthrough | Explore SHRINEVA Floors in 3D, Varanasi',
    description: 'Orbit the building, step into the parking level and each floor, and look around with your mouse or finger. An indicative 3D model of SHRINEVA, Bada Lalpur, Varanasi.',
    h1: '3D Walkthrough',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: 'location',
    title: 'Commercial Space near Apollo & NIFT, Varanasi | SHRINEVA',
    description: 'On a 24 m road in Bada Lalpur, Chandmari: about 60–70 m from the Apollo Medics hospital site and NIFT, 330 m from the Trade Centre, 1 km by road from Ring Road.',
    h1: 'Three Anchors. One Address.',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: 'growth',
    title: 'Nearby Projects: Apollo, NIFT, Trade Centre | SHRINEVA',
    description: 'What is being built within 350 m of SHRINEVA, Bada Lalpur: a planned 400-bed Apollo Medics hospital, the NIFT campus and the Trade Centre. Sourced, Oct 2026.',
    h1: 'Nearby Projects and Footfall Potential',
    priority: 0.7,
    changefreq: 'monthly',
  },
  {
    path: 'business-fit',
    title: 'Business Fit | Clinics, Offices, Cafés, Stays at SHRINEVA',
    description: 'Whole-floor plates at SHRINEVA suit clinics, banks, cafés, offices, education and retail in Bada Lalpur, Varanasi. Hotel or studio apartments: a possibility.',
    h1: 'Built Around Business Needs',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: 'infrastructure',
    title: 'Infrastructure & Specifications | SHRINEVA, Varanasi',
    description: `Planned power, DG backup, water, internet and HVAC provisions, an ${PLAN.lift.adjective} lift, ${PLAN.stilt.floorToFloor} parking level and ${PLAN.typical.floorToFloor} floor heights at SHRINEVA, Varanasi.`,
    h1: 'Built for Serious Operators',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: 'gallery',
    title: 'Gallery | 3D Renders of SHRINEVA, Bada Lalpur, Varanasi',
    description: 'Indicative 3D renders of the SHRINEVA façade by day and night, the parking-level court with its ghat mural and shrine, and the lift lobby. Design subject to change.',
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
    description: 'Answers on floor size, carpet area, parking, lift, F&B provisions, hotel and studio-apartment possibilities, and what is being built near SHRINEVA, Varanasi.',
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
    description: 'How SHRINEVA collects and uses enquiry information submitted through this website.',
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
