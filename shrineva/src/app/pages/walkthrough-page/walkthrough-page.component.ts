import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROGRESS_UPDATES, ProgressUpdate } from '../../config/content.config';
import { MediaItem } from '../../config/media.config';
import { openLeadPath, openLightbox } from '../../core/ui-events';

@Component({
  selector: 'app-walkthrough-page',
  templateUrl: './walkthrough-page.component.html',
})
export class WalkthroughPageComponent implements OnInit {
  progress = PROGRESS_UPDATES;

  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('walkthrough'); }

  /** Opens the dated progress photographs in the image viewer, starting at the one that was pressed. */
  enlarge(u: ProgressUpdate): void {
    const withPhoto = this.progress.filter((p) => !!p.photo);
    const items: MediaItem[] = withPhoto.map((p) => ({
      id: `progress-${p.date}`, group: 'Progress', title: p.title, caption: p.text, alt: p.alt || p.title,
      src: p.photo as string, thumb: p.photo as string, width: p.width || 1600, height: p.height || 1200,
    }));
    openLightbox({ items, index: Math.max(0, withPhoto.indexOf(u)), disclaimer: 'Site photograph. Construction is ongoing.' });
  }

  openBrochure(): void { openLeadPath({ source: 'walkthrough', path: 'brochure' }); }
}
