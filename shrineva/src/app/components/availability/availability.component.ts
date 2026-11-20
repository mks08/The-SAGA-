import { Component } from '@angular/core';
import { MARKETING_AREA, PLAN, PROPERTY, waLink } from '../../config/property.config';
import { LEASE_OPTIONS, STACK } from '../../config/content.config';
import { BROCHURE } from '../../config/media.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/**
 * "What is available": the building drawn as a stack (top floor first), what each level is, and the three ways to lease it.
 * Facts only: no price, no per-floor availability promise. The leasing team confirms which floors are open today.
 */
@Component({
  selector: 'app-availability',
  templateUrl: './availability.component.html',
})
export class AvailabilityComponent {
  property = PROPERTY;
  plan = PLAN;
  stack = STACK;
  area = MARKETING_AREA.gross;
  options = LEASE_OPTIONS;
  brochure = BROCHURE;
  waHref = waLink('Hi, please share which floors are available at SHRINEVA, Bada Lalpur, Varanasi.');

  constructor(private analytics: AnalyticsService) {}

  openPopup() {
    this.analytics.event('site_visit_click', { source: 'availability' });
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
  track(name: string) { this.analytics.event(name, { source: 'availability' }); }
}
