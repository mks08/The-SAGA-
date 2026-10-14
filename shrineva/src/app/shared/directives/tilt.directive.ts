import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';
import { finePointer, prefersReducedMotion } from './motion.util';

/**
 * Pointer-driven 3D tilt with a soft glare.   <div appTilt [tiltMax]="6">
 * Only on devices with a real pointer; never under prefers-reduced-motion.
 */
@Directive({ selector: '[appTilt]' })
export class TiltDirective implements AfterViewInit, OnDestroy {
  @Input() tiltMax = 6;
  @Input() tiltScale = 1.015;

  private raf = 0;
  private cleanup: (() => void)[] = [];

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    if (prefersReducedMotion() || !finePointer()) return;
    const el = this.host.nativeElement;
    el.style.transformStyle = 'preserve-3d';
    el.style.willChange = 'transform';
    el.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
    this.zone.runOutsideAngular(() => {
      const move = (ev: PointerEvent) => {
        cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width - 0.5;
          const py = (ev.clientY - r.top) / r.height - 0.5;
          el.style.transition = 'transform 0.08s linear';
          el.style.transform = `perspective(1000px) rotateX(${(-py * this.tiltMax).toFixed(2)}deg) rotateY(${(px * this.tiltMax).toFixed(2)}deg) scale(${this.tiltScale})`;
          el.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`);
          el.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`);
        });
      };
      const leave = () => {
        cancelAnimationFrame(this.raf);
        el.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
        el.style.transform = '';
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      this.cleanup.push(() => el.removeEventListener('pointermove', move), () => el.removeEventListener('pointerleave', leave));
    });
  }

  ngOnDestroy(): void { cancelAnimationFrame(this.raf); this.cleanup.forEach((f) => f()); }
}
