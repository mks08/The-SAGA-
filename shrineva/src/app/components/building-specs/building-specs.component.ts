import { Component } from '@angular/core';
import { ASK_ITEMS, SPEC_GROUPS } from '../../config/content.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/**
 * Safety, access and building facts, as a spec sheet. Only confirmed facts are listed (config/content.config.ts: SPEC_GROUPS);
 * anything not yet confirmed is a question for the leasing team (ASK_ITEMS), never a feature.
 */
@Component({
  selector: 'app-building-specs',
  templateUrl: './building-specs.component.html',
})
export class BuildingSpecsComponent {
  groups = SPEC_GROUPS;
  ask = ASK_ITEMS;
  constructor(private analytics: AnalyticsService) {}
  openPopup() {
    this.analytics.event('site_visit_click', { source: 'specs' });
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
