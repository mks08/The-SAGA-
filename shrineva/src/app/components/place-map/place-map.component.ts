import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, Input, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
export class PlaceMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stage', { static: true }) stage!: ElementRef<HTMLElement>;
  /** The live map (a heavy third-party embed) is requested only when it is about to be seen. */
  mapReady = false;
  private io?: IntersectionObserver;

  @Input() showIntro = true;

  property = PROPERTY;
  links = mapLinks();
  embed: SafeResourceUrl;
  map3d: MediaItem = LOCATION_MAP;
  rows = NEARBY_DISTANCES;
  gallery: MediaItem[] = [LOCATION_MAP];
  lightboxIndex: number | null = null;

  constructor(sanitizer: DomSanitizer, private analytics: AnalyticsService, private cdr: ChangeDetectorRef, @Inject(PLATFORM_ID) private platformId: object) {
    this.embed = sanitizer.bypassSecurityTrustResourceUrl(this.links.embed);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof IntersectionObserver === 'undefined') { this.mapReady = true; return; }
    this.io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { this.mapReady = true; this.cdr.markForCheck(); this.io?.disconnect(); }
    }, { rootMargin: '300px 0px' });
    this.io.observe(this.stage.nativeElement);
  }

  ngOnDestroy(): void { this.io?.disconnect(); }

  track(name: string) { this.analytics.event(name, { source: 'map' }); }
}
