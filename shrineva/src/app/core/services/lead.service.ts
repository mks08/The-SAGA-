import { Injectable } from '@angular/core';
import { PROPERTY } from '../../config/property.config';

export type LeadKind = 'leasing' | 'site-visit' | 'broker';

export interface LeadResult {
  ok: boolean;
  /** Which route delivered it (for diagnostics only). */
  via?: 'handler' | 'formsubmit';
  /** Short machine-readable reason, never shown to visitors. */
  reason?: 'network' | 'rejected' | 'invalid' | 'rate-limited' | 'not-activated';
}

/**
 * Sends an enquiry to the leasing desk. Two routes, tried in order:
 *
 *  1. The site's own handler, /api/lead.php (src/api/lead.php): validates, keeps a private copy on the server and
 *     emails the recipients in src/api/config.php. This is the route used on the Hostinger host.
 *  2. FormSubmit (https://formsubmit.co) as a backup when the handler is not there (preview servers, Vercel) or
 *     cannot send mail. It needs a one-time activation click by the recipient.
 *
 * Returns ok only when one route confirms delivery. The caller must then show an error with the phone / WhatsApp
 * fallback, never a success message, when ok is false.
 */
@Injectable({ providedIn: 'root' })
export class LeadService {
  async submit(subject: string, fields: Record<string, string>, kind: LeadKind = 'leasing'): Promise<LeadResult> {
    const viaHandler = await this.viaHandler(kind, fields);
    if (viaHandler.ok || viaHandler.reason === 'invalid' || viaHandler.reason === 'rate-limited') return viaHandler;
    const viaFormSubmit = await this.viaFormSubmit(subject, fields);
    return viaFormSubmit.ok ? viaFormSubmit : viaHandler.reason === 'network' ? viaFormSubmit : viaHandler;
  }

  private async viaHandler(kind: LeadKind, fields: Record<string, string>): Promise<LeadResult> {
    try {
      const response = await fetch('/api/lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ kind, ...fields, page: location.pathname }),
      });
      const type = response.headers.get('content-type') ?? '';
      // A 404, or the app's own index.html coming back, means there is no handler on this host: use the backup route.
      if (!type.includes('application/json')) return { ok: false, reason: 'network' };
      const body = (await response.json().catch(() => null)) as { ok?: boolean } | null;
      if (response.ok && body?.ok === true) return { ok: true, via: 'handler' };
      if (response.status === 422) return { ok: false, reason: 'invalid' };
      if (response.status === 429) return { ok: false, reason: 'rate-limited' };
      return { ok: false, reason: 'rejected' };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }

  private async viaFormSubmit(subject: string, fields: Record<string, string>): Promise<LeadResult> {
    const filled = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v && v.trim() ? v : 'Not provided']));
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${PROPERTY.contact.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: subject, _template: 'table', _captcha: 'false', ...filled }),
      });
      const body = (await response.json().catch(() => null)) as { success?: string | boolean; message?: string } | null;
      const delivered = response.ok && (body?.success === true || body?.success === 'true');
      if (delivered) return { ok: true, via: 'formsubmit' };
      const msg = (body?.message ?? '').toLowerCase();
      return { ok: false, reason: msg.includes('activat') ? 'not-activated' : 'rejected' };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }
}
