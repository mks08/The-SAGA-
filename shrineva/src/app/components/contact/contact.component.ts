import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PROPERTY, waLink } from '../../config/property.config';
import { NEED_OPTIONS } from '../../config/highlights.config';
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
  property = PROPERTY;
  needs = NEED_OPTIONS;
  waHref = waLink();

  constructor(
    private fb: FormBuilder,
    private leads: LeadService,
    private analytics: AnalyticsService,
  ) {}

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name:    ['', [Validators.required, Validators.minLength(2)]],
      phone:   ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      need:    [''],
      website: [''], // honeypot: real visitors never see or fill this
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
      phone: data.phone,
      space_type: data.need || '',
    }, 'leasing');
    this.submitting = false;

    if (result.ok) {
      this.analytics.event('leasing_form_submit', { via: result.via });
      this.submitted = true;
      this.contactForm.reset({ need: '' });
    } else {
      this.failed = true; // keep what the visitor typed
      this.analytics.event('leasing_form_error', { reason: result.reason });
    }
  }

  trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
    this.analytics.event(eventName, params);
  }
}
