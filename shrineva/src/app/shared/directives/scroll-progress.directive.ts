import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';
import { prefersReducedMotion } from './motion.util';

/**
 * Scroll-linked progress.   <ol appScrollProgress>   then in CSS:  transform: scaleX(var(--p, 1))
 *
 * Sets the custom property --p on the element: 0 while it is still below the screen, rising to 1 as the visitor scrolls it up
 * through the viewport, and staying at 1 once it has passed. The animation therefore follows the finger or the wheel (it can be
 * scrubbed back and forth) instead of playing once on a timer. Only transforms and opacity should depend on it.
 *
 * Without JavaScript, with reduced motion, or before this runs (server-rendered HTML), --p is not set and the CSS fallback
 * var(--p, 1) shows the finished state, so nothing is ever hidden. Only one scroll listener is active while the element is near the screen.
 */
@Directive({ selector: '[appScrollProgress]' })
export class ScrollProgressDirective implements AfterViewInit, OnDestroy {
  /** Where on the screen the element's top edge is when progress is 0 (fraction of the viewport height, from the top). */
  @Input() spStart = 0.9;
  /** Share of the element's own height over which progress runs from 0 to 1. */
  @Input() spSpan = 0.8;

  private io?: IntersectionObserver;
  private raf = 0;
  private near = false;

  private onScroll = () => {
    if (!this.near || this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.update(); });
  };

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      this.io = new IntersectionObserver((entries) => {
        this.near = entries.some((e) => e.isIntersecting);
        this.update(); // also once as it leaves, so it rests at 0 (below) or 1 (above)
      }, { rootMargin: '25% 0px 25% 0px' });
      this.io.observe(this.host.nativeElement);
      this.update();
      addEventListener('scroll', this.onScroll, { passive: true });
      addEventListener('resize', this.onScroll, { passive: true });
    });
  }

  private update(): void {
    const el = this.host.nativeElement;
    const r = el.getBoundingClientRect();
    const vh = innerHeight || 1;
    const span = Math.max(r.height * this.spSpan, vh * 0.3);
    const p = Math.min(1, Math.max(0, (vh * this.spStart - r.top) / span));
    el.style.setProperty('--p', p.toFixed(3));
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    if (typeof removeEventListener === 'function') {
      removeEventListener('scroll', this.onScroll);
      removeEventListener('resize', this.onScroll);
    }
    if (this.raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.raf);
  }
}
