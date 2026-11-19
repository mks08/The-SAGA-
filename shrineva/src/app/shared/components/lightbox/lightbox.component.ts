import { Component, EventEmitter, HostListener, Inject, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MediaItem } from '../../../config/media.config';

/**
 * Accessible full-screen image viewer: keyboard (Esc, ←, →), previous/next,
 * counter, caption, "zoom" toggle that shows the image at natural width with scroll.
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
  @Output() closed = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  zoomed = false;

  constructor(@Inject(DOCUMENT) private doc: Document) {}

  get open(): boolean {
    return this.index !== null && this.items.length > 0;
  }

  get current(): MediaItem | null {
    return this.open ? this.items[this.index as number] : null;
  }

  ngOnChanges(): void {
    this.zoomed = false;
    this.doc.body.style.overflow = this.open ? 'hidden' : '';
  }

  ngOnDestroy(): void {
    this.doc.body.style.overflow = '';
  }

  close(): void {
    this.doc.body.style.overflow = '';
    this.closed.emit();
  }

  step(delta: number): void {
    if (!this.open) return;
    const n = this.items.length;
    this.indexChange.emit((((this.index as number) + delta) % n + n) % n);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.open) return;
    if (e.key === 'Escape') this.close();
    else if (e.key === 'ArrowRight') this.step(1);
    else if (e.key === 'ArrowLeft') this.step(-1);
  }
}
