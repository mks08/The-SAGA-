import { Component } from '@angular/core';
import { waLink } from '../../config/property.config';
import { PageLangService } from '../../core/services/page-lang.service';
import { HI } from '../../config/hindi.config';

/** Desktop WhatsApp button. The click is counted by AnalyticsService's delegated listener (source: "fab"). */
@Component({
  selector: 'app-whatsapp-fab',
  templateUrl: './whatsapp-fab.component.html',
  styleUrls: ['./whatsapp-fab.component.scss'],
})
export class WhatsappFabComponent {
  get waHref(): string { return waLink(this.lang.hindi ? HI.waMessage : undefined); }
  constructor(private lang: PageLangService) {}
}
