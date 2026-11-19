import { Component, Input } from '@angular/core';
import { PROPERTY } from '../../config/property.config';
import { LEVEL_INFO, LevelInfo } from '../../config/content.config';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BROCHURE, FLOOR_PLANS_PDF, MediaItem, PLAN_LEVELS } from '../../config/media.config';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
})
export class PlansComponent {
  /** Shows the section heading (home). Inner pages already have an H1. */
  @Input() showIntro = true;
  /** Compact = home teaser: two short cards that open the plans page. */
  @Input() compact = false;

  property = PROPERTY;
  levels = PLAN_LEVELS;
  pdf = FLOOR_PLANS_PDF;
  brochure = BROCHURE;

  levelIdx = 0;
  viewIdx = 0;
  lightboxIndex: number | null = null;

  /** Every plan image, for the lightbox. */
  gallery: MediaItem[] = PLAN_LEVELS.flatMap((l) => l.views.map((v) => v.item));

  constructor(private analytics: AnalyticsService) {}

  readonly info: Record<string, LevelInfo> = LEVEL_INFO;

  get level() { return this.levels[this.levelIdx]; }
  get view() { return this.level.views[this.viewIdx]; }
  get now(): LevelInfo { return this.info[this.level.id]; }

  /** Teaser cards for the home page (3D views). */
  get teasers() {
    return this.levels.map((l) => ({ id: l.id, title: l.tab, img: l.views[1].item, value: this.info[l.id].value, unit: this.info[l.id].label }));
  }

  selectLevel(i: number) { this.levelIdx = i; }
  selectView(j: number) { this.viewIdx = j; }

  open(item: MediaItem) {
    this.lightboxIndex = Math.max(0, this.gallery.findIndex((g) => g.id === item.id));
  }

  openPopup() { window.dispatchEvent(new CustomEvent('open-booking-popup')); }
  track(name: string) { this.analytics.event(name); }
}
