import { seoForPath, SEO_DOMAIN, SEO_ROUTES } from '../../config/seo.config';
import { PROPERTY, PLAN } from '../../config/property.config';
import { RENDERS, TOUR_VIDEO } from '../../config/media.config';
import { NEARBY_DISTANCES } from '../../config/location.config';

/**
 * Structured data (JSON-LD) for every route. Pure functions with no Angular imports so the same
 * graph is used at runtime (SeoService) and written into the static HTML shells by scripts/build-seo.js.
 */
export function buildGraph(path: string, canonical: string) {
  const route = seoForPath(path);
  const org = {
    '@type': 'Organization',
    '@id': `${SEO_DOMAIN}/#organization`,
    name: PROPERTY.brand.name,
    url: `${SEO_DOMAIN}/`,
    logo: `${SEO_DOMAIN}/${PROPERTY.images.logo}`,
    ...(PROPERTY.contact.publicEmail ? { email: PROPERTY.contact.publicEmail } : {}),
    telephone: PROPERTY.contact.phoneE164,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'leasing enquiries',
        telephone: PROPERTY.contact.phoneE164,
        ...(PROPERTY.contact.publicEmail ? { email: PROPERTY.contact.publicEmail } : {}),
        areaServed: 'IN',
        availableLanguage: ['en', 'hi'],
      },
      { '@type': 'ContactPoint', contactType: 'leasing enquiries', telephone: PROPERTY.contact.phone2E164, areaServed: 'IN', availableLanguage: ['en', 'hi'] },
    ],
  };

  const place = {
    '@type': 'Place',
    '@id': `${SEO_DOMAIN}/#place`,
    name: `${PROPERTY.brand.name} — commercial building, Bada Lalpur, Varanasi`,
    description: `VDA-approved Parking + 3 commercial building on a ${PLAN.plot.areaSqM} sq m plot with ${PLAN.plot.frontage} frontage on a ${PLAN.plot.roadWidthM} m road, about 60–70 m from the Apollo Medics hospital site and NIFT Varanasi. Whole floors of ${PLAN.typical.floorArea.sqft} sq ft.`,
    url: `${SEO_DOMAIN}/`,
    telephone: PROPERTY.contact.phoneE164,
    hasMap: PROPERTY.address.googleMapsUrl,
    image: [PROPERTY.images.og, ...RENDERS.slice(0, 3).map((r) => `${SEO_DOMAIN}/${r.src}`)],
    address: {
      '@type': 'PostalAddress',
      streetAddress: PROPERTY.address.line1,
      addressLocality: 'Varanasi',
      addressRegion: PROPERTY.address.state,
      postalCode: PROPERTY.address.pin,
      addressCountry: 'IN',
    },
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Passenger lift', value: PLAN.lift.capacity },
    ],
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Plot area', value: PLAN.plot.areaSqM, unitText: 'square metres' },
      { '@type': 'PropertyValue', name: 'Floor area per floor', value: PLAN.typical.floorArea.sqft, unitText: 'square feet' },
      { '@type': 'PropertyValue', name: 'Carpet area per floor (computed)', value: PLAN.typical.carpet.sqft, unitText: 'square feet' },
      { '@type': 'PropertyValue', name: 'Road frontage', value: PLAN.plot.frontage, unitText: 'about 50 feet' },
      { '@type': 'PropertyValue', name: 'Road width', value: PLAN.plot.roadWidthM, unitText: 'metres' },
    ],
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${SEO_DOMAIN}/#website`,
    url: `${SEO_DOMAIN}/`,
    name: PROPERTY.brand.name,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SEO_DOMAIN}/#organization` },
  };

  const webpage = {
    '@type': path === 'contact' ? 'ContactPage' : 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: route.title,
    description: route.description,
    isPartOf: { '@id': `${SEO_DOMAIN}/#website` },
    about: { '@id': `${SEO_DOMAIN}/#place` },
    primaryImageOfPage: route.image ?? PROPERTY.images.og,
    inLanguage: 'en-IN',
    breadcrumb: { '@id': `${canonical}#breadcrumb` },
  };

  const graph: unknown[] = [org, website, place, webpage, breadcrumbs(path, canonical)];

  if (!path) graph.push(...homeExtras());
  if (path === 'gallery') graph.push(gallerySchema());

  return { '@context': 'https://schema.org', '@graph': graph.filter(Boolean) };
}

function breadcrumbs(path: string, canonical: string) {
  const items: { '@type': string; position: number; name: string; item: string }[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SEO_DOMAIN}/` },
  ];
  if (path) {
    const parts = path.split('/');
    if (parts.length > 1) {
      const parent = SEO_ROUTES.find((r) => r.path === parts[0]);
      items.push({ '@type': 'ListItem', position: 2, name: parent?.h1 ?? parts[0], item: `${SEO_DOMAIN}/${parts[0]}` });
    }
    const route = SEO_ROUTES.find((r) => r.path === path);
    items.push({ '@type': 'ListItem', position: items.length + 1, name: route?.h1 ?? path, item: canonical });
  }
  return { '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`, itemListElement: items };
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

/** Home only: the project status and the short distance list, as plain structured facts (no FAQ markup). */
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
    ...(TOUR_VIDEO.available ? [videoSchema()] : []),
  ];
}

/** The short film, once it is published (TOUR_VIDEO.available). */
function videoSchema() {
  const v = TOUR_VIDEO, m = Math.floor(v.durationSec / 60), sec = Math.round(v.durationSec % 60);
  return {
    '@type': 'VideoObject',
    '@id': `${SEO_DOMAIN}/#film`,
    name: v.title,
    description: v.description,
    thumbnailUrl: `${SEO_DOMAIN}/${v.poster}`,
    contentUrl: `${SEO_DOMAIN}/${v.src}`,
    uploadDate: v.uploadDate,
    duration: `PT${m ? `${m}M` : ''}${sec}S`,
    width: v.posterWidth,
    height: v.posterHeight,
    inLanguage: 'en-IN',
  };
}
