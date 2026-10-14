import { Component, Input } from '@angular/core';
import { PROPERTY } from '../../config/property.config';
import { MediaItem, RENDERS, RENDER_GROUPS } from '../../config/media.config';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
})
export class GalleryComponent {
  @Input() showIntro = true;
  /** Home shows a curated set; the gallery page shows everything with filters. */
  @Input() limit = 0;
  @Input() showPageLink = false;

  property = PROPERTY;
  groups = ['All', ...RENDER_GROUPS];
  active = 'All';
  lightboxIndex: number | null = null;

  private featured = ['facade-golden', 'facade-night', 'entry-portal', 'parking-night', 'east-mural', 'lift-lobby'];

  get all(): MediaItem[] {
    return this.active === 'All' ? RENDERS : RENDERS.filter((r) => r.group === this.active);
  }

  get items(): MediaItem[] {
    if (!this.limit) return this.all;
    return this.featured.map((id) => RENDERS.find((r) => r.id === id) as MediaItem).slice(0, this.limit);
  }

  get total(): number { return RENDERS.length; }
  get isHome(): boolean { return this.limit > 0; }

  /** Bento layout: one big tile first; on the home page the last tiles widen so the grid has no holes. */
  spanClass(i: number): string {
    const big = this.isHome || this.active === 'All';
    const n = this.items.length;
    if (big && i === 0) return 'col-span-2 row-span-2';
    if (this.isHome) return i === n - 1 ? 'col-span-2' : i >= 3 ? 'md:col-span-2' : '';
    return '';
  }

  select(g: string) { this.active = g; }
  open(i: number) { this.lightboxIndex = i; }

  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
}
