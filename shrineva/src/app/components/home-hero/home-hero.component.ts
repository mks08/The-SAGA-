import { Component, ElementRef, NgZone, OnDestroy, AfterViewInit } from '@angular/core';
import { PLAN, PROPERTY } from '../../config/property.config';
import { FOOTFALL_HEADLINE, NEARBY_PROJECTS } from '../../config/footfall.config';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-home-hero',
  templateUrl: './home-hero.component.html',
  styleUrls: ['./home-hero.component.scss'],
})
export class HomeHeroComponent implements AfterViewInit, OnDestroy {
  property = PROPERTY;
  plan = PLAN;
  headline = FOOTFALL_HEADLINE;
  anchors = NEARBY_PROJECTS;

  stats = [
    { value: 50, suffix: ' ft', label: 'Road frontage' },
    { value: 24, suffix: ' m', label: 'Wide road' },
    { value: 3520, suffix: '', label: 'Sq ft per floor' },
  ];

  private off?: () => void;

  constructor(private analytics: AnalyticsService, private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  /** Pointer parallax: the façade and the light layers drift against each other, so the page feels three-dimensional. */
  ngAfterViewInit(): void {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = this.host.nativeElement.querySelector<HTMLElement>('[data-hero]');
    if (!el) return;
    this.zone.runOutsideAngular(() => {
      let raf = 0;
      const move = (e: PointerEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          el.style.setProperty('--px', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
          el.style.setProperty('--py', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
        });
      };
      el.addEventListener('pointermove', move, { passive: true });
      this.off = () => { el.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
    });
  }

  ngOnDestroy(): void { this.off?.(); }

  openPopup() {
    this.analytics.event('site_visit_click', { source: 'hero' });
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }

  track(name: string) { this.analytics.event(name, { source: 'hero' }); }
}
