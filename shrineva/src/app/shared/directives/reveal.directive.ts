import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';
import { prefersReducedMotion } from './motion.util';

type Variant = '' | 'up' | 'left' | 'right' | 'scale' | 'clip';

/**
 * Scroll-triggered reveal.  <div appReveal> · <div appReveal="left" [style.--i]="i">
 * Adds .rv (+ variant) immediately and .is-in once the element enters the viewport; see styles.scss.
 * Stagger inside a list by setting the --i custom property. With prefers-reduced-motion nothing is hidden.
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements AfterViewInit, OnDestroy {
  @Input() appReveal: Variant = '';
  /** Fraction of the element that must be visible. */
  @Input() revealAt = 0.14;

  private io?: IntersectionObserver;

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    const el = this.host.nativeElement;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    el.classList.add('rv');
    if (this.appReveal) el.classList.add(`rv-${this.appReveal}`);
    this.zone.runOutsideAngular(() => {
      this.io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add('is-in');
              this.io?.unobserve(e.target);
            }
          }
        },
        { threshold: this.revealAt, rootMargin: '0px 0px -6% 0px' },
      );
      this.io.observe(el);
    });
  }

  ngOnDestroy(): void { this.io?.disconnect(); }
}
