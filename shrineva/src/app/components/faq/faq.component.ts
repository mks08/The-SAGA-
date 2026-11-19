import { Component, Input } from '@angular/core';
import { Faq } from '../../config/faq.config';

/**
 * Visible FAQ block. The same items are written into the FAQPage JSON-LD (core/seo/schema.ts), the static HTML (scripts/build-seo.js)
 * and llms.txt, so what visitors read is exactly what search and AI engines are given.
 */
@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
})
export class FaqComponent {
  @Input() items: Faq[] = [];
  @Input() heading = 'Frequently asked questions';
  @Input() eyebrow = 'FAQ';
  @Input() headingId = 'faq-title';
}
