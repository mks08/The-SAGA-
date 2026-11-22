import { Component, Input } from '@angular/core';
import { BROCHURE } from '../../config/media.config';
import { openLeadPath } from '../../core/ui-events';

/**
 * The brochure. The PDF is handed over through the enquiry form (mobile number and email), so the button opens the
 * "Brochure" path of the site-wide dialog; the download starts as soon as the details are accepted.
 * `compact` tightens the section spacing for use inside other pages.
 */
@Component({
  selector: 'app-brochure-card',
  templateUrl: './brochure-card.component.html',
})
export class BrochureCardComponent {
  @Input() compact = false;
  brochure = BROCHURE;
  open(): void { openLeadPath({ path: 'brochure', source: 'brochure_card' }); }
}
