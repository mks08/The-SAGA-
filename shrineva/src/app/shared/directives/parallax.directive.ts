import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';
import { prefersReducedMotion } from './motion.util';

/**
 * Gentle scroll parallax: the element drifts by `appParallax` × its distance from the viewport centre.
 * <img appParallax="0.12">. Runs only while the element is on screen.
 */
@Directive({ selector: '[appParallax]' })
export class ParallaxDirective implements AfterViewInit, OnDestroy {
  @Input() appParallax = 0.12;

  private io?: IntersectionObserver;
  private raf = 0;
  private visible = false;
  private onScroll = () => {
    if (!this.visible || this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      const el = this.host.nativeElement;
      const r = el.parentElement ? el.parentElement.getBoundingClientRect() : el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - innerHeight / 2) * this.appParallax;
      el.style.transform = `translate3d(0, ${(-offset).toFixed(1)}px, 0) scale(1.12)`;
    });
  };

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      this.io = new IntersectionObserver((entries) => {
        this.visible = entries.some((e) => e.isIntersecting);
        if (this.visible) this.onScroll();
      });
      this.io.observe(this.host.nativeElement);
      addEventListener('scroll', this.onScroll, { passive: true });
    });
  }

  ngOnDestroy(): void { this.io?.disconnect(); removeEventListener('scroll', this.onScroll); cancelAnimationFrame(this.raf); }
}
