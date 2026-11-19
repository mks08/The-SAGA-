import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { PLAN, PROPERTY } from '../../config/property.config';
import { HERO_DEFAULT, HERO_INTENTS, HeroIntent } from '../../config/landing.config';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-home-hero',
  templateUrl: './home-hero.component.html',
})
export class HomeHeroComponent implements OnDestroy {
  property = PROPERTY;
  plan = PLAN;

  /**
   * Google Ads message match: /?intent=healthcare | office | retail | floor swaps the headline and sub-headline to what the
   * searcher asked for. The canonical URL stays "/" (SeoService builds it from the route path only) and unknown values show
   * the default hero. The static HTML always carries the default hero.
   */
  hero: HeroIntent = HERO_DEFAULT;

  stats = [
    { value: 50, suffix: ' ft', label: 'Road frontage' },
    { value: 24, suffix: ' m', label: 'Wide road' },
    { value: 3500, suffix: '', label: 'Sq ft per floor, approx.' },
  ];

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

  track(name: string) { this.analytics.event(name, { source: 'hero' }); }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
