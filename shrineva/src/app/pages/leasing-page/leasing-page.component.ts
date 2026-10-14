import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY, waLink } from '../../config/property.config';

@Component({
  selector: 'app-leasing-page',
  templateUrl: './leasing-page.component.html',
})
export class LeasingPageComponent implements OnInit {
  property = PROPERTY;
  waHref = waLink(`Hi, I'd like to request the leasing information pack for SHRINEVA, ${PROPERTY.address.full}.`);

  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('leasing'); }
}
