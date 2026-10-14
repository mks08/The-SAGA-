import { Component } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { NavigationMemoryService } from './core/services/navigation-memory.service';
import { AnalyticsService } from './core/services/analytics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'SHRINEVA — Premium Commercial & Mixed-Use Spaces, Bada Lalpur, Varanasi';

  constructor(
    viewport: ViewportScroller,
    _navigation: NavigationMemoryService,
    analytics: AnalyticsService,
  ) {
    viewport.setOffset([0, 80]);
    analytics.init();
  }
}
