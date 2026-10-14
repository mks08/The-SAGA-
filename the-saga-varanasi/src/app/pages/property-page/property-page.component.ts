import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY } from '../../config/property.config';

@Component({
  selector: 'app-property-page',
  templateUrl: './property-page.component.html',
})
export class PropertyPageComponent implements OnInit {
  property = PROPERTY;
  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('property'); }
}
