import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-business-fit-page',
  templateUrl: './business-fit-page.component.html',
})
export class BusinessFitPageComponent implements OnInit {
  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('business-fit'); }
}
