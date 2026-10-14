import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PLAN, PROPERTY, mapLinks } from '../../config/property.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/**
 * Real map with a pin, directions and the distances that matter. The standard for a property page: a live map people
 * already know how to use, instead of a large illustrated map. The footfall section carries the schematic.
 */
@Component({
  selector: 'app-place-map',
  templateUrl: './place-map.component.html',
})
export class PlaceMapComponent {
  @Input() showIntro = true;

  property = PROPERTY;
  plan = PLAN;
  links = mapLinks();
  embed: SafeResourceUrl;

  near = PROPERTY.locationAnchors.slice(0, 4);
  far = PROPERTY.locationAnchors.slice(4);

  constructor(sanitizer: DomSanitizer, private analytics: AnalyticsService) {
    this.embed = sanitizer.bypassSecurityTrustResourceUrl(this.links.embed);
  }

  track(name: string) { this.analytics.event(name, { source: 'map' }); }
  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
}
