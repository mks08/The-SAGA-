import { Component, OnInit, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RevealService } from '../../services/reveal.service';
import { PROPERTY, waLink } from '../../config/property.config';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() showIntro = true;
  contactForm!: FormGroup;
  submitted = false;
  submitting = false;
  property = PROPERTY;
  businessCategories = PROPERTY.businessCategories;
  spaceRequiredOptions = PROPERTY.spaceRequiredOptions;
  preferredFloorOptions = PROPERTY.preferredFloorOptions;
  waHref = waLink();
  waDossierHref = waLink(`Hi, I'd like to request the leasing information pack for SHRINEVA, ${PROPERTY.address.full}.`);
  private io?: IntersectionObserver;

  constructor(
    private fb: FormBuilder,
    private revealService: RevealService,
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
    });
  }

  ngAfterViewInit() {
    this.io = this.revealService.observe();
  }

  ngOnDestroy() {
    this.io?.disconnect();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.contactForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  async submit() {
    this.contactForm.markAllAsTouched();
    if (!this.contactForm.valid) return;

    this.submitting = true;
    const data = this.contactForm.value;
    this.trackEvent('leasing_form_submit');

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${this.property.contact.email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: 'New Leasing Enquiry for SHRINEVA',
          name: data.name,
          company: data.company,
          designation: data.designation || 'Not provided',
          business_category: data.businessCategory,
          phone: data.phone,
          email: data.email || 'Not provided',
          space_required: data.spaceRequired,
          preferred_floor: data.preferredFloor || 'Any',
          expected_occupancy: data.occupancyDate || 'Not specified',
          message: data.message || 'No message'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }
    } catch (err) {
      console.error('Email send error:', err);
    } finally {
      this.submitting = false;
      this.submitted = true;
      this.contactForm.reset({ preferredFloor: 'Any' });
    }
  }

  /**
   * Lightweight analytics hook. Wire this to GA4 (gtag) / Google Ads
   * conversion tracking once measurement IDs are available — see
   * README "Analytics & Conversion Tracking" section.
   */
  trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
    const w = window as any;
    if (typeof w.gtag === 'function') {
      w.gtag('event', eventName, params);
    }
  }
}
