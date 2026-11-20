/**
 * Pre-render step (runs after `ng build` and `ng run shrineva:server`, see package.json "postbuild").
 *
 * Renders every route of the real Angular app to static HTML with Angular's own server renderer, so the file for each URL
 * already contains the page exactly as a visitor sees it: headings, copy, plans, FAQ, links, title, meta tags, canonical
 * and JSON-LD (written by SeoService during the render). Nothing is hidden or duplicated. In the browser Angular reuses
 * this HTML (hydration) instead of building the page again.
 *
 *   dist/shrineva-server/main.js   server bundle (build tool only, never uploaded)
 *   dist/shrineva/index.html       browser build's app shell, used as the template and as the base for 404.html
 *   dist/shrineva/<route>/index.html   written here, one per route in src/app/config/seo.config.ts
 *
 * Then scripts/build-seo.js writes sitemap.xml, robots.txt and llms.txt and runs the quality gates on this HTML.
 */
const fs = require('fs');
const path = require('path');
const { load, root } = require('./lib/load-ts');

const distDir = path.join(root, 'dist/shrineva');
const serverMain = path.join(root, 'dist/shrineva-server/main.js');
const { SEO_ROUTES } = load(path.join(root, 'src/app/config/seo.config.ts'));
const { PROPERTY } = load(path.join(root, 'src/app/config/property.config.ts'));
const { HERO } = load(path.join(root, 'src/app/config/media.config.ts'));

for (const f of [path.join(distDir, 'index.html'), serverMain]) {
  if (!fs.existsSync(f)) { console.error(`Missing ${path.relative(root, f)}. Run "npm run build" (it builds the browser app and the server bundle first).`); process.exit(1); }
}

// The pristine app shell. It is kept in memory because dist/shrineva/index.html is overwritten by the home page below.
const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

const { AppServerModule, renderModule } = require(serverMain);

const HERO_SIZES = '100vw';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The home page paints the hero image first: preload exactly the file the hero shows. */
function heroPreload() {
  const v = HERO;
  return `<link rel="preload" as="image" href="${v.src960}" imagesrcset="${v.src960} 960w, ${v.src1920} 1920w" imagesizes="${HERO_SIZES}" fetchpriority="high">`;
}

async function renderRoute(route) {
  const errors = [];
  const origError = console.error;
  console.error = (...a) => { errors.push(a.map(String).join(' ')); };
  try {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('render timed out after 40 s (a timer or request keeps the app unstable)')), 40000));
    let html = await Promise.race([renderModule(AppServerModule, { document: template, url: '/' + route.path }), timeout]);
    if (route.path === '') html = html.replace('</head>', `  ${heroPreload()}\n</head>`);
    return { html, errors };
  } finally {
    console.error = origError;
  }
}

(async () => {
  let failed = false;
  for (const route of SEO_ROUTES) {
    const label = '/' + route.path;
    try {
      const { html, errors } = await renderRoute(route);
      if (errors.length) { failed = true; console.error(`${label}: errors while rendering:\n  ` + errors.join('\n  ')); continue; }
      if (!/<h1[\s>]/.test(html)) { failed = true; console.error(`${label}: the rendered page has no <h1>`); continue; }
      const out = route.path ? path.join(distDir, route.path, 'index.html') : path.join(distDir, 'index.html');
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
      console.log(`rendered ${label.padEnd(32)} ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
    } catch (e) {
      failed = true;
      console.error(`${label}: render failed: ${e && e.stack ? e.stack : e}`);
    }
  }
  if (failed) process.exit(1);

  // 404.html: the plain app shell (starts the app, which sends the visitor home), marked noindex. .htaccess serves it with a real 404 status.
  let nf = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>Page not found | ${esc(PROPERTY.brand.name)}</title>`);
  nf = nf.replace(/<link rel="canonical"[^>]*>/i, '');
  nf = nf.replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="noindex, follow">');
  fs.writeFileSync(path.join(distDir, '404.html'), nf);
  console.log(`pre-rendered ${SEO_ROUTES.length} routes; 404.html written`);
})();
