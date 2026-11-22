import { Component, Input } from '@angular/core';
import { PROPERTY, waLink } from '../../config/property.config';

/**
 * Leasing-desk block: the ways to reach the team, plus the three-path enquiry form (LeadFormComponent).
 * Used on the home page; the dedicated page is /location-contact.
 */
@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent {
  @Input() showIntro = true;
  property = PROPERTY;
  waHref = waLink();
}
