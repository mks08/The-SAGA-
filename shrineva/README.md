# SHRINEVA — website

Leasing site for **SHRINEVA**, a commercial building (open ground level plus three identical floors) at Plot No. D-15, Lalpur Housing Scheme, Stadium Road, Bada Lalpur, Varanasi 221003, opposite the **upcoming** Apollo Hospital.

Angular 16 + Tailwind 3 single-page app, pre-rendered per route at build time, deployed as static files plus one small PHP endpoint for enquiries. Domain: **shrineva.in**. Enquiries: **leasing@shrineva.in**.

## Run and build

```bash
npm install          # Node 18.x
npm start            # dev server
npm run build        # ng build, then scripts/build-seo.js (postbuild). Always run the full build.
```

Output: `dist/shrineva/`. `postbuild` writes, from the same route list and domain:

- one `index.html` per route (10 routes) with title, description, canonical, Open Graph, JSON-LD and the page's real text **inside `<app-root>`** (visually hidden until Angular starts, shown when JavaScript is off), so crawlers and AI assistants that skip JavaScript read the full page
- `sitemap.xml`, `robots.txt` (search and AI crawlers named and allowed) and `llms.txt` (plain-text summary for AI assistants)
- `404.html`, which `.htaccess` serves with a real 404 status
- **quality gates that fail the build:** titles 50–60 and descriptions 145–155 characters; FAQ answers 40–60 words; one H1 per page; valid JSON-LD with a FAQPage that matches the FAQ config; no retired claims (VDA approval, "60–70 m", studio / residential wording); "Apollo" never without "upcoming / under construction"; every `<img>` has alt, width, height and a loading mode; every route is in the `.htaccess` whitelist

## Pages

| Page | Purpose |
|---|---|
| `/` | Hero (finalised 3D, day / night), answer-first block with six facts, guided walkthrough, floor-plan teaser, location map, brochure download, business paths, FAQ, enquiry |
| `/walkthrough` | Seven-stop guided tour of the final 3D design (auto-advances, pausable, enlargeable), then photographs of the building as it stands today |
| `/floor-plans` | Ground-level and typical-floor plans (plan and 3D view), areas, PDF download |
| `/healthcare-diagnostic-space`, `/office-bank-coaching-space`, `/retail-showroom-cafe-space` | Intent pages for ads and search: answer first, facts, qualified form, FAQ. Copy in `landing.config.ts`; `/?intent=healthcare\|office\|retail\|floor` changes the home headline for an ad |
| `/location-contact` | Address, hours, phones, map, distances, site-visit form, FAQ |
| `/leasing` | What is available, how leasing works, downloads, enquiry form, FAQ |
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

## Add a page

1. Create the page component and route in `src/app/app-routing.module.ts`.
2. Add it to `SEO_ROUTES` in `seo.config.ts`, and to the nav list in `scripts/build-seo.js` if it should be linked in the static HTML.
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

`src/environments/environment*.ts` hold `ga4MeasurementId` (G-…), `googleAdsId` (AW-…) and `googleAdsLabels`. They are empty; nothing loads until set, but events still go to `window.dataLayer`.

Events: `shrineva_commercial_lead` (form), `shrineva_phone_click`, `shrineva_whatsapp_click`, `shrineva_brochure_download` (any `.pdf` link). Phone, WhatsApp and PDF clicks are caught by one delegated listener. UTM tags and `gclid` are kept for the session and sent with every enquiry. If an older `leads.csv` exists on the server, rename it before the first new lead (columns changed).

## Deploy to Hostinger (static upload)

1. `npm run build`.
2. hPanel → File Manager (or FTP): back up `public_html`, remove the old site, upload the **contents** of `dist/shrineva/` including the hidden `.htaccess` and the `api/` folder.
3. Delete old folders if present: `location/`, `contact/`, `privacy/`, `disclaimer/`, `property/`, `spaces/`, `growth/`, `gallery/`, `business-fit/`, `infrastructure/`, `brokers/`.
4. Check: `curl -I http://shrineva.in/` (301 to https), `curl -I https://www.shrineva.in/` (301 to apex), `curl -I https://shrineva.in/contact` (301 to `/location-contact`), `curl -I https://shrineva.in/nope` (404).
5. Follow "Where enquiries go". In Google Search Console add the domain and submit `sitemap.xml`; do the same in Bing Webmaster Tools.

**Rollback:** keep the previous `public_html` as a zip; to roll back, delete the new files and restore it. `vercel.json` is included as an alternative; the PHP endpoint does not run there (forms use the FormSubmit route).

## Known follow-ups

- Angular 16 is out of support: plan an upgrade.
- Add GA4 / Ads IDs and profile URLs (`sameAs`) when available.
- Ground level is labelled "parking" in some brochure imagery and described as "ground level with parking for 12+ cars" on the site: keep wording consistent when the brochure is re-issued.
