import { Component } from '@angular/core';
import { MARKETING_AREA, PROPERTY, mapLinks, waLink } from '../../config/property.config';
import { BROCHURE } from '../../config/media.config';

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
  brochure = BROCHURE;
}
