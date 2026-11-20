/**
 * SHRINEVA — Route-level SEO configuration.
 * Consumed by SeoService (runtime) and by scripts/build-seo.js (static per-route
 * HTML shells, sitemap) so crawlers that do not run JavaScript still get the right
 * title, description, canonical and Open Graph tags for every URL.
 */
import { PROPERTY, PLAN } from './property.config';
import { HI } from './hindi.config';
import { PROJECT_STATUS } from './content.config';

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
  /** Page language (default en-IN). */
  lang?: 'en-IN' | 'hi-IN';
  /** sitemap.xml <lastmod> (YYYY-MM-DD): the date the page's content last really changed. Defaults to SITE_UPDATED. */
  lastmod?: string;
  /** hreflang links (also written to sitemap.xml): the English page and its Hindi equivalent point at each other. */
  alternates?: { hreflang: string; href: string }[];
}

const domain = PROPERTY.domain.canonical;

/**
 * The date the site's content last really changed (YYYY-MM-DD). It is the sitemap <lastmod> and the schema.org dateModified.
 * Search engines learn to ignore a lastmod that changes on every build, so it moves only when PROJECT_STATUS.updatedISO does:
 * bump it in content.config.ts whenever the progress, photos or any page text is updated.
 */
export const SITE_UPDATED = PROJECT_STATUS.updatedISO;

/**
 * IndexNow key (https://www.indexnow.org). Bing, Yandex and other engines that take IndexNow pings are told about new and
 * changed pages straight away instead of waiting to re-crawl; the key file is written to the site root by scripts/build-seo.js.
 * The key is public by design. Run `npm run indexnow` (or see README) after each upload.
 */
export const INDEXNOW_KEY = 'cbec100c58ec9d58d1b2b903b2ed6baf';
const LANG_ALTERNATES = [
  { hreflang: 'en-IN', href: `${domain}/` },
  { hreflang: 'hi-IN', href: `${domain}/${HI.path}` },
  { hreflang: 'x-default', href: `${domain}/` },
];

export const SEO_ROUTES: RouteSeo[] = [
  {
    path: '',
    title: 'Commercial Space for Rent in Varanasi | SHRINEVA Bada Lalpur',
    description: 'Commercial space for rent in Bada Lalpur, Varanasi: open floors of about 3,500 sq ft on a 24 m north-facing road, opposite the upcoming Apollo Hospital.',
    h1: 'Commercial space for rent & lease in Bada Lalpur, Varanasi',
    priority: 1.0,
    changefreq: 'weekly',
    alternates: LANG_ALTERNATES,
  },
  {
    path: 'floor-plans',
    title: 'Floor Plans & Area: Commercial Building, Varanasi | SHRINEVA',
    description: 'Floor plans for SHRINEVA, Varanasi: ground level and three identical open floors of about 3,500 sq ft gross, with lift, fire exit and parking. PDF.',
    h1: 'Floor Plans',
    priority: 0.9,
    changefreq: 'monthly',
    image: `${domain}/assets/images/og-shrineva.jpg`,
  },
  {
    path: 'healthcare-diagnostic-space',
    title: 'Clinic & Lab Space for Rent Near Upcoming Apollo | SHRINEVA',
    description: 'Space for rent for clinics, pathology labs and diagnostic centres opposite the upcoming Apollo Hospital, Bada Lalpur, Varanasi. Open floors, lift, parking.',
    h1: 'Clinic, Pathology Lab & Diagnostic Space Opposite the Upcoming Apollo Hospital, Varanasi',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: 'office-bank-coaching-space',
    title: 'Office Space for Rent in Varanasi, Bada Lalpur | SHRINEVA',
    description: 'Office, bank branch and coaching space for rent in Bada Lalpur, Varanasi: open floors of about 3,500 sq ft, 50 ft frontage, lift and 12+ car parking.',
    h1: 'Bare-Shell Office, Bank Branch & Coaching Institute Space in Varanasi',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: 'retail-showroom-cafe-space',
    title: 'Showroom & Shop Space for Rent Near NIFT Varanasi | SHRINEVA',
    description: 'Showroom, shop and café space for rent near NIFT Varanasi: 50 ft frontage on a 24 m road in Bada Lalpur, with parking and a lift. Food use needs approvals.',
    h1: 'Main-Road Showroom, Retail & Café Space Near NIFT Varanasi',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: 'location-contact',
    title: 'Location: Near Ring Road, NIFT, Upcoming Apollo | SHRINEVA',
    description: 'Find SHRINEVA in Bada Lalpur, Varanasi, on a 24 m road: map, distances to NIFT, the upcoming Apollo Hospital and Ring Road, plus a site visit booking form.',
    h1: 'Location, Map & Site Visit',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: 'leasing',
    title: 'Commercial Hall & Floor for Rent in Varanasi | SHRINEVA',
    description: 'Rent or lease a whole floor or part of a floor at SHRINEVA, Bada Lalpur, Varanasi. Open-shell floors of about 3,500 sq ft each; terms on request.',
    h1: 'Lease a Space at SHRINEVA',
    priority: 0.9,
    changefreq: 'weekly',
  },
  {
    path: 'walkthrough',
    title: '3D Walkthrough: SHRINEVA Building, Bada Lalpur, Varanasi',
    description: 'Walk through the final 3D design of SHRINEVA, Bada Lalpur, Varanasi, from the road to the lift lobby, with zoom and a plan. Indicative; may change.',
    h1: 'Walk through SHRINEVA before you visit',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: HI.path,
    title: HI.title,
    description: HI.description,
    h1: HI.h1,
    priority: 0.8,
    changefreq: 'monthly',
    lang: 'hi-IN',
    alternates: LANG_ALTERNATES,
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
