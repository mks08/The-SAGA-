import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY } from '../../config/property.config';

@Component({
  selector: 'app-terms-page',
  templateUrl: './terms-page.component.html',
})
export class TermsPageComponent implements OnInit {
  property = PROPERTY;
  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('terms'); }
}
