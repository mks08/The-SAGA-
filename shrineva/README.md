# SHRINEVA — website

Marketing and leasing site for **SHRINEVA**, a commercial building (open parking level + three whole floors, "Parking + 3") at D-15, Bada Lalpur, Chandmari, Varanasi 221003.

Angular 16 single-page app with Tailwind CSS 3, pre-rendered per route at build time (static HTML shells with title, description, canonical, Open Graph, `<noscript>` text and JSON-LD), deployed as static files plus one small PHP endpoint for enquiries.

## Run and build

```bash
npm install          # Node 18.x
npm start            # dev server
npm run build        # ng build, then scripts/build-seo.js (postbuild)
```

Output: `dist/shrineva/`. `postbuild` writes, from the same route list and domain:

- one `index.html` per route (20 routes, e.g. `/walkthrough/index.html`, `/spaces/floor-1/index.html`)
- `sitemap.xml`, `robots.txt` and `llms.txt` (a plain-text summary for AI assistants, built from the same config)
- `404.html`, which `.htaccess` serves with a real 404 status for unknown URLs
- JSON-LD (Organization, WebSite, Place, WebPage, BreadcrumbList, plus FAQPage on `/` and `/faq`, ImageGallery on `/gallery`) inside each shell; the runtime `SeoService` updates the same element when visitors navigate
- the hero-image preload, on the home shell only

## What the site does

| Page | Purpose |
|---|---|
| `/` | Hero with the footfall case first, "Nearby projects" with sources, 3D walkthrough, specs, floor plans, business fit, gallery, map pin, FAQ, contact |
| `/growth` | Detailed nearby projects: each card dated and linked to its source |
| `/walkthrough` | Full 3D model: orbit, open any floor, pull the floors apart, step inside, guided tour, day / golden hour / night, illustrative layouts |
| `/floor-plans`, `/spaces/floor-N` | The architect's plans (repainted for web) with computed area statement |
| `/location` | Google Maps embed with directions, distances |
| `/leasing`, `/brokers`, `/contact` | Enquiry routes; leasing@shrineva.com and both phone numbers |

### 3D walkthrough

- Three.js 0.160 in a lazy chunk (`712.*.js`, about 121 kB gzipped). It downloads only when a visitor starts it on the home page, or opens `/walkthrough`. Initial JS for the rest of the site is about 151 kB gzipped.
- The model is generated from `src/app/config/building.config.ts` (the architect's sheets SH-01 and SH-02 read in feet), so the 3D model and the plan cannot drift apart. Edit dimensions there.
- Everything the architect has not drawn (façade finishes, furniture presets, neighbours, trees) is illustrative and labelled so on screen. The model uses a nominal 10′-6″ ceiling; clear height is to be confirmed.
- Controls: drag to look (hover leans the view on desktop), W A S D / arrows to walk, Q E to turn, click or tap the floor to walk there, scroll or pinch to zoom outside, Esc leaves full screen. On touch screens the page still scrolls over the canvas until the visitor goes full screen.
- Falls back to the static renders and plans when WebGL is unavailable. Respects `prefers-reduced-motion`.
- Debug handle `window.__wt` exists only when the URL contains `?wtdebug`.

### Map pin

The Location section embeds a real Google Map with directions links, centred on the area by name. To pin the exact plot, set `PROPERTY.address.lat` and `lng` in `property.config.ts` (copy them from Google Maps: right-click the plot, click the coordinates). The embed, "Open map" and "Get directions" then all use the pin. Do not guess coordinates.

### VDA tag

The small "VDA approved" tag comes from `PROPERTY.approvals.vda`. It reflects the owner's statement; no approval number is published. Set `PROPERTY.approvals.vda.show` to `false` to remove every instance.

## Where things live

| What | File |
|---|---|
| Property facts (areas, plan figures, contact, address, domain, VDA flag) | `src/app/config/property.config.ts` |
| 3D geometry, tour stops, presets | `src/app/config/building.config.ts` |
| Nearby projects and the dated footfall evidence | `src/app/config/footfall.config.ts` |
| Page titles, descriptions, routes | `src/app/config/seo.config.ts` |
| FAQ (visible list **and** FAQPage schema) | `src/app/config/faq.config.ts` |
| Marketing copy that is not a measured fact | `src/app/config/content.config.ts` |
| Images, renders, plan sheets | `src/app/config/media.config.ts`, `src/assets/` |
| Motion (reveal, count-up, tilt, spotlight, parallax) | `src/app/shared/directives/` |
| Design tokens and plugin (colours as CSS variables) | `tailwind.config.js`, `src/styles.scss` |
| Structured data | `src/app/core/seo/schema.ts` |
| Lead form delivery | `src/app/core/services/lead.service.ts`, `src/api/lead.php` |
| Apache rules (HTTPS, www → apex, SPA fallback, caching, headers) | `src/.htaccess` |

**Rule for editing:** change a fact in `property.config.ts` once; pages, FAQ, schema, sitemap text and `<noscript>` all read from it. Do not type areas or distances into templates.

## Add a page

1. Create the page component and add its route in `src/app/app-routing.module.ts`.
2. Add an entry (path, title, description, h1, priority) to `SEO_ROUTES` in `src/app/config/seo.config.ts`.
3. Add the path to the route whitelist line in `src/.htaccess`. `npm run build` fails with the missing path if you forget, because an unlisted path would return 404 on the live host.

## Public domain

The repository is configured for **https://shrineva.com**. Nothing here registers, points or verifies a domain. To change it:

```bash
node scripts/set-domain.js https://example.com
npm run build
```

## Where enquiries go

Every form (contact, site visit, broker, leasing) sends the same JSON:

```
visitor's browser ──► /api/lead.php (this site's own hosting)
                          ├─ validates, rate-limits, ignores bots (honeypot)
                          ├─ keeps a private copy: leads.csv + monthly leads-YYYY-MM.jsonl
                          └─ emails the recipients in api/config.php
                      if that fails ──► FormSubmit (third-party) ──► leasing inbox
                      if that fails ──► the page shows the phone and WhatsApp numbers
```

The site says "sent" only when one of the two routes confirms delivery.

**Owner actions on first deployment**

1. **Mailbox.** `leasing@shrineva.com` must exist (Hostinger → Emails) before mail to it is delivered. Until then the second recipient in `api/config.php` still receives every enquiry, and the private copy is always kept.
2. **SMTP (recommended).** PHP `mail()` works on most Hostinger plans but cannot be tested from outside the host. For reliable delivery create `api/config.local.php` on the server (it is git-ignored):

   ```php
   <?php return [
     'transport' => 'smtp',
     'smtp' => ['host' => 'smtp.hostinger.com', 'port' => 465, 'secure' => 'ssl',
                'user' => 'leasing@shrineva.com', 'pass' => '********'],
     'from' => 'leasing@shrineva.com',
   ];
   ```
3. **Test it.** Submit the contact form once from the live site. Check the inbox, then check `shrineva-leads/leads.csv` one level above `public_html` (or `api/_data/`, which `.htaccess` closes to the web).
4. **FormSubmit (backup route).** The first backup submission makes FormSubmit email an activation link. Click it, or the backup route stays silent.
5. **Email authentication.** Add SPF, DKIM and DMARC for the domain in hPanel, or enquiry mail is likely to land in spam.

Recipients are never displayed on any page. (The backup route's address does have to be readable in the page's JavaScript, as with any browser-side form service. To hide it, swap in FormSubmit's random alias after activation.) Phones shown: +91 73557 70378 and +91 81140 80609. WhatsApp messages are prefilled by `waLink()` in `property.config.ts`.

## Analytics

`src/environments/environment*.ts` hold `ga4MeasurementId`, `googleAdsConversionId`, `googleAdsConversionLabel`. They are empty; tracking stays off until the owner supplies them. Events include `whatsapp_click`, `phone_click`, `floor_plans_click`, `plan_open`, `plan_pdf_download`, `site_visit_click`, `site_visit_submit`, `leasing_form_submit`, `walkthrough_start`, `walkthrough_page_click` and the matching `*_error` events (see `AnalyticsService`).

## Deploy to Hostinger (static upload)

1. `npm run build`.
2. In hPanel → File Manager (or FTP), open `public_html/`, remove the old site files, and upload the **contents** of `dist/shrineva/` (including the hidden `.htaccess` and the `api/` folder).
3. Confirm SSL is active, then open `/`, `/walkthrough`, `/floor-plans`, `/faq`, `/does-not-exist` (should show the app's 404 page, not a server error).
4. Follow "Where enquiries go" above.
5. In Google Search Console add the domain, submit `https://<domain>/sitemap.xml`, and inspect `/` and `/growth`.

`.htaccess` behaviours (HTTPS redirect, www → apex, directory index rewrite, cache and security headers) cannot be exercised locally. Check them after upload with `curl -I http://<domain>/` and `curl -I https://www.<domain>/`.

**Rollback:** keep the previous `public_html` contents as a zip before uploading; to roll back, delete the new files and restore the zip. Vercel alternative: `vercel.json` is included, but the PHP endpoint does not run there (the form then uses the FormSubmit route).

## Content rules this project follows

- No approval numbers, parking counts, tenants, rents, returns or reviews that the owner has not supplied. Parking capacity is deliberately "to be confirmed".
- Areas are computed from the architect's dimensions (floor area 3,519.75 sq ft, carpet 3,017.25 sq ft per floor) and labelled as such, not certified. Frontage is stated as "about 50 ft"; exact dimensions stay on the drawings.
- The building is called "Parking + 3". The architect's sheet title still says "Stilt" internally; that word does not appear on the site.
- 3D images and the walkthrough are labelled indicative.
- Nearby projects are described with source and date. Each is a development reference, not a footfall count (`FOOTFALL_NOT_CLAIMED`); no confidence labels are shown.
- Setback dimensions and the original architectural drawings are not published on marketing pages.

## Known follow-ups

- The PDF `src/assets/shrineva-floor-plans.pdf` is the owner's original and still carries the old "Stilt" and opening-year wording. Re-issue it with the architect before promoting the download.
- Angular 16 is out of support: plan an upgrade (P2).
- Map pin needs verified coordinates (see above).
- The 3D model has been tested in a software renderer only; check it on a real phone and a laptop GPU before launch.
