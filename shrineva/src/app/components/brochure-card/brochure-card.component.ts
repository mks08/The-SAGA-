import { Component, Input } from '@angular/core';
import { BROCHURE } from '../../config/media.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/** The brochure as a PDF download. `compact` tightens the section spacing for use inside other pages. */
@Component({
  selector: 'app-brochure-card',
  templateUrl: './brochure-card.component.html',
})
export class BrochureCardComponent {
  @Input() compact = false;
  brochure = BROCHURE;
  constructor(private analytics: AnalyticsService) {}
  track(name: string) { this.analytics.event(name); }
}
