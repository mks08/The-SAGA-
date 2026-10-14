import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PROPERTY, waLink } from '../../config/property.config';
import { LeadService } from '../../core/services/lead.service';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
  @Input() showIntro = true;
  contactForm!: FormGroup;
  submitted = false;
  submitting = false;
  failed = false;
  copied = false;
  property = PROPERTY;
  businessCategories = PROPERTY.businessCategories;
  spaceRequiredOptions = PROPERTY.spaceRequiredOptions;
  preferredFloorOptions = PROPERTY.preferredFloorOptions;
  waHref = waLink();
  waDossierHref = waLink(`Hi, I'd like to request the leasing information pack for SHRINEVA, ${PROPERTY.address.full}.`);

  constructor(
    private fb: FormBuilder,
    private leads: LeadService,
    private analytics: AnalyticsService,
  ) {}

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name:            ['', Validators.required],
      company:         ['', Validators.required],
      designation:     [''],
      businessCategory: ['', Validators.required],
      phone:           ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      email:           ['', [Validators.email]],
      spaceRequired:   ['', Validators.required],
      preferredFloor:  ['Any'],
      occupancyDate:   [''],
      message:         [''],
      website:         [''], // honeypot: real visitors never see or fill this
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.contactForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  async submit() {
    this.contactForm.markAllAsTouched();
    if (!this.contactForm.valid) return;
    const data = this.contactForm.value;
    if (data.website) { this.submitted = true; return; } // bot: pretend success, send nothing

    this.submitting = true;
    this.failed = false;
    const result = await this.leads.submit('New Leasing Enquiry for SHRINEVA', {
      name: data.name,
      company: data.company,
      designation: data.designation || '',
      business_category: data.businessCategory,
      phone: data.phone,
      email: data.email || '',
      space_required: data.spaceRequired,
      preferred_floor: data.preferredFloor || 'Any',
      expected_occupancy: data.occupancyDate || '',
      message: data.message || '',
    }, 'leasing');
    this.submitting = false;

    if (result.ok) {
      this.analytics.event('leasing_form_submit', { via: result.via });
      this.submitted = true;
      this.contactForm.reset({ preferredFloor: 'Any' });
    } else {
      this.failed = true; // keep what the visitor typed
      this.analytics.event('leasing_form_error', { reason: result.reason });
    }
  }

  async copyEmail() {
    try {
      await navigator.clipboard.writeText(this.property.contact.publicEmail);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2200);
    } catch { /* clipboard blocked: the address is a normal mailto link anyway */ }
    this.trackEvent('email_copy');
  }

  trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
    this.analytics.event(eventName, params);
  }
}
