import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-faq-page',
  templateUrl: './faq-page.component.html',
})
export class FaqPageComponent implements OnInit {
  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('faq'); }
}
