import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, Input, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PROPERTY, mapLinks } from '../../config/property.config';
import { NEARBY_DISTANCES } from '../../config/location.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/**
 * Location: a live satellite map centred on the plot (the brochure's coordinates), a Satellite / Map switch, directions,
 * and the distance list. The map is a third-party embed, so it is requested only when it is about to be seen.
 */
@Component({
  selector: 'app-place-map',
  templateUrl: './place-map.component.html',
})
export class PlaceMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stage', { static: true }) stage!: ElementRef<HTMLElement>;
  /** The live map is requested only when it is about to be seen. */
  mapReady = false;
  private io?: IntersectionObserver;

  /** Home page: the answer-first question and answer replace the generic heading. */
  @Input() showIntro = true;
  @Input() heading = '';
  @Input() lead = '';

  property = PROPERTY;
  links = mapLinks();
  mode: 'sat' | 'map' = 'sat';
  satellite: SafeResourceUrl;
  roadmap: SafeResourceUrl;
  rows = NEARBY_DISTANCES;

  constructor(sanitizer: DomSanitizer, private analytics: AnalyticsService, private cdr: ChangeDetectorRef, @Inject(PLATFORM_ID) private platformId: object) {
    this.satellite = sanitizer.bypassSecurityTrustResourceUrl(this.links.embed);
    this.roadmap = sanitizer.bypassSecurityTrustResourceUrl(this.links.embedMap);
  }

  get embed(): SafeResourceUrl { return this.mode === 'sat' ? this.satellite : this.roadmap; }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof IntersectionObserver === 'undefined') { this.mapReady = true; return; }
    this.io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { this.mapReady = true; this.cdr.markForCheck(); this.io?.disconnect(); }
    }, { rootMargin: '300px 0px' });
    this.io.observe(this.stage.nativeElement);
  }

  ngOnDestroy(): void { this.io?.disconnect(); }

  setMode(m: 'sat' | 'map') {
    if (m === this.mode) return;
    this.mode = m;
    this.analytics.event('map_mode', { mode: m });
  }

  track(name: string) { this.analytics.event(name, { source: 'map' }); }
}
