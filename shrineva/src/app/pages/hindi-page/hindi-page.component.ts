import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { HI, HI_DISTANCES } from '../../config/hindi.config';
import { HERO, HERO_H, HERO_W, MediaItem } from '../../config/media.config';
import { PROPERTY, waLink } from '../../config/property.config';
import { openLeadPath, openLightbox } from '../../core/ui-events';

/** Hindi page (/hi): the same facts as the English site, for people who search in Hindi. Copy: config/hindi.config.ts. */
@Component({
  selector: 'app-hindi-page',
  templateUrl: './hindi-page.component.html',
})
export class HindiPageComponent implements OnInit {
  t = HI;
  distances = HI_DISTANCES;
  property = PROPERTY;
  hero = HERO;
  waHref = waLink(HI.waMessage);

  /** The hero picture as the image viewer shows it (the viewer takes its Hindi button labels from the page language). */
  private heroItem: MediaItem = {
    id: 'hero', group: 'Home', title: HI.imageTitle, caption: HI.imageCaption,
    alt: HI.imageAlt, src: HERO.src1920, thumb: HERO.src960, width: HERO_W, height: HERO_H,
  };

  constructor(private seo: SeoService, private analytics: AnalyticsService) {}

  ngOnInit(): void { this.seo.apply(HI.path); }

  enlarge(): void { openLightbox({ items: [this.heroItem], disclaimer: HI.imageNote }); }

  openPopup(): void {
    this.analytics.event('site_visit_click', { source: 'hindi_page' });
    openLeadPath({ source: 'hindi_page', path: 'visit' });
  }

  openBrochure(): void { openLeadPath({ source: 'hindi_page', path: 'brochure' }); }
}
