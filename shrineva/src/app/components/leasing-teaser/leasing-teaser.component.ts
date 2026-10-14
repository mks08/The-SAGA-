import { Component } from '@angular/core';
import { PROPERTY, waLink } from '../../config/property.config';

@Component({
  selector: 'app-leasing-teaser',
  templateUrl: './leasing-teaser.component.html',
  styleUrls: ['./leasing-teaser.component.scss'],
})
export class LeasingTeaserComponent {
  property = PROPERTY;
  waHref = waLink(`Hi, I'd like to request the leasing information pack for SHRINEVA, ${PROPERTY.address.full}.`);
}
