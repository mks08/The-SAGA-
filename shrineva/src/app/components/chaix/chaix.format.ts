/**
 * How a ChaiX answer is drawn in the chat window.
 *
 * Answers (config/chaix.knowledge.ts) are plain text with three light conventions, so they stay readable anywhere
 * (the chat transcript, a test log, an email):
 *   - a line that is only **bold text** is a section label ("Location", "Floor", "Next step"),
 *   - a line that starts with "• " is a point; consecutive points make one list,
 *   - any other line is a sentence, and a blank line divides two answers shown in one bubble.
 * Inside a line, **bold** is bold, and the published phone numbers and the leasing e-mail become tap-to-call / tap-to-write links.
 *
 * The window draws these parts with ordinary Angular bindings and never with innerHTML, so an answer can never inject markup.
 * Pure TypeScript (no Angular), so the build test (scripts/test-chaix.js) can run it too.
 */
export interface Seg { t: 'text' | 'b' | 'tel' | 'mail'; s: string; href?: string }
/** One block of an answer. `segs` is used by 'p' and 'h'; `items` (one Seg[] per point) by 'ul'; 'sep' is a divider. */
export interface Block { k: 'p' | 'h' | 'ul' | 'sep'; segs: Seg[]; items: Seg[][] }
/** The only contact details that become links: the ones the site publishes. */
export interface KnownContacts { phones: string[]; emails: string[] }

const PHONE = /\+91[\s -]?\d{5}[\s -]?\d{5}/;
const MAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const LINKS = new RegExp(`${PHONE.source}|${MAIL.source}`, 'g');
const last10 = (s: string): string => s.replace(/\D/g, '').slice(-10);

function linkify(text: string, out: Seg[], known?: KnownContacts): void {
  if (!known) { out.push({ t: 'text', s: text }); return; }
  const phones = new Set(known.phones.map(last10));
  const emails = new Set(known.emails.map((e) => e.toLowerCase()));
  let from = 0;
  LINKS.lastIndex = 0;
  for (let m = LINKS.exec(text); m; m = LINKS.exec(text)) {
    const s = m[0];
    const isMail = s.includes('@');
    if (isMail ? !emails.has(s.toLowerCase()) : !phones.has(last10(s))) continue;          // an unknown number or address stays plain text
    if (m.index > from) out.push({ t: 'text', s: text.slice(from, m.index) });
    out.push(isMail ? { t: 'mail', s, href: `mailto:${s}` } : { t: 'tel', s, href: `tel:+91${last10(s)}` });
    from = m.index + s.length;
  }
  if (from < text.length) out.push({ t: 'text', s: text.slice(from) });
}

/** One line of text: **bold** parts and contact links. */
export function inline(text: string, known?: KnownContacts): Seg[] {
  const out: Seg[] = [];
  text.split('**').forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 1) out.push({ t: 'b', s: part });
    else linkify(part, out, known);
  });
  return out;
}

/**
 * A point that starts with a short name and a colon ("Frontage: about 50 ft") is drawn with the name in bold, so a list of facts
 * reads like a table of names and values. A point that already has its own **bold** is left as written.
 */
const LEAD_IN = /^([^:*]{2,44}):\s+(\S.*)$/;
function point(text: string, known?: KnownContacts): Seg[] {
  const m = text.includes('**') ? null : LEAD_IN.exec(text);
  if (m && m[1].trim().split(/\s+/).length <= 6) return [{ t: 'b', s: `${m[1].trim()}:` }, { t: 'text', s: ' ' }, ...inline(m[2], known)];
  return inline(text, known);
}

const block = (k: Block['k'], segs: Seg[] = []): Block => ({ k, segs, items: [] });

/** Splits an answer into labels, lists, sentences and dividers. */
export function formatAnswer(text: string, known?: KnownContacts): Block[] {
  const blocks: Block[] = [];
  let list: Block | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) {
      list = null;
      if (blocks.length && blocks[blocks.length - 1].k !== 'sep') blocks.push(block('sep'));
      continue;
    }
    const bullet = /^•\s*(.+)$/.exec(line);
    if (bullet) {
      if (!list) { list = block('ul'); blocks.push(list); }
      list.items.push(point(bullet[1], known));
      continue;
    }
    list = null;
    const label = /^\*\*([^*]+)\*\*$/.exec(line);
    if (label) { blocks.push(block('h', [{ t: 'text', s: label[1].replace(/\s*:\s*$/, '') }])); continue; }
    blocks.push(block('p', inline(line, known)));
  }
  while (blocks.length && blocks[blocks.length - 1].k === 'sep') blocks.pop();
  return blocks;
}

/** The same answer as plain text: no bold markers, points as "- ". For a copy of the chat. */
export function plainAnswer(text: string): string {
  return text.replace(/\*\*/g, '').replace(/^•\s*/gm, '- ').trim();
}
