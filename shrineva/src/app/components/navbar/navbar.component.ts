import { AnalyticsService } from '../../core/services/analytics.service';
import { Component, HostListener } from '@angular/core';
import { PROPERTY, waLink } from '../../config/property.config';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  constructor(private analytics: AnalyticsService) {}

  scrolled = false;
  menuOpen = false;
  scrollProgress = 0;
  property = PROPERTY;
  waHref = waLink();

  readonly navLinks = [
    { path: '/property', label: 'Property' },
    { path: '/floor-plans', label: 'Floor Plans' },
    { path: '/location', label: 'Location' },
    { path: '/growth', label: 'Nearby Projects' },
    { path: '/business-fit', label: 'Business Fit' },
    { path: '/leasing', label: 'Leasing' },
  ];

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 60;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
    this.menuOpen = false;
  }

  trackWa() { this.analytics.event('whatsapp_click', { source: 'navbar' }); }
}
