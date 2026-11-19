/**
 * Post-build SEO step (runs after `ng build`, see package.json "postbuild").
 *  1. Writes one static HTML shell per route (dist/<route>/index.html) with the right <title>, description, canonical,
 *     robots, Open Graph / Twitter tags, JSON-LD and the page's real content INSIDE <app-root> (H1, answer-first section,
 *     key facts, visible FAQ, contact block and links to every page). Angular replaces that content when it starts, so
 *     visitors see the app, while crawlers and AI assistants that do not run JavaScript read the full text.
 *     The content is visually hidden until JavaScript has started; with JavaScript off, a <noscript> rule shows it.
 *  2. Regenerates sitemap.xml, robots.txt (named search and AI crawlers allowed) and llms.txt from the same config.
 *  3. Writes 404.html and checks that every route is covered by the route whitelist in src/.htaccess.
 *  4. Gates the build: title 50-60 and description 145-155 characters, 40-60 word FAQ answers, one H1 per page, valid JSON-LD,
 *     no retired claims (VDA approval, "60-70 m", studios), and "Apollo" never without "upcoming / under construction".
 * Source of truth: src/app/config/*.ts (seo, property, faq, landing, highlights, location, footfall).
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const cfgDir = path.join(root, 'src/app/config');
const distDir = path.join(root, 'dist/shrineva');

// --- tiny TS loader (transpile config files in memory) -------------------------------------
const cache = {};
function load(file) {
  file = path.resolve(file);
  if (cache[file]) return cache[file].exports;
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  cache[file] = mod;
  const req = (name) => {
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name) + '.ts');
    return require(name);
  };
  new Function('require', 'module', 'exports', out)(req, mod, mod.exports);
  return mod.exports;
}

const { SEO_ROUTES, SEO_DOMAIN } = load(path.join(cfgDir, 'seo.config.ts'));
const { PROPERTY, PLAN, MARKETING_AREA, PROPOSED_RESIDENTIAL } = load(path.join(cfgDir, 'property.config.ts'));
const { CORE_FAQ, STATUS_FAQ, HOME_ANSWER, faqForPath } = load(path.join(cfgDir, 'faq.config.ts'));
const { LANDING_PAGES, landingByPath } = load(path.join(cfgDir, 'landing.config.ts'));
const { PROJECT_STATUS, KEY_FEATURES, BUILDING_SERVICES } = load(path.join(cfgDir, 'highlights.config.ts'));
const { NEARBY_DISTANCES } = load(path.join(cfgDir, 'location.config.ts'));
const { FOOTFALL_AS_OF, NEARBY_PROJECTS, CITY_DRIVERS, FOOTFALL_NOT_CLAIMED } = load(path.join(cfgDir, 'footfall.config.ts'));
// Same JSON-LD builder the runtime SeoService uses (src/app/core/seo/schema.ts).
const { buildGraph } = load(path.join(root, 'src/app/core/seo/schema.ts'));

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('dist index.html not found. Run `ng build` first.');
  process.exit(1);
}
const base = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const url = (p) => (p ? `${SEO_DOMAIN}/${p}` : `${SEO_DOMAIN}/`);

const nav = [
  ['', 'Home'], ['property', 'The Property'], ['walkthrough', '3D Walkthrough'], ['floor-plans', 'Floor Plans'], ['gallery', 'Gallery'],
  ['location-contact', 'Location & Site Visit'], ['growth', 'Nearby Projects'], ['business-fit', 'Business Fit'], ['infrastructure', 'Infrastructure'],
  ['spaces', 'Spaces'], ['leasing', 'Leasing'], ['brokers', 'Brokers'],
  ...LANDING_PAGES.map((l) => [l.path, l.navLabel]),
  ['privacy-disclaimer', 'Privacy & Disclaimer'], ['terms', 'Terms'],
];

function setMeta(html, attr, key, content) {
  const re = new RegExp(`<meta ${attr}="${key}"[^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${esc(content)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

/** Verified facts, one line each. Written from the config so the static HTML, llms.txt and the page cannot disagree. */
function facts() {
  const lat = PROPERTY.address.lat, lng = PROPERTY.address.lng;
  return [
    `Address: ${PROPERTY.address.full}.`,
    ...(lat !== null && lng !== null ? [`GPS coordinates: ${lat}, ${lng}.`] : []),
    `Leasing phone: ${PROPERTY.contact.phoneDisplay} (also WhatsApp, https://wa.me/${PROPERTY.contact.whatsappE164}) and ${PROPERTY.contact.phone2Display}. Open ${PROPERTY.contact.hours}.`,
    `Location: opposite the upcoming Apollo Hospital (under construction, not yet operational) and about 100 m from the NIFT Varanasi campus, on Stadium Road in Bada Lalpur.`,
    `Plot and road: ${PLAN.plot.areaSqM} sq m plot with ${PLAN.plot.frontage} of frontage on a ${PLAN.plot.roadWidthM} m wide road.`,
    `Floors: three upper floors, each ${MARKETING_AREA.gross} gross and ${MARKETING_AREA.carpet} carpet, offered as open shells to lease whole or in part. Areas are approximate.`,
    `Building: one ${PLAN.lift.capacity.replace(' passengers', '-person')} passenger lift, a fire exit on every level, Vastu-compliant layout, parking for 12+ cars at ground level.`,
    `Status: construction is ongoing. Images labelled as renders are indicative and the design is subject to change.`,
    `Use of any floor is subject to floor suitability and applicable statutory approvals (municipal, fire and, for food businesses, FSSAI).`,
  ];
}

function faqHtml(faqs, heading) {
  return faqs.length
    ? `<section><h2>${esc(heading)}</h2>${faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}</section>`
    : '';
}

function staticBody(route) {
  const landing = landingByPath(route.path);
  const faqs = faqForPath(route.path, landing ? landing.faq : []);
  const out = [`<header><p>${esc(PROPERTY.brand.name)}</p><h1>${esc(route.h1)}</h1><p>${esc(route.description)}</p></header>`];
  if (landing) {
    out.push(`<section><h2>${esc(landing.answerQ)}</h2><p>${esc(landing.answer)}</p><p>${esc(landing.approvalNote)}</p></section>`);
    out.push(`<section><h2>Why operators look at SHRINEVA</h2><ul>${landing.cards.map((c) => `<li><strong>${esc(c.title)}.</strong> ${esc(c.text)}</li>`).join('')}</ul>` +
      `<h3>${esc(landing.categoriesHeading)}</h3><ul>${landing.categories.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></section>`);
  } else if (route.path === '') {
    out.push(`<section><h2>${esc(HOME_ANSWER.q)}</h2><p>${esc(HOME_ANSWER.a)}</p></section>`);
    out.push(`<section><h2>Which business are you leasing for?</h2><ul>${LANDING_PAGES.map((l) => `<li><a href="${url(l.path)}">${esc(l.navLabel)}</a>: ${esc(l.sub)}</li>`).join('')}</ul></section>`);
  }
  out.push(`<section><h2>SHRINEVA key facts</h2><ul>${facts().map((f) => `<li>${esc(f)}</li>`).join('')}</ul></section>`);
  if (route.path === 'growth') {
    out.push(`<section><h2>What is being built near SHRINEVA (reviewed ${esc(FOOTFALL_AS_OF)})</h2>` +
      NEARBY_PROJECTS.map((p) => `<h3>${esc(p.name)} — ${esc(p.distance)}</h3><p>${esc(p.status)} ${esc(p.facts.join('; '))}.</p>`).join('') +
      `<h2>City-level projects (indirect)</h2>` +
      CITY_DRIVERS.map((c) => `<h3>${esc(c.name)}</h3><p>${esc(c.facts)} ${esc(c.whyIndirect)}</p>`).join('') +
      `<h2>What we do not claim</h2><ul>${FOOTFALL_NOT_CLAIMED.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></section>`);
  }
  out.push(faqHtml(faqs, landing ? `Questions from ${landing.eyebrow.toLowerCase()} tenants` : 'Frequently asked questions'));
  out.push(`<section><h2>Nearby (approximate)</h2><ul>${NEARBY_DISTANCES.map((d) => `<li>${esc(d.name)}: ${esc(d.value)}${d.note ? ` (${esc(d.note)})` : ''}</li>`).join('')}</ul></section>`);
  out.push(`<p>${esc(PROPERTY.address.full)}. Call ${esc(PROPERTY.contact.phoneDisplay)} or ${esc(PROPERTY.contact.phone2Display)}, or message ${esc(PROPERTY.contact.phoneDisplay)} on WhatsApp.</p>`);
  out.push(`<nav aria-label="Site"><ul>${nav.map(([p, l]) => `<li><a href="${url(p)}">${esc(l)}</a></li>`).join('')}</ul></nav>`);
  return out.join('');
}

// Visually hidden until Angular starts (it then replaces everything inside <app-root>); shown by the <noscript> rule below when JavaScript is off.
const HIDDEN = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);border:0';
const NOSCRIPT_REVEAL = '<noscript><style>.boot{display:none}.static-shell{position:static!important;width:auto!important;height:auto!important;margin:0 auto!important;overflow:visible!important;clip:auto!important;max-width:56rem;padding:1.25rem;font:1rem/1.6 Georgia,serif;color:#1B1A17}.static-shell a{color:#5B4113}</style></noscript>';

function shell(route) {
  const canonical = url(route.path);
  const image = route.image || PROPERTY.images.og;
  const alt = route.imageAlt || 'SHRINEVA commercial building, Bada Lalpur, Varanasi (indicative 3D render)';
  let html = base;
  if (route.path === '') {
    // Only the home page paints the hero straight away; other routes must not pay for it.
    html = html.replace('</head>', '  <link rel="preload" as="image" href="assets/images/hero/hero-golden-1000.webp" imagesrcset="assets/images/hero/hero-golden-1000.webp 1000w, assets/images/hero/hero-golden-2000.webp 2000w" imagesizes="(min-width: 1024px) 560px, 92vw" fetchpriority="high">\n</head>');
  }
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(route.title)}</title>`);
  html = setMeta(html, 'name', 'description', route.description);
  html = setMeta(html, 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`);
  html = setMeta(html, 'property', 'og:url', canonical);
  html = setMeta(html, 'property', 'og:title', route.title);
  html = setMeta(html, 'property', 'og:description', route.description);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:image:alt', alt);
  html = setMeta(html, 'name', 'twitter:title', route.title);
  html = setMeta(html, 'name', 'twitter:description', route.description);
  html = setMeta(html, 'name', 'twitter:image', image);
  html = setMeta(html, 'name', 'twitter:image:alt', alt);
  // Page content inside <app-root> (replaced by Angular on start). The <noscript> in <body> is dropped; the one in <head> is Angular's stylesheet fallback and stays.
  const bodyAt = html.indexOf('<body');
  let bodyHtml = html.slice(bodyAt).replace(/<noscript>[\s\S]*?<\/noscript>/i, '');
  bodyHtml = bodyHtml.replace(/<app-root>[\s\S]*?<\/app-root>/i,
    () => `<app-root><div class="boot" aria-hidden="true"><b>SHRINEVA</b><span>Bada Lalpur, Varanasi</span></div><main class="static-shell" style="${HIDDEN}">${staticBody(route)}</main></app-root>`);
  html = html.slice(0, bodyAt) + bodyHtml;
  html = html.replace('</head>', `  ${NOSCRIPT_REVEAL}\n</head>`);
  // Structured data in the static HTML (the runtime SeoService updates this same element by id).
  const ld = JSON.stringify(buildGraph(route.path, canonical)).replace(/</g, '\\u003c');
  html = html.replace(/<script[^>]*id="shrineva-schema"[^>]*>[\s\S]*?<\/script>/i, '');
  html = html.replace('</head>', `<script type="application/ld+json" id="shrineva-schema">${ld}</script></head>`);
  return html;
}

let count = 0;
for (const route of SEO_ROUTES) {
  const out = route.path ? path.join(distDir, route.path, 'index.html') : path.join(distDir, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, shell(route));
  count++;
}
console.log(`SEO shells written: ${count}`);

// --- sitemap ---------------------------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
  SEO_ROUTES.map((r) => {
    const img = r.path === 'gallery' || r.path === '' || r.path === 'floor-plans'
      ? `\n    <image:image><image:loc>${SEO_DOMAIN}/assets/images/renders/facade-golden.webp</image:loc><image:title>SHRINEVA façade, indicative 3D render</image:title></image:image>`
      : '';
    return `  <url>\n    <loc>${url(r.path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority.toFixed(1)}</priority>${img}\n  </url>`;
  }).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(root, 'src/sitemap.xml'), sitemap);
console.log('sitemap.xml written');

// --- robots.txt: search and AI-search crawlers are named and allowed; the form handler is closed to all ------------------
const BOTS = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended'];
const robots = [
  `# SHRINEVA: search engines and AI search / answer crawlers are welcome. Only the enquiry handler is closed.`,
  `User-agent: *\nAllow: /\nDisallow: /api/\n`,
  ...BOTS.map((b) => `User-agent: ${b}\nAllow: /\nDisallow: /api/\n`),
  `Sitemap: ${SEO_DOMAIN}/sitemap.xml\n`,
].join('\n');
fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
fs.writeFileSync(path.join(root, 'src/robots.txt'), robots);
console.log('robots.txt written');

// --- llms.txt: a plain-text summary for AI assistants, generated from the same config (no extra claims) ----
const pageLabel = (r) => (nav.find(([p]) => p === r.path) || [])[1] || r.path.replace('spaces/floor-', 'Floor ');
const llms = [
  `# ${PROPERTY.brand.name}`,
  '',
  `> ${PROPERTY.brand.name} is a commercial building for lease at ${PROPERTY.address.full}, opposite the upcoming Apollo Hospital and about 100 m from NIFT Varanasi. Three open floors of ${MARKETING_AREA.gross} gross (${MARKETING_AREA.carpet} carpet) can be leased whole or in part. Construction is ongoing; images labelled as renders are indicative.`,
  '',
  '## Verified facts',
  ...facts().map((f) => `- ${f}`),
  '',
  '## Who can lease here',
  '- Pathology labs, diagnostic centres and clinics',
  '- Banks, NBFCs and insurance branches',
  '- Corporate and IT offices',
  '- Retail showrooms and boutiques',
  '- Restaurants and cafés (subject to municipal, fire and FSSAI approvals)',
  '- Coaching institutes, coworking, fitness and wellness centres',
  '',
  '## Pages',
  ...SEO_ROUTES.filter((r) => r.priority >= 0.5).map((r) => `- [${pageLabel(r)}](${url(r.path)}): ${r.description}`),
  '',
  '## Downloads',
  `- [Leasing dossier (PDF)](${url('assets/shrineva-dossier.pdf')}): opportunity, location and distances, key features, floor plans, 3D views and contacts.`,
  `- [Floor plans (PDF)](${url('assets/shrineva-floor-plans.pdf')}): ground level, typical floor and building summary with area statements.`,
  '',
  '## Approximate distances',
  ...NEARBY_DISTANCES.map((d) => `- ${d.name}: ${d.value}${d.note ? ` (${d.note})` : ''}`),
  '',
  '## Frequently asked questions',
  ...[HOME_ANSWER, ...CORE_FAQ, ...STATUS_FAQ].flatMap((f) => [`### ${f.q}`, f.a, '']),
  '## Notes',
  `- The Apollo Hospital opposite is upcoming and under construction. No footfall, rent or approval claim is made for this building. Nearby project sources are listed at ${url('growth')} (reviewed ${FOOTFALL_AS_OF}).`,
  `- Areas are approximate. Use of any floor is subject to floor suitability and statutory approvals.`,
  '',
].join('\n');
fs.writeFileSync(path.join(distDir, 'llms.txt'), llms);
fs.writeFileSync(path.join(root, 'src/llms.txt'), llms);
console.log('llms.txt written');

// --- 404.html: same app shell, marked noindex; .htaccess serves it with a real 404 status ---------------------
let nf = base.replace(/<title>[\s\S]*?<\/title>/i, `<title>Page not found | ${esc(PROPERTY.brand.name)}</title>`);
nf = nf.replace(/<link rel="canonical"[^>]*>/i, '');
nf = setMeta(nf, 'name', 'robots', 'noindex, follow');
fs.writeFileSync(path.join(distDir, '404.html'), nf);
console.log('404.html written');

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
for (const r of SEO_ROUTES) {
  const tl = r.title.length, dl = r.description.length;
  if (tl < 50 || tl > 60) problems.push(`title length ${tl} (want 50-60): /${r.path} "${r.title}"`);
  if (dl < 145 || dl > 155) problems.push(`description length ${dl} (want 145-155): /${r.path}`);
}
const answers = [HOME_ANSWER, ...CORE_FAQ, ...STATUS_FAQ, ...LANDING_PAGES.flatMap((l) => [{ q: l.answerQ, a: l.answer }, ...l.faq])];
for (const f of answers) {
  const n = words(f.a);
  if (n < 40 || n > 60) problems.push(`answer word count ${n} (want 40-60): "${f.q}"`);
}
const FORBIDDEN = [
  [/VDA[- ]approved (Parking|building|commercial)|VDA approved/i, 'VDA approval claim'],
  [/60\s*[–-]\s*70 ?m/i, '"60-70 m" distance'],
  [/handover (March|in March) 2027/i, 'handover date in SEO text'],
  ...(PROPOSED_RESIDENTIAL.show ? [] : [[/\bstudio apartment|\b2 ?BHK\b|serviced[- ]stay|proposed (studio|residential)/i, 'residential / studio mention']]),
];
function textOf(html) { return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); }
const scanned = [];
for (const r of SEO_ROUTES) {
  const file = r.path ? path.join(distDir, r.path, 'index.html') : path.join(distDir, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const text = textOf(html);
  const label = '/' + r.path;
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) problems.push(`${label}: ${h1s} <h1> in the static HTML (want 1)`);
  if ((html.match(/<link rel="canonical"/g) || []).length !== 1) problems.push(`${label}: canonical link missing or duplicated`);
  const ld = html.match(/<script type="application\/ld\+json" id="shrineva-schema">([\s\S]*?)<\/script>/);
  if (!ld) problems.push(`${label}: JSON-LD missing`);
  else {
    try {
      const g = JSON.parse(ld[1].replace(/\\u003c/g, '<'))['@graph'];
      const types = g.flatMap((n) => [].concat(n['@type']));
      for (const t of ['RealEstateAgent', 'LocalBusiness', 'WebPage', 'BreadcrumbList']) if (!types.includes(t) && !(t === 'WebPage' && types.includes('ContactPage'))) problems.push(`${label}: JSON-LD lacks ${t}`);
      const wantFaq = faqForPath(r.path, (landingByPath(r.path) || { faq: [] }).faq);
      const faqNode = g.find((n) => n['@type'] === 'FAQPage');
      if (wantFaq.length && (!faqNode || faqNode.mainEntity.length !== wantFaq.length)) problems.push(`${label}: FAQPage does not match the visible FAQ`);
      if (!wantFaq.length && faqNode) problems.push(`${label}: FAQPage markup without a visible FAQ`);
    } catch (e) { problems.push(`${label}: JSON-LD is not valid JSON (${e.message})`); }
  }
  if (/Apollo/.test(text) && !/upcoming|under construction/i.test(text)) problems.push(`${label}: mentions Apollo without "upcoming / under construction"`);
  scanned.push([label, text + ' ' + (ld ? ld[1] : '')]);
}
scanned.push(['llms.txt', llms]);
for (const [label, text] of scanned) for (const [re, what] of FORBIDDEN) if (re.test(text)) problems.push(`${label}: ${what}`);

// every internal link in the static nav must be a real route
const known = new Set(SEO_ROUTES.map((r) => r.path));
for (const [p] of nav) if (!known.has(p)) problems.push(`nav links to a route that is not in seo.config.ts: /${p}`);

// source templates: every <img> needs alt, width and height; lazy-load everything except the hero (fetchpriority="high"), the header logo and the lightbox (loading="eager")
const imgIssues = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) {
      const src = fs.readFileSync(p, 'utf8');
      for (const m of src.matchAll(/<img\b[^>]*>/gs)) {
        const tag = m[0], rel = path.relative(root, p);
        if (!/(\[alt\]|\[attr\.alt\]|\balt)=/.test(tag)) imgIssues.push(`${rel}: <img> without alt`);
        if (!/(\[attr\.)?width\]?=/.test(tag) || !/(\[attr\.)?height\]?=/.test(tag)) imgIssues.push(`${rel}: <img> without width/height: ${tag.slice(0, 90).replace(/\s+/g, ' ')}`);
        if (!/fetchpriority="high"/.test(tag) && !/loading="(lazy|eager)"/.test(tag)) imgIssues.push(`${rel}: <img> neither lazy nor an explicit eager (hero / header logo / lightbox): ${tag.slice(0, 90).replace(/\s+/g, ' ')}`);
      }
    }
  }
})(path.join(root, 'src/app'));
for (const i of imgIssues) problems.push(i);

if (problems.length) {
  console.error('\nSEO quality gates FAILED:\n - ' + problems.join('\n - '));
  process.exit(1);
}
console.log(`SEO quality gates passed (${SEO_ROUTES.length} routes, ${answers.length} quotable answers, images audited).`);
