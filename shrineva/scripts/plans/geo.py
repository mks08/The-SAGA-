"""Single source of truth for SHRINEVA plan geometry (feet; x east, y south, origin = plot NW corner)."""
from fractions import Fraction as Fr
from shapely.geometry import box, Polygon
from shapely.ops import unary_union

def ft(f,i=0,n=1): return float(Fr(f)+Fr(i,12)+Fr(0)) if n==1 else None
def fi(feet, inch=0, frac=(0,1)):
    return float(feet + (inch + frac[0]/frac[1])/12.0)

PLOT_W = fi(49,5,(1,2)); PLOT_L = fi(115,6,(1,2))
# column rows R1..R7 (reference faces/centres from CAD chain 15'-8" | 14'-1.5" | 14'-4.5" | 15'-3" | 11'-6" | 15'-9" | 13'-6" | 15'-4.5")
R1 = fi(15,8)
ROW_DIMS = [fi(14,1,(1,2)), fi(14,4,(1,2)), fi(15,3), fi(11,6), fi(15,9), fi(13,6)]
R=[R1]
for d in ROW_DIMS: R.append(R[-1]+d)
R1,R2,R3,R4,R5,R6,R7 = R
XA_OUT = 5.0                 # west column outer face (5' setback)
XC_OUT = XA_OUT + fi(35,6)   # east column outer face 40.5
assert abs(R7-(R1+fi(84,6)))<1e-9

# ---- stair / lift bay -------------------------------------------------
WALL = 0.75
BAY_W = fi(12,9); BAY_L = fi(27,9)
BX1 = XC_OUT; BX0 = BX1-BAY_W                 # 40.5 / 27.75
BY0 = 43.0 + 8/12.0                          # 43.667 (north outer face)
BY1 = BY0 + BAY_L                            # 71.417
LIFT_CLR_X = fi(6,1,(1,2)); LIFT_CLR_Y = fi(5,5)
SERV_CLR_X = fi(4,4,(1,2))
assert abs(WALL+SERV_CLR_X+WALL+LIFT_CLR_X+WALL-BAY_W)<1e-9, 'bay width does not close'
X_WALL_W = (BX0, BX0+WALL); X_WALL_E = (BX1-WALL, BX1)
X_SERV = (BX0+WALL, BX0+WALL+SERV_CLR_X)
X_PART = (X_SERV[1], X_SERV[1]+WALL)
X_LIFT = (X_PART[1], X_PART[1]+LIFT_CLR_X)
assert abs(X_LIFT[1]-X_WALL_E[0])<1e-9
Y_NWALL = (BY0, BY0+WALL)
Y_LIFT = (Y_NWALL[1], Y_NWALL[1]+LIFT_CLR_Y)
Y_FWALL = (Y_LIFT[1], Y_LIFT[1]+WALL)         # lift/services front wall
LOBBY_Y0 = Y_FWALL[1]                          # 50.583
LAND = 5.0
Y_SWALL = (BY1-WALL, BY1)
LAND_Y1 = Y_SWALL[0]                           # 70.667
LAND_Y0 = LAND_Y1-LAND                         # 65.667 (run end)
FL_W = fi(5,3)
X_FLIGHT_W = (X_WALL_W[1], X_WALL_W[1]+FL_W)
X_WELL = (X_FLIGHT_W[1], X_FLIGHT_W[1]+0.75)
X_FLIGHT_E = (X_WELL[1], X_WELL[1]+FL_W)
assert abs(X_FLIGHT_E[1]-X_WALL_E[0])<1e-9
TREAD = 11/12.0
STAIR = {
 'stilt': dict(treads=8,  lobby=fi(7,9), run=fi(7,4),  risers=19, label_e=list(range(2,10)),  label_land='10', label_w=list(range(11,19)), first='1',  last='19'),
 'first': dict(treads=11, lobby=fi(5,0), run=fi(10,1), risers=24, label_e=list(range(1,12)),  label_land='12', label_w=list(range(13,24)), first=None, last='24'),
}
for k,s in STAIR.items():
    s['run0']=LAND_Y0-s['run']
    assert abs(s['run']-s['treads']*TREAD)<1e-9
    assert abs(s['run0']-(LOBBY_Y0+s['lobby']))<1e-9, (k,s['run0'],LOBBY_Y0+s['lobby'])

# ---- columns (x0,y0,x1,y1) ----------------------------------------------
def colA(r,y):
    if r==1: return (XA_OUT, R1, XA_OUT+fi(1,4), R1+2.0)
    if r==7: return (XA_OUT, R7-1.0, XA_OUT+2.0, R7)
    return (XA_OUT, y-0.5, XA_OUT+2.0, y+0.5)
COLS = {}
for i,y in enumerate(R, start=1): COLS['A%d'%i]=colA(i,y)
COLS['B1']=(28.0-0.65, R1, 28.0+0.65, R1+2.3)
COLS['B7']=(28.0-0.65, R7-2.3, 28.0+0.65, R7)
COLS['C1']=(XC_OUT-1.0, R1, XC_OUT, R1+2.0)
COLS['C7']=(XC_OUT-1.0, R7-2.0, XC_OUT, R7)
# bay columns, positions read from the CAD detail (see notes)
COLS['CbN'] = (XC_OUT-1.0, 42.0+4/12, XC_OUT, 44.0+4/12)
COLS['CbS'] = (XC_OUT-1.0, 70.0+8/12, XC_OUT, 72.0+8/12)
COLS['BbN'] = (27.375, 42.875, X_SERV[0], 45.083)
COLS['BbS'] = (27.375, 69.167, X_SERV[0], BY1)
COLS['BbM'] = (27.375, 57.333, X_SERV[0], 59.417)
COLS['CbM'] = (39.75, 57.667, XC_OUT, 59.083)
COLS['CbL'] = (39.75, 49.25, XC_OUT, LOBBY_Y0)
COLS['PbF'] = (32.833, 49.25, 33.667, LOBBY_Y0)
COLS['PbB'] = (32.833, BY0, 33.667, 45.0)

# ---- first-floor plate ----------------------------------------------------
P_W = XA_OUT-1.0; P_E = XC_OUT+4.0               # 4.0 / 44.5
P_N = R1-5.0; P_S = R7+5.0                       # 10.667 / 105.167
NOTCH_Y0 = Y_NWALL[1]; NOTCH_Y1 = Y_SWALL[0]    # jog walls coincide with the bay's N and S walls
PLATE = Polygon([(P_W,P_N),(P_E,P_N),(P_E,NOTCH_Y0),(BX1,NOTCH_Y0),(BX1,NOTCH_Y1),(P_E,NOTCH_Y1),(P_E,P_S),(P_W,P_S)])
GLASS=fi(0,4)
# counted floor area starts at the first column row: the 5 ft front (north) projection is a glass line and is NOT counted
PLATE_C = Polygon([(P_W,R1),(P_E,R1),(P_E,NOTCH_Y0),(BX1,NOTCH_Y0),(BX1,NOTCH_Y1),(P_E,NOTCH_Y1),(P_E,P_S),(P_W,P_S)])
NORTH_STRIP = box(P_W,P_N,P_E,R1)
glass_n = box(P_W,P_N,P_E,P_N+GLASS)
glass_rets = [box(P_W,P_N,P_W+GLASS,R1), box(P_E-GLASS,P_N,P_E,R1)]   # glazed returns of the front projection only
# 9" walls: west, east (broken by the bay recess) and the rear (south) edge, rear 5 ft projection included
walls_env = [box(P_W,R1,P_W+WALL,P_S),
             box(P_E-WALL,R1,P_E,BY0+WALL),
             box(P_E-WALL,BY1-WALL,P_E,P_S),
             box(BX1,BY0,P_E-WALL,BY0+WALL), box(BX1,BY1-WALL,P_E-WALL,BY1),
             box(P_W+WALL,P_S-WALL,P_E-WALL,P_S)]
BAY = box(BX0,BY0,BX1,BY1)
RING = unary_union(walls_env).difference(BAY).intersection(PLATE_C)
ZONE = box(XA_OUT, R1, XC_OUT, R7)

SQM = 0.09290304
def area_stats():
    a={}
    a['plate']=PLATE_C.area
    a['plate_full']=PLATE.area
    a['north']=NORTH_STRIP.area
    a['bay']=BAY.area
    a['ring']=RING.area
    a['carpet']=PLATE_C.area-BAY.area-a['ring']
    a['zone']=ZONE.area
    a['zone_net']=ZONE.area-BAY.area
    a['lift_clear']=LIFT_CLR_X*LIFT_CLR_Y
    a['plate_w']=P_E-P_W; a['plate_l']=P_S-R1; a['plate_l_full']=P_S-P_N
    a['notch']=(P_E-BX1)*(NOTCH_Y1-NOTCH_Y0)
    a['sqm']={k:(v*SQM) for k,v in a.items() if k in('plate','bay','ring','carpet','zone','zone_net','lift_clear')}
    return a
if __name__=='__main__':
    a=area_stats()
    for k,v in a.items(): print(k,v)
    print('rows',[round(r,4) for r in R])
    print('bay',BX0,BX1,BY0,BY1,'lobby0',LOBBY_Y0,'run0 stilt',STAIR['stilt']['run0'],'first',STAIR['first']['run0'],'run1',LAND_Y0,'land1',LAND_Y1)
    print('setbacks plate: W',P_W,'E',PLOT_W-P_E,'N',P_N,'S',PLOT_L-P_S)
    print('B west face to plate west edge', COLS['BbN'][0]-P_W, ' (CAD 23\'-4.5\" = %.4f)'%fi(23,4,(1,2)))
