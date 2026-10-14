import { Component } from '@angular/core';
import { PROPERTY, waLink } from '../../config/property.config';

@Component({
  selector: 'app-final-cta',
  templateUrl: './final-cta.component.html',
  styleUrls: ['./final-cta.component.scss'],
})
export class FinalCtaComponent {
  property = PROPERTY;
  waHref = waLink();

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
