import { Component, Input } from '@angular/core';
import { DOSSIER } from '../../config/media.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/** A short, premium PDF dossier for leasing and expansion teams. `compact` drops the section frame for use inside other pages. */
@Component({
  selector: 'app-dossier-card',
  templateUrl: './dossier-card.component.html',
})
export class DossierCardComponent {
  @Input() compact = false;
  dossier = DOSSIER;
  constructor(private analytics: AnalyticsService) {}
  track(name: string) { this.analytics.event(name); }
}
