import { Component } from '@angular/core';
import { LEVELS, WALKTHROUGH_NOTE } from '../../config/building.config';
import { PLAN, PROPERTY } from '../../config/property.config';
import { NavigationMemoryService } from '../../core/services/navigation-memory.service';

@Component({
  selector: 'app-walkthrough-page',
  templateUrl: './walkthrough-page.component.html',
})
export class WalkthroughPageComponent {
  property = PROPERTY;
  plan = PLAN;
  levels = LEVELS;
  note = WALKTHROUGH_NOTE;

  constructor(private navigation: NavigationMemoryService) {}

  goBack(): void { this.navigation.goBack(); }

  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
}
