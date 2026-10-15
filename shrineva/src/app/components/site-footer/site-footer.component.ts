import { Component } from '@angular/core';
import { PROPERTY, mapLinks, waLink } from '../../config/property.config';
import { LOCATION_MAP } from '../../config/media.config';
import { NEARBY_DISTANCES } from '../../config/location.config';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  styleUrls: ['./site-footer.component.scss'],
})
export class SiteFooterComponent {
  property = PROPERTY;
  waHref = waLink();
  year = new Date().getFullYear();
  map = LOCATION_MAP;
  links = mapLinks();
  rows = NEARBY_DISTANCES.filter((r) => r.footer);
}
