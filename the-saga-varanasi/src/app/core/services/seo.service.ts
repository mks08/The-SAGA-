import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { seoForPath, SEO_DOMAIN, SEO_ROUTES } from '../../config/seo.config';
import { PROPERTY, PLAN } from '../../config/property.config';
import { FAQS, HOME_FAQ_COUNT } from '../../config/faq.config';
import { RENDERS } from '../../config/media.config';

/**
 * Applies per-route title, description, canonical, Open Graph / Twitter tags and JSON-LD.
 * The same data feeds scripts/build-seo.js, which pre-renders these tags into static
 * HTML shells so crawlers that do not execute JavaScript see them too.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document,
  ) {}

  apply(path: string): void {
    const route = seoForPath(path);
    const canonical = this.canonicalFor(route.path);
    const image = route.image ?? PROPERTY.images.og;
    const imageAlt = route.imageAlt ?? 'SHRINEVA commercial building, Bada Lalpur, Varanasi (indicative 3D render)';

    this.title.setTitle(route.title);
    this.meta.updateTag({ name: 'description', content: route.description });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: PROPERTY.brand.name });
    this.meta.updateTag({ property: 'og:title', content: route.title });
    this.meta.updateTag({ property: 'og:description', content: route.description });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:alt', content: imageAlt });
    this.meta.updateTag({ property: 'og:locale', content: 'en_IN' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: route.title });
    this.meta.updateTag({ name: 'twitter:description', content: route.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.meta.updateTag({ name: 'twitter:image:alt', content: imageAlt });

    this.setCanonical(canonical);
    this.setJsonLd('shrineva-schema', this.graphFor(route.path, canonical));
  }

  private canonicalFor(path: string): string {
    return path ? `${SEO_DOMAIN}/${path}` : `${SEO_DOMAIN}/`;
  }

  private setCanonical(url: string): void {
    let link: HTMLLinkElement | null = this.doc.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(id: string, data: unknown): void {
    let script = this.doc.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = this.doc.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.doc.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  private graphFor(path: string, canonical: string) {
    const route = seoForPath(path);
    const org = {
      '@type': 'Organization',
      '@id': `${SEO_DOMAIN}/#organization`,
      name: PROPERTY.brand.name,
      url: `${SEO_DOMAIN}/`,
      logo: `${SEO_DOMAIN}/${PROPERTY.images.logo}`,
      email: PROPERTY.contact.email,
      telephone: PROPERTY.contact.phoneE164,
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'leasing enquiries',
          telephone: PROPERTY.contact.phoneE164,
          email: PROPERTY.contact.email,
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
      description: `Stilt + 3 commercial building on a ${PLAN.plot.areaSqM} sq m plot with ${PLAN.plot.frontage} frontage on a ${PLAN.plot.roadWidthM} m road, about 60–70 m from Apollo Hospital and NIFT Varanasi. Whole floors of ${PLAN.typical.floorArea.sqft} sq ft.`,
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
        { '@type': 'LocationFeatureSpecification', name: 'Car parking', value: PROPERTY.parking.totalCars },
        { '@type': 'LocationFeatureSpecification', name: 'DG backup', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Three-phase power', value: true },
      ],
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Plot area', value: PLAN.plot.areaSqM, unitText: 'square metres' },
        { '@type': 'PropertyValue', name: 'Floor area per floor', value: PLAN.typical.floorArea.sqft, unitText: 'square feet' },
        { '@type': 'PropertyValue', name: 'Carpet area per floor (computed)', value: PLAN.typical.carpet.sqft, unitText: 'square feet' },
        { '@type': 'PropertyValue', name: 'Road frontage', value: PLAN.plot.frontage },
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
      '@type': path === 'contact' ? 'ContactPage' : path === 'faq' ? 'FAQPage' : 'WebPage',
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

    const graph: unknown[] = [org, website, place, webpage, this.breadcrumbs(path, canonical)];

    if (!path) graph.push(this.faqSchema(HOME_FAQ_COUNT));
    if (path === 'faq') graph.push(this.faqSchema(FAQS.length));
    if (path === 'gallery') graph.push(this.gallerySchema());

    return { '@context': 'https://schema.org', '@graph': graph.filter(Boolean) };
  }

  private breadcrumbs(path: string, canonical: string) {
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

  /** FAQPage schema from the same list the visitor sees. */
  private faqSchema(count: number) {
    return {
      '@type': 'FAQPage',
      mainEntity: FAQS.slice(0, count).map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
  }

  private gallerySchema() {
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
}
