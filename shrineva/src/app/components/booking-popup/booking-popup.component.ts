import { Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AnalyticsService } from '../../core/services/analytics.service';
import { LeadPath, LeadPathRequest, OPEN_LEAD_EVENT } from '../../core/ui-events';
import { LEAD_EN, LEAD_HI, LeadText } from '../lead-form/lead-text';

/**
 * The site-wide enquiry dialog: the three paths (schedule a visit, download the brochure, ask a question) in one sheet.
 * It slides up from the bottom on phones and sits centred on larger screens. Any button opens it through openLeadPath()
 * (core/ui-events.ts), which dispatches the original 'open-booking-popup' window event, so older callers still work.
 * It never opens by itself.
 */
@Component({
  selector: 'app-booking-popup',
  templateUrl: './booking-popup.component.html',
  styleUrls: ['./booking-popup.component.scss'],
})
export class BookingPopupComponent implements OnInit, OnDestroy {
  show = false;
  path: LeadPath = 'visit';
  context = '';
  source = 'popup';
  category = '';
  message = '';
  hindi = false;
  txt: LeadText = LEAD_EN;

  @ViewChild('card') card?: ElementRef<HTMLElement>;

  private listener!: EventListener;
  private returnFocusTo: HTMLElement | null = null;
  private readonly browser: boolean;

  constructor(private analytics: AnalyticsService, @Inject(PLATFORM_ID) platformId: object, @Inject(DOCUMENT) private doc: Document) {
    this.browser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.listener = (e: Event) => this.open((e as CustomEvent<LeadPathRequest>).detail || {});
    if (this.browser) window.addEventListener(OPEN_LEAD_EVENT, this.listener);
  }

  open(req: LeadPathRequest = {}): void {
    this.hindi = (this.doc.documentElement.lang || '').toLowerCase().startsWith('hi');
    this.txt = this.hindi ? LEAD_HI : LEAD_EN;
    this.path = req.path || 'visit';
    this.context = req.context || '';
    this.source = req.source || 'popup';
    this.category = req.category || '';
    this.message = req.message || '';
    this.show = true;
    this.returnFocusTo = this.doc.activeElement as HTMLElement | null;
    this.doc.body.style.overflow = 'hidden';
    this.analytics.event('lead_dialog_open', { path: this.path, source: this.source });
    // Keyboard focus moves into the dialog once it has rendered.
    setTimeout(() => (this.doc.querySelector('.popup-card .popup-close') as HTMLElement | null)?.focus(), 60);
  }

  @HostListener('document:keydown.escape')
  close(): void {
    if (!this.show) return;
    this.show = false;
    this.doc.body.style.overflow = '';
    this.returnFocusTo?.focus?.();
    this.returnFocusTo = null;
  }

  onOverlayClick(e: Event): void {
    if ((e.target as HTMLElement).classList.contains('popup-overlay')) this.close();
  }

  /** Keeps Tab inside the dialog while it is open. */
  @HostListener('document:keydown', ['$event'])
  trap(e: KeyboardEvent): void {
    if (!this.show || e.key !== 'Tab' || !this.card) return;
    const items = Array.from(this.card.nativeElement.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([tabindex="-1"]), textarea, select, [tabindex]:not([tabindex="-1"])'))
      .filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    const active = this.doc.activeElement;
    if (e.shiftKey && (active === first || !this.card.nativeElement.contains(active))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (active === last || !this.card.nativeElement.contains(active))) { e.preventDefault(); first.focus(); }
  }

  ngOnDestroy(): void {
    if (this.browser) window.removeEventListener(OPEN_LEAD_EVENT, this.listener);
    if (this.browser) this.doc.body.style.overflow = '';
  }
}
