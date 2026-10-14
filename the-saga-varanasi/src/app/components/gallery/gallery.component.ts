import { Component, Input } from '@angular/core';
import { PROPERTY } from '../../config/property.config';
import { MediaItem, RENDERS, RENDER_GROUPS } from '../../config/media.config';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
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

  private featured = ['facade-golden', 'facade-night', 'entry-portal', 'stilt-night', 'east-mural', 'lift-lobby'];

  get all(): MediaItem[] {
    return this.active === 'All' ? RENDERS : RENDERS.filter((r) => r.group === this.active);
  }

  get items(): MediaItem[] {
    if (!this.limit) return this.all;
    return this.featured.map((id) => RENDERS.find((r) => r.id === id) as MediaItem).slice(0, this.limit);
  }

  get total(): number { return RENDERS.length; }
  get isHome(): boolean { return this.limit > 0; }

  select(g: string) { this.active = g; }
  open(i: number) { this.lightboxIndex = i; }

  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
}
