"""
Web floor plans for SHRINEVA, drawn from the architect's dimensions in geo.py (single source of truth).

Output: src/app/config/plan-drawings.ts  (two inline-SVG strings: parking level, typical floor)

Why drawn rather than a screenshot: crisp at any size, one tight viewBox (no dead bands), labels never clip,
text uses the site fonts, and the numbers cannot drift from the geometry.

Run:  python3 scripts/plans/gen_web_plans.py
Needs: shapely
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from geo import *  # noqa: F401,F403
import geo

S = 8.0            # px per foot
ML = 38.0          # left margin (dimension chain)
MT = 46.0          # road band height = top of plot
W = round(ML + S * PLOT_W + 52)
H = round(MT + S * PLOT_L + 92)

INK, MUTE, BRASS, TEAL = '#231f1b', '#6d655a', '#8a6420', '#2d6a62'


def X(x): return ML + S * x
def Y(y): return MT + S * y
def n(v):
    s = ('%.1f' % v).rstrip('0').rstrip('.')
    return '0' if s in ('', '-0') else s


def rect(x0, y0, x1, y1, cls='', style=''):
    c = f' class="{cls}"' if cls else ''
    st = f' style="{style}"' if style else ''
    return f'<rect x="{n(X(x0))}" y="{n(Y(y0))}" width="{n(S*(x1-x0))}" height="{n(S*(y1-y0))}"{c}{st}/>'


def text(x, y, s, cls='t', rot=None, anchor=None):
    r = f' transform="rotate({rot} {n(x)} {n(y)})"' if rot is not None else ''
    a = f' text-anchor="{anchor}"' if anchor else ''
    return f'<text x="{n(x)}" y="{n(y)}" class="{cls}"{a}{r}>{s}</text>'


def fa(v): return '{:,.2f}'.format(v)


STYLE = f'''<style>
.pd-t{{font-family:var(--font-sans);font-size:11px;fill:{INK};font-weight:500}}
.pd-s{{font-family:var(--font-sans);font-size:10px;fill:{MUTE};font-weight:500}}
.pd-c{{font-family:var(--font-mono);font-size:9.5px;fill:{MUTE};letter-spacing:.12em;text-transform:uppercase}}
.pd-b{{font-weight:700}}
.pd-d{{font-family:var(--font-display);fill:{INK}}}
.pd-col{{fill:{INK}}}
.pd-wall{{fill:#8b8477;stroke:#2e2c29;stroke-width:.8}}
.pd-dim{{stroke:{MUTE};stroke-width:.9;fill:none}}
.pd-ext{{stroke:#a39b8b;stroke-width:.7;stroke-dasharray:2 3;fill:none}}
.pd-grid{{stroke:#b9b09b;stroke-width:.6;stroke-dasharray:10 3 2 3;fill:none}}
.pd-gb{{fill:#fbf8f0;stroke:{INK};stroke-width:1}}
.pd-gt{{font-family:var(--font-sans);font-weight:700;font-size:9.5px;fill:{INK};text-anchor:middle}}
</style>'''

DEFS = f'''<defs>
<marker id="pdab" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="{BRASS}"/></marker>
<marker id="pdag" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="{TEAL}"/></marker>
<marker id="pdai" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="{INK}"/></marker>
<pattern id="pdhatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#b3a88e" stroke-width="1"/></pattern>
</defs>'''


def road():
    return (f'<rect x="0" y="0" width="{W}" height="{n(MT)}" fill="#34312d"/>'
            f'<path d="M0 {n(MT/2)} H{W}" stroke="#d8b15a" stroke-width="1.6" stroke-dasharray="16 11"/>'
            f'<text x="{n(ML)}" y="{n(MT-8)}" class="pd-c" style="fill:#e9e2d0">24 m wide road</text>')


def grid_bubbles(y_bottom):
    o = []
    for lab, x in (('A', 6.0), ('B', 28.0), ('C', 40.0)):
        o.append(f'<circle cx="{n(X(x))}" cy="{n(y_bottom)}" r="9" class="pd-gb"/><text x="{n(X(x))}" y="{n(y_bottom+3.4)}" class="pd-gt">{lab}</text>')
    bx = X(PLOT_W) + 24
    for i, r in enumerate(R, 1):
        o.append(f'<circle cx="{n(bx)}" cy="{n(Y(r))}" r="9" class="pd-gb"/><text x="{n(bx)}" y="{n(Y(r)+3.4)}" class="pd-gt">{i}</text>')
    xs = ' '.join(f'M{n(X(x))} {n(Y(R1)-6)} V{n(Y(R7)+6)}' for x in (6.0, 28.0, 40.0))
    ys = ' '.join(f'M{n(X(0)+4)} {n(Y(r))} H{n(bx-9)}' for r in R)
    return f'<path d="{xs}" class="pd-grid"/><path d="{ys}" class="pd-grid"/>' + '\n'.join(o)


def tick(x, y): return f'M{n(x-3.5)} {n(y+3.5)} L{n(x+3.5)} {n(y-3.5)}'


def hdim(y, x0, x1, label, above=True):
    mid = (x0 + x1) / 2
    ty = y - 5 if above else y + 13
    return (f'<path d="M{n(x0)} {n(y)} H{n(x1)}" class="pd-dim"/><path d="{tick(x0,y)} {tick(x1,y)}" class="pd-dim"/>'
            + text(mid, ty, label, 'pd-s', anchor='middle'))


def vdim(x, y0, y1, label):
    mid = (y0 + y1) / 2
    return (f'<path d="M{n(x)} {n(y0)} V{n(y1)}" class="pd-dim"/><path d="{tick(x,y0)} {tick(x,y1)}" class="pd-dim"/>'
            + text(x - 5, mid, label, 'pd-s', rot=-90, anchor='middle'))


def north_and_scale():
    nx, ny = W - 34, H - 52
    o = [f'<circle cx="{n(nx)}" cy="{n(ny)}" r="20" fill="none" stroke="{INK}" stroke-width=".9"/>',
         f'<path d="M{n(nx)} {n(ny-15)} L{n(nx+7)} {n(ny+12)} L{n(nx)} {n(ny+7)} L{n(nx-7)} {n(ny+12)} Z" fill="{INK}"/>',
         f'<text x="{n(nx)}" y="{n(ny-26)}" class="pd-t pd-b" text-anchor="middle">N</text>']
    sx, sy = X(0), H - 40
    o.append(f'<text x="{n(sx)}" y="{n(sy-8)}" class="pd-c">Scale, feet</text>')
    for a, b, dark in ((0, 5, 1), (5, 10, 0), (10, 20, 1), (20, 40, 0)):
        o.append(f'<rect x="{n(sx+S*a)}" y="{n(sy)}" width="{n(S*(b-a))}" height="6" fill="{INK if dark else "#fbf8f0"}" stroke="{INK}" stroke-width=".8"/>')
    for v in (0, 5, 10, 20, 40):
        o.append(f'<text x="{n(sx+S*v)}" y="{n(sy+19)}" class="pd-s" text-anchor="middle">{v}</text>')
    return '\n'.join(o)


def bay(floor):
    """Lift and stair bay: same geometry as the architect-sheet drawing, lighter labelling for the web."""
    st = STAIR[floor]; run0 = st['run0']; N = st['treads']
    o = [rect(BX0, BY0, BX1, BY1, style='fill:#ece5d2'),
         rect(BX0, LOBBY_Y0, BX1, run0, style='fill:#f8f4e9'),
         rect(X_FLIGHT_W[0], run0, X_FLIGHT_E[1], LAND_Y1, style='fill:#fcfaf3'),
         rect(X_LIFT[0], Y_LIFT[0], X_LIFT[1], Y_LIFT[1], style=f'fill:#f6f2e9;stroke:{INK};stroke-width:1'),
         rect(X_SERV[0], Y_LIFT[0], X_SERV[1], Y_LIFT[1], style=f'fill:url(#pdhatch);stroke:{INK};stroke-width:.9')]
    tl = []
    for k in range(N + 1):
        yy = Y(run0 + k * TREAD)
        for xa, xb in (X_FLIGHT_W, X_FLIGHT_E):
            tl.append(f'M{n(X(xa))} {n(yy)} H{n(X(xb))}')
    o.append(f'<path d="{" ".join(tl)}" stroke="#6b645a" stroke-width=".7" fill="none"/>')
    for xr in (X_FLIGHT_W, X_FLIGHT_E):
        o.append(rect(xr[0], run0, xr[1], LAND_Y0, style='fill:none;stroke:#6b645a;stroke-width:.7'))
    o.append(rect(X_FLIGHT_W[0], LAND_Y0, X_FLIGHT_E[1], LAND_Y1, style='fill:none;stroke:#6b645a;stroke-width:.7'))
    o.append(rect(X_WELL[0], run0, X_WELL[1], LAND_Y0, style='fill:#d6cfbc;stroke:#6b645a;stroke-width:.6'))
    # 9 in walls
    def w(x0, y0, x1, y1): return rect(x0, y0, x1, y1, cls='pd-wall')
    o += [w(BX0, BY0, BX1, Y_NWALL[1]), w(X_WALL_W[0], BY0, X_WALL_W[1], LOBBY_Y0), w(X_WALL_E[0], BY0, X_WALL_E[1], LOBBY_Y0),
          w(X_WALL_W[0], run0, X_WALL_W[1], BY1), w(X_WALL_E[0], run0, X_WALL_E[1], BY1), w(BX0, Y_SWALL[0], BX1, BY1),
          w(X_PART[0], Y_NWALL[1], X_PART[1], Y_FWALL[0])]
    SD = (30.1, 32.8); LD = (34.75, 34.75 + 3.833)
    o += [w(BX0, Y_FWALL[0], SD[0], Y_FWALL[1]), w(SD[1], Y_FWALL[0], LD[0], Y_FWALL[1]), w(LD[1], Y_FWALL[0], BX1, Y_FWALL[1])]
    ymid = (Y_FWALL[0] + Y_FWALL[1]) / 2; mid = (LD[0] + LD[1]) / 2
    o.append(f'<rect x="{n(X(LD[0]))}" y="{n(Y(ymid)-1.6)}" width="{n(X(mid)-X(LD[0]))}" height="3.2" fill="{BRASS}"/>'
             f'<rect x="{n(X(mid))}" y="{n(Y(ymid)-1.6)}" width="{n(X(LD[1])-X(mid))}" height="3.2" fill="{BRASS}"/>')
    hx, hy = X(SD[1]), Y(ymid); r = S * (SD[1] - SD[0])
    o.append(f'<path d="M{n(hx)} {n(hy)} V{n(hy-r)}" stroke="{BRASS}" stroke-width="1.8" fill="none"/>'
             f'<path d="M{n(hx-r)} {n(hy)} A{n(r)} {n(r)} 0 0 1 {n(hx)} {n(hy-r)}" stroke="{BRASS}" stroke-width=".8" fill="none" stroke-dasharray="3 2"/>')
    o.append(f'<path d="M{n(X(BX0))} {n(Y(LOBBY_Y0))} V{n(Y(run0))} M{n(X(BX1))} {n(Y(LOBBY_Y0))} V{n(Y(run0))}" stroke="#6b645a" stroke-width="1" fill="none"/>')
    # labels
    lx = X((X_LIFT[0] + X_LIFT[1]) / 2)
    o.append(text(lx, Y(Y_LIFT[0]) + 22, 'LIFT', 'pd-t pd-b', anchor='middle'))
    o.append(text(lx, Y(Y_LIFT[0]) + 33, '8 persons', 'pd-s', anchor='middle').replace('class="pd-s"', 'class="pd-s" style="font-size:8.5px"'))
    ex = X((X_FLIGHT_E[0] + X_FLIGHT_E[1]) / 2); wx = X((X_FLIGHT_W[0] + X_FLIGHT_W[1]) / 2)
    o.append(f'<path d="M{n(ex)} {n(Y(run0)+7)} V{n(Y(LAND_Y0)-5)}" stroke="{INK}" stroke-width="1.2" fill="none" marker-end="url(#pdai)"/>'
             f'<circle cx="{n(ex)}" cy="{n(Y(run0)+7)}" r="2.2" fill="{INK}"/>'
             f'<path d="M{n(wx)} {n(Y(LAND_Y0)-7)} V{n(Y(run0)+5)}" stroke="{INK}" stroke-width="1.2" fill="none" marker-end="url(#pdai)"/>')
    o.append(text(ex, Y(run0) - 5, 'UP', 'pd-s pd-b', anchor='middle'))
    cx = X((BX0 + BX1) / 2)
    o.append(text(cx, Y(LOBBY_Y0) + 17, 'LOBBY', 'pd-c pd-b', anchor='middle').replace('class="pd-c pd-b"', 'class="pd-c pd-b" style="font-size:9px;fill:#231f1b"'))
    return '\n'.join(o)


def svg(inner, label):
    return (f'<svg viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="{label}" xmlns="http://www.w3.org/2000/svg">'
            f'{STYLE}{DEFS}{inner}</svg>')


# ───────────────────────────────────────────────────────────── parking level
def parking():
    a = area_stats(); o = [road()]
    o.append(rect(0, 0, PLOT_W, PLOT_L, style='fill:#f0eadb'))
    o.append(rect(XA_OUT, R1, XC_OUT, R7, style=f'fill:{INK};opacity:.07'))
    o.append(rect(XA_OUT, R1, XC_OUT, R7, style='fill:none;stroke:#6b645a;stroke-width:.9;stroke-dasharray:5 3'))
    o.append(grid_bubbles(Y(R7) + 26))
    # boundary walls W, E, S only
    o.append(f'<path d="M{n(X(0))} {n(Y(0))} V{n(Y(PLOT_L))} H{n(X(PLOT_W))} V{n(Y(0))}" stroke="#2e2c29" stroke-width="6" fill="none"/>')
    o.append(f'<rect x="{n(X(0)-5)}" y="{n(Y(0)-5)}" width="10" height="10" class="pd-col"/><rect x="{n(X(PLOT_W)-5)}" y="{n(Y(0)-5)}" width="10" height="10" class="pd-col"/>')
    # open frontage
    o.append(f'<path d="M{n(X(0)+6)} {n(Y(0))} H{n(X(PLOT_W)-6)}" stroke="{BRASS}" stroke-width="1.8" stroke-dasharray="10 5" fill="none"/>')
    for fx in (0.22, 0.5, 0.78):
        xx = X(PLOT_W * fx)
        o.append(f'<path d="M{n(xx)} {n(MT-16)} V{n(Y(7))}" stroke="{BRASS}" stroke-width="2.2" fill="none" marker-end="url(#pdab)"/>')
    cx = X(PLOT_W / 2)
    o.append(text(cx, Y(9.6), 'OPEN FRONTAGE · DIRECT ENTRY FROM ROAD', 'pd-c pd-b', anchor='middle').replace('class="pd-c pd-b"', f'class="pd-c pd-b" style="fill:#7a5818"'))
    o.append(text(cx, Y(11.6), 'No gate, no wall', 'pd-s', anchor='middle'))
    # titles + area
    zx = X((XA_OUT + 28.0) / 2 + 3.2)
    o.append(text(zx, Y(R1) + 56, 'Parking level', 'pd-d', anchor='middle').replace('class="pd-d"', 'class="pd-d" style="font-size:30px"'))
    o.append(text(zx, Y(R1) + 76, 'Open ground level · 9′-6″ floor to floor', 'pd-s', anchor='middle'))
    ax = X(22.75)
    o.append(text(ax, Y(88.4), fa(a['zone']), 'pd-d', anchor='middle').replace('class="pd-d"', 'class="pd-d" style="font-size:38px"'))
    o.append(text(ax, Y(88.4) + 20, 'SQ FT · STRUCTURE ZONE', 'pd-c pd-b', anchor='middle').replace('class="pd-c pd-b"', 'class="pd-c pd-b" style="fill:#231f1b"'))
    o.append(text(ax, Y(88.4) + 36, '35′-6″ × 84′-6″ to outer face of columns', 'pd-s', anchor='middle'))
    o.append(text(ax, Y(88.4) + 50, f'open area excluding lift and stair bay {fa(a["zone_net"])} sq ft', 'pd-s', anchor='middle'))
    o.append(bay('stilt'))
    # entries
    ey = Y(51.4)
    o.append(f'<path d="M{n(X(17.6))} {n(ey)} H{n(X(BX0)-3)}" stroke="{TEAL}" stroke-width="2.2" stroke-linecap="round" fill="none" marker-end="url(#pdag)"/>')
    o.append(text(X(17.6), ey - 8, 'WEST ENTRY', 'pd-c pd-b').replace('class="pd-c pd-b"', f'class="pd-c pd-b" style="fill:{TEAL}"'))
    wx = X(45.6)
    o.append(f'<path d="M{n(wx)} {n(Y(0)+10)} V{n(ey)} H{n(X(BX1)+3)}" stroke="{TEAL}" stroke-width="2.2" stroke-dasharray="1.5 6" stroke-linecap="round" fill="none" marker-end="url(#pdag)"/>')
    o.append(text(wx - 7, Y(22), 'WALKWAY TO LIFT AND STAIR', 'pd-c pd-b', rot=-90, anchor='middle').replace('class="pd-c pd-b"', f'class="pd-c pd-b" style="font-size:8px;fill:{TEAL}"'))
    o.append(text(X(PLOT_W) - 5, ey + 17, 'EAST ENTRY', 'pd-c pd-b', anchor='end').replace('class="pd-c pd-b"', f'class="pd-c pd-b" style="font-size:8.5px;fill:{TEAL}"'))
    for k, c in COLS.items():
        o.append(rect(*c, cls='pd-col'))
    # dimensions
    yb = Y(R7) + 56
    o.append(f'<path d="M{n(X(XA_OUT))} {n(Y(R7)+34)} V{n(yb+4)} M{n(X(XC_OUT))} {n(Y(R7)+34)} V{n(yb+4)}" class="pd-ext"/>')
    o.append(hdim(yb, X(XA_OUT), X(XC_OUT), '35′-6″ column line'))
    xl = X(0) - 14
    o.append(f'<path d="M{n(X(0)-3)} {n(Y(R1))} H{n(xl-4)} M{n(X(0)-3)} {n(Y(R7))} H{n(xl-4)}" class="pd-ext"/>')
    o.append(vdim(xl, Y(R1), Y(R7), '84′-6″'))
    o.append(north_and_scale())
    return svg('\n'.join(o), 'Parking-level plan of SHRINEVA, north up. Open ground level with a fully open frontage on the road, a structure zone of 2,999.75 sq ft between column rows 1 and 7, and the lift and stair bay on the east side between rows 3 and 5.')


# ───────────────────────────────────────────────────────────── typical floor
def typical():
    a = area_stats(); o = [road()]
    o.append(rect(0, 0, PLOT_W, PLOT_L, style='fill:#f0eadb;opacity:.55'))
    o.append(f'<path d="M{n(X(0))} {n(Y(0))} V{n(Y(PLOT_L))} H{n(X(PLOT_W))} V{n(Y(0))}" stroke="#b9b09b" stroke-width="1" stroke-dasharray="6 4" fill="none"/>')
    pts = list(PLATE_C.exterior.coords)[:-1]
    d = 'M' + ' L'.join(f'{n(X(x))} {n(Y(y))}' for x, y in pts) + ' Z'
    o.append(f'<path d="{d}" fill="#fbf7ec"/>')
    o.append(rect(P_W, P_N, P_E, R1, style='fill:#fdfbf4'))
    o.append(grid_bubbles(Y(P_S) + 22))
    o.append(bay('first'))
    for w in walls_env:
        o.append(rect(*w.bounds, cls='pd-wall'))
    # windows on the west and east walls
    def win(x_wall0, yc):
        return (f'<rect x="{n(X(x_wall0)+1.2)}" y="{n(Y(yc-3))}" width="{n(S*WALL-2.4)}" height="{n(S*6)}" fill="#fff" stroke="{INK}" stroke-width=".7"/>')
    for i in range(6):
        o.append(win(P_W, (R[i] + R[i + 1]) / 2))
    for yc in (20.3, 30.0, 39.7, 76.2, 85.8, 95.4):
        o.append(win(P_E - WALL, yc))
    # glass line (front projection) and returns
    gl = 'fill="#d7e9e6" stroke="#2d6a62" stroke-width=".8"'
    for g in [glass_n] + glass_rets:
        x0, y0, x1, y1 = g.bounds
        o.append(f'<rect x="{n(X(x0))}" y="{n(Y(y0))}" width="{n(S*(x1-x0))}" height="{n(S*(y1-y0))}" {gl}/>')
    cxp = X((P_W + P_E) / 2)
    o.append(text(cxp, Y(P_N) + 30, 'GLASS FRONT · FACES THE ROAD', 'pd-c pd-b', anchor='middle').replace('class="pd-c pd-b"', 'class="pd-c pd-b" style="fill:#2d6a62"'))
    for dx in (-0.28, 0, 0.28):
        o.append(f'<path d="M{n(cxp + dx*S*P_E*0.8)} {n(MT-16)} V{n(Y(P_N)-4)}" stroke="{BRASS}" stroke-width="1.8" stroke-dasharray="1.5 5" stroke-linecap="round" fill="none" marker-end="url(#pdab)"/>')
    # recess label
    o.append(text(X(XC_OUT + 2.3), Y(57.5), 'RECESS · OPEN TO SKY', 'pd-c', rot=-90, anchor='middle').replace('class="pd-c"', 'class="pd-c" style="font-size:8px"'))
    # titles and area
    tx = X(18.6)
    o.append(text(tx, Y(24.8), 'Floors 1 – 3', 'pd-d', anchor='middle').replace('class="pd-d"', 'class="pd-d" style="font-size:30px"'))
    o.append(text(tx, Y(24.8) + 20, 'OPEN FLOOR PLATE', 'pd-c pd-b', anchor='middle').replace('class="pd-c pd-b"', 'class="pd-c pd-b" style="fill:#231f1b"'))
    o.append(text(tx, Y(24.8) + 36, 'One whole floor · divide as required', 'pd-s', anchor='middle'))
    ax = X(21.5)
    o.append(text(ax, Y(91.5), fa(a['plate']), 'pd-d', anchor='middle').replace('class="pd-d"', 'class="pd-d" style="font-size:38px"'))
    o.append(text(ax, Y(91.5) + 20, 'SQ FT · FLOOR AREA', 'pd-c pd-b', anchor='middle').replace('class="pd-c pd-b"', 'class="pd-c pd-b" style="fill:#231f1b"'))
    o.append(text(ax, Y(91.5) + 36, f'{fa(a["sqm"]["plate"])} sq m · 40′-6″ × 89′-6″ less east recess', 'pd-s', anchor='middle'))
    o.append(text(ax, Y(91.5) + 50, f'carpet area {fa(a["carpet"])} sq ft ({fa(a["sqm"]["carpet"])} sq m)', 'pd-s', anchor='middle'))
    # floor entry
    fy = Y(51.4)
    o.append(f'<path d="M{n(X(BX0)-3)} {n(fy)} H{n(X(17.8))}" stroke="{TEAL}" stroke-width="2.2" stroke-linecap="round" fill="none" marker-end="url(#pdag)"/>')
    o.append(text(X(17.8), fy - 8, 'FLOOR ENTRY', 'pd-c pd-b').replace('class="pd-c pd-b"', f'class="pd-c pd-b" style="fill:{TEAL}"'))
    for k, c in COLS.items():
        o.append(rect(*c, cls='pd-col'))
    # dimensions
    yb = Y(P_S) + 46
    o.append(f'<path d="M{n(X(P_W))} {n(Y(P_S)+30)} V{n(yb+4)} M{n(X(P_E))} {n(Y(P_S)+30)} V{n(yb+4)}" class="pd-ext"/>')
    o.append(hdim(yb, X(P_W), X(P_E), '40′-6″ floor width'))
    xl = X(0) - 14
    o.append(f'<path d="M{n(X(P_W)-3)} {n(Y(R1))} H{n(xl-4)} M{n(X(P_W)-3)} {n(Y(P_S))} H{n(xl-4)}" class="pd-ext"/>')
    o.append(vdim(xl, Y(R1), Y(P_S), '89′-6″ floor length'))
    o.append(north_and_scale())
    return svg('\n'.join(o), 'Typical floor plan of SHRINEVA for floors 1 to 3, north up. One open floor plate of 3,519.75 sq ft with a glass front facing the road, the lift and stair bay on the east side and a four foot recess open to the sky beside it.')


def main():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'app', 'config', 'plan-drawings.ts')
    ts = ('/* GENERATED by scripts/plans/gen_web_plans.py from the architect\'s dimensions. Do not edit by hand. */\n'
          f'export const PLAN_VIEWBOX = {{ w: {W}, h: {H} }};\n'
          f'export const PLAN_PARKING_SVG = {parking()!r};\n'
          f'export const PLAN_TYPICAL_SVG = {typical()!r};\n')
    # python repr uses single quotes with escapes that are valid in TS
    open(out, 'w').write(ts)
    print('wrote', os.path.normpath(out), len(ts), 'bytes', 'viewBox', W, H)
    # standalone SVGs for quick visual QA
    qa = os.environ.get('PLAN_QA_DIR')
    if qa:
        os.makedirs(qa, exist_ok=True)
        for nm, fn in (('parking', parking), ('typical', typical)):
            s = fn().replace('var(--font-sans)', "Manrope, 'Segoe UI', sans-serif").replace('var(--font-display)', 'Georgia, serif').replace('var(--font-mono)', 'monospace')
            open(os.path.join(qa, nm + '.svg'), 'w').write(s)


if __name__ == '__main__':
    main()
