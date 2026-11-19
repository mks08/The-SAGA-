import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PROPOSED_RESIDENTIAL, PROPERTY } from '../../config/property.config';
import { LeadService } from '../../core/services/lead.service';
import { AnalyticsService } from '../../core/services/analytics.service';

/**
 * Interest form for the PROPOSED studio / 2 BHK units. Kept apart from the commercial leasing form on purpose, always labelled
 * "proposed ... subject to availability and regulatory approvals", and only rendered while PROPOSED_RESIDENTIAL.show is true.
 */
@Component({
  selector: 'app-residential-lead-form',
  templateUrl: './residential-lead-form.component.html',
})
export class ResidentialLeadFormComponent implements OnInit {
  readonly proposed = PROPOSED_RESIDENTIAL;
  property = PROPERTY;
  form!: FormGroup;
  submitted = false;
  submitting = false;
  failed = false;
  options = ['Studio', '2 BHK', 'Either'];

  constructor(private fb: FormBuilder, private leads: LeadService, private analytics: AnalyticsService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      unit: ['Either'],
      website: [''],
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
    if (v.website) { this.submitted = true; return; }
    this.submitting = true;
    this.failed = false;
    const result = await this.leads.submit('Proposed Residential Interest for SHRINEVA', {
      name: v.name,
      phone: v.phone,
      space_type: `Proposed residential: ${v.unit}`,
    }, 'residential');
    this.submitting = false;
    if (result.ok) {
      this.analytics.conversion('residentialLead', { lead_type: 'residential_proposed', unit: v.unit, via: result.via });
      this.submitted = true;
    } else {
      this.failed = true;
      this.analytics.event('residential_form_error', { reason: result.reason });
    }
  }
}
