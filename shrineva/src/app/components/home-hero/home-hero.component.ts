import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
export class HomeHeroComponent implements AfterViewInit, OnDestroy {
  property = PROPERTY;
  plan = PLAN;

  /** The finalised building at golden hour and by night. Golden hour is shown first (it is also the preloaded image). */
  views = HERO_VIEWS;
  /** The view on screen. */
  active: 'day' | 'night' = 'day';
  /** The view the visitor asked for (differs from `active` only while its image is still arriving). */
  chosen: 'day' | 'night' = 'day';
  /** The night image is added to the page after load, or as soon as it is asked for. */
  nightReady = false;
  private loaded = new Set<string>(['day']);
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly browser: boolean;

  /**
   * Google Ads message match: /?intent=healthcare | office | retail | floor swaps the headline and sub-headline to what the
   * searcher asked for. The canonical URL stays "/" (SeoService builds it from the route path only) and unknown values show
   * the default hero. The static HTML always carries the default hero.
   */
  hero: HeroIntent = HERO_DEFAULT;

  private sub: Subscription;

  constructor(private analytics: AnalyticsService, route: ActivatedRoute, private cdr: ChangeDetectorRef, @Inject(PLATFORM_ID) platformId: object) {
    this.browser = isPlatformBrowser(platformId);
    this.sub = route.queryParamMap.subscribe((q) => {
      const key = (q.get('intent') || '').trim().toLowerCase();
      this.hero = HERO_INTENTS[key] ?? HERO_DEFAULT;
    });
  }

  openPopup() {
    this.analytics.event('site_visit_click', { source: 'hero' });
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }

  ngAfterViewInit(): void {
    if (!this.browser) return;
    const saveData = !!(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData) return; // data saver on: the night view downloads only when asked for
    const queue = () => { this.idleTimer = setTimeout(() => { this.nightReady = true; this.cdr.markForCheck(); }, 1200); };
    if (document.readyState === 'complete') queue(); else window.addEventListener('load', queue, { once: true });
  }

  select(id: 'day' | 'night') {
    if (id === this.chosen) return;
    this.chosen = id;
    this.analytics.event('hero_view_toggle', { view: id });
    if (this.loaded.has(id)) { this.active = id; return; }
    this.nightReady = true; // the switch happens in onLoad(), so the current view never goes blank while the other one downloads
  }

  onLoad(id: string): void {
    this.loaded.add(id);
    if (this.chosen === id) this.active = this.chosen;
  }

  track(name: string) { this.analytics.event(name, { source: 'hero' }); }

  ngOnDestroy(): void { this.sub.unsubscribe(); if (this.idleTimer) clearTimeout(this.idleTimer); }
}
