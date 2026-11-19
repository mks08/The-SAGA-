import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PROPERTY, waLink } from '../../config/property.config';
import { FinderResult, SPACE_FINDER_AREAS, SPACE_FINDER_NOTES, SPACE_FINDER_USES } from '../../config/content.config';
import { EnquiryPrefillService } from '../../core/services/enquiry-prefill.service';
import { AnalyticsService } from '../../core/services/analytics.service';

/**
 * "How much space do you need?": two questions, a starting suggestion, and the answers carried into the enquiry form.
 * It does not check availability or quote anything; the leasing team confirms floors and part-floor sizes.
 */
@Component({
  selector: 'app-space-finder',
  templateUrl: './space-finder.component.html',
})
export class SpaceFinderComponent {
  property = PROPERTY;
  uses = SPACE_FINDER_USES;
  areas = SPACE_FINDER_AREAS;

  category = '';
  areaIdx = -1;

  constructor(private prefill: EnquiryPrefillService, private analytics: AnalyticsService, @Inject(DOCUMENT) private doc: Document) {}

  get result(): FinderResult | null { return this.areaIdx >= 0 ? this.areas[this.areaIdx] : null; }
  get note(): string { return this.category ? SPACE_FINDER_NOTES[this.category] ?? '' : ''; }
  get ready(): boolean { return !!this.category && this.areaIdx >= 0; }

  get waHref(): string {
    const r = this.result;
    const use = this.uses.find((u) => u.category === this.category)?.label.toLowerCase() ?? 'my business';
    const size = r ? r.area.replace(' (about one floor)', '') : '';
    return waLink(`Hi, I am looking at SHRINEVA, Bada Lalpur, Varanasi for ${use}${size && size !== 'Not sure yet' ? `, about ${size}` : ''}. Please share floor options.`);
  }

  pickUse(category: string): void { this.category = category; this.done(); }
  pickArea(i: number): void { this.areaIdx = i; this.done(); }

  private done(): void {
    if (this.ready) this.analytics.event('space_finder_result', { business_category: this.category, area: this.result?.area });
  }

  /** Hands the answers to the form on this page and moves the visitor there. */
  requestDetails(): void {
    this.prefill.set({ category: this.category, area: this.result?.area });
    this.analytics.event('space_finder_request', { business_category: this.category, area: this.result?.area });
    const form = this.doc.getElementById('enquiry');
    if (!form) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => (form.querySelector('input') as HTMLElement | null)?.focus({ preventScroll: true }), 500);
  }
}
