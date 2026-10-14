import { Injectable } from '@angular/core';
import { Location, ViewportScroller } from '@angular/common';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

/**
 * Remembers scroll positions per route so Back returns the visitor
 * to the same place they left — not the top of the previous page.
 */
@Injectable({ providedIn: 'root' })
export class NavigationMemoryService {
  private positions = new Map<string, number>();

  constructor(
    private router: Router,
    private location: Location,
    private viewport: ViewportScroller,
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.positions.set(this.normalize(this.router.url), this.currentY());
        return;
      }

      if (event instanceof NavigationEnd) {
        const nav = this.router.getCurrentNavigation();
        const url = this.normalize(event.urlAfterRedirects);
        const fragment = event.urlAfterRedirects.split('#')[1];

        if (nav?.trigger === 'popstate') {
          this.restore(this.positions.get(url) ?? 0);
          return;
        }

        if (fragment) {
          setTimeout(() => this.viewport.scrollToAnchor(fragment), 0);
          return;
        }

        this.restore(0);
      }
    });
  }

  goBack(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if (state?.navigationId && state.navigationId > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/');
  }

  private currentY(): number {
    return window.scrollY || window.pageYOffset || 0;
  }

  private restore(y: number): void {
    setTimeout(() => window.scrollTo({ top: y, left: 0, behavior: 'auto' }), 0);
  }

  private normalize(url: string): string {
    const path = url.split('?')[0].split('#')[0];
    return path || '/';
  }
}
