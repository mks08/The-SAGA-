import { AnalyticsService } from '../../core/services/analytics.service';
import { Component } from '@angular/core';
import { waLink } from '../../config/property.config';

@Component({
  selector: 'app-whatsapp-fab',
  templateUrl: './whatsapp-fab.component.html',
  styleUrls: ['./whatsapp-fab.component.scss'],
})
export class WhatsappFabComponent {
  constructor(private analytics: AnalyticsService) {}

  waHref = waLink();

  track() { this.analytics.event('whatsapp_click', { source: 'fab' }); }
}
