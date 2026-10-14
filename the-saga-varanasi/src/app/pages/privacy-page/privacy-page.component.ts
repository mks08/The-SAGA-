import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY } from '../../config/property.config';

@Component({
  selector: 'app-privacy-page',
  templateUrl: './privacy-page.component.html',
})
export class PrivacyPageComponent implements OnInit {
  property = PROPERTY;
  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('privacy'); }
}
