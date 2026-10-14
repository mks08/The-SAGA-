import { Component } from '@angular/core';
import { PROPERTY, waLink } from '../../config/property.config';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  styleUrls: ['./site-footer.component.scss'],
})
export class SiteFooterComponent {
  property = PROPERTY;
  waHref = waLink();
  year = new Date().getFullYear();
}
