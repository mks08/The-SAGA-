import { Component } from '@angular/core';
import { PROPERTY, waLink } from '../../config/property.config';
import { openLeadPath } from '../../core/ui-events';

@Component({
  selector: 'app-final-cta',
  templateUrl: './final-cta.component.html',
})
export class FinalCtaComponent {
  property = PROPERTY;
  waHref = waLink();

  openPopup() {
    openLeadPath({ source: 'final_cta', path: 'visit' });
  }
}
