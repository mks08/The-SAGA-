import { Component, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { RevealService } from '../../services/reveal.service';
import { PROPERTY } from '../../config/property.config';
import { CONTENT } from '../../config/content.config';
import { CITY_DRIVERS, FOOTFALL_AS_OF, FOOTFALL_LAYERS, FOOTFALL_NOT_CLAIMED, FOOTFALL_NOTE, NEARBY_PROJECTS } from '../../config/footfall.config';

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  'under-construction': 'Under Construction',
  planned: 'Planned / Proposed',
  potential: 'Potential',
};

@Component({
  selector: 'app-growth',
  templateUrl: './growth.component.html',
  styleUrls: ['./growth.component.scss'],
})
export class GrowthComponent implements AfterViewInit, OnDestroy {
  @Input() showIntro = true;
  /** Full evidence section (nearby projects, city drivers, how footfall builds). Used on /growth. */
  @Input() detailed = false;
  private io?: IntersectionObserver;
  property = PROPERTY;
  engines = CONTENT.demandEngineStrip;
  nearby = NEARBY_PROJECTS;
  cityDrivers = CITY_DRIVERS;
  layers = FOOTFALL_LAYERS;
  notClaimed = FOOTFALL_NOT_CLAIMED;
  asOf = FOOTFALL_AS_OF;
  note = FOOTFALL_NOTE;
  timeline = PROPERTY.growthTimeline.map((t) => ({ ...t, statusLabel: STATUS_LABEL[t.status] ?? t.status }));

  constructor(private revealService: RevealService) {}
  ngAfterViewInit() { this.io = this.revealService.observe(); }
  ngOnDestroy() { this.io?.disconnect(); }
}
