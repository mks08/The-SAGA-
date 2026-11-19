import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PROPERTY, waLink } from '../../config/property.config';
import { LEAD_AREAS, LEAD_CATEGORIES, LEAD_FLOORS, LEAD_TIMELINES } from '../../config/landing.config';
import { LeadService } from '../../core/services/lead.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AttributionService } from '../../core/services/attribution.service';

/**
 * Qualified commercial enquiry: name, business, category, mobile, area, preferred floor, timeline.
 * Delivered by LeadService (own PHP handler, FormSubmit as backup) together with the UTM tags and Google click ID that
 * AttributionService kept for the session. Success fires shrineva_commercial_lead (plus the Ads conversion when configured).
 */
@Component({
  selector: 'app-commercial-lead-form',
  templateUrl: './commercial-lead-form.component.html',
})
export class CommercialLeadFormComponent implements OnInit {
  /** Pre-selected business category (a LEAD_CATEGORIES value). */
  @Input() category = '';
  @Input() heading = 'Tell us what you need';
  @Input() intro = 'Share your business and space needs. The leasing team will call back with floor options and a visit time.';
  /** Anchor id so the sticky mobile bar and ad links can jump here (#enquiry). */
  @Input() anchorId = 'enquiry';

  form!: FormGroup;
  submitted = false;
  submitting = false;
  failed = false;
  property = PROPERTY;
  waHref = waLink();
  categories = LEAD_CATEGORIES;
  areas = LEAD_AREAS;
  floors = LEAD_FLOORS;
  timelines = LEAD_TIMELINES;

  constructor(
    private fb: FormBuilder,
    private leads: LeadService,
    private analytics: AnalyticsService,
    private attribution: AttributionService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      business: [''],
      category: [this.category, [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      area: [''],
      floor: [LEAD_FLOORS[0]],
      timeline: [''],
      website: [''], // honeypot: real visitors never see or fill this
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;
    const v = this.form.value;
    if (v.website) { this.submitted = true; return; } // bot: pretend success, send nothing

    this.submitting = true;
    this.failed = false;
    const result = await this.leads.submit('New Commercial Leasing Enquiry for SHRINEVA', {
      name: v.name,
      phone: v.phone,
      company: v.business || '',
      business_category: v.category,
      space_required: v.area || '',
      preferred_floor: v.floor || '',
      timeline: v.timeline || '',
    }, 'leasing');
    this.submitting = false;

    if (result.ok) {
      this.analytics.conversion('commercialLead', {
        lead_type: 'commercial',
        business_category: v.category,
        preferred_floor: v.floor,
        timeline: v.timeline || 'not_given',
        intent: this.attribution.get()['intent'] || 'none',
        via: result.via,
      });
      this.submitted = true;
      this.form.reset({ category: this.category, floor: LEAD_FLOORS[0], area: '', timeline: '' });
    } else {
      this.failed = true; // keep what the visitor typed
      this.analytics.event('leasing_form_error', { reason: result.reason });
    }
  }
}
