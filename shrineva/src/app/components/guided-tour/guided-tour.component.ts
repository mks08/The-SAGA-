import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, ViewChild } from '@angular/core';
import { MediaItem, TOUR_STOPS } from '../../config/media.config';
import { PROPERTY } from '../../config/property.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/**
 * Guided walkthrough: the finalised 3D renders in the order a visitor would meet the building (road, entrance, walkway,
 * ground level, lift lobby). Plain images, so it is fast and works on any phone.
 * - Plays by itself once it scrolls into view (about 6 s a stop); pauses while a mouse hovers it, in a hidden tab or off screen, and the Pause button stops it.
 * - Any tap, swipe or key press puts the visitor in control; Play resumes. No autoplay (and no motion) with "reduce motion".
 * - Only the current stop and its neighbours are in the page, so the section costs one image until the visitor moves on.
 */
@Component({
  selector: 'app-guided-tour',
  templateUrl: './guided-tour.component.html',
  styleUrls: ['./guided-tour.component.scss'],
})
export class GuidedTourComponent implements AfterViewInit, OnDestroy {
  /** "embed" shows its own heading (home); "page" sits under the page H1. */
  @Input() variant: 'embed' | 'page' = 'embed';
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;

  property = PROPERTY;
  stops: MediaItem[] = TOUR_STOPS;
  /** Seconds each stop stays on screen while playing. */
  readonly seconds = 6;

  idx = 0;
  playing = false;
  inView = false;
  hover = false;
  tabHidden = false;
  reduced = false;
  lightboxIndex: number | null = null;

  private io?: IntersectionObserver;
  private startX = 0;
  private startY = 0;

  constructor(private analytics: AnalyticsService) {}

  ngAfterViewInit(): void {
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.playing = !this.reduced;
    if (typeof IntersectionObserver === 'function') {
      this.io = new IntersectionObserver((entries) => { this.inView = entries.some((e) => e.isIntersecting); }, { threshold: 0.45 });
      this.io.observe(this.root.nativeElement);
    } else {
      this.inView = true;
    }
  }

  ngOnDestroy(): void { this.io?.disconnect(); }

  @HostListener('document:visibilitychange')
  onVisibility() { this.tabHidden = document.hidden; }

  get running(): boolean { return this.playing && this.inView && !this.hover && !this.tabHidden && !this.reduced; }
  get current(): MediaItem { return this.stops[this.idx]; }
  get label(): string { return `${this.idx + 1} of ${this.stops.length}`; }

  /** Only the stop on screen and its two neighbours are rendered. */
  near(i: number): boolean { return Math.abs(i - this.idx) <= 1; }

  timeOf(s: MediaItem): string {
    if (s.id === 'facade-night' || s.id === 'night-street') return 'Night';
    if (s.id === 'facade-day') return 'Day';
    return '';
  }

  go(i: number, byUser = true) {
    const n = this.stops.length;
    this.idx = (i + n) % n;
    if (byUser) {
      this.playing = false;
      this.analytics.event('tour_step', { step: this.stops[this.idx].id });
    }
  }
  next() { this.go(this.idx + 1); }
  prev() { this.go(this.idx - 1); }

  toggle() {
    if (this.playing) { this.playing = false; return; }
    if (this.idx === this.stops.length - 1) this.idx = 0;
    this.playing = true;
    this.analytics.event('tour_play');
  }

  /** The progress bar of the current stop finished its run. */
  onSegmentEnd(i: number) {
    if (i !== this.idx || !this.playing) return;
    if (this.idx < this.stops.length - 1) this.idx++;
    else this.playing = false;
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') { this.next(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { this.prev(); e.preventDefault(); }
    else if (e.key === 'Home') { this.go(0); e.preventDefault(); }
    else if (e.key === 'End') { this.go(this.stops.length - 1); e.preventDefault(); }
  }

  onDown(e: PointerEvent) { this.startX = e.clientX; this.startY = e.clientY; }
  onUp(e: PointerEvent) {
    const dx = e.clientX - this.startX, dy = e.clientY - this.startY;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) (dx < 0 ? this.next() : this.prev());
  }

  open() { this.lightboxIndex = this.idx; this.analytics.event('tour_enlarge'); }
  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
}
