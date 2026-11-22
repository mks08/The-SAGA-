import { seoForPath, SEO_DOMAIN, SEO_ROUTES, SITE_UPDATED } from '../../config/seo.config';
import { PROPERTY, PLAN, MARKETING_AREA } from '../../config/property.config';
import { RENDERS, SITE_PHOTOS } from '../../config/media.config';
import { PROJECT_STATUS } from '../../config/content.config';
import { NEARBY_DISTANCES } from '../../config/location.config';
import { faqForPath } from '../../config/faq.config';
import { LANDING_PAGES, landingByPath } from '../../config/landing.config';

/**
 * Structured data (JSON-LD) for every route. Pure functions with no Angular imports so the same
 * graph is used at runtime (SeoService) and written into the static HTML shells by scripts/build-seo.js.
 *
 * Graph per page: Organization (the leasing contact: phones, email, languages, service area), WebSite, Place (the building: address,
 * map, geo and its measured facts as PropertyValue), WebPage, BreadcrumbList, plus - where the page shows them - a RealEstateListing
 * (a page type) whose Offer is a lease offer, and a FAQPage whose questions are exactly the visible FAQ.
 * Deliberately not used: RealEstateAgent (the owner leases directly, it is not an agent), Accommodation (the floors are
 * commercial open shells, not lodging) and LocalBusiness (it would claim a staffed walk-in office with opening hours, and the owner has
 * not said there is one; site visits are by appointment. If a leasing office with visiting hours opens at the site, change the
 * Organization to LocalBusiness and add its hours).
 * Facts only: no approvals, rents or footfall are asserted. The completion month is stated only as a target, subject to approvals
 * (PROJECT_STATUS), and the Apollo Hospital is "upcoming". dateModified is SITE_UPDATED, the same date the sitemap uses.
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
    '@type': 'Organization',
    '@id': ID.org,
    name: `${PROPERTY.brand.name} Leasing`,
    alternateName: PROPERTY.brand.name,
    description: `Leasing enquiries for ${PROPERTY.brand.name}, a commercial building on a 24 m wide north-facing road in Bada Lalpur, Varanasi, opposite the upcoming Apollo Hospital. Floors of ${MARKETING_AREA.gross} for lease, whole or in part.`,
    url: `${SEO_DOMAIN}/`,
    logo: abs(PROPERTY.images.logo),
    image: [PROPERTY.images.og, ...RENDERS.slice(0, 3).map((r) => abs(r.src))],
    telephone: PROPERTY.contact.phoneE164,
    ...(PROPERTY.contact.publicEmail ? { email: PROPERTY.contact.publicEmail } : {}),
    address: address(),
    areaServed: [
      { '@type': 'City', name: 'Varanasi' },
      { '@type': 'AdministrativeArea', name: 'Uttar Pradesh' },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'leasing enquiries',
      telephone: PROPERTY.contact.phoneE164,
      ...(PROPERTY.contact.publicEmail ? { email: PROPERTY.contact.publicEmail } : {}),
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
    location: { '@id': ID.place },
    ...(sameAs.length ? { sameAs } : {}),
  };

  const place = {
    '@type': 'Place',
    '@id': ID.place,
    name: `${PROPERTY.brand.name}, commercial building, Bada Lalpur, Varanasi`,
    description: `Commercial building under construction on a ${PLAN.plot.areaSqM} sq m plot at Plot No. D-15, Lalpur Housing Scheme, with ${PLAN.plot.frontage} of frontage on a ${PLAN.plot.roadWidthM} m wide north-facing road, opposite the upcoming Apollo Hospital and about 100 m from NIFT Varanasi. Three upper floors of ${MARKETING_AREA.gross} each.`,
    url: `${SEO_DOMAIN}/`,
    telephone: PROPERTY.contact.phoneE164,
    hasMap: PROPERTY.address.googleMapsUrl,
    image: [PROPERTY.images.og, ...RENDERS.slice(0, 3).map((r) => abs(r.src))],
    photo: SITE_PHOTOS.slice(0, 3).map(sitePhoto),
    containedInPlace: { '@type': 'City', name: 'Varanasi', address: { '@type': 'PostalAddress', addressRegion: PROPERTY.address.state, addressCountry: 'IN' } },
    address: address(),
    ...(geo() ? { geo: geo() } : {}),
    amenityFeature: amenities(),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Construction status', value: 'Concrete structure complete; brickwork, façade, lift and services in progress', description: `As of ${PROJECT_STATUS.updated}.` },
      { '@type': 'PropertyValue', name: PROJECT_STATUS.completion.label, value: PROJECT_STATUS.completion.value, description: `${PROJECT_STATUS.completion.note}. A target, not a promise: dates may change.` },
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
    dateModified: route.lastmod ?? SITE_UPDATED,
    isPartOf: { '@id': ID.website },
    about: { '@id': ID.place },
    primaryImageOfPage: route.image ?? PROPERTY.images.og,
    inLanguage: route.lang ?? 'en-IN',
    breadcrumb: { '@id': `${canonical}#breadcrumb` },
  };

  const graph: unknown[] = [org, website, place, webpage, breadcrumbs(path, canonical)];

  if (LISTING_PATHS.has(path)) graph.push(listing(path, canonical));
  if (!path) graph.push(...homeExtras(), sitePhotoGallery(canonical));
  if (path === 'walkthrough') graph.push(gallerySchema(), sitePhotoGallery(canonical));

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

/** A real site photograph, dated: tells Google Images and AI assistants these show the building as it stands. */
function sitePhoto(p: { src: string; thumb: string; title: string; alt: string; caption: string; width: number; height: number }) {
  return {
    '@type': 'ImageObject',
    contentUrl: `${SEO_DOMAIN}/${p.src}`,
    thumbnailUrl: `${SEO_DOMAIN}/${p.thumb}`,
    name: p.title,
    description: p.alt,
    caption: `${p.caption} Photographed ${PROJECT_STATUS.photosTaken}.`,
    dateCreated: '2026-11',
    width: p.width,
    height: p.height,
  };
}

function sitePhotoGallery(canonical: string) {
  return {
    '@type': 'ImageGallery',
    '@id': `${canonical}#site-photos`,
    name: `SHRINEVA site photographs, ${PROJECT_STATUS.photosTaken}`,
    about: { '@id': ID.place },
    image: SITE_PHOTOS.map(sitePhoto),
  };
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
