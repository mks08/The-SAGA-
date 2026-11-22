/**
 * ChaiX, the SHRINEVA leasing assistant: everything it knows.
 *
 * ChaiX answers ONLY from this file, and this file is built from the same configs as the website (property, content, location,
 * FAQ, Hindi page), so what ChaiX says cannot drift from what the pages and the brochure say. There is no AI model behind the
 * default answers: each question is matched to one of the entries below (core/chaix/chaix-engine.ts). What is not confirmed is
 * never guessed: it is answered with "not confirmed yet" and an offer to pass the question to the leasing team.
 *
 * Answers are point-wise: a short line that answers, then one fact per "•" point (helpers ans / pts / lab below). The chat window draws
 * points as a list and a line that is only **bold** as a section label. The build rejects a long answer without points.
 *
 * Rules (the build checks them, scripts/build-seo.js and scripts/test-chaix.js):
 *  - Facts only, from the configs. No rent, price, deposit or charge is ever quoted: those are discussed with the leasing team.
 *  - The Apollo Hospital is always "upcoming / under construction". The completion month is always a target, "subject to approvals".
 *  - No "handover", no "column-free", no studio / serviced-stay wording, nothing about night or golden-hour views.
 *  - Items still to be confirmed (ASK_ITEMS in content.config.ts) are answered as "not confirmed yet", never as features.
 *
 * To teach ChaiX something new: add an entry (or add words to `keys`), add a line to scripts/test-chaix.js, run `npm run build`.
 * `keys` are lower-case English words or phrases; Hindi and Hinglish words are mapped onto them by SYNONYMS in the engine.
 */
import { MARKETING_AREA, PLAN, PROPERTY, mapLinks } from './property.config';
import { ASK_ITEMS, LEVEL_INFO, PROJECT_STATUS, SPEC_GROUPS } from './content.config';
import { NEARBY_DISTANCES } from './location.config';
import { BROCHURE } from './media.config';
import { HI_DISTANCES } from './hindi.config';

export type Lang = 'en' | 'hi';
/** English text with an optional Hindi version (the Hindi page's wording, reviewed by a Hindi reader before heavy use). */
export interface Bi { en: string; hi?: string }

export type ActionKind = 'visit' | 'brochure' | 'callback' | 'route' | 'url' | 'tel' | 'whatsapp';
export interface ChaixAction { kind: ActionKind; label: Bi; href?: string; text?: string }

export interface KbEntry {
  id: string;
  /** Short English name: used in the summary sent with a callback request and for analytics. Never shown as an answer. */
  title: string;
  /** Lower-case words or phrases that point to this entry. Multi-word phrases score higher than single words. */
  keys: string[];
  /** 1 by default. Below 1 for entries that should only win when nothing else matches (greetings). */
  weight?: number;
  a: Bi;
  actions?: ChaixAction[];
  /** Entry ids offered as follow-up chips after this answer. */
  next?: string[];
  /** Label when this entry is offered as a chip. Defaults to `title`. */
  chip?: Bi;
}

const GROSS = MARKETING_AREA.gross;
const CARPET = MARKETING_AREA.carpet;
const P1 = PROPERTY.contact.phoneDisplay;
const EMAIL = PROPERTY.contact.publicEmail;
const TARGET = `${PROJECT_STATUS.completion.value}, ${PROJECT_STATUS.completion.note.toLowerCase()}`;   // "March 2027, subject to approvals"
const APPROVALS = 'Use of any floor is subject to floor suitability and the statutory approvals for your business.';
const APPROVALS_HI = 'किसी भी मंज़िल का उपयोग मंज़िल की उपयुक्तता और आपके व्यवसाय की वैधानिक अनुमतियों के अधीन है।';
/** The "VDA approved" claim is made only while the owner's switch is on (property.config.ts approvals.vda.show), exactly as on the pages. */
const VDA_ON = !!PROPERTY.approvals?.vda?.show;
const SETBACKS = `front ${PLAN.setbacks[0].value}, rear ${PLAN.setbacks[1].value}, east ${PLAN.setbacks[2].value} and west ${PLAN.setbacks[3].value}`;

/**
 * The specification sheet (config/content.config.ts SPEC_GROUPS: the home page sheet and the brochure's specification page) is the
 * source for every figure ChaiX quotes about the building. These helpers read the sheet itself, so a changed value reaches
 * ChaiX without anyone retyping it, and a renamed row stops the build instead of leaving a stale answer.
 */
const specRow = (label: string): string => {
  const row = SPEC_GROUPS.flatMap((g) => g.items).find((i) => i.label === label);
  if (!row) throw new Error(`ChaiX: the specification sheet has no "${label}" row (config/content.config.ts SPEC_GROUPS)`);
  return row.value;
};
const specList = (group: string, heading: string): string => {
  const g = SPEC_GROUPS.find((x) => x.title === group);
  if (!g) throw new Error(`ChaiX: the specification sheet has no "${group}" group (config/content.config.ts SPEC_GROUPS)`);
  return `${heading}\n${g.items.map((i) => `• ${i.label}: ${i.value}`).join('\n')}`;
};
const floorToFloor = /Ground about (\S+) · Floors about (\S+)/.exec(specRow('Floor to floor'));
if (!floorToFloor) throw new Error('ChaiX: the "Floor to floor" row of the specification sheet no longer reads "Ground about … · Floors about …"');
const lc = (t: string): string => t.charAt(0).toLowerCase() + t.slice(1);
const FTF_GROUND = floorToFloor[1];                                                        // 9′-6″
const FTF_UPPER = floorToFloor[2];                                                         // 11′-6″
const STAIR_W = PLAN.stilt.staircase.split(' · ')[0].replace(' flights', '');              // 5′-3″
const GLASS_W = PLAN.typical.frontage.split(' ')[0];                                       // 40′-6″
const PLOT_SHEET = `${PLAN.plot.frontageSheet} × ${PLAN.plot.depth}`;                      // 49′-5½″ × 115′-6½″ (the floor plans page schedule)

const anchor = (start: string) => PROPERTY.locationAnchors.find((a) => a.name.startsWith(start));
const km = (start: string) => anchor(start)?.distanceDisplay ?? '';
const hiKm = (s: string) => s.replace(' km', ' किमी').replace(' m', ' मीटर');
const bullets = (rows: { name: string; value: string }[]) => rows.map((r) => `• ${r.name}: ${r.value}`).join('\n');
/**
 * Answers are point-wise: one short line that answers, then one fact per point. `ans` joins lines, `pts` makes the "•" lines and
 * `lab` a section label (a line that is only **bold**). The chat window draws "•" lines as a list and labels as small headings
 * (components/chaix/chaix.format.ts); the build rejects a long answer without points (scripts/test-chaix.js).
 */
export const ans = (...lines: string[]): string => lines.filter(Boolean).join('\n');
export const pts = (...items: string[]): string => items.filter(Boolean).map((i) => `• ${i}`).join('\n');
export const lab = (t: string): string => `**${t}**`;
/** The distance sheet writes "≈ 330 m"; sentences say "about 330 m". */
const approx = (t: string): string => t.replace(/^≈\s*/, '');
const D_NIFT = approx(km('NIFT'));                // 100 m
const D_TRADE = approx(km('Varanasi Trade'));     // 330 m
const D_RING = approx(km('Varanasi Ring'));       // 1 km
const CARS = /(\d+\+?)\s*cars/.exec(specRow('Parking'))?.[1];   // 12+
if (!D_NIFT || !D_TRADE || !D_RING || !CARS) throw new Error('ChaiX: a landmark distance or the parking count could not be read from the configs');

const maps = mapLinks();
const A = {
  visit: { kind: 'visit', label: { en: 'Schedule a visit', hi: 'साइट विज़िट बुक करें' } } as ChaixAction,
  brochure: { kind: 'brochure', label: { en: 'Get the brochure', hi: 'ब्रोशर डाउनलोड करें' } } as ChaixAction,
  callback: { kind: 'callback', label: { en: 'Send my question to the team', hi: 'मेरा सवाल टीम को भेजें' } } as ChaixAction,
  plans: { kind: 'route', label: { en: 'Floor plans', hi: 'फ़्लोर प्लान' }, href: '/floor-plans' } as ChaixAction,
  walk: { kind: 'route', label: { en: 'Open the 3D walkthrough', hi: '3D वॉकथ्रू देखें' }, href: '/walkthrough' } as ChaixAction,
  explore: { kind: 'route', label: { en: '3D explorer', hi: '3D एक्सप्लोरर' }, href: '/#explorer' } as ChaixAction,
  location: { kind: 'route', label: { en: 'See the location page', hi: 'लोकेशन पेज देखें' }, href: '/location-contact' } as ChaixAction,
  map: { kind: 'url', label: { en: 'Open in Google Maps', hi: 'Google Maps में खोलें' }, href: maps.open } as ChaixAction,
  directions: { kind: 'url', label: { en: 'Get directions', hi: 'रास्ता देखें' }, href: maps.directions } as ChaixAction,
  call: { kind: 'tel', label: { en: `Call ${P1}`, hi: `कॉल करें ${P1}` }, href: PROPERTY.contact.phoneE164 } as ChaixAction,
  whatsapp: { kind: 'whatsapp', label: { en: 'WhatsApp the team', hi: 'WhatsApp करें' } } as ChaixAction,
  specs: { kind: 'route', label: { en: 'See the specification sheet', hi: 'स्पेसिफिकेशन शीट देखें' }, href: '/#specs' } as ChaixAction,
  progress: { kind: 'route', label: { en: 'See the site photographs', hi: 'साइट की तस्वीरें देखें' }, href: '/#status' } as ChaixAction,
  privacy: { kind: 'route', label: { en: 'Privacy policy', hi: 'प्राइवेसी पॉलिसी' }, href: '/privacy-disclaimer' } as ChaixAction,
};

export const ACTIONS = A;

/** "Not confirmed yet" answer for the items in ASK_ITEMS (content.config.ts). Never states a figure or a feature. */
const unconfirmed = (en: string, hi: string): Bi => ({
  en: ans(`${en} is not confirmed yet.`, pts(`I can't give you figures or promise anything`, 'It is on the list being confirmed with the architect', 'Tell me what you need and I can pass it to the leasing team')),
  hi: ans(`${hi} की जानकारी अभी तय नहीं हुई है।`, pts('कोई आँकड़ा या वादा नहीं दे सकते', 'यह आर्किटेक्ट के साथ तय की जा रही सूची में है', 'आपकी ज़रूरत बताइए, उसे लीज़िंग टीम तक पहुँचा दिया जाएगा')),
});

const ordinal = (n: 1 | 2 | 3) => (['First', 'Second', 'Third'] as const)[n - 1];
const floorAnswer = (n: 1 | 2 | 3): Bi => ({
  en: ans(`The ${ordinal(n).toLowerCase()} floor is available to lease.`, pts(
    `Area: ${GROSS} gross (${CARPET} carpet), in one open floor plate`,
    'Glass front on the road',
    `Floors 1, 2 and 3 are identical, each served by the ${PLAN.lift.adjective} lift, with a fire exit on every level`,
    'Lease it whole, in part, or together with another floor')),
  hi: ans(`${['पहली', 'दूसरी', 'तीसरी'][n - 1]} मंज़िल लीज़ के लिए उपलब्ध है।`, pts(
    `क्षेत्रफल: लगभग ${MARKETING_AREA.grossNum.toLocaleString('en-IN')} वर्ग फुट ग्रॉस (लगभग ${MARKETING_AREA.carpetNum.toLocaleString('en-IN')} वर्ग फुट कारपेट), एक खुली फ़्लोर प्लेट`,
    'सड़क की ओर काँच का फ्रंट',
    'मंज़िल 1, 2 और 3 एक जैसी हैं; हर एक पर 10 यात्रियों की लिफ्ट चलती है और हर स्तर पर फायर एक्ज़िट है',
    'पूरी मंज़िल, उसका हिस्सा, या एक से ज़्यादा मंज़िलें ले सकते हैं')),
});
/** The answer for a floor named in the question (the engine picks it when the floor is the whole point of the question). */
export const FLOOR_ENTRIES: Record<'ground' | 'first' | 'second' | 'third', KbEntry> = {
  ground: {
    id: 'ground', title: 'Ground level', keys: [], chip: { en: 'Ground level', hi: 'ग्राउंड लेवल' },
    a: {
      en: ans('The ground level is the parking level.', pts(
        'Open to the road, about 3,000 sq ft',
        `Parking for ${CARS} cars`,
        'The west and east walkways lead to the lift and stair lobby',
        'Fire exit on every level'), 'The commercial floors are 1, 2 and 3.'),
      hi: ans('ग्राउंड लेवल पार्किंग का स्तर है।', pts(
        'सड़क की ओर खुला, लगभग 3,000 वर्ग फुट',
        `${CARS} कारों की पार्किंग`,
        'पश्चिम और पूर्व की पैदल राहें लिफ्ट और सीढ़ी की लॉबी तक जाती हैं',
        'हर स्तर पर फायर एक्ज़िट'), 'कमर्शियल मंज़िलें 1, 2 और 3 हैं।'),
    },
    actions: [A.plans, A.visit], next: ['availability', 'parking', 'areas'],
  },
  first: { id: 'floor-1', title: 'First floor', keys: [], a: floorAnswer(1), actions: [A.plans, A.visit], next: ['lease-options', 'condition', 'rent'], chip: { en: 'First floor', hi: 'पहली मंज़िल' } },
  second: { id: 'floor-2', title: 'Second floor', keys: [], a: floorAnswer(2), actions: [A.plans, A.visit], next: ['lease-options', 'condition', 'rent'], chip: { en: 'Second floor', hi: 'दूसरी मंज़िल' } },
  third: { id: 'floor-3', title: 'Third floor', keys: [], a: floorAnswer(3), actions: [A.plans, A.visit], next: ['lease-options', 'condition', 'rent'], chip: { en: 'Third floor', hi: 'तीसरी मंज़िल' } },
};

/** Entries that show the floor named in the question instead of themselves (the question is about a floor). */
export const FLOOR_AWARE = new Set(['areas', 'availability', 'floors', 'lease-options', 'suitable-floor', 'overview']);
/** With the ground level named, these also show the ground-level answer (the ground level is the parking level, not a leasable floor). */
export const GROUND_AWARE = new Set([...FLOOR_AWARE, 'businesses', 'healthcare', 'banks', 'office', 'retail', 'food', 'coaching', 'wellness', 'other-use', 'visibility']);

/**
 * The business answers. "How is it suitable for a bank / a restaurant / a clinic?" gets almost the same answer whatever the business, so it
 * is written once, point-wise under five labels, and each business adds the points of its own (`fit`):
 *   Location             high footfall potential, with the landmarks (the upcoming Apollo Hospital opposite, NIFT, the Trade Centre, the
 *                        Ring Road) and the frontage on the 24 m road.
 *   Floor                floor-to-floor height, the open floor plate, the glass front.
 *   Parking and access   parking, lift, fire exit.
 *   For <the business>   the business's own points.
 *   Next step            go through the floor plans or the 3D explorer (columns are marked), then reach the team (send the question on,
 *                        call, email).
 * "Footfall potential" describes the location. It is never a count or a promise: the Apollo Hospital is upcoming and under construction, and
 * no visitor figure is published anywhere (scripts/test-chaix.js checks every answer for both).
 */
const SUIT_COMMON: Record<'loc' | 'floor' | 'parking' | 'close', { en: string; hi: string }> = {
  loc: {
    en: ans(lab('Location'), pts(
      'High footfall potential: directly opposite the upcoming Apollo Hospital (under construction)',
      `About ${D_NIFT} from NIFT Varanasi, ${D_TRADE} from the Varanasi Trade Centre and about ${D_RING} by road from the Ring Road`,
      `${specRow('Frontage')} of frontage on a ${PLAN.plot.roadWidthM} m wide road`)),
    hi: ans(lab('लोकेशन'), pts(
      'उच्च फुटफॉल संभावना: निर्माणाधीन Apollo Hospital के ठीक सामने',
      `NIFT वाराणसी से लगभग ${hiKm(D_NIFT)}, वाराणसी ट्रेड सेंटर से ${hiKm(D_TRADE)} और रिंग रोड से सड़क मार्ग से लगभग ${hiKm(D_RING)} दूर`,
      `${PLAN.plot.roadWidthM} मीटर चौड़ी सड़क पर लगभग ${PLAN.plot.frontageFt} फ़ीट फ्रंटेज`)),
  },
  floor: {
    en: ans(lab('Floor'), pts(
      `About ${FTF_UPPER} floor-to-floor (about ${FTF_GROUND} at ground level)`,
      `One open floor plate of ${GROSS} gross per floor`,
      'Glass front on the road')),
    hi: ans(lab('मंज़िल'), pts(
      `मंज़िल से मंज़िल की ऊँचाई लगभग ${FTF_UPPER} (ग्राउंड लेवल पर लगभग ${FTF_GROUND})`,
      'हर मंज़िल लगभग 3,500 वर्ग फुट ग्रॉस की एक खुली फ़्लोर प्लेट',
      'सड़क की ओर काँच का फ्रंट')),
  },
  parking: {
    en: ans(lab('Parking and access'), pts(
      `Covered parking for ${CARS} cars at ground level`,
      `${PLAN.lift.adjective} lift to every level`,
      'Fire exit on every level')),
    hi: ans(lab('पार्किंग और पहुँच'), pts(
      `ग्राउंड लेवल पर ${CARS} कारों की कवर्ड पार्किंग`,
      '10 यात्रियों की लिफ्ट, हर स्तर तक',
      'हर स्तर पर फायर एक्ज़िट')),
  },
  close: {
    en: ans(lab('Next step'), pts(
      'Go through the floor plans or the 3D explorer (the columns are marked on them) to decide and plan your layout',
      'Use of any floor is subject to floor suitability and approvals',
      `For more clarity, send your question to the team, call ${P1} or email ${EMAIL}`)),
    hi: ans(lab('अगला कदम'), pts(
      'अपना लेआउट तय और प्लान करने के लिए फ़्लोर प्लान या 3D एक्सप्लोरर देखिए (उनमें कॉलम दर्शाए गए हैं)',
      'किसी भी मंज़िल का उपयोग मंज़िल की उपयुक्तता और अनुमतियों के अधीन है',
      `ज़्यादा स्पष्टता के लिए अपना सवाल टीम को भेजिए, ${P1} पर कॉल कीजिए या ${EMAIL} पर ईमेल कीजिए`)),
  },
};
/** The points of one business: `head` is the label ("For a bank …"), `points` one fact each. */
interface SuitFit { head: Bi; points: { en: string[]; hi: string[] } }
/**
 * fit: the business's own section (null for the general answer); head: a label before everything else; intro: the lines under it;
 * location: false for uses where footfall is beside the point.
 */
const suit = (fit: SuitFit | null, opts: { head?: { en: string; hi: string }; intro?: { en: string; hi: string }; location?: boolean } = {}): Bi => {
  const c = SUIT_COMMON;
  const build = (lang: Lang): string => ans(
    opts.head ? lab(opts.head[lang]) : '',
    opts.intro ? opts.intro[lang] : '',
    fit ? (lang === 'en' ? `Here is what matters ${lc(fit.head.en)}:` : `${fit.head.hi ?? fit.head.en} ज़रूरी बातें:`) : '',
    opts.location === false ? '' : c.loc[lang],
    c.floor[lang],
    c.parking[lang],
    fit ? ans(lab(fit.head[lang] ?? fit.head.en), pts(...fit.points[lang])) : '',
    c.close[lang],
  );
  return { en: build('en'), hi: build('hi') };
};
/** The entries that answer "how is it suitable for …": they stand alone (they already carry the location and the building), see core/chaix/chaix-engine.ts. */
export const SUIT_IDS = new Set(['businesses', 'healthcare', 'banks', 'office', 'retail', 'food', 'coaching', 'wellness', 'other-use']);

export const KB: KbEntry[] = [
  // ── Small talk ──────────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'greeting', title: 'Greeting', weight: 0.5,
    keys: ['hi', 'hii', 'hiii', 'hello', 'hey', 'hlo', 'namaste', 'namaskar', 'pranam', 'good morning', 'good afternoon', 'good evening', 'ram ram', 'jai shree ram'],
    a: {
      en: ans(`Hello, I'm ChaiX, the SHRINEVA leasing assistant.`, 'Tap a most-asked question below, or type your own: floors and areas, location, parking and lift, plans, or the business you have in mind.'),
      hi: ans('नमस्ते! मैं ChaiX हूँ, SHRINEVA की लीज़िंग असिस्टेंट।', 'नीचे दिए सबसे ज़्यादा पूछे जाने वाले सवालों में से कोई चुनिए, या अपना सवाल खुद लिखिए: मंज़िलें और क्षेत्रफल, लोकेशन, पार्किंग और लिफ्ट, प्लान, या आपका व्यवसाय।'),
    },
    next: ['availability', 'areas', 'location', 'brochure'],
  },
  {
    id: 'thanks', title: 'Thanks', weight: 0.5,
    keys: ['thanks', 'thank', 'thankyou', 'thx', 'dhanyavad', 'shukriya', 'great', 'perfect', 'awesome', 'nice', 'helpful'],
    a: { en: `You're welcome. Is there anything else you would like to know?`, hi: 'आपका स्वागत है। कुछ और जानना हो तो पूछिए।' },
    next: ['visit', 'brochure', 'callback'],
  },
  {
    id: 'bye', title: 'Goodbye', weight: 0.5,
    keys: ['bye', 'goodbye', 'see you', 'later', 'alvida'],
    a: { en: `Thank you for your interest in SHRINEVA. You can come back any time, or call ${P1} to speak to the leasing team.`, hi: `SHRINEVA में रुचि के लिए धन्यवाद। आप कभी भी लौट सकते हैं, या लीज़िंग टीम से बात करने के लिए ${P1} पर कॉल करें।` },
    actions: [A.call],
  },
  {
    id: 'ack', title: 'Acknowledged', weight: 0.4,
    keys: ['ok', 'okay', 'oky', 'fine', 'yes', 'yeah', 'yep', 'no', 'nope', 'haan', 'han', 'nahi', 'theek', 'thik', 'acha', 'accha', 'hmm', 'k'],
    a: { en: `Okay. What would you like to know: floors and areas, location, parking and lift, the plans, or the brochure?`, hi: 'ठीक है। आप क्या जानना चाहेंगे: मंज़िलें और क्षेत्रफल, लोकेशन, पार्किंग और लिफ्ट, प्लान, या ब्रोशर?' },
    next: ['areas', 'location', 'floorplans', 'brochure'],
  },
  {
    id: 'who', title: 'About ChaiX',
    keys: ['who are you', 'what are you', 'your name', 'chaix', 'chai x', 'are you a bot', 'are you human', 'are you real', 'are you ai', 'robot', 'bot', 'kaun ho', 'aap kaun'],
    a: {
      en: ans(`I'm ChaiX, SHRINEVA's leasing assistant.`, pts('Ask me about floors, areas, location, parking, plans or your kind of business', 'When something is not confirmed, I say so instead of guessing', 'I can pass your question to the leasing team')),
      hi: ans('मैं ChaiX हूँ, SHRINEVA की लीज़िंग असिस्टेंट।', pts('मंज़िल, क्षेत्रफल, लोकेशन, पार्किंग, प्लान या आपके व्यवसाय के बारे में यहाँ पूछ सकते हैं', 'जो बात तय नहीं है, उसका अंदाज़ा नहीं लगाया जाता', 'आपका सवाल लीज़िंग टीम तक पहुँचाया जा सकता है')),
    },
    next: ['overview', 'callback'],
  },
  {
    id: 'help', title: 'What ChaiX can answer',
    keys: ['help', 'menu', 'what can you do', 'what can i ask', 'how does this work', 'madad', 'sahayata'],
    a: {
      en: ans('I can help with:', pts('Floors, areas and which floors are available', 'The location and what is nearby', 'Parking, the lift and fire exits', 'Project status, the floor plans and the brochure', 'Which businesses can lease here'), 'I can also arrange a site visit or a call from the leasing team.'),
      hi: ans('इन बातों में मदद मिल सकती है:', pts('मंज़िलें, क्षेत्रफल और कौन सी मंज़िलें उपलब्ध हैं', 'लोकेशन और आसपास क्या है', 'पार्किंग, लिफ्ट और फायर एक्ज़िट', 'प्रोजेक्ट की स्थिति, फ़्लोर प्लान और ब्रोशर', 'यहाँ कौन से व्यवसाय आ सकते हैं'), 'साइट विज़िट या लीज़िंग टीम से कॉल भी तय करवाया जा सकता है।'),
    },
    next: ['availability', 'location', 'floorplans', 'visit'],
  },

  // ── The building ────────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'overview', title: 'About SHRINEVA', weight: 0.9, chip: { en: 'About SHRINEVA', hi: 'SHRINEVA के बारे में' },
    keys: ['overview', 'about shrineva', 'what is shrineva', 'tell me about shrineva', 'tell me about the building', 'tell me about this property', 'about the project', 'about the building', 'about this', 'tell me more', 'more details', 'full details', 'complete details', 'project details', 'property details', 'summary', 'info', 'information', 'jankari', 'project kya hai', 'what is this property', 'what is this building', 'what is this place', 'what is this project', 'what is this', 'about this property', 'about this place', 'tell me about this', 'tell me about this building', 'tell me about this project', 'property overview', 'project overview', 'brief', 'introduction', 'project name', 'name of the project', 'name of the building', 'building name', 'property name', 'name of the property', 'project ka naam', 'building ka naam'],
    a: {
      en: ans('SHRINEVA is a commercial building in Bada Lalpur, Varanasi.', pts(
        'Ground (parking) plus three floors, on a 24 m wide north-facing road',
        `Directly opposite the upcoming Apollo Hospital (under construction), about ${D_NIFT} from NIFT Varanasi`,
        `Floors 1, 2 and 3: open floors of ${GROSS} gross each`,
        `A ${PLAN.lift.adjective} lift and parking for ${CARS} cars`,
        `Under construction: project completion is targeted for ${TARGET}`)),
      hi: ans('SHRINEVA बड़ा लालपुर, वाराणसी में एक कमर्शियल बिल्डिंग है।', pts(
        'ग्राउंड (पार्किंग) और तीन मंज़िलें, 24 मीटर चौड़ी उत्तरमुखी सड़क पर',
        `निर्माणाधीन Apollo Hospital के ठीक सामने, NIFT वाराणसी से लगभग ${hiKm(D_NIFT)} दूर`,
        'मंज़िल 1, 2 और 3: हर एक लगभग 3,500 वर्ग फुट ग्रॉस की खुली मंज़िल',
        `10 यात्रियों की लिफ्ट और ${CARS} कारों की पार्किंग`,
        'निर्माणाधीन: प्रोजेक्ट पूरा होने का लक्ष्य मार्च 2027, अनुमतियों के अधीन')),
    },
    actions: [A.plans, A.brochure], next: ['availability', 'areas', 'status'],
  },
  {
    id: 'areas', title: 'Areas', chip: { en: 'Floors and area', hi: 'मंज़िलें और क्षेत्रफल' },
    keys: ['area', 'size', 'sqft', 'sqm', 'square', 'carpet', 'built up', 'builtup', 'super built', 'gross', 'how big', 'how large', 'how much space', 'floor area', 'floor plate', 'floorplate', 'dimensions', 'dimension', 'measurement', 'kshetrafal', 'kitna bada', 'kitni jagah', 'square feet', 'how much carpet', 'how much area', 'how much gross', 'how much built up', 'how much sqft'],
    a: {
      en: ans('Each of Floors 1, 2 and 3 is one open floor plate.', pts(
        `Gross: ${GROSS} per floor`,
        `Carpet: ${CARPET} per floor`,
        'Ground level (the parking level): about 3,000 sq ft',
        `Plot: about ${PLAN.plot.areaSqM} sq m (about 5,650 sq ft)`), 'Areas are approximate and subject to final measurement.'),
      hi: ans('मंज़िल 1, 2 और 3 में से हर एक खुली फ़्लोर प्लेट है।', pts(
        'ग्रॉस: लगभग 3,500 वर्ग फुट प्रति मंज़िल',
        'कारपेट: लगभग 3,100 वर्ग फुट प्रति मंज़िल',
        'ग्राउंड लेवल (पार्किंग): लगभग 3,000 वर्ग फुट',
        `प्लॉट: लगभग ${PLAN.plot.areaSqM} वर्ग मीटर (लगभग 5,650 वर्ग फुट)`), 'क्षेत्रफल अनुमानित है और अंतिम माप के अधीन है।'),
    },
    actions: [A.plans, A.visit], next: ['availability', 'lease-options', 'floorplans'],
  },
  {
    id: 'floors', title: 'Floors', chip: { en: 'The floors', hi: 'मंज़िलें' },
    keys: ['~floors', 'how many floors', 'number of floors', 'storey', 'storeys', 'story', 'stories', 'configuration', 'ground plus three', 'g+3', 'parking plus three', '~levels', '~manzil', '~manzilen', 'kitni manzil', '~tal', 'about the floors', 'floor details', 'floors details', 'floor info', 'floors info', 'floor wise', 'floorwise', 'floor count', 'how many levels', 'how many storeys'],
    a: {
      en: ans('SHRINEVA has a ground (parking) level and three commercial floors.', pts(
        `Floors 1, 2 and 3 share the same open plan: ${GROSS} gross each`,
        'Glass front on the road',
        `${PLAN.lift.adjective} lift, with a fire exit on every level`,
        `Floor to floor: about ${FTF_UPPER} on the upper floors, about ${FTF_GROUND} at the ground level`)),
      hi: ans('SHRINEVA में एक ग्राउंड (पार्किंग) लेवल और तीन कमर्शियल मंज़िलें हैं।', pts(
        'मंज़िल 1, 2 और 3 का प्लान एक जैसा खुला है: हर एक लगभग 3,500 वर्ग फुट ग्रॉस',
        'सड़क की ओर काँच का फ्रंट',
        '10 यात्रियों की लिफ्ट, और हर स्तर पर फायर एक्ज़िट',
        `मंज़िल से मंज़िल की ऊँचाई: ऊपरी मंज़िलों पर लगभग ${FTF_UPPER}, ग्राउंड लेवल पर लगभग ${FTF_GROUND}`)),
    },
    actions: [A.plans], next: ['availability', 'areas', 'floorplans'],
  },
  {
    id: 'availability', title: 'Availability', chip: { en: 'What is available', hi: 'क्या उपलब्ध है' },
    keys: ['~available', 'availability', 'vacant', 'vacancy', '~free', 'which floor', 'which floors', 'any floor', 'floors available', 'space available', 'is it available', 'open for', 'upalabdh', 'khali', 'mil sakta', 'mil jayega', 'milega', 'milegi', 'which floors are available', 'floors are available', 'what is available', 'what is vacant', 'is anything available', 'anything available', 'any space available', 'any vacancy', 'is it vacant'],
    a: {
      en: ans('Floors 1, 2 and 3 are available to lease.', pts('A whole floor, part of a floor, or more than one floor', 'The ground level is the parking level', 'The leasing team confirms part-floor sizes on the plan')),
      hi: ans('मंज़िल 1, 2 और 3 लीज़ के लिए उपलब्ध हैं।', pts('पूरी मंज़िल, मंज़िल का हिस्सा, या एक से ज़्यादा मंज़िलें', 'ग्राउंड लेवल पार्किंग का है', 'हिस्से का आकार लीज़िंग टीम प्लान पर बताएगी')),
    },
    actions: [A.plans, A.visit], next: ['areas', 'lease-options', 'rent'],
  },
  {
    id: 'lease-options', title: 'Ways to lease', chip: { en: 'Ways to lease', hi: 'लीज़ के विकल्प' },
    keys: ['lease', 'leasing', 'on lease', 'on rent', 'rent a floor', 'lease a floor', 'rent space', 'lease space', 'rent a space', 'lease a space', 'rent an office', 'whole floor', 'full floor', 'part of a floor', 'part floor', 'half floor', 'partial', 'subdivide', 'subdivision', 'divide', 'split', 'small space', 'multiple floors', 'more than one floor', 'two floors', 'three floors', 'long term', 'longterm', 'lease term', 'lease period', 'tenure', 'duration', 'how does leasing work', 'process', 'steps', 'kiraye par', 'lease par', 'hissa', 'poori manzil', 'half a floor', 'half of a floor', 'half of the floor', 'half', 'a part of the floor', 'part of the floor', 'part of floor', 'portion of a floor', 'portion of the floor', 'a portion', 'one floor', 'single floor', 'floor division', 'be divided', 'divided', 'small area', 'smaller space', 'smaller area', 'take a floor', 'take the floor', 'take two floors', 'lease two floors'],
    a: {
      en: ans('You can lease in the way that suits you.', pts(
        'A whole floor, part of a floor, or more than one floor',
        'Long-term leases are accepted',
        'The floors are open shells: you fit them out to your own layout',
        'Fit-out and floor condition are agreed with each occupier',
        'The leasing team confirms part-floor sizes and the terms with you directly')),
      hi: ans('आप अपनी ज़रूरत के अनुसार लीज़ ले सकते हैं।', pts(
        'पूरी मंज़िल, मंज़िल का हिस्सा, या एक से ज़्यादा मंज़िलें',
        'लंबी अवधि की लीज़ स्वीकार की जाती है',
        'मंज़िलें ओपन शेल में दी जाती हैं: इंटीरियर आप अपने लेआउट के अनुसार करवाते हैं',
        'फिट-आउट और मंज़िल की स्थिति हर किरायेदार के साथ तय होती है',
        'हिस्से का आकार और शर्तें लीज़िंग टीम सीधे आपसे तय करती है')),
    },
    actions: [A.visit, A.callback], next: ['condition', 'areas', 'rent'],
  },
  {
    id: 'condition', title: 'Floor condition and fit-out', chip: { en: 'Fit-out', hi: 'फिट-आउट' },
    keys: ['fit out', 'fitout', 'fit-out', 'bare shell', 'open shell', 'shell', 'condition', 'furnished', 'furnishing', 'interior', 'interiors', 'finish', 'finishing', 'flooring', 'ready to move', 'ready to use', 'changes to my floor', 'customise', 'customize', 'modify', 'partition', 'layout change', 'layout changes', 'change the layout', 'own layout', 'interior work', 'interior design', 'interior designing', 'with interiors', 'come with interiors', 'floor condition', 'what condition', 'condition of the floor', 'condition of floors'],
    a: {
      en: ans('The floors are offered as open shells, so the fit-out is yours.', pts(
        'You plan the layout, finishes and branding',
        'Fit-out and floor condition are agreed with each occupier',
        'For changes to your floor, tell the leasing team early; they are agreed during leasing and the works continue to suit',
        `Floor to floor is about ${FTF_UPPER} on the upper floors`)),
      hi: ans('मंज़िलें ओपन शेल में दी जाती हैं, इसलिए फिट-आउट आपका है।', pts(
        'इंटीरियर, फिनिश और ब्रांडिंग आप अपने हिसाब से करवाते हैं',
        'फिट-आउट और मंज़िल की स्थिति हर किरायेदार के साथ तय होती है',
        'अपनी मंज़िल में बदलाव चाहें तो लीज़िंग टीम को जल्दी बताइए; बदलाव लीज़ के दौरान तय होते हैं और काम उसी के अनुसार जारी रहता है',
        `ऊपरी मंज़िलों पर मंज़िल से मंज़िल की ऊँचाई लगभग ${FTF_UPPER} है`)),
    },
    actions: [A.callback], next: ['lease-options', 'status', 'power'],
  },
  {
    id: 'floorplate', title: 'Open plan and columns', chip: { en: 'Open plan and columns', hi: 'खुला प्लान और कॉलम' },
    keys: ['open plan', 'open floor plan', 'open layout', 'flexible layout', 'flexible layouts', 'flexible tenant layouts', 'tenant layout', 'tenant layouts', 'layout flexibility', 'column', 'columns', 'pillar', 'pillars', 'column free', 'pillar free', 'free of columns', 'columns on the floor', 'columns in the floor', 'pillars on the floor', 'pillars inside', 'obstruction', 'obstructions', 'khambha', 'khambhe', 'khamba', 'khula plan', 'khula layout', 'khuli manzil', 'khula floor', 'plan my own layout', 'plan my own partitions', 'own partitions', 'my own partitions'],
    a: {
      en: ans('Each of Floors 1, 2 and 3 is one open plan with flexible tenant layouts.', pts(
        'You decide the rooms, partitions and counters',
        `The structure has columns, which are shown on the architect's plans`,
        'Check the plan for their positions before you fix a layout')),
      hi: ans('मंज़िल 1, 2 और 3 में से हर एक खुले प्लान की है, जिसमें किरायेदार अपने हिसाब से लेआउट बना सकता है।', pts(
        'कमरे, पार्टीशन और काउंटर आप तय करते हैं',
        'इमारत के स्ट्रक्चर में कॉलम हैं, जो आर्किटेक्ट के प्लान पर दिखाए गए हैं',
        'लेआउट तय करने से पहले प्लान में उनकी जगह देख लीजिए')),
    },
    actions: [A.plans, A.explore], next: ['condition', 'areas', 'floorplans'],
  },
  {
    id: 'glass-front', title: 'Glass front and daylight', chip: { en: 'Glass front', hi: 'काँच का फ्रंट' },
    keys: ['glass front', 'glass facade', 'glass façade', 'glass frontage', 'glass line', 'glass elevation', 'glass wall', 'glass windows', 'glazing', 'glazed', 'shop front', 'natural light', 'daylight', 'day light', 'sunlight', 'sun light', 'windows', 'window', 'kaanch', 'kanch', 'khidki', 'khidkiyan', 'roshni', 'dhoop', '~glass', 'glass ka front', 'kaanch ka front', 'kanch ka front', 'glass front kitna', 'front glass', 'front facade', 'front façade', 'all glass', 'full glass', 'fully glass', 'complete glass', 'how much light', 'how much natural light', 'how much daylight', 'how much sunlight', 'enough light'],
    a: {
      en: ans('Floors 1, 2 and 3 have a glass front facing the road.', pts(
        `About ${GLASS_W} wide`,
        `Windows on the east and west sides and a solid rear wall, as per the architect's plan`,
        'The ground level is open to the road')),
      hi: ans('मंज़िल 1, 2 और 3 में सड़क की ओर काँच का फ्रंट है।', pts(
        `लगभग ${GLASS_W} चौड़ा`,
        'आर्किटेक्ट के प्लान के अनुसार पूर्व और पश्चिम की ओर खिड़कियाँ तथा पीछे ठोस दीवार',
        'ग्राउंड लेवल सड़क की ओर खुला है')),
    },
    actions: [A.explore, A.plans], next: ['visibility', 'road', 'floorplate'],
  },
  {
    id: 'height', title: 'Heights',
    keys: ['ceiling height', 'clear height', 'floor to floor', 'floor to floor height', 'floor height', 'height of the floor', 'height of floors', 'ceiling', 'false ceiling', 'height', 'how tall', 'how high', 'building height', 'height of the building', 'oonchai', 'unchai', 'ooncha', 'storey height'],
    a: {
      en: ans('Floor to floor height:', pts(
        `Upper floors: about ${FTF_UPPER} (about 11.5 ft)`,
        `Ground (parking) level: about ${FTF_GROUND} (about 9.5 ft)`),
        `The clear ceiling height after finishes is not confirmed yet, so I can't give a figure; it is agreed with each occupier. The leasing team can tell you more.`),
      hi: ans('मंज़िल से मंज़िल की ऊँचाई:', pts(
        `ऊपरी मंज़िलें: लगभग ${FTF_UPPER} (लगभग 11.5 फ़ीट)`,
        `ग्राउंड (पार्किंग) लेवल: लगभग ${FTF_GROUND} (लगभग 9.5 फ़ीट)`),
        'फिनिश के बाद की साफ़ छत की ऊँचाई अभी तय नहीं है, इसलिए आँकड़ा नहीं दे सकते; वह हर किरायेदार के साथ तय होती है। और जानकारी लीज़िंग टीम देगी।'),
    },
    actions: [A.callback, A.plans], next: ['condition', 'floors', 'floorplans'],
  },
  {
    id: 'suitable-floor', title: 'Which floor to choose',
    keys: ['which floor is best', 'best floor', 'which floor should', 'which floor is better', 'which floor to choose', 'higher floor', 'lower floor', 'difference between floors', 'floors different', 'are floors same', 'all floors same', 'same floors', 'identical', 'kaun si manzil'],
    a: {
      en: ans('Floors 1, 2 and 3 are identical, so the choice is yours.', pts(`Same plan: ${GROSS} gross each`, 'Same glass front, lift and fire exit', 'The leasing team can walk you through the floors during a visit')),
      hi: ans('मंज़िल 1, 2 और 3 एक जैसी हैं, इसलिए चुनाव आपका है।', pts('एक जैसा प्लान: हर एक लगभग 3,500 वर्ग फुट ग्रॉस', 'काँच का फ्रंट, लिफ्ट और फायर एक्ज़िट भी वही', 'लीज़िंग टीम विज़िट में आपको मंज़िलें दिखा सकती है')),
    },
    actions: [A.visit, A.plans], next: ['availability', 'floorplans'],
  },
  {
    id: 'parking', title: 'Parking', chip: { en: 'Parking and lift', hi: 'पार्किंग और लिफ्ट' },
    keys: ['parking', 'park', 'car', 'cars', 'four wheeler', 'vehicle', 'vehicles', 'garage', 'visitor parking', 'staff parking', 'customer parking', 'basement', 'stilt', 'gaadi', 'gadi', 'car parking', 'how much parking', 'how much car parking'],
    a: {
      en: ans(`Parking is covered, at ground level, for ${CARS} cars.`, 'Exact arrangements for each tenant are confirmed during the site visit and leasing discussion.'),
      hi: ans('पार्किंग ग्राउंड लेवल पर कवर्ड है, 12+ कारों के लिए।', 'हर किरायेदार के लिए सही व्यवस्था साइट विज़िट और लीज़ चर्चा में तय होती है।'),
    },
    actions: [A.plans], next: ['lift', 'ground', 'visit'],
  },
  {
    id: 'two-wheeler', title: 'Two-wheeler parking',
    keys: ['bike', 'bikes', 'scooter', 'two wheeler', 'two wheelers', '2 wheeler', 'motorcycle', 'motorbike', 'cycle parking', 'bike parking', 'scooter parking', 'scooty', 'scooty parking', 'motorbike parking', 'motorcycle parking', 'two wheelers parking'],
    a: {
      en: ans(`I don't have a confirmed two-wheeler count.`, `Parking for ${CARS} cars is at ground level; the leasing team can confirm two-wheeler arrangements for you.`),
      hi: ans('दोपहिया पार्किंग की कोई पुष्ट संख्या मेरे पास नहीं है।', `ग्राउंड लेवल पर ${CARS} कारों की पार्किंग है; दोपहिया की व्यवस्था लीज़िंग टीम बता सकती है।`),
    },
    actions: [A.callback], next: ['parking'],
  },
  {
    id: 'lift', title: 'Lift and stairs',
    keys: ['lift', 'elevator', 'stairs', 'staircase', 'stair', 'steps', 'escalator', 'passenger lift', 'wheelchair', 'accessible', 'disabled', 'senior citizen', 'old age', 'capacity of lift', 'lift capacity', 'lift size'],
    a: {
      en: ans(`One ${PLAN.lift.adjective} lift serves every level, from the ground level to Floor 3.`, pts(
        `Staircase: ${STAIR_W} wide flights`,
        'The lift and stair core is on the east side, reached by the west and east walkways',
        `The lift's door width and cabin size are not confirmed yet`)),
      hi: ans('एक 10 यात्रियों की लिफ्ट ग्राउंड लेवल से मंज़िल 3 तक हर स्तर पर चलती है।', pts(
        `सीढ़ी: ${STAIR_W} चौड़ी फ़्लाइट`,
        'लिफ्ट और सीढ़ी का कोर पूर्व की ओर है, जहाँ पश्चिम और पूर्व की पैदल राहों से पहुँचा जाता है',
        'लिफ्ट के दरवाज़े की चौड़ाई और केबिन का आकार अभी तय नहीं है')),
    },
    next: ['parking', 'fire', 'floors'],
  },
  {
    id: 'fire', title: 'Fire exits and safety', chip: { en: 'Fire safety', hi: 'फायर सेफ्टी' },
    keys: ['fire', 'fire exit', 'fire safety', 'fire escape', 'emergency', 'safety', 'fire fighting', 'firefighting', 'sprinkler', 'fire noc', 'noc', 'smoke detector', 'evacuation', 'aag', 'suraksha', 'safety features', 'safety feature', 'fire safety features'],
    a: {
      en: ans('Every level has a dedicated fire exit, marked on the plans.', pts(
        `Open setbacks on all four sides: ${SETBACKS}`,
        `Fire-fighting systems and clearances are still being confirmed, so I can't state them yet`)),
      hi: ans('हर स्तर पर एक अलग फायर एक्ज़िट है, जो प्लान पर दर्शाया गया है।', pts(
        `बिल्डिंग के चारों ओर खुला सेटबैक: आगे ${PLAN.setbacks[0].value}, पीछे ${PLAN.setbacks[1].value}, पूर्व ${PLAN.setbacks[2].value} और पश्चिम ${PLAN.setbacks[3].value}`,
        'फायर-फाइटिंग सिस्टम और क्लीयरेंस की जानकारी अभी तय की जा रही है, इसलिए अभी नहीं बता सकते')),
    },
    actions: [A.callback], next: ['lift', 'parking', 'floorplans'],
  },
  {
    id: 'ground', title: 'Ground level', chip: { en: 'Ground level', hi: 'ग्राउंड लेवल' },
    keys: ['ground level', 'ground floor', 'parking level', 'parking floor', 'gf'],
    a: FLOOR_ENTRIES.ground.a, actions: [A.plans, A.visit], next: ['availability', 'parking', 'areas'],
  },
  {
    id: 'vastu', title: 'Vastu',
    keys: ['vastu', 'vaastu', 'vastu compliant', '~direction', '~facing', 'north facing', 'east facing', 'orientation', 'vaastu shastra', 'which direction', 'what direction', 'direction does it face', 'direction of the building', 'direction of the road', 'facing direction', 'south facing', 'west facing', 'which side facing', 'vastu direction', 'direction of vastu', 'vastu facing', 'vastu north', 'vastu compliant direction'],
    a: {
      en: `The building is Vastu compliant, and the road side faces north.`,
      hi: 'बिल्डिंग वास्तु अनुकूल है, और सड़क वाला हिस्सा उत्तर की ओर है।',
    },
    next: ['road', 'floors'],
  },
  {
    id: 'road', title: 'Road and frontage',
    keys: ['road', 'frontage', 'width of road', 'road width', 'wide road', 'main road', 'access road', 'sadak', 'chauda', 'chaudai', 'road facing', 'road side', 'facing the road', 'on the road', 'main road facing', 'how much frontage', 'how much road frontage', 'frontage size', 'frontage width', 'width of frontage', 'width of the frontage', 'frontage kitna', 'frontage kitni', 'front width'],
    a: {
      en: ans(`SHRINEVA is on a ${PLAN.plot.roadWidthM} m (about 80 ft) wide road, facing north.`, pts(
        `Frontage: about ${PLAN.plot.frontageFt} ft`,
        'The upper floors have a glass front facing the road',
        'The layout is Vastu compliant')),
      hi: ans(`SHRINEVA ${PLAN.plot.roadWidthM} मीटर (लगभग 80 फ़ीट) चौड़ी उत्तरमुखी सड़क पर है।`, pts(
        `फ्रंटेज: लगभग ${PLAN.plot.frontageFt} फ़ीट`,
        'ऊपरी मंज़िलों में सड़क की ओर काँच का फ्रंट है',
        'लेआउट वास्तु अनुकूल है')),
    },
    next: ['location', 'visibility', 'parking'],
  },
  {
    id: 'plot', title: 'Plot', chip: { en: 'Plot size', hi: 'प्लॉट का आकार' },
    keys: ['plot area', 'plot size', 'plot dimensions', 'plot dimension', 'plot measurement', 'plot measurements', 'size of the plot', 'size of plot', 'area of the plot', 'area of plot', 'land area', 'land size', 'plot depth', 'depth of the plot', 'plot width', 'width of the plot', 'plot length', 'how big is the plot', 'how large is the plot', 'plot sq m', 'plot sq ft', 'plot sqft', 'plot kitna', 'zameen', 'jameen', '~plot', 'plot ka area', 'plot ka size', 'plot ka kshetrafal', 'plot kitna bada', 'how deep', 'how deep is the plot', 'depth', 'length of the plot', 'size of the land', 'area of the land', 'size of land', 'area of land', 'land measurement', 'how big is the land', 'how large is the land', 'how much land', 'how much plot'],
    a: {
      en: ans(`The plot is about ${PLAN.plot.areaSqM} sq m (about 5,650 sq ft).`, pts(
        `On the architect's sheet: ${PLAN.plot.frontageSheet} along the road by ${PLAN.plot.depth} deep`,
        `It faces north, which gives about ${PLAN.plot.frontageFt} ft of frontage on the ${PLAN.plot.roadWidthM} m wide road`), 'Areas are approximate and subject to final measurement.'),
      hi: ans(`प्लॉट लगभग ${PLAN.plot.areaSqM} वर्ग मीटर (लगभग 5,650 वर्ग फुट) का है।`, pts(
        `आर्किटेक्ट की शीट के अनुसार: सड़क की ओर ${PLAN.plot.frontageSheet} और गहराई में ${PLAN.plot.depth}`,
        `प्लॉट उत्तरमुखी है, जिससे ${PLAN.plot.roadWidthM} मीटर चौड़ी सड़क पर लगभग ${PLAN.plot.frontageFt} फ़ीट फ्रंटेज मिलता है`), 'क्षेत्रफल अनुमानित है और अंतिम माप के अधीन है।'),
    },
    actions: [A.plans], next: ['road', 'areas', 'setbacks'],
  },
  {
    id: 'setbacks', title: 'Setbacks and open sides', chip: { en: 'Setbacks', hi: 'सेटबैक' },
    keys: ['setback', 'setbacks', 'set back', 'set backs', 'front setback', 'rear setback', 'side setback', 'side setbacks', 'open sides', 'open side', 'open on all sides', 'open on all four sides', 'all four sides', 'four sides', 'open space around', 'space around the building', 'building line', 'charo taraf khula', 'chaaron taraf khula', 'setback kitna', 'space between buildings', 'gap between buildings', 'distance between buildings', 'how much space between', 'space on the sides', 'space left on the sides', 'side space', 'space on all sides', 'neighbouring building', 'neighbouring buildings', 'adjacent building', 'adjoining building', 'how much space is left', 'space is left on the sides'],
    a: {
      en: ans(`The building has open setbacks on all four sides, as per the architect's plan:`, pts(
        `Front (north, on the road): ${PLAN.setbacks[0].value}`,
        `Rear (south): ${PLAN.setbacks[1].value}`,
        `East: ${PLAN.setbacks[2].value}`,
        `West: ${PLAN.setbacks[3].value}`)),
      hi: ans('बिल्डिंग के चारों ओर खुला सेटबैक है, आर्किटेक्ट के प्लान के अनुसार:', pts(
        `आगे (उत्तर, सड़क की ओर): ${PLAN.setbacks[0].value}`,
        `पीछे (दक्षिण): ${PLAN.setbacks[1].value}`,
        `पूर्व: ${PLAN.setbacks[2].value}`,
        `पश्चिम: ${PLAN.setbacks[3].value}`)),
    },
    actions: [A.plans], next: ['fire', 'plot', 'floors'],
  },
  {
    id: 'visibility', title: 'Signage and brand visibility',
    keys: ['signage', 'sign board', 'signboard', 'name board', 'nameboard', 'hoarding', 'branding', 'brand visibility', 'facade branding', 'logo', 'glow sign', 'advertising', 'advertisement', 'banner', 'road visibility', 'visible from the road', 'visible from road', 'visibility from the road', 'visibility', '~visible'],
    a: {
      en: ans(`Brand visibility on a ${PLAN.plot.roadWidthM} m wide road is part of the plan.`, pts(
        'A glass front on each upper floor',
        `Signage permissions, sizes and positions are not confirmed yet, so I can't state them`,
        'The leasing team will tell you what is possible for your floor')),
      hi: ans(`${PLAN.plot.roadWidthM} मीटर चौड़ी सड़क पर ब्रांड की दृश्यता योजना का हिस्सा है।`, pts(
        'हर ऊपरी मंज़िल पर काँच का फ्रंट',
        'साइनेज की अनुमतियाँ, आकार और जगह अभी तय नहीं हैं, इसलिए अभी नहीं बता सकते',
        'आपकी मंज़िल के लिए क्या संभव है, यह लीज़िंग टीम बताएगी')),
    },
    actions: [A.callback], next: ['road', 'floors'],
  },

  // ── Location ───────────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'location', title: 'Location and address', chip: { en: 'Location', hi: 'लोकेशन' },
    keys: ['location', '~where', 'address', 'located', 'situated', 'map', 'google map', 'directions', 'direction to', 'how to reach', 'how to get', 'route', 'reach', 'locality', 'area of varanasi', 'which area', 'landmark', 'pin', 'pincode', 'pin code', 'kahan', 'kahaan', 'pata', 'jagah', 'kidhar', 'raasta', 'rasta', 'get directions', 'navigate', 'navigation', 'how do i get there', 'how to come', 'where exactly', 'exact location', 'send location', 'share location', 'location pin', 'map link', 'google maps', 'google maps location', 'maps', 'where is it', 'where is this', 'where is the property', 'where is the building', 'where is shrineva', 'where is the project', 'where is the site', 'where is this building', 'where is this property', 'where is the plot', 'where is your property', 'where is your building', 'where it is', 'where is the location', 'where is located'],
    a: {
      en: ans(`SHRINEVA is at ${PROPERTY.address.line1}, Varanasi ${PROPERTY.address.pin}.`, pts(
        `Faces a ${PLAN.plot.roadWidthM} m wide road`,
        'Directly opposite the upcoming Apollo Hospital (under construction, not yet operational)',
        `About ${D_NIFT} from the NIFT Varanasi campus`,
        `The Ring Road is about ${D_RING} away by road`)),
      hi: ans('SHRINEVA प्लॉट नं. D-15, लालपुर हाउसिंग स्कीम, बड़ा लालपुर, वाराणसी 221003 में है।', pts(
        `${PLAN.plot.roadWidthM} मीटर चौड़ी सड़क पर`,
        'निर्माणाधीन (अभी चालू नहीं) Apollo Hospital के ठीक सामने',
        `NIFT वाराणसी कैंपस से लगभग ${hiKm(D_NIFT)} दूर`,
        `रिंग रोड सड़क मार्ग से लगभग ${hiKm(D_RING)} दूर`)),
    },
    actions: [A.map, A.directions, A.location], next: ['nearby', 'apollo', 'visit'],
  },
  {
    id: 'nearby', title: 'Nearby places', chip: { en: 'What is nearby', hi: 'आसपास क्या है' },
    keys: ['nearby', '~near by', '~near', '~around', 'surrounding', 'surroundings', 'neighbourhood', 'neighborhood', '~close to', '~distance', '~distances', '~how far', '~how close', 'landmarks', 'what is near', 'what is around', 'area around', 'aaspaas', 'aas paas', '~paas', '~dur', '~doori', '~kitni dur'],
    a: {
      en: `Approximate distances from SHRINEVA:\n${bullets(NEARBY_DISTANCES.map((d) => ({ name: d.name, value: d.value })))}\nFor other places, the leasing team can tell you the route.`,
      hi: `SHRINEVA से लगभग दूरी:\n${bullets(HI_DISTANCES)}\nदूसरी जगहों का रास्ता लीज़िंग टीम बता सकती है।`,
    },
    actions: [A.map, A.location], next: ['apollo', 'airport', 'railway'],
  },
  {
    id: 'footfall', title: 'Footfall potential', chip: { en: 'Footfall potential', hi: 'फुटफॉल की संभावना' },
    keys: ['footfall', 'foot fall', 'footfalls', 'footfall potential', 'high footfall', 'footfall here', 'customer footfall', 'customer traffic', 'walk in customers', 'walkin customers', 'walk ins', 'will i get customers', 'get customers', 'enough customers', 'customers', 'busy area', 'busy location', 'crowded area', 'crowd', 'passersby', 'passers by', 'how busy', 'is it busy', 'public movement', 'bheed', 'grahak', 'aavajahi'],
    a: {
      en: ans('The location has high footfall potential.', pts(
        'Directly opposite the upcoming Apollo Hospital (under construction, not yet operational)',
        `About ${D_NIFT} from NIFT Varanasi and ${D_TRADE} from the Varanasi Trade Centre`,
        `About ${D_RING} by road from the Ring Road`,
        `${specRow('Frontage')} of frontage on a ${PLAN.plot.roadWidthM} m wide road`),
        'That is potential, not a promise: no footfall figures are published for this building or road. A site visit is the best way to judge it.'),
      hi: ans('लोकेशन में उच्च फुटफॉल संभावना है।', pts(
        'निर्माणाधीन (अभी चालू नहीं) Apollo Hospital के ठीक सामने',
        `NIFT वाराणसी से लगभग ${hiKm(D_NIFT)} और वाराणसी ट्रेड सेंटर से ${hiKm(D_TRADE)} दूर`,
        `रिंग रोड से सड़क मार्ग से लगभग ${hiKm(D_RING)} दूर`,
        `${PLAN.plot.roadWidthM} मीटर चौड़ी सड़क पर लगभग ${PLAN.plot.frontageFt} फ़ीट फ्रंटेज`),
        'यह संभावना है, वादा नहीं: इस बिल्डिंग या सड़क के लिए फुटफॉल का कोई आँकड़ा प्रकाशित नहीं है। परखने का सबसे अच्छा तरीका साइट विज़िट है।'),
    },
    actions: [A.visit, A.callback, A.location], next: ['nearby', 'apollo', 'businesses'],
  },
  {
    id: 'apollo', title: 'Apollo Hospital', chip: { en: 'Apollo Hospital', hi: 'Apollo Hospital' },
    keys: ['apollo', 'apollo hospital', 'apollo medics', '~hospital', '~hospitals', 'opposite', 'across', 'opd', 'samne', 'saamne', 'ke samne', 'in front of', 'opposite hospital'],
    a: {
      en: ans('The Apollo Hospital opposite SHRINEVA is upcoming and under construction, so it is not yet operational.', pts(
        `NIFT Varanasi: about ${D_NIFT} away`,
        `Varanasi Trade Centre: about ${D_TRADE} away`,
        `Ring Road: about ${D_RING} by road`),
        'Together they are part of why the location has high footfall potential. That is potential, not a promise: no footfall figures are published.'),
      hi: ans('सामने का Apollo Hospital निर्माणाधीन है और अभी चालू नहीं है।', pts(
        `NIFT वाराणसी: लगभग ${hiKm(D_NIFT)} दूर`,
        `वाराणसी ट्रेड सेंटर: लगभग ${hiKm(D_TRADE)} दूर`,
        `रिंग रोड: सड़क मार्ग से लगभग ${hiKm(D_RING)} दूर`),
        'ये सब लोकेशन की उच्च फुटफॉल संभावना का हिस्सा हैं। यह संभावना है, वादा नहीं; फुटफॉल का कोई आँकड़ा प्रकाशित नहीं किया जाता।'),
    },
    next: ['footfall', 'nearby', 'status'],
  },
  {
    id: 'nift', title: 'NIFT',
    keys: ['nift', 'fashion institute', '~students', '~college', '~campus', '~university', 'design institute', 'nift varanasi', 'nift students', 'nift campus', 'fashion students', 'design students'],
    a: {
      en: ans(`The NIFT Varanasi campus is about ${D_NIFT} from SHRINEVA.`, pts(
        `Varanasi Trade Centre (Deendayal Hastkala Sankul): about ${D_TRADE} along the road`,
        `Ring Road: about ${D_RING} away by road`,
        'The upcoming Apollo Hospital is opposite (under construction)'),
        'Together they give the location high footfall potential; no footfall figures are published.'),
      hi: ans(`NIFT वाराणसी कैंपस SHRINEVA से लगभग ${hiKm(D_NIFT)} दूर है।`, pts(
        `वाराणसी ट्रेड सेंटर (दीनदयाल हस्तकला संकुल): सड़क पर लगभग ${hiKm(D_TRADE)} दूर`,
        `रिंग रोड: सड़क मार्ग से लगभग ${hiKm(D_RING)} दूर`,
        'सामने निर्माणाधीन Apollo Hospital है'),
        'ये सब मिलकर लोकेशन को उच्च फुटफॉल संभावना देते हैं; फुटफॉल का कोई आँकड़ा प्रकाशित नहीं किया जाता।'),
    },
    next: ['footfall', 'nearby', 'retail'],
  },
  {
    id: 'trade', title: 'Varanasi Trade Centre',
    keys: ['trade centre', 'trade center', 'hastkala', 'hastkala sankul', 'sankul', 'convention', 'convention centre', 'exhibition', 'varanasi trade centre', 'deendayal'],
    a: {
      en: ans(`The Varanasi Trade Centre (Deendayal Hastkala Sankul) is about ${D_TRADE} from SHRINEVA, along the same road.`, pts(
        `NIFT Varanasi: about ${D_NIFT} away`,
        `Ring Road: about ${D_RING} by road`,
        'The upcoming Apollo Hospital is opposite (under construction)'),
        `These landmarks are behind the location's high footfall potential; no footfall figures are published.`),
      hi: ans(`वाराणसी ट्रेड सेंटर (दीनदयाल हस्तकला संकुल) SHRINEVA से उसी सड़क पर लगभग ${hiKm(D_TRADE)} दूर है।`, pts(
        `NIFT वाराणसी: लगभग ${hiKm(D_NIFT)} दूर`,
        `रिंग रोड: सड़क मार्ग से लगभग ${hiKm(D_RING)} दूर`,
        'सामने निर्माणाधीन Apollo Hospital है'),
        'ये स्थान लोकेशन की उच्च फुटफॉल संभावना के पीछे हैं; फुटफॉल का कोई आँकड़ा प्रकाशित नहीं किया जाता।'),
    },
    next: ['footfall', 'nearby', 'nift'],
  },
  {
    id: 'ring', title: 'Ring Road',
    keys: ['ring road', 'ringroad', 'bypass', 'nh 135b', 'nh135b', 'nh', 'ring', 'expressway', 'rim road'],
    a: {
      en: ans(`The Varanasi Ring Road (NH 135B) is about ${D_RING} from SHRINEVA by road.`, pts(
        'The upcoming Apollo Hospital is opposite (under construction)',
        `NIFT Varanasi: about ${D_NIFT} away`,
        `Varanasi Trade Centre: about ${D_TRADE} away`),
        `These landmarks are behind the location's high footfall potential; no footfall figures are published.`),
      hi: ans(`वाराणसी रिंग रोड (NH 135B) SHRINEVA से सड़क मार्ग से लगभग ${hiKm(D_RING)} दूर है।`, pts(
        'सामने निर्माणाधीन Apollo Hospital है',
        `NIFT वाराणसी: लगभग ${hiKm(D_NIFT)} दूर`,
        `वाराणसी ट्रेड सेंटर: लगभग ${hiKm(D_TRADE)} दूर`),
        'ये स्थान लोकेशन की उच्च फुटफॉल संभावना के पीछे हैं; फुटफॉल का कोई आँकड़ा प्रकाशित नहीं किया जाता।'),
    },
    next: ['footfall', 'nearby', 'airport'],
  },
  {
    id: 'airport', title: 'Airport',
    keys: ['airport', 'flight', 'flights', 'plane', 'lal bahadur', 'babatpur', 'hawai adda', 'vimanpattan'],
    a: {
      en: `Lal Bahadur Shastri International Airport is about ${km('Lal Bahadur')} from SHRINEVA by road (approximate).`,
      hi: `लाल बहादुर शास्त्री अंतर्राष्ट्रीय हवाई अड्डा SHRINEVA से सड़क मार्ग से लगभग ${hiKm(km('Lal Bahadur'))} है (अनुमानित)।`,
    },
    next: ['railway', 'nearby'],
  },
  {
    id: 'railway', title: 'Railway station',
    keys: ['railway', 'railway station', 'station', 'train', 'trains', 'junction', 'cantt', 'cant', 'varanasi junction', 'railway junction', 'rail', 'station kitni dur'],
    a: {
      en: `Varanasi Junction (Cantt) railway station is about ${km('Varanasi Junction')} from SHRINEVA by road (approximate).`,
      hi: `वाराणसी जंक्शन (कैंट) रेलवे स्टेशन SHRINEVA से सड़क मार्ग से लगभग ${hiKm(km('Varanasi Junction'))} है (अनुमानित)।`,
    },
    next: ['airport', 'nearby'],
  },
  {
    id: 'temple', title: 'Kashi Vishwanath Temple',
    keys: ['kashi vishwanath', 'vishwanath', 'temple', 'mandir', 'kashi', 'ghat', 'ghats', 'ganga', 'dashashwamedh', 'kvt'],
    a: {
      en: `Kashi Vishwanath Temple is about ${km('Kashi Vishwanath')} from SHRINEVA by road (approximate). I don't have distances for the ghats.`,
      hi: `काशी विश्वनाथ मंदिर SHRINEVA से सड़क मार्ग से लगभग ${hiKm(km('Kashi Vishwanath'))} है (अनुमानित)। घाटों की दूरी मेरे पास नहीं है।`,
    },
    next: ['sarnath', 'nearby'],
  },
  {
    id: 'sarnath', title: 'Sarnath',
    keys: ['sarnath'],
    a: {
      en: `Sarnath is about ${km('Sarnath')} from SHRINEVA by road (approximate).`,
      hi: `सारनाथ SHRINEVA से सड़क मार्ग से लगभग ${hiKm(km('Sarnath'))} है (अनुमानित)।`,
    },
    next: ['temple', 'nearby'],
  },
  {
    id: 'stadium', title: 'Ganjari stadium',
    keys: ['stadium', 'ganjari', '~cricket', 'cricket stadium', 'ganjari stadium', 'international cricket stadium'],
    a: {
      en: `Ganjari International Cricket Stadium is about 20 km from SHRINEVA by road, a rough estimate.`,
      hi: 'गंजारी अंतर्राष्ट्रीय क्रिकेट स्टेडियम SHRINEVA से सड़क मार्ग से लगभग 20 किमी है, यह मोटा अनुमान है।',
    },
    next: ['nearby'],
  },
  {
    id: 'vardhan', title: 'Vardhan Hospital',
    keys: ['vardhan', 'vardhan hospital', 'lalpur hospital'],
    a: {
      en: `Vardhan Hospital, Lalpur is nearby, in Bada Lalpur opposite the Trade Centre. I don't have a measured distance to give.`,
      hi: 'वर्धन हॉस्पिटल, लालपुर पास में है, बड़ा लालपुर में ट्रेड सेंटर के सामने। मेरे पास नापी हुई दूरी नहीं है।',
    },
    next: ['nearby'],
  },

  // ── Project status and documents ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'status', title: 'Project status', chip: { en: 'Project status', hi: 'प्रोजेक्ट की स्थिति' },
    keys: ['status', 'progress', 'construction', 'under construction', 'completed', 'complete', 'completion', 'ready', 'when ready', 'when will it be ready', 'when will it be complete', 'timeline', 'deadline', 'possession', 'occupancy', 'move in', 'when can i start', 'target', 'built', 'stage', 'work going on', 'kab', 'kab tak', 'taiyar', 'tayyar', 'nirman', 'banega', 'bana', 'construction finish', 'when will construction finish', 'when will it finish', 'when will work finish', 'finish date', 'finishing date', 'when will it be finished'],
    a: {
      en: ans('SHRINEVA is under construction.', pts(
        'Done: the concrete structure of the ground level and three upper floors',
        'In progress: brickwork, façade, lift and services',
        'Next: final works on the ground and boundary, flooring and other finishing',
        `Project completion is targeted for ${TARGET}`), 'Dates are targets and may change.'),
      hi: ans('SHRINEVA निर्माणाधीन है।', pts(
        'पूरा हो चुका: ग्राउंड लेवल और तीन ऊपरी मंज़िलों का कंक्रीट स्ट्रक्चर',
        'चल रहा है: ईंट का काम, फ़ैसाड, लिफ्ट और सर्विसेज़',
        'आगे: ग्राउंड और बाउंड्री का काम, फ़्लोरिंग और बाकी फिनिशिंग',
        'प्रोजेक्ट पूरा होने का लक्ष्य मार्च 2027 है, अनुमतियों के अधीन'), 'तारीख़ें लक्ष्य हैं और बदल सकती हैं।'),
    },
    actions: [A.progress, A.visit], next: ['photos', 'condition', 'visit'],
  },
  {
    id: 'photos', title: 'Site photographs',
    keys: ['photos', 'photo', 'photographs', 'photograph', 'pictures', 'picture', 'images', 'image', 'real photos', 'site photos', 'site photographs', 'current photos', 'tasveer', 'tasvir', 'foto'],
    a: {
      en: ans(`The home page shows real site photographs taken in ${PROJECT_STATUS.photosTaken}: the building today, the ground level and the upper floors as built so far.`, 'The renders elsewhere on the site are indicative.'),
      hi: ans('होम पेज पर नवंबर 2026 में साइट पर खींची गई असली तस्वीरें हैं: बिल्डिंग आज कैसी है, ग्राउंड लेवल और ऊपरी मंज़िलें जैसी अब तक बनी हैं।', 'वेबसाइट पर बाकी चित्र संकेतात्मक रेंडर हैं।'),
    },
    actions: [A.progress, A.walk], next: ['status', 'walkthrough'],
  },
  {
    id: 'approvals', title: 'Approvals and documents',
    keys: ['approval', 'approvals', 'approved', 'vda', 'vda approved', 'sanction', 'sanctioned', 'map sanction', 'rera', 'registration', 'registered', 'legal', 'documents', 'papers', 'title', 'clear title', 'completion certificate', 'occupancy certificate', 'permission', 'permissions', 'authority', 'varanasi development authority', 'noc', 'mutation', 'kanooni', 'manzoori', 'swikriti'],
    a: {
      en: ans(VDA_ON ? 'SHRINEVA is VDA approved.' : '', 'For sanction details or documents, please ask the leasing team.', APPROVALS),
      hi: ans(VDA_ON ? 'SHRINEVA VDA से स्वीकृत है।' : '', 'स्वीकृति के विवरण या दस्तावेज़ों के लिए कृपया लीज़िंग टीम से पूछिए।', APPROVALS_HI),
    },
    actions: [A.callback], next: ['fire', 'businesses'],
  },

  // ── Items still to be confirmed (ASK_ITEMS): never stated as features ──────────────────────────────────────────────
  {
    id: 'power', title: 'Power and backup',
    keys: ['power', 'electricity', 'electric', 'electrical load', 'sanctioned load', 'power load', 'kva', 'kw', 'dg', 'generator', 'backup', 'power backup', 'inverter', 'three phase', '3 phase', 'transformer', 'bijli'],
    a: unconfirmed('Power and backup supply (load, generator or inverter backup, three-phase supply)', 'बिजली और बैकअप सप्लाई (लोड, जनरेटर या इन्वर्टर बैकअप, थ्री-फेज़ सप्लाई)'),
    actions: [A.callback], next: ['water', 'hvac', 'internet'],
  },
  {
    id: 'water', title: 'Water and washrooms',
    keys: ['water', 'water supply', 'borewell', 'bore well', 'washroom', 'washrooms', 'toilet', 'toilets', 'restroom', 'bathroom', 'lavatory', 'pantry', 'drainage', 'sewer', 'plumbing', 'paani', 'pani', 'shauchalay'],
    a: unconfirmed('Water supply and washrooms', 'पानी की सप्लाई और वॉशरूम'),
    actions: [A.callback], next: ['power', 'hvac', 'internet'],
  },
  {
    id: 'hvac', title: 'Air-conditioning',
    keys: ['ac', 'a/c', 'air conditioning', 'air conditioner', 'air-conditioning', 'hvac', 'cooling', 'central ac', 'split ac', 'vrf', 'ventilation', 'outdoor unit', 'chiller', 'thanda', 'air conditioned', 'centrally air conditioned', 'central air conditioning', 'airconditioning', 'airconditioned', 'a c', 'ac plant'],
    a: unconfirmed('Air-conditioning provision', 'एयर-कंडीशनिंग की व्यवस्था'),
    actions: [A.callback], next: ['power', 'water', 'internet'],
  },
  {
    id: 'internet', title: 'Connectivity',
    keys: ['internet', 'fibre', 'fiber', 'wifi', 'wi-fi', 'broadband', 'connectivity', 'network', 'leased line', 'jio fibre', 'airtel fibre'],
    a: unconfirmed('Fibre and internet connectivity', 'फ़ाइबर और इंटरनेट कनेक्टिविटी'),
    actions: [A.callback], next: ['power', 'water', 'hvac'],
  },
  {
    id: 'loading', title: 'Floor loading and equipment',
    keys: ['floor loading', 'floor load', 'floor strength', 'load bearing', 'loadbearing', 'structural load', 'weight limit', 'heavy equipment', 'heavy machine', 'machinery', 'mri', 'ct scan', 'x ray', 'xray', 'generator room', 'server room', 'how much weight', 'weight', 'weight capacity', 'weight bearing', 'carry weight', 'load capacity', 'floor capacity', 'heavy', 'point load', 'live load', 'dead load'],
    a: unconfirmed('The floor loading (how much weight a floor can carry)', 'फ़्लोर की भार-वहन क्षमता (फ़र्श कितना वज़न सह सकता है)'),
    actions: [A.callback], next: ['healthcare', 'power'],
  },
  {
    id: 'loadunload', title: 'Loading and unloading',
    keys: ['loading', 'unloading', 'loading unloading', 'goods lift', 'service lift', 'material movement', 'goods movement', 'delivery', 'deliveries', 'material delivery', 'goods delivery', 'delivery vehicle', 'delivery truck', 'truck', 'trucks', 'tempo', 'unload', 'material', 'supplies'],
    a: unconfirmed('Loading and unloading arrangements', 'सामान चढ़ाने-उतारने की व्यवस्था'),
    actions: [A.callback], next: ['lift', 'parking'],
  },
  {
    id: 'security', title: 'Security and CCTV',
    keys: ['security', 'guard', 'cctv', 'camera', 'cameras', 'surveillance', 'access control', 'intercom', 'watchman', 'chowkidar', 'secure', 'safe', 'is it safe', 'building security', 'security guard', 'security system', 'guards'],
    a: {
      en: `I don't have security arrangements (guards, CCTV, access control) confirmed to share yet. I can pass your question to the leasing team.`,
      hi: 'सुरक्षा व्यवस्था (गार्ड, CCTV, एक्सेस कंट्रोल) की पुष्ट जानकारी अभी मेरे पास नहीं है। आपका सवाल लीज़िंग टीम तक पहुँचाया जा सकता है।',
    },
    actions: [A.callback], next: ['fire', 'lift'],
  },

  // ── Money: never quoted ─────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'rent', title: 'Rent and commercial terms', chip: { en: 'Rent and terms', hi: 'किराया और शर्तें' },
    keys: ['rent', 'rental', 'price', 'prices', 'pricing', 'cost', 'costs', 'rate', 'rates', 'charges', 'charge', 'how much is it', 'how much does it cost', 'how much for', 'how much will it cost', 'what is the cost', 'what does it cost', 'per sqft', 'per sq ft', 'deposit', 'security deposit', 'advance', 'maintenance', 'cam', 'common area', 'escalation', 'lock in', 'lockin', 'lock-in', 'agreement', 'terms', 'terms and conditions', 'gst', 'brokerage', 'budget', 'cheap', 'expensive', 'discount', 'negotiable', 'negotiation', 'quote', 'quotation', 'tariff', 'fees', 'monthly', 'per month', 'annual', 'yearly', 'rupees', 'inr', 'kiraya', 'kiraye', 'bhada', 'daam', 'dam', 'kimat', 'keemat', 'mehnga', 'sasta', 'paisa', 'paise', '~kitna hai', 'kitne ka hai', 'kitne mein', 'kitne me', 'kya rate hai', 'kya price hai', 'lease rate', 'rent rate', 'rate of rent', 'lease rent', 'lease price', 'lease cost', 'lease amount', 'rent amount', 'amount', '~how much', 'how much is', 'how much are', 'how much to pay', 'how much to lease', 'how much to rent', 'how much per', 'how much monthly', 'how much would it', 'how much will it', 'how much would the', 'how much will the'],
    a: {
      en: ans('Rent and commercial terms are discussed directly by the leasing team.', pts('They depend on the floor, the area and your requirement', 'They are not published', 'Send your question and the team will reply or call you')),
      hi: ans('किराया और व्यावसायिक शर्तें लीज़िंग टीम सीधे आपसे तय करती है।', pts('ये मंज़िल, क्षेत्रफल और आपकी ज़रूरत पर निर्भर करती हैं', 'ये यहाँ प्रकाशित नहीं की जातीं', 'अपना सवाल भेजिए, टीम आपको जवाब देगी या कॉल करेगी')),
    },
    actions: [A.callback, A.call], next: ['visit', 'lease-options', 'areas'],
  },
  {
    id: 'sale', title: 'Sale and other arrangements',
    keys: ['buy', 'purchase', 'for sale', 'sale', 'sell', 'selling', 'freehold', 'investment', 'invest', 'roi', 'yield', 'resale', 'kharidna', 'bechna', 'bikri', 'khareed'],
    a: {
      en: `SHRINEVA's floors are offered for lease. For any other arrangement, please ask the leasing team.`,
      hi: 'SHRINEVA की मंज़िलें लीज़ के लिए दी जा रही हैं। किसी और व्यवस्था के लिए कृपया लीज़िंग टीम से पूछिए।',
    },
    actions: [A.callback], next: ['lease-options', 'visit'],
  },

  // ── Businesses ──────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'businesses', title: 'Which businesses can lease', chip: { en: 'Which businesses', hi: 'कौन से व्यवसाय' },
    keys: ['businesses', 'business', 'who can lease', 'who can rent', 'which business', '~what type', '~what kind', 'types of business', '~suitable for', '~suitable', '~use', '~uses', '~allowed', '~who can', 'tenants', 'tenant', 'vyavsay', 'vyapar', 'dhandha', 'what business', 'which businesses', 'kind of business', 'type of business', 'what kind of business', 'who can take', 'who can take space',
      'suitable for my business', '~is it suitable', '~is this suitable', '~how suitable', '~how is it suitable', '~how is this suitable', 'good for my business', 'my business', 'for my business', 'will my business work', 'business friendly', 'is this good for business', 'is it good for business', 'my kind of business', 'my type of business'],
    a: suit(null, {
      head: { en: 'Businesses that suit SHRINEVA', hi: 'इन व्यवसायों के लिए उपयुक्त' },
      intro: {
        en: ans('Clinics and labs, banks and NBFCs, offices, showrooms, restaurants and cafés, coaching centres, and fitness, wellness or coworking spaces.', 'Tell me yours and I will show how it fits. The key points for any of them:'),
        hi: ans('क्लिनिक और लैब, बैंक और NBFC, ऑफिस, शोरूम, रेस्तरां और कैफ़े, कोचिंग सेंटर, और फ़िटनेस, वेलनेस या कोवर्किंग।', 'अपना व्यवसाय बताइए, फिर बताया जाएगा कि वह यहाँ कैसे फिट होता है। किसी भी व्यवसाय के लिए मुख्य बातें:'),
      },
    }),
    actions: [A.plans, A.explore, A.callback], next: ['healthcare', 'banks', 'food'],
  },
  {
    id: 'healthcare', title: 'Clinics, labs and diagnostics', chip: { en: 'Clinics and diagnostics', hi: 'क्लिनिक और डायग्नोस्टिक' },
    keys: ['clinic', 'clinics', 'doctor', 'doctors', 'pathology', 'path lab', 'lab', 'laboratory', 'diagnostic', 'diagnostics', 'diagnostic centre', 'diagnostic center', 'dental', 'dentist', 'scan centre', 'imaging', 'physio', 'physiotherapy', 'polyclinic', 'healthcare', 'health care', 'medical', 'eye clinic', 'skin clinic', 'dermatology', 'ayurveda', 'homeopathy', 'blood test', 'sample collection', 'dawakhana', 'chikitsa', 'daktar', 'doctor ki clinic', 'doctor chamber', 'chamber', 'medical centre', 'medical center', 'multispeciality', 'multispecialty'],
    a: suit({
      head: { en: 'For a clinic, pathology lab or diagnostic centre', hi: 'क्लिनिक, पैथोलॉजी लैब या डायग्नोस्टिक सेंटर के लिए' },
      points: {
        en: ['Room for consulting rooms, sample collection, reporting and a waiting area', 'The hospital opposite is not yet operational, so no patient numbers are promised'],
        hi: ['कंसल्टिंग रूम, सैंपल कलेक्शन, रिपोर्टिंग और वेटिंग एरिया के लिए जगह', 'सामने का अस्पताल अभी चालू नहीं है, इसलिए मरीज़ों की संख्या का कोई वादा नहीं किया जाता'],
      },
    }),
    actions: [A.plans, A.explore, A.callback], next: ['footfall', 'apollo', 'availability'],
  },
  {
    id: 'banks', title: 'Banks, NBFCs and insurance', chip: { en: 'Banks and finance', hi: 'बैंक और फ़ाइनेंस' },
    keys: ['bank', 'banks', 'banking', 'atm', 'nbfc', 'finance', 'financial', 'loan', 'insurance', 'insurer', 'broking', 'broker house', 'branch', 'branches', 'bfsi', 'credit', 'microfinance', 'mutual fund', 'stock broking'],
    a: suit({
      head: { en: 'For a bank, NBFC or insurance branch', hi: 'बैंक, NBFC या बीमा शाखा के लिए' },
      points: {
        en: ['Room for counters, cabins, a back office and a waiting area', 'Strong-room and equipment loads are still being confirmed with the architect'],
        hi: ['काउंटर, केबिन, बैक ऑफिस और वेटिंग एरिया के लिए जगह', 'स्ट्रॉन्ग-रूम और उपकरणों का भार आर्किटेक्ट के साथ अभी तय किया जा रहा है'],
      },
    }),
    actions: [A.plans, A.explore, A.callback], next: ['footfall', 'availability', 'visit'],
  },
  {
    id: 'office', title: 'Offices, IT and coworking', chip: { en: 'Offices', hi: 'ऑफिस' },
    keys: ['office', 'offices', 'corporate', 'it company', 'it office', 'software', 'startup', 'start up', 'consulting', 'consultancy', 'agency', 'call centre', 'call center', 'bpo', 'back office', 'regional office', 'head office', 'branch office', 'workspace', 'work space', 'law firm', 'ca firm', 'chartered accountant', 'advocate', 'lawyer', 'architect', 'company', 'karyalay', 'daftar', 'office space'],
    a: suit({
      head: { en: 'For a corporate, IT or consulting office', hi: 'कॉर्पोरेट, IT या कंसल्टिंग ऑफिस के लिए' },
      points: {
        en: ['Workstations, cabins and meeting rooms are yours to plan', 'The floors are open shells, so the fit-out is yours', 'You can lease a whole floor, part of one, or several'],
        hi: ['वर्कस्टेशन, केबिन और मीटिंग रूम आप अपने हिसाब से प्लान कर सकते हैं', 'मंज़िलें ओपन शेल में हैं, यानी फिट-आउट आपका', 'आप पूरी मंज़िल, उसका हिस्सा, या कई मंज़िलें ले सकते हैं'],
      },
    }),
    actions: [A.plans, A.explore, A.callback], next: ['footfall', 'lease-options', 'availability'],
  },
  {
    id: 'retail', title: 'Showrooms and retail', chip: { en: 'Retail and showrooms', hi: 'रिटेल और शोरूम' },
    keys: ['retail', 'showroom', 'showrooms', 'shop', 'shops', 'store', 'stores', '~outlet', 'boutique', 'brand outlet', 'franchise', 'fashion', 'fashion store', 'garment', 'clothes', 'textile', 'jewellery', 'jewelry', 'furniture', 'electronics', 'mobile shop', 'dukaan', 'dukan', 'dukaan kholna', 'shorum'],
    a: suit({
      head: { en: 'For a showroom, boutique or brand outlet', hi: 'शोरूम, बुटीक या ब्रांड आउटलेट के लिए' },
      points: {
        en: ['Room for display, trial and billing areas behind the glass front', 'Signage permissions are still being confirmed'],
        hi: ['काँच के फ्रंट के पीछे डिस्प्ले, ट्रायल और बिलिंग एरिया के लिए जगह', 'साइनेज की अनुमतियाँ अभी तय की जा रही हैं'],
      },
    }),
    actions: [A.plans, A.explore, A.callback], next: ['footfall', 'visibility', 'availability'],
  },
  {
    id: 'food', title: 'Restaurants and cafés', chip: { en: 'Restaurants and cafés', hi: 'रेस्तरां और कैफ़े' },
    keys: ['restaurant', 'restaurants', 'cafe', 'cafes', 'café', 'coffee', 'coffee shop', 'bakery', 'qsr', 'fast food', 'food', 'food court', 'dhaba', 'cloud kitchen', 'kitchen', 'bar', 'pizza', 'burger', 'ice cream', 'sweet shop', 'mithai', 'fssai', 'gas', 'lpg', 'chef', 'restaurant kholna', 'khana', 'bhojnalay', 'qsr outlet', 'qsr restaurant', 'food outlet'],
    a: suit({
      head: { en: 'For a restaurant, café or QSR', hi: 'रेस्तरां, कैफ़े या QSR के लिए' },
      points: {
        en: ['Room for seating, a counter and a kitchen', 'Exhaust, gas, drainage and FSSAI needs depend on the floor and approvals', 'Tell the team what your kitchen needs'],
        hi: ['बैठने की जगह, काउंटर और किचन के लिए स्थान', 'एग्ज़ॉस्ट, गैस, ड्रेनेज और FSSAI की ज़रूरतें मंज़िल और अनुमतियों पर निर्भर हैं', 'टीम को अपनी किचन की ज़रूरतें बताइए'],
      },
    }),
    actions: [A.plans, A.explore, A.callback], next: ['footfall', 'hvac', 'availability'],
  },
  {
    id: 'coaching', title: 'Coaching and education', chip: { en: 'Coaching and training', hi: 'कोचिंग और ट्रेनिंग' },
    keys: ['coaching', 'coaching institute', 'institute', 'classes', 'class', 'tuition', '~training', 'training centre', 'training center', 'academy', 'education', 'educational', 'classroom', 'classrooms', 'batch', 'batches', '~study', 'library', 'computer institute', 'skill', 'kochin', 'padhai', 'shiksha', 'students', 'student'],
    a: suit({
      head: { en: 'For a coaching institute or training centre', hi: 'कोचिंग संस्थान या ट्रेनिंग सेंटर के लिए' },
      points: {
        en: ['Classrooms or batch rooms with a reception', 'A floor can be divided as you need'],
        hi: ['क्लासरूम या बैच रूम और रिसेप्शन प्लान किए जा सकते हैं', 'मंज़िल को ज़रूरत के अनुसार बाँटा जा सकता है'],
      },
    }),
    actions: [A.plans, A.explore, A.callback], next: ['footfall', 'lease-options', 'availability'],
  },
  {
    id: 'wellness', title: 'Fitness, wellness and coworking', chip: { en: 'Fitness and wellness', hi: 'फ़िटनेस और वेलनेस' },
    keys: ['gym', 'fitness', 'fitness centre', 'fitness center', 'yoga', 'wellness', 'spa', 'salon', 'parlour', 'parlor', 'beauty', 'zumba', 'dance', 'coworking', 'co working', 'co-working', 'shared office', 'flexible workspace'],
    a: suit({
      head: { en: 'For a gym, yoga centre, salon, spa, wellness or coworking space', hi: 'जिम, योग केंद्र, सैलून, स्पा, वेलनेस या कोवर्किंग के लिए' },
      points: {
        en: ['Zones and rooms are yours to plan', 'Floor loading for heavy equipment is still being confirmed with the architect'],
        hi: ['ज़ोन और कमरे आप अपने हिसाब से प्लान कर सकते हैं', 'भारी उपकरणों के लिए फ़्लोर की भार-वहन क्षमता आर्किटेक्ट के साथ अभी तय की जा रही है'],
      },
    }),
    actions: [A.plans, A.explore, A.callback], next: ['footfall', 'loading', 'availability'],
  },
  {
    id: 'other-use', title: 'Other uses',
    keys: ['pharmacy', 'medical store', 'chemist', 'warehouse', 'godown', 'storage', 'factory', 'manufacturing', 'industrial', 'residential', 'residence', 'flat', 'apartment', 'pg', 'hostel', 'guest house', 'guesthouse', 'lodge', 'dormitory', 'any business', 'other business', 'something else', 'other use', 'other uses', 'open a hospital', 'start a hospital', 'run a hospital', 'hospital space', 'hospital lease', 'nursing home', 'school', 'play school', 'preschool', 'nursery', 'college building', 'daycare', 'day care', 'creche', 'hotel', 'hotel lease', 'for residence', 'to live', 'living', 'house', 'suitable for a hospital', 'for a hospital', 'hospital use'],
    a: suit(null, {
      location: false,
      head: { en: 'Your use', hi: 'आपका उपयोग' },
      intro: {
        en: pts('Tell me your use and the leasing team will confirm its suitability and the approvals it needs', 'SHRINEVA is a commercial building, so the floors are for commercial use'),
        hi: pts('आप जो काम करना चाहते हैं, बताइए; लीज़िंग टीम उसकी उपयुक्तता और ज़रूरी अनुमतियाँ बताएगी', 'SHRINEVA एक कमर्शियल बिल्डिंग है, इसलिए मंज़िलें कमर्शियल उपयोग के लिए हैं'),
      },
    }),
    actions: [A.plans, A.explore, A.callback], next: ['businesses', 'availability', 'visit'],
  },

  // ── Plans, media and actions ───────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'floorplans', title: 'Floor plans', chip: { en: 'Floor plans', hi: 'फ़्लोर प्लान' },
    keys: ['plan', 'plans', 'floor plan', 'floor plans', 'floorplan', 'layout plan', 'drawing', 'drawings', 'blueprint', '2d', 'cad', 'architect plan', 'architectural', 'naksha', 'nakshe', 'layout dikhao', 'plan dikhao', 'architect drawing', 'architects drawing', 'architectural drawing', 'layout', 'layouts', 'plan view', '2d plan', '2d plans', 'floor layout', 'sheet', 'sheets'],
    a: {
      en: ans('The floor plans page shows the ground level and Floors 1 to 3 in 2D and 3D, with areas and dimensions.', pts(
        'On the home page, tap a floor on the building to see its plan beside it and turn it in 3D',
        'The plans PDF comes with the brochure'), 'Plans and renders are indicative and subject to change.'),
      hi: ans('फ़्लोर प्लान पेज पर ग्राउंड लेवल और मंज़िल 1 से 3 के 2D और 3D प्लान हैं, क्षेत्रफल और माप के साथ।', pts(
        'होम पेज पर इमारत की किसी मंज़िल पर टैप करके उसका प्लान बगल में देखा और 3D में घुमाया भी जा सकता है',
        'प्लान की PDF ब्रोशर के साथ मिलती है'), 'प्लान और रेंडर संकेतात्मक हैं और बदल सकते हैं।'),
    },
    actions: [A.plans, A.explore, { kind: 'brochure', label: { en: 'Get the plans PDF', hi: 'प्लान की PDF पाएँ' } }], next: ['explorer', 'areas', 'visit'],
  },
  {
    id: 'explorer', title: 'Building explorer (3D plan)', chip: { en: 'See a floor in 3D', hi: 'मंज़िल 3D में देखें' },
    keys: ['explorer', 'building explorer', 'explore the building', 'interactive', 'interactive plan', 'interactive building', 'interactive 3d', '3d plan', '3d plans', '3d floor', '3d floor plan', 'floor in 3d', 'floors in 3d', 'plan in 3d', 'see the floor in 3d', 'see a floor in 3d', 'rotate', 'rotate the plan', 'turn the plan', 'all angles', 'every angle', 'different angles', 'every side', 'all sides', 'from the top', 'from above', 'top view', 'top angle', 'top down', 'bird eye', 'birds eye', 'bird eye view', 'birds eye view', 'angle view', 'front view', 'tap a floor', 'tap the floor', 'click a floor', 'lift off', 'cutaway', 'cut away', 'floor view', '3d', '3d floor view', 'view in 3d', '3d view of the floor', '3d view of floor', 'see in 3d', 'see it in 3d', 'in 3d', '3d model'],
    a: {
      en: ans('On the home page, tap Ground, First, Second or Third floor on the building.', pts(
        'Its plan opens beside it with the area and details',
        'The floors above lift away, and you can see the plan from the top, at an angle or from the front',
        'Drag sideways to turn it; pinch or use + and − to zoom'), `The 3D model is a simplified view of the architect's plan, indicative and subject to change.`),
      hi: ans('होम पेज पर इमारत की ग्राउंड, पहली, दूसरी या तीसरी मंज़िल पर टैप कीजिए।', pts(
        'उसका प्लान क्षेत्रफल और जानकारी के साथ बगल में खुलता है',
        'ऊपर की मंज़िलें हट जाती हैं, और प्लान को ऊपर से, तिरछे कोण से या सामने से देखा जा सकता है',
        'घुमाने के लिए बगल में खींचिए; ज़ूम के लिए पिंच कीजिए या + और − दबाइए'), '3D मॉडल आर्किटेक्ट के प्लान का सरल रूप है, संकेतात्मक है और बदल सकता है।'),
    },
    actions: [A.explore, A.plans], next: ['floorplans', 'areas', 'visit'],
  },
  {
    id: 'walkthrough', title: '3D walkthrough', chip: { en: '3D walkthrough', hi: '3D वॉकथ्रू' },
    keys: ['walkthrough', 'walk through', 'virtual tour', 'virtual', 'tour', '3d tour', '3d view', 'video', 'videos', 'render', 'renders', 'rendering', 'visualisation', 'visualization', 'see the building', 'how will it look', 'how does it look', 'look like', '~design', 'elevation', 'facade', 'façade', 'exterior', 'interior view', '~dikhao', '~dikha', '~dekhna', '3d walkthrough', 'virtual walkthrough', 'walkthrough video', 'front elevation', 'building elevation', 'how it looks', 'what it looks like', 'show me the elevation'],
    a: {
      en: ans('The 3D walkthrough goes stop by stop, from the road and the entrance to the ground level and the lift lobby, as indicative renders.', 'Finishes and surroundings are illustrative and the design is subject to change.'),
      hi: ans('3D वॉकथ्रू सड़क और प्रवेश से लेकर ग्राउंड लेवल और लिफ्ट लॉबी तक, एक-एक पड़ाव पर चलता है, संकेतात्मक रेंडर के रूप में।', 'फिनिश और आसपास का दृश्य सिर्फ़ उदाहरण है और डिज़ाइन बदल सकता है।'),
    },
    actions: [A.walk, A.explore], next: ['explorer', 'floorplans', 'visit'],
  },
  {
    id: 'brochure', title: 'Brochure', chip: { en: 'Brochure', hi: 'ब्रोशर' },
    keys: ['brochure', 'brochures', 'pdf', 'download', 'catalogue', 'catalog', 'leaflet', 'flyer', 'pamphlet', 'presentation', 'ppt', 'deck', 'send me details', 'send details', 'send brochure', 'send me the brochure', 'whatsapp me', 'email me', 'bhejo', 'bhej do', 'bhejiye', 'brochure bhejo'],
    a: {
      en: ans(`The brochure is a ${BROCHURE.pages}-page PDF (about ${BROCHURE.size}) with:`, pts('The key facts', 'The floor plans', 'The project status', 'The location map', 'The specification'), 'Enter your name, mobile number and email and it downloads straight away.'),
      hi: ans(`ब्रोशर ${BROCHURE.pages} पेज की PDF है (लगभग ${BROCHURE.size}), जिसमें:`, pts('मुख्य जानकारी', 'फ़्लोर प्लान', 'प्रोजेक्ट की स्थिति', 'लोकेशन मैप', 'स्पेसिफिकेशन'), 'नाम, मोबाइल नंबर और ईमेल देते ही वह डाउनलोड हो जाती है।'),
    },
    actions: [A.brochure, A.plans], next: ['visit', 'floorplans', 'areas'],
  },
  {
    id: 'spec', title: 'Specification', chip: { en: 'Specification', hi: 'स्पेसिफिकेशन' },
    keys: ['~specification', '~specifications', '~specs', '~spec', 'spec sheet', 'specification sheet', 'full specification', 'full specifications', 'all specifications', 'complete specification', 'complete specifications', '~technical', 'technical details', 'technical specification', 'technical specifications', '~features', 'building features', 'amenities', 'facilities', 'what facilities', 'what amenities', 'what is included', 'inclusions', 'highlights', 'key features', 'vishesh', 'suvidha', 'suvidhayein'],
    a: {
      en: ans('The specification sheet has four parts:', pts(
        `Project: under construction, completion targeted for ${TARGET}`,
        `Site: a plot of ${lc(specRow('Plot area'))} on a ${specRow('Road')} road`,
        `Building: ${lc(specRow('Configuration'))}, ${GROSS} gross per floor, open shell`,
        `Access and safety: parking for ${CARS} cars, one ${PLAN.lift.adjective} lift and a fire exit on every level`),
        'Ask me for any part in full. Fire-fighting, power, water, air-conditioning and connectivity are still being confirmed.'),
      hi: ans('स्पेसिफिकेशन शीट के चार हिस्से हैं:', pts(
        'प्रोजेक्ट: निर्माणाधीन, पूर्णता का लक्ष्य मार्च 2027, अनुमतियों के अधीन',
        `साइट: लगभग ${PLAN.plot.areaSqM} वर्ग मीटर (लगभग 5,650 वर्ग फुट) का प्लॉट, ${PLAN.plot.roadWidthM} मीटर चौड़ी उत्तरमुखी सड़क पर`,
        'बिल्डिंग: ग्राउंड (पार्किंग) और तीन मंज़िलें, हर मंज़िल लगभग 3,500 वर्ग फुट ग्रॉस, ओपन शेल',
        `प्रवेश और सुरक्षा: ${CARS} कारों की पार्किंग, 10 यात्रियों की एक लिफ्ट और हर स्तर पर फायर एक्ज़िट`),
        'किसी भी हिस्से को पूरा जानना हो तो पूछिए। फायर-फाइटिंग, पावर बैकअप, पानी, एयर-कंडीशनिंग और कनेक्टिविटी अभी तय की जा रही हैं।'),
    },
    actions: [A.specs, A.brochure], next: ['spec-building', 'spec-site', 'spec-access'],
  },
  {
    id: 'spec-project', title: 'Specification: project', chip: { en: 'Project specification', hi: 'प्रोजेक्ट स्पेसिफिकेशन' },
    keys: ['project specification', 'project specifications', 'project spec', 'project specs', 'specification of the project', 'project data'],
    a: {
      en: specList('Project', 'Project specification:'),
      hi: `प्रोजेक्ट स्पेसिफिकेशन:\n• प्रोजेक्ट: SHRINEVA, बड़ा लालपुर, वाराणसी\n• स्थिति: निर्माणाधीन\n• लक्ष्य पूर्णता: मार्च 2027, अनुमतियों के अधीन\n${VDA_ON ? '• स्वीकृति: VDA से स्वीकृत\n' : ''}• दिशा: वास्तु अनुकूल`,
    },
    actions: [A.specs, A.brochure], next: ['spec-site', 'spec-building', 'spec-access'],
  },
  {
    id: 'spec-site', title: 'Specification: site', chip: { en: 'Site specification', hi: 'साइट स्पेसिफिकेशन' },
    keys: ['site specification', 'site specifications', 'site spec', 'site specs', 'site details', 'site data', 'site information', 'specification of the site'],
    a: {
      en: specList('Site', 'Site specification:'),
      hi: `साइट स्पेसिफिकेशन:\n• प्लॉट क्षेत्रफल: लगभग ${PLAN.plot.areaSqM} वर्ग मीटर (लगभग 5,650 वर्ग फुट)\n• सड़क: ${PLAN.plot.roadWidthM} मीटर चौड़ी, उत्तरमुखी\n• फ्रंटेज: लगभग ${PLAN.plot.frontageFt} फ़ीट\n• सेटबैक: आगे ${PLAN.setbacks[0].value} · पीछे ${PLAN.setbacks[1].value} · पूर्व ${PLAN.setbacks[2].value} · पश्चिम ${PLAN.setbacks[3].value}`,
    },
    actions: [A.specs, A.brochure], next: ['spec-building', 'spec-access', 'spec-project'],
  },
  {
    id: 'spec-building', title: 'Specification: building', chip: { en: 'Building specification', hi: 'बिल्डिंग स्पेसिफिकेशन' },
    keys: ['building specification', 'building specifications', 'building spec', 'building specs', 'building details', 'building data', 'building information', 'construction specification', 'construction details', 'specification of the building', 'structure details'],
    a: {
      en: specList('Building', 'Building specification:'),
      hi: `बिल्डिंग स्पेसिफिकेशन:\n• कॉन्फ़िगरेशन: ग्राउंड (पार्किंग) और तीन मंज़िलें\n• ग्रॉस फ़्लोर एरिया: लगभग 3,500 वर्ग फुट प्रति मंज़िल (मंज़िल 1 से 3)\n• कारपेट फ़्लोर एरिया: लगभग 3,100 वर्ग फुट प्रति मंज़िल (मंज़िल 1 से 3)\n• मंज़िल से मंज़िल: ग्राउंड लगभग ${FTF_GROUND} · मंज़िलें लगभग ${FTF_UPPER}\n• फ़्लोर प्लेट: खुला प्लान, किरायेदार के अनुसार लचीला लेआउट\n• फ्रंट: सड़क की ओर काँच का फ्रंट\n• स्थिति: ओपन शेल, फिट-आउट किरायेदार करवाता है`,
    },
    actions: [A.specs, A.brochure], next: ['spec-access', 'spec-site', 'spec-project'],
  },
  {
    id: 'spec-access', title: 'Specification: access and safety', chip: { en: 'Access and safety', hi: 'प्रवेश और सुरक्षा' },
    keys: ['access and safety', 'access and safety specification', 'safety and access', 'safety specification', 'safety specifications', 'access specification', 'access details', 'safety details', 'specification of access'],
    a: {
      en: specList('Access and safety', 'Access and safety:'),
      hi: `प्रवेश और सुरक्षा:\n• पार्किंग: ग्राउंड लेवल पर कवर्ड, 12+ कारों के लिए\n• पैसेंजर लिफ्ट: 10 यात्रियों की एक लिफ्ट, हर स्तर पर\n• लिफ्ट और सीढ़ी की लॉबी: पूर्व की ओर एक कोर, पश्चिम और पूर्व की पैदल राहों से पहुँच\n• सीढ़ी: ग्राउंड लेवल से मंज़िल 3 तक ${STAIR_W} चौड़ी फ़्लाइट\n• फायर एस्केप: हर स्तर पर एक अलग निकास, प्लान पर दर्शाया गया\n• खुले किनारे: बिल्डिंग के चारों ओर खुला सेटबैक`,
    },
    actions: [A.specs, A.brochure], next: ['spec-building', 'spec-site', 'fire'],
  },
  {
    id: 'visit', title: 'Site visit', chip: { en: 'Schedule a visit', hi: 'साइट विज़िट' },
    keys: ['visit', 'site visit', 'see the site', 'see the building', 'see the property', 'come and see', 'inspect', 'inspection', 'appointment', 'book', 'booking', 'schedule', 'meet', 'meeting', 'show the space', 'view the space', 'when can i visit', 'timing', 'timings', 'hours', 'open time', 'sunday', 'weekend', 'milna', 'milne', 'dekhne', 'dekhna chahta', 'aana', 'aaunga', 'aaoon', 'visit karna', 'show me around', 'show me the building', 'visiting', 'visiting hours', 'when can i come', 'can i come', 'i want to see', 'want to see', 'dekhne aana'],
    a: {
      en: ans('The leasing team will show you around.', pts('Leave your name, mobile number and email and they will call to confirm a time', 'The building is under construction, so you will see the structure and floors as built so far, along with the plans')),
      hi: ans('लीज़िंग टीम आपको जगह दिखाएगी।', pts('अपना नाम, मोबाइल नंबर और ईमेल छोड़िए, टीम फ़ोन करके समय तय करेगी', 'इमारत निर्माणाधीन है, इसलिए आप अब तक बना ढाँचा, मंज़िलें और प्लान देख पाएँगे')),
    },
    actions: [A.visit, A.call], next: ['brochure', 'floorplans', 'location'],
  },
  {
    id: 'contact', title: 'Contact details', chip: { en: 'Contact details', hi: 'संपर्क' },
    keys: ['contact', 'contact details', 'contact number', 'phone', 'phone number', 'mobile number', 'call', 'call you', 'whatsapp', 'whats app', 'email', 'e-mail', 'email id', 'reach you', 'get in touch', 'office address', 'helpline', 'customer care', 'sampark', 'sampark karna', 'phone number do', 'number do', 'call karna', '~number', 'aapka number', 'aapke number', 'apna number', 'your number', 'your phone', 'your email', 'your contact', 'number kya hai'],
    a: {
      en: ans('You can reach the leasing team here:', pts(`Call or WhatsApp ${P1}`, `Email ${EMAIL}`), 'You can also send your question here and the team will reply.'),
      hi: ans('लीज़िंग टीम से यहाँ संपर्क करें:', pts(`${P1} पर कॉल या WhatsApp करें`, `${EMAIL} पर ईमेल करें`), 'चाहें तो यहीं अपना सवाल भेजें, लीज़िंग टीम आपको जवाब देगी।'),
    },
    actions: [A.call, A.whatsapp, A.callback], next: ['visit', 'brochure'],
  },
  {
    id: 'callback', title: 'Call back request',
    keys: ['call me', 'call me back', 'callback', 'call back', 'phone me', 'ring me', 'contact me', 'reach me', 'talk to someone', 'talk to a person', 'talk to human', 'speak to someone', 'speak to a person', 'speak to the team', 'talk to the team', 'talk to the manager', 'speak to the manager', 'talk to the owner', 'speak to the owner', 'human', 'real person', 'executive', 'representative', 'leasing team', 'call karo', 'call kijiye', 'baat karni', 'baat karna', 'baat karwao', 'phone karo', 'sampark kare', 'please call me', 'mujhe phone karo', 'mujhe call karo'],
    a: {
      en: ans('Sure. Write your question below with your name, mobile number and email.', `The leasing team will reply or call you. The conversation so far goes with it, so you don't have to repeat it.`),
      hi: ans('ज़रूर। नीचे अपना सवाल, नाम, मोबाइल नंबर और ईमेल लिखिए।', 'लीज़िंग टीम आपको जवाब देगी या कॉल करेगी। अब तक की बातचीत साथ में चली जाएगी, इसलिए दोबारा बताने की ज़रूरत नहीं।'),
    },
    actions: [A.callback],
  },
  {
    id: 'ownership', title: 'About the developer',
    keys: ['developer', 'builder', 'promoter', 'owner', 'who built', 'who owns', 'who is the owner', 'who is building', 'company behind', 'about the company', 'track record', 'previous projects', 'other projects', 'malik', 'banane wala'],
    weight: 1.1,
    a: {
      en: `SHRINEVA is a family-promoted commercial development in Bada Lalpur, Varanasi. For more about the promoters, please ask the leasing team.`,
      hi: 'SHRINEVA बड़ा लालपुर, वाराणसी में एक पारिवारिक प्रवर्तकों द्वारा बनाया जा रहा कमर्शियल प्रोजेक्ट है। प्रवर्तकों के बारे में और जानने के लिए कृपया लीज़िंग टीम से पूछिए।',
    },
    actions: [A.callback],
  },
  {
    id: 'broker', title: 'Brokers and agents',
    keys: ['broker', 'brokers', 'channel partner', 'dealer', 'consultant', 'property consultant', 'real estate agent', 'agent', 'agents', 'commission', 'my client', 'my clients', 'for a client', 'a client', 'client', 'clients', 'i have a client', 'my customer', 'on behalf of'],
    a: {
      en: ans(`Please share your client's requirement with the leasing team; they will reply to you directly.`, `You can use the same number (${P1}), the email ${EMAIL}, or send the requirement here.`),
      hi: ans('कृपया अपने ग्राहक की ज़रूरत लीज़िंग टीम को बताइए; वे आपको सीधे जवाब देंगे।', `आप वही नंबर (${P1}), ईमेल ${EMAIL} इस्तेमाल कर सकते हैं, या यहीं ज़रूरत भेज दें।`),
    },
    actions: [A.callback, A.call],
  },
  {
    id: 'language', title: 'Language',
    keys: ['hindi', 'in hindi', 'hindi me', 'hindi mein', 'english', 'language', 'bhasha', 'hindi mein baat', 'हिंदी', 'हिन्दी'],
    a: {
      en: `You can write to me in English or Hindi (हिंदी में भी पूछ सकते हैं). The website also has a Hindi page.`,
      hi: 'आप मुझसे हिंदी या अंग्रेज़ी में बात कर सकते हैं। वेबसाइट पर हिंदी पेज भी है।',
    },
    actions: [{ kind: 'route', label: { en: 'Open the Hindi page', hi: 'हिंदी पेज खोलें' }, href: '/hi' }],
  },
  {
    id: 'privacy', title: 'Privacy',
    keys: ['privacy', 'private', 'my data', 'my details', 'spam', 'misuse', 'safe to share', 'data protection', 'who will see', 'consent'],
    a: {
      en: `We use the number and email you share only to reply to you. You can read the privacy policy for the details.`,
      hi: 'आपके दिए नंबर और ईमेल का उपयोग हम सिर्फ़ आपको जवाब देने के लिए करते हैं। विवरण के लिए प्राइवेसी पॉलिसी पढ़ सकते हैं।',
    },
    actions: [A.privacy],
  },
];

/** What ChaiX says when nothing matches. Never a guess. */
export const UNKNOWN: Bi = {
  en: ans(`I don't have that confirmed, and I would rather not guess.`, pts('The leasing team can answer it: send them your question with your number and email, and they will reply', 'Or ask me about floors and areas, the location, parking and lift, the project status, the plans or the brochure')),
  hi: ans('इसकी पुष्ट जानकारी अभी उपलब्ध नहीं है, और अंदाज़े से जवाब देना ठीक नहीं होगा।', pts('लीज़िंग टीम इसका जवाब दे सकती है: अपना सवाल, नंबर और ईमेल भेजिए, वे आपको जवाब देंगे', 'या मंज़िलों और क्षेत्रफल, लोकेशन, पार्किंग और लिफ्ट, प्रोजेक्ट की स्थिति, प्लान या ब्रोशर के बारे में पूछिए')),
};

/** Chips shown when the chat opens. */
/**
 * The questions pinned in the chat window ("Most asked"): one tap gives the answer, and anything else can be typed. Each label reads as the
 * question a visitor would ask, and typing it must reach the same entry (scripts/test-chaix.js checks that, in both languages).
 */
export const PINNED: { id: string; q: Bi }[] = [
  { id: 'availability', q: { en: 'What is available?', hi: 'क्या उपलब्ध है?' } },
  { id: 'businesses', q: { en: 'Is it suitable for my business?', hi: 'क्या यह मेरे व्यवसाय के लिए उपयुक्त है?' } },
  { id: 'areas', q: { en: 'How big is each floor?', hi: 'हर मंज़िल कितनी बड़ी है?' } },
  { id: 'parking', q: { en: 'Parking and lift', hi: 'पार्किंग और लिफ्ट' } },
  { id: 'footfall', q: { en: 'Footfall potential', hi: 'फुटफॉल की संभावना' } },
  { id: 'location', q: { en: 'Where is it?', hi: 'यह कहाँ है?' } },
  { id: 'floorplans', q: { en: 'Floor plans', hi: 'फ़्लोर प्लान' } },
  { id: 'status', q: { en: 'Project status', hi: 'प्रोजेक्ट की स्थिति' } },
  { id: 'rent', q: { en: 'Rent and terms', hi: 'किराया और शर्तें' } },
  { id: 'brochure', q: { en: 'Get the brochure', hi: 'ब्रोशर चाहिए' } },
  { id: 'visit', q: { en: 'Schedule a site visit', hi: 'साइट विज़िट बुक करें' } },
];

/** Not-yet-confirmed items, in the owner's words (content.config.ts); shown by the engine when a visitor asks "what is not confirmed". */
export const UNCONFIRMED_ITEMS = ASK_ITEMS;
export const FACT_SOURCES = { LEVEL_INFO };
