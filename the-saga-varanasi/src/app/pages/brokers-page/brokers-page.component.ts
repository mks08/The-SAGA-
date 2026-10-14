import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY, waLink } from '../../config/property.config';

@Component({
  selector: 'app-brokers-page',
  templateUrl: './brokers-page.component.html',
})
export class BrokersPageComponent implements OnInit {
  property = PROPERTY;
  waHref = waLink(`Hi, I represent a brand/brokerage and would like to register a requirement for SHRINEVA, ${PROPERTY.address.full}.`);

  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('brokers'); }
}
