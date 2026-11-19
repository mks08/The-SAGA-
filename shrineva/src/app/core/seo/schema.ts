import { seoForPath, SEO_DOMAIN, SEO_ROUTES } from '../../config/seo.config';
import { PROPERTY, PLAN, MARKETING_AREA } from '../../config/property.config';
import { RENDERS, BROCHURE } from '../../config/media.config';
import { NEARBY_DISTANCES } from '../../config/location.config';
import { faqForPath } from '../../config/faq.config';
import { LANDING_PAGES, landingByPath } from '../../config/landing.config';

/**
 * Structured data (JSON-LD) for every route. Pure functions with no Angular imports so the same
 * graph is used at runtime (SeoService) and written into the static HTML shells by scripts/build-seo.js.
 *
 * Graph per page: LocalBusiness (the leasing office: address, geo, hours, phones, service area), WebSite, Place (the building,
 * with its measured facts as PropertyValue), WebPage, BreadcrumbList, plus - where the page shows them - a RealEstateListing
 * (a page type) whose Offer is a lease offer, and a FAQPage whose questions are exactly the visible FAQ.
 * Deliberately not used: RealEstateAgent (the owner leases directly, it is not an agent) and Accommodation (the floors are
 * commercial open shells, not lodging).
 * Facts only: no approvals, rents, footfall or completion dates are asserted; the Apollo Hospital is "upcoming".
 */
const ID = {
  org: `${SEO_DOMAIN}/#organization`,
  website: `${SEO_DOMAIN}/#website`,
  place: `${SEO_DOMAIN}/#place`,
};

/** Pages that carry the lease listing / offer. */
const LISTING_PATHS = new Set(['', 'leasing', ...LANDING_PAGES.map((l) => l.path)]);

const abs = (p: string) => (/^https?:/.test(p) ? p : `${SEO_DOMAIN}/${p}`);

const amenities = () => [
  { '@type': 'LocationFeatureSpecification', name: 'Passenger lift', value: PLAN.lift.capacity },
  { '@type': 'LocationFeatureSpecification', name: 'Parking for 12+ cars at ground level', value: true },
  { '@type': 'LocationFeatureSpecification', name: 'Fire exit on every level', value: true },
  { '@type': 'LocationFeatureSpecification', name: 'Vastu-compliant layout', value: true },
  { '@type': 'LocationFeatureSpecification', name: 'Open-plan commercial floor plates with flexible tenant layouts', value: true },
  { '@type': 'LocationFeatureSpecification', name: 'Frontage on a 24 m wide road', value: PLAN.plot.frontage },
];

function address() {
  return {
    '@type': 'PostalAddress',
    streetAddress: PROPERTY.address.line1,
    addressLocality: 'Varanasi',
    addressRegion: PROPERTY.address.state,
    postalCode: PROPERTY.address.pin,
    addressCountry: 'IN',
  };
}

function geo() {
  const { lat, lng } = PROPERTY.address;
  return lat !== null && lng !== null ? { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } : undefined;
}

export function buildGraph(path: string, canonical: string) {
  const route = seoForPath(path);
  const sameAs = (PROPERTY.sameAs || []).filter((u) => /^https:\/\//.test(u));

  const org = {
    '@type': 'LocalBusiness',
    '@id': ID.org,
    name: `${PROPERTY.brand.name} Leasing`,
    alternateName: PROPERTY.brand.name,
    description: `Leasing office for ${PROPERTY.brand.name}, a commercial building on Stadium Road, Bada Lalpur, Varanasi, opposite the upcoming Apollo Hospital. Floors of ${MARKETING_AREA.gross} for lease, whole or in part.`,
    url: `${SEO_DOMAIN}/`,
    logo: abs(PROPERTY.images.logo),
    image: [PROPERTY.images.og, ...RENDERS.slice(0, 3).map((r) => abs(r.src))],
    telephone: PROPERTY.contact.phoneE164,
    ...(PROPERTY.contact.publicEmail ? { email: PROPERTY.contact.publicEmail } : {}),
    address: address(),
    ...(geo() ? { geo: geo() } : {}),
    hasMap: PROPERTY.address.googleMapsUrl,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: PROPERTY.contact.hoursSpec.days,
        opens: PROPERTY.contact.hoursSpec.opens,
        closes: PROPERTY.contact.hoursSpec.closes,
      },
    ],
    areaServed: [
      { '@type': 'City', name: 'Varanasi' },
      { '@type': 'AdministrativeArea', name: 'Uttar Pradesh' },
    ],
    contactPoint: [PROPERTY.contact.phoneE164, PROPERTY.contact.phone2E164].map((telephone) => ({
      '@type': 'ContactPoint',
      contactType: 'leasing enquiries',
      telephone,
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    })),
    amenityFeature: amenities(),
    location: { '@id': ID.place },
    ...(sameAs.length ? { sameAs } : {}),
  };

  const place = {
    '@type': 'Place',
    '@id': ID.place,
    name: `${PROPERTY.brand.name}, commercial building, Bada Lalpur, Varanasi`,
    description: `Commercial building under construction on a ${PLAN.plot.areaSqM} sq m plot at Plot No. D-15, Lalpur Housing Scheme, Stadium Road, with ${PLAN.plot.frontage} of frontage on a ${PLAN.plot.roadWidthM} m wide road, opposite the upcoming Apollo Hospital and about 100 m from NIFT Varanasi. Three upper floors of ${MARKETING_AREA.gross} each.`,
    url: `${SEO_DOMAIN}/`,
    telephone: PROPERTY.contact.phoneE164,
    hasMap: PROPERTY.address.googleMapsUrl,
    image: [PROPERTY.images.og, ...RENDERS.slice(0, 3).map((r) => abs(r.src))],
    address: address(),
    ...(geo() ? { geo: geo() } : {}),
    amenityFeature: amenities(),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Plot area', value: PLAN.plot.areaSqM, unitText: 'square metres' },
      { '@type': 'PropertyValue', name: 'Gross area per upper floor (approximate)', value: MARKETING_AREA.grossNum, unitText: 'square feet' },
      { '@type': 'PropertyValue', name: 'Carpet area per upper floor (approximate)', value: MARKETING_AREA.carpetNum, unitText: 'square feet' },
      { '@type': 'PropertyValue', name: 'Road frontage (approximate)', value: PLAN.plot.frontageFt, unitText: 'feet' },
      { '@type': 'PropertyValue', name: 'Road width', value: PLAN.plot.roadWidthM, unitText: 'metres' },
    ],
  };

  const website = {
    '@type': 'WebSite',
    '@id': ID.website,
    url: `${SEO_DOMAIN}/`,
    name: PROPERTY.brand.name,
    inLanguage: ['en-IN', 'hi-IN'],
    publisher: { '@id': ID.org },
  };

  const webpage = {
    '@type': path === 'location-contact' ? 'ContactPage' : 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: route.title,
    description: route.description,
    isPartOf: { '@id': ID.website },
    about: { '@id': ID.place },
    primaryImageOfPage: route.image ?? PROPERTY.images.og,
    inLanguage: route.lang ?? 'en-IN',
    breadcrumb: { '@id': `${canonical}#breadcrumb` },
  };

  const graph: unknown[] = [org, website, place, webpage, breadcrumbs(path, canonical)];

  if (LISTING_PATHS.has(path)) graph.push(listing(path, canonical));
  if (!path) graph.push(...homeExtras());
  if (path === 'walkthrough') graph.push(gallerySchema());
  if (path === 'leasing' || path === 'floor-plans') graph.push(...downloads(canonical));

  const faqs = faqForPath(path, landingByPath(path)?.faq ?? []);
  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      inLanguage: route.lang ?? 'en-IN',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph.filter(Boolean) };
}

/** The lease listing: floors of about 3,500 sq ft, price on request (no rent is published or implied). */
function listing(path: string, canonical: string) {
  return {
    '@type': 'RealEstateListing',
    '@id': `${canonical}#listing`,
    name: 'Commercial floors for lease at SHRINEVA, Bada Lalpur, Varanasi',
    description: `Three upper floors of ${MARKETING_AREA.gross} gross (${MARKETING_AREA.carpet} carpet) each, offered as open shells for lease, whole or in part. Construction is ongoing. Use is subject to approvals.`,
    url: path ? canonical : `${SEO_DOMAIN}/leasing`,
    about: { '@id': ID.place },
    offers: {
      '@type': 'Offer',
      '@id': `${canonical}#offer`,
      businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
      seller: { '@id': ID.org },
      areaServed: { '@type': 'City', name: 'Varanasi' },
      name: 'Lease of commercial floor space at SHRINEVA (open shell, whole or in part)',
      description: `Floors 1, 2 and 3, each ${MARKETING_AREA.gross} gross, offered as open shells. Lease terms and rent are shared by the leasing team on request.`,
    },
  };
}

function crumbName(path: string): string {
  const landing = landingByPath(path);
  if (landing) return landing.navLabel;
  const route = SEO_ROUTES.find((r) => r.path === path);
  if (path === 'hi') return 'हिंदी';
  if (path === 'location-contact') return 'Location & Site Visit';
  if (path === 'privacy-disclaimer') return 'Privacy & Disclaimer';
  if (path === 'floor-plans') return 'Floor Plans';
  return route?.h1 ?? path;
}

function breadcrumbs(path: string, canonical: string) {
  const items: { '@type': string; position: number; name: string; item: string }[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SEO_DOMAIN}/` },
  ];
  if (path) {
    const parts = path.split('/');
    if (parts.length > 1) {
      items.push({ '@type': 'ListItem', position: 2, name: crumbName(parts[0]), item: `${SEO_DOMAIN}/${parts[0]}` });
    }
    items.push({ '@type': 'ListItem', position: items.length + 1, name: crumbName(path), item: canonical });
  }
  return { '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`, itemListElement: items };
}

/** The two PDFs offered for download. */
function downloads(canonical: string) {
  const doc = (id: string, name: string, description: string, href: string) => ({
    '@type': 'DigitalDocument',
    '@id': `${canonical}#${id}`,
    name,
    description,
    url: abs(href),
    encodingFormat: 'application/pdf',
    inLanguage: 'en-IN',
    about: { '@id': ID.place },
    publisher: { '@id': ID.org },
  });
  return [
    doc('brochure', 'SHRINEVA brochure (PDF)', `Six pages: the final 3D renders, floor plans and areas, specifications and location. Renders are indicative and subject to change.`, BROCHURE.href),
    doc('floor-plans-pdf', 'SHRINEVA floor plans (PDF)', 'Ground-level and typical upper-floor plans with areas. Areas are approximate and subject to final measurement.', BROCHURE.plansHref),
  ];
}

function gallerySchema() {
  return {
    '@type': 'ImageGallery',
    name: 'SHRINEVA indicative 3D renders',
    image: RENDERS.map((r) => ({
      '@type': 'ImageObject',
      contentUrl: `${SEO_DOMAIN}/${r.src}`,
      name: r.title,
      description: r.alt,
      caption: r.caption,
      width: r.width,
      height: r.height,
    })),
  };
}

/** Home only: the short distance list as plain structured facts. */
function homeExtras() {
  return [
    {
      '@type': 'ItemList',
      '@id': `${SEO_DOMAIN}/#nearby`,
      name: 'Nearby places and approximate distances from SHRINEVA',
      itemListElement: NEARBY_DISTANCES.map((d, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: d.name,
        description: `${d.value}${d.note ? ` (${d.note})` : ''}`,
      })),
    },
  ];
}
