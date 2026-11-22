import { Component } from '@angular/core';
import { MARKETING_AREA, PROPERTY, mapLinks, waLink } from '../../config/property.config';
import { openLeadPath } from '../../core/ui-events';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  styleUrls: ['./site-footer.component.scss'],
})
export class SiteFooterComponent {
  property = PROPERTY;
  area = MARKETING_AREA;
  waHref = waLink();
  year = new Date().getFullYear();
  links = mapLinks();
  openBrochure(): void { openLeadPath({ source: 'footer', path: 'brochure' }); }
}
