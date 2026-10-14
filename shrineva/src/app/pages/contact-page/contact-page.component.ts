import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-contact-page',
  templateUrl: './contact-page.component.html',
})
export class ContactPageComponent implements OnInit {
  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('contact'); }
}
