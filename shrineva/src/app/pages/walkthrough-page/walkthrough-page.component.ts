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

  controls = [
    { k: 'Move the mouse', v: 'Leans the view. Drag to look around.' },
    { k: 'W A S D · arrows', v: 'Walk inside. Q and E turn.' },
    { k: 'Click the floor', v: 'Walk to that spot.' },
    { k: 'Scroll · pinch', v: 'Zoom in and out.' },
  ];

  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
}
