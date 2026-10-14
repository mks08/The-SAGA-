# SRINEVA — Premium Commercial & Mixed-Use Spaces

Official digital leasing website for **SRINEVA**, a Ground + 3 commercial building at D-15, Bada Lalpur, Chandmari, Varanasi.

Angular 16 · TypeScript · SCSS · Tailwind 3

Canonical domain: [https://srineva.com/](https://srineva.com/)  
Leasing: leasing@srineva.com

## Local commands

```bash
cd the-saga-varanasi
npm install
npm start                 # http://localhost:4200
npm run build             # production build → dist/the-saga-varanasi
```

Node 18.x is specified in `package.json`. If you are on a newer Node, the CLI may still work; prefer 18 for CI.

## Route map

| Path | Page |
|------|------|
| `/` | Homepage |
| `/property` | Building, areas, parking, visibility |
| `/spaces` | Floor stack |
| `/spaces/floor-1` `/floor-2` `/floor-3` | Floor detail |
| `/location` | Address, map, anchors |
| `/growth` | Bada Lalpur growth timeline |
| `/business-fit` | Occupier categories |
| `/infrastructure` | Technical specifications + F&B provisions |
| `/floor-plans` | Plan placeholders (until drawings are issued) |
| `/gallery` | Architecture / construction / location |
| `/leasing` | Lease enquiry |
| `/brokers` | Tenant-rep / broker desk |
| `/contact` | Site visit + leasing form |
| `/privacy` `/terms` `/disclaimer` | Legal |

Thin SEO doorway pages were **not** created.

## Canonical facts

All public numbers come from `src/app/config/property.config.ts`. Do not hard-code areas, parking, contact or address in templates.

Editorial copy lives in `src/app/config/content.config.ts`.  
Route titles / descriptions live in `src/app/config/seo.config.ts`.

## SEO

- Per-route title, description, canonical, Open Graph, Twitter tags via `SeoService`
- JSON-LD: Organization, WebSite, Place, BreadcrumbList, FAQPage (home)
- `robots.txt` and `sitemap.xml` copied into the build
- `src/index.html` holds the home fallback tags for first paint / crawlers
- SPA fallback for Hostinger is `src/.htaccess`

This build is a client-rendered Angular 16 app with a content-rich `index.html` and `noscript` block. Full HTML prerender / Angular Universal was **not** added, because Hostinger shared hosting serves static files and Universal would require a Node server. When a Node environment is available, add `@nguniversal/express-engine@16` and prerender the routes in `sitemap.xml`.

### Search Console

1. Verify `srineva.com` (DNS or HTML file).
2. Submit `https://srineva.com/sitemap.xml`.
3. Use URL Inspection on `/`, `/spaces`, `/location`, `/leasing`.
4. Validate JSON-LD with [Google Rich Results Test](https://search.google.com/test/rich-results).

### Analytics

Set IDs in `src/environments/environment.prod.ts`:

```
ga4MeasurementId
googleAdsConversionId
googleAdsConversionLabel
```

Then add the gtag snippet to `index.html`. Events already fire when `gtag` exists:

`site_visit_click` · `leasing_form_start` · `leasing_form_submit` · `whatsapp_click` · `phone_click` · `email_click` · `dossier_download` · `floor_enquiry`

## Hostinger deployment

1. `npm run build`
2. Upload the **contents** of `dist/the-saga-varanasi/` to `public_html`
3. Confirm `.htaccess` is present (SPA fallback + HTTPS + www → apex)
4. Point the domain to `srineva.com` (non-www canonical)
5. Confirm `https://srineva.com/sitemap.xml` and `https://srineva.com/robots.txt`

## Missing inputs (do not invent)

Insert into `property.config.ts` when confirmed:

- Built-up / super / common area
- Exact sanctioned electrical load
- Road width
- Two-wheeler parking count
- Signage zone width / projecting-signage limits
- Verified Google Maps pin (replace `googleMapsUrl` / `embedSrc`)
- Verified distances / drive times for Apollo, NIFT, Hastkala, Ring Road, airport, Cantt
- Floor-plan PDF / SVG assets
- Construction and site photography
- Confirmed leasing phone if it should differ from the current line

## Design notes

Dark architectural luxury. Gold is an accent. Cormorant Garamond + DM Sans + DM Mono. Homepage is a long editorial narrative, not a card grid.
