import { Component, Input } from '@angular/core';
import { PROPERTY, waLink } from '../../config/property.config';
import { FAQS, HOME_FAQ_COUNT } from '../../config/faq.config';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FaqComponent {
  /** Home shows the top questions with a link to /faq. */
  @Input() preview = false;
  @Input() showIntro = true;

  open: number | null = 0;
  property = PROPERTY;
  waHref = waLink();

  get faqs() { return this.preview ? FAQS.slice(0, HOME_FAQ_COUNT) : FAQS; }

  toggle(i: number) { this.open = this.open === i ? null : i; }

  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
}
