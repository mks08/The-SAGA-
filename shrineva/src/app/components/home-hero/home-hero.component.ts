import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { PLAN, PROPERTY } from '../../config/property.config';
import { HERO_DEFAULT, HERO_INTENTS, HeroIntent } from '../../config/landing.config';
import { HERO_VIEWS } from '../../config/media.config';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-home-hero',
  templateUrl: './home-hero.component.html',
})
export class HomeHeroComponent implements OnDestroy {
  property = PROPERTY;
  plan = PLAN;

  /** The finalised building by day and by night. Night is shown first (it is also the preloaded image). */
  views = HERO_VIEWS;
  active: 'day' | 'night' = 'night';

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

  openPopup() {
    this.analytics.event('site_visit_click', { source: 'hero' });
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }

  select(id: 'day' | 'night') {
    if (id === this.active) return;
    this.active = id;
    this.analytics.event('hero_view_toggle', { view: id });
  }

  track(name: string) { this.analytics.event(name, { source: 'hero' }); }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
