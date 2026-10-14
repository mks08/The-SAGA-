import { Component, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { RevealService } from '../../services/reveal.service';
import { PROPERTY } from '../../config/property.config';
import { CONTENT } from '../../config/content.config';

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
  private io?: IntersectionObserver;
  property = PROPERTY;
  engines = CONTENT.demandEngineStrip;
  timeline = PROPERTY.growthTimeline.map((t) => ({ ...t, statusLabel: STATUS_LABEL[t.status] ?? t.status }));

  constructor(private revealService: RevealService) {}
  ngAfterViewInit() { this.io = this.revealService.observe(); }
  ngOnDestroy() { this.io?.disconnect(); }
}
