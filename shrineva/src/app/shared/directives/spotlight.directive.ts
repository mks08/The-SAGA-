import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { finePointer } from './motion.util';

/** Feeds --mx / --my (pointer position inside the element) to the .spot class in styles.scss.  <div class="spot" appSpotlight> */
@Directive({ selector: '[appSpotlight]' })
export class SpotlightDirective implements AfterViewInit, OnDestroy {
  private off?: () => void;
  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    if (!finePointer()) return;
    const el = this.host.nativeElement;
    this.zone.runOutsideAngular(() => {
      const move = (ev: PointerEvent) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${ev.clientX - r.left}px`);
        el.style.setProperty('--my', `${ev.clientY - r.top}px`);
      };
      el.addEventListener('pointermove', move, { passive: true });
      this.off = () => el.removeEventListener('pointermove', move);
    });
  }
  ngOnDestroy(): void { this.off?.(); }
}
