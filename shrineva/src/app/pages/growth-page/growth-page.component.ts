import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-growth-page',
  templateUrl: './growth-page.component.html',
})
export class GrowthPageComponent implements OnInit {
  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('growth'); }
}
