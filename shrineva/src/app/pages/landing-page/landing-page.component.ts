import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY, waLink } from '../../config/property.config';
import { RENDERS } from '../../config/media.config';
import { Faq, faqForPath } from '../../config/faq.config';
import { LANDING_PAGES, LandingPage } from '../../config/landing.config';
import { openLightbox } from '../../core/ui-events';

/**
 * One template for the three intent landing pages (healthcare / office / retail). All copy lives in landing.config.ts so the
 * page, the FAQPage markup and the static HTML written by scripts/build-seo.js can never disagree.
 */
@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent implements OnInit {
  page!: LandingPage;
  faqs: Faq[] = [];
  others: LandingPage[] = [];
  property = PROPERTY;
  waHref = waLink();
  render = RENDERS.find((r) => r.id === 'facade-day') ?? RENDERS[0];

  facts: { label: string; value: string }[] = [
    { label: 'Frontage', value: 'About 50 ft' },
    { label: 'Road', value: '24 m wide, north-facing' },
    { label: 'Per upper floor', value: 'About 3,500 sq ft gross' },
    { label: 'Carpet', value: 'About 3,100 sq ft' },
    { label: 'Lift', value: '10-passenger lift' },
    { label: 'Parking', value: '12+ cars at ground level' },
  ];

  constructor(private route: ActivatedRoute, private seo: SeoService) {}

  enlarge(): void {
    openLightbox({ items: [this.render], disclaimer: 'Indicative render. Construction is ongoing and the design is subject to change.' });
  }

  ngOnInit(): void {
    const key = this.route.snapshot.data['landing'] as string;
    this.page = LANDING_PAGES.find((l) => l.key === key) ?? LANDING_PAGES[0];
    this.others = LANDING_PAGES.filter((l) => l.key !== this.page.key);
    this.faqs = faqForPath(this.page.path, this.page.faq);
    this.seo.apply(this.page.path);
  }
}
