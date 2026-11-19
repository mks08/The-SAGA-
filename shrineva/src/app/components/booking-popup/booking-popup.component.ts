import { Component, Inject, OnInit, OnDestroy, HostListener, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PROPERTY, waLink } from '../../config/property.config';
import { NEED_OPTIONS } from '../../config/highlights.config';
import { LeadService } from '../../core/services/lead.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { HI } from '../../config/hindi.config';
import { NEED_LABEL_HI, PopupText, POPUP_EN, POPUP_HI } from './popup-text';

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

  needs = NEED_OPTIONS;
  /** English by default; Hindi when the visitor opens it from the Hindi page (document language hi). */
  txt: PopupText = POPUP_EN;
  hindi = false;
  needLabelHi = NEED_LABEL_HI;

  private popupListener!: EventListener;
  private returnFocusTo: HTMLElement | null = null;

  private readonly browser: boolean;

  constructor(private fb: FormBuilder, private leads: LeadService, private analytics: AnalyticsService, @Inject(PLATFORM_ID) platformId: object, @Inject(DOCUMENT) private doc: Document) {
    this.browser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.bookingForm = this.fb.group({
      name:    ['', [Validators.required, Validators.minLength(2)]],
      phone:   ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      need:    [''],
      website: [''], // honeypot
    });

    // Opens only on request (buttons dispatch 'open-booking-popup'); no auto-open interstitial.

    // Listen for programmatic open
    this.popupListener = () => this.open();
    if (this.browser) window.addEventListener('open-booking-popup', this.popupListener);
  }

  open() {
    this.hindi = (this.doc.documentElement.lang || '').toLowerCase().startsWith('hi');
    this.txt = this.hindi ? POPUP_HI : POPUP_EN;
    this.waHref = waLink(this.hindi ? HI.waMessage : PROPERTY.contact.whatsappMessage);
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
      space_type: data.need || '',
    }, 'site-visit');
    this.submitting = false;

    if (result.ok) {
      this.analytics.event('site_visit_submit');
      // the short visit form is a qualified lead too: shrineva_commercial_lead (and the Ads conversion once its label is set)
      this.analytics.conversion('commercialLead', { lead_type: 'site_visit', business_category: data.need || 'not_given', via: result.via, language: this.hindi ? 'hi' : 'en' });
      this.popupSubmitted = true;
      this.bookingForm.reset({ need: '' });
    } else {
      this.failed = true;
      this.analytics.event('site_visit_error', { reason: result.reason });
    }
  }

  ngOnDestroy() {
    if (this.browser) window.removeEventListener('open-booking-popup', this.popupListener);
  }
}
