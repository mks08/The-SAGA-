import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { CORE_FAQ, HOME_ANSWER } from '../../config/faq.config';
import { LANDING_PAGES } from '../../config/landing.config';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  landing = LANDING_PAGES;
  faqs = CORE_FAQ;
  answer = HOME_ANSWER;
  constructor(private seo: SeoService) {}
  ngOnInit(): void {
    this.seo.apply('');
  }
}
