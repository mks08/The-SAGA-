import { Component, HostListener, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
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
  /** True on the Hindi page: the language link then points back to English. */
  hindi = false;
  scrolled = false;
  menuOpen = false;
  scrollProgress = 0;
  property = PROPERTY;
  waHref = waLink();

  /** Five links, one per decision a tenant makes: see it, plan it, find it, ask about terms. */
  readonly navLinks: NavLink[] = [
    { path: '/', label: 'Home' },
    { path: '/walkthrough', label: 'Walkthrough' },
    { path: '/floor-plans', label: 'Floor Plans' },
    { path: '/location-contact', label: 'Location & Visit' },
    { path: '/leasing', label: 'Leasing' },
  ];


  private sub: Subscription;

  constructor(private analytics: AnalyticsService, router: Router, location: Location) {
    this.hindi = /^\/hi(\/|$)/.test(location.path());
    this.sub = router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.hindi = /^\/hi(\/|$|\?|#)/.test(e.urlAfterRedirects);
      this.closeMenu();
    });
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

  ngOnDestroy() {
    this.sub.unsubscribe();
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }
}
