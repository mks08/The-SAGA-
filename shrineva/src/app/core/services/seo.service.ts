import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { seoForPath, SEO_DOMAIN } from '../../config/seo.config';
import { PROPERTY } from '../../config/property.config';
import { buildGraph } from '../seo/schema';

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
    this.setJsonLd('shrineva-schema', buildGraph(route.path, canonical));
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
}
