import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY, mapLinks, waLink } from '../../config/property.config';
import { faqForPath } from '../../config/faq.config';
import { openLeadPath } from '../../core/ui-events';

/** /location-contact: the address, map, distances and the qualified site-visit / leasing form on one page. */
@Component({
  selector: 'app-location-contact-page',
  templateUrl: './location-contact-page.component.html',
})
export class LocationContactPageComponent implements OnInit {
  property = PROPERTY;
  links = mapLinks();
  waHref = waLink();
  faqs = faqForPath('location-contact');

  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('location-contact'); }

  openVisit(): void { openLeadPath({ source: 'location_page', path: 'visit' }); }
}
