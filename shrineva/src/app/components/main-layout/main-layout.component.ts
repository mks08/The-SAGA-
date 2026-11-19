import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { CORE_FAQ, HOME_ANSWER } from '../../config/faq.config';
import { LANDING_PAGES } from '../../config/landing.config';
import { MARKETING_AREA, PLAN, PROPERTY } from '../../config/property.config';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  landing = LANDING_PAGES;
  faqs = CORE_FAQ;
  answer = HOME_ANSWER;

  /** The same verified facts every landing page shows (property.config.ts). */
  facts: { label: string; value: string }[] = [
    { label: 'Per upper floor', value: `${MARKETING_AREA.gross.replace('about', 'About')} gross` },
    { label: 'Carpet', value: MARKETING_AREA.carpet.replace('about', 'About') },
    { label: 'Frontage', value: `${PLAN.plot.frontage.replace('about', 'About')} on a ${PLAN.plot.roadWidthM} m road` },
    { label: 'Lift', value: `${PLAN.lift.adjective} lift` },
    { label: 'Parking', value: '12+ cars at ground level' },
    { label: 'Hours', value: PROPERTY.contact.hours },
  ];

  constructor(private seo: SeoService) {}
  ngOnInit(): void {
    this.seo.apply('');
  }
}
