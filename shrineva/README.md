# SHRINEVA — website

Leasing site for **SHRINEVA**, a commercial building (open ground level plus three identical floors) at Plot No. D-15, Lalpur Housing Scheme, Stadium Road, Bada Lalpur, Varanasi 221003, opposite the **upcoming** Apollo Hospital.

Angular 16 + Tailwind 3 app, **genuinely pre-rendered** per route at build time (Angular's own server renderer; the browser then reuses that HTML), deployed as static files plus one small PHP endpoint for enquiries. Domain: **shrineva.in**. Enquiries: **leasing@shrineva.in**.

## Run and build

```bash
npm install          # Node 18.x
npm start            # dev server
npm run build        # browser build + server build, then prerender + SEO files + gates. Always run the full build.
```

`npm run build` runs `ng build` (to `dist/shrineva`) and `ng run shrineva:server:production` (to `dist/shrineva-server`, build tool only, **never uploaded**). `postbuild` then runs:

1. `scripts/prerender.js`: renders every route of the real app with `renderModule` and writes `dist/shrineva/<route>/index.html` (11 routes) plus `404.html`. Each file holds the page exactly as a visitor sees it, with title, description, canonical, hreflang, Open Graph and JSON-LD written by `SeoService` during the render. Nothing is hidden. The home page also gets a `<link rel="preload">` for the golden-hour hero image. Any render error or timeout fails the build.
2. `scripts/build-seo.js`: writes `sitemap.xml` (with hreflang alternates), `robots.txt` (search and AI crawlers named and allowed) and `llms.txt`, then runs the **quality gates**:
   - English titles 50-60 and descriptions 145-155 characters (Hindi route: 30-62 and 80-160); FAQ answers 40-60 words; exactly one H1; one canonical; `<html lang>` and hreflang pairs correct
   - valid JSON-LD (no `RealEstateAgent`, `Accommodation`, `Residence`, `Apartment`); FAQPage matches the visible FAQ
   - no forbidden claims: "column-free" / "pillar-free", "60-70 m", a handover date, studio / residential wording, any VDA wording beyond the short badge
   - "Apollo" never without "upcoming / under construction" (Hindi: "निर्माणाधीन")
   - the home preload and first hero image are the golden-hour image; the VDA badge appears exactly when `approvals.vda.show` is true
   - no hidden-text patterns, every `<img>` has alt, width, height and a loading mode, every link and asset resolves, every route is in the `.htaccess` whitelist

**SSR rules** (so the prerender keeps working): code that touches `window`, `document`, observers or timers is guarded with `isPlatformBrowser`. Nothing may start a timer or interval on the server, or the render never settles (40 s limit).

## Pages

| Page | Purpose |
|---|---|
| `/` | Hero (finalised 3D, **golden hour** by default, night on request; "VDA approved" badge), answer-first block with six facts, guided walkthrough, floor-plan teaser, location map, brochure download, business paths, FAQ, enquiry |
| `/walkthrough` | Seven-stop guided tour of the final 3D design (auto-advances, pausable, enlargeable), then photographs of the building as it stands today |
| `/floor-plans` | Ground-level and typical-floor plans (plan and 3D view), areas, PDF download |
| `/healthcare-diagnostic-space`, `/office-bank-coaching-space`, `/retail-showroom-cafe-space` | Intent pages for ads and search: answer first, facts, qualified form, FAQ. Copy in `landing.config.ts`; `/?intent=healthcare\|office\|retail\|floor` changes the home headline for an ad |
| `/location-contact` | Address, hours, phones, map, distances, site-visit form, FAQ |
| `/leasing` | What is available, **space finder**, how leasing works, downloads, enquiry form, FAQ |
| `/hi` | Hindi page (hreflang pair of `/`): answer, facts, floors, uses, distances, FAQ, contact. Copy in `hindi.config.ts` |
| `/privacy-disclaimer`, `/terms` | Legal |

Old URLs (`/property`, `/spaces/*`, `/infrastructure`, `/growth`, `/gallery`, `/brokers`, `/location`, `/contact`, `/privacy`, `/disclaimer`, `/business-fit`) 301 to the new pages in `.htaccess`, in the app router and in `vercel.json`.

## Where things live

| What | File |
|---|---|
| Facts: areas, plan figures, address, GPS, phones, hours, domain, `sameAs`, residential switch | `src/app/config/property.config.ts` |
| Titles, descriptions, H1, sitemap priority per route | `src/app/config/seo.config.ts` |
| FAQ text (page, FAQPage markup, static HTML and llms.txt all read it) | `src/app/config/faq.config.ts` |
| Page copy shared with the static HTML: level areas, leasing points and steps | `src/app/config/content.config.ts` |
| Intent pages | `src/app/config/landing.config.ts` |
| Distances | `src/app/config/location.config.ts` |
| Hindi page copy (derived from the same figures) | `src/app/config/hindi.config.ts`, `src/app/pages/hindi-page/` |
| Space finder options and notes; construction-progress entries (`PROGRESS_UPDATES`) | `src/app/config/content.config.ts`, `src/app/components/space-finder/` |
| Language of the shell (switch, pop-up, action bar) | `navbar`, `booking-popup/popup-text.ts`, `core/services/page-lang.service.ts` |
| Prerender and SEO build | `scripts/prerender.js`, `scripts/build-seo.js`, `scripts/lib/load-ts.js`, `src/main.server.ts`, `src/app/app.server.module.ts` |
| Images: hero day/night, tour stops, plans, site photos, map, brochure | `src/app/config/media.config.ts`, `src/assets/images/` |
| Brochure and floor-plan PDFs | `src/assets/shrineva-brochure.pdf`, `src/assets/shrineva-floor-plans.pdf` |
| Logo (always the designed artwork, never typed text) | `src/app/components/brand-logo/`, `src/assets/images/logo-*.webp` |
| Structured data | `src/app/core/seo/schema.ts` |
| Enquiry delivery | `src/app/core/services/lead.service.ts`, `src/api/lead.php`, `src/api/config.php` |
| Apache rules | `src/.htaccess` |

**Rule for editing:** change a fact once in `property.config.ts` (or the config above); pages, schema, sitemap text, llms.txt and the static HTML all read from it. Do not type areas or distances into templates.

**Logo:** use `<app-brand-logo>` (`variant="lockup"` for header and footer, `variant="wordmark"` for large headings). The SG monogram and the SHRINEVA lettering are cut from the owner's logo with a transparent background.

## Content rules

- Facts only. Approvals, rents, footfall and completion dates are not claimed. The Apollo Hospital is always "upcoming / under construction". Use of any floor is "subject to floor suitability and applicable statutory approvals".
- Areas are about 3,500 sq ft gross and about 3,100 sq ft carpet per upper floor, approximate and subject to final measurement.
- Renders are labelled indicative. Photographs are labelled as construction progress. The renders themselves are not edited.
- The studio / residential plan is not mentioned anywhere (`PROPOSED_RESIDENTIAL.show = false`).
- Floors are described as "Open-plan commercial floor plates with flexible tenant layouts". Never "column-free" (the build fails on it).
- **VDA badge:** shown on the owner's instruction (20 Nov 2026) as the short label "VDA approved" only (`approvals.vda` in `property.config.ts`; set `show: false` to remove it). Its scope (plan sanction, number, date) is still to be confirmed with the owner; no wider approval wording is allowed.

## Add a page

1. Create the page component and route in `src/app/app-routing.module.ts`.
2. Add it to `SEO_ROUTES` in `seo.config.ts` (give a translated page `lang` and `alternates`), and to the nav list in `scripts/build-seo.js`.
3. Add the path to the route whitelist line in `src/.htaccess`. The build fails if you forget.

## Public domain

Configured for **https://shrineva.in**. To change it:

```bash
node scripts/set-domain.js https://example.com
npm run build
```

## Where enquiries go

```
visitor's browser ──► /api/lead.php (this site's hosting)
                          ├─ validates, rate-limits, ignores bots (honeypot)
                          ├─ keeps a private copy: leads.csv + leads-YYYY-MM.jsonl
                          └─ emails the recipients in api/config.php (leasing@shrineva.in)
                      if that fails ──► FormSubmit (third party) ──► the leasing inbox
                      if that fails ──► the page shows the phone and WhatsApp numbers
```

**First deployment**

1. Create the mailbox `leasing@shrineva.in` (Hostinger → Emails). Until it exists, mail to it bounces; the private copy in `leads.csv` is always kept.
2. For reliable delivery add `api/config.local.php` on the server (git-ignored):

   ```php
   <?php return [
     'transport' => 'smtp',
     'smtp' => ['host' => 'smtp.hostinger.com', 'port' => 465, 'secure' => 'ssl',
                'user' => 'leasing@shrineva.in', 'pass' => '********'],
     'from' => 'leasing@shrineva.in',
   ];
   ```
3. Submit the form once from the live site; check the inbox and `shrineva-leads/leads.csv` (one level above `public_html`, or `api/_data/`).
4. The first FormSubmit backup submission emails an activation link; click it or the backup stays silent.
5. Add SPF, DKIM and DMARC for the domain in hPanel.

Phones: +91 81140 80609 (also WhatsApp) and +91 73557 70378.

## Analytics

`src/environments/environment*.ts` hold `ga4MeasurementId` (G-…), `googleAdsId` (AW-…) and `googleAdsLabels`. They are empty; nothing loads until set, but events still go to `window.dataLayer`. With IDs set, gtag.js loads once, GA4 and Ads are configured, and each conversion also sends its Ads label (tested with dummy IDs).

Events: `shrineva_commercial_lead` (the enquiry form **and** the short "Schedule a visit" pop-up), `shrineva_phone_click`, `shrineva_whatsapp_click`, `shrineva_brochure_download` (any `.pdf` link). Phone, WhatsApp and PDF clicks are caught by one delegated listener. UTM tags and `gclid` are kept for the session and sent with every enquiry. If an older `leads.csv` exists on the server, rename it before the first new lead (columns changed).

## Deploy to Hostinger (static upload)

1. `npm run build`.
2. hPanel → File Manager (or FTP): back up `public_html`, remove the old site, upload the **contents** of `dist/shrineva/` including the hidden `.htaccess` and the `api/` folder. Do **not** upload `dist/shrineva-server/`.
3. Delete old folders if present: `location/`, `contact/`, `privacy/`, `disclaimer/`, `property/`, `spaces/`, `growth/`, `gallery/`, `business-fit/`, `infrastructure/`, `brokers/`.
4. Check: `curl -I http://shrineva.in/` (301 to https), `curl -I https://www.shrineva.in/` (301 to apex), `curl -I https://shrineva.in/contact` (301 to `/location-contact`), `curl -I https://shrineva.in/nope` (404).
5. Follow "Where enquiries go". In Google Search Console add the domain and submit `sitemap.xml`; do the same in Bing Webmaster Tools.

**Rollback:** keep the previous `public_html` as a zip; to roll back, delete the new files and restore it. `vercel.json` is included as an alternative; the PHP endpoint does not run there (forms use the FormSubmit route).

## Performance (measured, phone-sized screen, slow 4G, CPU slowed 4x)

Home about 500 KB and main content in about 1.6 s; floor plans about 370 KB; `/hi` about 270 KB; `/leasing` and business pages about 245 KB. Levers: pre-rendered HTML, Brotli and long caching in `.htaccess`, preloaded golden-hour hero, night image and tour images loaded on demand, live map iframe only when near the viewport, Latin-only fonts, system Devanagari font on `/hi`, no CSS blur filters.

## Known follow-ups

- Angular 16 is out of support: plan an upgrade.
- Add GA4 / Ads IDs and profile URLs (`sameAs`) when available.
- Fill `PROGRESS_UPDATES` (`content.config.ts`) with dated entries; the section on `/walkthrough` appears with the first one.
- Floor-plan hotspots (lift, stairs, columns, windows, fire exit) need architect-verified coordinates before they are built. A labelled map needs the owner's pins (Google My Maps link).
- Hindi copy needs review by a Hindi reader. Booking pop-up, action bar and WhatsApp message switch to Hindi on `/hi`.
- Ground level is labelled "parking" in some brochure imagery and described as "ground level with parking for 12+ cars" on the site: confirm and keep consistent when the brochure is re-issued.
- No CAPTCHA on the enquiry endpoint (honeypot and rate limit only); consider Cloudflare Turnstile if spam appears.
- Not tested yet: Firefox and real devices (Chromium and WebKit engines were).
