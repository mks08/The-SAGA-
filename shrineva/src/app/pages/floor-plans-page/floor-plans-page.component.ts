import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY } from '../../config/property.config';
import { FLOOR_PLANS_PDF } from '../../config/media.config';

@Component({
  selector: 'app-floor-plans-page',
  templateUrl: './floor-plans-page.component.html',
  styleUrls: ['./floor-plans-page.component.scss'],
})
export class FloorPlansPageComponent implements OnInit {
  property = PROPERTY;
  pdf = FLOOR_PLANS_PDF;

  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('floor-plans'); }
}
