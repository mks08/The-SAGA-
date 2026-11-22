import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MARKETING_AREA, PLAN, PROPERTY, waLink } from '../../config/property.config';
import { FINDER_SIZES, FinderSize, SPACE_FINDER_NOTES, SPACE_FINDER_USES, areaLabel } from '../../config/content.config';
import { FLOOR, MAX_SIDE_CARPET, PASSAGE_ALLOWANCE, Plan, Region, about, feet, fmt, planOne, planSide, planStack } from '../../config/floor-model';
import { EnquiryPrefillService } from '../../core/services/enquiry-prefill.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Scene, View, buildScene, buildStack } from './floor-scene';

type Mode = 'one' | 'two';
type Scheme = 'stack' | 'side';

interface Row { label: string; value: string; }

/** Feet and inches, e.g. 40.5 -> 40′-6″. */
const fi = (ft: number): string => { const t = Math.round(ft * 24) / 2; const f = Math.floor(t / 12); const i = t - f * 12; const w = Math.floor(i); return `${f}′-${w}${i - w ? '½' : ''}″`; };

/**
 * "Plan your space": choose a use and a size, see the space marked on the typical floor (3D or flat), with the lift and stair bay,
 * the glass front and the fire exit, and test how two occupiers could share one floor. The floor model (floor-model.ts) works from
 * the architect's dimensions; the result is indicative and nothing is quoted or promised. The answers go to the enquiry form.
 */
@Component({
  selector: 'app-space-finder',
  templateUrl: './space-finder.component.html',
})
export class SpaceFinderComponent {
  property = PROPERTY;
  uses = SPACE_FINDER_USES;
  sizes = FINDER_SIZES;
  readonly bayArea = Math.round(PLAN.typical.liftStairBay.sqft);
  readonly floorGross = Math.round(PLAN.typical.floorArea.sqft);
  readonly floorCarpet = MARKETING_AREA.carpetNum;
  readonly passage = PASSAGE_ALLOWANCE;
  readonly maxSide = MAX_SIDE_CARPET;
  readonly minSize = 500;
  readonly maxSize = MARKETING_AREA.carpetNum;

  category = '';
  mode: Mode = 'one';
  size = 1000;
  floors = 1;
  s1 = 2000;
  s2 = 1000;
  scheme: Scheme = 'stack';
  view: View = 'iso';

  plan: Plan | null = null;
  scene!: Scene;
  headline = '';
  rows: Row[] = [];
  maths: Row[] = [];
  notes: string[] = [];
  sideNote = '';
  sideOk = false;
  verdict: { text: string; tone: 'ok' | 'tight' | 'no' } | null = null;
  touched = false;

  constructor(
    private prefill: EnquiryPrefillService,
    private analytics: AnalyticsService,
    @Inject(DOCUMENT) private doc: Document,
  ) {
    this.recalc();
  }

  /* ---------- inputs ---------- */
  isPreset(s: FinderSize): boolean { return s.floors ? this.floors === s.floors : this.floors === 1 && this.size === s.carpet; }
  get note(): string { return this.category ? SPACE_FINDER_NOTES[this.category] ?? '' : ''; }
  get ready(): boolean { return !!this.category; }

  pickUse(category: string): void { this.category = category; this.track(); }
  setMode(m: Mode): void { this.mode = m; this.touched = true; this.recalc(); this.track(); }
  pickSize(s: FinderSize): void {
    this.touched = true;
    if (s.floors) { this.floors = s.floors; } else { this.floors = 1; this.size = s.carpet ?? this.size; }
    this.recalc(); this.track();
  }
  onSlide(which: 'size' | 's1' | 's2', ev: Event): void {
    const v = Number((ev.target as HTMLInputElement).value);
    this.nudgeTo(which, v);
  }
  nudge(which: 'size' | 's1' | 's2', delta: number): void { this.nudgeTo(which, this[which] + delta); }
  private nudgeTo(which: 'size' | 's1' | 's2', v: number): void {
    const lo = this.minSize, hi = which === 'size' ? this.maxSize : 2600;
    this[which] = Math.max(lo, Math.min(hi, Math.round(v / 50) * 50));
    if (which === 'size') this.floors = 1;
    this.touched = true;
    this.recalc();
  }
  swap(): void { const t = this.s1; this.s1 = this.s2; this.s2 = t; this.recalc(); }
  setScheme(s: Scheme): void { if (s === 'side' && !this.sideOk) return; this.scheme = s; this.recalc(); this.track(); }
  setView(v: View): void { this.view = v; this.touched = true; this.recalc(); }
  preset2(a: number, b: number): void { this.s1 = a; this.s2 = b; this.touched = true; this.recalc(); this.track(); }

  /* ---------- the floor model ---------- */
  private recalc(): void {
    this.rows = []; this.maths = []; this.notes = []; this.verdict = null; this.sideNote = '';

    if (this.mode === 'one') {
      if (this.floors > 1) { this.recalcFloors(); return; }
      const p = planOne(this.size);
      this.plan = p;
      this.scene = buildScene(this.view, p);
      const r = p.regions[0];
      const whole = this.size >= this.floorCarpet;
      this.headline = whole ? 'A whole floor' : `About ${about(r.carpet)} sq ft on the road side`;
      this.rows = [
        { label: 'Space', value: `About ${about(r.carpet)} sq ft carpet (${about(r.gross)} sq ft gross)` },
        { label: 'Road front', value: `The full ${fi(FLOOR.w)} glass front, on the 24 m road` },
        { label: 'Depth', value: whole ? `${fi(FLOOR.l)} from the road side to the rear` : `About ${feet(r.depth)} ft back from the road side` },
        { label: 'Lift and stair', value: this.liftNote(r) },
      ];
      if (p.spare.poly) this.notes.push(`The floor behind (about ${about(p.spare.carpet)} sq ft carpet) stays available for another occupier or later expansion, subject to what is free when you enquire.`);
      this.maths = [
        { label: 'Floor, gross (architect sheet SH-02)', value: `${fmt(this.floorGross)} sq ft` },
        { label: 'Less lift, lobby and stair bay (common)', value: `− ${fmt(this.bayArea)} sq ft` },
        { label: 'Carpet used on the site', value: `about ${fmt(this.floorCarpet)} sq ft` },
        { label: 'Your space', value: `about ${about(r.carpet)} sq ft carpet` },
      ];
      return;
    }

    // Two occupiers on one floor.
    const stack = planStack(this.s1, this.s2);
    const side = planSide(this.s1, this.s2);
    this.sideOk = !!side;
    this.sideNote = side ? '' : this.sideReason();
    if (this.scheme === 'side' && !side) this.scheme = 'stack';
    const p = this.scheme === 'side' && side ? side : stack;
    this.plan = p;
    this.scene = buildScene(this.view, p);
    const total = this.s1 + this.s2;
    const share = Math.round((total / this.floorCarpet) * 100);
    this.headline = `${fmt(this.s1)} + ${fmt(this.s2)} sq ft on one floor`;
    const [a, b] = p.regions;
    this.rows = [
      { label: 'Occupier 1', value: `About ${about(a.carpet)} sq ft carpet · ${a.front > 0 ? `${fi(a.front)} of the glass front` : 'no road front'} · ${p.scheme === 'side' ? 'full depth' : `${feet(a.depth - a.from)} ft deep`}` },
      { label: 'Occupier 2', value: `About ${about(b.carpet)} sq ft carpet · ${b.front > 0 ? `${fi(b.front)} of the glass front` : 'no road front'} · ${feet(b.depth - b.from)} ft deep` },
    ];
    const left = this.floorCarpet - total;
    this.maths = [
      { label: 'Floor, gross (architect sheet SH-02)', value: `${fmt(this.floorGross)} sq ft` },
      { label: 'Less lift, lobby and stair bay (common)', value: `− ${fmt(this.bayArea)} sq ft` },
      { label: 'Carpet used on the site', value: `about ${fmt(this.floorCarpet)} sq ft` },
      { label: 'You asked for', value: `${fmt(total)} sq ft (${share}% of the floor)` },
      { label: 'Common passage and walls (planning allowance)', value: `about ${fmt(this.passage)} sq ft` },
      { label: left - this.passage >= 0 ? 'Left over' : 'Short by', value: `${fmt(Math.abs(left - this.passage))} sq ft` },
    ];
    if (!p.fits) {
      this.verdict = { tone: 'no', text: `Together that is ${fmt(total - this.floorCarpet)} sq ft more than one floor holds. The shares below are scaled to fit; or take part of a second floor, since Floors 1, 2 and 3 are identical.` };
    } else if (left - this.passage < 0) {
      this.verdict = { tone: 'tight', text: `It fits on the floor, but not with room for a common passage: you would be about ${fmt(this.passage - left)} sq ft short of the allowance. Trim one share slightly or let the occupiers share a passage.` };
    } else if (left - this.passage < 60) {
      const spare = left - this.passage;
      this.verdict = { tone: 'tight', text: `It just fits: after about ${fmt(this.passage)} sq ft for the common passage and demising walls, ${spare < 10 ? 'nothing is spare' : `only ${fmt(spare)} sq ft is spare`}. The architect confirms the exact split.` };
    } else {
      this.verdict = { tone: 'ok', text: `It fits with about ${fmt(left - this.passage)} sq ft to spare after a common passage and demising walls.` };
    }
    if (p.scheme === 'stack') {
      this.notes.push(`One behind the other: occupier 1 takes the front and the full ${fi(FLOOR.w)} glass front; occupier 2 takes the floor behind it, reached from the lift lobby, with no glass front of its own. Swap the two if the larger occupier should have the road.`);
    } else {
      this.notes.push(`Side by side: both occupiers face the road, one on the west strip, one on the east side around the lift and stair bay.`);
    }
    if (!side && this.sideNote) this.notes.push(this.sideNote);
  }

  private recalcFloors(): void {
    this.plan = planOne(this.floorCarpet);
    this.scene = this.view === 'iso' ? buildStack(this.floors) : buildScene('plan', this.plan);
    this.headline = `${this.floors} floors`;
    const carpet = this.floorCarpet * this.floors;
    this.rows = [
      { label: 'Space', value: `About ${fmt(carpet)} sq ft carpet across ${this.floors} floors` },
      { label: 'Each floor', value: `About ${fmt(this.floorGross)} sq ft gross (${fmt(this.floorCarpet)} carpet), the same plan on Floors 1, 2 and 3` },
      { label: 'Road front', value: `The full ${fi(FLOOR.w)} glass front on every floor` },
      { label: 'Lift and stair', value: `One ${PLAN.lift.adjective} lift and the stair serve every level` },
    ];
    this.notes.push('Which floors are free is confirmed by the leasing team when you enquire.');
    this.maths = [
      { label: 'One floor, carpet', value: `about ${fmt(this.floorCarpet)} sq ft` },
      { label: `${this.floors} floors, carpet`, value: `about ${fmt(carpet)} sq ft` },
    ];
  }

  private liftNote(r: Region): string {
    const y1 = FLOOR.core.y, y2 = FLOOR.core.y + FLOOR.core.l;
    if (r.depth < y1) return `The lift, lobby and stair bay is behind your space, about ${feet(y1)} ft from the road side; its lobby opens onto the floor beside it.`;
    if (r.depth < y2) return 'Your space wraps the west side of the lift and stair bay, so the lift lobby opens into it.';
    return 'Your space runs around the lift and stair bay; the lobby opens into it.';
  }

  private sideReason(): string {
    const w = this.s1 / (FLOOR.l * 0.981);
    if (w < 12) return `Side by side needs the west occupier to take at least about 1,050 sq ft; below that the strip is under 12 ft wide.`;
    if (this.s1 > this.maxSide) return `Side by side limits the west occupier to about ${fmt(this.maxSide)} sq ft carpet, so the east occupier can still get round the lift and stair bay.`;
    return 'The east side is not big enough for occupier 2 once occupier 1 has the west strip.';
  }

  /* ---------- hand-off ---------- */
  get totalCarpet(): number { return this.mode === 'two' ? this.s1 + this.s2 : this.floors > 1 ? this.floorCarpet * this.floors : this.size; }
  get areaText(): string {
    if (this.mode === 'two') return `two occupiers on one floor, about ${fmt(this.s1)} and ${fmt(this.s2)} sq ft`;
    if (this.floors > 1) return `${this.floors} floors`;
    return this.size >= this.floorCarpet ? 'a whole floor' : `about ${fmt(this.size)} sq ft`;
  }
  get layoutNote(): string {
    if (this.mode === 'two') return `Space finder: two occupiers on one floor, about ${fmt(this.s1)} and ${fmt(this.s2)} sq ft carpet, ${this.scheme === 'side' ? 'side by side' : 'one behind the other'}.`;
    if (this.floors > 1) return `Space finder: ${this.floors} floors.`;
    return `Space finder: about ${fmt(this.size)} sq ft carpet.`;
  }
  get waHref(): string {
    const use = this.uses.find((u) => u.category === this.category)?.label.toLowerCase() ?? 'my business';
    return waLink(`Hi, I am looking at SHRINEVA, Bada Lalpur, Varanasi for ${use}: ${this.areaText}. Please share floor options.`);
  }

  private track(): void {
    if (this.ready) this.analytics.event('space_finder_result', { business_category: this.category, area: areaLabel(this.totalCarpet, this.floors), layout: this.mode === 'two' ? this.scheme : this.floors > 1 ? 'floors' : 'one' });
  }

  /** Hands the answers to the form on this page and moves the visitor there. */
  requestDetails(): void {
    const area = this.mode === 'two' ? areaLabel(this.s1 + this.s2) : areaLabel(this.size, this.floors);
    this.prefill.set({ category: this.category, area, note: this.layoutNote });
    this.analytics.event('space_finder_request', { business_category: this.category, area, layout: this.mode === 'two' ? this.scheme : this.floors > 1 ? 'floors' : 'one' });
    const form = this.doc.getElementById('enquiry');
    if (!form) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => (form.querySelector('input') as HTMLElement | null)?.focus({ preventScroll: true }), 500);
  }

  trackById = (_: number, it: { id: string }) => it.id;
}
