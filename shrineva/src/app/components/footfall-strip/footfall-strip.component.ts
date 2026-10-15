import { Component } from '@angular/core';
import { FOOTFALL_HEADLINE, NEARBY_PROJECTS } from '../../config/footfall.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/** Home: the footfall story in one short, source-free strip. The evidence (with sources) lives on /growth. */
@Component({
  selector: 'app-footfall-strip',
  templateUrl: './footfall-strip.component.html',
})
export class FootfallStripComponent {
  headline = FOOTFALL_HEADLINE;
  anchors = NEARBY_PROJECTS;

  constructor(private analytics: AnalyticsService) {}

  chipClass(state: string): string {
    return state === 'Operating' ? 'border-ok/40 bg-ok/10 text-ok' : 'border-brass-deep/40 bg-brass/10 text-brass-deep';
  }
  track() { this.analytics.event('nearby_projects_click', { source: 'strip' }); }
}
