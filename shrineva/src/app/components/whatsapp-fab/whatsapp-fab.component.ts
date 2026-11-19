import { Component } from '@angular/core';
import { waLink } from '../../config/property.config';

/** Desktop WhatsApp button. The click is counted by AnalyticsService's delegated listener (source: "fab"). */
@Component({
  selector: 'app-whatsapp-fab',
  templateUrl: './whatsapp-fab.component.html',
  styleUrls: ['./whatsapp-fab.component.scss'],
})
export class WhatsappFabComponent {
  waHref = waLink();
}
