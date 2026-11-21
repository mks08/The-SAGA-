# SHRINEVA — website

Leasing site for **SHRINEVA**, a commercial building (open ground level plus three identical floors) at Plot No. D-15, Lalpur Housing Scheme, Bada Lalpur, Varanasi 221003, on a 24 m wide north-facing road, opposite the **upcoming** Apollo Hospital.

Angular 16 + Tailwind 3 app, **genuinely pre-rendered** per route at build time (Angular's own server renderer; the browser then reuses that HTML), deployed as static files plus one small PHP endpoint for enquiries. Domain: **shrineva.in**. Enquiries: **leasing@shrineva.in**.

## Run and build

```bash
npm install          # Node 18.x
npm start            # dev server
npm run build        # browser build + server build, then prerender + SEO files + gates. Always run the full build.
```

`npm run build` runs `ng build` (to `dist/shrineva`) and `ng run shrineva:server:production` (to `dist/shrineva-server`, build tool only, **never uploaded**). `postbuild` then runs:

1. `scripts/prerender.js`: renders every route of the real app with `renderModule` and writes `dist/shrineva/<route>/index.html` (11 routes) plus `404.html`. Each file holds the page exactly as a visitor sees it, with title, description, canonical, hreflang, Open Graph and JSON-LD written by `SeoService` during the render. Nothing is hidden. The home page also gets a `<link rel="preload">` for the hero image. Any render error or timeout fails the build.
2. `scripts/build-seo.js`: writes `sitemap.xml` (hreflang alternates, the two PDFs, the real site photographs, and a `lastmod` that moves only when the content does), `robots.txt` (30 named search, AI-search, AI-assistant and AI-model crawlers, all allowed), `llms.txt`, `llms-full.txt` and the IndexNow key file, then runs the **quality gates**:
   - English titles 50-60 and descriptions 145-155 characters (Hindi route: 30-62 and 80-160); FAQ answers 40-60 words; exactly one H1; one canonical; `<html lang>` and hreflang pairs correct
   - valid JSON-LD (no `RealEstateAgent`, `Accommodation`, `Residence`, `Apartment`); FAQPage matches the visible FAQ
   - no forbidden claims: "column-free" / "pillar-free", "60-70 m", "handover" (use "project completion"), a completion month without "target" and "subject to approvals", a year in a title or meta description, studio / residential wording, any VDA wording beyond the short badge
   - "Apollo" never without "upcoming / under construction" (Hindi: "निर्माणाधीन")
   - the home preload and first hero image are the hero image; the VDA badge appears exactly when `approvals.vda.show` is true
   - never "Stadium Road", never time-of-day wording (golden hour / night view), no lift capacity other than 10 passengers
   - the progress section (`#status`) with the targeted month and "Updated …" is on `/`, `/leasing` and `/walkthrough`; JSON-LD carries `dateModified` and the targeted completion; every named crawler is in `robots.txt` and none is shut out; every sitemap and llms link exists; the IndexNow key file is present
   - no hidden-text patterns, every `<img>` has alt, width, height and a loading mode, every link and asset resolves, every route is in the `.htaccess` whitelist

**SSR rules** (so the prerender keeps working): code that touches `window`, `document`, observers or timers is guarded with `isPlatformBrowser`. Nothing may start a timer or interval on the server, or the render never settles (40 s limit).

## Pages

| Page | Purpose |
|---|---|
| `/` | Hero (one final 3D image, fact bar, "VDA approved" badge), **what is available** (stack of levels, ways to lease), **space finder** (3D floor drawing that follows the size and use), brochure card, guided 3D walkthrough, safety / access / building specifications, satellite map and distances, business paths, FAQ, enquiry |
| `/walkthrough` | Seven-stop guided tour of the final 3D design (play / pause, previous / next, zoom, full screen, keyboard, "where this view is taken" pin), then photographs of the building as it stands today |
| `/floor-plans` | Typical-floor and ground-level plans (**2D first, 3D second**, zoom, full screen), area schedule, **site plan** (plot, 24 m road, setbacks, NIFT and Apollo), plan-set and brochure PDFs |
| `/healthcare-diagnostic-space`, `/office-bank-coaching-space`, `/retail-showroom-cafe-space` | Intent pages for ads and search: answer first, facts, qualified form, FAQ. Copy in `landing.config.ts`; `/?intent=healthcare\|office\|retail\|floor` changes the home headline for an ad |
| `/location-contact` | Address, phones, WhatsApp, leasing@shrineva.in, **satellite map at the brochure coordinates** (25.383306, 82.978028), distances, site-visit form, FAQ |
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
| Space finder: floor geometry and maths (feet, from the architect's sheet SH-02), the SVG scene, the UI | `src/app/config/floor-model.ts`, `src/app/components/space-finder/floor-scene.ts`, `space-finder.component.*` |
| Finder sizes, use chips, notes; key facts; the stack; fire-safety / access / building specifications; the **project status and timeline** (`PROJECT_STATUS`: stages, targeted completion month, update date, tenant-changes note) and dated progress entries (`PROGRESS_UPDATES`) | `src/app/config/content.config.ts` |
| Language of the shell (switch, pop-up, action bar) | `navbar`, `booking-popup/popup-text.ts`, `core/services/page-lang.service.ts` |
| Project progress section (stages + real site photographs, `#status`) | `src/app/components/project-timeline/` (photos from `SITE_PHOTOS` in `media.config.ts`) |
| Prerender and SEO build | `scripts/prerender.js`, `scripts/build-seo.js`, `scripts/lib/load-ts.js`, `src/main.server.ts`, `src/app/app.server.module.ts` |
| Images: hero, tour stops, plan sheets and 3D views, site photos, brochure cover | `src/app/config/media.config.ts`, `src/assets/images/` |
| Brochure (4 pages) and floor-plan set (3 pages) PDFs: generated from the same facts, in the site's fonts and colours (see "Brochure" below) | `src/assets/shrineva-brochure.pdf`, `src/assets/shrineva-floor-plans.pdf`, `tools/brochure/` |
| Logo (always the designed artwork, never typed text) | `src/app/components/brand-logo/`, `src/assets/images/logo-*.webp` |
| Structured data | `src/app/core/seo/schema.ts` |
| Enquiry delivery | `src/app/core/services/lead.service.ts`, `src/api/lead.php`, `src/api/config.php` |
| Apache rules | `src/.htaccess` |

**Rule for editing:** change a fact once in `property.config.ts` (or the config above); pages, schema, sitemap text, llms.txt and the static HTML all read from it. Do not type areas or distances into templates.

**Logo:** use `<app-brand-logo>` (`variant="lockup"` for header and footer, `variant="wordmark"` for large headings). The SG monogram and the SHRINEVA lettering are cut from the owner's logo with a transparent background.

## Brochure and plan-set PDFs

`node tools/brochure/build-brochure.js` rebuilds both PDFs and the brochure cover image (needs Playwright and `pdftoppm`; the pictures are shrunk first by `prep-images.py`, so the brochure stays under 2 MB). The brochure's four A4 portrait pages are: 1 cover (commercial and mixed-use space, address, nearby landmarks with the upcoming Apollo Hospital highlighted, map coordinates, website), 2 floor plans (ground, then floors 1 to 3, each with floor area, floor height and plot area), 3 project timeline with uncut site photographs, 4 location, setbacks, building facts, uses, how leasing works and the contacts. There are no 3D views in the brochure; the separate plan set keeps them. Contacts (both phones, WhatsApp, leasing@shrineva.in, shrineva.in) and the map / WhatsApp QR codes (`qr-*.png`, made from the brochure coordinates and 918114080609) are inside; every one is a live link. `tools/brochure/site-plan.png` is a screenshot of the site-plan drawing on `/floor-plans` (re-capture it if that drawing changes). The facts in the script mirror `src/app/config`; change both together.

## Project timeline and site photographs

`PROJECT_STATUS` in `content.config.ts` drives the section on the home page (stages, real photographs, the "want changes to your floor?" note), the stage list on `/leasing` and `/walkthrough`, the FAQ answer "When will the SHRINEVA building be complete…", the structured data (`Place` properties and `dateModified`), `llms.txt` / `llms-full.txt` and brochure page 3. **To update it:** change a stage's `state` (`done`, `active`, `next`, `target`), `updated`, `updatedISO` and, when there are new photographs, `photosTaken` and the `SITE_PHOTOS` list; then rebuild the brochure (`node tools/brochure/build-brochure.js`), run `npm run build`, upload, and run `npm run indexnow`. `updatedISO` is also the sitemap `lastmod`, so keep it honest.

## SEO and AI discoverability

- **Crawlable by everything:** every page is pre-rendered, real HTML (no JavaScript needed to read it), with title, description, canonical, hreflang, Open Graph and JSON-LD.
- **`robots.txt`:** names every search engine, AI-search crawler (OAI-SearchBot, Claude-SearchBot, PerplexityBot, DuckAssistBot, Meta-WebIndexer), AI assistant fetcher (ChatGPT-User, Claude-User, Perplexity-User, MistralAI-User, Meta-ExternalFetcher) and model crawler (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, meta-externalagent, Amazonbot, CCBot and others) and allows them; only `/api/` is closed. To keep a training crawler out, move its token in `AGENTS` (`scripts/build-seo.js`) to a `Disallow: /` group. A CDN or host "block AI bots" setting overrides this file: check `https://shrineva.in/robots.txt` after go-live.
- **`llms.txt` / `llms-full.txt`:** the summary and the whole site in Markdown, built from the same config as the pages. Google says Search does not use them; other assistants may.
- **IndexNow:** `npm run indexnow` (or the browser URL in `scripts/indexnow.js`) pings Bing and the other IndexNow engines after each upload. Google is told through Search Console.

## Content rules

- Facts only. Approvals, rents and footfall are not claimed. The completion month (March 2027) is shown only as a target, always with "subject to approvals"; the word is "project completion", never "handover" (tenants may ask for changes and the works then continue). There is no fit-out stage and no stage has its own date. The Apollo Hospital is always "upcoming / under construction". Use of any floor is "subject to floor suitability and applicable statutory approvals".
- Areas are about 3,500 sq ft gross and about 3,100 sq ft carpet per upper floor, approximate and subject to final measurement.
- Renders are labelled indicative. Photographs are labelled as construction progress. The renders themselves are not edited. No time-of-day labels anywhere (one hero image, no toggle).
- The road is "a 24 m (80 ft) wide north-facing road"; "Stadium Road" is not used (the build fails on it). The lift is a 10-passenger lift; no operating hours are shown.
- **Space finder:** a planning aid, not a drawing for construction. Carpet is spread over the architect's floor plate in proportion to area (floor 3,520 sq ft gross less 354 sq ft lift / lobby / stair bay; marketing carpet about 3,100). Two occupiers on one floor: a 100 sq ft common-passage allowance is an assumption until the architect confirms the demising scheme.
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

Home about 500 KB and main content in about 1.6 s; floor plans about 370 KB; `/hi` about 270 KB; `/leasing` and business pages about 245 KB (re-measure with `perf.js` after changes). Levers: pre-rendered HTML, Brotli and long caching in `.htaccess`, preloaded hero, tour images loaded on demand, live map iframe only when near the viewport, Latin-only fonts, system Devanagari font on `/hi`, no CSS blur filters.

## Known follow-ups

- Angular 16 is out of support: plan an upgrade.
- Add GA4 / Ads IDs and profile URLs (`sameAs`: Google Business Profile, LinkedIn, YouTube, listing portals) when available; `sameAs` is the strongest way to tie the site to the business for search and AI tools.
- Fill `PROGRESS_UPDATES` (`content.config.ts`) with dated entries; the section on `/walkthrough` appears with the first one. Update `PROJECT_STATUS` as stages complete.
- Hindi pages do not carry the timeline yet; add it to `hindi.config.ts` once the English wording is final.
- Floor-plan hotspots (lift, stairs, columns, windows, fire exit) need architect-verified coordinates before they are built. A labelled map needs the owner's pins (Google My Maps link).
- Hindi copy needs review by a Hindi reader. Booking pop-up, action bar and WhatsApp message switch to Hindi on `/hi`.
- Ground level is described as "covered parking for 12+ cars" everywhere (site, brochure, plan set); confirm with the owner.
- The map pin is at the brochure coordinates; a plot outline needs the corner coordinates (or a Google My Maps link) from the owner.
- Fire-fighting systems, power backup, water and connectivity appear only as "ask the leasing team" items until the owner confirms them (`ASK_ITEMS` in `content.config.ts`).
- No CAPTCHA on the enquiry endpoint (honeypot and rate limit only); consider Cloudflare Turnstile if spam appears.
- Not tested yet: Firefox and real devices (Chromium and WebKit engines were).
