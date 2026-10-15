/**
 * Post-build SEO step.
 *  1. Writes one static HTML shell per route (dist/<route>/index.html) with the right
 *     <title>, description, canonical, Open Graph / Twitter tags and a <noscript> block
 *     (H1, summary, key facts and links to every page), so crawlers and link previews that
 *     do not run JavaScript still see unique, correct content.
 *  2. Regenerates sitemap.xml, robots.txt and llms.txt from the same route list and domain (property.config.ts → domain.canonical).
 *  3. Writes 404.html (served with a real 404 status by .htaccess for unknown URLs) and checks that every route is
 *     covered by the route whitelist in src/.htaccess, so a new page cannot be added without updating it.
 * Source of truth: src/app/config/seo.config.ts (+ property.config.ts, highlights.config.ts, location.config.ts, footfall.config.ts).
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
const { PROPERTY, PLAN } = load(path.join(cfgDir, 'property.config.ts'));
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
  ['location', 'Location'], ['growth', 'Nearby Projects'], ['business-fit', 'Business Fit'], ['infrastructure', 'Infrastructure'],
  ['spaces', 'Spaces'], ['leasing', 'Leasing'], ['brokers', 'Brokers'], ['contact', 'Contact'],
];

function setMeta(html, attr, key, content) {
  const re = new RegExp(`<meta ${attr}="${key}"[^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${esc(content)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

function noscript(route) {
  const facts = [
    `Commercial and mixed-use building, ${PROJECT_STATUS.stage.toLowerCase()}: ${PROJECT_STATUS.progress.toLowerCase()}, handover ${PROJECT_STATUS.handover} (owner's plan). ${PROJECT_STATUS.modifications}`,
    `${PLAN.plot.areaSqM} sq m plot, ${PLAN.plot.facing.toLowerCase()}-facing, ${PLAN.plot.frontage} frontage on a ${PLAN.plot.roadWidthM} m road`,
    `VDA-approved Parking + 3 building: open parking level plus three floors; each floor ${PLAN.typical.floorArea.sqft} sq ft floor area, ${PLAN.typical.carpet.sqft} sq ft carpet (computed, not certified)`,
    `Key features (owner-specified): ${KEY_FEATURES.map((f) => f.title).join(', ')}. Services: ${BUILDING_SERVICES.join(', ')}.`,
    `Nearby (approximate): ${NEARBY_DISTANCES.map((d) => `${d.name} ${d.value}`).join('; ')}.`,
    `Footfall potential: the Apollo hospital (under construction, OPD expected 2027) and NIFT Varanasi (classes since 2024, campus expected ready 2027) are 60–70 m away and the operating Varanasi Trade Centre about 330 m away. Reviewed ${FOOTFALL_AS_OF}. No footfall figure is claimed.`,
  ];
  const links = nav.map(([p, l]) => `<li><a href="${url(p)}">${esc(l)}</a></li>`).join('');
  const growth = route.path === 'growth'
    ? `<h2>What is being built near SHRINEVA (reviewed ${esc(FOOTFALL_AS_OF)})</h2>` +
      NEARBY_PROJECTS.map((p) => `<h3>${esc(p.name)} — ${esc(p.distance)}</h3><p>${esc(p.status)} ${esc(p.facts.join('; '))}.</p>`).join('') +
      `<h2>City-level projects (indirect)</h2>` +
      CITY_DRIVERS.map((c) => `<h3>${esc(c.name)}</h3><p>${esc(c.facts)} ${esc(c.whyIndirect)}</p>`).join('') +
      `<h2>What we do not claim</h2><ul>${FOOTFALL_NOT_CLAIMED.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`
    : '';
  return `<noscript><header><p>SHRINEVA</p><h1>${esc(route.h1)}</h1><p>${esc(route.description)}</p></header>` +
    `<ul>${facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>${growth}` +
    `<p>${esc(PROPERTY.address.full)}. Call ${esc(PROPERTY.contact.phoneDisplay)} or ${esc(PROPERTY.contact.phone2Display)}${PROPERTY.contact.publicEmail ? `; email ${esc(PROPERTY.contact.publicEmail)}` : ''}.</p>` +
    `<nav aria-label="Site"><ul>${links}</ul></nav></noscript>`;
}

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
  // Replace the <noscript> that sits in <body>. The one in <head> is Angular's stylesheet fallback and must stay.
  const bodyAt = html.indexOf('<body');
  html = html.slice(0, bodyAt) + html.slice(bodyAt).replace(/<noscript>[\s\S]*?<\/noscript>/i, () => noscript(route));
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

// --- robots.txt (domain comes from property.config.ts so it can never drift from the sitemap) ---
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SEO_DOMAIN}/sitemap.xml\n`;
fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
fs.writeFileSync(path.join(root, 'src/robots.txt'), robots);
console.log('robots.txt written');

// --- llms.txt: a plain-text summary for AI assistants, generated from the same config (no extra claims) ----
const llms = [
  `# ${PROPERTY.brand.name}`,
  '',
  `> Commercial and mixed-use building for lease at ${PROPERTY.address.full}. VDA-approved Parking + 3 building: open parking level plus three whole floors on a ${PLAN.plot.areaSqM} sq m plot with ${PLAN.plot.frontage} of frontage on a ${PLAN.plot.roadWidthM} m road. Leasing enquiries: ${PROPERTY.contact.phoneDisplay} or ${PROPERTY.contact.phone2Display} (WhatsApp)${PROPERTY.contact.publicEmail ? `, ${PROPERTY.contact.publicEmail}` : ''}.`,
  '',
  `Status (owner, ${PROJECT_STATUS.asOf}): ${PROJECT_STATUS.stage}; ${PROJECT_STATUS.progress.toLowerCase()}; handover ${PROJECT_STATUS.handover}. ${PROJECT_STATUS.modifications}`,
  '',
  `Key features (owner-specified, not certificates): ${KEY_FEATURES.map((f) => f.title).join('; ')}. Services: ${BUILDING_SERVICES.join(', ')}.`,
  '',
  'Notes: areas are computed from the architect\'s sheets and are not certified; parking capacity is not fixed; 3D images and the 3D walkthrough are indicative and subject to change; nothing here is an offer. Opening years for the Apollo hospital (OPD 2027) and the NIFT campus (2027) are the owner\'s expectations.',
  '',
  '## Approximate distances',
  ...NEARBY_DISTANCES.map((d) => `- ${d.name}: ${d.value}${d.note ? ` (${d.note})` : ''}`),
  '',
  '## Pages',
  ...SEO_ROUTES.filter((r) => r.priority >= 0.5).map((r) => {
    const label = (nav.find(([p]) => p === r.path) || [])[1] || r.path.replace('spaces/floor-', 'Floor ');
    return `- [${label}](${url(r.path)}): ${r.description}`;
  }),
  '',
  `## Nearby projects (reviewed ${FOOTFALL_AS_OF})`,
  ...NEARBY_PROJECTS.map((p) => `- ${p.name} (${p.distance}): ${p.status}`),
  '',
  `See ${url('growth')} for the source of each project. No footfall figure is claimed for this road.`,
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
