#!/usr/bin/env node
/**
 * ChaiX regression test: the "training" check for the SHRINEVA leasing assistant. Runs on every build (postbuild) and by hand:
 *
 *     node scripts/test-chaix.js            (add -v to print every answer)
 *
 * It does four things with the real engine and knowledge base (src/app/core/chaix/chaix-engine.ts, src/app/config/chaix.knowledge.ts):
 *
 *   1. QUESTIONS: replays a few hundred typical visitor questions (English, Hindi, Hinglish, typos, floors, areas, businesses,
 *      rent, location, ...) and checks that each one is answered by the intended entry, or honestly marked "not covered".
 *   1b. SPECIFICATION SHEET: every row of the specification sheet (content.config.ts SPEC_GROUPS, the home page and the brochure) and every
 *      "not confirmed yet" item (ASK_ITEMS) has questions that reach the right answer, and the answer carries the sheet's own figures in
 *      English AND Hindi. A new or renamed row without a ChaiX question stops the build. (node scripts/test-chaix.js --spec prints the table.)
 *   2. KNOWLEDGE BASE: every entry has an English and a Hindi answer, a sensible length, follow-up chips that exist, and no key
 *      phrase that another entry swallows (a key typed on its own must land on its own entry).
 *   1c. BUSINESS ANSWERS: "how is this suitable for a bank / a restaurant / a clinic" gets the same structure every time: the location with
 *      its footfall potential and the landmarks (upcoming Apollo Hospital, NIFT, Trade Centre, Ring Road), the floor (floor-to-floor height,
 *      open plate), parking, lift and fire exit, a line for the business, then the floor plans and the ways to reach the team. Checked in
 *      English and Hindi for every business entry. The chat window's pinned "Most asked" questions are checked too (each label, typed, must
 *      reach its own answer).
 *   3. WORDING: every answer the assistant can give (English and Hindi, floor answers, area answers) is scanned for what the owner
 *      does not want said: rent or price figures, "footfall" other than "footfall potential" (never a count or a promise), "handover", "column-free", golden hour / night views, studio or serviced-stay
 *      wording, an Apollo mention without "upcoming / under construction", a "March 2027" that is not a target subject to
 *      approvals, a phone number or email other than the published ones, and a VDA claim while the owner's switch is off.
 *
 * To teach ChaiX something new: add an entry or keys in config/chaix.knowledge.ts, then add a line to QUESTIONS below.
 * Exit code 1 (and a list of every problem) when anything fails, so the build stops before a wrong answer is published.
 */
const fs = require('fs');
const path = require('path');
const { load, root } = require('./lib/load-ts.js');

const eng = load(path.join(root, 'src/app/core/chaix/chaix-engine.ts'));
const kb = load(path.join(root, 'src/app/config/chaix.knowledge.ts'));
const prop = load(path.join(root, 'src/app/config/property.config.ts'));
const fmt = load(path.join(root, 'src/app/components/chaix/chaix.format.ts'));
const content = load(path.join(root, 'src/app/config/content.config.ts'));
const winText = load(path.join(root, 'src/app/components/chaix/chaix.text.ts'));

const verbose = process.argv.includes('-v');
const problems = [];
const fail = (m) => problems.push(m);

// ── 1. Questions ──────────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * [question, expected entry id (or several acceptable ids), options]
 *   options.any   the expected id may also be the second answer given (a two-part question)
 *   options.lang  the language the answer must come back in ('hi' for Devanagari questions is checked automatically)
 *   options.text  text (or list of texts) that the answer must contain
 *   options.callback  the chat must open the number form straight away
 */
const Q = [];
const q = (question, expected, options = {}) => Q.push({ question, expected: [].concat(expected), ...options });
const G = prop.MARKETING_AREA.gross;
const C = prop.MARKETING_AREA.carpet;

// small talk
q('hi', 'greeting'); q('hello', 'greeting'); q('hii', 'greeting'); q('Hello there', 'greeting'); q('good morning', 'greeting'); q('namaste', 'greeting'); q('Jai Shree Ram', 'greeting');
q('thanks', 'thanks'); q('thank you so much', 'thanks'); q('great, thanks', 'thanks'); q('ok', 'ack'); q('okay', 'ack'); q('bye', 'bye'); q('goodbye', 'bye');
q('who are you', 'who'); q('are you a bot', 'who'); q('are you human?', 'who'); q('what is your name', 'who'); q('help', 'help'); q('what can you do', 'help'); q('what can I ask you', 'help');

// the building
q('tell me about shrineva', 'overview'); q('what is this property', 'overview'); q('give me the full details', 'overview'); q('about the project', 'overview');
q('what is the area of each floor', 'areas', { text: G }); q('how big is each floor', 'areas'); q('carpet area', 'areas', { text: C }); q('total built up area', 'areas'); q('plot size', 'plot'); q('size of the floor', 'areas'); q('how much space is there', 'areas'); q('dimensions of the floor', 'areas'); q('area in sq ft', 'areas');
q('how many floors are there', 'floors'); q('number of floors', 'floors'); q('is it G+3', 'floors'); q('how many storeys', 'floors');
q('which floors are available', 'availability'); q('is any floor vacant', 'availability'); q('what is available for lease', ['availability', 'lease-options']); q('availability', 'availability'); q('is space available', 'availability');
q('is the first floor available', 'floor-1', { text: G }); q('1st floor details', 'floor-1'); q('first floor area', 'floor-1'); q('floor 1', 'floor-1');
q('2nd floor', 'floor-2'); q('second floor available?', 'floor-2'); q('floor two', 'floor-2');
q('third floor', 'floor-3'); q('3rd floor details', 'floor-3'); q('top floor', 'floor-3'); q('is the top floor free', 'floor-3');
q('ground floor', 'ground'); q('what is on the ground floor', 'ground'); q('ground floor area', 'ground'); q('is the ground floor available', 'ground'); q('parking level', 'ground');
q('can I take half a floor', 'lease-options'); q('part of a floor', 'lease-options'); q('I want to lease a full floor', 'lease-options'); q('do you give small spaces', 'lease-options'); q('can I lease two floors', 'lease-options'); q('long term lease', 'lease-options'); q('can the floor be divided', 'lease-options');
q('is it furnished', 'condition'); q('will the floor come with interiors', 'condition'); q('can I make changes to my floor', 'condition'); q('what condition are the floors in', 'condition'); q('who does the fit-out', 'condition');
q('is there parking', 'parking'); q('how many cars can park', 'parking'); q('car parking for customers', 'parking'); q('parking capacity', 'parking');
q('bike parking', 'two-wheeler'); q('two wheeler parking', 'two-wheeler'); q('scooter parking space', 'two-wheeler');
q('is there a lift', 'lift'); q('lift capacity', 'lift'); q('how many passengers in the lift', 'lift'); q('staircase width', ['lift', 'fire']);
q('fire exit', 'fire'); q('fire safety', 'fire'); q('is there a fire exit on every floor', 'fire'); q('fire fighting system', ['fire']);
q('is it vastu compliant', 'vastu'); q('vastu', 'vastu');
q('how wide is the road', 'road'); q('which direction does it face', ['road', 'vastu']); q('is it road facing', 'road'); q('what is the road width in front', 'road');
q('signage', 'visibility'); q('can I put a hoarding board', 'visibility'); q('road visibility', 'visibility'); q('frontage', ['visibility', 'road']);

// location
q('where is the property', 'location'); q('address', 'location'); q('how to reach', 'location'); q('google maps location', 'location'); q('send me the location', 'location'); q('where is it located', 'location'); q('directions', 'location');
q('what is nearby', 'nearby'); q('landmarks near the building', 'nearby'); q('nearby places', 'nearby');
q('how far is apollo hospital', ['apollo', 'nearby']); q('apollo', 'apollo'); q('is apollo hospital open', 'apollo');
q('how far is nift', 'nift'); q('NIFT Varanasi', 'nift');
q('varanasi trade centre', 'trade'); q('distance from the ring road', 'ring'); q('how far is the airport', 'airport'); q('distance from railway station', 'railway'); q('varanasi cantt station', 'railway');
q('how far is kashi vishwanath temple', 'temple'); q('distance to sarnath', 'sarnath'); q('ganjari stadium', 'stadium'); q('vardhan hospital', 'vardhan');

// status, documents, services
q('when will it be ready', 'status', { text: 'subject to approvals' }); q('is construction complete', 'status'); q('what is the possession date', 'status'); q('project status', 'status'); q('construction progress', 'status'); q('when can I start my business', 'status'); q('is the building ready', 'status');
q('real photos of the site', 'photos'); q('site photographs', 'photos'); q('can I see current pictures', 'photos');
q('is it vda approved', 'approvals'); q('rera registered', 'approvals'); q('map sanction', 'approvals'); q('are the documents clear', 'approvals'); q('what approvals does it have', 'approvals');
q('power backup', 'power'); q('is a generator available', 'power'); q('electricity load', 'power'); q('how much power load per floor', 'power');
q('water supply', 'water'); q('is there a borewell', 'water'); q('is it centrally air conditioned', 'hvac'); q('is AC provided', 'hvac'); q('internet connectivity', 'internet'); q('fibre broadband available', 'internet');
q('x ray machine floor load', 'loading'); q('how much weight can the floor take', 'loading'); q('loading and unloading of goods', 'loadunload'); q('material delivery', 'loadunload');
q('cctv', 'security'); q('is there a security guard', 'security'); q('is the building secure', 'security');

// money: never a figure, always the leasing team
q('what is the rent', 'rent', { callback: false }); q('rate per sq ft', 'rent'); q('price', 'rent'); q('security deposit', 'rent'); q('how much is the rent for the 2nd floor', 'rent'); q('rent of third floor', 'rent'); q('is the rent negotiable', 'rent'); q('maintenance charges', 'rent'); q('lease rate', 'rent'); q('cost of the floor', 'rent');
q('can I buy a floor', 'sale'); q('is it for sale', 'sale'); q('selling price', ['sale', 'rent']);

// businesses
q('what kind of businesses can lease here', 'businesses'); q('who can take space', 'businesses'); q('which businesses suit this building', 'businesses');
q('can I open a clinic', 'healthcare'); q('dental clinic', 'healthcare'); q('pathology lab', 'healthcare'); q('diagnostic centre', 'healthcare'); q('is it suitable for a hospital', ['other-use', 'healthcare']); q('doctor chamber', 'healthcare'); q('can I run a clinic on the second floor', 'healthcare');
q('bank branch', 'banks'); q('can an ATM be placed', 'banks'); q('NBFC office', 'banks'); q('insurance office', ['banks', 'office']);
q('IT company office', 'office'); q('corporate office space', 'office'); q('coworking space', ['office', 'coaching', 'wellness']); q('CA office', 'office');
q('showroom', 'retail'); q('retail shop', 'retail'); q('boutique', 'retail'); q('mobile showroom', 'retail');
q('restaurant', 'food'); q('can I open a cafe', 'food'); q('QSR outlet', 'food'); q('food court', 'food'); q('kitchen exhaust', 'food');
q('coaching institute', 'coaching'); q('classes for students', 'coaching'); q('training centre', 'coaching');
q('gym', 'wellness'); q('salon', 'wellness'); q('spa', 'wellness'); q('yoga studio', 'wellness');
q('can I run a school', 'other-use'); q('hostel', 'other-use'); q('godown', 'other-use'); q('guest house', 'other-use'); q('can I use it for residence', 'other-use');
// "how is it suitable for ...": the business answer, with the location, the floor, the plans and the contact (checked in 1c)
q('how is this suitable for a bank', 'banks'); q('how is it suitable for a restaurant', 'food'); q('why is this good for a clinic', 'healthcare'); q('is this a good location for a bank', 'banks'); q('is it suitable for a coaching institute', 'coaching');
q('will a cafe work here', 'food'); q('is this right for a showroom', 'retail'); q('how suitable is this for an IT office', 'office'); q('is it good for a gym', 'wellness'); q('can a diagnostic centre run here', 'healthcare'); q('is this a good place for a pathology lab', 'healthcare');
q('how is this suitable for my business', 'businesses'); q('is it suitable for business', 'businesses'); q('will my business work here', 'businesses'); q('what business is best here', 'businesses'); q('how is this location for a restaurant', 'food'); q('is the location good for a bank', 'banks');
q('bank ke liye kaisa rahega', 'banks'); q('restaurant ke liye suitable hai kya', 'food'); q('kya yeh clinic ke liye sahi hai', 'healthcare');
q('बैंक के लिए यह कैसे उपयुक्त है', 'banks', { lang: 'hi' }); q('क्या यह रेस्टोरेंट के लिए अच्छा है', 'food', { lang: 'hi' }); q('क्लिनिक के लिए यह कैसा रहेगा', 'healthcare', { lang: 'hi' }); q('मेरे व्यवसाय के लिए क्या यह उपयुक्त है', 'businesses', { lang: 'hi' }); q('कोचिंग के लिए उपयुक्त है क्या', 'coaching', { lang: 'hi' });
// footfall: always "potential", never a count
q('what is the footfall here', 'footfall'); q('is it a busy area', 'footfall'); q('will I get customers here', 'footfall'); q('high footfall?', 'footfall'); q('footfall potential', 'footfall'); q('how is the footfall', 'footfall'); q('is this a crowded area', 'footfall');
q('फुटफॉल कैसा है', 'footfall', { lang: 'hi' }); q('यहाँ ग्राहक आएँगे क्या', 'footfall', { lang: 'hi' }); q('इलाके में भीड़ कैसी रहती है', 'footfall', { lang: 'hi' });
q('ring road', 'ring'); q('how far is the ring road', ['ring', 'nearby'], { any: true }); q('is the ring road close', ['ring', 'nearby'], { any: true }); q('रिंग रोड कितनी दूर है', ['ring', 'nearby'], { lang: 'hi', any: true });

// plans, media, actions
q('floor plan', 'floorplans'); q('can I see the plan', 'floorplans'); q('2D plan', 'floorplans'); q('architect drawing', 'floorplans'); q('layout', ['floorplans', 'areas']);
q('see the floor in 3D', 'explorer'); q('rotate the plan', 'explorer'); q('top view of the floor', 'explorer'); q('can I view it from all angles', 'explorer'); q('interactive 3d plan', 'explorer'); q("bird's eye view", 'explorer'); q('how do I use the building explorer', 'explorer');
q('virtual tour', 'walkthrough'); q('3D walkthrough', 'walkthrough'); q('renders', 'walkthrough'); q('how will it look', 'walkthrough'); q('show me the elevation', 'walkthrough');
q('send me the brochure', 'brochure'); q('download pdf', 'brochure'); q('brochure', 'brochure'); q('send details on whatsapp', ['brochure', 'contact']);
q('specifications', 'spec'); q('amenities', 'spec'); q('what facilities are there', 'spec'); q('key features', 'spec');
q('what are the specifications', 'spec'); q('full specification sheet', 'spec'); q('building specification', 'spec-building'); q('site specification', 'spec-site'); q('access and safety', 'spec-access'); q('project specification', 'spec-project'); q('specifications of the building', 'spec-building'); q('site details', 'spec-site'); q('safety specifications', 'spec-access');
q('स्पेसिफिकेशन बताइए', 'spec', { lang: 'hi' }); q('बिल्डिंग स्पेसिफिकेशन', 'spec-building', { lang: 'hi' }); q('साइट स्पेसिफिकेशन', 'spec-site', { lang: 'hi' });
q('I want to visit', 'visit'); q('site visit', 'visit'); q('can I visit on sunday', 'visit'); q('book an appointment', 'visit'); q('schedule a visit', 'visit'); q('visiting hours', 'visit');
q('contact number', 'contact'); q('phone number', 'contact'); q('email id', 'contact'); q('whatsapp number', 'contact');
q('call me back', 'callback', { callback: true }); q('talk to someone', 'callback', { callback: true }); q('please call me', 'callback', { callback: true }); q('I want to speak to the owner', ['callback', 'ownership']); q('have the leasing team contact me', 'callback', { callback: true });
q('who is the owner', 'ownership'); q('who owns this building', 'ownership'); q('who is the developer', 'ownership');
q('I am a broker', 'broker'); q('brokerage commission', ['broker', 'rent']); q('I have a client for a floor', 'broker');
q('hindi', 'language'); q('can you speak hindi', 'language'); q('privacy policy', 'privacy'); q('is my data safe', 'privacy');

// a requirement in square feet is checked against the real floor sizes
q('I need 2000 sq ft', 'area-fit', { text: 'fits within one floor' }); q('looking for 1500 sqft for my clinic', 'area-fit'); q('need 800 sq ft office', 'area-fit', { text: 'part of a floor' });
q('3300 sq ft required', 'area-fit', { text: 'close to one full floor' }); q('5000 sq ft', 'area-fit', { text: 'more than one floor' }); q('I want 8000 sqft', 'area-fit', { text: 'more than one floor' }); q('12000 sq ft', 'area-fit', { text: 'more than the three upper floors' });
q('300 sq m', 'area-fit'); q('1000 to 1500 sq ft', 'area-fit');

// typos and short forms
q('parkng', 'parking'); q('availabilty', 'availability'); q('brochur', 'brochure'); q('locaton', 'location'); q('restarant', 'food'); q('specifcation', 'spec'); q('ground flor', 'ground'); q('secnd floor', 'floor-2', { any: true }); q('wat is the rent', 'rent'); q('whts the area', 'areas'); q('plz send brochure', 'brochure'); q('hw far is apolo', ['apollo', 'nearby'], { any: true });

// Hindi
q('नमस्ते', 'greeting', { lang: 'hi' }); q('पहली मंज़िल खाली है?', 'floor-1', { lang: 'hi' }); q('तीसरी मंजिल उपलब्ध है क्या', 'floor-3', { lang: 'hi' }); q('दूसरी मंज़िल का क्षेत्रफल कितना है', 'floor-2', { lang: 'hi' }); q('ग्राउंड फ्लोर पर क्या है', 'ground', { lang: 'hi' });
q('किराया कितना है', 'rent', { lang: 'hi' }); q('पार्किंग है क्या', 'parking', { lang: 'hi' }); q('लिफ्ट है', 'lift', { lang: 'hi' }); q('ब्रोशर भेजो', 'brochure', { lang: 'hi' }); q('यह कहाँ है', 'location', { lang: 'hi' }); q('पता बताइए', 'location', { lang: 'hi' });
q('कब तक तैयार होगा', 'status', { lang: 'hi' }); q('क्षेत्रफल कितना है', 'areas', { lang: 'hi' }); q('क्या यहाँ क्लिनिक खुल सकता है', 'healthcare', { lang: 'hi' }); q('बैंक के लिए जगह चाहिए', 'banks', { lang: 'hi' }); q('कोचिंग सेंटर', 'coaching', { lang: 'hi' }); q('रेस्टोरेंट खोलना है', 'food', { lang: 'hi' });
q('साइट विज़िट करनी है', 'visit', { lang: 'hi' }); q('मुझे फोन करो', 'callback', { lang: 'hi', callback: true }); q('आपका नंबर क्या है', 'contact', { lang: 'hi' }); q('अपोलो अस्पताल कितनी दूर है', ['apollo', 'nearby'], { lang: 'hi', any: true }); q('एयरपोर्ट से दूरी', 'airport', { lang: 'hi' });
q('मंज़िलें कितनी हैं', 'floors', { lang: 'hi' }); q('फ़्लोर प्लान दिखाओ', 'floorplans', { lang: 'hi' }); q('3D में देखना है', ['explorer', 'floorplans', 'walkthrough'], { lang: 'hi' }); q('हिंदी में बात करो', 'language', { lang: 'hi' }); q('धन्यवाद', 'thanks', { lang: 'hi' });
q('मुझे 2000 वर्ग फुट चाहिए', 'area-fit', { lang: 'hi' }); q('VDA से मंज़ूर है?', 'approvals', { lang: 'hi' });
// Hinglish
q('rent kitna hai', 'rent'); q('parking hai kya', 'parking'); q('brochure bhejo', 'brochure'); q('kitna bada hai', 'areas'); q('second floor milega', 'floor-2'); q('location kya hai', 'location'); q('visit karna hai', 'visit'); q('call karo', 'callback', { callback: true }); q('yaha clinic khul sakta hai', 'healthcare'); q('kab tak ready hoga', 'status'); q('aapka number do', 'contact'); q('pehli manzil available hai', 'floor-1'); q('lift hai kya', 'lift'); q('hospital ke samne hai', ['apollo', 'location', 'nearby'], { any: true });

// two-part questions are answered by both entries
q('rent of the third floor and is parking available', ['rent', 'parking'], { any: true }); q('how far is nift and is there a lift', ['nift', 'lift'], { any: true });

// not covered: an honest "not confirmed", never an invented answer
q('how many washrooms per floor', 'water'); q('what is the ceiling height of the ground floor', 'height', { text: '9.5' }); q('ceiling height', 'height'); q('what is the height of the building', 'height'); q('floor to floor height', 'height'); q('how high is each floor', 'height');
for (const x of ["what's the weather today", 'tell me a joke', 'asdfgh', 'who won the cricket match', 'capital of france', 'can I bring my dog', 'is there a canteen', 'do you have a swimming pool', 'what is the population of varanasi']) q(x, 'unknown');
q('???', 'unknown'); q('2000', 'unknown', { allow: ['area-fit'] }); q('        ', 'unknown');

let passed = 0;
for (const c of Q) {
  let r;
  try { r = eng.replyToText(c.question); } catch (e) { fail(`question "${c.question}" threw: ${e.message}`); continue; }
  const got = r.ids || [];
  const ok = c.expected.includes(got[0]) || (c.any && got.some((id) => c.expected.includes(id))) || (c.allow || []).includes(got[0]);
  if (!ok) { fail(`question "${c.question}": expected ${c.expected.join(' / ')}, got ${got.join(', ') || '(nothing)'}`); continue; }
  if (c.lang && r.lang !== c.lang) { fail(`question "${c.question}": expected a ${c.lang} answer, got ${r.lang}`); continue; }
  if (c.callback !== undefined && r.callback !== c.callback) { fail(`question "${c.question}": callback form flag is ${r.callback}, expected ${c.callback}`); continue; }
  const must = [].concat(c.text || []);
  const miss = must.find((t) => !r.text.includes(t));
  if (miss) { fail(`question "${c.question}": the answer should contain "${miss}"`); continue; }
  if (c.expected[0] === 'unknown' && r.matched) { fail(`question "${c.question}": answered although nothing matches (${got.join(', ')})`); continue; }
  passed++;
  if (verbose) console.log(`✓ ${c.question.padEnd(48)} → ${got.join(', ')}`);
}

// ── 1b. The specification sheet ─────────────────────────────────────────────────────────────────────────
/**
 * One line per row of the specification sheet, keyed by the row's label (config/content.config.ts SPEC_GROUPS):
 *   to  the entry that must answer;   q  what visitors ask (English, Hinglish, Hindi: a Devanagari question must come back in Hindi);
 *   en / hi  words (besides figures) the English / Hindi answer must contain.
 * The figures of the row's own value (every number, measurement such as 5′-3″, and "12+") are read from the sheet and must be in BOTH
 * the English and the Hindi answer: a wrong or stale figure anywhere stops the build.
 */
const SPEC = {
  'Project': { to: 'overview', q: ['what is the project name', 'name of the building', 'project kya hai'], en: ['SHRINEVA', 'Bada Lalpur', 'Varanasi'], hi: ['SHRINEVA', 'वाराणसी'] },
  'Status': { to: 'status', q: ['is the project under construction', 'what is the construction status', 'क्या यह निर्माणाधीन है'], en: ['under construction'], hi: ['निर्माणाधीन'] },
  'Target completion': { to: 'status', q: ['target completion', 'when is the target completion date', 'completion date'], en: ['March 2027', 'subject to approvals'], hi: ['मार्च 2027', 'अनुमतियों के अधीन'] },
  'Approval': { to: 'approvals', q: ['is it vda approved', 'what approval does the project have'], en: ['VDA approved'], hi: ['VDA'], optional: true },
  'Orientation': { to: 'vastu', q: ['is it vastu compliant', 'what is the orientation of the building', 'वास्तु अनुकूल है क्या'], en: ['Vastu compliant'], hi: ['वास्तु अनुकूल'] },
  'Plot area': { to: 'plot', q: ['what is the plot area', 'plot size in sq m', 'प्लॉट का क्षेत्रफल कितना है'], en: ['plot'], hi: ['प्लॉट'] },
  'Road': { to: 'road', q: ['how wide is the road', 'what is the road width', 'सड़क कितनी चौड़ी है'], en: ['north'], hi: ['उत्तर'] },
  'Frontage': { to: 'road', q: ['how much frontage is there', 'what is the road frontage', 'फ्रंटेज कितना है'], en: ['frontage'], hi: ['फ्रंटेज'] },
  'Setbacks': { to: 'setbacks', q: ['what are the setbacks', 'front setback', 'side setbacks', 'सेटबैक कितना है'], en: ['front', 'rear', 'east', 'west'], hi: ['आगे', 'पीछे', 'पूर्व', 'पश्चिम'] },
  'Configuration': { to: 'floors', q: ['what is the building configuration', 'ground plus three floors', 'how many floors are there', 'मंज़िलें कितनी हैं'], en: ['parking', 'three'], hi: ['पार्किंग', 'तीन'] },
  'Gross floor area': { to: 'areas', q: ['gross floor area', 'what is the gross area of each floor', 'ग्रॉस एरिया कितना है'], en: ['gross'], hi: ['ग्रॉस'] },
  'Carpet floor area': { to: 'areas', q: ['carpet floor area', 'what is the carpet area per floor', 'कारपेट एरिया कितना है'], en: ['carpet'], hi: ['कारपेट'] },
  'Floor to floor': { to: 'height', q: ['floor to floor height', 'what is the height between floors', 'मंज़िल की ऊँचाई कितनी है'], en: ['Floor to floor', 'ground'], hi: ['ग्राउंड'] },
  'Floor plate': { to: 'floorplate', q: ['is the floor open plan', 'flexible tenant layouts', 'are there columns on the floor', 'क्या खुला प्लान है'], en: ['open plan', 'flexible'], hi: ['खुले प्लान', 'लेआउट'] },
  'Front': { to: 'glass-front', q: ['is there a glass front', 'glass facade', 'natural light and windows', 'काँच का फ्रंट है क्या'], en: ['glass front'], hi: ['काँच'] },
  'Condition': { to: 'condition', q: ['is it an open shell', 'will the tenant do the fit-out', 'ओपन शेल है क्या'], en: ['open shell'], hi: ['ओपन शेल'] },
  'Parking': { to: 'parking', q: ['how many cars can park', 'is the parking covered', 'पार्किंग है क्या'], en: ['covered', 'ground level'], hi: ['कवर्ड', 'ग्राउंड'] },
  'Passenger lift': { to: 'lift', q: ['how many passengers can the lift carry', 'is there a passenger lift', 'लिफ्ट कितने लोगों की है'], en: ['10-passenger'], hi: ['10 यात्रियों'] },
  'Lift and stair lobby': { to: 'lift', q: ['where is the lift lobby', 'where is the lift and stair core', 'लिफ्ट कहाँ है'], en: ['east side', 'walkways'], hi: ['पूर्व', 'पैदल'] },
  'Staircase': { to: 'lift', q: ['how wide is the staircase', 'staircase width', 'सीढ़ी कितनी चौड़ी है'], en: ['staircase'], hi: ['सीढ़ी'] },
  'Fire escape': { to: 'fire', q: ['is there a fire escape', 'fire exit on every floor', 'फायर एक्ज़िट है क्या'], en: ['every level', 'fire exit'], hi: ['हर स्तर', 'फायर एक्ज़िट'] },
  'Open sides': { to: 'setbacks', q: ['is the building open on all sides', 'open sides', 'क्या चारों तरफ खुला है'], en: ['all four sides'], hi: ['चारों ओर'] },
};
/** The items the sheet does NOT state (ASK_ITEMS): answered as "not confirmed yet", never as a feature. */
const ASK = {
  'Fire-fighting systems and clearances': { to: 'fire', q: ['what fire fighting systems are installed', 'fire fighting clearances'] },
  'Power and backup supply': { to: 'power', q: ['is there power backup', 'what is the electrical load per floor', 'बिजली बैकअप है क्या'] },
  'Water supply and washrooms': { to: 'water', q: ['how many washrooms per floor', 'is water supply available', 'वॉशरूम कितने हैं'] },
  'Air-conditioning provision': { to: 'hvac', q: ['is central air conditioning provided', 'ac provision'] },
  'Fibre and connectivity': { to: 'internet', q: ['is fibre internet available', 'broadband connectivity'] },
  'Floor loading': { to: 'loading', q: ['what is the floor loading', 'how much weight can the floor carry'] },
  'Signage permissions': { to: 'visibility', q: ['are signage permissions given', 'can I put a signboard on the facade'] },
  'Loading and unloading': { to: 'loadunload', q: ['loading and unloading arrangements', 'where do delivery trucks unload'] },
};
const figuresOf = (t) => [...new Set(t.match(/\d+′-\d+½?″|\d+(?:,\d{3})*\+?/g) || [])];
const specTable = [];
{
  const rows = content.SPEC_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));
  const seenLabels = new Set(rows.map((r) => r.label));
  for (const r of rows) if (!SPEC[r.label]) fail(`specification row "${r.group} / ${r.label}" has no ChaiX question: add it to SPEC in scripts/test-chaix.js and teach config/chaix.knowledge.ts`);
  for (const [label, d] of Object.entries(SPEC)) if (!seenLabels.has(label) && !d.optional) fail(`SPEC lists "${label}" but the specification sheet has no such row any more`);
  for (const r of rows) {
    const d = SPEC[r.label];
    if (!d) continue;
    const figs = figuresOf(r.value);
    const en = eng.replyToId(d.to, 'en').text;
    const hi = eng.replyToId(d.to, 'hi').text;
    for (const f of figs) {
      if (!en.includes(f)) fail(`spec "${r.label}": the English answer of "${d.to}" does not carry the sheet's figure "${f}" (sheet: ${r.value})`);
      if (!hi.includes(f)) fail(`spec "${r.label}": the Hindi answer of "${d.to}" does not carry the sheet's figure "${f}" (sheet: ${r.value})`);
    }
    for (const w of d.en) if (!en.toLowerCase().includes(w.toLowerCase())) fail(`spec "${r.label}": the English answer of "${d.to}" should contain "${w}"`);
    for (const w of d.hi) if (!hi.includes(w)) fail(`spec "${r.label}": the Hindi answer of "${d.to}" should contain "${w}"`);
    for (const question of d.q) {
      const a = eng.replyToText(question);
      const isHi = /[ऀ-ॿ]/.test(question);
      if (!a.ids.includes(d.to) || (a.ids[0] !== d.to && a.ids.length === 1)) fail(`spec "${r.label}": question "${question}" should reach "${d.to}", got ${a.ids.join(', ') || '(nothing)'}`);
      if (isHi && a.lang !== 'hi') fail(`spec "${r.label}": the Hindi question "${question}" was not answered in Hindi`);
      const text = a.text;
      for (const f of figs) if (a.ids.includes(d.to) && !text.includes(f)) fail(`spec "${r.label}": the answer to "${question}" is missing the sheet's figure "${f}"`);
      specTable.push([`${r.group} / ${r.label}`, r.value, question, a.ids.join(' + '), isHi ? 'hi' : 'en']);
    }
  }
  // the grouped answers carry every row of their group (English is read from the sheet; Hindi is written by hand and checked here)
  const GROUP_ENTRY = { 'Project': 'spec-project', 'Site': 'spec-site', 'Building': 'spec-building', 'Access and safety': 'spec-access' };
  for (const g of content.SPEC_GROUPS) {
    const id = GROUP_ENTRY[g.title];
    if (!id) { fail(`specification group "${g.title}" has no grouped ChaiX entry (add it to GROUP_ENTRY here and to chaix.knowledge.ts)`); continue; }
    for (const lang of ['en', 'hi']) {
      const t = eng.replyToId(id, lang).text;
      for (const it of g.items) for (const f of figuresOf(it.value)) if (!t.includes(f)) fail(`grouped answer "${id}" (${lang}) is missing "${f}" (${g.title} / ${it.label})`);
    }
    for (const it of g.items) if (!eng.replyToId(id, 'en').text.includes(it.value)) fail(`grouped answer "${id}" (en) does not show "${it.label}: ${it.value}" as on the sheet`);
    for (const question of [`${g.title.toLowerCase()} specification`, `specification of the ${g.title.toLowerCase()}`].filter((x) => g.title !== 'Access and safety' || x.startsWith('access'))) {
      const a = eng.replyToText(g.title === 'Access and safety' ? 'access and safety specification' : question);
      if (a.ids[0] !== id) fail(`question "${question}" should reach "${id}", got ${a.ids.join(', ') || '(nothing)'}`);
    }
  }
  // not confirmed yet: always said so, never a figure
  const askRows = new Set(content.ASK_ITEMS);
  for (const item of content.ASK_ITEMS) if (!ASK[item]) fail(`"${item}" (ASK_ITEMS) has no ChaiX question: add it to ASK in scripts/test-chaix.js`);
  for (const [item, d] of Object.entries(ASK)) {
    if (!askRows.has(item)) { fail(`ASK lists "${item}" but ASK_ITEMS has no such item any more`); continue; }
    for (const lang of ['en', 'hi']) {
      const t = eng.replyToId(d.to, lang).text;
      if (!(lang === 'en' ? /not confirmed yet|still being confirmed/i : /तय नहीं|तय की जा रही/).test(t)) fail(`"${item}": the ${lang} answer of "${d.to}" must say it is not confirmed yet`);
    }
    for (const question of d.q) {
      const a = eng.replyToText(question);
      if (!a.ids.includes(d.to)) fail(`"${item}": question "${question}" should reach "${d.to}", got ${a.ids.join(', ') || '(nothing)'}`);
      if (/[ऀ-ॿ]/.test(question) && a.lang !== 'hi') fail(`"${item}": the Hindi question "${question}" was not answered in Hindi`);
      specTable.push([`Not confirmed / ${item}`, '(not on the sheet)', question, a.ids.join(' + '), /[ऀ-ॿ]/.test(question) ? 'hi' : 'en']);
    }
  }
}
if (process.argv.includes('--spec')) {
  console.log('\nSpecification coverage (sheet row | sheet value | question | answered by | language):');
  for (const row of specTable) console.log('  ' + row.join(' | '));
  console.log('');
}

// ── 1c. The business answers ──────────────────────────────────────────────────────────────────────────────────────────
{
  const FTF = (/Ground about (\S+) · Floors about (\S+)/.exec(content.SPEC_GROUPS.flatMap((g) => g.items).find((i) => i.label === 'Floor to floor').value));
  const ring = prop.PROPERTY.locationAnchors.find((a) => a.name.startsWith('Varanasi Ring')).distanceDisplay.replace(/^≈\s*/, '');
  const park = /(\d+\+?)\s*cars/.exec(content.SPEC_GROUPS.flatMap((g) => g.items).find((i) => i.label === 'Parking').value)[1];
  const MUST = {
    en: [[/footfall potential/, 'the words "footfall potential"'], [/Apollo Hospital/, 'the Apollo Hospital'], [/upcoming/, '"upcoming"'], [/under construction/, '"under construction"'], [/NIFT/, 'NIFT'], [/Trade Centre/, 'the Trade Centre'], [/Ring Road/, 'the Ring Road'], [new RegExp(ring.replace(/\s/g, '\\s')), `the Ring Road distance (${ring})`],
      [/24 m wide road/, 'the 24 m road'], [new RegExp(FTF[2].replace(/[′″]/g, '.')), `the upper floor-to-floor height (${FTF[2]})`], [new RegExp(FTF[1].replace(/[′″]/g, '.')), `the ground floor-to-floor height (${FTF[1]})`], [/open floor plate/i, 'the open floor plate'], [/glass front/i, 'the glass front'],
      [new RegExp(park.replace('+', '\\+') + ' cars'), `parking (${park} cars)`], [/10-passenger lift/i, 'the 10-passenger lift'], [/fire exit/i, 'the fire exit'], [/floor plans/, 'the floor plans'], [/3D explorer/, 'the 3D explorer'], [/columns are marked/, 'the note that columns are marked on the plans'],
      [/subject to floor suitability and approvals/i, 'the approvals line'], [/send your question to the team/, '"send your question to the team"'], [new RegExp(prop.PROPERTY.contact.phoneDisplay.replace(/\+/g, '\\+')), 'the phone number'], [new RegExp(prop.PROPERTY.contact.publicEmail.replace(/\./g, '\\.')), 'the email']],
    hi: [[/उच्च फुटफॉल संभावना/, '"उच्च फुटफॉल संभावना"'], [/Apollo Hospital/, 'Apollo Hospital'], [/निर्माणाधीन/, '"निर्माणाधीन"'], [/NIFT/, 'NIFT'], [/ट्रेड सेंटर/, 'the Trade Centre'], [/रिंग रोड/, 'the Ring Road'], [new RegExp(ring.replace(' km', ' किमी').replace(/\s/g, '\\s')), `the Ring Road distance (${ring})`],
      [/24 मीटर चौड़ी सड़क/, 'the 24 m road'], [new RegExp(FTF[2].replace(/[′″]/g, '.')), `the upper floor-to-floor height (${FTF[2]})`], [new RegExp(FTF[1].replace(/[′″]/g, '.')), `the ground floor-to-floor height (${FTF[1]})`], [/खुली फ़्लोर प्लेट/, 'the open floor plate'], [/काँच का फ्रंट/, 'the glass front'],
      [new RegExp(park.replace('+', '\\+') + ' कारों'), `parking (${park} cars)`], [/10 यात्रियों की लिफ्ट/, 'the 10-passenger lift'], [/फायर एक्ज़िट/, 'the fire exit'], [/फ़्लोर प्लान/, 'the floor plans'], [/3D एक्सप्लोरर/, 'the 3D explorer'], [/कॉलम दर्शाए/, 'the note that columns are marked on the plans'],
      [/उपयुक्तता और अनुमतियों के अधीन/, 'the approvals line'], [/अपना सवाल टीम को भेजिए/, '"send your question to the team"'], [new RegExp(prop.PROPERTY.contact.phoneDisplay.replace(/\+/g, '\\+')), 'the phone number'], [new RegExp(prop.PROPERTY.contact.publicEmail.replace(/\./g, '\\.')), 'the email']],
  };
  // "other use" (hostel, school …) has no footfall line: footfall is beside the point there, and the answer says the use is confirmed by the team
  const SKIP_OTHER = new Set(['footfall potential', 'the words "footfall potential"', '"उच्च फुटफॉल संभावना"', 'the Trade Centre', 'the Ring Road', 'NIFT', 'the Apollo Hospital', 'Apollo Hospital', '"upcoming"', '"under construction"', '"निर्माणाधीन"']);
  const isSkipped = (id, what) => id === 'other-use' && (SKIP_OTHER.has(what) || /^the Ring Road distance|^the 24 m road/.test(what));
  for (const id of kb.SUIT_IDS) {
    const e = kb.KB.find((x) => x.id === id);
    if (!e) { fail(`business entry "${id}" is not in the knowledge base`); continue; }
    for (const lang of ['en', 'hi']) {
      const t = e.a[lang];
      for (const [re, what] of MUST[lang]) if (!isSkipped(id, what) && !re.test(t)) fail(`business answer "${id}" (${lang}) is missing ${what}`);
      const labels = lang === 'en' ? ['Location', 'Floor', 'Parking and access', 'Next step'] : ['लोकेशन', 'मंज़िल', 'पार्किंग और पहुँच', 'अगला कदम'];
      const order = labels.map((x) => `**${x}**`);
      const at = order.map((o) => t.indexOf(o));
      const want = id === 'other-use' ? at.slice(1) : at;
      if (want.some((i) => i < 0) || want.some((i, k) => k && i < want[k - 1])) fail(`business answer "${id}" (${lang}) must give the parts in this order: ${order.join(' → ')}`);
      // every part is point-wise: its label is followed by a point
      const lines = t.split('\n');
      for (const [k, label] of order.entries()) {
        if (id === 'other-use' && k === 0) continue;
        const i = lines.indexOf(label);
        if (i >= 0 && !(lines[i + 1] || '').startsWith('• ')) fail(`business answer "${id}" (${lang}): the part ${label} must be points ("• …")`);
      }
      // the business's own part sits between "Parking and access" and "Next step"
      if (id !== 'businesses' && id !== 'other-use') {
        const own = lines.findIndex((l, i) => /^\*\*/.test(l) && i > lines.indexOf(order[2]) && i < lines.indexOf(order[3]));
        if (own < 0 || !(lines[own + 1] || '').startsWith('• ')) fail(`business answer "${id}" (${lang}) has no part of its own (a **For …** label with points) between ${order[2]} and ${order[3]}`);
      }
    }
    const kinds = (e.actions || []).map((a) => a.kind + ':' + (a.href || ''));
    for (const need of ['route:/floor-plans', 'route:/#explorer', 'callback:']) if (!kinds.includes(need)) fail(`business answer "${id}": missing the action ${need}`);
  }
  // asking about a business reaches ITS answer, in both languages, and the chat gets the three buttons
  for (const [question, id] of [['how is this suitable for a bank', 'banks'], ['why is this good for a restaurant', 'food'], ['बैंक के लिए यह कैसे उपयुक्त है', 'banks']]) {
    const r = eng.replyToText(question);
    if (r.ids.length !== 1 || r.ids[0] !== id) fail(`"${question}" must be answered by "${id}" alone, got ${r.ids.join(' + ')}`);
    if (r.actions.length !== 3 || r.actions[2].kind !== 'callback') fail(`"${question}": the answer should end with the "send my question to the team" button (got ${r.actions.map((a) => a.kind).join(', ')})`);
    if (r.chips.some((c) => c.id === 'callback')) fail(`"${question}": the callback button and the callback chip are both shown`);
  }
  // two businesses in one question: one full answer, the other offered as a follow-up
  const two = eng.replyToText('how is this suitable for a bank or a restaurant');
  const bizIds = two.ids.filter((x) => kb.SUIT_IDS.has(x));
  if (bizIds.length !== 1) fail(`"bank or a restaurant" should get one business answer, got ${two.ids.join(' + ')}`);
  const wanted = bizIds[0] === 'banks' ? 'food' : 'banks';
  if (!two.chips.some((c) => c.id === wanted)) fail(`"bank or a restaurant": the other business ("${wanted}") should be offered as a follow-up chip (chips: ${two.chips.map((c) => c.id).join(', ')})`);
  // a business next to another topic does not double the bubble: "rent for a restaurant" is the rent answer, with the restaurant one offered
  const rr = eng.replyToText('rent for a restaurant');
  if (rr.ids.some((x) => kb.SUIT_IDS.has(x))) fail(`"rent for a restaurant" should be answered by the rent entry alone, got ${rr.ids.join(' + ')}`);
  // the landmark entries say "potential", and the Ring Road is among the landmarks
  for (const id of ['footfall', 'apollo', 'nift', 'trade', 'ring']) for (const lang of ['en', 'hi']) {
    const t = kb.KB.find((x) => x.id === id).a[lang];
    if (!(lang === 'en' ? /footfall potential/ : /फुटफॉल संभावना/).test(t)) fail(`landmark answer "${id}" (${lang}) should speak of footfall potential`);
    if (id !== 'footfall' || true) if (!(lang === 'en' ? /Ring Road/ : /रिंग रोड/).test(t)) fail(`landmark answer "${id}" (${lang}) should name the Ring Road`);
  }
}

// ── 2. The knowledge base ──────────────────────────────────────────────────────────────────────────────────────────────
// the ground-level answer is both a topic entry and the floor answer for "ground floor": one entry, listed once
const entries = [...kb.KB, ...Object.values(kb.FLOOR_ENTRIES).filter((f) => !kb.KB.some((e) => e.id === f.id))];
const ids = new Set(entries.map((e) => e.id));
const wordCount = (t) => t.replace(/\*\*/g, '').split(/\s+/).filter((w) => w && w !== '•').length;
const MAX_WORDS = 95;       // a chat bubble on a phone: longer answers are split into two entries
const MAX_WORDS_SUIT = { en: 195, hi: 215 }; // the business answers: location, floor, parking, the business, plans and contact (Hindi runs longer for the same facts)
const seenId = new Set();
for (const e of entries) {
  if (seenId.has(e.id)) fail(`entry id "${e.id}" is used twice`);
  seenId.add(e.id);
  if (!e.title) fail(`entry ${e.id}: no title`);
  if (!e.a || !e.a.en || !e.a.en.trim()) fail(`entry ${e.id}: no English answer`);
  if (!e.a || !e.a.hi || !e.a.hi.trim()) fail(`entry ${e.id}: no Hindi answer`);
  for (const lang of ['en', 'hi']) {
    const t = (e.a && e.a[lang]) || '';
    const cap = kb.SUIT_IDS.has(e.id) ? MAX_WORDS_SUIT[lang] : MAX_WORDS;
    if (wordCount(t) > cap) fail(`entry ${e.id}: the ${lang} answer has ${wordCount(t)} words (max ${cap}); split it`);
    if (((t.match(/\*\*/g) || []).length) % 2) fail(`entry ${e.id}: the ${lang} answer has an unclosed ** (bold marker)`);
    if (/\$\{|undefined|\[object|NaN/.test(t)) fail(`entry ${e.id}: the ${lang} answer has a template left-over: ${t.slice(0, 80)}`);
    if (/\s{2,}(?!\n)/.test(t.replace(/\n/g, ' ').replace(/ {2}/g, '  ').slice(0, 0))) fail(`entry ${e.id}: spacing`);
  }
  for (const n of e.next || []) if (!ids.has(n)) fail(`entry ${e.id}: follow-up "${n}" is not an entry`);
  if ((e.next || []).includes(e.id)) fail(`entry ${e.id}: lists itself as a follow-up`);
  if (!['ground', 'floor-1', 'floor-2', 'floor-3'].includes(e.id) && !(e.keys || []).length) fail(`entry ${e.id}: no keys`);
}
// the pinned "Most asked" questions: real entries, a label in both languages, and the label typed in must reach the same answer
{
  const pin = kb.PINNED;
  if (new Set(pin.map((p) => p.id)).size !== pin.length) fail('PINNED has a repeat');
  if (pin.length < 8 || pin.length > 12) fail(`PINNED has ${pin.length} questions: keep it between 8 and 12 so the strip stays a short list of the most common ones`);
  for (const p of pin) {
    if (!ids.has(p.id)) { fail(`pinned question "${p.id}" is not an entry`); continue; }
    for (const lang of ['en', 'hi']) {
      if (!p.q[lang] || !p.q[lang].trim()) { fail(`pinned question "${p.id}" has no ${lang} label`); continue; }
      if (wordCount(p.q[lang]) > 8) fail(`pinned question "${p.id}" (${lang}) is too long for a chip: "${p.q[lang]}"`);
      const r = eng.replyToText(p.q[lang], lang);
      if (!r.ids.includes(p.id)) fail(`pinned question "${p.q[lang]}" (${lang}) typed into the chat reaches ${r.ids.join(', ')}, not "${p.id}"`);
      if (lang === 'hi' && r.lang !== 'hi') fail(`pinned question "${p.q[lang]}" is not answered in Hindi`);
    }
  }
  for (const lang of ['en', 'hi']) if (eng.pinned(lang).length !== pin.length) fail(`pinned(${lang}) returns ${eng.pinned(lang).length} chips for ${pin.length} questions`);
  if (eng.greeting('en').chips.length || eng.greeting('hi').chips.length) fail('the greeting should carry no chips of its own: the pinned strip shows the common questions');
}
// every reply can be asked for by id (chips) and has something to offer next in both languages
for (const e of entries) {
  for (const lang of ['en', 'hi']) {
    const r = eng.replyToId(e.id, lang);
    if (r.ids[0] !== e.id) fail(`replyToId(${e.id}, ${lang}) answered ${r.ids[0]}`);
    if (!r.chips.length && !r.actions.length && !['bye', 'thanks'].includes(e.id)) fail(`entry ${e.id}: no follow-up chip or action in ${lang} (add chips or actions)`);
  }
}
// no key swallowed by another entry: a key typed alone must land on its own entry (the few shared words are listed on purpose)
const SHARED = {
  // key phrase → the entries that may legitimately answer it instead (a word that two entries both use; the more likely meaning wins)
  direction: ['location'],       // "directions" (how to get there) and "direction" (which way it faces) are the same word after cleaning
  students: ['coaching'],
  dekhna: ['visit'],
};
const swallowed = [];
for (const e of kb.KB) {
  for (const k of e.keys) {
    const plain = k.replace(/^~/, '');
    const r = eng.replyToText(plain);
    if (r.ids.includes(e.id)) continue;
    if ((SHARED[plain] || []).some((id) => r.ids.includes(id))) continue;
    swallowed.push(`"${plain}" (${e.id}) → ${r.ids.join(', ')}`);
  }
}
// Soft entries (hi, ok, thanks) are allowed to lose a few bare words; everything else must be reachable.
const softIds = new Set(['greeting', 'thanks', 'bye', 'ack']);
const hardSwallowed = swallowed.filter((s) => !softIds.has(/\((.*?)\)/.exec(s)[1]));
if (hardSwallowed.length) {
  fail(`${hardSwallowed.length} key phrase(s) are answered by another entry (remove the key, make it longer, or list it in SHARED):\n    ${hardSwallowed.join('\n    ')}`);
}

// ── 3. Wording ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const vda = prop.PROPERTY.approvals && prop.PROPERTY.approvals.vda;
const TARGET = content.PROJECT_STATUS.completion.value;           // "March 2027"
const FORBIDDEN = [
  [/₹|\brupees?\b|\brs\.?\s?\d|\binr\b|\blakhs?\b|\bcrores?\b|\bper ?month\b|\bper ?sq\.? ?ft\b|\bper ?square\b|\bmonthly\b|\bsecurity deposit\b|\b\d[\d,]*\s?(?:\/-|only)\b/i, 'a rent, price or deposit figure (the owner wants none published)'],
  [/रुपय|रूपय|लाख|करोड़|प्रति माह|प्रतिमाह|सिक्योरिटी डिपॉज़िट|\bसिक्योरिटी डिपोजिट/, 'a rent, price or deposit figure in Hindi'],
  [/column[- ]?free|pillar[- ]?free|without (any )?columns|कॉलम[- ]?फ्री|स्तंभ[- ]?मुक्त|बिना (किसी )?(कॉलम|खंभ)/i, '"column-free" claim (the plans show columns)'],
  [/(?<!\bno )\bfootfalls?\b(?! potential)/i, '"footfall" other than "footfall potential" or "no footfall figures" (potential only: never a count or a promise)'],
  [/फुटफॉल(?! संभावना| की संभावना| का कोई आँकड़ा)/, '"फुटफॉल" other than "फुटफॉल संभावना" or "फुटफॉल का कोई आँकड़ा" (potential only: never a count or a promise)'],
  [/(guarantee|assured|ensured|promised)\s+(footfall|customers|patients|business)|footfall (is|will be) (guaranteed|assured)|\b(heavy|massive|huge|large) footfall/i, 'a footfall or customer guarantee'],
  [/stadium road/i, '"Stadium Road" (the owner wants "24 metre wide road")'],
  [/golden[- ]hour|night view|day\s*\/\s*night|day and night view|सूर्यास्त|सूर्योदय|रात के (समय|दृश्य)|शाम के समय/i, 'time-of-day wording (the owner does not want it mentioned)'],
  [/\b(?:[0-9]|1[1-9]|[2-9][0-9])[- ]passenger lift/i, 'lift capacity other than 10 passengers'],
  [/60\s*[–-]\s*70 ?m/i, '"60-70 m" distance'],
  [/\bhand-?over\b|हैंडओवर|हस्तांतरण/i, '"handover" (the owner wants "project completion")'],
  [/\bstudio\b|\b2 ?BHK\b|serviced[- ]stay|service apartment|\bresidential (unit|apartment)s?\b|\bhotel\b/i, 'studio / residential / hotel wording (the building is commercial)'],
  [/\bAI[- ]powered\b|\bpowered by\b|\bartificial intelligence\b|\b(?:ChatGPT|GPT-?\d*|LLM|OpenAI|Anthropic)\b/i, 'a claim about what powers ChaiX (the default answers come from the knowledge base, not from an AI model)'],
  ...(vda && vda.show ? [[/VDA[- ]approved (Parking|building|commercial|plan|project)/i, 'VDA approval claim beyond "VDA approved"']] : [[/VDA[- ]approv|VDA\s*से\s*(स्वीकृत|मंज़ूर|मंजूर|पास|अनुमोदित)/i, 'a VDA approval claim while the owner\'s switch is off']]),
];

// everything the assistant can say, in both languages
const texts = [];
const add = (label, t) => { if (t) texts.push([label, t]); };
for (const e of entries) for (const lang of ['en', 'hi']) { add(`${e.id} (${lang})`, e.a[lang]); for (const a of e.actions || []) add(`${e.id} action (${lang})`, a.label[lang]); if (e.chip) add(`${e.id} chip (${lang})`, e.chip[lang]); }
for (const lang of ['en', 'hi']) add(`unknown (${lang})`, kb.UNKNOWN[lang]);
for (const p of kb.PINNED) for (const lang of ['en', 'hi']) add(`pinned chip (${lang})`, p.q[lang]);
for (const need of ['300 sq ft', '1500 sq ft', '3300 sq ft', '5000 sq ft', '12000 sq ft']) for (const prefix of ['I need ', 'मुझे चाहिए ']) add(`area reply "${prefix}${need}"`, eng.replyToText(prefix + need).text);
for (const [name, a] of Object.entries(kb.ACTIONS)) for (const lang of ['en', 'hi']) add(`action ${name} (${lang})`, a.label[lang]);
// the launcher's speech bubble and the window's own words (labels: the wording rules apply, the answer-structure rules do not)
for (const [lang, T] of [['en', winText.CHAIX_EN], ['hi', winText.CHAIX_HI]]) for (const key of ['launcher', 'launcherAria', 'promptHelp', 'promptName', 'online', 'promptAria', 'promptDismiss', 'title', 'subtitle', 'placeholder', 'formHint', 'pinnedLabel']) add(`chip window ${key} (${lang})`, T[key]);
const phones = new Set([prop.PROPERTY.contact.phoneDisplay].map((p) => p.replace(/\D/g, '').slice(-10)));
const email = prop.PROPERTY.contact.publicEmail.toLowerCase();

/** Every wording rule, applied to one text. Returns the problems found (empty when the text is clean). */
function scan(label, t, isLabel = false) {
  const out = [];
  const bad = (m) => out.push(`${label}: ${m}: "${t.slice(0, 120).replace(/\n/g, ' ')}"`);
  for (const [re, what] of FORBIDDEN) if (re.test(t)) bad(what);
  // the completion month is only ever a target, subject to approvals (Hindi: लक्ष्य … अनुमतियों के अधीन)
  for (const [month, targetWord, approvalWord] of [[TARGET, /target/i, /subject to approvals/i], ['मार्च 2027', /लक्ष्य/, /अनुमतियों के अधीन/]]) {
    let i = t.indexOf(month);
    if (i < 0) continue;
    while (i >= 0) {
      if (!targetWord.test(t.slice(Math.max(0, i - 70), i))) bad(`"${month}" without a target word just before it`);
      i = t.indexOf(month, i + 1);
    }
    if (!approvalWord.test(t)) bad(`"${month}" without "subject to approvals" in the same answer`);
  }
  // the hospital is always "upcoming / under construction" (answers only; a button label cannot carry it)
  if (!isLabel && /Apollo|अपोलो/i.test(t) && !/upcoming|under construction|निर्माणाधीन|आगामी|आने वाल/i.test(t)) bad('mentions Apollo without "upcoming / under construction"');
  // only the published contact details
  for (const m of t.matchAll(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g)) if (!phones.has(m[0].replace(/\D/g, '').slice(-10))) bad(`a phone number that is not the published one (${m[0]})`);
  for (const m of t.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) if (m[0].toLowerCase() !== email) bad(`an email other than ${email} (${m[0]})`);
  // answers are plain text: no markup and no raw links
  if (/<\/?[a-z][\s\S]*?>|https?:\/\//i.test(t)) bad('markup or a raw link in an answer');
  return out;
}

for (const [label, t] of texts) for (const p of scan(label, t, /action|chip/.test(label))) fail(p);

// ── 3b. Point-wise answers ───────────────────────────────────────────────────────────────────────────────────────────
// Visitors scan, they do not read: an answer is one short line that answers, then one fact per "• " point; a long answer without
// points, a long sentence line or a long point stops the build (split it). The chat window draws the points as a list.
const NEEDS_POINTS_OVER = 40; // words
const MAX_LINE = 34;          // words in a sentence line
const MAX_POINT = 30;         // words in one point
function structure(label, t) {
  const out = [];
  const lines = t.split('\n');
  const points = lines.filter((l) => l.startsWith('• '));
  const words = wordCount(t);
  if (words > NEEDS_POINTS_OVER && points.length < 2) out.push(`${label}: ${words} words with ${points.length} point(s): write it point-wise (a short line, then one fact per "• " point)`);
  for (const l of lines) {
    const w = wordCount(l);
    if (!l.trim()) out.push(`${label}: an empty line inside an answer`);
    else if (/^•\s*$/.test(l)) out.push(`${label}: an empty point`);
    else if (l.startsWith('• ')) { if (w > MAX_POINT) out.push(`${label}: a point of ${w} words (max ${MAX_POINT}): "${l.slice(0, 70)}…"`); }
    else if (/^\*\*[^*]+\*\*$/.test(l)) { if (w > 14) out.push(`${label}: a section label of ${w} words: "${l}"`); }
    else if (w > MAX_LINE) out.push(`${label}: a sentence line of ${w} words (max ${MAX_LINE}); make it a point or split it: "${l.slice(0, 70)}…"`);
  }
  return out;
}
for (const [label, t] of texts) if (!/action|chip/.test(label)) for (const p of structure(label, t)) fail(p);
// the rule itself: a paragraph is rejected, a point-wise answer is accepted
if (!structure('self-check', 'This is one long paragraph that keeps going for far too many words so that nobody can scan it quickly, and it has no points at all, which is exactly what the rule is there to stop, and so it must be reported.').length) fail('the point-wise rule let a long paragraph through');
if (structure('self-check', 'Short answer.\n• one\n• two').length) fail('the point-wise rule rejects a short point-wise answer');

// ── 3c. The window's formatter (components/chaix/chaix.format.ts) ──────────────────────────────────────────────────────────
{
  const known = { phones: [prop.PROPERTY.contact.phoneDisplay], emails: [prop.PROPERTY.contact.publicEmail] };
  const flat = (b) => [...b.segs, ...b.items.flat()].map((s) => s.s).join('');
  for (const [label, t] of texts) {
    if (/action|chip/.test(label)) continue;
    const blocks = fmt.formatAnswer(t, known);
    const shown = blocks.map(flat).join(' ');
    if (!blocks.length) fail(`${label}: the formatter returned no blocks`);
    if (/\*\*|•/.test(shown)) fail(`${label}: a bold marker or bullet is left in the drawn text: "${shown.slice(0, 80)}"`);
    if (blocks.some((b) => b.k === 'ul' && !b.items.length)) fail(`${label}: the formatter made an empty list`);
  }
  const bank = fmt.formatAnswer(kb.KB.find((e) => e.id === 'banks').a.en, known);
  const kinds = bank.map((b) => b.k).join(',');
  if (!/^p,h,ul,h,ul,h,ul,h,ul,h,ul$/.test(kinds)) fail(`the business answer should draw as a lead line and then five labels, each with a list; got ${kinds}`);
  const links = bank.flatMap((b) => b.items.flat()).filter((s) => s.t === 'tel' || s.t === 'mail');
  const wantTel = 'tel:+91' + prop.PROPERTY.contact.phoneDisplay.replace(/\D/g, '').slice(-10);
  if (!links.some((s) => s.t === 'tel' && s.href === wantTel)) fail(`the phone number in the business answer should be a ${wantTel} link`);
  if (!links.some((s) => s.t === 'mail' && s.href === 'mailto:' + prop.PROPERTY.contact.publicEmail)) fail('the email in the business answer should be a mailto: link');
  // only the published contact details become links; a visitor's own number or address stays plain text
  const odd = fmt.formatAnswer('Call +91 98765 43210 or write to someone@example.com', known).flatMap((b) => b.segs);
  if (odd.some((s) => s.t === 'tel' || s.t === 'mail')) fail('a number or address that is not published became a link');
  if (fmt.formatAnswer('Call +91 81140 80609', undefined).flatMap((b) => b.segs).some((s) => s.t === 'tel')) fail('links were made although no contact details were given');
  // a point that starts with a short name and a colon draws the name in bold; nothing else is bolded by itself
  const lead = fmt.formatAnswer('• Frontage: about 50 ft\n• Open 9:30 to 6 daily\n• This is a long sentence that happens to contain a colon, so it is not a name: it stays plain\n• **Own** bold: kept as written', known).flatMap((b) => b.items);
  if (!(lead[0][0].t === 'b' && lead[0][0].s === 'Frontage:' && lead[0].map((s) => s.s).join('') === 'Frontage: about 50 ft')) fail('a point starting "Frontage:" should draw the name in bold and keep the text');
  if (lead[1].some((s) => s.t === 'b')) fail('a time such as 9:30 must not be taken for a name');
  if (lead[2].some((s) => s.t === 'b')) fail('a long sentence before a colon must not be bolded as a name');
  if (lead[3].filter((s) => s.t === 'b').length !== 1) fail('a point with its own bold marker should be left as written');
  // text is never turned into markup: the parts carry plain strings only
  const evil = fmt.formatAnswer('**<b>x</b>**\n• <img src=x onerror=alert(1)>', known);
  if (evil.some((b) => b.k !== 'h' && b.k !== 'ul')) fail('the formatter should treat a label and a point as such');
}

// The rules themselves are tested too: each known-bad sentence must be caught, so a mistyped rule cannot let a wrong answer through.
const MUST_CATCH = [
  'The rent is ₹45,000 per month.', 'Rs. 50000 for the floor.', 'The security deposit is three months.', 'Rate is 80 per sq ft.', 'It costs 2 crore.', 'किराया 50 हज़ार रुपये महीना है।', 'प्रति माह किराया तय है',
  'The floors are column-free.', 'पूरी तरह कॉलम-फ्री मंज़िलें', 'Seen at golden hour.', 'The night view is lovely.', 'सूर्यास्त के समय की तस्वीर', 'A 12-passenger lift.', 'Ready for handover in March.', 'Studio apartments and 2BHK units.',
  'Apollo Hospital is across the road.', 'The area has high footfall.', 'Heavy footfall is assured.', 'फुटफॉल बहुत अच्छा है।', 'Project completion is March 2027.', 'Project completion is targeted for March 2027.', 'प्रोजेक्ट मार्च 2027 में पूरा होगा।', 'Call 9876543210 now.', 'Write to sales@example.com.', 'Powered by AI.', '<b>bold</b> answer', 'See https://example.com',
  ...(vda && vda.show ? [] : ['SHRINEVA is VDA approved.']),
];
for (const sample of MUST_CATCH) if (!scan('self-check', sample).length) fail(`the wording rules let this through (a rule is broken): "${sample}"`);
// ...and the sentences that are fine must stay fine
for (const sample of ['Project completion is targeted for March 2027, subject to approvals.', 'प्रोजेक्ट पूरा होने का लक्ष्य मार्च 2027 है, अनुमतियों के अधीन।', 'The upcoming Apollo Hospital is opposite.', `Call ${prop.PROPERTY.contact.phoneDisplay} or write to ${prop.PROPERTY.contact.publicEmail}.`, 'Floors are about 3,500 sq ft gross.', 'The location has high footfall potential; no footfall figures are published.', 'लोकेशन में उच्च फुटफॉल संभावना है; फुटफॉल का कोई आँकड़ा प्रकाशित नहीं किया जाता।']) {
  const found = scan('self-check', sample);
  if (found.length) fail(`the wording rules reject a fine sentence: ${found[0]}`);
}

// every route an action opens is a real page, and a #fragment is a real id in a template
const routing = fs.readFileSync(path.join(root, 'src/app/app-routing.module.ts'), 'utf8');
const routes = new Set([...routing.matchAll(/path:\s*'([^']*)'/g)].map((m) => '/' + m[1]));
routes.add('/');
const templates = [];
(function walk(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html') || e.name.endsWith('.ts')) templates.push(fs.readFileSync(p, 'utf8')); } })(path.join(root, 'src/app'));
const allSrc = templates.join('\n');
for (const [name, a] of Object.entries(kb.ACTIONS)) {
  if (a.kind === 'route') {
    const [p, frag] = a.href.split('#');
    if (!routes.has(p || '/')) fail(`action ${name}: "${a.href}" is not a route`);
    if (frag && !new RegExp(`id="${frag}"`).test(allSrc)) fail(`action ${name}: no element with id="${frag}" for "${a.href}"`);
  }
  if (a.kind === 'tel' && !/^\+91\d{10}$/.test(a.href || '')) fail(`action ${name}: "${a.href}" is not a +91 phone link`);
  if (a.kind === 'url' && !/^https:\/\//.test(a.href || '')) fail(`action ${name}: "${a.href}" is not an https link`);
}

// ── Report ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const keyCount = eng.KEY_COUNT;
if (problems.length) {
  console.error(`\nChaix test FAILED: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error('  ✗ ' + p);
  console.error('');
  process.exit(1);
}
console.log(`ChaiX test passed: ${passed} questions + ${specTable.length} specification questions (every sheet row and every not-confirmed item), ${kb.KB.length} entries, ${keyCount} key phrases, ${texts.length} answer texts scanned (English and Hindi).`);
