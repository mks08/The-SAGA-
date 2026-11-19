import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY, mapLinks, waLink } from '../../config/property.config';
import { faqForPath } from '../../config/faq.config';

/** /location-contact: the address, map, distances, opening hours and the qualified site-visit / leasing form on one page. */
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
}
