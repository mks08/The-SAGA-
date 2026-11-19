import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY } from '../../config/property.config';

/** /privacy-disclaimer: the former /privacy and /disclaimer pages merged into one URL. */
@Component({
  selector: 'app-privacy-disclaimer-page',
  templateUrl: './privacy-disclaimer-page.component.html',
})
export class PrivacyDisclaimerPageComponent implements OnInit {
  property = PROPERTY;
  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('privacy-disclaimer'); }
}
