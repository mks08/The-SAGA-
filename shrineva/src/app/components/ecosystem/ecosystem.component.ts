import { Component, Input } from '@angular/core';
import { PLAN, PROPERTY } from '../../config/property.config';
import { LOCATION_MAP } from '../../config/media.config';

@Component({
  selector: 'app-ecosystem',
  templateUrl: './ecosystem.component.html',
  styleUrls: ['./ecosystem.component.scss'],
})
export class EcosystemComponent {
  @Input() showIntro = true;
  @Input() showPageLink = true;

  property = PROPERTY;
  plan = PLAN;
  map = LOCATION_MAP;
  mapItems = [LOCATION_MAP];
  lightboxIndex: number | null = null;

  anchors = PROPERTY.locationAnchors.slice(0, 3);
  spots = PROPERTY.locationAnchors.slice(3);

  stays = ['clinics', 'diagnostics', 'pharmacy', 'cafés', 'banks', 'retail', 'offices', 'studio apartments'];
}
