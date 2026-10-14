import { Injectable } from '@angular/core';
import { PROPERTY } from '../../config/property.config';

export interface LeadResult {
  ok: boolean;
  /** Short machine-readable reason, never shown to visitors. */
  reason?: 'network' | 'rejected' | 'not-activated';
}

/**
 * Sends an enquiry to the leasing inbox through FormSubmit (static hosting has no backend).
 * Returns ok only when the service confirms delivery. The caller must show an error and a
 * WhatsApp fallback when ok is false, never a success message.
 *
 * FormSubmit needs a one-time email confirmation for the recipient address before it
 * delivers. Until that is done every call returns reason 'not-activated'.
 */
@Injectable({ providedIn: 'root' })
export class LeadService {
  async submit(subject: string, fields: Record<string, string>): Promise<LeadResult> {
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${PROPERTY.contact.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: subject, _template: 'table', _captcha: 'false', ...fields }),
      });
      const body = (await response.json().catch(() => null)) as { success?: string | boolean; message?: string } | null;
      const delivered = response.ok && (body?.success === true || body?.success === 'true');
      if (delivered) return { ok: true };
      const msg = (body?.message ?? '').toLowerCase();
      return { ok: false, reason: msg.includes('activat') ? 'not-activated' : 'rejected' };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }
}
