import { Component } from '@angular/core';
import { LEVELS, WALKTHROUGH_NOTE } from '../../config/building.config';
import { PLAN, PROPERTY } from '../../config/property.config';

@Component({
  selector: 'app-walkthrough-page',
  templateUrl: './walkthrough-page.component.html',
})
export class WalkthroughPageComponent {
  property = PROPERTY;
  plan = PLAN;
  levels = LEVELS;
  note = WALKTHROUGH_NOTE;

  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
}
