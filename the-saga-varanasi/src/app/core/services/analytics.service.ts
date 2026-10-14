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

  get measurementId(): string {
    return environment.ga4MeasurementId;
  }
}
