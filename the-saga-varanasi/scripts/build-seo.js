/**
 * Post-build SEO step.
 *  1. Writes one static HTML shell per route (dist/<route>/index.html) with the right
 *     <title>, description, canonical, Open Graph / Twitter tags and a <noscript> block
 *     (H1, summary, key facts and links to every page), so crawlers and link previews that
 *     do not run JavaScript still see unique, correct content.
 *  2. Regenerates sitemap.xml from the same route list.
 * Source of truth: src/app/config/seo.config.ts (+ property.config.ts, faq.config.ts).
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const cfgDir = path.join(root, 'src/app/config');
const distDir = path.join(root, 'dist/the-saga-varanasi');

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
const { FAQS, HOME_FAQ_COUNT } = load(path.join(cfgDir, 'faq.config.ts'));

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('dist index.html not found. Run `ng build` first.');
  process.exit(1);
}
const base = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const url = (p) => (p ? `${SEO_DOMAIN}/${p}` : `${SEO_DOMAIN}/`);

const nav = [
  ['', 'Home'], ['property', 'The Property'], ['floor-plans', 'Floor Plans'], ['gallery', 'Gallery'],
  ['location', 'Location'], ['growth', 'Growth'], ['business-fit', 'Business Fit'], ['infrastructure', 'Infrastructure'],
  ['spaces', 'Spaces'], ['leasing', 'Leasing'], ['brokers', 'Brokers'], ['faq', 'FAQ'], ['contact', 'Contact'],
];

function setMeta(html, attr, key, content) {
  const re = new RegExp(`<meta ${attr}="${key}"[^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${esc(content)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

function noscript(route) {
  const facts = [
    `${PLAN.plot.areaSqM} sq m VDA-approved plot, ${PLAN.plot.facing.toLowerCase()}-facing, ${PLAN.plot.frontage} frontage on a ${PLAN.plot.roadWidthM} m road`,
    `Stilt plus three floors; each floor ${PLAN.typical.floorArea.sqft} sq ft floor area, ${PLAN.typical.carpet.sqft} sq ft carpet (computed, not certified)`,
    `${PLAN.lift.capacity} passenger lift; ${PROPERTY.parking.totalCars} car parking (owner brief)`,
    'About 60–70 m from Apollo Hospital and NIFT Varanasi (both under construction, opening 2027 expected), about 330 m from the Varanasi Trade Centre, about 1 km by road from the Ring Road',
  ];
  const links = nav.map(([p, l]) => `<li><a href="${url(p)}">${esc(l)}</a></li>`).join('');
  const faq = route.path === 'faq'
    ? `<h2>Frequently asked questions</h2>${FAQS.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}`
    : '';
  return `<noscript><header><p>SHRINEVA</p><h1>${esc(route.h1)}</h1><p>${esc(route.description)}</p></header>` +
    `<ul>${facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>${faq}` +
    `<p>${esc(PROPERTY.address.full)}. Call ${esc(PROPERTY.contact.phoneDisplay)} or ${esc(PROPERTY.contact.phone2Display)}; email ${esc(PROPERTY.contact.email)}.</p>` +
    `<nav aria-label="Site"><ul>${links}</ul></nav></noscript>`;
}

function shell(route) {
  const canonical = url(route.path);
  const image = route.image || PROPERTY.images.og;
  const alt = route.imageAlt || 'SHRINEVA commercial building, Bada Lalpur, Varanasi (indicative 3D render)';
  let html = base;
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
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscript(route));
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
