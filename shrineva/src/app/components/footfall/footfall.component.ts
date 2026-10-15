import { Component, Input } from '@angular/core';
import { CITY_DRIVERS, FOOTFALL_AS_OF, FOOTFALL_HEADLINE, FOOTFALL_LAYERS, FOOTFALL_NOTE, FOOTFALL_NOT_CLAIMED, NEARBY_PROJECTS, NearbyProject } from '../../config/footfall.config';
import { PROPERTY } from '../../config/property.config';
import { AnalyticsService } from '../../core/services/analytics.service';

type Tab = 'anchors' | 'who' | 'timeline';

interface RadarPoint { p: NearbyProject; x: number; y: number; lx: number; anchor: 'start' | 'end' | 'middle'; ly: number; }

const CX = 300;
const CY = 300;
/** Schematic radius for a distance in metres: compressed so 65 m, 330 m and 1 km all read on one screen. Not to scale. */
const radiusFor = (m: number) => (m <= 100 ? 40 + (m / 100) * 70 : m <= 350 ? 110 + ((m - 100) / 250) * 78 : 188 + ((Math.min(m, 1000) - 350) / 650) * 78);

@Component({
  selector: 'app-footfall',
  templateUrl: './footfall.component.html',
  styleUrls: ['./footfall.component.scss'],
})
export class FootfallComponent {
  /** The full Nearby Projects page shows every panel in turn; the home page shows tabs. */
  @Input() detailed = false;

  tab: Tab = 'anchors';
  activeId = NEARBY_PROJECTS[0].id;

  headline = FOOTFALL_HEADLINE;
  projects = NEARBY_PROJECTS;
  layers = FOOTFALL_LAYERS;
  timeline = PROPERTY.growthTimeline;
  cityDrivers = CITY_DRIVERS;
  notClaimed = FOOTFALL_NOT_CLAIMED;
  note = FOOTFALL_NOTE;
  asOf = FOOTFALL_AS_OF;

  readonly rings = [
    { r: radiusFor(100), label: '100 m' },
    { r: radiusFor(350), label: '350 m' },
    { r: radiusFor(1000), label: '1 km by road' },
  ];
  readonly roadY = CY - 34;

  readonly points: RadarPoint[] = NEARBY_PROJECTS.map((p) => {
    const rad = (p.bearing * Math.PI) / 180;
    const r = radiusFor(p.distanceM);
    const x = CX + r * Math.sin(rad);
    const y = p.id === 'hastkala' ? this.roadY : CY - r * Math.cos(rad);
    const right = x >= CX;
    return { p, x, y, lx: x + (right ? 20 : -20), ly: y + 5, anchor: right ? 'start' : 'end' } as RadarPoint;
  });

  constructor(private analytics: AnalyticsService) {}

  tabs: { id: Tab; label: string }[] = [
    { id: 'anchors', label: 'Anchors' },
    { id: 'who', label: 'Who passes by' },
    { id: 'timeline', label: 'How it builds' },
  ];

  get active(): NearbyProject { return this.projects.find((p) => p.id === this.activeId) ?? this.projects[0]; }

  select(id: string) {
    this.activeId = id;
    this.analytics.event('footfall_anchor_select', { id });
  }

  setTab(t: Tab) {
    this.tab = t;
    this.analytics.event('footfall_tab', { tab: t });
  }

  onTabKey(e: KeyboardEvent) {
    const i = this.tabs.findIndex((t) => t.id === this.tab);
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    this.setTab(this.tabs[(next + this.tabs.length) % this.tabs.length].id);
    setTimeout(() => (document.getElementById('ff-tab-' + this.tab) as HTMLElement | null)?.focus());
  }

  track(name: string, params: Record<string, unknown> = {}) { this.analytics.event(name, params); }

  stateClass(s: string): string {
    return s === 'Operating' ? 'bg-ok/10 text-ok border-ok/40' : s === 'Plan approved' ? 'bg-brass/10 text-brass-deep border-brass-deep/40' : 'bg-ghat/10 text-ghat border-ghat/40';
  }
}
