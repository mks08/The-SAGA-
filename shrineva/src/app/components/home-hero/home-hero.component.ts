import { Component } from '@angular/core';
import { PLAN, PROPERTY } from '../../config/property.config';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-home-hero',
  templateUrl: './home-hero.component.html',
})
export class HomeHeroComponent {
  property = PROPERTY;
  plan = PLAN;

  stats = [
    { value: 50, suffix: ' ft', label: 'Road frontage' },
    { value: 24, suffix: ' m', label: 'Wide road' },
    { value: 3520, suffix: '', label: 'Sq ft per floor' },
  ];

  constructor(private analytics: AnalyticsService) {}

  openPopup() {
    this.analytics.event('site_visit_click', { source: 'hero' });
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }

  track(name: string) { this.analytics.event(name, { source: 'hero' }); }
}
