import { Component } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { NavigationMemoryService } from './core/services/navigation-memory.service';
import { AnalyticsService } from './core/services/analytics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'SHRINEVA — Premium Commercial & Mixed-Use Spaces, Bada Lalpur, Varanasi';

  /**
   * Soft fade between pages. The class is only on while the animation runs: a finished animation would otherwise keep
   * a stacking context around the page and trap the full-screen 3D view underneath the navigation bar.
   */
  fading = false;
  private first = true;

  constructor(
    viewport: ViewportScroller,
    _navigation: NavigationMemoryService,
    analytics: AnalyticsService,
    router: Router,
  ) {
    viewport.setOffset([0, 80]);
    analytics.init();
    router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      if (this.first) { this.first = false; return; }
      this.fading = true;
    });
  }

  fadeDone(e: AnimationEvent): void {
    if (e.target === e.currentTarget && e.animationName === 'pageIn') this.fading = false;
  }
}
