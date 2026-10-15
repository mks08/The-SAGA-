import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PROPERTY, mapLinks } from '../../config/property.config';
import { LOCATION_MAP, MediaItem } from '../../config/media.config';
import { NEARBY_DISTANCES } from '../../config/location.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/**
 * Location, kept small: a live map for directions, the illustrated 3D map, and six distances.
 * (The footer carries a smaller version of the same list.)
 */
@Component({
  selector: 'app-place-map',
  templateUrl: './place-map.component.html',
})
export class PlaceMapComponent {
  @Input() showIntro = true;

  property = PROPERTY;
  links = mapLinks();
  embed: SafeResourceUrl;
  map3d: MediaItem = LOCATION_MAP;
  rows = NEARBY_DISTANCES;
  gallery: MediaItem[] = [LOCATION_MAP];
  lightboxIndex: number | null = null;

  constructor(sanitizer: DomSanitizer, private analytics: AnalyticsService) {
    this.embed = sanitizer.bypassSecurityTrustResourceUrl(this.links.embed);
  }

  track(name: string) { this.analytics.event(name, { source: 'map' }); }
}
