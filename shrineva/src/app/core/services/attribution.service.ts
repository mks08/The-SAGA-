import { Injectable } from '@angular/core';

/**
 * Remembers where a visit came from (Google Ads click ID and UTM tags) for the length of the browser session, so the
 * lead forms can send it with the enquiry and each lead is tied to the ad, keyword or page that produced it.
 *
 * Rules: the values are read from the landing URL once and kept in sessionStorage (first touch wins until a new tagged
 * URL arrives); they are never shown on the page; and no personal data is stored. If storage is blocked the values
 * live in memory for that page view only.
 */
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid'] as const;
const STORE = 'shrineva_attribution';

@Injectable({ providedIn: 'root' })
export class AttributionService {
  private memory: Record<string, string> = {};

  constructor() {
    this.capture();
  }

  /** Reads UTM tags and the click ID from the current URL. Safe to call more than once. */
  capture(): void {
    let current = this.read();
    try {
      const params = new URLSearchParams(window.location.search);
      const found: Record<string, string> = {};
      for (const key of KEYS) {
        const value = (params.get(key) || '').trim().slice(0, 200);
        if (value) found[key] = value;
      }
      const intent = (params.get('intent') || '').trim().toLowerCase().slice(0, 30);
      if (intent) found['intent'] = intent;
      if (Object.keys(found).length) {
        // A newly tagged URL replaces the earlier tags: it is the most recent ad click.
        current = { ...found, landing_page: window.location.pathname, referrer: this.referrer() };
      } else if (!current['landing_page']) {
        current = { ...current, landing_page: window.location.pathname, referrer: this.referrer() };
      }
    } catch { /* no window or URL support: keep what we have */ }
    this.write(current);
  }

  /** Non-empty attribution fields, ready to merge into a form submission. */
  get(): Record<string, string> {
    const data = this.read();
    // gbraid / wbraid are Google Ads click IDs for iOS: when there is no gclid, send them in the same field.
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) if (v && k !== 'gbraid' && k !== 'wbraid' && k !== 'intent') out[k] = v;
    if (!out['gclid']) {
      const alt = data['gbraid'] ? `gbraid:${data['gbraid']}` : data['wbraid'] ? `wbraid:${data['wbraid']}` : '';
      if (alt) out['gclid'] = alt;
    }
    if (data['intent']) out['intent'] = data['intent'];
    return out;
  }

  private referrer(): string {
    try {
      const r = document.referrer;
      if (!r) return '';
      const u = new URL(r);
      return u.host === window.location.host ? '' : `${u.host}${u.pathname}`.slice(0, 200);
    } catch { return ''; }
  }

  private read(): Record<string, string> {
    try {
      const raw = window.sessionStorage.getItem(STORE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
      }
    } catch { /* storage blocked */ }
    return { ...this.memory };
  }

  private write(data: Record<string, string>): void {
    this.memory = { ...data };
    try { window.sessionStorage.setItem(STORE, JSON.stringify(data)); } catch { /* storage blocked */ }
  }
}
