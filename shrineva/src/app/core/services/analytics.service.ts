import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Conversion-event hook for GA4 / Google Ads.
 * IDs are read from environment.ts — never hard-code secrets or live
 * measurement IDs in components. Leave the strings empty until the
 * owner supplies them.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  event(name: string, params: Record<string, unknown> = {}): void {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };
    if (typeof w.gtag === 'function') {
      w.gtag('event', name, params);
      return;
    }
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: name, ...params });
  }

  /** Loads gtag.js once, only when a GA4 ID is configured. Called from AppComponent. */
  init(): void {
    const id = environment.ga4MeasurementId;
    if (!id || document.getElementById('ga4-script')) return;
    const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { (w.dataLayer as unknown[]).push(arguments); };
    w.gtag('js', new Date());
    w.gtag('config', id, { anonymize_ip: true });
    const s = document.createElement('script');
    s.id = 'ga4-script';
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s);
  }

  get measurementId(): string {
    return environment.ga4MeasurementId;
  }
}
