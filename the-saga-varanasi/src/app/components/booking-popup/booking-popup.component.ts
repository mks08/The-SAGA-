import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-booking-popup',
  templateUrl: './booking-popup.component.html',
  styleUrls: ['./booking-popup.component.scss'],
})
export class BookingPopupComponent implements OnInit, OnDestroy {
  showPopup = false;
  popupSubmitted = false;
  bookingForm!: FormGroup;

  spaceTypes = [
    { id: 'retail',     icon: '🛍️', label: 'Retail Store' },
    { id: 'restaurant', icon: '🍽️', label: 'Restaurant / Café' },
    { id: 'clinic',     icon: '🏥', label: 'Clinic / Medical' },
    { id: 'pharmacy',   icon: '💊', label: 'Medical Store / Pharmacy' },
    { id: 'office',     icon: '💼', label: 'Office / Corporate' },
    { id: 'bank',       icon: '🏦', label: 'Bank / NBFC' },
    { id: 'studio',     icon: '🏠', label: '1 BHK Studio' },
    { id: 'others',     icon: '❓', label: 'Something Else' },
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

    // Auto-open after 3 s on first visit
    const seen = sessionStorage.getItem('saga-popup-seen');
    if (!seen) {
      setTimeout(() => {
        this.open();
        sessionStorage.setItem('saga-popup-seen', '1');
      }, 3000);
    }

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
      await fetch('https://formsubmit.co/ajax/immayank08@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: 'New Booking Popup Enquiry for The SAGA Varanasi',
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
    setTimeout(() => this.close(), 3500);
  }

  ngOnDestroy() {
    window.removeEventListener('open-booking-popup', this.popupListener);
  }
}
