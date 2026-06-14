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
    { id: 'retail',      icon: '🛍️', label: 'Retail Store' },
    { id: 'clinic',      icon: '🏥', label: 'Clinic / Medical' },
    { id: 'pharmacy',    icon: '💊', label: 'Pharmacy / Medical Store' },
    { id: 'pathology',   icon: '🔬', label: 'Pathology / Lab' },
    { id: 'office',      icon: '💼', label: 'Office / Corporate' },
    { id: 'bank',        icon: '🏦', label: 'Bank / NBFC' },
    { id: 'restaurant',  icon: '🍽️', label: 'Restaurant / Café' },
    { id: 'coaching',    icon: '🎓', label: 'Coaching / Institute' },
    { id: 'studio',      icon: '🏠', label: '1 BHK Studio' },
    { id: 'showroom',    icon: '🏪', label: 'Showroom / Boutique' },
    { id: 'other',       icon: '✏️', label: 'Something Else' },
  ];

  get showOtherBox() {
    return this.bookingForm.get('spaceType')?.value === 'other';
  }

  private popupListener!: EventListener;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.bookingForm = this.fb.group({
      name:       ['', Validators.required],
      phone:      ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      email:      ['', Validators.email],
      spaceType:  ['', Validators.required],
      otherDesc:  [''],
      message:    [''],
    });

    // Auto-open once per session
    if (!sessionStorage.getItem('saga-popup-seen')) {
      setTimeout(() => {
        this.open();
        sessionStorage.setItem('saga-popup-seen', '1');
      }, 3500);
    }

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
    if ((e.target as HTMLElement).classList.contains('popup-overlay')) this.close();
  }

  selectSpace(id: string) {
    this.bookingForm.patchValue({ spaceType: id, otherDesc: '' });
    this.bookingForm.get('spaceType')!.markAsTouched();
  }

  isInvalid(field: string) {
    const c = this.bookingForm.get(field);
    return c && c.invalid && (c.dirty || c.touched);
  }

  submit() {
    this.bookingForm.markAllAsTouched();
    if (this.showOtherBox && !this.bookingForm.get('otherDesc')?.value?.trim()) {
      this.bookingForm.get('otherDesc')?.setErrors({ required: true });
      return;
    }
    if (this.bookingForm.valid) {
      console.log('📬 SAGA Booking:', this.bookingForm.value);
      this.popupSubmitted = true;
      setTimeout(() => this.close(), 3500);
    }
  }

  ngOnDestroy() {
    window.removeEventListener('open-booking-popup', this.popupListener);
    document.body.style.overflow = '';
  }
}
