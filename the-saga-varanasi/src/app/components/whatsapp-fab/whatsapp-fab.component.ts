import { Component } from '@angular/core';
import { waLink } from '../../config/property.config';

@Component({
  selector: 'app-whatsapp-fab',
  templateUrl: './whatsapp-fab.component.html',
  styleUrls: ['./whatsapp-fab.component.scss'],
})
export class WhatsappFabComponent {
  waHref = waLink();

  track() {
    const w = window as any;
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'whatsapp_click');
    }
  }
}
