import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { MARKETING_AREA, PROPERTY, waLink } from '../../config/property.config';
import { openLeadPath } from '../../core/ui-events';
import { LEASING_POINTS, LEASING_STEPS } from '../../config/content.config';
import { faqForPath } from '../../config/faq.config';

@Component({
  selector: 'app-leasing-page',
  templateUrl: './leasing-page.component.html',
})
export class LeasingPageComponent implements OnInit {
  property = PROPERTY;
  faqs = faqForPath('leasing');
  area = MARKETING_AREA;
  waHref = waLink(`Hi, I'd like to request the leasing information pack for SHRINEVA, ${PROPERTY.address.full}.`);

  points = LEASING_POINTS;
  steps = LEASING_STEPS;

  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('leasing'); }

  openBrochure(): void { openLeadPath({ source: 'leasing_page', path: 'brochure' }); }
  openVisit(): void { openLeadPath({ source: 'leasing_page', path: 'visit' }); }
}
