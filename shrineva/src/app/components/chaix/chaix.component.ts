import { Component, ElementRef, HostListener, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import type { ChaixChip, ChaixReply, ResolvedAction } from '../../core/chaix/chaix-engine';
import type { Lang } from '../../config/chaix.knowledge';
import { PROPERTY, waLink } from '../../config/property.config';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AttributionService } from '../../core/services/attribution.service';
import { LeadService } from '../../core/services/lead.service';
import { PageLangService } from '../../core/services/page-lang.service';
import { ChaixRequest, OPEN_CHAIX_EVENT, openLeadPath } from '../../core/ui-events';
import { LEAD_EN, LEAD_HI, LeadText } from '../lead-form/lead-text';
import { Block, KnownContacts, formatAnswer } from './chaix.format';
import { CHAIX_EN, CHAIX_HI, ChaixText } from './chaix.text';

/** The brain (engine + knowledge base) is a separate download, fetched the first time the visitor opens ChaiX. */
type Engine = typeof import('../../core/chaix/chaix-engine');

interface Msg {
  id: number;
  from: 'bot' | 'me';
  text: string;
  /** Bot messages only: the text split into labels, lists and sentences (chaix.format.ts), which is what the window draws. */
  blocks: Block[];
  actions: ResolvedAction[];
  chips: ChaixChip[];
  /** Bot messages only: which entries answered, for the summary sent with a question and for the floor in view. */
  ids: string[];
  titles: string[];
  matched: boolean;
}

/** The contact details the site publishes: in an answer they become tap-to-call and tap-to-write links; anything else stays text. */
const KNOWN_CONTACTS: KnownContacts = { phones: [PROPERTY.contact.phoneDisplay], emails: [PROPERTY.contact.publicEmail] };

const FLOOR_LABEL: Record<string, string> = { 'floor-1': 'First floor', 'floor-2': 'Second floor', 'floor-3': 'Third floor', ground: 'Ground level' };

// ── The speech bubble beside the launcher (the Air India way) ─────────────────────────────────────────────────────────
// As a page loads: "How can I help you?" for a few seconds, a short pause, then "My name is ChaiX · Online" for a few more, then
// only the avatar stays. Later pages of the same visit get "How can I help you?" again, up to BUBBLE_MAX_VIEWS pages in all.
// Once the visitor opens ChaiX or hides the bubble with the cross, it stays quiet for the rest of the visit.
const BUBBLE_FIRST_MS = 500;    // after the page has loaded
const BUBBLE_NAV_MS = 900;      // after moving to another page
const BUBBLE_HELP_MS = 6500;    // "How can I help you?" stays this long
const BUBBLE_GAP_MS = 1100;     // blank between the two messages
const BUBBLE_NAME_MS = 6000;    // "My name is ChaiX · Online" stays this long
const BUBBLE_MAX_VIEWS = 3;
const INTRO_KEY = 'shrineva.chaix.intro';
const FIELD = /^(INPUT|TEXTAREA|SELECT)$/;

interface IntroState { n: number; off: boolean }
const readIntro = (): IntroState => {
  try { const v = JSON.parse(sessionStorage.getItem(INTRO_KEY) || '{}'); return { n: Number(v.n) || 0, off: v.off === true }; } catch { return { n: 0, off: false }; }
};
const writeIntro = (s: IntroState): void => { try { sessionStorage.setItem(INTRO_KEY, JSON.stringify(s)); } catch { /* storage blocked: the state then lives only until the page is reloaded */ } };

/** "98765 43210", "+91 98765 43210" and "098765 43210" are all the same number. */
const normalisePhone = (v: string): string => {
  let d = (v || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
};
const nameValid = (c: AbstractControl): ValidationErrors | null => (String(c.value ?? '').trim().length >= 2 ? null : { name: true });
const phoneValid = (c: AbstractControl): ValidationErrors | null => (/^[6-9]\d{9}$/.test(normalisePhone(String(c.value ?? ''))) ? null : { phone: true });

/**
 * ChaiX, the SHRINEVA leasing assistant: a small chat window that answers from the project's own facts (the brain is
 * core/chaix/chaix-engine.ts with config/chaix.knowledge.ts) and, when the visitor wants a person, sends their question,
 * mobile number and email to the leasing mailbox through LeadService (kind "chaix"), with the chat so far attached.
 *
 *  - Desktop: a floating card above the WhatsApp button. Phones: a bottom sheet (the action bar's ChaiX button opens it).
 *  - Any button opens it through openChaix() (core/ui-events.ts), optionally with a first question.
 *  - Nothing is sent anywhere until the visitor submits the "Send my question to the team" form; analytics events carry no
 *    typed text. The chat lives in memory only (a page reload starts a new one).
 *  - English and Hindi: the window follows the page language, switches when the visitor types Devanagari, and has a switch.
 */
@Component({
  selector: 'app-chaix',
  templateUrl: './chaix.component.html',
  styleUrls: ['./chaix.component.scss'],
})
export class ChaixComponent implements OnInit, OnDestroy {
  open = false;
  /** Phone layout: bottom sheet with a dimmed page behind it, modal. */
  sheet = false;
  lang: Lang = 'en';
  msgs: Msg[] = [];
  /** The "Most asked" questions pinned above the message box, in the window's language. */
  pinned: ChaixChip[] = [];
  typing = false;
  busy = false;
  formOpen = false;
  sending = false;
  failed = false;
  /** Height of the on-screen keyboard on phones, so the sheet and its message box stay above it. */
  kbOffset = 0;
  vvh = 0;
  property = PROPERTY;
  /** What the speech bubble beside the launcher says now: nothing, "How can I help you?", or "My name is ChaiX" with "Online". */
  bubble: 'none' | 'help' | 'name' = 'none';
  /**
   * The launcher steps aside (fades out) while the keyboard is coming up for a form field on a phone, and while the page's scroll is
   * locked by something else (the mobile menu, the visit dialog, the picture viewer), so it never covers them.
   */
  get away(): boolean { return this.fieldAway || this.locked; }
  private fieldAway = false;
  private locked = false;
  private lockWatch?: MutationObserver;

  readonly draft = new FormControl('', { nonNullable: true });
  form: FormGroup;

  @ViewChild('panel') panel?: ElementRef<HTMLElement>;
  @ViewChild('log') log?: ElementRef<HTMLElement>;
  @ViewChild('box') box?: ElementRef<HTMLInputElement>;
  @ViewChild('nameField') nameField?: ElementRef<HTMLInputElement>;

  private engine?: Engine;
  /** The topics that are pinned above the message box: a follow-up button under an answer never repeats one of them. */
  private pinnedIds = new Set<string>();
  private engineLoading?: Promise<Engine>;
  private seq = 0;
  private source = 'launcher';
  private lastTyped = '';
  private returnFocusTo: HTMLElement | null = null;
  /** Prefers-reduced-motion: no typing delay, no smooth scrolling. Read by the template too. */
  reduced = false;
  private mq?: MediaQueryList;
  private listener!: EventListener;
  private intro: IntroState = { n: 0, off: false };
  private bubbleTimer?: ReturnType<typeof setTimeout>;
  private bubbleHeld = false;
  private routeSub?: Subscription;
  private readonly browser: boolean;
  private readonly vvHandler = (): void => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;
    this.vvh = Math.round(vv.height);
    this.kbOffset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  };

  constructor(
    private fb: FormBuilder,
    private leads: LeadService,
    private analytics: AnalyticsService,
    private attribution: AttributionService,
    private pageLang: PageLangService,
    private router: Router,
    private zone: NgZone,
    @Inject(PLATFORM_ID) platformId: object,
    @Inject(DOCUMENT) private doc: Document,
  ) {
    this.browser = isPlatformBrowser(platformId);
    this.lang = this.pageLang.hindi ? 'hi' : 'en';
    this.form = this.fb.group({
      name: ['', [Validators.required, nameValid, Validators.maxLength(100)]],
      phone: ['', [Validators.required, phoneValid]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)]],
      question: ['', [Validators.required, Validators.minLength(3)]],
      website: [''], // honeypot: real visitors never see or fill this
    });
  }

  get t(): ChaixText { return this.lang === 'hi' ? CHAIX_HI : CHAIX_EN; }
  /** The launcher and its bubble follow the language of the page (the window follows the chat's own language). */
  get hindiUi(): boolean { return this.pageLang.hindi; }
  get ui(): ChaixText { return this.hindiUi ? CHAIX_HI : CHAIX_EN; }
  get lt(): LeadText { return this.lang === 'hi' ? LEAD_HI : LEAD_EN; }
  get waHref(): string {
    const ctx = this.floorContext();
    return waLink(ctx ? `${this.t.waMessage} (${ctx})` : this.t.waMessage);
  }
  /** A phone with the keyboard up: only the log and the message box stay, so the answer has room. */
  get compact(): boolean { return this.sheet && this.kbOffset > 100; }
  get lastIsBot(): boolean { return this.msgs.length > 0 && this.msgs[this.msgs.length - 1].from === 'bot'; }

  ngOnInit(): void {
    if (!this.browser) return;
    this.listener = (e: Event) => this.zone.run(() => void this.openFrom((e as CustomEvent<ChaixRequest>).detail || {}));
    window.addEventListener(OPEN_CHAIX_EVENT, this.listener);
    this.mq = window.matchMedia('(max-width: 767.98px)');
    // The bubble starts as the page loads, and again on each page the visitor moves to (browser only: no timers on the server).
    this.intro = readIntro();
    this.startBubbles(BUBBLE_FIRST_MS);
    this.routeSub = this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.fieldAway = false;
      this.startBubbles(BUBBLE_NAV_MS);
    });
    // Something else locking the page's scroll (menu, dialog, viewer) means it is on top: the launcher and bubble step aside.
    const sync = (): void => {
      const locked = this.doc.body.style.overflow === 'hidden';
      if (locked === this.locked) return;
      this.locked = locked;
      if (locked) this.stopBubbles();
    };
    this.lockWatch = new MutationObserver(sync);
    this.lockWatch.observe(this.doc.body, { attributes: true, attributeFilter: ['style'] });
    sync();
  }

  ngOnDestroy(): void {
    if (!this.browser) return;
    window.removeEventListener(OPEN_CHAIX_EVENT, this.listener);
    this.routeSub?.unsubscribe();
    this.lockWatch?.disconnect();
    this.stopBubbles();
    this.lockScroll(false);
    this.watchKeyboard(false);
  }

  // ── The speech bubble ─────────────────────────────────────────────────────────────────────────────────────────────

  private saveIntro(): void { writeIntro(this.intro); }
  private page(): string { return this.router.url.split(/[?#]/)[0].slice(0, 60) || '/'; }

  /** Plays the bubble for the page in view: "How can I help you?", and on the first page of a visit also "My name is ChaiX". */
  private startBubbles(delay: number): void {
    this.stopBubbles();
    if (!this.browser || this.intro.off || this.intro.n >= BUBBLE_MAX_VIEWS) return;
    const withName = this.intro.n === 0;
    this.bubbleTimer = setTimeout(() => this.showHelp(withName, 0), delay);
  }

  private stopBubbles(): void {
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
    this.bubbleTimer = undefined;
    this.bubbleHeld = false;
    this.bubble = 'none';
  }

  /** Not while a window, menu or form is in the way, or the tab is in the background; tries again a few times. */
  private bubbleAllowed(): boolean {
    return !this.open && !this.away && this.doc.visibilityState === 'visible';
  }

  private showHelp(withName: boolean, tries: number): void {
    if (!this.bubbleAllowed()) {
      if (tries < 4) this.bubbleTimer = setTimeout(() => this.showHelp(withName, tries + 1), 2500);
      return;
    }
    this.bubble = 'help';
    this.intro.n++;
    this.saveIntro();
    this.analytics.event('chaix_prompt_show', { step: 'help', lang: this.hindiUi ? 'hi' : 'en', page: this.page() });
    this.bubbleTimer = setTimeout(() => this.hideBubble(() => { if (withName) this.bubbleTimer = setTimeout(() => this.showName(), BUBBLE_GAP_MS); }), BUBBLE_HELP_MS);
  }

  private showName(): void {
    if (!this.bubbleAllowed()) return;
    this.bubble = 'name';
    this.analytics.event('chaix_prompt_show', { step: 'name', lang: this.hindiUi ? 'hi' : 'en', page: this.page() });
    this.bubbleTimer = setTimeout(() => this.hideBubble(), BUBBLE_NAME_MS);
  }

  /** Hides the bubble, unless the visitor is pointing at it or has it in focus: then it waits a moment and asks again. */
  private hideBubble(next?: () => void): void {
    if (this.bubbleHeld) { this.bubbleTimer = setTimeout(() => this.hideBubble(next), 1500); return; }
    this.bubble = 'none';
    next?.();
  }

  holdBubble(): void { this.bubbleHeld = true; }
  releaseBubble(): void { this.bubbleHeld = false; }

  /** The cross: hides the bubble and keeps it away for the rest of the visit. */
  dismissBubble(): void {
    const step = this.bubble;
    this.stopBubbles();
    this.intro.off = true;
    this.saveIntro();
    this.analytics.event('chaix_prompt_dismiss', { step, page: this.page() });
  }

  openFromBubble(): void {
    this.analytics.event('chaix_prompt_click', { step: this.bubble, page: this.page() });
    void this.openFrom({ source: 'bubble' });
  }

  /** On a phone, a focused form field means the keyboard is coming up: the launcher steps aside until the field is left. */
  @HostListener('document:focusin', ['$event'])
  onFocusIn(e: FocusEvent): void {
    if (!this.browser || this.open || !this.mq?.matches) return;
    const el = e.target as HTMLElement | null;
    if (el && FIELD.test(el.tagName)) { this.fieldAway = true; this.stopBubbles(); }
  }

  @HostListener('document:focusout')
  onFocusOut(): void {
    if (!this.browser || !this.fieldAway) return;
    setTimeout(() => {
      const a = this.doc.activeElement as HTMLElement | null;
      if (!a || !FIELD.test(a.tagName)) this.fieldAway = false;
    }, 80);
  }

  /** Starts loading the brain when the visitor reaches for the button, so the first answer is quick. */
  warm(): void { void this.loadEngine().catch(() => undefined); }

  // ── Opening and closing ──────────────────────────────────────────────────────────────────────────────────────────

  async openFrom(req: ChaixRequest = {}): Promise<void> {
    if (!this.browser) return;
    this.source = req.source || 'launcher';
    // The visitor has found ChaiX: the bubble stays quiet for the rest of the visit.
    this.stopBubbles();
    if (!this.intro.off) { this.intro.off = true; this.saveIntro(); }
    if (!this.open) {
      if (!this.msgs.length) this.lang = this.pageLang.hindi ? 'hi' : 'en';
      this.sheet = this.mq?.matches ?? false;
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.returnFocusTo = this.doc.activeElement as HTMLElement | null;
      this.open = true;
      if (this.sheet) { this.lockScroll(true); this.watchKeyboard(true); }
      this.analytics.event('chaix_open', { source: this.source, lang: this.lang, returning: this.msgs.length ? 'yes' : 'no' });
      void this.loadEngine().then(() => this.refreshPinned()).catch(() => undefined);
      setTimeout(() => this.focusStart(), 60);
    }
    const q = (req.question || '').trim();
    if (q) await this.ask(q, 'prefill');
    else if (!this.msgs.length) await this.greet();
    else this.scrollSoon();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.open) this.close(); else if (this.bubble !== 'none') this.stopBubbles(); }

  close(restoreFocus = true): void {
    if (!this.open) return;
    this.open = false;
    this.fieldAway = false;
    this.lockScroll(false);
    this.watchKeyboard(false);
    this.analytics.event('chaix_close', { questions: this.msgs.filter((m) => m.from === 'me').length, source: this.source });
    const back = this.returnFocusTo;
    this.returnFocusTo = null;
    if (restoreFocus && back && this.doc.contains(back)) setTimeout(() => back.focus?.(), 0);
  }

  /** Keeps Tab inside the sheet while it is open on a phone. */
  @HostListener('document:keydown', ['$event'])
  trap(e: KeyboardEvent): void {
    if (!this.open || !this.sheet || e.key !== 'Tab' || !this.panel) return;
    const root = this.panel.nativeElement;
    const items = Array.from(root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([tabindex="-1"]):not([disabled]), textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    const active = this.doc.activeElement;
    if (e.shiftKey && (active === first || !root.contains(active))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (active === last || !root.contains(active))) { e.preventDefault(); first.focus(); }
  }

  private focusStart(): void {
    // On a phone, focusing the message box would raise the keyboard over the answer; the visitor taps it when ready.
    if (this.sheet) this.panel?.nativeElement.focus();
    else this.box?.nativeElement.focus();
  }

  private lockScroll(on: boolean): void { this.doc.body.style.overflow = on ? 'hidden' : ''; }

  private watchKeyboard(on: boolean): void {
    const vv = window.visualViewport;
    if (!vv) return;
    if (on) {
      vv.addEventListener('resize', this.vvHandler);
      vv.addEventListener('scroll', this.vvHandler);
      this.vvHandler();
    } else {
      vv.removeEventListener('resize', this.vvHandler);
      vv.removeEventListener('scroll', this.vvHandler);
      this.kbOffset = 0;
      this.vvh = 0;
    }
  }

  // ── The conversation ─────────────────────────────────────────────────────────────────────────────────────────────

  trackMsg = (_: number, m: Msg): number => m.id;

  private loadEngine(): Promise<Engine> {
    if (!this.engineLoading) {
      this.engineLoading = import('../../core/chaix/chaix-engine').then((m) => (this.engine = m));
      this.engineLoading.catch(() => { this.engineLoading = undefined; });
    }
    return this.engineLoading;
  }

  private push(m: Partial<Msg> & Pick<Msg, 'from' | 'text'>): void {
    const blocks = m.from === 'bot' ? formatAnswer(m.text, KNOWN_CONTACTS) : [];
    this.msgs = [...this.msgs, { id: ++this.seq, blocks, actions: [], chips: [], ids: [], titles: [], matched: true, ...m }];
    this.scrollSoon();
  }

  /** The pinned questions follow the window's language. */
  private refreshPinned(): void {
    if (!this.engine) return;
    this.pinned = this.engine.pinned(this.lang);
    this.pinnedIds = new Set(this.pinned.map((c) => c.id));
  }

  private pushReply(r: ChaixReply): void {
    this.push({ from: 'bot', text: r.text, actions: r.actions, chips: r.chips.filter((c) => !this.pinnedIds.has(c.id)), ids: r.ids, titles: r.titles, matched: r.matched });
  }

  private wait(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }

  /** The first message: a greeting and the starter questions. */
  private async greet(): Promise<void> {
    await this.respond((e) => e.greeting(this.lang), 'greeting', 0);
  }

  /** Prepares a reply: shows "typing" for a moment (the engine downloads on first use), then adds the answer. */
  private async respond(make: (e: Engine) => ChaixReply, via: string, minDelay = 380): Promise<void> {
    this.busy = true;
    this.typing = true;
    this.scrollSoon();
    let engine: Engine;
    try {
      engine = await this.loadEngine();
    } catch {
      this.typing = false;
      this.busy = false;
      this.push({
        from: 'bot', text: this.t.loadError, matched: false,
        actions: [
          { kind: 'tel', label: `${this.lang === 'hi' ? 'कॉल करें' : 'Call'} ${PROPERTY.contact.phoneDisplay}`, href: PROPERTY.contact.phoneE164 },
          { kind: 'whatsapp', label: this.lang === 'hi' ? 'WhatsApp करें' : 'WhatsApp the team' },
        ],
      });
      return;
    }
    const reply = make(engine);
    if (reply.lang === 'hi' && this.lang === 'en') this.lang = 'hi';      // the visitor typed Hindi: the window follows
    this.refreshPinned();
    await this.wait(this.reduced || !minDelay ? 0 : Math.min(900, minDelay + reply.text.length * 2));
    this.typing = false;
    this.busy = false;
    this.pushReply(reply);
    if (via !== 'greeting') {
      // Counts and topics only: what the visitor typed is never sent to analytics.
      this.analytics.event('chaix_question', { topic: reply.ids.join(',').slice(0, 80), matched: reply.matched ? 'yes' : 'no', via, lang: reply.lang, source: this.source });
    }
    if (reply.callback) this.openForm('call');
  }

  async ask(text: string, via: 'typed' | 'prefill'): Promise<void> {
    const clean = text.trim().slice(0, 300);
    if (!clean || this.busy) return;
    this.push({ from: 'me', text: clean });
    if (via === 'typed') this.lastTyped = clean;
    await this.respond((e) => e.replyToText(clean, this.lang), via);
  }

  /** A suggested follow-up (under an answer) or one of the pinned "Most asked" questions. */
  async askChip(c: ChaixChip, via: 'chip' | 'pinned' = 'chip'): Promise<void> {
    if (this.busy) return;
    if (via === 'pinned') this.lastTyped = c.label;
    this.push({ from: 'me', text: c.label });
    await this.respond((e) => e.replyToId(c.id, this.lang), via);
  }

  send(ev: Event): void {
    ev.preventDefault();
    if (this.busy) return;
    const v = this.draft.value;
    if (!v.trim()) return;
    this.draft.setValue('');
    void this.ask(v, 'typed');
  }

  toggleLang(): void {
    this.lang = this.t.switchLang;
    this.refreshPinned();
    // Only the greeting so far: say it again in the new language
    if (this.msgs.length === 1 && this.msgs[0].from === 'bot' && !this.busy) {
      this.msgs = [];
      void this.greet();
    }
    this.analytics.event('chaix_language', { lang: this.lang, source: this.source });
  }

  // ── Buttons under an answer ─────────────────────────────────────────────────────────────────────────────────────

  run(a: ResolvedAction): void {
    this.analytics.event('chaix_action', { kind: a.kind, source: this.source });
    if (a.kind === 'callback') { this.openForm('question'); return; }
    if (a.kind === 'visit' || a.kind === 'brochure') {
      // The enquiry dialog sits above everything; the chat steps aside (it is still here, with its history, when reopened).
      const context = this.floorContext();
      this.close(false);
      setTimeout(() => openLeadPath({ path: a.kind as 'visit' | 'brochure', source: 'chaix', context }), 40);
    }
  }

  routePath(a: ResolvedAction): string { return (a.href || '/').split('#')[0] || '/'; }
  routeFragment(a: ResolvedAction): string | undefined { return (a.href || '').split('#')[1] || undefined; }

  /**
   * A link to a page or a place on this page. A plain click is handled here (so the router and the scroll never fight):
   * on the same page it scrolls to the place, otherwise it navigates. Ctrl/Cmd/middle clicks are left to the browser.
   */
  go(a: ResolvedAction, ev: MouseEvent): void {
    this.analytics.event('chaix_action', { kind: 'route', target: (a.href || '').slice(0, 40), source: this.source });
    if (ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
    ev.preventDefault();
    const norm = (p: string) => p.replace(/\/$/, '') || '/';
    const path = this.routePath(a);
    const frag = this.routeFragment(a);
    if (this.sheet) this.close(false);
    if (norm(this.doc.location.pathname) !== norm(path)) {
      setTimeout(() => void this.router.navigate([path], { fragment: frag }), this.sheet ? 120 : 0);
      return;
    }
    setTimeout(() => {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (frag) this.doc.getElementById(frag)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      else window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    }, this.sheet ? 140 : 0);
  }

  /** The "Privacy policy" link inside the form: the same handling as any other link to a page. */
  goPrivacyLink(ev: MouseEvent): void { this.go({ kind: 'route', label: '', href: '/privacy-disclaimer' }, ev); }

  // ── Send my question to the team ────────────────────────────────────────────────────────────────────────────────

  invalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  openForm(mode: 'question' | 'call'): void {
    if (!this.formOpen) {
      this.formOpen = true;
      this.failed = false;
      const callMe = this.lang === 'hi' ? 'कृपया मुझे कॉल करें।' : 'Please call me back.';
      this.form.patchValue({ question: mode === 'call' ? callMe : this.lastTyped });
      this.analytics.event('chaix_form_open', { mode, source: this.source });
    }
    this.scrollSoon();
    setTimeout(() => this.nameField?.nativeElement.focus({ preventScroll: true }), 120);
  }

  closeForm(): void {
    this.formOpen = false;
    this.failed = false;
    setTimeout(() => (this.sheet ? this.panel : this.box)?.nativeElement.focus(), 0);
  }

  async submitForm(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      setTimeout(() => (this.panel?.nativeElement.querySelector('.cb .is-invalid') as HTMLElement | null)?.focus(), 0);
      return;
    }
    const v = this.form.getRawValue() as { name: string; phone: string; email: string; question: string; website: string };
    const name = v.name.trim();
    const phone = normalisePhone(v.phone);
    const email = v.email.trim();
    if (v.website) { this.finishSent(name, phone, email); return; }                    // a bot: pretend, send nothing

    this.sending = true;
    this.failed = false;
    const message = `${v.question.trim()}\n\n— Chat so far (${this.lang === 'hi' ? 'Hindi' : 'English'}) —\n${this.transcript()}`.slice(0, 1900);
    // What the visitor said about their requirement (the kind of business, the size, the floor) travels as separate fields, so the
    // leasing team sees it at the top of the email and not only inside the chat.
    const fields: Record<string, string> = { name, phone, email, message, preferred_floor: this.floorContext(), other_details: 'Source: ChaiX chat' };
    const business = this.businessContext();
    const size = this.sizeContext();
    if (business) fields['business_category'] = business;
    if (size) fields['space_required'] = size;
    const result = await this.leads.submit('New question from the SHRINEVA website (ChaiX)', fields, 'chaix');
    this.sending = false;

    if (result.ok) {
      this.analytics.conversion('commercialLead', {
        lead_type: 'chaix', source: this.source, floor: this.floorContext() || 'not_given',
        intent: this.attribution.get()['intent'] || 'none', via: result.via, language: this.lang,
      });
      this.finishSent(name, phone, email);
    } else {
      this.failed = true;                                                        // keep what the visitor typed
      this.analytics.event('lead_form_error', { path: 'chaix', reason: result.reason, source: this.source });
    }
  }

  private finishSent(name: string, phone: string, email: string): void {
    this.formOpen = false;
    this.failed = false;
    this.lastTyped = '';
    this.form.reset({ name: '', phone: '', email: '', question: '', website: '' });
    this.push({ from: 'bot', text: this.t.thanks(name.split(/\s+/)[0], phone, email) });
  }

  /** What was asked and which topic answered, one line per question: the context that goes to the leasing team. */
  private transcript(): string {
    const lines: string[] = [];
    this.msgs.forEach((m, i) => {
      if (m.from !== 'me') return;
      const next = this.msgs[i + 1];
      const topic = next && next.from === 'bot' ? (next.matched ? next.titles.join(' + ') : 'not covered by ChaiX') : '…';
      lines.push(`${lines.length + 1}. "${m.text.slice(0, 160).replace(/\s+/g, ' ')}" → ${topic}`);
    });
    return lines.slice(-15).join('\n') || '(no questions were asked before sending)';
  }

  /** The kind of business the visitor asked about ("Banks, NBFCs and insurance branches"): the latest business answer in this chat. */
  private businessContext(): string {
    if (!this.engine) return '';
    for (let i = this.msgs.length - 1; i >= 0; i--) {
      const m = this.msgs[i];
      if (m.from !== 'bot') continue;
      for (const id of m.ids) {
        const title = this.engine.businessTitle(id);
        if (title) return title.slice(0, 80);
      }
    }
    return '';
  }

  /** The size the visitor said they need ("1,500 sq ft"), read from what they typed; empty when they gave none. */
  private sizeContext(): string {
    return this.engine ? this.engine.areaNeedIn(this.msgs.filter((m) => m.from === 'me').map((m) => m.text)).slice(0, 60) : '';
  }

  /** The floor the visitor has been looking at in this chat ("Second floor"), sent with the question and with a visit request. */
  private floorContext(): string {
    for (let i = this.msgs.length - 1; i >= 0; i--) {
      const m = this.msgs[i];
      const id = m.from === 'bot' ? m.ids.find((x) => x in FLOOR_LABEL) : undefined;
      if (id) return FLOOR_LABEL[id];
    }
    return '';
  }

  // ── Scrolling ────────────────────────────────────────────────────────────────────────────────────────────────────

  /** Brings the newest message into view: a long answer from its first line, everything else to the bottom. */
  private scrollSoon(): void {
    if (!this.browser) return;
    setTimeout(() => {
      const el = this.log?.nativeElement;
      if (!el) return;
      const behavior: ScrollBehavior = this.reduced ? 'auto' : 'smooth';
      const bots = el.querySelectorAll<HTMLElement>('.msg-bot');
      const last = bots[bots.length - 1];
      if (!this.formOpen && !this.typing && this.lastIsBot && last && last.offsetHeight > el.clientHeight * 0.6) {
        const top = last.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;   // where the answer starts inside the log
        el.scrollTo({ top: Math.max(0, top - 10), behavior });
      } else el.scrollTo({ top: el.scrollHeight, behavior });
    }, 40);
  }
}
