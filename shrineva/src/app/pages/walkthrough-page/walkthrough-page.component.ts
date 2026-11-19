import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { BROCHURE } from '../../config/media.config';
import { PROGRESS_UPDATES } from '../../config/content.config';

@Component({
  selector: 'app-walkthrough-page',
  templateUrl: './walkthrough-page.component.html',
})
export class WalkthroughPageComponent implements OnInit {
  brochure = BROCHURE;
  progress = PROGRESS_UPDATES;

  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('walkthrough'); }
}
