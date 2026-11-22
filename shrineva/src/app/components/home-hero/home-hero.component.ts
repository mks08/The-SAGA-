import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { PLAN, PROPERTY, waLink } from '../../config/property.config';
import { HERO_DEFAULT, HERO_INTENTS, HeroIntent } from '../../config/landing.config';
import { HERO, HERO_H, HERO_W, MediaItem } from '../../config/media.config';
import { KEY_FACTS } from '../../config/content.config';
import { AnalyticsService } from '../../core/services/analytics.service';
import { openLeadPath, openLightbox } from '../../core/ui-events';

/**
 * Home hero: the answer to "what, where, how big, what next" on the first screen.
 * One render of the building (preloaded, so it paints first), the headline, two actions, the contact line, and the six
 * facts a tenant checks first (frontage, road, parking, lift, floor size, fire exit) in a bar under it.
 */
@Component({
  selector: 'app-home-hero',
  templateUrl: './home-hero.component.html',
})
export class HomeHeroComponent implements OnDestroy {
  property = PROPERTY;
  plan = PLAN;
  image = HERO;
  facts = KEY_FACTS;
  waHref = waLink();

  /** The hero picture as the image viewer shows it (press the picture to enlarge it). */
  private heroItem: MediaItem = {
    id: 'hero', group: 'Home', title: 'SHRINEVA, from the road',
    caption: 'The building from the 24 m road: open ground level, three glass floors and a sandstone side wall.',
    alt: HERO.alt, src: HERO.src1920, thumb: HERO.src960, width: HERO_W, height: HERO_H,
  };

  /**
   * Google Ads message match: /?intent=healthcare | office | retail | floor swaps the headline and sub-headline to what the
   * searcher asked for. The canonical URL stays "/" (SeoService builds it from the route path only) and unknown values show
   * the default hero. The static HTML always carries the default hero.
   */
  hero: HeroIntent = HERO_DEFAULT;

  private sub: Subscription;

  constructor(private analytics: AnalyticsService, route: ActivatedRoute) {
    this.sub = route.queryParamMap.subscribe((q) => {
      const key = (q.get('intent') || '').trim().toLowerCase();
      this.hero = HERO_INTENTS[key] ?? HERO_DEFAULT;
    });
  }

  enlarge(): void {
    openLightbox({ items: [this.heroItem], disclaimer: 'Indicative 3D render. Construction is ongoing and the design is subject to change.' });
  }

  openPopup() {
    this.analytics.event('site_visit_click', { source: 'hero' });
    openLeadPath({ source: 'hero', path: 'visit' });
  }

  openBrochure() {
    this.analytics.event('brochure_click', { source: 'hero' });
    openLeadPath({ source: 'hero', path: 'brochure' });
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
