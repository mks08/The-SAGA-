import { Component, Input } from '@angular/core';
import { PROJECT_STATUS, ProjectStage } from '../../config/content.config';
import { MediaItem, SITE_PHOTOS } from '../../config/media.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/**
 * Project progress: four stages (structure, brickwork / façade / lift / services, final works, project completion), the
 * targeted completion month with "subject to approvals", and the real site photographs under it.
 *
 * Everything shown comes from config/content.config.ts (PROJECT_STATUS) and config/media.config.ts (SITE_PHOTOS), so the
 * page, the FAQ, the structured data, the brochure and llms.txt cannot disagree. The month is always a target.
 * Plain server-rendered HTML (an ordered list and images with sizes), so crawlers and AI assistants read the same text.
 */
@Component({
  selector: 'app-project-timeline',
  templateUrl: './project-timeline.component.html',
  styleUrls: ['./project-timeline.component.scss'],
})
export class ProjectTimelineComponent {
  /** Site photographs under the stages (home). The walkthrough page shows them in its own gallery instead. */
  @Input() showPhotos = true;
  /** The "want changes to your floor?" note. */
  @Input() showChanges = true;

  status = PROJECT_STATUS;
  photos: MediaItem[] = SITE_PHOTOS;
  lightboxIndex: number | null = null;

  constructor(private analytics: AnalyticsService) {}

  open(i: number) {
    this.lightboxIndex = i;
    this.analytics.event('site_photo_open', { source: 'progress', index: i });
  }

  ask() {
    this.analytics.event('site_visit_click', { source: 'progress' });
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }

  /** Thumbnails are 640 px wide; the height follows the photo's own proportions. */
  thumbHeight(p: MediaItem): number { return Math.round((p.height * 640) / p.width); }

  /** Grid cell for photo `i`: the first (portrait) one is the large cell, the last two are wide. */
  cell(i: number): string {
    if (i === 0) return 'col-span-2 aspect-[4/5] sm:aspect-[4/3] lg:col-span-2 lg:row-span-2 lg:aspect-auto';
    if (i >= this.photos.length - 2) return 'aspect-[4/3] lg:col-span-3 lg:aspect-[16/9]';
    return 'aspect-[4/3] lg:col-span-2';
  }

  trackById(_: number, s: ProjectStage) { return s.id; }
}
