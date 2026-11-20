import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { HI, HI_DISTANCES } from '../../config/hindi.config';
import { HERO, BROCHURE } from '../../config/media.config';
import { PROPERTY, waLink } from '../../config/property.config';

/** Hindi page (/hi): the same facts as the English site, for people who search in Hindi. Copy: config/hindi.config.ts. */
@Component({
  selector: 'app-hindi-page',
  templateUrl: './hindi-page.component.html',
})
export class HindiPageComponent implements OnInit {
  t = HI;
  distances = HI_DISTANCES;
  property = PROPERTY;
  brochure = BROCHURE;
  hero = HERO;
  waHref = waLink(HI.waMessage);

  constructor(private seo: SeoService, private analytics: AnalyticsService) {}

  ngOnInit(): void { this.seo.apply(HI.path); }

  openPopup(): void {
    this.analytics.event('site_visit_click', { source: 'hindi_page' });
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
