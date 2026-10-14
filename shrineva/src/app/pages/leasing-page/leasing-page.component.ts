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

  points = [
    `${PROPERTY.area.floorAreaPerFloorSqFt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sq ft floor area per floor (${PROPERTY.area.carpetAreaPerFloorSqFt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sq ft carpet)`,
    'Full-floor lease or subdivision, subject to requirement',
    'Long-term leases accepted',
    'Mixed commercial use across Floors 1, 2 and 3; hotel and studio-apartment formats are a possibility',
    'Fit-out and handover condition agreed with each occupier',
    'Brand visibility on a 24 m road, signage and ground-level parking',
  ];

  steps = [
    { t: 'Tell us what you need', d: 'Area, use and timing. Use the form, call or WhatsApp.' },
    { t: 'See it', d: 'Floor options, the information pack and a visit to the plot.' },
    { t: 'Agree the terms', d: 'Commercial terms, fit-out and handover condition, in writing.' },
  ];

  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('leasing'); }
}
