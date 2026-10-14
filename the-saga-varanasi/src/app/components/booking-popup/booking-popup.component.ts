import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PROPERTY } from '../../config/property.config';

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

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.bookingForm = this.fb.group({
      name:        ['', Validators.required],
      phone:       ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      email:       ['', Validators.email],
      spaceType:   ['', Validators.required],
      otherDetails: [''],
      message:     [''],
    });

    // Opens only on request (buttons dispatch 'open-booking-popup'); no auto-open interstitial.

    // Listen for programmatic open
    this.popupListener = () => this.open();
    window.addEventListener('open-booking-popup', this.popupListener);
  }

  open() {
    this.showPopup = true;
    this.popupSubmitted = false;
    document.body.style.overflow = 'hidden';
  }

  @HostListener('document:keydown.escape')
  close() {
    this.showPopup = false;
    document.body.style.overflow = '';
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
    const submitBtn = document.getElementById('popup-submit-btn');
    if (submitBtn) {
      submitBtn.textContent = 'Sending...';
      (submitBtn as HTMLButtonElement).disabled = true;
    }

    try {
      await fetch(`https://formsubmit.co/ajax/${PROPERTY.contact.email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: 'New Booking Popup Enquiry for SHRINEVA',
          name: data.name,
          phone: data.phone,
          email: data.email || 'Not provided',
          space_type: data.spaceType || 'Not specified',
          other_details: data.otherDetails || 'N/A',
          message: data.message || 'No message'
        })
      });
    } catch (err) {
      console.error('Email send error:', err);
    }

    this.popupSubmitted = true;
    setTimeout(() => this.close(), 3000);
  }

  ngOnDestroy() {
    window.removeEventListener('open-booking-popup', this.popupListener);
  }
}
