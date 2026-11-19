import { Component } from '@angular/core';
import { MARKETING_AREA, PROPERTY, mapLinks, waLink } from '../../config/property.config';
import { LOCATION_MAP, DOSSIER } from '../../config/media.config';
import { NEARBY_DISTANCES } from '../../config/location.config';

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
  map = LOCATION_MAP;
  links = mapLinks();
  dossier = DOSSIER;
  rows = NEARBY_DISTANCES.filter((r) => r.footer);
}
