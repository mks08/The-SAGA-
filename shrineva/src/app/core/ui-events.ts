/**
 * Small window events that let any button open the shared dialogs without importing them.
 *
 *  - openLeadPath(): the three enquiry paths (schedule a visit, download the brochure, ask a question). The event keeps its
 *    original name, 'open-booking-popup', so older call sites that dispatch it with no detail still open the visit path.
 *  - openChaix(): the ChaiX assistant, optionally with a first question or the floor the visitor is looking at.
 *  - openLightbox(): the full-screen image viewer, for any picture that can be pressed to enlarge it.
 */
import type { MediaItem } from '../config/media.config';

export type LeadPath = 'visit' | 'brochure' | 'query';

export interface LeadPathRequest {
  path?: LeadPath;
  /** Where the click came from (hero, explorer, mobile_bar, ...); sent with the enquiry and to analytics. */
  source?: string;
  /** What the visitor was looking at, e.g. "Second floor". Sent with the enquiry. */
  context?: string;
  /** Business category from an ad landing page (a LEAD_CATEGORIES value). */
  category?: string;
  /** Pre-filled message text. */
  message?: string;
}

export interface ChaixRequest {
  /** A question to ask straight away. */
  question?: string;
  source?: string;
}

export interface LightboxRequest {
  /** The pictures to browse. One picture is fine: the arrows and the counter are then hidden. */
  items: MediaItem[];
  /** Which one opens first (default: the first). */
  index?: number;
  /** Small print under the caption, e.g. "Indicative 3D render. Subject to change." */
  disclaimer?: string;
}

export const OPEN_LEAD_EVENT = 'open-booking-popup';
export const OPEN_CHAIX_EVENT = 'open-chaix';
export const OPEN_LIGHTBOX_EVENT = 'open-lightbox';

export function openLeadPath(req: LeadPathRequest = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<LeadPathRequest>(OPEN_LEAD_EVENT, { detail: req }));
}

export function openChaix(req: ChaixRequest = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ChaixRequest>(OPEN_CHAIX_EVENT, { detail: req }));
}

export function openLightbox(req: LightboxRequest): void {
  if (typeof window === 'undefined' || !req.items.length) return;
  window.dispatchEvent(new CustomEvent<LightboxRequest>(OPEN_LIGHTBOX_EVENT, { detail: req }));
}
