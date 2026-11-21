/**
 * Post-build SEO step (runs after scripts/prerender.js, see package.json "postbuild").
 *
 * The pages themselves are rendered by Angular (scripts/prerender.js): real, visible HTML with title, description,
 * canonical, Open Graph and JSON-LD already in place. This script does not touch them. It:
 *  1. Regenerates sitemap.xml (honest lastmod, PDFs, site photographs), robots.txt (every named search, AI-search, AI-assistant and AI-model
 *     crawler allowed), llms.txt, llms-full.txt and the IndexNow key file from the same config.
 *  2. Checks that every route is covered by the route whitelist in src/.htaccess.
 *  3. Gates the build on the RENDERED pages: title 50-60 and description 145-155 characters (and equal to the config), 40-60 word
 *     FAQ answers, one H1, one canonical, valid JSON-LD (LocalBusiness, Place, WebPage, BreadcrumbList; no RealEstateAgent or
 *     Accommodation; FAQPage equal to the visible FAQ), no hidden-text pattern, readable body text in the HTML, every internal
 *     link and asset resolving, every <img> with alt / width / height, no retired claims ("column-free", "60-70 m", "handover", a completion month without "target" and
 *     "subject to approvals", studios) and "Apollo" never without "upcoming / under construction".
 * Source of truth: src/app/config/*.ts (seo, property, faq, landing, location, content, media).
 */
const fs = require('fs');
const path = require('path');
const { load, root } = require('./lib/load-ts');

const cfgDir = path.join(root, 'src/app/config');
const distDir = path.join(root, 'dist/shrineva');

const { SEO_ROUTES, SEO_DOMAIN, SITE_UPDATED, INDEXNOW_KEY } = load(path.join(cfgDir, 'seo.config.ts'));
const { PROPERTY, PLAN, MARKETING_AREA, PROPOSED_RESIDENTIAL } = load(path.join(cfgDir, 'property.config.ts'));
const { CORE_FAQ, STATUS_FAQ, HOME_ANSWER, faqForPath } = load(path.join(cfgDir, 'faq.config.ts'));
const { LANDING_PAGES, landingByPath } = load(path.join(cfgDir, 'landing.config.ts'));
const { NEARBY_DISTANCES } = load(path.join(cfgDir, 'location.config.ts'));
const { PROJECT_STATUS, LEVEL_INFO, STACK, LEASE_OPTIONS, LEASING_POINTS, LEASING_STEPS, SPEC_GROUPS, ASK_ITEMS } = load(path.join(cfgDir, 'content.config.ts'));
const { TOUR_STOPS, SITE_PHOTOS, BROCHURE } = load(path.join(cfgDir, 'media.config.ts'));
const { HI } = load(path.join(cfgDir, 'hindi.config.ts'));

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('dist/shrineva/index.html not found. Run `npm run build` (it runs the pre-render first).');
  process.exit(1);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const url = (p) => (p ? `${SEO_DOMAIN}/${p}` : `${SEO_DOMAIN}/`);
const fileFor = (r) => (r.path ? path.join(distDir, r.path, 'index.html') : path.join(distDir, 'index.html'));
const vda = PROPERTY.approvals && PROPERTY.approvals.vda;

const nav = [
  ['', 'Home'], ['walkthrough', '3D Walkthrough'], ['floor-plans', 'Floor Plans'],
  ['location-contact', 'Location & Site Visit'], ['leasing', 'Leasing'],
  ...LANDING_PAGES.map((l) => [l.path, l.navLabel]),
  ['hi', 'हिंदी (Hindi): वाराणसी में किराये पर कमर्शियल स्पेस'],
  ['privacy-disclaimer', 'Privacy & Disclaimer'], ['terms', 'Terms'],
];

/** Verified facts, one line each. Written from the config so llms.txt and the pages cannot disagree. */
function facts() {
  const lat = PROPERTY.address.lat, lng = PROPERTY.address.lng;
  return [
    `Address: ${PROPERTY.address.full}.`,
    ...(lat !== null && lng !== null ? [`GPS coordinates: ${lat}, ${lng}.`] : []),
    `Leasing phone: ${PROPERTY.contact.phoneDisplay} (also WhatsApp, https://wa.me/${PROPERTY.contact.whatsappE164}) and ${PROPERTY.contact.phone2Display}. Leasing email: ${PROPERTY.contact.publicEmail}.`,
    `Location: opposite the upcoming Apollo Hospital (under construction, not yet operational) and about 100 m from the NIFT Varanasi campus, on a 24 m wide north-facing road in Bada Lalpur, about 1 km from Ring Road (NH 135B).`,
    `Plot and road: ${PLAN.plot.areaSqM} sq m plot with ${PLAN.plot.frontage} of frontage on a ${PLAN.plot.roadWidthM} m wide road.`,
    `Floors: three upper floors, each ${MARKETING_AREA.gross} gross and ${MARKETING_AREA.carpet} carpet. Open-plan commercial floor plates with flexible tenant layouts, offered as open shells to rent or lease whole or in part. Areas are approximate.`,
    `Building: one ${PLAN.lift.adjective} lift, a fire exit on every level, Vastu-compliant layout, parking for 12+ cars at ground level.`,
    ...(vda && vda.show ? [`Approval: shown on the site as "${vda.label}" (Varanasi Development Authority). Sanction details are not published on the site; ask the leasing team.`] : []),
    `Project status (${PROJECT_STATUS.updated}): the concrete structure is complete; brickwork, façade, lift and services are in progress; project completion is targeted for ${PROJECT_STATUS.completion.value}, ${PROJECT_STATUS.completion.note.toLowerCase()}. Dates are targets and may change. Images labelled as renders are indicative and the design is subject to change.`,
    `Use of any floor is subject to floor suitability and applicable statutory approvals (municipal, fire and, for food businesses, FSSAI).`,
  ];
}

// --- sitemap -----------------------------------------------------------------------------------------
// lastmod is the date the content really changed (SITE_UPDATED), not the build date: engines stop trusting a lastmod that
// moves on every build. Real site photographs and the two PDFs are listed too, so crawlers and AI tools find them directly.
const photoImg = (p) => [p.src.replace(/^assets\/images\//, ''), `${p.title}: SHRINEVA site photograph, ${PROJECT_STATUS.photosTaken}`];
const SITEMAP_IMAGES = {
  '': [['renders/facade-day.webp', 'SHRINEVA building, indicative 3D render'], ['renders/entrance.webp', 'SHRINEVA entrance, indicative 3D render'], ...SITE_PHOTOS.slice(0, 2).map(photoImg)],
  walkthrough: [['renders/entrance.webp', 'SHRINEVA entrance, indicative 3D render'], ['renders/ground-level.webp', 'SHRINEVA ground level, indicative 3D render'], ['renders/lift-lobby.webp', 'SHRINEVA lift lobby, indicative 3D render'], ...SITE_PHOTOS.map(photoImg)],
  'floor-plans': [['plans/plan-typical-sheet.webp', 'SHRINEVA typical floor plan, Floors 1 to 3'], ['plans/plan-ground-sheet.webp', 'SHRINEVA ground level plan']],
};
const DOCS = [[BROCHURE.href, 'brochure'], [BROCHURE.plansHref, 'floor plans']];
const urlsInSitemap = [];
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  SEO_ROUTES.map((r) => {
    const img = (SITEMAP_IMAGES[r.path] || []).map(([f, t]) => `\n    <image:image><image:loc>${SEO_DOMAIN}/assets/images/${f}</image:loc><image:title>${esc(t)}</image:title></image:image>`).join('');
    const alt = (r.alternates || []).map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('');
    urlsInSitemap.push(url(r.path));
    return `  <url>\n    <loc>${url(r.path)}</loc>\n    <lastmod>${r.lastmod || SITE_UPDATED}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority.toFixed(1)}</priority>${alt}${img}\n  </url>`;
  }).join('\n') + '\n' +
  DOCS.map(([href]) => { urlsInSitemap.push(`${SEO_DOMAIN}/${href}`); return `  <url>\n    <loc>${SEO_DOMAIN}/${href}</loc>\n    <lastmod>${SITE_UPDATED}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`; }).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(root, 'src/sitemap.xml'), sitemap);
console.log('sitemap.xml written');

// --- robots.txt --------------------------------------------------------------------------------------------------------
// Policy: this is a public leasing website. Search engines, AI search and answer assistants and AI model crawlers are all
// welcome, so the building can be found and quoted accurately. Only the enquiry handler (/api/) is closed. Tokens checked
// against each vendor's own crawler documentation in November 2026 (OpenAI, Anthropic, Perplexity, Google, Apple, Meta, Amazon,
// Mistral, DuckDuckGo, Common Crawl). Naming them is a statement of intent: it also overrides any "block AI" default that a
// CDN or host may add for unnamed bots. To keep a model-training crawler out, move its token to a `Disallow: /` group.
const AGENTS = [
  ['Search engines', ['Googlebot', 'Googlebot-Image', 'Bingbot', 'Applebot', 'DuckDuckBot', 'Slurp']],
  ['AI search and answer engines: index pages and cite them in answers', ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'DuckAssistBot', 'Meta-WebIndexer', 'Gemini-Deep-Research', 'Google-CloudVertexBot']],
  ['AI assistants fetching a page because a person asked (ChatGPT, Claude, Perplexity, Mistral, Meta AI)', ['ChatGPT-User', 'Claude-User', 'Perplexity-User', 'MistralAI-User', 'Meta-ExternalFetcher']],
  ['AI model crawlers and training controls', ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'Applebot-Extended', 'meta-externalagent', 'FacebookBot', 'Amazonbot', 'CCBot', 'Bytespider', 'cohere-ai', 'Diffbot']],
];
const ALL_AGENTS = AGENTS.flatMap(([, bots]) => bots);
const robots = [
  `# SHRINEVA robots.txt: search engines, AI search and answer assistants, and AI model crawlers are all welcome.`,
  `# Only the enquiry handler (/api/) is closed. Generated by scripts/build-seo.js; edit the list there.`,
  '',
  `User-agent: *\nAllow: /\nDisallow: /api/\nContent-Signal: search=yes, ai-input=yes, ai-train=yes\n`,
  ...AGENTS.map(([label, bots]) => `# ${label}\n${bots.map((b) => `User-agent: ${b}`).join('\n')}\nAllow: /\nDisallow: /api/\n`),
  `Sitemap: ${SEO_DOMAIN}/sitemap.xml\n`,
].join('\n');
fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
fs.writeFileSync(path.join(root, 'src/robots.txt'), robots);
console.log(`robots.txt written (${ALL_AGENTS.length} named crawlers, all allowed)`);

// --- IndexNow key file: lets Bing and other IndexNow engines be pinged on each upload (scripts/indexnow.js) ----------------
fs.writeFileSync(path.join(distDir, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);
fs.writeFileSync(path.join(root, `src/${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);

// --- llms.txt and llms-full.txt: plain-text / Markdown summaries for AI assistants, generated from the same config ----------
// Format follows llmstxt.org: H1, a one-paragraph summary in a blockquote, then H2 sections of annotated links. llms.txt is the
// short entry point; llms-full.txt carries the whole site's content in one file. Neither adds a claim the pages do not make.
// (Google says Search does not use these files and that they neither help nor harm; other assistants may read them.)
const pageLabel = (r) => (nav.find(([p]) => p === r.path) || [])[1] || r.path;
const SUMMARY = `${PROPERTY.brand.name} is a commercial building for rent or lease at ${PROPERTY.address.full}, opposite the upcoming Apollo Hospital and about 100 m from NIFT Varanasi, on a 24 m wide north-facing road. Three open-plan floors of ${MARKETING_AREA.gross} gross (${MARKETING_AREA.carpet} carpet) with flexible tenant layouts can be rented or leased whole or in part. The concrete structure is complete; project completion is targeted for ${PROJECT_STATUS.completion.value}, ${PROJECT_STATUS.completion.note.toLowerCase()}. Images labelled as renders are indicative.`;
const factLines = facts().map((f) => `- ${f}`);
const pageLines = SEO_ROUTES.filter((r) => r.priority >= 0.5).map((r) => `- [${pageLabel(r)}](${url(r.path)}): ${r.description}`);

const llms = [
  `# ${PROPERTY.brand.name}`,
  '',
  `> ${SUMMARY}`,
  '',
  `Last updated: ${PROJECT_STATUS.updated} (${SITE_UPDATED}). Leasing enquiries: ${PROPERTY.contact.publicEmail}, ${PROPERTY.contact.phoneDisplay} (also WhatsApp) or ${PROPERTY.contact.phone2Display}.`,
  '',
  '## Key facts',
  ...factLines,
  '',
  '## Pages',
  ...pageLines,
  '',
  '## Documents',
  `- [Brochure (PDF)](${url(BROCHURE.href)}): four pages: the building and its location, floor plans with areas (ground level, then floors 1 to 3), the project timeline with site photographs, and location, setbacks and the leasing contacts.`,
  `- [Floor plans (PDF)](${url(BROCHURE.plansHref)}): typical floor, ground level and site plans with areas and setbacks.`,
  '',
  '## Optional',
  `- [Full site content in one file](${url('llms-full.txt')}): every page, FAQ, fact, distance and the project timeline, in Markdown.`,
  `- [Sitemap](${url('sitemap.xml')}): all pages, the two PDFs and the site photographs.`,
  '',
].join('\n');

const level = (id) => LEVEL_INFO[id];
const llmsFull = [
  `# ${PROPERTY.brand.name}: full site content`,
  '',
  `> ${SUMMARY}`,
  '',
  `Last updated: ${PROJECT_STATUS.updated} (${SITE_UPDATED}). Source: ${SEO_DOMAIN}/. Short version: ${url('llms.txt')}.`,
  '',
  '## Key facts',
  ...factLines,
  '',
  '## Project status and timeline',
  `Status as of ${PROJECT_STATUS.updated}. ${PROJECT_STATUS.lead}`,
  ...PROJECT_STATUS.stages.map((s, i) => `${i + 1}. ${s.title}: ${s.label}. ${s.text}`),
  `- ${PROJECT_STATUS.changes.title} ${PROJECT_STATUS.changes.text}`,
  `- ${PROJECT_STATUS.note}`,
  `- Site photographs (taken ${PROJECT_STATUS.photosTaken}) are on ${SEO_DOMAIN}/#status: ${SITE_PHOTOS.map((p) => p.title).join('; ')}.`,
  '',
  '## The building and the floors',
  ...['ground', 'typical'].flatMap((id) => [`### ${level(id).title}`, `${level(id).value} (${level(id).label}; ${level(id).sub}).`, ...level(id).facts.map((f) => `- ${f.label}: ${f.value}`), '']),
  '### Stack',
  ...STACK.map((l) => `- ${l.label}: ${l.area}. ${l.detail} (${l.tag}).`),
  '',
  '### What can be leased',
  ...LEASE_OPTIONS.map((o) => `- ${o}`),
  ...LEASING_POINTS.map((o) => `- ${o}`),
  '',
  '### How leasing works',
  ...LEASING_STEPS.map((s, i) => `${i + 1}. ${s.t}: ${s.d}`),
  '',
  '## Safety and access',
  ...SPEC_GROUPS.flatMap((g) => [`### ${g.title}`, ...g.items.map((i) => `- ${i.label}: ${i.value}`), '']),
  `Not stated on the site, so ask the leasing team: ${ASK_ITEMS.join('; ')}.`,
  '',
  '## Location and approximate distances',
  ...NEARBY_DISTANCES.map((d) => `- ${d.name}: ${d.value}${d.note ? ` (${d.note})` : ''}`),
  '',
  '## 3D walkthrough (indicative renders; the design may change)',
  ...TOUR_STOPS.map((t) => `- ${t.title}: ${t.caption}`),
  '',
  '## Who can rent or lease here, by business type',
  ...LANDING_PAGES.flatMap((l) => [
    `### ${l.navLabel}`,
    `Page: ${url(l.path)}`,
    `${l.h1}. ${l.sub}`,
    '',
    `**${l.answerQ}** ${l.answer}`,
    '',
    ...l.cards.map((c) => `- ${c.title}: ${c.text}`),
    `- ${l.categoriesHeading}: ${l.categories.join('; ')}.`,
    `- ${l.approvalNote}`,
    '',
    ...l.faq.flatMap((f) => [`**${f.q}** ${f.a}`, '']),
  ]),
  '## Frequently asked questions',
  ...[HOME_ANSWER, ...CORE_FAQ, ...STATUS_FAQ].flatMap((f) => [`### ${f.q}`, f.a, '']),
  '## हिंदी (Hindi)',
  `${HI.h1}. ${HI.sub}`,
  '',
  `**${HI.answerQ}** ${HI.answer}`,
  '',
  ...HI.faq.flatMap((f) => [`**${f.q}** ${f.a}`, '']),
  `Hindi page: ${url(HI.path)}`,
  '',
  '## Contact and downloads',
  `- Email: ${PROPERTY.contact.publicEmail}`,
  `- Phone: ${PROPERTY.contact.phoneDisplay} (also WhatsApp, https://wa.me/${PROPERTY.contact.whatsappE164}) and ${PROPERTY.contact.phone2Display}`,
  `- Address: ${PROPERTY.address.full}`,
  `- Brochure (PDF): ${url(BROCHURE.href)}`,
  `- Floor plans (PDF): ${url(BROCHURE.plansHref)}`,
  '',
  '## Notes',
  `- The Apollo Hospital opposite is upcoming and under construction. No footfall, rent or return claim is made for this building.`,
  `- Areas are approximate. Use of any floor is subject to floor suitability and statutory approvals.`,
  `- ${PROJECT_STATUS.completion.label}: ${PROJECT_STATUS.completion.value}, ${PROJECT_STATUS.completion.note.toLowerCase()}. Dates are targets and may change.`,
  '',
].join('\n');
fs.writeFileSync(path.join(distDir, 'llms.txt'), llms);
fs.writeFileSync(path.join(root, 'src/llms.txt'), llms);
fs.writeFileSync(path.join(distDir, 'llms-full.txt'), llmsFull);
fs.writeFileSync(path.join(root, 'src/llms-full.txt'), llmsFull);
console.log(`llms.txt (${llms.length} chars) and llms-full.txt (${llmsFull.length} chars) written`);

// --- every route must be covered by the whitelist in src/.htaccess ------------------------------------------
const htaccess = fs.readFileSync(path.join(root, 'src/.htaccess'), 'utf8');
const wl = htaccess.match(/^RewriteRule \^\((.+)\)\/\?\$ index\.html \[L\]$/m);
if (!wl) { console.error('Route whitelist rule not found in src/.htaccess'); process.exit(1); }
const wlRe = new RegExp(`^(${wl[1]})/?$`);
const uncovered = SEO_ROUTES.map((r) => r.path).filter((p) => p && !wlRe.test(p));
if (uncovered.length) { console.error('Routes missing from the .htaccess whitelist: ' + uncovered.join(', ')); process.exit(1); }
console.log('.htaccess route whitelist covers all routes');

// --- quality gates: fail the build rather than ship a page that breaks the brief ---------------------------------------
const problems = [];
const words = (t) => String(t).trim().split(/\s+/).length;
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
for (const r of SEO_ROUTES) {
  const tl = r.title.length, dl = r.description.length;
  if (r.lang === 'hi-IN') {
    // Devanagari glyphs are wider than Latin ones, so the same pixel width holds fewer characters.
    if (tl < 30 || tl > 62) problems.push(`Hindi title length ${tl} (want 30-62): /${r.path} "${r.title}"`);
    if (dl < 80 || dl > 160) problems.push(`Hindi description length ${dl} (want 80-160): /${r.path}`);
    continue;
  }
  if (tl < 50 || tl > 60) problems.push(`title length ${tl} (want 50-60): /${r.path} "${r.title}"`);
  if (dl < 145 || dl > 155) problems.push(`description length ${dl} (want 145-155): /${r.path}`);
}
const answers = [HOME_ANSWER, ...CORE_FAQ, ...STATUS_FAQ, ...LANDING_PAGES.flatMap((l) => [{ q: l.answerQ, a: l.answer }, ...l.faq])];
for (const f of answers) {
  const n = words(f.a);
  if (n < 40 || n > 60) problems.push(`answer word count ${n} (want 40-60): "${f.q}"`);
}

const FORBIDDEN = [
  // The short "VDA approved" badge is shown only when the owner has switched it on (property.config.ts approvals.vda.show);
  // any wider approval wording is never allowed.
  [vda && vda.show ? /VDA[- ]approved (Parking|building|commercial|plan|project)/i : /VDA[- ]approv/i, 'VDA approval claim beyond the badge'],
  [/column[- ]?free|pillar[- ]?free|without (any )?columns/i, '"column-free" claim (the plans show columns)'],
  [/stadium road/i, '"Stadium Road" (the owner wants "24 metre wide road")'],
  [/golden[- ]hour|night view|day\s*\/\s*night|day and night view/i, 'time-of-day wording (the owner does not want it mentioned)'],
  [/\b(?:[0-9]|1[1-9]|[2-9][0-9])[- ]passenger lift/i, 'lift capacity other than 10 passengers'],
  [/60\s*[–-]\s*70 ?m/i, '"60-70 m" distance'],
  [/\bhand-?over\b/i, '"handover" (the owner wants "project completion": tenants may ask for changes, so the works continue)'],
  ...(PROPOSED_RESIDENTIAL.show ? [] : [[/\bstudio apartment|\b2 ?BHK\b|serviced[- ]stay|proposed (studio|residential)/i, 'residential / studio mention']]),
];
function textOf(html) {
  const body = html.slice(html.indexOf('<body'));
  return body.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

const known = new Set(SEO_ROUTES.map((r) => r.path));
const REDIRECTED = new Set(['location', 'contact', 'privacy', 'disclaimer', 'property', 'business-fit', 'spaces', 'infrastructure', 'growth', 'gallery', 'brokers']);
const scanned = [];
for (const r of SEO_ROUTES) {
  const file = fileFor(r);
  const label = '/' + r.path;
  if (!fs.existsSync(file)) { problems.push(`${label}: no pre-rendered file`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const text = textOf(html);

  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  if (!title || decode(title) !== r.title) problems.push(`${label}: rendered <title> differs from seo.config.ts ("${title}")`);
  const desc = (html.match(/<meta name="description" content="([^"]*)"/i) || [])[1];
  if (!desc || decode(desc) !== r.description) problems.push(`${label}: rendered meta description differs from seo.config.ts`);
  const canon = html.match(/<link rel="canonical" href="([^"]*)"/g) || [];
  if (canon.length !== 1 || !canon[0].includes(`href="${url(r.path)}"`)) problems.push(`${label}: canonical link missing, duplicated or wrong`);
  if (!/<meta name="robots" content="index, follow/i.test(html)) problems.push(`${label}: robots meta is not "index, follow"`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) problems.push(`${label}: not exactly one <h1> in the rendered HTML`);
  if (text.length < 1200) problems.push(`${label}: only ${text.length} characters of readable text in the HTML (page not rendered?)`);
  if (/static-shell|clip:rect\(0,? ?0,? ?0,? ?0\)|width:1px;height:1px/i.test(html.replace(/<style[\s\S]*?<\/style>/gi, ''))) problems.push(`${label}: hidden-text pattern in the HTML`);
  if (/class="boot"/.test(html)) problems.push(`${label}: loading placeholder still in the pre-rendered page`);

  // images: alt, width, height in the rendered HTML
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\balt=/.test(tag)) problems.push(`${label}: <img> without alt: ${tag.slice(0, 80)}`);
    if (!/\bwidth="/.test(tag) || !/\bheight="/.test(tag)) problems.push(`${label}: <img> without width/height: ${tag.slice(0, 80)}`);
  }
  if ((html.match(/fetchpriority="high"/g) || []).length > 2) problems.push(`${label}: more than two fetchpriority="high" elements`);

  // links and assets resolve
  for (const m of html.matchAll(/\s(?:href|src)="([^"#?][^"]*)"/g)) {
    const ref = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) continue;
    const clean = ref.split(/[?#]/)[0];
    if (clean.startsWith('/')) {
      const p = clean.replace(/^\/+|\/+$/g, '');
      const ok = p === '' || known.has(p) || fs.existsSync(path.join(distDir, p));
      if (!ok) problems.push(`${label}: link to /${p} does not exist`);
    } else if (/^assets\//.test(clean) || /\.(js|css|ico)$/.test(clean)) {
      if (!fs.existsSync(path.join(distDir, clean))) problems.push(`${label}: missing file ${clean}`);
    }
  }
  for (const m of html.matchAll(/(?:srcset|imagesrcset)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const f = part.trim().split(/\s+/)[0];
      if (f && !/^https?:/.test(f) && !fs.existsSync(path.join(distDir, f))) problems.push(`${label}: srcset file missing ${f}`);
    }
  }

  // JSON-LD
  const ld = html.match(/<script id="shrineva-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ld) problems.push(`${label}: JSON-LD missing`);
  else {
    try {
      const g = JSON.parse(ld[1].replace(/\\u003c/g, '<'))['@graph'];
      const types = g.flatMap((n) => [].concat(n['@type']));
      for (const t of ['LocalBusiness', 'Place', 'WebSite', 'BreadcrumbList']) if (!types.includes(t)) problems.push(`${label}: JSON-LD lacks ${t}`);
      if (!types.includes('WebPage') && !types.includes('ContactPage')) problems.push(`${label}: JSON-LD lacks WebPage`);
      for (const t of ['RealEstateAgent', 'Accommodation', 'Residence', 'Apartment']) if (types.includes(t)) problems.push(`${label}: JSON-LD uses ${t}, which does not describe this commercial building`);
      const wantFaq = faqForPath(r.path, (landingByPath(r.path) || { faq: [] }).faq);
      const faqNode = g.find((n) => n['@type'] === 'FAQPage');
      if (wantFaq.length && (!faqNode || faqNode.mainEntity.length !== wantFaq.length)) problems.push(`${label}: FAQPage does not match the visible FAQ`);
      if (!wantFaq.length && faqNode) problems.push(`${label}: FAQPage markup without a visible FAQ`);
      // every FAQ question in the markup must be visible on the page
      if (faqNode) for (const q of faqNode.mainEntity) if (!text.includes(q.name.replace(/\s+/g, ' ').slice(0, 40))) problems.push(`${label}: FAQ question not visible on the page: "${q.name.slice(0, 50)}"`);
    } catch (e) { problems.push(`${label}: JSON-LD is not valid JSON (${e.message})`); }
  }

  if (/Apollo|अपोलो/.test(text) && !/upcoming|under construction|निर्माणाधीन/i.test(text)) problems.push(`${label}: mentions Apollo without "upcoming / under construction"`);
  // language: <html lang> and og:locale follow the route; hreflang pairs are present and reciprocal where declared
  const wantLang = r.lang || 'en-IN';
  if (!new RegExp(`<html[^>]*\\blang="${wantLang}"`, 'i').test(html)) problems.push(`${label}: <html lang> is not ${wantLang}`);
  if (r.alternates) {
    for (const a of r.alternates) if (!new RegExp(`<link[^>]*rel="alternate"[^>]*hreflang="${a.hreflang}"[^>]*href="${a.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i').test(html)) problems.push(`${label}: hreflang ${a.hreflang} link missing in the head`);
  } else if (/rel="alternate"[^>]*hreflang=/i.test(html)) problems.push(`${label}: hreflang link on a page that declares no alternates`);
  if (vda && vda.show && !/VDA approved/i.test(text)) problems.push(`${label}: the VDA badge is switched on but not in the page`);
  if (vda && !vda.show && /VDA approved/i.test(text)) problems.push(`${label}: VDA badge in the page but switched off in property.config.ts`);
  scanned.push([label, text + ' ' + (ld ? ld[1] : '') + ' ' + [title, desc].join(' ')]);
}
// the home page must preload the same image its hero shows
{
  const home = fs.readFileSync(fileFor(SEO_ROUTES[0]), 'utf8');
  if (!/<link rel="preload" as="image"[^>]*hero-day-960\.webp/.test(home)) problems.push('/: hero preload is not the hero image');
  if (!/<img[^>]*hero-day-960\.webp[^>]*fetchpriority="high"|<img[^>]*fetchpriority="high"[^>]*hero-day/.test(home)) problems.push('/: the hero image is not the high-priority image');
}
scanned.push(['llms.txt', llms]);
scanned.push(['llms-full.txt', llmsFull]);

// Apollo: every line of the AI text files that names the hospital also says it is upcoming / under construction
for (const [label, body] of [['llms.txt', llms], ['llms-full.txt', llmsFull]]) {
  body.split('\n').forEach((line, i) => {
    // a question heading is answered on the next line; the Hindi pages say "निर्माणाधीन" (under construction)
    if (/Apollo/.test(line) && !/^### .*\?$/.test(line) && !/upcoming|under construction|निर्माणाधीन/i.test(line)) problems.push(`${label} line ${i + 1}: mentions Apollo without "upcoming / under construction": ${line.slice(0, 90)}`);
  });
}

// The completion month is only ever a target: wherever "March 2027" appears, "target" is right before it and "subject to approvals" is in the same text.
const TARGET = PROJECT_STATUS.completion.value;
for (const [label, text] of scanned) {
  const re = new RegExp(TARGET, 'g');
  let m;
  while ((m = re.exec(text))) {
    if (!/target/i.test(text.slice(Math.max(0, m.index - 70), m.index))) problems.push(`${label}: "${TARGET}" without "target" just before it: ...${text.slice(Math.max(0, m.index - 50), m.index + 20)}`);
  }
  if (new RegExp(TARGET).test(text) && !/subject to approvals/i.test(text)) problems.push(`${label}: "${TARGET}" without "subject to approvals" in the same text`);
}
// ...and never in a title or meta description (it would go stale in search results)
for (const r of SEO_ROUTES) if (/\b20[2-3]\d\b/.test(r.title + ' ' + r.description)) problems.push(`/${r.path}: a year in the title or meta description (dates go stale in search results)`);

// The progress section is on the home, leasing and walkthrough pages with the target and the update date
for (const p of ['', 'leasing', 'walkthrough']) {
  const f = path.join(distDir, p, 'index.html');
  if (!fs.existsSync(f)) continue;
  const t = textOf(fs.readFileSync(f, 'utf8'));
  const h = fs.readFileSync(f, 'utf8');
  if (!/id="status"/.test(h)) problems.push(`/${p}: project progress section (#status) missing`);
  if (!t.includes(TARGET) || !/subject to approvals/i.test(t)) problems.push(`/${p}: the targeted completion month is not on the page`);
  if (!t.includes('Updated ' + PROJECT_STATUS.updated)) problems.push(`/${p}: "Updated ${PROJECT_STATUS.updated}" missing from the progress section`);
}
{
  const h = fs.readFileSync(fileFor(SEO_ROUTES[0]), 'utf8');
  const photos = (h.match(/assets\/images\/photos\/[a-z-]+-sm\.webp/g) || []).length;
  if (photos < SITE_PHOTOS.length) problems.push(`/: only ${photos} of ${SITE_PHOTOS.length} site photographs in the page`);
}

// robots.txt: every named crawler is present, none is shut out, the sitemap is declared
for (const b of ALL_AGENTS) if (!new RegExp(`^User-agent: ${b}$`, 'm').test(robots)) problems.push(`robots.txt: crawler ${b} not named`);
if (/^Disallow:\s*\/\s*$/m.test(robots)) problems.push('robots.txt: a "Disallow: /" line would shut a crawler out');
if (!robots.includes(`Sitemap: ${SEO_DOMAIN}/sitemap.xml`)) problems.push('robots.txt: sitemap line missing');

// sitemap: every URL is a real page or file, lastmod is a real date that is not in the future
for (const u of urlsInSitemap) {
  const p = u.replace(SEO_DOMAIN + '/', '').replace(/\/$/, '');
  if (p && !known.has(p) && !fs.existsSync(path.join(distDir, p))) problems.push(`sitemap.xml: ${u} does not exist in the build`);
}
for (const m of sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) if (!/^\d{4}-\d{2}-\d{2}$/.test(m[1]) || m[1] > new Date().toISOString().slice(0, 10)) problems.push(`sitemap.xml: bad lastmod ${m[1]}`);
for (const m of sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) if (!fs.existsSync(path.join(distDir, m[1].replace(SEO_DOMAIN + '/', '')))) problems.push(`sitemap.xml: image missing ${m[1]}`);

// llms.txt: every link goes to a page, file or sitemap entry that exists
for (const [label, body] of [['llms.txt', llms], ['llms-full.txt', llmsFull]]) {
  for (const m of body.matchAll(/\]\((https?:\/\/[^)\s]+)\)|\s(https:\/\/shrineva\.in\/[^\s)]*)/g)) {
    const u = m[1] || m[2];
    if (!u.startsWith(SEO_DOMAIN)) continue;
    const p = u.replace(SEO_DOMAIN + '/', '').split('#')[0].replace(/[.,;]+$/, '').replace(/\/$/, '');
    if (p && !known.has(p) && !fs.existsSync(path.join(distDir, p))) problems.push(`${label}: link to ${u} does not exist`);
  }
}
if (!llms.includes('llms-full.txt')) problems.push('llms.txt does not point to llms-full.txt');

// IndexNow key file present and matching
{
  const kf = path.join(distDir, `${INDEXNOW_KEY}.txt`);
  if (!fs.existsSync(kf) || fs.readFileSync(kf, 'utf8').trim() !== INDEXNOW_KEY) problems.push('IndexNow key file missing or wrong');
}

// structured data carries the freshness date and the targeted completion (as a target)
{
  const h = fs.readFileSync(fileFor(SEO_ROUTES[0]), 'utf8');
  const ld = h.match(/<script id="shrineva-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ld) {
    const g = JSON.parse(ld[1].replace(/\\u003c/g, '<'))['@graph'];
    const wp = g.find((n) => n['@type'] === 'WebPage');
    if (!wp || wp.dateModified !== SITE_UPDATED) problems.push('/: WebPage dateModified is missing or not SITE_UPDATED');
    const pl = g.find((n) => n['@type'] === 'Place');
    const prop = pl && (pl.additionalProperty || []).find((a) => /Targeted project completion/.test(a.name));
    if (!prop || !/subject to approvals/i.test(String(prop.description || ''))) problems.push('/: Place lacks the "Targeted project completion" property (with "subject to approvals")');
  }
}
for (const [label, text] of scanned) for (const [re, what] of FORBIDDEN) if (re.test(text)) problems.push(`${label}: ${what}`);

// every internal link in the nav list must be a real route
for (const [p] of nav) if (!known.has(p)) problems.push(`nav links to a route that is not in seo.config.ts: /${p}`);
for (const p of REDIRECTED) if (known.has(p)) problems.push(`/${p} is both a route and a redirected legacy URL`);

// source templates: every <img> needs alt, width and height; lazy-load everything except the hero (fetchpriority="high"), the header logo and the lightbox (loading="eager")
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) {
      const src = fs.readFileSync(p, 'utf8');
      for (const m of src.matchAll(/<img\b[^>]*>/gs)) {
        const tag = m[0], rel = path.relative(root, p);
        if (!/(\[alt\]|\[attr\.alt\]|\balt)=/.test(tag)) problems.push(`${rel}: <img> without alt`);
        if (!/(\[attr\.)?width\]?=/.test(tag) || !/(\[attr\.)?height\]?=/.test(tag)) problems.push(`${rel}: <img> without width/height: ${tag.slice(0, 90).replace(/\s+/g, ' ')}`);
        if (!/fetchpriority="high"/.test(tag) && !/loading="(lazy|eager)"/.test(tag)) problems.push(`${rel}: <img> neither lazy nor an explicit eager (hero / header logo / lightbox): ${tag.slice(0, 90).replace(/\s+/g, ' ')}`);
      }
    }
  }
})(path.join(root, 'src/app'));

if (problems.length) {
  console.error('\nSEO quality gates FAILED:\n - ' + problems.join('\n - '));
  process.exit(1);
}
console.log(`SEO quality gates passed (${SEO_ROUTES.length} rendered routes, ${answers.length} quotable answers, links, assets and images audited).`);
