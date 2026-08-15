import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RevealService } from '../../services/reveal.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit, AfterViewInit, OnDestroy {
  contactForm!: FormGroup;
  submitted = false;
  submitting = false;
  private io?: IntersectionObserver;

  constructor(
    private fb: FormBuilder,
    private revealService: RevealService,
  ) {}

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name:      ['', Validators.required],
      email:     ['', [Validators.email]],
      phone:     ['', Validators.required],
      spaceType: [''],
      message:   [''],
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

    try {
      const response = await fetch('https://formsubmit.co/ajax/immayank08@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: 'New Leasing Enquiry for The SAGA Varanasi',
          name: data.name,
          phone: data.phone,
          email: data.email || 'Not provided',
          space_type: data.spaceType || 'Not specified',
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
      this.contactForm.reset();
    }
  }
}
