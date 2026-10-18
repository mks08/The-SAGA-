#!/usr/bin/env python3
"""
Builds the two downloadable PDFs for the SHRINEVA site from the site's own artwork:

  src/assets/shrineva-floor-plans.pdf   A3 landscape plan sheets (parking level, typical floor, summary)
  src/assets/shrineva-dossier.pdf       A4 landscape leasing dossier (7 pages)
  src/assets/images/dossier-cover.webp  cover thumbnail for the website card

Run from the shrineva/ folder:   python3 scripts/pdf/build_pdfs.py
Needs: playwright (Chromium), pillow, segno, numpy.  Fonts come from node_modules (@fontsource).
Facts are copied from src/app/config/*.ts; if those change, update FACTS below.
"""
import asyncio, base64, io, os, subprocess, sys, pathlib
import segno
from PIL import Image
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
A = ROOT / 'src' / 'assets'
IMG = A / 'images'
PDFIMG = pathlib.Path(__file__).resolve().parent / 'img'   # PDF-only pictures, not shipped with the site
TMP = pathlib.Path(os.environ.get('PDF_TMP', '/tmp/shrineva-pdf')); TMP.mkdir(parents=True, exist_ok=True)

MAPS_URL = 'https://maps.app.goo.gl/UGerjaEDeKVnrnYw5'
PH1, PH2 = '+91 73557 70378', '+91 81140 80609'
MAIL = 'neerajsingh250@gmail.com'   # shown on the PDFs as of 18 Oct 2026 at the owner's instruction (the leasing@shrineva.com mailbox is not confirmed live)
ADDR = 'D-15, Bada Lalpur, Chandmari, near Apollo Hospital &amp; NIFT, Varanasi, Uttar Pradesh 221003'
DISCLAIMER_PLANS = ("Dimensions follow the architect&rsquo;s CAD plan dated 27.04.26 and the owner&rsquo;s brief. Areas are computed from the "
                    "dimensions shown and are not certified; certified areas will be issued by the architect. 3D views are indicative and subject to change "
                    "for the better. Not for construction. Nothing here is an offer.")

# ── assets ────────────────────────────────────────────────────────────────────
def uri(p):
    return pathlib.Path(p).resolve().as_uri()

def juri(p, q=88):
    """Photographic pictures go into the PDF as JPEG: Chromium would otherwise embed a WebP losslessly and the dossier would be several MB heavier."""
    p = pathlib.Path(p)
    out = TMP / f'{p.parent.name}-{p.stem}.jpg'
    if not out.exists():
        Image.open(p).convert('RGB').save(out, 'JPEG', quality=q, optimize=True, progressive=True, subsampling=0)
    return uri(out)

def font_css():
    nm = ROOT / 'node_modules'
    f = {
        'Instrument Serif': nm / '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2',
        'Manrope': nm / '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
        'DM Mono': nm / '@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2',
    }
    css = ''
    for name, path in f.items():
        extra = "font-weight: 200 800;" if name == 'Manrope' else ''
        css += f"@font-face{{font-family:'{name}';src:url({uri(path)}) format('woff2');{extra}}}\n"
    css += f"@font-face{{font-family:'Instrument Serif';font-style:italic;src:url({uri(nm / '@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')}) format('woff2');}}\n"
    return css

def make_logo():
    out = TMP / 'logo_t.png'
    subprocess.run([sys.executable, str(ROOT / 'scripts/pdf/make_logo.py'), str(IMG / 'shrineva-logo.webp'), str(out)], check=True)
    im = Image.open(out); bbox = im.getbbox(); im.crop(bbox).save(out)
    return out

def qr_svg(text, dark='#1c1814'):
    q = segno.make(text, error='m')
    buf = io.BytesIO(); q.save(buf, kind='svg', scale=1, border=0, dark=dark, light=None, xmldecl=False, svgns=True)
    import re
    svg = buf.getvalue().decode()
    m = re.search(r'width="(\d+)"', svg); n = m.group(1)
    svg = re.sub(r'\s(width|height)="[^"]*"', '', svg, count=2).replace('<svg ', f'<svg viewBox="0 0 {n} {n}" shape-rendering="crispEdges" ', 1)
    return svg

BASE_CSS = """
:root{--ink:#1c1814;--ink2:#4a4239;--mute:#6f6558;--brass:#9a6f25;--brass2:#be8e3e;--page:#efe9dc;--card:#faf7f0;--line:rgba(28,24,20,.16)}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Manrope',sans-serif;color:var(--ink);background:var(--page);font-size:9.4pt;line-height:1.45}
.serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400}
.mono{font-family:'DM Mono',monospace;letter-spacing:.14em;text-transform:uppercase;font-size:6.6pt;color:var(--mute)}
.mono.b{color:var(--brass)}
.page{position:relative;overflow:hidden;page-break-after:always;break-after:page;background:var(--page)}
.page:last-child{page-break-after:auto;break-after:auto}
.card{background:var(--card);border:.25mm solid var(--line);border-radius:3mm}
.rule{height:.25mm;background:var(--line)}
h1,h2,h3{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em;line-height:1.05}
em{font-style:italic;color:var(--brass)}
table{border-collapse:collapse;width:100%}
th,td{text-align:left;padding:2.3mm 0;border-bottom:.25mm solid var(--line);font-weight:500;vertical-align:top}
th.n,td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;padding-left:3mm}
tr.s td,tr.s th{font-weight:800;color:var(--ink)}
thead th{font-family:'DM Mono',monospace;font-size:6.2pt;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);font-weight:400;border-bottom:.35mm solid var(--ink)}
.brassbar{height:1.2mm;background:linear-gradient(90deg,#d8ae5e,#b8893a 50%,#9a6f25)}
"""

# ═══════════════════════════════════════════════════════════════════════════════
# FLOOR-PLAN SHEETS  (A3 landscape, 420 × 297 mm)
# ═══════════════════════════════════════════════════════════════════════════════
def plan_sheets(logo):
    css = BASE_CSS + """
@page{size:420mm 297mm;margin:0}
.page{width:420mm;height:297mm;padding:13mm 14mm 11mm}
.hd{display:flex;align-items:center;gap:8mm;height:24mm}
.hd img{height:22mm;width:auto}
.hd .t{flex:1}
.hd h1{font-size:30pt}
.hd .sub{margin-top:1.6mm}
.hd .sh{text-align:right}
.hd .sh b{display:block;font-family:'Instrument Serif',serif;font-weight:400;font-size:24pt;line-height:1;color:var(--brass)}
.mainp{display:grid;grid-template-columns:var(--lw) 1fr;gap:8mm;margin-top:5mm;height:222mm}
.l2d{background:var(--card);border:.25mm solid var(--line);border-radius:3mm;overflow:hidden;display:flex;align-items:center;justify-content:center}
.l2d img{height:100%;width:auto;display:block}
.rt{display:grid;grid-template-rows:var(--ra) 1fr;gap:8mm;min-width:0}
.ra{display:grid;grid-template-columns:1fr 88mm;gap:8mm;min-height:0}
.ra figure{border-radius:3mm;overflow:hidden;border:.25mm solid var(--line);background:var(--card);display:flex;align-items:center;justify-content:center;min-height:0}
.ra figure img{width:100%;height:100%;object-fit:cover;display:block}
.fig{padding:7mm 7mm 6mm;display:flex;flex-direction:column}
.fig .big{font-family:'Instrument Serif',serif;font-size:54pt;line-height:.95;margin-top:2mm}
.fig .u{margin-top:1.5mm}
.fig dl{margin-top:7mm;display:grid;gap:4.2mm}
.fig dt{font-family:'DM Mono',monospace;font-size:6pt;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
.fig dd{font-weight:700;font-size:10.4pt;margin-top:.6mm}
.rb{display:grid;grid-template-columns:1fr 88mm;gap:8mm;min-height:0}
.box{padding:6.5mm 7mm}
.box h3{font-size:19pt;margin-bottom:3mm}
.notes p{margin-top:3mm;color:var(--ink2);font-size:9.2pt}
.legend{display:grid;gap:2.6mm;margin-top:4mm;font-size:9pt;color:var(--ink2)}
.legend i{display:inline-block;width:5mm;height:3mm;vertical-align:middle;margin-right:2.5mm;border:.25mm solid rgba(28,24,20,.5)}
.ft{position:absolute;left:14mm;right:14mm;bottom:9mm;border-top:.35mm solid var(--ink);padding-top:2.6mm;display:grid;grid-template-columns:1fr auto;gap:10mm;align-items:end}
.ft .d{font-size:6.8pt;color:var(--mute);line-height:1.45;max-width:260mm}
.ft .c{font-size:7.4pt;font-weight:700;text-align:right;line-height:1.5}
.sum{display:grid;grid-template-columns:var(--lw) 1fr;gap:8mm;margin-top:5mm;height:222mm}
.sum .l2d img{width:100%;height:auto;object-fit:contain}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:8mm}
.qr{width:34mm;height:34mm}
.qr svg{width:100%;height:100%}
"""
    lg = uri(logo)
    # shared pieces
    def header(title, sub, sheet):
        return f"""<header class="hd"><img src="{lg}" alt=""><div class="t"><div class="mono b">SHRINEVA &middot; Commercial &amp; mixed-use &middot; Parking + 3</div>
<h1>{title}</h1><div class="sub mono">{sub}</div></div><div class="sh"><div class="mono">Sheet</div><b>{sheet}</b><div class="mono" style="margin-top:1mm">Issued 15 Oct 2026</div></div></header>"""
    def footer(n):
        return f"""<footer class="ft"><div class="d">{DISCLAIMER_PLANS}</div><div class="c">SHRINEVA &middot; {ADDR}<br>{PH1} &middot; {PH2} &middot; {MAIL}<br><span class="mono">Sheet {n} of 3</span></div></footer>"""

    def table(rows, caption):
        out = f"<table><thead><tr><th>{caption}</th><th class='n'>Sq ft</th><th class='n'>Sq m</th></tr></thead><tbody>"
        for lab, ft, m, strong in rows:
            out += f"<tr class='{'s' if strong else ''}'><td>{lab}</td><td class='n'>{ft}</td><td class='n'>{m}</td></tr>"
        return out + "</tbody></table>"

    p2d = uri(IMG / 'plans/parking-2d.webp'); t2d = uri(IMG / 'plans/typical-2d.webp')
    p3d = uri(IMG / 'plans/parking-3d.webp'); t3d = uri(IMG / 'plans/typical-3d.webp'); top = uri(IMG / 'plans/top-view.webp')

    park = f"""<section class="page" style="--lw:121mm;--ra:113mm">{header('Parking level &mdash; <em>floor plan</em>','Open ground level &middot; north-facing plot &middot; 24 m road','SH-01')}
<div class="mainp"><div class="l2d"><img src="{p2d}" alt="Parking level 2D plan"></div>
<div class="rt"><div class="ra"><figure><img src="{p3d}" alt="Parking level 3D cutaway"></figure>
<aside class="card fig"><div class="mono b">Structure zone</div><div class="big">2,999.75</div><div class="mono u">sq ft &middot; 278.69 sq m</div>
<dl><div><dt>Floor to floor</dt><dd>9&prime;-6&Prime;</dd></div><div><dt>Frontage</dt><dd>About 50 ft, open to the road</dd></div>
<div><dt>Entries</dt><dd>West and east to the lift and stair lobby</dd></div><div><dt>Lift</dt><dd>8 passengers</dd></div>
<div><dt>Staircase</dt><dd>5&prime;-3&Prime; flights &middot; 19 risers</dd></div></dl></aside></div>
<div class="rb"><div class="card box"><h3>Area statement</h3>{table([
 ('Structure zone, to the outer face of columns (35&prime;-6&Prime; &times; 84&prime;-6&Prime;)','2,999.75','278.69',False),
 ('Lift and stair bay (12&prime;-9&Prime; &times; 27&prime;-9&Prime;)','353.81','32.87',False),
 ('Open parking area, excluding the bay','2,645.94','245.82',True)],'Item')}
<div class="notes"><p>Plot 525 sq m (about 5,651 sq ft), north-facing on a 24 m road. The ground level is open to the road at the front, with boundary walls on the west, east and south.</p></div></div>
<aside class="card box notes"><h3>Reading the plan</h3><div class="legend">
<div><i style="background:#cfc7b5"></i>Structure zone</div><div><i style="background:#2b2622"></i>Columns and structural walls</div>
<div><i style="background:#faf7f0"></i>Lift and stair lobby</div><div><i style="background:transparent;border-style:dashed"></i>Column grid A&ndash;C, 1&ndash;7</div></div>
<p>North is up. The road is at the top of the plan. Nearby NIFT and Apollo are shown on the plan for orientation only.</p></aside></div></div></div>{footer(1)}</section>"""

    typ = f"""<section class="page" style="--lw:121mm;--ra:113mm">{header('Floors 1, 2 &amp; 3 &mdash; <em>typical floor plan</em>','One open floor plate, repeated on every floor &middot; glass front on the road','SH-02')}
<div class="mainp"><div class="l2d"><img src="{t2d}" alt="Typical floor 2D plan"></div>
<div class="rt"><div class="ra"><figure><img src="{t3d}" alt="Typical floor 3D cutaway"></figure>
<aside class="card fig"><div class="mono b">Floor area</div><div class="big">3,519.75</div><div class="mono u">sq ft &middot; 327.00 sq m</div>
<dl><div><dt>Floor to floor</dt><dd>11&prime;-6&Prime; (3.51 m)</dd></div><div><dt>Front</dt><dd>40&prime;-6&Prime; glass line on the road</dd></div>
<div><dt>Daylight</dt><dd>Glass front, windows east and west</dd></div><div><dt>Lift</dt><dd>8 passengers</dd></div>
<div><dt>Staircase</dt><dd>5&prime;-3&Prime; flights &middot; 24 risers</dd></div></dl></aside></div>
<div class="rb"><div class="card box"><h3>Area statement</h3>{table([
 ('Floor area, 40&prime;-6&Prime; &times; 89&prime;-6&Prime; less the east recess','3,519.75','327.00',False),
 ('Lift and stair bay (12&prime;-9&Prime; &times; 27&prime;-9&Prime;)','&minus; 353.81','&minus; 32.87',False),
 ('External walls, 9&Prime;','&minus; 148.69','&minus; 13.81',False),
 ('Carpet area (85.7% of floor area)','3,017.25','280.31',True)],'Item')}
<div class="notes"><p>Handover condition, clear ceiling height, toilets and pantry are to be confirmed and agreed with each occupier. Floor-wise modifications can be considered.</p></div></div>
<aside class="card box notes"><h3>Reading the plan</h3><div class="legend">
<div><i style="background:#f1ead6"></i>Open floor plate</div><div><i style="background:#2b2622"></i>Columns and structural walls</div>
<div><i style="background:#9fd0d6"></i>Glass line and windows</div><div><i style="background:transparent;border-style:dashed"></i>Column grid A&ndash;C, 1&ndash;7</div></div>
<p>Floors 1, 2 and 3 share this plan. The east recess is 4&prime;-0&Prime; &times; 26&prime;-3&Prime;. Divide the floor as required.</p></aside></div></div></div>{footer(2)}</section>"""

    rows = ''.join(f"<tr class='{'s' if s else ''}'><td>{a}</td><td>{b}</td><td class='n'>{c}</td><td class='n'>{d}</td></tr>" for a, b, c, d, s in [
        ('Parking level','9&prime;-6&Prime;','2,999.75 (structure zone)','&mdash;',False),
        ('Floor 1','11&prime;-6&Prime;','3,519.75','3,017.25',False),
        ('Floor 2','11&prime;-6&Prime;','3,519.75','3,017.25',False),
        ('Floor 3','11&prime;-6&Prime;','3,519.75','3,017.25',False),
        ('Floors 1&ndash;3 together','','10,559.25','9,051.75',True)])
    qr = qr_svg(MAPS_URL)
    summ = f"""<section class="page" style="--lw:215mm">{header('Building summary &mdash; <em>parking level and floors</em>','Top view &middot; areas &middot; building data','SH-03')}
<div class="sum"><div class="l2d" style="align-items:flex-start"><img src="{top}" alt="Top view of the parking level beside the first floor"></div>
<div class="rt" style="grid-template-rows:auto auto 1fr">
<div class="card box"><h3>Area schedule</h3><table><thead><tr><th>Level</th><th>Floor to floor</th><th class="n">Floor area, sq ft</th><th class="n">Carpet, sq ft</th></tr></thead><tbody>{rows}</tbody></table>
<div class="notes"><p>Areas are computed from the architect&rsquo;s dimensions. Leasable area is not yet defined; it depends on the measurement basis agreed in the lease and will be confirmed with the certified areas.</p></div></div>
<div class="card box"><h3>Building data</h3><div class="cols" style="margin-top:2mm"><table><tbody>
<tr><td>Plot</td><td class="n">525 sq m (about 5,651 sq ft)</td></tr><tr><td>Facing</td><td class="n">North, on a 24 m road</td></tr>
<tr><td>Frontage</td><td class="n">About 50 ft</td></tr><tr><td>Open on</td><td class="n">All four sides</td></tr></tbody></table>
<table><tbody><tr><td>Levels</td><td class="n">Parking + 3 floors</td></tr><tr><td>Lift</td><td class="n">8 passengers</td></tr>
<tr><td>Status</td><td class="n">Under construction</td></tr><tr><td>Planned handover</td><td class="n">March 2027</td></tr></tbody></table></div></div>
<div class="card box" style="display:grid;grid-template-columns:1fr auto;gap:8mm;align-items:center"><div class="notes"><h3>Arrange a visit</h3>
<p style="margin-top:2.4mm;font-size:9.4pt"><b>{PH1}</b> &middot; <b>{PH2}</b><br>{MAIL}<br>{ADDR}</p><p>Scan to open the exact plot in Google Maps.</p></div><div class="qr">{qr}</div></div>
</div></div>{footer(3)}</section>"""
    html = f"<!doctype html><meta charset='utf-8'><title>SHRINEVA &mdash; Floor plans</title><style>{font_css()}{css}</style>{park}{typ}{summ}"
    return html

# ═══════════════════════════════════════════════════════════════════════════════
# DOSSIER  (A4 landscape, 297 × 210 mm, 7 pages)
# ═══════════════════════════════════════════════════════════════════════════════
def dossier(logo):
    lg = uri(logo)
    css = BASE_CSS + """
@page{size:297mm 210mm;margin:0}
.page{width:297mm;height:210mm;padding:14mm 16mm 12mm}
.top{display:flex;justify-content:space-between;align-items:center;height:9mm}
.top img{height:9mm}
.pg{position:absolute;left:16mm;right:16mm;bottom:8mm;display:flex;justify-content:space-between;color:var(--mute)}
h2{font-size:30pt}
h2.s{font-size:26pt}
p.lead{font-size:10.5pt;color:var(--ink2);max-width:118mm;margin-top:3.4mm}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}
.tile{padding:5mm 5.5mm 4.6mm}
.tile .n{font-family:'Instrument Serif',serif;font-size:25pt;line-height:1;white-space:nowrap}
.tile .l{margin-top:1.4mm;font-size:8pt;color:var(--ink2);font-weight:600}
.tag{display:inline-block;padding:1.2mm 3.2mm;border:.25mm solid var(--brass);border-radius:5mm;font-size:7.6pt;font-weight:700;color:var(--brass);margin:0 1.6mm 1.6mm 0}
.img{border-radius:3mm;overflow:hidden;position:relative}
.img img{width:100%;height:100%;object-fit:cover;display:block}
.cap{position:absolute;left:3mm;bottom:3mm;background:rgba(250,247,240,.92);padding:1.2mm 2.8mm;border-radius:5mm;font-size:6.6pt;font-weight:700;letter-spacing:.04em}
.row{display:grid;gap:5mm}
.fl{display:grid;grid-template-columns:1fr 1fr;gap:3.2mm}
.ft2{padding:5.2mm 5mm}
.ft2 b{display:block;font-size:9.6pt}
.ft2 span{font-size:8.2pt;color:var(--ink2)}
.dist{display:grid;gap:0}
.dist div{display:flex;justify-content:space-between;gap:4mm;padding:1.7mm 0;border-bottom:.25mm solid var(--line);font-size:8.6pt}
.dist b{font-family:'Instrument Serif',serif;font-weight:400;font-size:13pt;color:var(--brass);white-space:nowrap}
.dist small{display:block;color:var(--mute);font-size:7pt;font-weight:500}
.anc{padding:4.2mm 5mm}
.anc h3{font-size:15pt}
.anc p{font-size:8.2pt;color:var(--ink2);margin-top:1mm}
.stp{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}
.stp .card{padding:5mm}
.stp .k{font-family:'DM Mono',monospace;font-size:6.4pt;letter-spacing:.14em;color:var(--brass);text-transform:uppercase}
.qr{width:30mm;height:30mm}.qr svg{width:100%;height:100%}
.small{font-size:6.8pt;color:var(--mute);line-height:1.45}
"""
    def top(n, label):
        return f"""<div class="top"><img src="{lg}" alt=""><span class="mono">{label}</span></div>"""
    def foot(n):
        return f"""<div class="pg mono"><span>SHRINEVA &middot; Bada Lalpur, Varanasi</span><span>{n} / 7</span></div>"""

    hero = juri(IMG / 'hero/hero-golden-2000.webp')
    pages = []

    # 1 cover
    pages.append(f"""<section class="page" style="padding:0">
<img src="{hero}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(28,24,20,.0) 38%,rgba(28,24,20,.55) 100%)"></div>
<div style="position:absolute;left:16mm;top:14mm;background:rgba(250,247,240,.93);border-radius:4mm;padding:3.4mm 5.4mm"><img src="{lg}" alt="" style="height:17mm;display:block"></div>
<div class="card" style="position:absolute;left:16mm;bottom:16mm;width:150mm;padding:9mm 10mm 8mm;background:rgba(250,247,240,.96)">
<div class="mono b">Leasing dossier &middot; October 2026</div>
<h1 style="font-size:35pt;margin-top:3mm">Commercial &amp; <em>mixed-use</em> space in Varanasi</h1>
<p style="margin-top:3.4mm;font-size:10.5pt;color:var(--ink2)">Parking + 3 whole floors on a 24 m road at Bada Lalpur, opposite the Apollo hospital and NIFT sites.</p>
<div style="display:flex;gap:7mm;margin-top:5mm"><div><div class="mono">Status</div><b>Under construction</b></div><div><div class="mono">Planned handover</div><b>March 2027</b></div><div><div class="mono">Each floor</div><b>3,520 sq ft</b></div></div></div>
<div class="mono" style="position:absolute;right:16mm;bottom:12mm;color:#f4efe4">Illustrative render &middot; subject to change</div></section>""")

    # 2 at a glance: a tall night view of the whole building beside the facts (the 2000 px render, cropped to the building, not a thin banner)
    night = juri(IMG / 'hero/hero-night-2000.webp', 90)
    pages.append(f"""<section class="page">{top(2,'At a glance')}
<div style="display:grid;grid-template-columns:121mm 1fr;gap:11mm;margin-top:8mm">
<div class="img" style="height:152mm"><img src="{night}" alt="" style="object-position:50% 38%"><span class="cap">FA&Ccedil;ADE AT NIGHT &middot; ILLUSTRATIVE</span></div>
<div><div class="mono b">The opportunity</div><h2 class="s" style="margin-top:2.6mm">A new commercial address, <em>built around footfall.</em></h2>
<p class="lead" style="max-width:none;font-size:10pt">Bada Lalpur is gaining a 400-bed hospital, a design campus and an operating trade centre on one road. SHRINEVA offers four open levels, a glass-fronted floor plate and a four-side open plot right there.</p>
<div class="tiles" style="margin-top:5mm;gap:3.4mm">
<div class="card tile"><div class="n">3,520</div><div class="l">sq ft on every floor</div></div>
<div class="card tile"><div class="n">Parking + 3</div><div class="l">four open levels</div></div>
<div class="card tile"><div class="n">50 ft</div><div class="l">frontage on a 24 m road</div></div>
<div class="card tile"><div class="n">4 sides</div><div class="l">open plot: light, air, access</div></div>
<div class="card tile"><div class="n">60&ndash;70 m</div><div class="l">to Apollo and NIFT</div></div>
<div class="card tile"><div class="n">Mar 2027</div><div class="l">planned handover</div></div></div>
<div class="card" style="margin-top:3.4mm;padding:4mm 5mm;display:grid;grid-template-columns:auto 1fr;gap:5mm;align-items:center"><div class="mono b">Status<br>15 Oct 2026</div><div style="font-size:9pt;color:var(--ink2)">Structure almost complete. Timeline as planned by the owner; subject to approvals and site conditions.</div></div>
<div style="margin-top:5mm"><div class="mono" style="margin-bottom:2mm">Suited to</div><span class="tag">Offices</span><span class="tag">Restaurants &amp; fine dining</span><span class="tag">Clinics &amp; diagnostics</span><span class="tag">Retail &amp; showrooms</span><span class="tag">Studio &amp; serviced stay</span></div>
<p class="small" style="margin-top:3mm">Use is subject to applicable approvals, building regulations and fire and safety requirements. Floor-wise modifications can be considered as per your requirement.</p></div></div>{foot(2)}</section>""")

    # 3 location
    mp = juri(IMG / 'map/location-3d.webp')
    qr = qr_svg(MAPS_URL)
    pages.append(f"""<section class="page">{top(3,'Location')}
<div style="display:grid;grid-template-columns:1.18fr 1fr;gap:10mm;margin-top:9mm">
<div><div class="mono b">Location</div><h2 class="s" style="margin-top:2.4mm">Three anchors. <em>One address.</em></h2>
<div class="img" style="margin-top:5mm"><img src="{mp}" alt="" style="height:auto"><span class="cap">3D MAP &middot; NOT TO SCALE</span></div>
<div class="dist" style="margin-top:4mm;grid-template-columns:1fr 1fr;column-gap:8mm">
<div><span>NIFT Varanasi<small>Across the road</small></span><b>60&ndash;70 m</b></div><div><span>Apollo Hospitals<small>Under construction</small></span><b>60&ndash;70 m</b></div>
<div><span>Varanasi Trade Centre<small>Along the road</small></span><b>&asymp; 330 m</b></div><div><span>Vardhan Hospital, Lalpur<small>Opposite the Trade Centre</small></span><b>Nearby</b></div>
<div><span>Ring Road (NH 135B)<small>By road</small></span><b>&asymp; 1 km</b></div><div><span>Ganjari Cricket Stadium<small>By road, approx.</small></span><b>&asymp; 20 km</b></div></div></div>
<div class="row" style="align-content:start;margin-top:12mm">
<div class="card anc"><div class="mono b">Healthcare &middot; under construction</div><h3>Apollo Hospitals</h3><p>Multi-specialty hospital planned at about 400 beds; OPD is expected to start in 2027. Patients, families and staff every day.</p></div>
<div class="card anc"><div class="mono b">Education &middot; classes running</div><h3>NIFT Varanasi</h3><p>Classes running since 2024; permanent campus on 7.5 acres under construction, expected ready in 2027.</p></div>
<div class="card anc"><div class="mono b">Trade &amp; events &middot; operating</div><h3>Varanasi Trade Centre</h3><p>1,000-seat hall and 50 marts: delegates and buyers, in bursts.</p></div>
<div class="card anc" style="display:grid;grid-template-columns:1fr auto;gap:5mm;align-items:center"><div><div class="mono b">The address</div><p style="color:var(--ink);font-weight:600;margin-top:1mm">{ADDR}</p></div><div class="qr">{qr}</div></div>
</div></div>
<p class="small" style="position:absolute;left:16mm;right:16mm;bottom:15mm">Distances are approximate, from the owner&rsquo;s location sheet; Ganjari is a rough estimate. Development timelines are the owner&rsquo;s expectations and public reports reviewed on 15 October 2026, and may change. Scan the code to open the exact plot in Google Maps.</p>
{foot(3)}</section>""")

    # 4 the building
    r1 = juri(IMG / 'renders/parking-night.webp', 90); r2 = juri(IMG / 'renders/entry-portal.webp', 90); r3 = juri(IMG / 'renders/east-shrine.webp', 90)
    feats = [('Vastu compliant','Planned to Vastu principles'),('Column-free structure','Open plates, columns kept to the edges'),('Fire safety','Provisions built in'),('24&times;7 safety','Round-the-clock security'),
             ('Fine dining','Planned for restaurants'),('Offices','Whole floors, one or many'),('4-side open plot','Light, air and access'),('Parking, internet, DG backup','Building services')]
    fh = ''.join(f"<div class='card ft2'><b>{a}</b><span>{b}</span></div>" for a, b in feats)
    pages.append(f"""<section class="page">{top(4,'The building')}
<div style="display:grid;grid-template-columns:1.25fr 1fr;gap:9mm;margin-top:9mm">
<div><div class="mono b">The building</div><h2 class="s" style="margin-top:2.4mm">Open floors, <em>clearly planned.</em></h2>
<div class="img" style="height:86mm;margin-top:5mm"><img src="{r1}" alt=""><span class="cap">ENTRY COURT AT NIGHT</span></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:4mm"><div class="img" style="height:46mm"><img src="{r2}" alt=""><span class="cap">ENTRY PORTAL</span></div><div class="img" style="height:46mm"><img src="{r3}" alt=""><span class="cap">EAST WALK &middot; SMALL SHRINE</span></div></div></div>
<div style="padding-top:6mm"><div class="mono" style="margin-bottom:3mm">Key features, as stated by the owner</div><div class="fl">{fh}</div>
<p class="small" style="margin-top:5mm">As specified by the owner; subject to final design and approvals. Renders are indicative and subject to change for the better; finishes and surroundings are illustrative.</p></div></div>{foot(4)}</section>""")

    # 5 plans
    pages.append(f"""<section class="page">{top(5,'Floor plans')}
<div style="display:grid;grid-template-columns:auto auto 1fr;gap:8mm;margin-top:8mm;align-items:start">
<figure><div class="card" style="height:148mm;width:80.2mm;overflow:hidden;display:flex;justify-content:center"><img src="{uri(IMG / 'plans/parking-2d.webp')}" alt="" style="height:100%;width:auto"></div><figcaption class="mono" style="margin-top:2mm">Parking level &middot; 2,999.75 sq ft</figcaption></figure>
<figure><div class="card" style="height:148mm;width:80.2mm;overflow:hidden;display:flex;justify-content:center"><img src="{uri(IMG / 'plans/typical-2d.webp')}" alt="" style="height:100%;width:auto"></div><figcaption class="mono" style="margin-top:2mm">Floors 1&ndash;3 &middot; 3,519.75 sq ft each</figcaption></figure>
<div><div class="mono b">Floor plans</div><h2 class="s" style="margin-top:2.4mm">Every level, <em>drawn to the inch.</em></h2>
<table style="margin-top:5mm"><thead><tr><th>Level</th><th class="n">Floor area sq ft</th><th class="n">Carpet sq ft</th></tr></thead><tbody>
<tr><td>Parking level</td><td class="n">2,999.75</td><td class="n">&mdash;</td></tr><tr><td>Floor 1</td><td class="n">3,519.75</td><td class="n">3,017.25</td></tr>
<tr><td>Floor 2</td><td class="n">3,519.75</td><td class="n">3,017.25</td></tr><tr><td>Floor 3</td><td class="n">3,519.75</td><td class="n">3,017.25</td></tr></tbody></table>
<div class="rule" style="margin:5mm 0"></div>
<div class="fl" style="grid-template-columns:1fr 1fr"><div class="card ft2"><b>Floor to floor</b><span>9&prime;-6&Prime; parking, 11&prime;-6&Prime; floors</span></div><div class="card ft2"><b>Glass front</b><span>40&prime;-6&Prime; on the road</span></div><div class="card ft2"><b>Lift</b><span>8 passengers</span></div><div class="card ft2"><b>Stairs</b><span>5&prime;-3&Prime; flights</span></div></div>
<p class="small" style="margin-top:5mm">Areas are computed from the architect&rsquo;s dimensions and are not certified. Full A3 plan sheets are available as a separate PDF.</p></div></div>{foot(5)}</section>""")

    # 6 3D cutaways + use
    pages.append(f"""<section class="page">{top(6,'In 3D')}
<div class="mono b" style="margin-top:9mm">In three dimensions</div><h2 class="s" style="margin-top:2.4mm">See how each floor <em>opens up.</em></h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:5mm">
<div><div class="img" style="height:60mm"><img src="{juri(IMG / 'plans/parking-3d.webp')}" alt=""></div><div class="mono" style="margin-top:1.6mm">Parking level &middot; 3D cutaway</div></div>
<div><div class="img" style="height:60mm"><img src="{juri(IMG / 'plans/typical-3d.webp')}" alt=""></div><div class="mono" style="margin-top:1.6mm">Floors 1&ndash;3 &middot; 3D cutaway</div></div></div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin-top:4mm">
<div><div class="img" style="height:33mm"><img src="{juri(PDFIMG / 'wt-east-wall.webp')}" alt=""></div><div class="mono" style="margin-top:1.4mm">Entry court &middot; east wall</div></div>
<div><div class="img" style="height:33mm"><img src="{juri(PDFIMG / 'wt-water-shrine.webp')}" alt=""></div><div class="mono" style="margin-top:1.4mm">Water walls &amp; small shrine</div></div>
<div><div class="img" style="height:33mm"><img src="{juri(PDFIMG / 'wt-glass-lift.webp')}" alt=""></div><div class="mono" style="margin-top:1.4mm">Glass lift at the lobby</div></div></div>
<div class="stp" style="margin-top:4.5mm">
<div class="card"><div class="k">Whole-floor office</div><p style="margin-top:1.4mm;font-size:8.4pt;color:var(--ink2)">One open 3,520 sq ft plate with a glass front on the road, daylight east and west.</p></div>
<div class="card"><div class="k">Dining &amp; hospitality</div><p style="margin-top:1.4mm;font-size:8.4pt;color:var(--ink2)">A full floor for a restaurant or fine dining, with road presence and a lift to the door.</p></div>
<div class="card"><div class="k">Clinic, retail, studio stay</div><p style="margin-top:1.4mm;font-size:8.4pt;color:var(--ink2)">Divide a floor as required. Patients, students and delegates pass this road all week.</p></div></div>
<p class="small" style="position:absolute;left:16mm;right:16mm;bottom:15mm">Indicative 3D and walkthrough views, drawn from the architect&rsquo;s dimensions; the ground-floor court design is a concept and subject to change for the better. Uses are suggestions, not legal use restrictions, and depend on approvals.</p>{foot(6)}</section>""")

    # 7 next steps: text and cards left, a properly cropped golden-hour view under them, contact card right
    hero7 = juri(IMG / 'hero/hero-golden-2000.webp', 90)
    pages.append(f"""<section class="page">{top(7,'Next steps')}
<div style="display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:12mm;margin-top:9mm">
<div><div class="mono b">Next steps</div><h2 style="margin-top:3mm">Let&rsquo;s plan your floor <em>together.</em></h2>
<p class="lead" style="max-width:128mm">The structure is almost complete and floor-wise modifications can be considered, so now is the time to shape the space around your requirement.</p>
<div class="stp" style="grid-template-columns:1fr 1fr 1fr;margin-top:6mm">
<div class="card"><div class="k">Now</div><p style="margin-top:1.4mm;font-size:8.4pt;color:var(--ink2)">Enquiries and site visits by appointment.</p></div>
<div class="card"><div class="k">On request</div><p style="margin-top:1.4mm;font-size:8.4pt;color:var(--ink2)">Certified areas, approvals, services and a term sheet, once finalised.</p></div>
<div class="card"><div class="k">March 2027</div><p style="margin-top:1.4mm;font-size:8.4pt;color:var(--ink2)">Planned handover, subject to approvals and site conditions.</p></div></div>
<div class="img" style="height:56mm;margin-top:6mm"><img src="{hero7}" alt="" style="object-position:50% 74%"><span class="cap">SHRINEVA &middot; ILLUSTRATIVE RENDER</span></div></div>
<div class="card" style="padding:9mm 10mm;align-self:start"><div class="mono b">Leasing desk</div>
<div class="serif" style="font-size:24pt;margin-top:2mm">{PH1}</div><div class="serif" style="font-size:24pt">{PH2}</div>
<div style="margin-top:3mm;font-weight:700;color:var(--brass)">{MAIL}</div><p style="font-size:8.6pt;color:var(--ink2);margin-top:2mm">WhatsApp: {PH2}</p>
<div class="rule" style="margin:5mm 0"></div><div style="display:grid;grid-template-columns:1fr auto;gap:6mm;align-items:center"><p style="font-size:8.6pt;color:var(--ink2)">{ADDR}<br><span class="small">Scan to open the exact plot in Google Maps.</span></p><div class="qr">{qr_svg(MAPS_URL)}</div></div></div></div>
<p class="small" style="position:absolute;left:16mm;right:16mm;bottom:15mm">This dossier is for information only and is not an offer or a contract. Areas, dimensions, specifications, timelines and images are indicative, as stated by the owner, and subject to change, approvals and final documents.</p>{foot(7)}</section>""")

    html = f"<!doctype html><meta charset='utf-8'><title>SHRINEVA &mdash; Leasing dossier</title><style>{font_css()}{css}</style>" + ''.join(pages)
    return html

async def render(html, out, title):
    f = TMP / (out.stem + '.html'); f.write_text(html, encoding='utf8')
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto(f.as_uri(), wait_until='load')
        await pg.evaluate("document.fonts.ready")
        await pg.wait_for_timeout(1200)
        await pg.pdf(path=str(out), prefer_css_page_size=True, print_background=True)
        await b.close()
    print('wrote', out, out.stat().st_size // 1024, 'KB')

def main():
    logo = make_logo()
    asyncio.run(render(plan_sheets(logo), A / 'shrineva-floor-plans.pdf', 'plans'))
    asyncio.run(render(dossier(logo), A / 'shrineva-dossier.pdf', 'dossier'))
    # cover thumbnail for the website card
    subprocess.run(['pdftoppm', '-r', '110', '-f', '1', '-l', '1', '-png', str(A / 'shrineva-dossier.pdf'), str(TMP / 'cover')], check=True)
    c = sorted(TMP.glob('cover*.png'))[0]
    Image.open(c).convert('RGB').resize((900, 636)).save(IMG / 'dossier-cover.webp', quality=82)
    print('cover ok')

if __name__ == '__main__':
    main()
