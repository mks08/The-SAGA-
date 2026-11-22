import { Component } from '@angular/core';
import { PROPERTY, waLink } from '../../config/property.config';
import { AnalyticsService } from '../../core/services/analytics.service';
import { PageLangService } from '../../core/services/page-lang.service';
import { HI } from '../../config/hindi.config';
import { openLeadPath } from '../../core/ui-events';

/**
 * Sticky action bar for phones (hidden from the md breakpoint up, where the WhatsApp button and the header buttons are used).
 * Three actions: Call and WhatsApp are plain links, so AnalyticsService counts them as shrineva_phone_click /
 * shrineva_whatsapp_click; Visit opens the three-path enquiry dialog. ChaiX is not in the bar: its round launcher floats above
 * the bar on every screen (components/chaix).
 */
@Component({
  selector: 'app-mobile-cta',
  templateUrl: './mobile-cta.component.html',
  styleUrls: ['./mobile-cta.component.scss'],
})
export class MobileCtaComponent {
  property = PROPERTY;
  /** The WhatsApp message and labels follow the page language (Hindi on /hi). */
  get hindi(): boolean { return this.lang.hindi; }
  get waHref(): string { return waLink(this.lang.hindi ? HI.waMessage : undefined); }

  constructor(private analytics: AnalyticsService, private lang: PageLangService) {}

  bookVisit(): void {
    this.analytics.event('site_visit_click', { source: 'mobile_bar' });
    openLeadPath({ source: 'mobile_bar', path: 'visit' });
  }
}
