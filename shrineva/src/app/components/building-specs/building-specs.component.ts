import { Component } from '@angular/core';
import { ASK_ITEMS, SPEC_GROUPS } from '../../config/content.config';
import { AnalyticsService } from '../../core/services/analytics.service';
import { openChaix, openLeadPath } from '../../core/ui-events';

/**
 * The specification sheet: project, site, building, access and safety, in the same figures as page 4 of the brochure.
 * Only confirmed facts are listed (config/content.config.ts: SPEC_GROUPS); anything not yet confirmed is a question for the
 * leasing team (ASK_ITEMS), never a feature. Areas are approximate and subject to final measurement.
 */
@Component({
  selector: 'app-building-specs',
  templateUrl: './building-specs.component.html',
})
export class BuildingSpecsComponent {
  groups = SPEC_GROUPS;
  ask = ASK_ITEMS;
  constructor(private analytics: AnalyticsService) {}

  /** Hairlines between the groups: stacked on phones, a two-by-two grid from md up. */
  cellClass(i: number): string {
    return (i > 0 ? 'border-t ' : '') + (i < 2 ? 'md:border-t-0 ' : '') + (i % 2 === 0 ? 'md:border-r' : '');
  }

  getBrochure(): void {
    this.analytics.event('brochure_click', { source: 'specs' });
    openLeadPath({ source: 'specs', path: 'brochure' });
  }
  askTeam(): void {
    this.analytics.event('specs_question_click', { source: 'specs' });
    openLeadPath({ source: 'specs', path: 'query' });
  }
  askChaix(topic: string): void {
    openChaix({ source: 'specs', question: topic });
  }
}
