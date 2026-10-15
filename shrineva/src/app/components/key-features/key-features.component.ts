import { Component } from '@angular/core';
import { BUILDING_SERVICES, FEATURES_NOTE, KEY_FEATURES, PROJECT_STATUS } from '../../config/highlights.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/** Home: key features and project status in one short section. */
@Component({
  selector: 'app-key-features',
  templateUrl: './key-features.component.html',
})
export class KeyFeaturesComponent {
  features = KEY_FEATURES;
  services = BUILDING_SERVICES;
  status = PROJECT_STATUS;
  note = FEATURES_NOTE;

  constructor(private analytics: AnalyticsService) {}
  ask() { this.analytics.event('site_visit_click', { source: 'status' }); window.dispatchEvent(new CustomEvent('open-booking-popup')); }
}
