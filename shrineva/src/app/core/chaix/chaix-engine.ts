/**
 * The brain of ChaiX: turns a visitor's message into the right answer from the knowledge base (config/chaix.knowledge.ts).
 *
 * It is plain, deterministic TypeScript with no Angular and no network, so it can run in the browser, in the build (the same
 * questions are replayed by scripts/test-chaix.js on every build) and in tests. The steps:
 *
 *   1. Clean the message (lower-case, punctuation, "sq.ft" / "1st" / "floor 2" forms, Devanagari words mapped to the English
 *      words the knowledge base uses) and cut it into stemmed words.
 *   2. Find the floor the visitor names ("2nd floor", "top floor", "पहली मंज़िल"): a floor is a qualifier, not a topic.
 *   3. Find an area need ("2,000 sq ft", "1000 to 1500 sqft", "need 800") and answer it against the real floor sizes.
 *   4. Match every key phrase of every entry against the words. Longer phrases win over shorter ones that sit inside them, so
 *      "how much space" is about area and not about rent; a one-letter typo in a long word still matches.
 *   5. Answer with the best entry (and a second one when the question clearly has two parts), or say honestly that it is not
 *      confirmed. Nothing is ever invented: the text of every answer comes from the knowledge base.
 */
import {
  ACTIONS, ActionKind, Bi, ChaixAction, FLOOR_AWARE, FLOOR_ENTRIES, GROUND_AWARE, KB, KbEntry, Lang, PINNED, SUIT_IDS, UNKNOWN, ans, pts,
} from '../../config/chaix.knowledge';
import { MARKETING_AREA } from '../../config/property.config';

export interface ChaixChip { id: string; label: string }
export interface ResolvedAction { kind: ActionKind; label: string; href?: string; text?: string }
export interface ChaixReply {
  text: string;
  /** Ids of the entries that answered ('unknown' when nothing matched). Used for analytics and the summary sent with a callback. */
  ids: string[];
  titles: string[];
  matched: boolean;
  actions: ResolvedAction[];
  chips: ChaixChip[];
  /** True when the visitor asked to be called: the chat opens its number form straight away. */
  callback: boolean;
  lang: Lang;
}

// ── 1. Cleaning ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Devanagari (and a few Hinglish) words → the words the knowledge base keys use. Single words only. */
const SYNONYMS: Record<string, string> = {
  'किराया': 'rent', 'किराये': 'rent', 'भाड़ा': 'rent', 'कीमत': 'price', 'क़ीमत': 'price', 'दाम': 'price', 'लागत': 'cost',
  'मंज़िल': 'floor', 'मंजिल': 'floor', 'मंज़िलें': 'floor', 'मंजिलें': 'floor', 'मंज़िलों': 'floor', 'तल': 'floor', 'फ्लोर': 'floor', 'फ़्लोर': 'floor',
  'पहली': 'first', 'दूसरी': 'second', 'तीसरी': 'third', 'पहला': 'first', 'दूसरा': 'second', 'तीसरा': 'third', 'ऊपरी': 'top', 'ग्राउंड': 'ground',
  'pehli': 'first', 'pehla': 'first', 'doosri': 'second', 'dusri': 'second', 'dusra': 'second', 'teesri': 'third', 'tisri': 'third', 'tisra': 'third',
  'पार्किंग': 'parking', 'लिफ्ट': 'lift', 'कहाँ': 'where', 'कहां': 'where', 'पता': 'address', 'लोकेशन': 'location', 'नक्शा': 'plan', 'नक़्शा': 'plan', 'प्लान': 'plan',
  'ब्रोशर': 'brochure', 'पीडीएफ': 'pdf', 'संपर्क': 'contact', 'सम्पर्क': 'contact', 'फोन': 'phone', 'फ़ोन': 'phone', 'नंबर': 'number', 'नम्बर': 'number', 'ईमेल': 'email', 'व्हाट्सएप': 'whatsapp',
  'विज़िट': 'visit', 'विजिट': 'visit', 'देखना': 'dekhna', 'देखने': 'dekhne', 'मिलना': 'milna', 'आना': 'aana',
  'दूरी': 'distance', 'दूर': 'distance', 'पास': 'nearby', 'आसपास': 'nearby', 'क्षेत्रफल': 'area', 'फ़ीट': 'feet', 'फीट': 'feet', 'सड़क': 'road', 'रोड': 'road', 'चौड़ी': 'wide',
  'अपोलो': 'apollo', 'अस्पताल': 'hospital', 'हॉस्पिटल': 'hospital', 'निफ्ट': 'nift', 'रिंग': 'ring', 'स्टेशन': 'station', 'एयरपोर्ट': 'airport', 'हवाई': 'airport',
  'क्लिनिक': 'clinic', 'डॉक्टर': 'doctor', 'पैथोलॉजी': 'pathology', 'लैब': 'lab', 'बैंक': 'bank', 'ऑफिस': 'office', 'ऑफ़िस': 'office', 'दफ्तर': 'office', 'कार्यालय': 'office',
  'दुकान': 'showroom', 'शोरूम': 'showroom', 'रेस्तरां': 'restaurant', 'रेस्टोरेंट': 'restaurant', 'कैफ़े': 'cafe', 'कैफे': 'cafe', 'कोचिंग': 'coaching', 'जिम': 'gym', 'व्यवसाय': 'business', 'व्यापार': 'business', 'कारोबार': 'business',
  'नमस्ते': 'namaste', 'नमस्कार': 'namaskar', 'धन्यवाद': 'thanks', 'शुक्रिया': 'thanks', 'उपलब्ध': 'available', 'खाली': 'vacant', 'निर्माण': 'construction', 'निर्माणाधीन': 'construction', 'तैयार': 'ready',
  'कब': 'when', 'कितना': 'kitna', 'कितनी': 'kitna', 'कितने': 'kitna', 'क्या': 'kya', 'कौन': 'who', 'फायर': 'fire', 'सुरक्षा': 'safety', 'पानी': 'water', 'बिजली': 'electricity', 'वॉशरूम': 'washroom', 'शौचालय': 'washroom',
  'लीज़': 'lease', 'लीज': 'lease', 'ब्रोकर': 'broker', 'हिंदी': 'hindi', 'हिन्दी': 'hindi', 'वास्तु': 'vastu', 'तस्वीर': 'photos', 'तस्वीरें': 'photos', 'वीडियो': 'video', 'स्वीकृति': 'approval', 'मंज़ूरी': 'approval', 'अनुमति': 'permission',
  'जानकारी': 'info', 'बताइए': 'tell', 'बताओ': 'tell', 'चाहिए': 'chahiye', 'चाहिये': 'chahiye',
  // verbs and small words that the key phrases spell in Latin letters
  'करो': 'karo', 'करें': 'karen', 'कीजिए': 'kijiye', 'कीजिये': 'kijiye', 'करना': 'karna', 'करनी': 'karni', 'दिखाओ': 'dikhao', 'दिखाइए': 'dikhao', 'दिखाइये': 'dikhao', 'दिखाएँ': 'dikhao',
  'भेजो': 'bhejo', 'भेजिए': 'bhejiye', 'भेजिये': 'bhejiye', 'भेजें': 'bhejiye', 'बात': 'baat', 'मुझे': 'mujhe', 'आपका': 'aapka', 'आपकी': 'aapki', 'आपके': 'aapke', 'हम': 'hum', 'मैं': 'main',
  'है': 'hai', 'हैं': 'hain', 'होगा': 'hoga', 'होगी': 'hogi', 'का': 'ka', 'की': 'ki', 'के': 'ke', 'को': 'ko', 'में': 'mein', 'से': 'se', 'पर': 'par', 'और': 'aur', 'या': 'ya', 'भी': 'bhi', 'कुछ': 'kuch',
  'यहाँ': 'yaha', 'यहां': 'yaha', 'वहाँ': 'waha', 'यह': 'yeh', 'ये': 'ye', 'वह': 'woh', 'सामने': 'samne', 'सकता': 'sakta', 'सकती': 'sakti', 'सकते': 'sakte', 'खुल': 'khul', 'खोलना': 'kholna', 'खोलने': 'kholna',
  'तक': 'tak', 'कैसे': 'kaise', 'क्यों': 'kyun',
  // the specification sheet: site, building, access and safety
  'सेटबैक': 'setback', 'सैटबैक': 'setback', 'प्लॉट': 'plot', 'ज़मीन': 'zameen', 'जमीन': 'zameen', 'कॉलम': 'column', 'कालम': 'column', 'खंभा': 'khambha', 'खम्भा': 'khambha', 'खंभे': 'khambhe', 'खम्भे': 'khambhe', 'पिलर': 'pillar',
  'काँच': 'glass', 'कांच': 'glass', 'ग्लास': 'glass', 'खिड़की': 'window', 'खिड़कियाँ': 'windows', 'खिड़कियां': 'windows', 'रोशनी': 'roshni', 'धूप': 'dhoop',
  'ऊँचाई': 'height', 'ऊंचाई': 'height', 'छत': 'ceiling', 'सीढ़ी': 'staircase', 'सीढ़ियाँ': 'staircase', 'सीढ़ियां': 'staircase', 'सीढी': 'staircase', 'चौड़ाई': 'width', 'गहराई': 'depth', 'लॉबी': 'lobby',
  'निकास': 'exit', 'एक्ज़िट': 'exit', 'एग्ज़िट': 'exit', 'एक्जिट': 'exit', 'कवर्ड': 'covered', 'खुला': 'khula', 'खुली': 'khula', 'खुले': 'khula', 'शेल': 'shell', 'ओपन': 'open', 'चारों': 'charo', 'तरफ़': 'taraf', 'तरफ': 'taraf', 'ओर': 'taraf',
  'स्पेसिफिकेशन': 'specification', 'स्पेसिफिकेशंस': 'specifications', 'स्पेक': 'spec', 'विनिर्देश': 'specification', 'विशेषताएँ': 'features', 'विशेषताएं': 'features', 'सुविधाएँ': 'facilities', 'सुविधाएं': 'facilities', 'सुविधा': 'facilities',
  'विवरण': 'details', 'बिल्डिंग': 'building', 'इमारत': 'building', 'दिशा': 'direction', 'कारपेट': 'carpet', 'ग्रॉस': 'gross', 'प्रोजेक्ट': 'project', 'साइट': 'site', 'फ्रंटेज': 'frontage', 'फ्रंट': 'front', 'नाम': 'naam', 'सेफ्टी': 'safety', 'एस्केप': 'escape',
  // footfall, suitability and the words a visitor uses to ask "is it good for my business"
  'फुटफॉल': 'footfall', 'फुटफाल': 'footfall', 'फूटफॉल': 'footfall', 'आवाजाही': 'footfall', 'भीड़': 'bheed', 'भीड़भाड़': 'bheed', 'ग्राहक': 'grahak', 'ग्राहकों': 'grahak',
  'संभावना': 'potential', 'उच्च': 'high', 'उपयुक्त': 'suitable', 'उपयुक्तता': 'suitable', 'सही': 'right', 'अच्छा': 'good', 'अच्छी': 'good', 'बेहतर': 'better', 'फायदा': 'benefit', 'फ़ायदा': 'benefit',
  'बड़ी': 'bada', 'बड़ा': 'bada', 'बड़े': 'bada', 'स्थिति': 'status', 'स्टेटस': 'status',
  // common spellings and slang
  'flor': 'floor', 'flr': 'floor', 'sq': 'sq', 'plz': 'please', 'pls': 'please', 'wht': 'what', 'whats': 'what', 'hw': 'how', 'abt': 'about', 'info.': 'info', 'cantt.': 'cantt',
};
const SYN = new Map(Object.entries(SYNONYMS).map(([k, v]) => [k.normalize('NFC'), v]));

/** Before the word "floor" only an ordinal names a floor ("second floor"); "three floors" is a count. After it, "floor two" names one. */
const ORDINAL: Record<string, number> = { first: 1, second: 2, third: 3, ground: 0 };
const LABEL: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, first: 1, second: 2, third: 3, ground: 0 };
const FLOOR_WORDS = new Set(['floor', 'manzil', 'level']);
const NAMES = ['ground', 'first', 'second', 'third'];

/** Plural / simple endings only, applied the same way to the visitor's words and to the knowledge-base keys. */
function stem(w: string): string {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && /(ches|shes|xes|sses)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
}

/** Cleans a message into stemmed words. Also used on the knowledge-base keys, so both sides always agree. */
export function tokenise(raw: string): string[] {
  let s = raw.normalize('NFC').toLowerCase();
  s = s.replace(/[।॥]/g, ' ');                                                      // Devanagari full stops
  s = s.replace(/(\d),(?=\d{2,3}\b)/g, '$1');                                                // 1,500 -> 1500
  s = s.replace(/₹/g, ' rupees ');
  s = s.replace(/\bsq\.?\s*(?:ft|feet|foot)\b\.?|\bsqft\b|\bsft\b|\bsquare\s*(?:feet|foot|ft)\b/g, ' sqft ');
  s = s.replace(/\bsq\.?\s*(?:m|mt|mtr|mtrs|metre|metres|meter|meters)\b\.?|\bsqm\b|\bsquare\s*(?:metre|metres|meter|meters)\b/g, ' sqm ');
  s = s.replace(/\b1st\b/g, ' first ').replace(/\b2nd\b/g, ' second ').replace(/\b3rd\b/g, ' third ');
  s = s.replace(/\bg\s*\+\s*3\b/g, ' ground plus three ').replace(/\bg\s*\+\s*4\b/g, ' ground plus four ');
  s = s.replace(/\bfloor\s*(?:no\.?|number|#)?\s*([0-3])\b/g, (_m, d: string) => ` ${NAMES[+d]} floor `);
  s = s.replace(/\blevel\s*([0-3])\b/g, (_m, d: string) => ` ${NAMES[+d]} floor `);
  s = s.replace(/\ba\s*\/\s*c\b/g, ' ac ');
  s = s.replace(/['’]/g, '').replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ');
  const out: string[] = [];
  for (const t of s.split(/\s+/)) {
    if (!t) continue;
    out.push(stem(SYN.get(t) ?? t));
  }
  return out;
}

/** Little words that do not carry a topic. Anything else that no key phrase explains is a sign the question is about something ChaiX does not know. */
const FILLER = new Set(tokenise(
  'a an the is are was were be been am do does did can could would will shall should may might must have has had having i me my mine we us our you your yours he she it its they them their this that these those there here ' +
  'of in on at to for from with by about as into onto over under between and or but if so than then too also just only very much many more most some any all ' +
  'what whats which who whom whose when where why how whether tell show give send share know see want need like please pls plz kindly hi hello hey ok okay thanks thank ' +
  'detail details info information regarding related thing things sir madam ' +
  'kya hai hain ho hoga hogi honge tha thi ka ki ke ko se me mein mai main par pe aur ya bhi to toh yeh ye woh wo is us isme usme kuch koi kaun kab kahan kaise kyun kitna kitni kitne ' +
  'mujhe mera meri mere hum humein aap aapka aapki aapke tum karo karna kare karen kijiye batao batana bataiye bataye dikhao dikhana dijiye do dena chahiye chahie chahta chahti yaha waha yahan wahan sakta sakti sakte skta skti khul khulega kar kholna'));

export function detectLang(raw: string): Lang { return /[ऀ-ॿ]/.test(raw) ? 'hi' : 'en'; }

// ── 2. The index of key phrases ────────────────────────────────────────────────────────────────────────────────────

interface Key { entry: KbEntry; toks: string[]; weak: boolean }
const BY_ID = new Map<string, KbEntry>();
const INDEX: Key[] = [];
for (const e of KB) {
  BY_ID.set(e.id, e);
  const seen = new Set<string>();
  for (const k of e.keys) {
    // a leading "~" marks a generic word ("floors", "how far", "available"): it only answers when nothing more specific is in the message
    const weak = k.startsWith('~');
    const toks = tokenise(weak ? k.slice(1) : k);
    const sig = (weak ? '~' : '') + toks.join(' ');
    if (!toks.length || seen.has(sig)) continue;
    seen.add(sig);
    INDEX.push({ entry: e, toks, weak });
  }
}
// Floor answers are reachable by id (chips) too
for (const f of Object.values(FLOOR_ENTRIES)) BY_ID.set(f.id, f);
const MAX_ENTRY_KEYS = INDEX.length;

/** Optimal-string-alignment distance (insert, delete, replace, swap) with an early exit at `max`. */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = [];
  for (let i = 0; i <= a.length; i++) { d[i] = [i]; }
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

const phraseScore = (n: number, weak: boolean) => (weak ? 0.6 + 0.4 * n : 1 + 2 * n);   // 1 word 3, 2 words 5, 3 words 7 …; a weak key is worth about 1
/** A strong answer needs this much from specific key phrases; a weak one (generic words only) is used when it explains the whole message. */
const THRESHOLD = 3;
const WEAK_MIN = 0.9;

/** `raw` is the sum of the phrase scores (what the thresholds look at); `score` is `raw` times the entry's weight (only used to order ties). */
interface Hit { entry: KbEntry; raw: number; score: number; exact: number }

/** Scores every entry against the words. Longer phrases claim their words first, so a shorter phrase inside them does not also count. */
function rank(toks: string[]): { hits: Hit[]; claimed: boolean[] } {
  interface Cand { entry: KbEntry; start: number; len: number; score: number; typo?: boolean }
  const cands: Cand[] = [];
  for (const key of INDEX) {
    const n = key.toks.length;
    if (n > toks.length) continue;
    for (let i = 0; i + n <= toks.length; i++) {
      let exact = true;
      for (let j = 0; j < n; j++) if (toks[i + j] !== key.toks[j]) { exact = false; break; }
      if (exact) { cands.push({ entry: key.entry, start: i, len: n, score: phraseScore(n, key.weak) }); continue; }
      // a typo in a longer single word still matches ("brochur", "availble", "parkng", "apolo")
      // (a generic word is forgiven a typo only when it is long: "specifcation" is a typo, "floer" is not worth guessing)
      if (n === 1 && (!key.weak || key.toks[0].length >= 9)) {
        const t = toks[i], k = key.toks[0];
        // five-letter words only forgive a missing or extra letter ("apolo"), never a changed one: "sakta" (can) is not "sasta" (cheap)
        const long = t.length >= 6 && k.length >= 6;
        const short = t.length === 5 && k.length >= 5 && t.length !== k.length;
        if ((long || short) && t[0] === k[0] && distance(t, k, k.length >= 9 ? 2 : 1) <= (k.length >= 9 ? 2 : 1)) {
          cands.push({ entry: key.entry, start: i, len: 1, score: phraseScore(1, key.weak), typo: true });
        }
      }
    }
  }
  cands.sort((a, b) => b.len - a.len || b.score - a.score);
  const claim = new Array<number>(toks.length).fill(0);
  const own = new Map<string, number[]>();
  const scores = new Map<KbEntry, number>();
  const exactScores = new Map<KbEntry, number>();
  for (const c of cands) {
    let blocked = false;
    for (let j = c.start; j < c.start + c.len; j++) if (claim[j] > c.len) { blocked = true; break; }
    if (blocked) continue;
    // the same entry never counts the same word twice
    const mine = own.get(c.entry.id) ?? new Array<number>(toks.length).fill(0);
    let dup = false;
    for (let j = c.start; j < c.start + c.len; j++) if (mine[j]) { dup = true; break; }
    if (dup) continue;
    for (let j = c.start; j < c.start + c.len; j++) { mine[j] = 1; claim[j] = Math.max(claim[j], c.len); }
    own.set(c.entry.id, mine);
    scores.set(c.entry, (scores.get(c.entry) ?? 0) + c.score);
    if (!c.typo) exactScores.set(c.entry, (exactScores.get(c.entry) ?? 0) + c.score);
  }
  const hits = [...scores.entries()]
    .map(([entry, raw]) => ({ entry, raw, score: raw * (entry.weight ?? 1), exact: exactScores.get(entry) ?? 0 }))
    // on a tie, the word that was typed exactly beats the word that only looks like a typo of another entry's key ("store" is not "storey")
    .sort((a, b) => b.score - a.score || b.exact - a.exact || (b.entry.weight ?? 1) - (a.entry.weight ?? 1) || KB.indexOf(a.entry) - KB.indexOf(b.entry));
  return { hits, claimed: claim.map((c) => c > 0) };
}

// ── 3. Floors and areas ────────────────────────────────────────────────────────────────────────────────────────────

type FloorRef = 0 | 1 | 2 | 3;
const MARK = '§';

/** "second", or a one-letter slip of it ("secnd", "frist", "grond") when it stands next to the word "floor". */
function ordinalOf(t: string | undefined): FloorRef | null {
  if (t === undefined) return null;
  if (t in ORDINAL) return ORDINAL[t] as FloorRef;
  if (t.length >= 5) for (const name of ['second', 'third', 'first', 'ground']) if (t[0] === name[0] && distance(t, name, 1) <= 1) return ORDINAL[name] as FloorRef;
  return null;
}

/** Finds "2nd floor", "floor two", "top floor", "ground floor" and blanks those words out so they do not count as a topic. */
function findFloor(toks: string[]): { ref: FloorRef | null; toks: string[] } {
  const out = toks.slice();
  let ref: FloorRef | null = null;
  for (let i = 0; i < out.length; i++) {
    if (!FLOOR_WORDS.has(out[i])) continue;
    const before = out[i - 1], after = out[i + 1];
    let n: FloorRef | null = null;
    let from = i, to = i;
    const ord = ordinalOf(before);
    if (ord !== null) { n = ord; from = i - 1; }
    else if (before === 'top' || before === 'last' || before === 'upper') { n = 3; from = i - 1; }
    else if (before === 'parking' && out[i] === 'level') { n = 0; from = i - 1; }
    else if (after !== undefined && after in LABEL && out[i] !== 'level') { n = LABEL[after] as FloorRef; to = i + 1; }
    if (n === null) continue;
    ref = n;
    for (let j = from; j <= to; j++) out[j] = MARK;
  }
  return { ref, toks: out };
}

const isNum = (t: string | undefined): t is string => !!t && /^\d+(\.\d+)?$/.test(t);
const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

/** A size need: "2000 sqft", "1000 to 1500 sq ft", "300 sqm", or "need 2000" with no unit. Returns square feet (the upper figure of a range). */
export function findAreaNeed(toks: string[]): { sqft: number; shown: string } | null {
  for (let i = 0; i < toks.length; i++) {
    if (toks[i] !== 'sqft' && toks[i] !== 'sqm') continue;
    if (!isNum(toks[i - 1])) continue;
    let hi = parseFloat(toks[i - 1]);
    let lo = hi;
    if (isNum(toks[i - 2])) lo = parseFloat(toks[i - 2]);                                                      // 1000-1500
    else if (['to', 'and', 'se'].includes(toks[i - 2]) && isNum(toks[i - 3])) lo = parseFloat(toks[i - 3]);    // 1000 to 1500
    const f = toks[i] === 'sqm' ? 10.7639 : 1;
    hi *= f; lo *= f;
    if (hi < 50 || hi > 100000) continue;
    const shown = lo !== hi ? `${fmt(Math.min(lo, hi))} to ${fmt(Math.max(lo, hi))}` : fmt(hi);
    return { sqft: Math.max(lo, hi), shown };
  }
  // no unit: a plain number next to "need / want / space / area / chahiye"
  const cue = toks.some((t) => ['need', 'want', 'require', 'required', 'requirement', 'looking', 'chahiye', 'chahie', 'space', 'area', 'chaiye'].includes(t));
  if (cue) {
    for (const t of toks) {
      if (!isNum(t)) continue;
      const n = parseFloat(t);
      if (n >= 200 && n <= 20000 && !(n >= 2020 && n <= 2035)) return { sqft: n, shown: fmt(n) };
    }
  }
  return null;
}

const GROSS = MARKETING_AREA.grossNum;
const CARPET = MARKETING_AREA.carpetNum;

function areaReply(need: { sqft: number; shown: string }, lang: Lang): { text: Bi; next: string[] } {
  const n = need.sqft;
  const sh = need.shown;
  const gross = `about ${fmt(GROSS)} sq ft`, carpet = `about ${fmt(CARPET)} sq ft`;
  if (n <= CARPET) {
    return {
      text: {
        en: ans(`A requirement of about ${sh} sq ft fits within one floor.`, pts(`Each of Floors 1, 2 and 3 is ${gross} gross (${carpet} carpet)`, 'You can lease part of a floor', 'The leasing team confirms which part-floor sizes are possible on the plan')),
        hi: ans(`लगभग ${sh} वर्ग फुट की ज़रूरत एक मंज़िल के भीतर आ जाती है।`, pts(`मंज़िल 1, 2 और 3 में से हर एक लगभग ${fmt(GROSS)} वर्ग फुट ग्रॉस (लगभग ${fmt(CARPET)} वर्ग फुट कारपेट) की है`, 'मंज़िल का हिस्सा भी लीज़ पर लिया जा सकता है', 'हिस्से के कौन से आकार संभव हैं, यह लीज़िंग टीम प्लान पर बताएगी')),
      },
      next: ['availability', 'lease-options', 'visit'],
    };
  }
  if (n <= GROSS) {
    return {
      text: {
        en: ans(`About ${sh} sq ft is close to one full floor (${gross} gross, ${carpet} carpet).`, pts('Whether it fits depends on whether your figure is carpet or gross', 'The leasing team can check it against the plan')),
        hi: ans(`लगभग ${sh} वर्ग फुट लगभग एक पूरी मंज़िल के बराबर है (लगभग ${fmt(GROSS)} वर्ग फुट ग्रॉस, लगभग ${fmt(CARPET)} वर्ग फुट कारपेट)।`, pts('यह बैठेगा या नहीं, यह इस पर निर्भर है कि आपका आँकड़ा कारपेट का है या ग्रॉस का', 'लीज़िंग टीम प्लान पर जाँच सकती है')),
      },
      next: ['availability', 'lease-options', 'visit'],
    };
  }
  if (n <= GROSS * 3) {
    return {
      text: {
        en: ans(`About ${sh} sq ft is more than one floor.`, pts(`Floors 1, 2 and 3 are identical at ${gross} gross each`, 'Floors can be leased together', 'The leasing team can plan the combination with you')),
        hi: ans(`लगभग ${sh} वर्ग फुट एक मंज़िल से ज़्यादा है।`, pts(`मंज़िल 1, 2 और 3 एक जैसी हैं, हर एक लगभग ${fmt(GROSS)} वर्ग फुट ग्रॉस`, 'मंज़िलें साथ में लीज़ पर ली जा सकती हैं', 'लीज़िंग टीम आपके साथ सही संयोजन तय कर सकती है')),
      },
      next: ['availability', 'lease-options', 'visit'],
    };
  }
  return {
    text: {
      en: ans(`About ${sh} sq ft is more than the three upper floors together (about ${fmt(GROSS * 3)} sq ft gross).`, 'The leasing team can talk through what is possible.'),
      hi: ans(`लगभग ${sh} वर्ग फुट तीनों ऊपरी मंज़िलों के कुल क्षेत्रफल (लगभग ${fmt(GROSS * 3)} वर्ग फुट ग्रॉस) से ज़्यादा है।`, 'क्या संभव है, यह लीज़िंग टीम आपके साथ बात करके बताएगी।'),
    },
    next: ['lease-options', 'visit'],
  };
}

// ── 4. Building a reply ────────────────────────────────────────────────────────────────────────────────────────────

const pick = (b: Bi, lang: Lang): string => (lang === 'hi' && b.hi ? b.hi : b.en);

function resolveActions(list: ChaixAction[] | undefined, lang: Lang): ResolvedAction[] {
  return (list ?? []).map((a) => ({ kind: a.kind, label: pick(a.label, lang), href: a.href, text: a.text }));
}

const CALLBACK_CHIP: Record<Lang, string> = { en: 'Send my question to the team', hi: 'मेरा सवाल टीम को भेजें' };

function chipsFor(ids: string[], lang: Lang, exclude: string[], addCallback: boolean): ChaixChip[] {
  const chips: ChaixChip[] = [];
  for (const id of ids) {
    if (exclude.includes(id) || chips.length >= 3) continue;
    const e = BY_ID.get(id);
    if (!e) continue;
    const label = e.chip ? pick(e.chip, lang) : lang === 'en' ? e.title : '';
    if (label) chips.push({ id, label });
  }
  if (addCallback && !exclude.includes('callback')) chips.push({ id: 'callback', label: CALLBACK_CHIP[lang] });
  return chips;
}

/** The questions pinned in the chat window ("Most asked"): the label is the question as a visitor would ask it. */
export function pinned(lang: Lang): ChaixChip[] {
  return PINNED.filter((p) => BY_ID.has(p.id)).map((p) => ({ id: p.id, label: pick(p.q, lang) }));
}

/** True for the entries that answer "how is it suitable for …"; `businessTitle` is the name of a specific business (not the general or "other use" answers). */
export const isBusiness = (id: string): boolean => SUIT_IDS.has(id);
export const businessTitle = (id: string): string => (SUIT_IDS.has(id) && id !== 'businesses' && id !== 'other-use' ? BY_ID.get(id)?.title ?? '' : '');

/** The answers that the business answers already contain (the location line names every landmark): a business question beats them on a tie. */
const LANDMARK_IDS = new Set(['location', 'nearby', 'footfall', 'apollo', 'nift', 'trade', 'ring']);
/** Words that say "is it right for …" (after SYNONYMS): with one of them, a business answer leads even when another topic ties with it ("good location for a bank"). */
const SUIT_CUES = new Set(['suitable', 'suit', 'suits', 'suited', 'suitability', 'good', 'right', 'work', 'works', 'ideal', 'best', 'perfect', 'viable', 'feasible', 'benefit', 'benefits', 'advantage', 'advantages', 'better', 'compatible', 'appropriate', 'why']);

const SOFT_IDS = new Set(['greeting', 'thanks', 'bye', 'ack']);
const WANTS_CALLBACK = new Set(['rent', 'sale', 'approvals', 'power', 'water', 'hvac', 'internet', 'loading', 'loadunload', 'security', 'visibility', 'two-wheeler', 'ownership', 'broker']);

function compose(entries: KbEntry[], lang: Lang, extra?: { text?: Bi; next?: string[]; actions?: ChaixAction[] }): ChaixReply {
  const lead = entries[0];
  const text = extra?.text ? pick(extra.text, lang) : entries.map((e) => pick(e.a, lang)).join('\n\n');
  const actionList: ChaixAction[] = [];
  for (const a of extra?.actions ?? entries.flatMap((e) => e.actions ?? [])) {
    if (!actionList.some((x) => x.kind === a.kind && x.href === a.href && x.label.en === a.label.en)) actionList.push(a);
  }
  const next = extra?.next ?? entries.flatMap((e) => e.next ?? []);
  const ids = entries.map((e) => e.id);
  const wantsCallback = !actionList.slice(0, 3).some((a) => a.kind === 'callback') && (entries.some((e) => WANTS_CALLBACK.has(e.id)) || !!extra?.actions);
  return {
    text,
    ids,
    titles: entries.map((e) => e.title),
    matched: true,
    actions: resolveActions(actionList.slice(0, 3), lang),
    chips: chipsFor(next, lang, ids, wantsCallback),
    callback: lead.id === 'callback',
    lang,
  };
}

/** The answer to a typed message. `pageLang` is the language of the page the visitor is on (Hindi on /hi). */
export function replyToText(raw: string, pageLang: Lang = 'en'): ChaixReply {
  const message = raw.trim().slice(0, 300);
  const lang: Lang = detectLang(message) === 'hi' ? 'hi' : pageLang;
  const all = tokenise(message);
  if (!all.length) return unknown(lang);

  const { ref, toks } = findFloor(all);
  const need = findAreaNeed(toks);
  const { hits, claimed } = rank(toks);
  const live = hits.filter((h) => !SOFT_IDS.has(h.entry.id));
  const strong = live.filter((h) => h.raw >= THRESHOLD);
  const weak = live.filter((h) => h.raw >= WEAK_MIN && h.raw < THRESHOLD);
  // words that matter and that no key phrase explains: "ceiling", "canteen", "cricket match". A generic word may only answer when none are left.
  const unclaimed = toks.filter((t, i) => !claimed[i] && t !== MARK && !FILLER.has(t) && !isNum(t));
  const lead = strong.length ? strong : unclaimed.length === 0 ? weak : [];

  // An area need ("I need 1500 sq ft") is answered against the real floor sizes, plus the business if one is named.
  if (need) {
    const a = areaReply(need, lang);
    return { ...compose([BY_ID.get('availability') as KbEntry], lang, { text: a.text, next: a.next, actions: [ACTIONS.visit, ACTIONS.callback] }), ids: ['area-fit'], titles: ['Area requirement'] };
  }

  // A floor is a qualifier: it decides the answer only when the question is about floors, or about nothing else.
  if (ref !== null) {
    const top = lead[0]?.entry;
    const aware = ref === 0 ? GROUND_AWARE : FLOOR_AWARE;
    if (top ? aware.has(top.id) : unclaimed.length === 0) {
      const e = ref === 0 ? FLOOR_ENTRIES.ground : ref === 1 ? FLOOR_ENTRIES.first : ref === 2 ? FLOOR_ENTRIES.second : FLOOR_ENTRIES.third;
      return compose([e], lang);
    }
  }

  if (lead.length) {
    // "Is it suitable for a bank?": the business answer leads, even when another topic ties with it ("a good location for a bank").
    let ordered = lead;
    const bizHits = lead.filter((h) => SUIT_IDS.has(h.entry.id) && h.raw >= THRESHOLD);
    const biz = bizHits.find((h) => h.entry.id !== 'businesses') ?? bizHits[0];          // a named business beats the general "which businesses" answer
    if (biz && lead[0] !== biz && (lead[0].entry.id === 'businesses' || LANDMARK_IDS.has(lead[0].entry.id) || toks.some((t) => SUIT_CUES.has(t)))) ordered = [biz, ...lead.filter((h) => h !== biz)];
    const top = ordered[0];
    const chosen = [top.entry];
    const second = ordered[1];
    // A business answer already carries the location and the building, so it never shares a bubble with another answer.
    if (second && second.score >= 0.75 * top.score && second.raw >= THRESHOLD && !SUIT_IDS.has(top.entry.id) && !SUIT_IDS.has(second.entry.id)) chosen.push(second.entry);
    // A second business in the same question ("a bank or a restaurant") is offered as the first follow-up instead of a second long answer.
    const other = ordered.find((h) => !chosen.includes(h.entry) && SUIT_IDS.has(h.entry.id) && h.raw >= THRESHOLD);
    return compose(chosen, lang, other ? { next: [other.entry.id, ...chosen.flatMap((e) => e.next ?? [])] } : undefined);
  }

  // Short pleasantries only count when nothing else matched
  const soft = hits.find((h) => SOFT_IDS.has(h.entry.id) && h.raw >= THRESHOLD);
  if (soft && toks.length <= 6) return compose([soft.entry], lang);

  return unknown(lang);
}

function unknown(lang: Lang): ChaixReply {
  return {
    text: pick(UNKNOWN, lang),
    ids: ['unknown'], titles: ['Not covered'], matched: false,
    actions: resolveActions([ACTIONS.callback], lang),
    chips: pinned(lang).slice(0, 4),
    callback: false,
    lang,
  };
}

/** The size the visitor said they need ("I need 1500 sq ft" gives "1,500 sq ft"), read from what they typed; '' when they gave none. */
export function areaNeedIn(messages: string[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const need = findAreaNeed(findFloor(tokenise(messages[i].trim().slice(0, 300))).toks);
    if (need) return `${need.shown} sq ft`;
  }
  return '';
}

/** For tests and for teaching ChaiX: how a message is read (the words, which entries they point to, and the words nothing explains). */
export function explain(raw: string): { tokens: string[]; floor: number | null; hits: { id: string; raw: number }[]; unclaimed: string[] } {
  const { ref, toks } = findFloor(tokenise(raw.trim().slice(0, 300)));
  const { hits, claimed } = rank(toks);
  return {
    tokens: toks, floor: ref,
    hits: hits.map((h) => ({ id: h.entry.id, raw: Math.round(h.raw * 10) / 10 })),
    unclaimed: toks.filter((t, i) => !claimed[i] && t !== MARK && !FILLER.has(t) && !isNum(t)),
  };
}

/** The answer for a chip (an entry id). */
export function replyToId(id: string, lang: Lang): ChaixReply {
  const e = BY_ID.get(id);
  if (!e) return unknown(lang);
  return compose([e], lang);
}

export function greeting(lang: Lang): ChaixReply {
  const e = BY_ID.get('greeting') as KbEntry;
  return { ...compose([e], lang), chips: [] };
}

/** For tests and the build gate: how many key phrases the index holds. */
export const KEY_COUNT = MAX_ENTRY_KEYS;
export const ENTRY_IDS = KB.map((e) => e.id);
