import { Component } from '@angular/core';
import { PLAN, PROPERTY } from '../../config/property.config';

/** The building in six numbers. Everything is read from the config, which is read from the architect's sheets. */
@Component({
  selector: 'app-home-specs',
  templateUrl: './home-specs.component.html',
})
export class HomeSpecsComponent {
  property = PROPERTY;
  plan = PLAN;
  floors = [3, 2, 1];

  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
}
