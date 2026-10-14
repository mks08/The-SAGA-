import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';
import { prefersReducedMotion } from './motion.util';

/**
 * Counts a number up when it scrolls into view.   <span [appCountUp]="3520" countSuffix=" sq ft">
 * The final value is already in the DOM (so crawlers, print and reduced-motion users see it); the animation only
 * replays it from zero. Indian digit grouping.
 */
@Directive({ selector: '[appCountUp]' })
export class CountUpDirective implements AfterViewInit, OnDestroy {
  @Input() appCountUp = 0;
  @Input() countDecimals = 0;
  @Input() countPrefix = '';
  @Input() countSuffix = '';
  @Input() countDuration = 1600;

  private io?: IntersectionObserver;
  private raf = 0;

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  private fmt(n: number): string {
    return this.countPrefix + n.toLocaleString('en-IN', { minimumFractionDigits: this.countDecimals, maximumFractionDigits: this.countDecimals }) + this.countSuffix;
  }

  ngAfterViewInit(): void {
    const el = this.host.nativeElement;
    el.style.fontVariantNumeric = 'tabular-nums';
    el.textContent = this.fmt(this.appCountUp);
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      this.io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        this.io?.disconnect();
        const start = performance.now();
        const target = this.appCountUp;
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / this.countDuration);
          const eased = 1 - Math.pow(1 - t, 4);
          el.textContent = this.fmt(target * eased);
          if (t < 1) this.raf = requestAnimationFrame(step);
          else el.textContent = this.fmt(target);
        };
        el.textContent = this.fmt(0);
        this.raf = requestAnimationFrame(step);
      }, { threshold: 0.6 });
      this.io.observe(el);
    });
  }

  ngOnDestroy(): void { this.io?.disconnect(); cancelAnimationFrame(this.raf); }
}
