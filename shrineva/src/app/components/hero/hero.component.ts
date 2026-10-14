import { AnalyticsService } from '../../core/services/analytics.service';
import { Component } from '@angular/core';
import { PLAN, PROPERTY } from '../../config/property.config';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent {
  constructor(private analytics: AnalyticsService) {}

  property = PROPERTY;
  plan = PLAN;

  stats = [
    { value: `${PLAN.typical.floorArea.sqft.toLocaleString('en-IN', { maximumFractionDigits: 0 })} sq ft`, label: 'Floor area, each floor' },
    { value: PLAN.plot.frontage, label: `Frontage · ${PLAN.plot.roadWidthM} m road` },
    { value: '60–70 m', label: 'To Apollo & NIFT' },
    { value: 'Stilt + 3', label: 'Commercial floors' },
  ];

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }

  track(eventName: string) { this.analytics.event(eventName); }
}
