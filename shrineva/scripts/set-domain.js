/**
 * One-command domain switch.   node scripts/set-domain.js https://shrineva.com
 * Updates the two places the public domain lives (property.config.ts → domain.canonical and the
 * static tags in src/index.html). Sitemap, robots.txt, canonical/OG tags and JSON-LD are all
 * regenerated from that value by `npm run build`. Nothing here buys, points or verifies a domain.
 */
const fs = require('fs');
const path = require('path');

const next = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(next)) {
  console.error('Usage: node scripts/set-domain.js https://your-domain.tld   (https, no path, no trailing slash)');
  process.exit(1);
}
const root = path.resolve(__dirname, '..');
const cfg = path.join(root, 'src/app/config/property.config.ts');
const idx = path.join(root, 'src/index.html');

let c = fs.readFileSync(cfg, 'utf8');
const m = c.match(/canonical:\s*'(https:\/\/[^']+)'/);
if (!m) { console.error('domain.canonical not found in property.config.ts'); process.exit(1); }
const prev = m[1];
c = c.replace(m[0], `canonical: '${next}'`);
fs.writeFileSync(cfg, c);

let h = fs.readFileSync(idx, 'utf8');
h = h.split(prev).join(next);
fs.writeFileSync(idx, h);
console.log(`Domain changed ${prev} -> ${next}. Now run: npm run build`);
