import { Component, Input } from '@angular/core';
import { PROPERTY } from '../../config/property.config';
import { MediaItem, SITE_PHOTOS } from '../../config/media.config';
import { PROJECT_STATUS } from '../../config/content.config';

/** Real photographs of the building as it stands today (construction ongoing). Opens in the lightbox. */
@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
})
export class GalleryComponent {
  @Input() showIntro = true;

  property = PROPERTY;
  items: MediaItem[] = SITE_PHOTOS;
  photosTaken = PROJECT_STATUS.photosTaken;
  lightboxIndex: number | null = null;

  open(i: number) { this.lightboxIndex = i; }

  /** Thumbnails are 640 px wide; the height follows the photo's own proportions. */
  thumbHeight(p: MediaItem): number { return Math.round((p.height * 640) / p.width); }
}
