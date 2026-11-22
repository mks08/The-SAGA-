import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

/**
 * Conversion tracking for GA4 and Google Ads (gtag.js).
 *
 * IDs and conversion labels come from src/environments/environment*.ts and stay empty until the owner supplies them; while
 * they are empty nothing is loaded, but events still go to window.dataLayer so a tag manager added later can read them.
 *
 * The four conversion events (names fixed by the SEO / Ads brief):
 *   shrineva_commercial_lead      qualified commercial enquiry submitted (also the short "book a visit" form)
 *   shrineva_phone_click          any tel: link
 *   shrineva_whatsapp_click       any wa.me / WhatsApp link
 *   shrineva_brochure_download    any .pdf link (brochure, floor plans)
 * Phone, WhatsApp and PDF clicks are caught by ONE delegated listener, so every link on every page is counted exactly once
 * and no component has to remember to track it.
 */
export type ConversionKey = 'commercialLead' | 'phoneClick' | 'whatsappClick' | 'brochureDownload';

type Gtag = (...args: unknown[]) => void;
interface TrackWindow { dataLayer?: unknown[]; gtag?: Gtag; __shrinevaClicks?: boolean }

/** Older call sites still send these names; the delegated listener now owns them, so they are dropped here to avoid double counting. */
const HANDLED_BY_LISTENER = new Set(['phone_click', 'whatsapp_click', 'email_click', 'plan_pdf_download', 'dossier_download', 'brochure_download']);

const EVENT_NAME: Record<ConversionKey, string> = {
  commercialLead: 'shrineva_commercial_lead',
  phoneClick: 'shrineva_phone_click',
  whatsappClick: 'shrineva_whatsapp_click',
  brochureDownload: 'shrineva_brochure_download',
};

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly browser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.browser = isPlatformBrowser(platformId);
  }

  event(name: string, params: Record<string, unknown> = {}): void {
    if (HANDLED_BY_LISTENER.has(name)) return;
    this.send(name, params);
  }

  /** A named conversion: fires the shrineva_* event and, when a label is configured, the matching Google Ads conversion. */
  conversion(key: ConversionKey, params: Record<string, unknown> = {}): void {
    if (!this.browser) return;
    const page_path = typeof location !== 'undefined' ? location.pathname : '';
    this.send(EVENT_NAME[key], { page_path, ...params });
    const w = window as unknown as TrackWindow;
    const id = environment.googleAdsId;
    const label = environment.googleAdsLabels[key];
    if (id && label && typeof w.gtag === 'function') {
      w.gtag('event', 'conversion', { send_to: `${id}/${label}` });
    }
  }

  /** Loads gtag.js once when a GA4 (G-) or Google Ads (AW-) ID is configured, and starts the click listener. Called from AppComponent. */
  init(): void {
    if (!this.browser) return; // pre-rendering at build time: no tags, no listeners
    this.listenForClicks();
    const ids = [environment.ga4MeasurementId, environment.googleAdsId].filter(Boolean);
    if (!ids.length || document.getElementById('ga4-script')) return;
    const w = window as unknown as TrackWindow;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { (w.dataLayer as unknown[]).push(arguments); };
    w.gtag('js', new Date());
    if (environment.ga4MeasurementId) w.gtag('config', environment.ga4MeasurementId, { anonymize_ip: true });
    if (environment.googleAdsId) w.gtag('config', environment.googleAdsId);
    const s = document.createElement('script');
    s.id = 'ga4-script';
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids[0] as string)}`;
    document.head.appendChild(s);
  }

  get measurementId(): string {
    return environment.ga4MeasurementId;
  }

  private send(name: string, params: Record<string, unknown>): void {
    if (!this.browser) return;
    const w = window as unknown as TrackWindow;
    if (typeof w.gtag === 'function') {
      w.gtag('event', name, params);
      return;
    }
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: name, ...params });
  }

  /** One capture-phase click listener: tel: links, WhatsApp links and PDF downloads, wherever they are on the page. */
  private listenForClicks(): void {
    const w = window as unknown as TrackWindow;
    if (w.__shrinevaClicks) return;
    w.__shrinevaClicks = true;
    document.addEventListener('click', (e) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a) return;
      const raw = a.getAttribute('href') || '';
      const source = this.sourceOf(a);
      if (raw.startsWith('tel:')) {
        this.conversion('phoneClick', { source, link_url: raw });
      } else if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(a.href)) {
        this.conversion('whatsappClick', { source, link_url: a.href.split('?')[0] });
      } else if (/\.pdf($|[?#])/i.test(raw)) {
        const file = (raw.split(/[?#]/)[0].split('/').pop() || 'brochure.pdf');
        this.conversion('brochureDownload', { source, file_name: file });
      }
    }, true);
  }

  private sourceOf(el: Element): string {
    const tagged = el.closest('[data-track-source]') as HTMLElement | null;
    if (tagged?.dataset['trackSource']) return tagged.dataset['trackSource'];
    if (el.closest('header')) return 'header';
    if (el.closest('footer')) return 'footer';
    return 'page';
  }
}
