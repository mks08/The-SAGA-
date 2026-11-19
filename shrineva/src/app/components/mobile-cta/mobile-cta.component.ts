import { Component } from '@angular/core';
import { PROPERTY, waLink } from '../../config/property.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/**
 * Sticky action bar for phones (hidden from the md breakpoint up, where the WhatsApp button and the header buttons are used).
 * Call and WhatsApp are plain links, so AnalyticsService counts them as shrineva_phone_click / shrineva_whatsapp_click.
 * "Book Visit" jumps to the enquiry form when the page has one (#enquiry), otherwise opens the short site-visit pop-up.
 */
@Component({
  selector: 'app-mobile-cta',
  templateUrl: './mobile-cta.component.html',
  styleUrls: ['./mobile-cta.component.scss'],
})
export class MobileCtaComponent {
  property = PROPERTY;
  waHref = waLink();

  constructor(private analytics: AnalyticsService) {}

  bookVisit(): void {
    this.analytics.event('site_visit_click', { source: 'mobile_bar' });
    const form = document.getElementById('enquiry');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => (form.querySelector('input,select') as HTMLElement | null)?.focus({ preventScroll: true }), 500);
      return;
    }
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
