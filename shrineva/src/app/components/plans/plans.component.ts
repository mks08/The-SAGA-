import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MARKETING_AREA, PLAN, PROPERTY } from '../../config/property.config';
import { LEVEL_INFO, LevelInfo } from '../../config/content.config';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BROCHURE, FLOOR_PLANS_PDF, MediaItem, PLAN_LEVELS } from '../../config/media.config';

/** A row of the area schedule (level, area, height). Figures are the marketing figures used everywhere else on the site. */
interface ScheduleRow { level: string; area: string; basis: string; height: string; }

/**
 * The plan set, the way a client reads it: choose a level, the 2D plan opens first (3D is the second view), the sheet has
 * a title block, north arrow, legend and an area schedule, and the drawing can be zoomed and dragged.
 * Deep links: /floor-plans#ground and /floor-plans#typical choose the level.
 */
@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
})
export class PlansComponent implements OnDestroy {
  @ViewChild('viewport') viewport?: ElementRef<HTMLElement>;

  property = PROPERTY;
  plan = PLAN;
  levels = PLAN_LEVELS;
  pdf = FLOOR_PLANS_PDF;
  brochure = BROCHURE;
  readonly info: Record<string, LevelInfo> = LEVEL_INFO;

  levelIdx = 1; // the typical floor is what most visitors lease: start there
  viewIdx = 0;  // 2D first
  zoom = 1;
  readonly zooms = [1, 1.5, 2, 3];
  lightboxIndex: number | null = null;
  /** Every plan image, for the full-screen viewer. */
  gallery: MediaItem[] = PLAN_LEVELS.flatMap((l) => l.views.map((v) => v.item));

  /** Sheet number and title for the title block. */
  readonly sheets: Record<string, { no: string; title: string }> = {
    ground: { no: 'SH-01', title: 'Ground level plan' },
    typical: { no: 'SH-02', title: 'Floors 1 to 3 plan (typical)' },
  };

  readonly schedule: ScheduleRow[] = [
    { level: 'Floors 1, 2, 3 (each)', area: `${MARKETING_AREA.gross.replace('about', 'About')} gross · ${MARKETING_AREA.carpet.replace('about', 'About')} carpet`, basis: 'Open floor plate', height: 'About 11.5 ft' },
    { level: 'Ground level', area: 'About 3,000 sq ft (279 sq m)', basis: 'Covered, parking and entries', height: 'About 9.5 ft' },
    { level: 'Plot', area: `${PLAN.plot.areaSqM} sq m (about 5,650 sq ft)`, basis: `${PLAN.plot.frontageSheet} × ${PLAN.plot.depth}`, height: 'North-facing' },
  ];

  private sub: Subscription;
  private drag: { x: number; y: number; sl: number; st: number } | null = null;

  constructor(private analytics: AnalyticsService, route: ActivatedRoute) {
    this.sub = route.fragment.subscribe((f) => {
      if (f === 'ground') this.levelIdx = 0;
      else if (f === 'typical') this.levelIdx = 1;
      if (f === 'ground' || f === 'typical') { this.viewIdx = 0; this.zoom = 1; }
    });
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  get level() { return this.levels[this.levelIdx]; }
  get view() { return this.level.views[this.viewIdx]; }
  get is2d(): boolean { return this.view.id === '2d'; }
  get now(): LevelInfo { return this.info[this.level.id]; }
  get sheet() { return this.sheets[this.level.id]; }

  selectLevel(i: number) { this.levelIdx = i; this.zoom = 1; this.analytics.event('plan_level', { level: this.level.id }); }
  selectView(j: number) { this.viewIdx = j; this.zoom = 1; this.analytics.event('plan_view', { view: this.view.id }); }

  zoomBy(dir: 1 | -1) {
    const i = Math.max(0, Math.min(this.zooms.length - 1, this.zooms.indexOf(this.zoom) + dir));
    this.zoom = this.zooms[i];
    this.analytics.event('plan_zoom', { zoom: this.zoom });
  }
  fit() { this.zoom = 1; const v = this.viewport?.nativeElement; if (v) { v.scrollLeft = 0; v.scrollTop = 0; } }
  toggleZoom() { this.zoom = this.zoom === 1 ? 2 : 1; }

  /** Drag the drawing when it is zoomed in. */
  down(e: PointerEvent) {
    const v = this.viewport?.nativeElement;
    if (!v || this.zoom === 1) return;
    this.drag = { x: e.clientX, y: e.clientY, sl: v.scrollLeft, st: v.scrollTop };
    v.setPointerCapture?.(e.pointerId);
  }
  move(e: PointerEvent) {
    const v = this.viewport?.nativeElement;
    if (!v || !this.drag) return;
    v.scrollLeft = this.drag.sl - (e.clientX - this.drag.x);
    v.scrollTop = this.drag.st - (e.clientY - this.drag.y);
  }
  up() { this.drag = null; }

  open() { this.lightboxIndex = Math.max(0, this.gallery.findIndex((g) => g.id === this.view.item.id)); this.analytics.event('plan_open'); }
  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
  track(name: string) { this.analytics.event(name); }
}
