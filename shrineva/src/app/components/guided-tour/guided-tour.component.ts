import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Inject, Input, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { MediaItem, TOUR_PINS, TOUR_STOPS } from '../../config/media.config';
import { PLAN, PROPERTY } from '../../config/property.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/**
 * Guided walkthrough: the finalised 3D renders in the order a visitor would meet the building (road, entrance, walkway,
 * ground level, lift lobby). Plain images, so it is fast and works on any phone.
 *
 * Tools: previous / next, play / pause, a stop list with thumbnails, progress bars you can tap, zoom and drag, full screen,
 * a "you are here" mini plan (approximate viewpoints), keyboard keys and swipe. It plays by itself (about 6 s a stop) once it
 * scrolls into view, pauses while a mouse hovers it, in a hidden tab, while zoomed or off screen, and stops for good as soon
 * as the visitor takes control. No autoplay and no motion with "reduce motion".
 * Only the current stop and its neighbours are in the page, so the section costs one image until the visitor moves on.
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
  @ViewChild('wrap', { static: true }) wrap!: ElementRef<HTMLElement>;

  property = PROPERTY;
  stops: MediaItem[] = TOUR_STOPS;
  /** Seconds each stop stays on screen while playing. */
  readonly seconds = 6;
  readonly zooms = [1, 1.7, 2.6];

  idx = 0;
  playing = false;
  inView = false;
  /** True once the tour is within a screen's height of the viewport: only then are neighbouring stops downloaded. */
  seen = false;
  hover = false;
  tabHidden = false;
  reduced = false;
  full = false;
  canFullscreen = false;
  zoom = 1;
  tx = 0;
  ty = 0;
  lightboxIndex: number | null = null;
  hintShown = true;

  /** The mini plan: plot and building in feet, drawn at a fixed scale. */
  readonly mp = { s: 2.1, W: 49.46, L: 115.54, ox: 22, oy: 44 };
  readonly mpGround = { x: 5, y: 15.67, w: 35.5, h: 84.5 };
  readonly mpCore = { x: 27.75, y: 43.8, w: 12.75, h: 27.75 };

  private io?: IntersectionObserver;
  private ioNear?: IntersectionObserver;
  private startX = 0;
  private startY = 0;
  dragging = false;
  private moved = false;
  private base = { tx: 0, ty: 0 };

  private readonly browser: boolean;

  constructor(private analytics: AnalyticsService, private cdr: ChangeDetectorRef, @Inject(DOCUMENT) private doc: Document, @Inject(PLATFORM_ID) platformId: object) {
    this.browser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.browser) return; // the pre-rendered page shows the first stop, paused
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.playing = !this.reduced;
    const el = this.wrap.nativeElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    this.canFullscreen = !!(el.requestFullscreen || el.webkitRequestFullscreen);
    if (typeof IntersectionObserver === 'function') {
      this.io = new IntersectionObserver((entries) => { this.inView = entries.some((e) => e.isIntersecting); }, { threshold: 0.45 });
      this.io.observe(this.root.nativeElement);
      this.ioNear = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { this.seen = true; this.ioNear?.disconnect(); }
      }, { rootMargin: '400px 0px' });
      this.ioNear.observe(this.root.nativeElement);
    } else {
      this.inView = true;
      this.seen = true;
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void { this.io?.disconnect(); this.ioNear?.disconnect(); }

  @HostListener('document:visibilitychange')
  onVisibility() { this.tabHidden = document.hidden; }

  @HostListener('document:fullscreenchange')
  @HostListener('document:webkitfullscreenchange')
  onFullscreen() {
    const d = this.doc as Document & { webkitFullscreenElement?: Element };
    this.full = (d.fullscreenElement || d.webkitFullscreenElement) === this.wrap.nativeElement;
    if (!this.full) this.resetZoom();
  }

  get running(): boolean { return this.playing && this.inView && !this.hover && !this.tabHidden && !this.reduced && this.zoom === 1; }
  get current(): MediaItem { return this.stops[this.idx]; }
  get label(): string { return `${this.idx + 1} of ${this.stops.length}`; }
  get chapter(): string { return TOUR_PINS[this.current.id]?.chapter ?? ''; }
  chapterOf(s: MediaItem): string { return TOUR_PINS[s.id]?.chapter ?? ''; }

  /** Position of the current stop on the mini plan. */
  get pin(): { x: number; y: number } {
    const p = TOUR_PINS[this.current.id] ?? { x: 24.7, y: -10 };
    return { x: this.mp.ox + p.x * this.mp.s, y: this.mp.oy + p.y * this.mp.s };
  }
  m(ft: number): number { return +(ft * this.mp.s).toFixed(1); }

  /**
   * Which stops are in the page. The walkthrough page always has the current stop (it is the page's main picture); the home page
   * adds the tour only when it is about to be scrolled to. Neighbours follow once the tour is near, so Next / Previous are instant.
   */
  shows(i: number): boolean {
    if (this.variant === 'page' && i === this.idx) return true;
    return this.seen && Math.abs(i - this.idx) <= 1;
  }

  go(i: number, byUser = true) {
    const n = this.stops.length;
    this.idx = (i + n) % n;
    this.resetZoom();
    if (byUser) {
      this.playing = false;
      this.hintShown = false;
      this.analytics.event('tour_step', { step: this.stops[this.idx].id });
    }
  }
  next() { this.go(this.idx + 1); }
  prev() { this.go(this.idx - 1); }

  toggle() {
    if (this.playing) { this.playing = false; return; }
    if (this.idx === this.stops.length - 1) this.idx = 0;
    this.resetZoom();
    this.playing = true;
    this.analytics.event('tour_play');
  }

  /** The progress bar of the current stop finished its run. */
  onSegmentEnd(i: number) {
    if (i !== this.idx || !this.playing) return;
    if (this.idx < this.stops.length - 1) this.idx++;
    else this.playing = false;
  }

  /* ---- zoom and pan ---- */
  zoomBy(dir: 1 | -1) {
    const i = Math.max(0, Math.min(this.zooms.length - 1, this.zooms.indexOf(this.zoom) + dir));
    this.setZoom(this.zooms[i]);
  }
  setZoom(z: number) {
    this.zoom = z;
    this.playing = this.playing && z === 1;
    this.hintShown = false;
    this.clamp();
    if (z === 1) { this.tx = 0; this.ty = 0; }
    this.analytics.event('tour_zoom', { zoom: z });
  }
  resetZoom() { this.zoom = 1; this.tx = 0; this.ty = 0; }
  private clamp() {
    const r = this.wrap.nativeElement.querySelector('.stage')?.getBoundingClientRect();
    if (!r) return;
    const mx = (r.width * (this.zoom - 1)) / 2, my = (r.height * (this.zoom - 1)) / 2;
    this.tx = Math.max(-mx, Math.min(mx, this.tx));
    this.ty = Math.max(-my, Math.min(my, this.ty));
  }

  fullscreen() {
    const el = this.wrap.nativeElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    const d = this.doc as Document & { webkitExitFullscreen?: () => void; webkitFullscreenElement?: Element };
    if (this.full) { (d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.()); return; }
    this.playing = false;
    this.analytics.event('tour_fullscreen');
    if (el.requestFullscreen) el.requestFullscreen().catch(() => this.open());
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else this.open();
  }

  onKey(e: KeyboardEvent) {
    const k = e.key;
    if (k === 'ArrowRight') { this.next(); e.preventDefault(); }
    else if (k === 'ArrowLeft') { this.prev(); e.preventDefault(); }
    else if (k === 'Home') { this.go(0); e.preventDefault(); }
    else if (k === 'End') { this.go(this.stops.length - 1); e.preventDefault(); }
    else if (k === ' ' || k === 'k') { this.toggle(); e.preventDefault(); }
    else if (k === '+' || k === '=') { this.zoomBy(1); e.preventDefault(); }
    else if (k === '-' || k === '_') { this.zoomBy(-1); e.preventDefault(); }
    else if (k === 'f' || k === 'F') { if (this.canFullscreen) { this.fullscreen(); e.preventDefault(); } }
  }

  onDown(e: PointerEvent) {
    this.startX = e.clientX; this.startY = e.clientY; this.moved = false;
    this.dragging = this.zoom > 1;
    this.base = { tx: this.tx, ty: this.ty };
    if (this.dragging) (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  onMove(e: PointerEvent) {
    if (!this.dragging) return;
    this.moved = true;
    this.tx = this.base.tx + (e.clientX - this.startX);
    this.ty = this.base.ty + (e.clientY - this.startY);
    this.clamp();
  }
  onUp(e: PointerEvent) {
    const dx = e.clientX - this.startX, dy = e.clientY - this.startY;
    if (this.dragging) { this.dragging = false; return; }
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) (dx < 0 ? this.next() : this.prev());
  }
  onDouble() { this.setZoom(this.zoom === 1 ? 2.6 : 1); }

  open() { this.lightboxIndex = this.idx; this.analytics.event('tour_enlarge'); }
  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
}
