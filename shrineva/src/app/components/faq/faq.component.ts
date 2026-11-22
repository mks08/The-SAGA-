import { Component, Input } from '@angular/core';
import { Faq } from '../../config/faq.config';
import { PROPERTY } from '../../config/property.config';
import { PageLangService } from '../../core/services/page-lang.service';
import { openChaix } from '../../core/ui-events';

/**
 * Visible FAQ block. The same items are written into the FAQPage JSON-LD (core/seo/schema.ts), the static HTML (scripts/build-seo.js)
 * and llms.txt, so what visitors read is exactly what search and AI engines are given.
 *
 * On wide screens the heading stays in view in its own column beside the questions, with a shortcut to ChaiX and the phone number.
 * On phones and tablets the layout stacks and the shortcut is left out (the action bar and the ChaiX button are always on screen there).
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

  property = PROPERTY;

  constructor(public lang: PageLangService) {}

  ask(): void {
    openChaix({ source: 'faq' });
  }
}
