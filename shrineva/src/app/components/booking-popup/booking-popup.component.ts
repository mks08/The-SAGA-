import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PROPERTY, waLink } from '../../config/property.config';
import { LeadService } from '../../core/services/lead.service';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-booking-popup',
  templateUrl: './booking-popup.component.html',
  styleUrls: ['./booking-popup.component.scss'],
})
export class BookingPopupComponent implements OnInit, OnDestroy {
  showPopup = false;
  popupSubmitted = false;
  bookingForm!: FormGroup;
  property = PROPERTY;
  submitting = false;
  failed = false;
  waHref = waLink();
  waSubmittedHref = waLink('Hi, I just sent a site-visit enquiry for SHRINEVA, Bada Lalpur, Varanasi.');

  spaceTypes = [
    { id: 'healthcare', icon: '', label: 'Healthcare / Diagnostics' },
    { id: 'restaurant', icon: '', label: 'F&B / Restaurant' },
    { id: 'bfsi',       icon: '', label: 'Bank / BFSI / Insurance' },
    { id: 'office',     icon: '', label: 'Corporate Office' },
    { id: 'retail',     icon: '', label: 'Retail / Customer-Facing' },
    { id: 'education',  icon: '', label: 'Education / Training' },
    { id: 'fitness',    icon: '', label: 'Fitness / Wellness' },
    { id: 'others',     icon: '', label: 'Other' },
  ];

  private popupListener!: EventListener;
  private returnFocusTo: HTMLElement | null = null;

  constructor(private fb: FormBuilder, private leads: LeadService, private analytics: AnalyticsService) {}

  ngOnInit() {
    this.bookingForm = this.fb.group({
      name:        ['', Validators.required],
      phone:       ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      email:       ['', Validators.email],
      spaceType:   ['', Validators.required],
      otherDetails: [''],
      message:     [''],
      website:     [''], // honeypot
    });

    // Opens only on request (buttons dispatch 'open-booking-popup'); no auto-open interstitial.

    // Listen for programmatic open
    this.popupListener = () => this.open();
    window.addEventListener('open-booking-popup', this.popupListener);
  }

  open() {
    this.showPopup = true;
    this.popupSubmitted = false;
    this.failed = false;
    this.returnFocusTo = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    // Move keyboard focus into the dialog once it has rendered.
    setTimeout(() => (document.querySelector('.popup-card .popup-close') as HTMLElement | null)?.focus(), 50);
  }

  @HostListener('document:keydown.escape')
  close() {
    if (!this.showPopup) return;
    this.showPopup = false;
    document.body.style.overflow = '';
    this.returnFocusTo?.focus?.();
    this.returnFocusTo = null;
  }

  onOverlayClick(e: Event) {
    if ((e.target as HTMLElement).classList.contains('popup-overlay')) {
      this.close();
    }
  }

  selectSpace(id: string) {
    this.bookingForm.patchValue({ spaceType: id });
    this.bookingForm.get('spaceType')!.markAsTouched();
  }

  isInvalid(field: string) {
    const c = this.bookingForm.get(field);
    return c && c.invalid && (c.dirty || c.touched);
  }

  async submit() {
    this.bookingForm.markAllAsTouched();
    if (!this.bookingForm.valid) return;
    const data = this.bookingForm.value;
    if (data.website) { this.popupSubmitted = true; return; } // bot

    this.submitting = true;
    this.failed = false;
    const result = await this.leads.submit('New Site-Visit Enquiry for SHRINEVA', {
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      space_type: this.spaceTypes.find((t) => t.id === data.spaceType)?.label ?? data.spaceType ?? '',
      other_details: data.otherDetails || '',
      message: data.message || '',
    }, 'site-visit');
    this.submitting = false;

    if (result.ok) {
      this.analytics.event('site_visit_submit');
      this.popupSubmitted = true;
      this.bookingForm.reset();
    } else {
      this.failed = true;
      this.analytics.event('site_visit_error', { reason: result.reason });
    }
  }

  ngOnDestroy() {
    window.removeEventListener('open-booking-popup', this.popupListener);
  }
}
