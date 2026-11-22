import { Component, ElementRef, EventEmitter, HostListener, Inject, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MediaItem } from '../../../config/media.config';

export type LightboxLang = 'en' | 'hi';

const TEXT: Record<LightboxLang, { close: string; closeAria: string; zoom: string; fit: string; prev: string; next: string }> = {
  en: { close: 'Close', closeAria: 'Close the viewer', zoom: 'Zoom in', fit: 'Fit to screen', prev: 'Previous image', next: 'Next image' },
  hi: { close: 'बंद करें', closeAria: 'तस्वीर बंद करें', zoom: 'ज़ूम करें', fit: 'स्क्रीन में फ़िट करें', prev: 'पिछली तस्वीर', next: 'अगली तस्वीर' },
};

/** A swipe counts when it travels this far sideways, mostly sideways, and quickly. */
const SWIPE_MIN_PX = 48;
const SWIPE_MAX_MS = 800;

/**
 * Full-screen image viewer, used wherever a picture can be pressed to enlarge it.
 *
 *  - Opens on a solid backdrop (nothing from the page shows through), respects phone notches and home bars.
 *  - Phone: swipe left or right to move between pictures; pinch with two fingers to zoom the page natively;
 *    "Zoom in" shows the picture at its full size inside a scrollable frame (drag to look around).
 *  - Desktop: Esc closes, ← → move, double-click zooms, click outside the picture closes.
 *  - Keyboard and screen readers: focus moves to Close when it opens, Tab stays inside it, and focus returns to the button
 *    that opened it when it closes.
 */
@Component({
  selector: 'app-lightbox',
  templateUrl: './lightbox.component.html',
  styleUrls: ['./lightbox.component.scss'],
})
export class LightboxComponent implements OnChanges, OnDestroy {
  @Input() items: MediaItem[] = [];
  @Input() index: number | null = null;
  @Input() disclaimer = '';
  /** Language of the buttons ("Close", "Zoom in", ...). The Hindi page passes 'hi'. */
  @Input() lang: LightboxLang = 'en';
  @Output() closed = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  @ViewChild('closeBtn') private closeBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('stage') private stage?: ElementRef<HTMLElement>;
  @ViewChild('frame') private frame?: ElementRef<HTMLElement>;

  zoomed = false;

  private wasOpen = false;
  private opener: HTMLElement | null = null;
  private touchX = 0;
  private touchY = 0;
  private touchAt = 0;
  private touching = false;

  constructor(@Inject(DOCUMENT) private doc: Document) {}

  get t() { return TEXT[this.lang === 'hi' ? 'hi' : 'en']; }

  get open(): boolean {
    return this.index !== null && this.items.length > 0;
  }

  get current(): MediaItem | null {
    return this.open ? this.items[this.index as number] : null;
  }

  ngOnChanges(): void {
    const isOpen = this.open;
    if (isOpen && !this.wasOpen) this.opened();
    else if (!isOpen && this.wasOpen) this.dismissed(true);
    this.wasOpen = isOpen;
    this.zoomed = false;
    if (isOpen) this.preloadNeighbours();
  }

  ngOnDestroy(): void {
    if (this.wasOpen) this.dismissed(false);
  }

  close(): void {
    this.closed.emit();
  }

  step(delta: number): void {
    if (!this.open || this.items.length < 2) return;
    const n = this.items.length;
    this.indexChange.emit((((this.index as number) + delta) % n + n) % n);
  }

  toggleZoom(): void {
    this.zoomed = !this.zoomed;
    if (this.zoomed) setTimeout(() => this.centreZoom(), 0);
  }

  /** Puts the middle of the picture in the middle of the frame (runs after the zoomed image is laid out and again once it has loaded). */
  centreZoom(): void {
    const el = this.stage?.nativeElement;
    if (!el || !this.zoomed) return;
    el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
    el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
  }

  /** A click on the empty space around the picture closes the viewer; a click on the picture or a button does not. */
  onStageClick(e: MouseEvent): void {
    e.stopPropagation();
    if (!this.zoomed && e.target === e.currentTarget) this.close();
  }

  onTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1 || this.zoomed) { this.touching = false; return; }
    const p = e.touches[0];
    this.touchX = p.clientX;
    this.touchY = p.clientY;
    this.touchAt = Date.now();
    this.touching = true;
  }

  onTouchEnd(e: TouchEvent): void {
    if (!this.touching) return;
    this.touching = false;
    // While the page itself is pinch-zoomed, a sideways drag moves the view, it does not change the picture.
    const vv = this.doc.defaultView?.visualViewport;
    if (vv && vv.scale > 1.02) return;
    const p = e.changedTouches[0];
    if (!p) return;
    const dx = p.clientX - this.touchX;
    const dy = p.clientY - this.touchY;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.4 && Date.now() - this.touchAt <= SWIPE_MAX_MS) {
      this.step(dx < 0 ? 1 : -1);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.open) return;
    if (e.key === 'Escape') this.close();
    else if (e.key === 'ArrowRight') this.step(1);
    else if (e.key === 'ArrowLeft') this.step(-1);
    else if (e.key === 'Tab') this.keepFocusInside(e);
  }

  // ── internals ────────────────────────────────────────────────────────────────

  private opened(): void {
    const active = this.doc.activeElement as HTMLElement | null;
    this.opener = active && active !== this.doc.body ? active : null;
    this.doc.body.style.overflow = 'hidden';
    // Stops a downward swipe on the viewer from pulling the page down to refresh it (Android Chrome).
    this.doc.documentElement.style.overscrollBehavior = 'contain';
    setTimeout(() => this.closeBtn?.nativeElement.focus({ preventScroll: true }), 0);
  }

  private dismissed(restoreFocus: boolean): void {
    this.doc.body.style.overflow = '';
    this.doc.documentElement.style.overscrollBehavior = '';
    const el = this.opener;
    this.opener = null;
    if (restoreFocus && el && this.doc.contains(el)) el.focus({ preventScroll: true });
  }

  /** Warms the cache with the picture on either side so swiping feels instant on a phone connection. */
  private preloadNeighbours(): void {
    if (typeof Image === 'undefined' || this.items.length < 2) return;
    const n = this.items.length;
    const i = this.index as number;
    for (const j of [(i + 1) % n, (i - 1 + n) % n]) {
      const img = new Image();
      img.src = this.items[j].src;
    }
  }

  private keepFocusInside(e: KeyboardEvent): void {
    const root = this.frame?.nativeElement;
    if (!root) return;
    const focusable = Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.doc.activeElement as HTMLElement | null;
    const inside = !!active && root.contains(active);
    if (e.shiftKey && (!inside || active === first)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (!inside || active === last)) { e.preventDefault(); first.focus(); }
  }
}
