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
    { id: 'clinic',     icon: '🏥', label: 'Clinic / Medical' },
    { id: 'office',     icon: '💼', label: 'Office / Corporate' },
    { id: 'bank',       icon: '🏦', label: 'Bank / NBFC' },
    { id: 'studio',     icon: '🏠', label: '1 BHK Studio' },
    { id: 'restaurant', icon: '☕', label: 'Café / Restaurant' },
  ];

  private popupListener!: EventListener;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.bookingForm = this.fb.group({
      name:      ['', Validators.required],
      phone:     ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      email:     ['', Validators.email],
      spaceType: ['', Validators.required],
      message:   [''],
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

  submit() {
    this.bookingForm.markAllAsTouched();
    if (this.bookingForm.valid) {
      console.log('📬 SAGA Booking:', this.bookingForm.value);
      this.popupSubmitted = true;
      setTimeout(() => this.close(), 3500);
    }
  }

  ngOnDestroy() {
    window.removeEventListener('open-booking-popup', this.popupListener);
  }
}
