/**
 * Builds the SHRINEVA brochure (A4, 4 pages) from the same facts as the website, in the website's fonts and colours.
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

const PHONE1 = '+91 81140 80609', PHONE1_E = '+918114080609';
const PHONE2 = '+91 73557 70378', PHONE2_E = '+917355770378';
const EMAIL = 'leasing@shrineva.in';
const SITE = 'https://shrineva.in', SITE_SHOW = 'shrineva.in';
const WA = 'https://wa.me/918114080609?text=' + encodeURIComponent('Hi, I would like to know more about commercial space at SHRINEVA, Bada Lalpur');
const MAP = 'https://www.google.com/maps/search/?api=1&query=25.383306,82.978028';

const css = `
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

const facts = [
  ['50 ft', 'Road frontage', 'About, on the road side'],
  ['24 m', 'Wide road', 'North-facing, 80 ft'],
  ['12+', 'Covered parking', 'Cars, at ground level'],
  ['10', 'Passenger lift', 'Serves every level'],
  ['≈ 3,500', 'Sq ft per floor', 'Gross, Floors 1 to 3'],
  ['Every', 'Level has a fire exit', 'Marked on each plan'],
];

const spec = [
  ['Fire safety and escape', [
    ['Fire exit', 'On every level, marked on the plans'],
    ['Staircase', 'Wide flights from the ground level to Floor 3'],
    ['Open sides', 'Open setbacks on all four sides of the building'],
    ['Front setback', "15′-8″ between the building and the road side"],
  ]],
  ['Access and circulation', [
    ['Passenger lift', 'One 10-passenger lift, serving every level'],
    ['Lift and stair lobby', 'One core on the east side, reached by west and east walkways'],
    ['Parking', 'Covered, at ground level, for 12+ cars'],
    ['Frontage', 'About 50 ft on a 24 m wide north-facing road'],
  ]],
  ['The building', [
    ['Height', 'Ground level plus three floors'],
    ['Floor to floor', 'About 11.5 ft on Floors 1 to 3, about 9.5 ft at ground level'],
    ['Floor plate', 'Open-plan commercial floor plates with flexible tenant layouts'],
    ['Front', 'Glass front facing the road'],
    ['Approval', 'VDA approved · Vastu compliant'],
  ]],
];

const near = [
  ['NIFT Varanasi campus', 'Near the plot', '≈ 100 m'],
  ['Apollo Hospital (upcoming)', 'Opposite the plot; under construction, not yet operational', '≈ 50 m'],
  ['Varanasi Trade Centre', 'Along the road', '≈ 330 m'],
  ['Vardhan Hospital, Lalpur', 'Bada Lalpur, opposite the Trade Centre', 'Nearby'],
  ['Ring Road (NH 135B)', 'By road', '≈ 1 km'],
];

const foot = (n) => `<div class="foot mono"><span><b>SHRINEVA</b> · Commercial space · Bada Lalpur, Varanasi</span><span><a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="tel:${PHONE1_E}">${PHONE1}</a> · ${n} / 4</span></div>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SHRINEVA: commercial space for lease, Bada Lalpur, Varanasi</title><style>${css}</style></head><body>

<!-- 1 · Cover -->
<section class="page">
  <div class="band"><img src="${I('logo.png')}" alt="SHRINEVA"><span class="mono" style="color:rgba(16,14,12,.7)">Commercial space for lease · Varanasi</span></div>
  <div class="hero"><img src="${I('hero.jpg')}" alt="Indicative 3D render of the SHRINEVA building"><span class="chip mono">Indicative 3D render</span></div>
  <div class="cover-copy">
    <div class="eyebrow mono">Plot D-15 · Bada Lalpur, Varanasi</div>
    <h1>Three open floors on a 24 m wide <em>north&#8209;facing road.</em></h1>
    <p>Opposite the upcoming Apollo Hospital and about 100 m from NIFT Varanasi. Lease a whole floor, part of a floor, or more than one.</p>
  </div>
  <div class="facts">${facts.map((f) => `<div><div class="v">${f[0]}</div><div class="l">${f[1]}</div><div class="s">${f[2]}</div></div>`).join('')}</div>
  <div class="contact-strip">
    <div><div class="mono k">Leasing desk</div><div class="big">Talk to the leasing team</div></div>
    <div><a href="tel:${PHONE1_E}">${PHONE1}<span class="sub"> · also WhatsApp</span></a><a href="tel:${PHONE2_E}">${PHONE2}</a></div>
    <div><a href="mailto:${EMAIL}">${EMAIL}</a><a href="${SITE}">${SITE_SHOW}</a></div>
  </div>
</section>

<!-- 2 · The building -->
<section class="page">
  <div class="head">
    <div class="eyebrow mono">The building</div>
    <h2>Three open floors, <em>leased your way.</em></h2>
    <p>Floors 1, 2 and 3 are identical: about 3,500 sq ft gross each, in one open plate with a glass front on the road. Covered parking for 12+ cars sits at ground level.</p>
  </div>
  <div class="row2">
    <div class="stack">
      ${['Floor 3', 'Floor 2', 'Floor 1'].map((n) => `<div class="bar"><span class="n">${n}</span><span><div class="a">About 3,500 sq ft · gross</div><div class="d">Open floor plate, glass front on the road</div></span><span class="t">For lease</span></div>`).join('')}
      <div class="bar g"><span class="n">Ground</span><span><div class="a">About 3,000 sq ft · covered</div><div class="d">Covered parking for 12+ cars, entries and lift lobby</div></span><span class="t">Parking and entry</span></div>
      <div class="lab mono"><span>Lift and stairs serve every level</span><span>Fire exit on each</span></div>
    </div>
    <div>
      <div class="mono" style="color:var(--deep)">Gross, on each of Floors 1, 2 and 3</div>
      <div class="big-n">About 3,500 sq ft</div>
      <div style="margin-top:1.5mm;color:rgba(16,14,12,.72)">About 3,100 sq ft carpet</div>
      <div class="ways"><span>A whole floor</span><span>Part of a floor</span><span>More than one floor</span></div>
      <p class="small" style="margin-top:3.5mm">Which floors are open today is confirmed by the leasing team. The floors are offered as open shells; layout, ceiling height and floor condition are agreed with each tenant.</p>
    </div>
  </div>
  <div class="cols3">${spec.map((g) => `<div class="card"><h3>${g[0]}</h3><dl>${g[1].map((i) => `<div><dt>${i[0]}</dt><dd>${i[1]}</dd></div>`).join('')}</dl></div>`).join('')}</div>
  <div class="ask"><span class="mono" style="color:var(--deep)">Ask the leasing team about</span>${['Fire-fighting systems and clearances', 'Power and backup supply', 'Water supply', 'Fibre and connectivity', 'Floor condition and fit-out'].map((c) => `<span class="c">${c}</span>`).join('')}</div>
  <div class="prog">
    <div class="ph"><span class="t">Where the building stands</span><span class="u mono">Updated ${PROJECT_STATUS.updated}</span></div>
    <div class="steps">${PROJECT_STATUS.stages.map((st) => `<div class="st ${st.state === 'done' ? 'done' : st.state === 'active' ? 'act' : st.state === 'target' ? 'tgt' : ''}"><span class="dot"></span><span class="k">${st.label}</span><b>${st.title}</b><small>${st.text}</small></div>`).join('')}</div>
    <div class="imgs">
      <figure><img src="${I('site-front-day.jpg')}" alt="The building from the road" style="object-position:50% 38%"></figure>
      <figure><img src="${I('site-ground-level.jpg')}" alt="The ground level"></figure>
      <figure><img src="${I('site-upper-floor-south.jpg')}" alt="An upper floor"></figure>
    </div>
    <p class="fine">Site photographs, ${PROJECT_STATUS.photosTaken}: from the road, the ground level and an upper floor. Project completion is targeted for ${PROJECT_STATUS.completion.value}, subject to approvals; dates are targets and may change. ${PROJECT_STATUS.changes.text}</p>
  </div>
  ${foot(2)}
</section>

<!-- 3 · Floor plans -->
<section class="page">
  <div class="head">
    <div class="eyebrow mono">Floor plans</div>
    <h2>One open floor plate, <em>repeated three times.</em></h2>
  </div>
  <div class="plans">
    <div class="sheet"><div class="tb"><b>Floors 1 to 3 (typical)</b><span class="mono" style="font-size:5.6pt">Sheet SH-02 · North at the top</span></div><div class="im"><img src="${I('plan-typical.png')}" alt="Typical floor plan"></div><div class="cap">40′-6″ × 89′-6″ with a 5 ft glass front on the road; lift and stair core on the east side; fire exit at the rear. Dimensions as marked.</div></div>
    <div class="sheet"><div class="tb"><b>Ground level</b><span class="mono" style="font-size:5.6pt">Covered parking and entries</span></div><div class="im"><img src="${I('plan-ground.png')}" alt="Ground level plan"></div><div class="cap">Covered parking for 12+ cars, with entries to the lift lobby on the west and east. Dimensions as marked.</div></div>
  </div>
  <div class="bottom">
    <div>
      <table>
        <tr><th>Floors 1, 2, 3 (each)</th><td>About 3,500 sq ft gross · About 3,100 sq ft carpet<small>Open floor plate · About 11.5 ft floor to floor</small></td></tr>
        <tr><th>Ground level</th><td>About 3,000 sq ft (279 sq m)<small>Covered, parking and entries · About 9.5 ft</small></td></tr>
        <tr><th>Plot</th><td>525 sq m (about 5,650 sq ft)<small>49′-5½″ × 115′-6½″ · North-facing</small></td></tr>
      </table>
      <p class="small" style="margin-top:2.4mm">Areas are approximate and subject to final measurement. Plans are indicative, not to scale, and not for construction.</p>
    </div>
    <div class="view3d"><img src="${I('typical-3d.jpg')}" alt="3D view of the typical floor"><p class="small">Typical floor, 3D view. Illustrative.</p></div>
  </div>
  ${foot(3)}
</section>

<!-- 4 · Location and contact -->
<section class="page">
  <div class="head">
    <div class="eyebrow mono">Location</div>
    <h2>Plot D-15, on a 24 m wide road, <em>north-facing.</em></h2>
    <p>In the Lalpur Housing Scheme, Bada Lalpur: opposite the upcoming Apollo Hospital and about 100 m from NIFT Varanasi.</p>
  </div>
  <div class="row4">
    <div class="site"><img src="${I('site-plan.png')}" alt="Site plan"></div>
    <div>
      <div class="mono" style="color:var(--deep);margin-bottom:1.5mm">Nearby</div>
      <div class="near">${near.map((n) => `<div><span><b>${n[0]}</b><small>${n[1]}</small></span><span class="d">${n[2]}</span></div>`).join('')}</div>
      <p class="small" style="margin-top:2mm">Approximate distances from the plot. The Apollo Hospital is upcoming and under construction.</p>
      <div class="mono" style="color:var(--deep);margin:4mm 0 0">Setbacks from the boundary</div>
      <div class="sb"><div><div class="mono">Front (north)</div><b>15′-8″</b></div><div><div class="mono">Rear (south)</div><b>15′-4½″</b></div><div><div class="mono">East</div><b>8′-11½″</b></div><div><div class="mono">West</div><b>5′-0″</b></div></div>
      <address style="font-style:normal;margin-top:4mm;font-size:8pt;line-height:1.45"><b>Plot No. D-15</b>, Lalpur Housing Scheme,<br>Bada Lalpur, Varanasi, Uttar Pradesh 221003</address>
    </div>
  </div>
  <div class="cta">
    <div>
      <div class="mono" style="color:var(--soft)">Leasing desk</div>
      <h3 style="margin:1.6mm 0 3mm">See it, then decide.</h3>
      <div class="lines">
        <a href="tel:${PHONE1_E}"><span class="k">Call / WhatsApp</span>${PHONE1}</a>
        <a href="tel:${PHONE2_E}"><span class="k">Call</span>${PHONE2}</a>
        <a href="mailto:${EMAIL}"><span class="k">Email</span>${EMAIL}</a>
        <a href="${SITE}"><span class="k">Website</span>${SITE_SHOW}</a>
      </div>
    </div>
    <a class="qr" href="${MAP}"><img src="${T('qr-map.png')}" alt="QR code for the map"><p>Scan for the map and directions</p></a>
    <a class="qr" href="${WA}"><img src="${T('qr-whatsapp.png')}" alt="QR code for WhatsApp"><p>Scan to chat on WhatsApp</p></a>
  </div>
  <p class="disc small">Areas are approximate and subject to final measurement. 3D renders and plans are indicative and subject to change; finishes, signage, planting and surroundings are illustrative. The Apollo Hospital is upcoming and under construction. Use of any floor is subject to approvals. Nothing in this brochure is an offer.</p>
  ${foot(4)}
</section>

</body></html>`;


/* ── Plan set: typical floor, ground level, site plan (A4, 3 pages) ─────────────────────────────────────────────── */
const pfoot = (n) => `<div class="foot mono"><span><b>SHRINEVA</b> · Floor plan set · Plot D-15, Bada Lalpur</span><span><a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="tel:${PHONE1_E}">${PHONE1}</a> · ${n} / 3</span></div>`;
const pband = (t) => `<div class="band"><img src="${I('logo.png')}" alt="SHRINEVA"><span class="mono" style="color:rgba(16,14,12,.7)">${t}</span></div>`;
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
.pl.siteset{grid-template-columns:108mm 1fr}
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
${planPage(1, 'Floors 1, 2 and 3', 'Typical floor plan', 'Floors 1 to 3 plan (typical)', 'Sheet SH-02 · North at the top', I('plan-typical.png'),
  '40′-6″ × 89′-6″ with a 5 ft glass front on the road; lift and stair core on the east side; fire exit at the rear. Dimensions as marked.',
  ['Gross, on each of Floors 1, 2 and 3', 'About 3,500 sq ft'], 'About 3,100 sq ft carpet',
  [['Floors', '1, 2 and 3 are identical'], ['Floor to floor', 'About 11.5 ft'], ['Front', 'Glass front facing the road'], ['Lift', '10-passenger lift, serves every level'], ['Fire exit', 'On every level'], ['Condition', 'Open shell, fitted out by the tenant']],
  [legendItem('background:#1b1714', 'Column'), legendItem('background:#fff;border:.2mm solid rgba(16,14,12,.5)', 'Lift and stair core'), legendItem('background:#168a4b', 'Fire exit'), legendItem('background:#d4e6e1;border:.2mm solid #7fb3a8', 'Glass front'), legendItem('background:#e6cf9a', 'Recess, not in floor area'), '<li><b>N ↑</b>&nbsp;North, road side at the top</li>'],
  I('typical-3d.jpg'), 'Typical floor, 3D view. Illustrative.')}
${planPage(2, 'Ground level', 'Ground level plan', 'Ground level', 'Covered parking and entries', I('plan-ground.png'),
  'Covered parking for 12+ cars, with entries to the lift lobby on the west and east. Dimensions as marked.',
  ['Covered, at ground level', 'About 3,000 sq ft'], 'About 279 sq m',
  [['Use', 'Covered parking for 12+ cars, entries and lift lobby'], ['Structure', '35′-6″ × 84′-6″'], ['Height', 'About 9.5 ft'], ['Entries', 'West and east walkways to the lift lobby'], ['Fire exit', 'Marked on the plan'], ['Setbacks', 'Open on all four sides']],
  [legendItem('background:#1b1714', 'Column'), legendItem('background:#fff;border:.2mm solid rgba(16,14,12,.5)', 'Lift and stair core'), legendItem('background:#168a4b', 'Fire exit'), legendItem('background:#dccfae', 'Setback, open'), legendItem('background:#2a6f68;height:.6mm', 'Entry route'), '<li><b>N ↑</b>&nbsp;North, road side at the top</li>'],
  I('ground-3d.jpg'), 'Ground level, 3D view. Illustrative.')}
<section class="page">
  ${pband('Floor plan set')}
  <div class="head" style="padding-top:2mm"><div class="eyebrow mono">Site plan</div><h2>The plot, the road <em>and the setbacks.</em></h2></div>
  <div class="pl siteset">
    <div class="sheet"><div class="tb"><b>Site plan</b><span class="mono" style="font-size:5.6pt">Plot D-15 · North at the top</span></div><div class="im" style="padding:0"><img src="${I('site-plan.png')}" alt="Site plan" style="height:auto;width:100%"></div><div class="cap">Drawn from the architect's dimensions. Dimensions as marked; the road width and the neighbours are not drawn to scale.</div></div>
    <div class="side">
      <div><div class="mono" style="color:var(--deep)">Plot</div><div class="num" style="margin-top:1.6mm">525 sq m</div><div style="margin-top:1mm;color:rgba(16,14,12,.72);font-size:8.4pt">About 5,650 sq ft · 49′-5½″ × 115′-6½″</div></div>
      <dl>
        <div><dt>Road</dt><dd>24 m (80 ft) wide, to the north</dd></div>
        <div><dt>Frontage</dt><dd>About 50 ft on the road</dd></div>
        <div><dt>Front setback (north)</dt><dd>15′-8″</dd></div>
        <div><dt>Rear setback (south)</dt><dd>15′-4½″</dd></div>
        <div><dt>East setback</dt><dd>8′-11½″</dd></div>
        <div><dt>West setback</dt><dd>5′-0″</dd></div>
        <div><dt>Ground structure</dt><dd>35′-6″ × 84′-6″</dd></div>
        <div><dt>Floors 1 to 3</dt><dd>40′-6″ × 89′-6″, 5 ft towards the road</dd></div>
      </dl>
      <div class="near">${near.slice(0, 3).map((n) => `<div><span><b>${n[0]}</b><small>${n[1]}</small></span><span class="d">${n[2]}</span></div>`).join('')}</div>
      <div class="cta" style="position:static;height:auto;grid-template-columns:1fr;padding:4mm 5mm;gap:1mm"><div class="lines"><a href="tel:${PHONE1_E}">${PHONE1}</a><a href="mailto:${EMAIL}">${EMAIL}</a></div></div>
    </div>
  </div>
  <p class="pnote small">Areas are approximate and subject to final measurement. The Apollo Hospital is upcoming and under construction. Plans are indicative, not for construction.</p>
  ${pfoot(3)}
</section>
</body></html>`;

(async () => {
  execFileSync('python3', [path.join(__dirname, 'prep-images.py')], { stdio: 'inherit' });
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
