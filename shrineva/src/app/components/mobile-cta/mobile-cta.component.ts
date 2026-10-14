import { Component } from '@angular/core';
import { PROPERTY, waLink } from '../../config/property.config';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-mobile-cta',
  templateUrl: './mobile-cta.component.html',
  styleUrls: ['./mobile-cta.component.scss'],
})
export class MobileCtaComponent {
  property = PROPERTY;
  waHref = waLink();

  constructor(private analytics: AnalyticsService) {}

  openVisit(): void {
    this.analytics.event('site_visit_click', { source: 'mobile_bar' });
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }

  track(name: string): void {
    this.analytics.event(name, { source: 'mobile_bar' });
  }
}
