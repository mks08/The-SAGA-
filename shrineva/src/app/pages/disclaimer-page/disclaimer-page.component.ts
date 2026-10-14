import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY } from '../../config/property.config';

@Component({
  selector: 'app-disclaimer-page',
  templateUrl: './disclaimer-page.component.html',
})
export class DisclaimerPageComponent implements OnInit {
  property = PROPERTY;
  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('disclaimer'); }
}
