/**
 * Tells Bing and the other IndexNow engines (Yandex, Naver, Seznam, Yep) that the SHRINEVA pages have changed, so they are
 * re-crawled within hours instead of days. Run it AFTER you have uploaded the new build to the live site:
 *
 *     node scripts/indexnow.js          # sends every page, the two PDFs
 *     node scripts/indexnow.js --dry    # only prints what would be sent
 *
 * No Node on your computer? Open this address in a browser instead (one page at a time), after the upload:
 *     https://api.indexnow.org/indexnow?url=https://shrineva.in/&key=<the key in src/app/config/seo.config.ts>
 * The key file https://shrineva.in/<key>.txt must be reachable (npm run build writes it into the site root).
 * Google does not use IndexNow: tell Google through Search Console (Sitemaps, and "Request indexing" for the home page).
 */
const { load, root } = require('./lib/load-ts');
const path = require('path');

const cfg = path.join(root, 'src/app/config');
const { SEO_ROUTES, SEO_DOMAIN, INDEXNOW_KEY } = load(path.join(cfg, 'seo.config.ts'));
const { BROCHURE } = load(path.join(cfg, 'media.config.ts'));

const host = new URL(SEO_DOMAIN).host;
const urlList = [
  ...SEO_ROUTES.map((r) => (r.path ? `${SEO_DOMAIN}/${r.path}` : `${SEO_DOMAIN}/`)),
  `${SEO_DOMAIN}/${BROCHURE.href}`,
  `${SEO_DOMAIN}/${BROCHURE.plansHref}`,
];
const body = { host, key: INDEXNOW_KEY, keyLocation: `${SEO_DOMAIN}/${INDEXNOW_KEY}.txt`, urlList };

if (process.argv.includes('--dry')) {
  console.log(JSON.stringify(body, null, 2));
  process.exit(0);
}

(async () => {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const meaning = { 200: 'accepted', 202: 'accepted (key check pending: make sure the key file is live)', 400: 'bad request', 403: 'key not valid: is the key file live at the key location?', 422: 'URLs do not match the host', 429: 'too many requests: try again later' };
  console.log(`IndexNow: HTTP ${res.status} ${meaning[res.status] || ''} (${urlList.length} URLs)`);
  process.exit(res.ok ? 0 : 1);
})().catch((e) => { console.error('IndexNow failed: ' + e.message); process.exit(1); });
