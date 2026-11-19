import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface EnquiryPrefill { category?: string; area?: string; }

/** Lets the space finder hand its two answers to the enquiry form on the same page. The form takes the values once and clears them. */
@Injectable({ providedIn: 'root' })
export class EnquiryPrefillService {
  private readonly subject = new BehaviorSubject<EnquiryPrefill | null>(null);
  readonly value$ = this.subject.asObservable();

  set(value: EnquiryPrefill): void { this.subject.next(value); }
  clear(): void { this.subject.next(null); }
}
