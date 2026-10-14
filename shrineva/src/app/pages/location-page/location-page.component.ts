import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-location-page',
  templateUrl: './location-page.component.html',
})
export class LocationPageComponent implements OnInit {
  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('location'); }
}
