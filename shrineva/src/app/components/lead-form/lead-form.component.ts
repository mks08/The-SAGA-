import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { PROPERTY, waLink } from '../../config/property.config';
import { BROCHURE } from '../../config/media.config';
import { HI } from '../../config/hindi.config';
import { LeadService } from '../../core/services/lead.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AttributionService } from '../../core/services/attribution.service';
import { LeadPath, openChaix } from '../../core/ui-events';
import { LEAD_EN, LEAD_HI, LeadText } from './lead-text';

/** A name of at least two characters once the spaces are trimmed. */
const nameValid = (c: AbstractControl): ValidationErrors | null => (String(c.value ?? '').trim().length >= 2 ? null : { name: true });

/**
 * The three ways to get in touch, as one small form: schedule a visit, download the brochure, ask a question.
 * Every path collects the same four things: name, mobile number, email and a query (required on "ask a question",
 * optional on the other two), nothing about money. The ChaiX "send my question to the team" form asks for the same four.
 *
 * Used inside the site-wide dialog (BookingPopupComponent) and inline in the contact section and on the landing pages.
 * Delivery is LeadService: the site's own PHP handler first, FormSubmit as backup. Success fires shrineva_commercial_lead
 * (and the Ads conversion when configured). On the brochure path the PDF download starts after the details are accepted;
 * if delivery fails the visitor still gets the PDF, with the error and the phone / WhatsApp fallback shown, never a false "sent".
 */
@Component({
  selector: 'app-lead-form',
  templateUrl: './lead-form.component.html',
})
export class LeadFormComponent implements OnInit, OnChanges {
  @Input() path: LeadPath = 'visit';
  @Output() pathChange = new EventEmitter<LeadPath>();
  /** What the visitor was looking at ("Second floor"); sent with the enquiry. */
  @Input() context = '';
  /** Where this form sits (hero, explorer, contact_section, landing...); sent with the enquiry and to analytics. */
  @Input() source = 'page';
  /** Business category from an ad landing page (hidden; a LEAD_CATEGORIES value). */
  @Input() category = '';
  @Input() message = '';
  @Input() hindi = false;
  @Input() showTabs = true;
  /** Unique prefix for element ids (two forms can be on a page). */
  @Input() idPrefix = 'lf';
  /** Anchor id on the form (the sticky bar and ad links jump to #enquiry). */
  @Input() anchorId = '';
  /** Heading level of the form title (2 inside the dialog, 3 inline). */
  @Input() headingLevel = 3;
  @Output() sent = new EventEmitter<LeadPath>();

  readonly paths: LeadPath[] = ['visit', 'brochure', 'query'];
  form!: FormGroup;
  txt: LeadText = LEAD_EN;
  property = PROPERTY;
  brochure = BROCHURE;
  submitting = false;
  failed = false;
  done: LeadPath | null = null;
  contextShown = '';

  constructor(
    private fb: FormBuilder,
    private leads: LeadService,
    private analytics: AnalyticsService,
    private attribution: AttributionService,
    private host: ElementRef<HTMLElement>,
  ) {}

  get waHref(): string {
    const parts = this.hindi ? [HI.waMessage] : ['Hi, I am interested in commercial space at SHRINEVA, Bada Lalpur, Varanasi.'];
    if (this.contextShown) parts.push(`(${this.contextShown})`);
    return waLink(parts.join(' '));
  }

  ngOnInit(): void {
    this.txt = this.hindi ? LEAD_HI : LEAD_EN;
    this.form = this.fb.group({
      name: ['', [Validators.required, nameValid, Validators.maxLength(100)]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)]],
      message: [this.message],
      website: [''], // honeypot: real visitors never see or fill this
    });
    this.contextShown = this.context;
    this.applyPath();
  }

  ngOnChanges(c: SimpleChanges): void {
    if (!this.form) return;
    if (c['hindi']) this.txt = this.hindi ? LEAD_HI : LEAD_EN;
    if (c['context']) this.contextShown = this.context;
    if (c['message'] && this.message) this.form.patchValue({ message: this.message });
    if (c['path']) this.applyPath();
  }

  select(p: LeadPath): void {
    if (p === this.path) return;
    this.path = p;
    this.pathChange.emit(p);
    this.failed = false;
    this.applyPath();
    this.analytics.event('lead_path_select', { path: p, source: this.source });
  }

  /** Arrow keys move between the three tabs. */
  tabKey(e: KeyboardEvent): void {
    const i = this.paths.indexOf(this.path);
    let n = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % 3;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i + 2) % 3;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = 2;
    else return;
    e.preventDefault();
    this.select(this.paths[n]);
    (this.host.nativeElement.querySelector(`#${this.idPrefix}-tab-${this.paths[n]}`) as HTMLElement | null)?.focus();
  }

  private applyPath(): void {
    const m = this.form.get('message');
    if (!m) return;
    m.setValidators(this.path === 'query' ? [Validators.required, Validators.minLength(3)] : []);
    m.updateValueAndValidity({ emitEvent: false });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  clearContext(): void { this.contextShown = ''; }

  askChaix(): void {
    openChaix({ source: this.source + '_form', question: this.contextShown ? `Tell me about the ${this.contextShown.toLowerCase()}` : undefined });
  }

  reset(): void {
    this.done = null;
    this.failed = false;
    this.form.reset({ name: '', phone: '', email: '', message: '', website: '' });
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      // The red state is drawn on the next change-detection pass, so look for the first bad field after it.
      setTimeout(() => (this.host.nativeElement.querySelector('.is-invalid') as HTMLElement | null)?.focus(), 0);
      return;
    }
    const v = this.form.value;
    if (v.website) { this.done = this.path; return; } // bot: pretend success, send nothing

    const path = this.path;
    const kind = path === 'visit' ? 'site-visit' : path;
    const subject = { visit: 'New site-visit request for SHRINEVA', brochure: 'SHRINEVA brochure requested', query: 'New question from the SHRINEVA website' }[path];

    this.submitting = true;
    this.failed = false;
    const result = await this.leads.submit(subject, {
      name: String(v.name).trim(),
      phone: v.phone,
      email: v.email,
      message: (v.message || '').trim(),
      business_category: this.category,
      preferred_floor: this.contextShown,
      other_details: `Source: ${this.source}`,
    }, kind as 'site-visit' | 'brochure' | 'query');
    this.submitting = false;

    if (result.ok) {
      this.analytics.conversion('commercialLead', {
        lead_type: path,
        source: this.source,
        business_category: this.category || 'not_given',
        floor: this.contextShown || 'not_given',
        intent: this.attribution.get()['intent'] || 'none',
        via: result.via,
        language: this.hindi ? 'hi' : 'en',
      });
      this.done = path;
      this.sent.emit(path);
      if (path === 'brochure') this.startDownload();
    } else {
      this.failed = true; // keep what the visitor typed
      this.analytics.event('lead_form_error', { path, reason: result.reason, source: this.source });
    }
  }

  /** The PDF starts after the details are accepted; the visible button below is the fallback if the browser blocks it. */
  private startDownload(): void {
    setTimeout(() => (this.host.nativeElement.querySelector(`#${this.idPrefix}-dl`) as HTMLAnchorElement | null)?.click(), 120);
  }
}
