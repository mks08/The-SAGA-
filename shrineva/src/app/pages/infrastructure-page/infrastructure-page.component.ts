import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PROPERTY, waLink } from '../../config/property.config';
import { CONTENT } from '../../config/content.config';

@Component({
  selector: 'app-infrastructure-page',
  templateUrl: './infrastructure-page.component.html',
  styleUrls: ['./infrastructure-page.component.scss'],
})
export class InfrastructurePageComponent implements OnInit {
  property = PROPERTY;
  essentials = CONTENT.infrastructureEssentials;
  dossierHref = waLink(`Hi, I'd like to request the technical data sheet for SHRINEVA, ${PROPERTY.address.full}.`);

  constructor(private seo: SeoService) {}
  ngOnInit(): void { this.seo.apply('infrastructure'); }
}
