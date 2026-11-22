/**
 * Builds the SHRINEVA brochure (A4, 4 pages: cover, floor plans, project timeline and photographs, location and details) from the same facts as the website, in the website's fonts and colours.
 *
 *   node tools/brochure/build-brochure.js
 *
 * Needs Playwright (Chromium) and the images in src/assets and tools/brochure (site-plan.png, qr-*.png).
 * Output: src/assets/shrineva-brochure.pdf and src/assets/images/brochure-cover.webp (page 1, for the website card).
 * Facts here mirror src/app/config (property, content, location); if a number changes there, change it here too.
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { load } = require('../../scripts/lib/load-ts');

// The project status comes straight from the website's config, so the brochure and the site cannot disagree.
const { PROJECT_STATUS } = load(path.join(__dirname, '..', '..', 'src/app/config/content.config.ts'));

const ROOT = path.resolve(__dirname, '..', '..');
const A = (p) => 'file://' + path.join(ROOT, 'src/assets/images', p);
const T = (p) => 'file://' + path.join(__dirname, p);
const I = (p) => 'file://' + path.join(__dirname, 'img', p);
const F = (p) => 'file://' + path.join(ROOT, 'node_modules', p);

const PHONE1 = '+91 81140 80609', PHONE1_E = '+918114080609';   // the one public number (also WhatsApp); owner, 22 Nov 2026
const EMAIL = 'leasing@shrineva.in';
const SITE = 'https://shrineva.in', SITE_SHOW = 'shrineva.in';
const WA = 'https://wa.me/918114080609?text=' + encodeURIComponent('Hi, I would like to know more about commercial space at SHRINEVA, Bada Lalpur');
const MAP = 'https://www.google.com/maps/search/?api=1&query=25.383306,82.978028';

let css = `
@font-face{font-family:'Instrument Serif';src:url('${F('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2')}');font-weight:400;font-style:normal}
@font-face{font-family:'Instrument Serif';src:url('${F('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')}');font-weight:400;font-style:italic}
@font-face{font-family:'Manrope';src:url('${F('@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2')}');font-weight:200 800}
@font-face{font-family:'DM Mono';src:url('${F('@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2')}');font-weight:400}
@page{size:210mm 297mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#100e0c;--ink2:#1b1714;--paper:#f0eade;--paper2:#e6decf;--paper3:#dbd1be;--brass:#be8e3e;--deep:#7a5614;--soft:#e8cf96;--green:#0b7a3b}
html,body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Manrope',system-ui,sans-serif;color:var(--ink);font-size:9.4pt;line-height:1.5}
a{color:inherit;text-decoration:none}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:var(--paper);page-break-after:always;break-after:page}
.page:last-child{page-break-after:auto;break-after:auto}
.mono{font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.14em;font-size:6.6pt}
.serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.eyebrow{display:flex;align-items:center;gap:3mm;color:var(--deep)}
.eyebrow:before{content:'';width:8mm;height:.3mm;background:var(--deep)}
h1,h2{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.015em;line-height:1.02}
h1 em,h2 em{color:var(--deep);font-style:italic}
.pad{padding:0 16mm}
.foot{white-space:nowrap;gap:4mm;position:absolute;left:16mm;right:16mm;bottom:9mm;display:flex;justify-content:space-between;align-items:center;border-top:.25mm solid rgba(16,14,12,.2);padding-top:2.6mm;color:rgba(16,14,12,.72)}
.foot b{color:var(--ink);font-weight:600}
.small{font-size:7.2pt;line-height:1.45;color:rgba(16,14,12,.72)}

/* Page 1 */
.band{height:24mm;display:flex;align-items:center;justify-content:space-between;padding:0 16mm}
.band img{height:12.5mm;width:auto}
.hero{height:140mm;position:relative}
.hero img{width:100%;height:100%;object-fit:cover;object-position:50% 58%;display:block}
.hero .chip{position:absolute;left:16mm;bottom:5mm;background:rgba(255,255,255,.9);padding:1.2mm 3mm;border-radius:10mm;color:rgba(16,14,12,.78)}
.cover-copy{padding:9mm 16mm 0}
.cover-copy h1{font-size:34pt;margin-top:3mm;max-width:168mm}
.cover-copy p{margin-top:4mm;max-width:150mm;font-size:10.4pt;color:rgba(16,14,12,.78)}
.facts{position:absolute;left:16mm;right:16mm;top:226mm;display:grid;grid-template-columns:repeat(6,1fr);border-top:.3mm solid var(--ink);border-bottom:.25mm solid rgba(16,14,12,.25)}
.facts>div{padding:3mm 2mm 3mm 0}
.facts>div+div{padding-left:3mm;border-left:.25mm solid rgba(16,14,12,.18)}
.facts .v{font-family:'Instrument Serif',serif;font-size:20pt;line-height:1}
.facts .l{margin-top:1.6mm;font-weight:700;font-size:7.4pt;line-height:1.25}
.facts .s{margin-top:.6mm;font-size:6.6pt;line-height:1.3;color:rgba(16,14,12,.66)}
.contact-strip{position:absolute;left:0;right:0;bottom:0;height:34mm;background:var(--ink);color:var(--paper);display:grid;grid-template-columns:1.05fr 1fr 1fr;gap:6mm;align-items:center;padding:0 16mm}
.contact-strip .k{color:var(--soft)}
.contact-strip .big{font-family:'Instrument Serif',serif;font-size:16pt;line-height:1.1;margin-top:1.4mm}
.contact-strip a{display:block;font-weight:700;font-size:10pt;line-height:1.55}
.contact-strip .sub{font-weight:400;font-size:7.2pt;color:rgba(240,234,222,.7)}

/* Page 2 */
.head{padding:13mm 16mm 0}
.head h2{font-size:27pt;margin-top:3mm}
.head p{margin-top:3mm;max-width:158mm;font-size:9.8pt;color:rgba(16,14,12,.78)}
.row2{display:grid;grid-template-columns:96mm 1fr;gap:9mm;padding:5mm 16mm 0;align-items:start}
.stack{display:grid;gap:1.6mm}
.stack .lab{display:flex;justify-content:space-between;color:rgba(16,14,12,.62);font-size:5.8pt;padding:0 1mm}
.bar{display:flex;align-items:center;gap:3mm;border-radius:3mm;padding:2mm 3.6mm;background:var(--ink2);color:var(--paper)}
.bar.g{background:var(--paper2);color:var(--ink);border:.25mm solid rgba(16,14,12,.18)}
.bar .n{font-family:'Instrument Serif',serif;font-size:13pt;width:16mm;line-height:1}
.bar .a{font-weight:700;font-size:8.6pt;line-height:1.2}
.bar .d{font-size:6.8pt;opacity:.78;line-height:1.3}
.bar .t{margin-left:auto;font-family:'DM Mono',monospace;font-size:5.6pt;letter-spacing:.1em;text-transform:uppercase;background:var(--brass);color:var(--ink);padding:1mm 2.2mm;border-radius:6mm;white-space:nowrap}
.bar.g .t{background:#fff;color:rgba(16,14,12,.72)}
.ways{display:flex;flex-wrap:wrap;gap:1.8mm;margin-top:3mm}
.ways span{border:.25mm solid rgba(16,14,12,.25);background:#fff;border-radius:6mm;padding:1.3mm 3.2mm;font-weight:700;font-size:7.8pt}
.big-n{font-family:'Instrument Serif',serif;font-size:30pt;line-height:1;margin-top:3mm}
.cols3{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;padding:5mm 16mm 0}
.card{background:#fff;border:.25mm solid rgba(16,14,12,.12);border-radius:3.5mm;padding:4mm 4mm 3mm}
.card h3{font-family:'Instrument Serif',serif;font-weight:400;font-size:13pt;margin-bottom:1.6mm}
.card dl div{padding:1.5mm 0;border-top:.2mm solid rgba(16,14,12,.12)}
.card dt{font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.12em;font-size:5.8pt;color:var(--deep)}
.card dd{font-weight:600;font-size:7.8pt;line-height:1.35;margin-top:.4mm}
.ask{margin:4mm 16mm 0;border:.25mm dashed rgba(16,14,12,.35);border-radius:3.5mm;padding:2.2mm 4.5mm;display:flex;gap:2.2mm;align-items:center;flex-wrap:wrap}
.ask span.c{background:var(--paper2);border-radius:6mm;padding:.7mm 2.2mm;font-size:6.6pt;font-weight:600}
.prog{margin:4mm 16mm 0;border:.25mm solid rgba(16,14,12,.14);background:#fff;border-radius:3.5mm;padding:3.4mm 4.5mm 3.2mm}
.prog .ph{display:flex;justify-content:space-between;align-items:baseline}
.prog .ph .t{font-family:'Instrument Serif',serif;font-size:13pt;line-height:1}
.prog .ph .u{color:rgba(16,14,12,.6)}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-top:2.6mm}
.st{position:relative;padding-top:5.6mm}
.st::before{content:'';position:absolute;left:0;top:1.9mm;right:-3mm;height:0;border-top:.45mm dashed rgba(16,14,12,.3)}
.st:last-child::before{display:none}
.st .dot{position:absolute;left:0;top:0;width:4mm;height:4mm;border-radius:50%;border:.5mm solid rgba(16,14,12,.35);background:var(--paper)}
.st.done::before{border-top:.45mm solid #1e6c44}
.st.done .dot{background:#1e6c44;border-color:#1e6c44}
.st.act .dot{border-color:var(--deep);background:#e8cf96}
.st.tgt .dot{background:var(--ink);border-color:var(--ink)}
.st .k{display:block;font-family:'DM Mono',monospace;font-size:5.4pt;letter-spacing:.1em;text-transform:uppercase;color:rgba(16,14,12,.62)}
.st.done .k{color:#1e6c44}.st.act .k{color:var(--deep)}.st.tgt .k{color:var(--ink);font-weight:500}
.st b{display:block;font-size:7.6pt;line-height:1.22;margin-top:.5mm}
.st small{display:block;font-size:6.4pt;line-height:1.3;color:rgba(16,14,12,.68);margin-top:.5mm}
.imgs{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin-top:3mm}
.imgs figure img{width:100%;height:21mm;object-fit:cover;display:block;border-radius:2.4mm}
.imgs figcaption{margin-top:1mm;font-size:6.2pt;color:rgba(16,14,12,.7)}
.prog .fine{margin-top:1.8mm;font-size:6.3pt;color:rgba(16,14,12,.68)}

/* Page 3 */
.plans{display:grid;grid-template-columns:1fr 1fr;gap:7mm;padding:6mm 16mm 0}
.sheet{background:#fff;border:.25mm solid rgba(16,14,12,.14);border-radius:3.5mm;overflow:hidden}
.sheet .tb{background:var(--paper2);display:flex;justify-content:space-between;align-items:center;padding:2mm 3.5mm}
.sheet .tb b{font-family:'Instrument Serif',serif;font-weight:400;font-size:11.5pt}
.sheet .im{background:#f6f2e8;display:flex;justify-content:center;padding:2mm 0 1mm}
.sheet .im img{height:158mm;width:auto;display:block}
.sheet .cap{padding:2mm 3.5mm 2.4mm;font-size:6.8pt;color:rgba(16,14,12,.72);border-top:.2mm solid rgba(16,14,12,.12)}
.bottom{display:grid;grid-template-columns:1.1fr .9fr;gap:6mm;padding:5mm 16mm 0;align-items:stretch}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;vertical-align:top;padding:1.8mm 0;border-bottom:.2mm solid rgba(16,14,12,.18);font-size:7.8pt}
th{width:28%;font-weight:700}
td small{display:block;color:rgba(16,14,12,.66);font-size:6.6pt}
.view3d img{width:100%;height:39mm;object-fit:cover;border-radius:3mm;display:block}
.view3d p{margin-top:1.2mm}

/* Page 4 */
.row4{display:grid;grid-template-columns:86mm 1fr;gap:8mm;padding:6mm 16mm 0;align-items:start}
.site{background:#f6f2e8;border:.25mm solid rgba(16,14,12,.14);border-radius:3.5mm;overflow:hidden}
.site img{width:100%;display:block}
.near div{display:flex;justify-content:space-between;gap:4mm;padding:1.9mm 0;border-bottom:.2mm solid rgba(16,14,12,.16)}
.near b{font-size:8pt;display:block;line-height:1.25}
.near small{font-size:6.6pt;color:rgba(16,14,12,.66);display:block;line-height:1.3}
.near .d{font-family:'Instrument Serif',serif;font-size:12pt;color:var(--deep);white-space:nowrap}
.sb{display:grid;grid-template-columns:1fr 1fr;gap:1.6mm;margin-top:3mm}
.sb>div{background:#fff;border:.2mm solid rgba(16,14,12,.12);border-radius:2.4mm;padding:1.6mm 2.6mm}
.sb .mono{font-size:5.6pt;color:rgba(16,14,12,.66)}
.sb b{font-size:8.6pt}
.cta{position:absolute;left:16mm;right:16mm;bottom:35mm;height:62mm;border-radius:4mm;background:var(--ink);color:var(--paper);display:grid;grid-template-columns:1fr 38mm 38mm;gap:5mm;padding:6mm 7mm;align-items:center}
.cta h3{font-family:'Instrument Serif',serif;font-weight:400;font-size:19pt;line-height:1.05}
.cta .lines a{display:block;font-weight:700;font-size:10pt;line-height:1.65}
.cta .lines .k{font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.12em;font-size:5.8pt;color:var(--soft);display:inline-block;width:25mm;font-weight:400;white-space:nowrap}
.qr{text-align:center}
.qr img{width:31mm;height:31mm;background:#fff;padding:1.6mm;border-radius:2.4mm;display:block;margin:0 auto}
.qr p{margin-top:1.8mm;font-size:6.4pt;line-height:1.3;color:rgba(240,234,222,.78)}
.disc{position:absolute;left:16mm;right:16mm;bottom:19mm}
`;

/* ── The same logo as the website: the SG monogram beside the SHRINEVA wordmark (src/app/components/brand-logo) ───── */
const lockup = (h) => `<span class="lockup" style="--h:${h}mm"><img class="mk" src="${I('mark.png')}" alt=""><img class="wm" src="${I('logo.png')}" alt="SHRINEVA"></span>`;
const lockupCss = `
.lockup{display:inline-flex;align-items:center;gap:calc(var(--h)*.27)}
.lockup .mk{height:var(--h);width:auto;display:block}
.lockup .wm{height:calc(var(--h)*.67);width:auto;display:block}
.fl{display:inline-flex;align-items:center;gap:2.6mm}
.fl .wm{height:4.7mm;width:auto;display:block}
`;
css += lockupCss;

/* ── Brochure (A4, 4 pages) ─────────────────────────────────────────────────────────────────────────────────────── */
const fontCss = css.slice(0, css.indexOf('@page'));
const bcss = fontCss + lockupCss + `
@page{size:210mm 297mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#100e0c;--ink2:#1b1714;--paper:#f0eade;--paper2:#e6decf;--paper3:#dbd1be;--brass:#be8e3e;--deep:#7a5614;--soft:#e8cf96;--green:#0b7a3b;--apollo:#0b6b4a;--apollo2:#0a5a3f}
html,body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Manrope',system-ui,sans-serif;color:var(--ink);font-size:9.4pt;line-height:1.5}
a{color:inherit;text-decoration:none}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:var(--paper);page-break-after:always;break-after:page}
.page:last-child{page-break-after:auto;break-after:auto}
.mono{font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.14em;font-size:7.2pt}
.eyebrow{display:flex;align-items:center;gap:3mm;color:var(--deep)}
.eyebrow:before{content:'';width:8mm;height:.3mm;background:var(--deep)}
h1,h2{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.015em;line-height:1.02}
h1 em,h2 em{color:var(--deep);font-style:italic}
.small{font-size:7.7pt;line-height:1.45;color:rgba(16,14,12,.74)}
.hdr{height:23mm;padding:0 16mm;display:flex;align-items:center;justify-content:space-between}
.hdr .tag{color:rgba(16,14,12,.72)}
.hdr.s{height:21mm}
.head{padding:1mm 16mm 0}
.head h2{font-size:26pt;margin-top:2.6mm}
.head .lead2{margin-top:2.6mm;font-size:9.6pt;max-width:160mm;color:rgba(16,14,12,.78)}
.foot{white-space:nowrap;gap:4mm;position:absolute;left:16mm;right:16mm;bottom:9mm;display:flex;justify-content:space-between;align-items:center;border-top:.25mm solid rgba(16,14,12,.2);padding-top:2.6mm;color:rgba(16,14,12,.74);font-size:7.2pt}
.card{background:#fff;border:.25mm solid rgba(16,14,12,.12);border-radius:3.5mm}

/* Page 1 · cover. Calm and airy: the picture sits top right, the headline is moderate, only the hero facts are shown, and every block leads on to the pages that follow. */
.p1 .top{position:relative;height:131mm}
.p1 .shot{position:absolute;top:0;right:0;width:101mm;height:126mm;border-bottom-left-radius:9mm;overflow:hidden;background:#d9cdb9}
.p1 .shot img{width:100%;height:100%;object-fit:cover;object-position:50% 30%;display:block}
.p1 .shot .chip{position:absolute;left:4mm;bottom:4mm;background:rgba(255,255,255,.92);padding:1.1mm 3mm;border-radius:8mm;color:rgba(16,14,12,.8);font-size:7.2pt}
.p1 .intro{position:absolute;left:16mm;top:14mm;width:85mm}
.p1 .tag{margin-top:10.5mm;color:var(--deep)}
.p1 h1{font-size:26pt;margin-top:3mm;line-height:1.05}
.p1 .lead{margin-top:4.4mm;font-size:9.6pt;line-height:1.55;color:rgba(16,14,12,.8);text-wrap:balance}
.p1 .lead b{font-weight:800;color:var(--ink)}
/* Get directions: one row (button, then a short note), left-aligned under the paragraph with clear space above the facts strip. The link covers the button only. */
.p1 .dirrow{display:flex;align-items:center;gap:4mm;margin-top:9mm}
.p1 .dir{display:inline-flex;align-items:center;gap:2.6mm;padding:2.1mm 5mm 2.1mm 2.2mm;border-radius:9mm;background:linear-gradient(135deg,#ecd49c,#c79a4a);border:.25mm solid rgba(122,86,20,.4);color:var(--ink);font-weight:700;font-size:9.4pt;line-height:1;white-space:nowrap}
.p1 .dir .pin{display:grid;place-items:center;width:6.4mm;height:6.4mm;border-radius:50%;flex:none;background:var(--ink);color:var(--soft)}
.p1 .dir .pin svg{width:3.7mm;height:3.7mm}
.p1 .dir .arr{font-size:11pt;line-height:.8;margin-left:.6mm}
.p1 .dirn{font-size:7.4pt;line-height:1.25;color:rgba(16,14,12,.66);white-space:nowrap}
.p1 .facts{margin:0 16mm;border-top:.3mm solid var(--ink);display:grid;grid-template-columns:repeat(5,1fr)}
.p1 .facts>div{padding:4.2mm 2mm 3.6mm 0}
.p1 .facts>div+div{padding-left:3.6mm;border-left:.25mm solid rgba(16,14,12,.16)}
.p1 .facts .v{font-family:'Instrument Serif',serif;font-size:19pt;line-height:1}
.p1 .facts .l{margin-top:1.8mm;font-weight:700;font-size:8.2pt;line-height:1.25}
.p1 .facts .s{margin-top:.6mm;font-size:7.5pt;line-height:1.3;color:rgba(16,14,12,.7)}
.p1 .chips{margin:0 16mm;display:flex;flex-wrap:wrap;justify-content:space-between;gap:2mm;padding:4.2mm 0 0;border-top:.25mm solid rgba(16,14,12,.16)}
.p1 .chips span{border:.25mm solid rgba(16,14,12,.22);background:#fff;border-radius:6mm;padding:1.5mm 3.4mm;font-weight:700;font-size:7.9pt;line-height:1.2}
/* Location band: the address, then the five nearby places in two columns; the Apollo line sits in the last cell of the grid. There is no second map link or QR code here, because the Get directions button above is the one way to open the map. */
.p1 .loc{padding:10.5mm 16mm 0}
.p1 .loc .k{color:var(--deep)}
.p1 .loc .addr{margin-top:1.8mm;font-family:'Instrument Serif',Georgia,serif;font-size:15pt;line-height:1.2;letter-spacing:-.005em}
.nl{margin-top:6.6mm}
.nl .nh{display:flex;justify-content:space-between;align-items:baseline;color:var(--deep)}
.nl .nh span+span{color:rgba(16,14,12,.64)}
.nl .grid{margin-top:1.4mm;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,auto);grid-auto-flow:column;column-gap:10mm}
.nl .grid>div{display:flex;justify-content:space-between;align-items:flex-start;gap:3mm;padding:2.8mm 0 3mm;border-bottom:.2mm solid rgba(16,14,12,.16)}
.nl b{display:block;font-size:9.2pt;line-height:1.25;font-weight:600}
.nl small{display:block;font-size:7.7pt;line-height:1.3;color:rgba(16,14,12,.68);margin-top:.3mm;text-wrap:balance}
.nl .d{font-family:'Instrument Serif',serif;font-size:14.5pt;line-height:1;margin-top:-.5mm;color:var(--deep);white-space:nowrap}
.dark{position:absolute;left:0;right:0;bottom:0;height:37mm;background:var(--ink);color:var(--paper);display:grid;grid-template-columns:1.15fr 1fr .75fr;gap:8mm;align-items:center;padding:0 16mm}
.dark .k{color:var(--soft);font-size:7.2pt}
.dark a{display:block}
.dark .ph{font-weight:700;font-size:10.6pt;line-height:1.6}
.dark .sub{font-weight:400;font-size:7.6pt;color:rgba(240,234,222,.72)}
.dark .idx{margin-top:1.6mm;font-size:8.2pt;line-height:1.75;color:rgba(240,234,222,.86)}
.dark .idx span{display:inline-block;width:6.4mm;font-family:'DM Mono',monospace;font-size:7.2pt;color:var(--soft)}
.dark .web{font-family:'Instrument Serif',serif;font-size:19pt;line-height:1.05;margin-top:1.6mm}

/* Page 2 · floor plans */
.pls{display:grid;grid-template-columns:1fr 1fr;gap:6mm;padding:4.5mm 16mm 0}
.sh{overflow:hidden;display:flex;flex-direction:column}
.sh .tb{background:var(--paper2);display:flex;justify-content:space-between;align-items:center;padding:2.4mm 3.8mm}
.sh .tb b{font-family:'Instrument Serif',serif;font-weight:400;font-size:13.5pt}
.sh .tb span{color:rgba(16,14,12,.7);font-size:7.2pt}
.sh .im{background:#f6f2e8;display:flex;justify-content:center;align-items:center;height:172mm;padding:0}
.sh .im img{max-width:100%;max-height:100%;width:auto;height:auto;display:block}
.stats{min-height:25mm;display:grid;grid-template-columns:1.25fr 1.05fr .9fr;border-top:.25mm solid rgba(16,14,12,.16)}
.stats>div{padding:2.4mm 2.6mm 2.6mm}
.stats>div+div{border-left:.25mm solid rgba(16,14,12,.14)}
.stats .k{color:var(--deep);font-size:7.2pt;letter-spacing:.05em;white-space:nowrap}
.stats b{display:block;font-family:'Instrument Serif',serif;font-weight:400;font-size:16pt;line-height:1.05;margin-top:.9mm}
.stats small{display:block;font-size:7.8pt;line-height:1.3;color:rgba(16,14,12,.72);margin-top:.5mm}
.sh .v3{border-top:.25mm solid rgba(16,14,12,.16);position:relative}
.sh .v3{margin-top:auto}
.sh .v3 img{width:100%;height:34mm;object-fit:cover;display:block}
.sh .v3 span{position:absolute;right:2.6mm;top:2.4mm;background:rgba(255,255,255,.92);padding:.8mm 2.4mm;border-radius:6mm;font-size:7.2pt;letter-spacing:.1em;color:rgba(16,14,12,.8)}

/* Page 3 · where the building stands */
.prog{margin:3mm 16mm 0;padding:4mm 5mm 3.8mm}
.prog .ph{display:flex;justify-content:space-between;align-items:baseline}
.prog .ph .t{font-family:'Instrument Serif',serif;font-size:14pt;line-height:1}
.prog .ph .u{color:rgba(16,14,12,.66);font-size:7.2pt}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:3.4mm;margin-top:3mm}
.st{position:relative;padding-top:6mm}
.st::before{content:'';position:absolute;left:0;top:2.1mm;right:-3.4mm;height:0;border-top:.45mm dashed rgba(16,14,12,.3)}
.st:last-child::before{display:none}
.st .dot{position:absolute;left:0;top:0;width:4.4mm;height:4.4mm;border-radius:50%;border:.5mm solid rgba(16,14,12,.35);background:var(--paper)}
.st.done::before{border-top:.45mm solid #1e6c44}
.st.done .dot{background:#1e6c44;border-color:#1e6c44}
.st.act .dot{border-color:var(--deep);background:#e8cf96}
.st.tgt .dot{background:var(--ink);border-color:var(--ink)}
.st .k{display:block;font-family:'DM Mono',monospace;font-size:7.2pt;letter-spacing:.1em;text-transform:uppercase;color:rgba(16,14,12,.66)}
.st.done .k{color:#1e6c44}.st.act .k{color:var(--deep)}.st.tgt .k{color:var(--ink);font-weight:500}
.st b{display:block;font-size:8.8pt;line-height:1.22;margin-top:.7mm}
.st small{display:block;font-size:7.7pt;line-height:1.32;color:rgba(16,14,12,.72);margin-top:.7mm}
.photos{display:grid;grid-template-columns:88.5fr 86.5fr;gap:3mm;padding:3.4mm 16mm 0;align-items:start}
.stk{display:grid;gap:3mm}
.pic{position:relative;border-radius:2.6mm;overflow:hidden;background:#d9d2c3}
.pic img{display:block;width:100%;height:auto}
.pic .lbl{position:absolute;left:2.4mm;bottom:2.4mm;background:rgba(255,255,255,.93);padding:.9mm 2.5mm;border-radius:6mm;font-family:'DM Mono',monospace;font-size:7.2pt;text-transform:uppercase;letter-spacing:.1em;color:rgba(16,14,12,.84);line-height:1.25}
.photos2{display:grid;grid-template-columns:1.6fr 1.915fr;gap:3mm;padding:3mm 16mm 0}
.chg{margin:3.4mm 16mm 0;display:grid;grid-template-columns:44mm 1fr;gap:4mm;align-items:start}
.chg b{font-family:'Instrument Serif',serif;font-weight:400;font-size:12.5pt;line-height:1.1}

/* Page 4 · map, specification and contacts */
.mapw{position:relative;margin:4.4mm 16mm 0;border-radius:3.5mm;overflow:hidden;border:.25mm solid rgba(16,14,12,.16);background:#e9e7df}
.mapw>img{display:block;width:100%;height:auto}
.mapw .gm{position:absolute;left:3.2mm;top:3.2mm;background:var(--ink);color:var(--paper);padding:1.5mm 3.6mm;border-radius:7mm;font-weight:700;font-size:8.2pt}
.mapw .nt{position:absolute;left:45mm;top:3.2mm;background:rgba(255,255,255,.92);padding:1.5mm 3mm;border-radius:7mm;font-size:7.2pt;color:rgba(16,14,12,.78)}
.spec{padding:5.4mm 16mm 0}
.spec .sh2{display:flex;justify-content:space-between;align-items:baseline;color:var(--deep)}
.spec .sh2 span+span{color:rgba(16,14,12,.64)}
.spec .tbl{display:grid;grid-template-columns:1fr 1fr;column-gap:9mm;margin-top:1.4mm}
.spec .r{display:grid;grid-template-columns:32mm 1fr;gap:3mm;padding:1.7mm 0;border-bottom:.2mm solid rgba(16,14,12,.16);align-items:baseline}
.spec .r .k{font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.07em;font-size:7.2pt;color:rgba(16,14,12,.66);line-height:1.3}
.spec .r .v{font-weight:700;font-size:8.8pt;line-height:1.3}
.spec .r .v small{font-weight:500;color:rgba(16,14,12,.7);font-size:7.7pt}
.cta{margin:5mm 16mm 0;border-radius:4mm;background:var(--ink);color:var(--paper);display:grid;grid-template-columns:1fr 29mm 29mm;gap:5mm;padding:4.4mm 6mm;align-items:center}
.cta h3{font-family:'Instrument Serif',serif;font-weight:400;font-size:18pt;line-height:1.05}
.cta .lines{margin-top:1.8mm}
.cta .lines a{display:block;font-weight:700;font-size:9.4pt;line-height:1.55}
.cta .lines .k{font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.12em;font-size:7.2pt;color:var(--soft);display:inline-block;width:30mm;font-weight:400;white-space:nowrap}
.qr{text-align:center}
.qr img{width:25mm;height:25mm;background:#fff;padding:1.4mm;border-radius:2.2mm;display:block;margin:0 auto}
.qr p{margin-top:1.4mm;font-size:7.2pt;line-height:1.3;color:rgba(240,234,222,.82)}
.disc{margin:3.6mm 16mm 0}
`;

const near = [
  ['Apollo Hospital (upcoming)', 'Opposite the plot; under&nbsp;construction, not yet operational', '≈ 50 m'],
  ['NIFT Varanasi campus', 'Near the plot', '≈ 100 m'],
  ['Varanasi Trade Centre', 'Along the road', '≈ 330 m'],
  ['Vardhan Hospital, Lalpur', 'Bada Lalpur, opposite the Trade Centre', 'Nearby'],
  ['Ring Road (NH 135B)', 'By road', '≈ 1 km'],
];

const factsA = [
  ['50 ft', 'Road frontage', 'About, on the road side'],
  ['24 m', 'Wide road', 'North-facing, 80 ft'],
  ['12+', 'Covered parking', 'Cars, at ground level'],
  ['10', 'Passenger lift', 'Serves every level'],
  ['≈ 3,500', 'Sq ft per floor', 'Gross, Floors 1 to 3'],
];
// The remaining hero points, kept as light chips so the cover does not read as a wall of numbers.
const chips = ['Ground + 3', 'Fire exit on every level', 'Vastu compliant', 'VDA approved', 'High footfall potential'];
const row = (f) => `<div><div class="v">${f[0]}</div><div class="l">${f[1]}</div><div class="s">${f[2]}</div></div>`;

const SPEC = [
  ['Project', 'SHRINEVA, Bada Lalpur, Varanasi'],
  ['Plot area', '≈ 525 sq m <small>(≈ 5,650 sq ft)</small>'],
  ['Road', '24 m wide, north-facing'],
  ['Frontage', '≈ 50 ft'],
  ['Configuration', 'Ground (Parking) + 3 floors'],
  ['Approval', 'VDA approved <small>(Varanasi Development Authority)</small>'],
  ['Vastu', 'Compliant <small>(layout and orientation)</small>'],
  ['Gross floor area', '≈ 3,500 sq ft <small>(Floors 1 to 3)</small>'],
  ['Carpet floor area', '≈ 3,100 sq ft <small>(Floors 1 to 3)</small>'],
  ['Floor to floor', 'Ground ≈ 9′-6″ · Floors ≈ 11′-6″'],
  ['Parking', '12+ cars, ground level'],
  ['Lift', '10-passenger, serves every level'],
  ['Fire escape', 'Dedicated exit on every level'],
  ['Setbacks', 'Front 15′-8″ · Rear 15′-4½″ · East 8′-11½″ · West 5′-0″'],
  ['Building status', 'Under construction'],
  ['Target completion', `${PROJECT_STATUS.completion.value}, subject to approvals`],
];
// Last page of the plan set: the building facts that are not already drawn on the plans. Same wording as the brochure's specification table and the plan sheets.
const PLAN_SPEC = [
  ['Configuration', 'Ground (Parking) + 3 floors'],
  ['Gross area, Floors 1 to 3', '≈ 3,500 sq ft per floor'],
  ['Carpet area, Floors 1 to 3', '≈ 3,100 sq ft per floor'],
  ['Floor to floor', 'Ground ≈ 9′-6″ · Floors ≈ 11′-6″'],
  ['Parking', '12+ cars, covered, ground level'],
  ['Lift', '10-passenger, serves every level'],
  ['Staircase', '1 staircase, 5′-3″ flights'],
  ['Fire escape', 'Dedicated exit on every level'],
  ['Front', 'Glass front facing the road'],
  ['Condition', 'Open shell, fitted out by the tenant'],
  ['Approval and Vastu', 'VDA approved · Vastu compliant'],
  ['Status', `Under construction · target completion ${PROJECT_STATUS.completion.value}, subject to approvals`],
];
const bfoot = (n) => `<div class="foot mono"><span class="fl"><img class="wm" src="${I('logo.png')}" alt="SHRINEVA"> Plot D-15, Bada Lalpur, Varanasi</span><span><a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="tel:${PHONE1_E}">${PHONE1}</a> · ${n} / 4</span></div>`;
const bhdr = (tag) => `<div class="hdr s">${lockup(11.5)}<span class="mono tag">${tag}</span></div>`;

const stageCls = (s) => (s === 'done' ? 'done' : s === 'active' ? 'act' : s === 'target' ? 'tgt' : '');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SHRINEVA: commercial and mixed-use space, Bada Lalpur, Varanasi</title><style>${bcss}</style></head><body>

<!-- 1 · Cover -->
<section class="page p1">
  <div class="top">
    <div class="shot"><img src="${I('hero-cover.jpg')}" alt="Indicative 3D render of the SHRINEVA building"><span class="chip mono">Indicative 3D render</span></div>
    <div class="intro">
      ${lockup(13)}
      <div class="tag mono">Lease · whole floor or part floor</div>
      <h1>Commercial &amp; mixed&#8209;use space in <em>Bada&nbsp;Lalpur, Varanasi.</em></h1>
      <p class="lead">Opposite the <b>upcoming Apollo Hospital</b> and about 100&nbsp;m from NIFT Varanasi, on a 24&nbsp;m wide north&#8209;facing road. Lease a whole floor, part of a floor, or more than one.</p>
      <div class="dirrow">
        <a class="dir" href="${MAP}"><span class="pin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg></span>Get directions<span class="arr" aria-hidden="true">&rsaquo;</span></a>
        <span class="dirn">Opens in Google Maps</span>
      </div>
    </div>
  </div>
  <div class="facts">${factsA.map(row).join('')}</div>
  <div class="chips">${chips.map((c) => `<span>${c}</span>`).join('')}</div>
  <div class="loc">
    <div class="mono k">Location</div>
    <div class="addr">SHRINEVA, Plot D-15, Lalpur Housing Scheme, Bada Lalpur, Varanasi 221003</div>
    <div class="nl">
      <div class="nh mono"><span>Nearby</span><span>From the plot, approximate</span></div>
      <div class="grid">${near.map((n) => `<div><span><b>${n[0]}</b><small>${n[1]}</small></span><span class="d"${n[2] === 'Nearby' ? ' style="font-size:11pt;margin-top:.1mm"' : ''}>${n[2]}</span></div>`).join('')}</div>
    </div>
  </div>
  <div class="dark">
    <div><div class="mono k">Leasing desk</div>
      <a class="ph" href="tel:${PHONE1_E}">${PHONE1}<span class="sub"> · also WhatsApp</span></a><a class="ph" href="mailto:${EMAIL}">${EMAIL}</a></div>
    <div><div class="mono k">Inside</div>
      <div class="idx"><a href="#pg2"><span>02</span>Floor plans</a><a href="#pg3"><span>03</span>Project progress</a><a href="#pg4"><span>04</span>Location and specification</a></div></div>
    <div><div class="mono k">Website</div><a class="web" href="${SITE}">${SITE_SHOW}</a></div>
  </div>
</section>

<!-- 2 · Floor plans -->
<section class="page p2" id="pg2">
  ${bhdr('Floor plans')}
  <div class="head">
    <div class="eyebrow mono">Floor plans</div>
    <h2>Ground (Parking), then <em>Floors 1 to 3.</em></h2>
    <p class="lead2">Floors 1, 2 and 3 are identical. Each plan marks the lift and stair core, the fire exit and the glass front. North is at the top.</p>
  </div>
  <div class="pls">
    <div class="card sh">
      <div class="tb"><b>Ground (Parking)</b><span class="mono">Parking and entries</span></div>
      <div class="im"><img src="${I('plan-ground.png')}" alt="Ground level plan"></div>
      <div class="stats">
        <div><div class="mono k">Floor area</div><b>≈ 3,000 sq ft</b><small>About 279 sq m</small></div>
        <div><div class="mono k">Floor height</div><b>≈ 9′-6″</b><small>Floor to floor</small></div>
        <div><div class="mono k">Plot area</div><b>525 sq m</b><small>≈ 5,650 sq ft</small></div>
      </div>
    </div>
    <div class="card sh">
      <div class="tb"><b>Floors 1 to 3 (typical)</b><span class="mono">Each floor</span></div>
      <div class="im"><img src="${I('plan-typical.png')}" alt="Typical floor plan"></div>
      <div class="stats">
        <div><div class="mono k">Floor area</div><b>≈ 3,500 sq ft</b><small>Gross · ≈ 3,100 sq ft carpet</small></div>
        <div><div class="mono k">Floor height</div><b>≈ 11′-6″</b><small>Floor to floor</small></div>
        <div><div class="mono k">Plot area</div><b>525 sq m</b><small>≈ 5,650 sq ft</small></div>
      </div>
    </div>
  </div>
  ${bfoot(2)}
</section>

<!-- 3 · Where the building stands -->
<section class="page p3" id="pg3">
  ${bhdr('Project progress')}
  <div class="head">
    <div class="eyebrow mono">Project timeline</div>
    <h2>Where the building <em>stands today.</em></h2>
  </div>
  <div class="card prog">
    <div class="ph"><span class="t">Concrete structure complete</span><span class="u mono">Updated ${PROJECT_STATUS.updated}</span></div>
    <div class="steps">${PROJECT_STATUS.stages.map((st) => `<div class="st ${stageCls(st.state)}"><span class="dot"></span><span class="k">${st.label}</span><b>${st.title}</b><small>${st.text}</small></div>`).join('')}</div>
  </div>
  <div class="photos">
    <div class="pic"><img src="${I('site-front-day.jpg')}" alt="The building from the road, front facade"><span class="lbl">Front facade, from the road</span></div>
    <div class="stk">
      <div class="pic"><img src="${I('site-upper-floor-south.jpg')}" alt="An upper floor looking south"><span class="lbl">Upper floor, looking south</span></div>
      <div class="pic"><img src="${I('site-upper-floor-north.jpg')}" alt="The same floor looking north"><span class="lbl">Upper floor, looking north</span></div>
    </div>
  </div>
  <div class="photos2">
    <div class="pic"><img src="${I('site-apollo-side.jpg')}" alt="View towards the upcoming Apollo Hospital site"><span class="lbl">Upcoming Apollo Hospital site</span></div>
    <div class="pic"><img src="${I('site-nift-side.jpg')}" alt="View towards NIFT Varanasi"><span class="lbl">Towards NIFT Varanasi</span></div>
  </div>
  <div class="chg">
    <b>${PROJECT_STATUS.changes.title}</b>
    <p class="small">${PROJECT_STATUS.changes.text} Site photographs, ${PROJECT_STATUS.photosTaken}. Project completion is targeted for ${PROJECT_STATUS.completion.value}, subject to approvals; dates are targets and may change.</p>
  </div>
  ${bfoot(3)}
</section>

<!-- 4 · Location, specification and contacts -->
<section class="page p4" id="pg4">
  ${bhdr('Location and specification')}
  <div class="head">
    <div class="eyebrow mono">Location and specification</div>
    <h2>Plot D-15, <em>Bada Lalpur, Varanasi.</em></h2>
  </div>
  <div class="mapw">
    <img src="${I('location-map.jpg')}" alt="Illustrated location map: Plot D-15 on the 24 m wide road, with NIFT, the upcoming Apollo Hospital, Varanasi Trade Centre, Vardhan Hospital and the Ring Road (NH 135B)">
    <a class="gm" href="${MAP}">Open in Google Maps &rsaquo;</a>
    <span class="nt mono">Not to scale</span>
  </div>
  <div class="spec">
    <div class="sh2 mono"><span>Specification</span><span>Approximate, subject to final measurement</span></div>
    <div class="tbl">
      <div>${SPEC.slice(0, Math.ceil(SPEC.length / 2)).map((r) => `<div class="r"><span class="k">${r[0]}</span><span class="v">${r[1]}</span></div>`).join('')}</div>
      <div>${SPEC.slice(Math.ceil(SPEC.length / 2)).map((r) => `<div class="r"><span class="k">${r[0]}</span><span class="v">${r[1]}</span></div>`).join('')}</div>
    </div>
  </div>
  <div class="cta">
    <div>
      <div class="mono" style="color:var(--soft)">Leasing desk</div>
      <h3 style="margin-top:1.2mm">See it, then decide.</h3>
      <div class="lines">
        <a href="tel:${PHONE1_E}"><span class="k">Call</span>${PHONE1}</a>
        <a href="${WA}"><span class="k">WhatsApp</span>${PHONE1}</a>
        <a href="mailto:${EMAIL}"><span class="k">Email</span>${EMAIL}</a>
        <a href="${SITE}"><span class="k">Website</span>${SITE_SHOW}</a>
        <a href="${MAP}"><span class="k">Google Maps</span>Open the location</a>
      </div>
    </div>
    <a class="qr" href="${MAP}"><img src="${T('qr-map.png')}" alt="QR code for the map"><p>Map and directions</p></a>
    <a class="qr" href="${WA}"><img src="${T('qr-whatsapp.png')}" alt="QR code for WhatsApp"><p>Chat on WhatsApp</p></a>
  </div>
  <p class="disc small">Areas are approximate and subject to final measurement. Renders, plans and the map are indicative. The Apollo Hospital is upcoming and under construction. Use of a floor is subject to suitability and approvals. Nothing here is an offer.</p>
  ${bfoot(4)}
</section>

</body></html>`;

/* ── Plan set: ground level, typical floor, site plan with the building specification (A4, 3 pages) ─────────────────────────────────────────────── */
const pfoot = (n) => `<div class="foot mono"><span class="fl"><img class="wm" src="${I('logo.png')}" alt="SHRINEVA"> Floor plan set · Plot D-15, Bada Lalpur</span><span><a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="tel:${PHONE1_E}">${PHONE1}</a> · ${n} / 3</span></div>`;
const pband = (t) => `<div class="band">${lockup(12.5)}<span class="mono" style="color:rgba(16,14,12,.7)">${t}</span></div>`;
const legendItem = (sw, t) => `<li><span class="sw" style="${sw}"></span>${t}</li>`;
const pcss = `
.pl{display:grid;grid-template-columns:108mm 1fr;gap:7mm;padding:4mm 16mm 0;align-items:start}
.pl .sheet .im img{height:190mm}
.pl .side>*+*{margin-top:4mm}
.pl .num{font-family:'Instrument Serif',serif;font-size:25pt;line-height:1}
.pl dl div{padding:1.7mm 0;border-top:.2mm solid rgba(16,14,12,.14)}
.pl dt{font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.12em;font-size:5.8pt;color:var(--deep)}
.pl dd{font-weight:600;font-size:8pt;line-height:1.35;margin-top:.4mm}
.pl ul{list-style:none;display:grid;gap:1.4mm;font-size:7.4pt}
.pl li{display:flex;align-items:center;gap:2.4mm}
.pl .sw{width:4mm;height:3mm;border-radius:.6mm;display:inline-block;flex:none}
.pl .v3 img{width:100%;height:36mm;object-fit:cover;border-radius:3mm;display:block}
.pnote{position:absolute;left:16mm;right:16mm;bottom:19mm}
.pl.siteset{grid-template-columns:108mm 1fr;align-items:stretch}
.pl.siteset .side{display:flex;flex-direction:column;justify-content:space-between}
.pl.siteset .side>*+*{margin-top:0}
.pl.siteset dl div{padding:1.5mm 0}
.pl.siteset .sb4{display:grid;grid-template-columns:1fr 1fr;column-gap:4mm}
.pl.siteset .near div{padding:1.45mm 0}
/* Building specification: the facts that are not drawn on the plans, in a calm three-column grid */
.spec3{margin:4.5mm 16mm 0}
.spec3 .sh3{display:flex;justify-content:space-between;align-items:baseline;color:var(--deep);padding-bottom:1.6mm;border-bottom:.3mm solid var(--ink)}
.spec3 .sh3 span+span{color:rgba(16,14,12,.64)}
.spec3 .g3{display:grid;grid-template-columns:repeat(3,1fr);column-gap:6mm}
.spec3 .g3>div{padding:2mm 0 1.9mm;border-bottom:.2mm solid rgba(16,14,12,.16)}
.spec3 dt{font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.12em;font-size:5.8pt;color:var(--deep)}
.spec3 dd{font-weight:600;font-size:8.2pt;line-height:1.35;margin-top:.5mm}
`;
const planPage = (n, eyebrow, title, sheetTitle, sheetTag, img, cap, big, sub, facts2, legend, v3, v3cap) => `
<section class="page">
  ${pband('Floor plan set')}
  <div class="head" style="padding-top:2mm"><div class="eyebrow mono">${eyebrow}</div><h2>${title}</h2></div>
  <div class="pl">
    <div class="sheet"><div class="tb"><b>${sheetTitle}</b><span class="mono" style="font-size:5.6pt">${sheetTag}</span></div><div class="im"><img src="${img}" alt="${sheetTitle}"></div><div class="cap">${cap}</div></div>
    <div class="side">
      <div><div class="mono" style="color:var(--deep)">${big[0]}</div><div class="num" style="margin-top:1.6mm">${big[1]}</div><div style="margin-top:1mm;color:rgba(16,14,12,.72);font-size:8.4pt">${sub}</div></div>
      <dl>${facts2.map((f) => `<div><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join('')}</dl>
      <ul>${legend.join('')}</ul>
      <div class="v3"><img src="${v3}" alt="3D view"><p class="small" style="margin-top:1.2mm">${v3cap}</p></div>
    </div>
  </div>
  <p class="pnote small">Areas are approximate and subject to final measurement. Plans and 3D views are indicative, dimensions as marked, not to scale, and not for construction. The floors are offered as open shells.</p>
  ${pfoot(n)}
</section>`;

const planHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SHRINEVA floor plan set, Bada Lalpur, Varanasi</title><style>${css}${pcss}</style></head><body>
${planPage(1, 'Ground level', 'Ground level plan', 'Ground level', 'Covered parking and entries', I('plan-ground.png'),
  'Covered parking for 12+ cars, with entries to the lift lobby on the west and east. Dimensions as marked.',
  ['Covered, at ground level', 'About 3,000 sq ft'], 'About 279 sq m',
  [['Use', 'Covered parking for 12+ cars, entries and lift lobby'], ['Structure', '35′-6″ × 84′-6″'], ['Height', 'About 9.5 ft'], ['Entries', 'West and east walkways to the lift lobby'], ['Fire exit', 'Marked on the plan'], ['Setbacks', 'Open on all four sides']],
  [legendItem('background:#1b1714', 'Column'), legendItem('background:#fff;border:.2mm solid rgba(16,14,12,.5)', 'Lift and stair core'), legendItem('background:#168a4b', 'Fire exit'), legendItem('background:#dccfae', 'Setback, open'), legendItem('background:#2a6f68;height:.6mm', 'Entry route'), '<li><b>N ↑</b>&nbsp;North, road side at the top</li>'],
  I('ground-3d.jpg'), 'Ground level, 3D view. Illustrative.')}
${planPage(2, 'Floors 1, 2 and 3', 'Typical floor plan', 'Floors 1 to 3 plan (typical)', 'Sheet SH-02 · North at the top', I('plan-typical.png'),
  '40′-6″ × 89′-6″ with a 5 ft glass front on the road; lift and stair core on the east side; fire exit at the rear. Dimensions as marked.',
  ['Gross, on each of Floors 1, 2 and 3', 'About 3,500 sq ft'], 'About 3,100 sq ft carpet',
  [['Floors', '1, 2 and 3 are identical'], ['Floor to floor', 'About 11.5 ft'], ['Front', 'Glass front facing the road'], ['Lift', '10-passenger lift, serves every level'], ['Fire exit', 'On every level'], ['Condition', 'Open shell, fitted out by the tenant']],
  [legendItem('background:#1b1714', 'Column'), legendItem('background:#fff;border:.2mm solid rgba(16,14,12,.5)', 'Lift and stair core'), legendItem('background:#168a4b', 'Fire exit'), legendItem('background:#d4e6e1;border:.2mm solid #7fb3a8', 'Glass front'), legendItem('background:#e6cf9a', 'Recess, not in floor area'), '<li><b>N ↑</b>&nbsp;North, road side at the top</li>'],
  I('typical-3d.jpg'), 'Typical floor, 3D view. Illustrative.')}
<section class="page">
  ${pband('Floor plan set')}
  <div class="head" style="padding-top:2mm"><div class="eyebrow mono">Site plan and specification</div><h2>The plot, the setbacks <em>and the building.</em></h2></div>
  <div class="pl siteset">
    <div class="sheet"><div class="tb"><b>Site plan</b><span class="mono" style="font-size:5.6pt">Plot D-15 · North at the top</span></div><div class="im" style="padding:0"><img src="${I('site-plan.png')}" alt="Site plan" style="height:auto;width:100%"></div></div>
    <div class="side">
      <div><div class="mono" style="color:var(--deep)">Plot</div><div class="num" style="margin-top:1.6mm">525 sq m</div><div style="margin-top:1mm;color:rgba(16,14,12,.72);font-size:8.4pt">About 5,650 sq ft · 49′-5½″ × 115′-6½″</div></div>
      <div class="dls">
        <dl>
          <div><dt>Road</dt><dd>24 m (80 ft) wide, to the north</dd></div>
          <div><dt>Frontage</dt><dd>About 50 ft on the road</dd></div>
        </dl>
        <dl class="sb4">
          <div><dt>Setback, front (N)</dt><dd>15′-8″</dd></div>
          <div><dt>Setback, rear (S)</dt><dd>15′-4½″</dd></div>
          <div><dt>Setback, east</dt><dd>8′-11½″</dd></div>
          <div><dt>Setback, west</dt><dd>5′-0″</dd></div>
        </dl>
        <dl>
          <div><dt>Ground structure</dt><dd>35′-6″ × 84′-6″</dd></div>
          <div><dt>Floors 1 to 3</dt><dd>40′-6″ × 89′-6″, 5 ft towards the road</dd></div>
        </dl>
      </div>
      <div class="near">${near.slice(0, 3).map((n) => `<div><span><b>${n[0]}</b><small>${n[1]}</small></span><span class="d">${n[2]}</span></div>`).join('')}</div>
      <div class="cta" style="position:static;height:auto;grid-template-columns:1fr;padding:4mm 5mm;gap:1mm"><div class="lines"><a href="tel:${PHONE1_E}">${PHONE1}</a><a href="mailto:${EMAIL}">${EMAIL}</a></div></div>
    </div>
  </div>
  <div class="spec3">
    <div class="sh3 mono"><span>Building specification</span><span>Approximate, subject to final measurement</span></div>
    <dl class="g3">${PLAN_SPEC.map((r) => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl>
  </div>
  <p class="pnote small">Areas are approximate and subject to final measurement. The site plan is drawn from the architect's dimensions; the road width and the neighbours are not drawn to scale. The Apollo Hospital is upcoming and under construction. Plans are indicative, not for construction.</p>
  ${pfoot(3)}
</section>
</body></html>`;

(async () => {
  execFileSync('python3', [path.join(__dirname, 'prep-images.py')], { stdio: 'inherit' });
  execFileSync('python3', [path.join(__dirname, 'fix-map.py')], { stdio: 'inherit' });
  const { chromium } = require('/opt/npm-tools/node_modules/playwright');
  const browser = await chromium.launch();
  const render = async (htmlStr, name, pdfPath) => {
    const out = path.join(__dirname, name);
    fs.writeFileSync(out, htmlStr);
    const page = await browser.newPage();
    await page.goto('file://' + out, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    await page.pdf({ path: pdfPath, width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
    await page.close();
    console.log('wrote', pdfPath, (fs.statSync(pdfPath).size / 1048576).toFixed(2) + ' MB');
  };
  const pdfPath = path.join(ROOT, 'src/assets/shrineva-brochure.pdf');
  await render(html, 'brochure.html', pdfPath);
  await render(planHtml, 'floor-plans.html', path.join(ROOT, 'src/assets/shrineva-floor-plans.pdf'));
  await browser.close();
  // Cover image for the website card.
  const cover = path.join(ROOT, 'src/assets/images/brochure-cover.webp');
  const tmp = path.join(__dirname, 'cover');
  execFileSync('pdftoppm', ['-f', '1', '-l', '1', '-r', '110', '-png', '-singlefile', pdfPath, tmp]);
  execFileSync('python3', ['-c', `from PIL import Image; im=Image.open(r'${tmp}.png').convert('RGB'); im.save(r'${cover}','WEBP',quality=82)`]);
  fs.unlinkSync(tmp + '.png');
  console.log('wrote', cover);
})();
