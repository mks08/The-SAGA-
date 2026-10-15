import { Component, HostListener, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { PROPERTY, waLink } from '../../config/property.config';

interface NavLink { path: string; label: string; live?: boolean; }

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnDestroy {
  scrolled = false;
  menuOpen = false;
  scrollProgress = 0;
  property = PROPERTY;
  waHref = waLink();

  /** "Nearby Projects" is deliberately a top-level, marked link: it is the evidence behind the footfall claim. */
  readonly navLinks: NavLink[] = [
    { path: '/', label: 'Home' },
    { path: '/property', label: 'Property' },
    { path: '/walkthrough', label: '3D Walkthrough' },
    { path: '/floor-plans', label: 'Floor Plans' },
    { path: '/growth', label: 'Nearby Projects', live: true },
    { path: '/location', label: 'Location' },
    { path: '/leasing', label: 'Leasing' },
  ];

  private sub: Subscription;

  constructor(private analytics: AnalyticsService, router: Router) {
    this.sub = router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.closeMenu());
  }

  @HostListener('window:scroll')
  onScroll() {
    const y = window.scrollY;
    this.scrolled = y > 24;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress = docHeight > 0 ? Math.min(100, (y / docHeight) * 100) : 0;
  }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.menuOpen) this.closeMenu(); }

  closeMenu() {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    document.body.style.overflow = '';
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    document.body.style.overflow = this.menuOpen ? 'hidden' : '';
  }

  openPopup() {
    this.closeMenu();
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }

  track(name: string) { this.analytics.event(name, { source: 'navbar' }); }

  ngOnDestroy() { this.sub.unsubscribe(); document.body.style.overflow = ''; }
}
