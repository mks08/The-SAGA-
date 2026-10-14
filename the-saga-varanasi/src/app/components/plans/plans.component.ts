import { Component, Input } from '@angular/core';
import { PLAN, PROPERTY, waLink } from '../../config/property.config';
import { FLOOR_PLANS_PDF, MediaItem, PLAN_LEVELS, TOP_VIEW } from '../../config/media.config';

interface Row { label: string; sqft: string; sqm: string; strong?: boolean; }
interface Fact { label: string; value: string; }

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss'],
})
export class PlansComponent {
  /** Shows the section heading (home). Inner pages already have an H1. */
  @Input() showIntro = true;
  /** Compact = home teaser (no top view, no setback cards). */
  @Input() compact = false;
  @Input() showPageLink = false;

  property = PROPERTY;
  plan = PLAN;
  levels = PLAN_LEVELS;
  topView: MediaItem = TOP_VIEW;
  pdf = FLOOR_PLANS_PDF;
  waHref = waLink('Hello, please share the SHRINEVA floor plans and availability.');

  levelIdx = 0;
  viewIdx = 0;
  lightboxIndex: number | null = null;

  /** Flat list for the lightbox: every plan image plus the top view. */
  gallery: MediaItem[] = [...PLAN_LEVELS.flatMap((l) => l.views.map((v) => v.item)), TOP_VIEW];

  private rows: Record<string, Row[]> = {
    stilt: [
      { label: 'Structure zone (to column faces)', sqft: fmt(PLAN.stilt.structureZone.sqft), sqm: fmt(PLAN.stilt.structureZone.sqm) },
      { label: 'Lift and stair bay, 12′-9″ × 27′-9″', sqft: fmt(PLAN.stilt.liftStairBay.sqft), sqm: fmt(PLAN.stilt.liftStairBay.sqm) },
      { label: 'Open stilt area excl. bay', sqft: fmt(PLAN.stilt.openArea.sqft), sqm: fmt(PLAN.stilt.openArea.sqm), strong: true },
    ],
    typical: [
      { label: 'Floor area, 40′-6″ × 89′-6″ less east recess', sqft: fmt(PLAN.typical.floorArea.sqft), sqm: fmt(PLAN.typical.floorArea.sqm) },
      { label: 'Lift and stair bay, 12′-9″ × 27′-9″', sqft: '− ' + fmt(PLAN.typical.liftStairBay.sqft), sqm: '− ' + fmt(PLAN.typical.liftStairBay.sqm) },
      { label: 'External walls, 9″', sqft: '− ' + fmt(PLAN.typical.externalWalls.sqft), sqm: '− ' + fmt(PLAN.typical.externalWalls.sqm) },
      { label: `Carpet area (${PLAN.typical.carpet.pct}% of floor area)`, sqft: fmt(PLAN.typical.carpet.sqft), sqm: fmt(PLAN.typical.carpet.sqm), strong: true },
    ],
  };

  private facts: Record<string, Fact[]> = {
    stilt: [
      { label: 'Floor to floor', value: PLAN.stilt.floorToFloor },
      { label: 'Frontage', value: `${PLAN.plot.frontage}, fully open · no gate, no wall` },
      { label: 'Entries', value: 'West and east walkways to the lift and stair lobby' },
      { label: 'Lift', value: `${PLAN.lift.capacity} · ${PLAN.lift.clear} clear` },
      { label: 'Staircase', value: PLAN.stilt.staircase },
      { label: 'Boundary walls', value: PLAN.stilt.boundaryWalls },
    ],
    typical: [
      { label: 'Floor to floor', value: PLAN.typical.floorToFloor },
      { label: 'Road frontage', value: PLAN.typical.frontage },
      { label: 'Projections', value: PLAN.typical.projections },
      { label: 'Daylight', value: PLAN.typical.daylight },
      { label: 'Lift', value: `${PLAN.lift.capacity} · ${PLAN.lift.clear} clear` },
      { label: 'Staircase', value: PLAN.typical.staircase },
    ],
  };

  get level() { return this.levels[this.levelIdx]; }
  get view() { return this.level.views[this.viewIdx]; }
  get rowsNow(): Row[] { return this.rows[this.level.id]; }
  get factsNow(): Fact[] { return this.facts[this.level.id]; }
  get isStilt(): boolean { return this.level.id === 'stilt'; }
  get headline(): { value: string; label: string; sub: string } {
    return this.isStilt
      ? { value: fmt(PLAN.stilt.structureZone.sqft), label: 'sq ft · structure zone', sub: PLAN.stilt.structureZone.size }
      : { value: fmt(PLAN.typical.floorArea.sqft), label: 'sq ft · floor area, each floor', sub: `Carpet area ${fmt(PLAN.typical.carpet.sqft)} sq ft (${PLAN.typical.carpet.sqm.toFixed(2)} sq m)` };
  }

  selectLevel(i: number) { this.levelIdx = i; this.viewIdx = 0; }
  selectView(i: number) { this.viewIdx = i; }

  open(item: MediaItem) {
    this.lightboxIndex = Math.max(0, this.gallery.findIndex((g) => g.id === item.id));
  }

  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }

  track(name: string) {
    const w = window as any;
    if (typeof w.gtag === 'function') w.gtag('event', name);
  }
}
