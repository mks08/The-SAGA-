import {
  ACESFilmicToneMapping, DirectionalLight, Group, HemisphereLight, Mesh, MeshBasicMaterial, PCFSoftShadowMap, PerspectiveCamera,
  PMREMGenerator, Plane, Raycaster, RingGeometry, Scene, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BUILDING, LEVELS, LevelId, Preset, TOUR, TourStop, TimeOfDay, WAYPOINTS,
} from '../../config/building.config';
import { buildPreset } from './furniture';
import { Mats } from './materials';
import { BuildingModel, buildBuilding, ftX, ftZ, wx, wz } from './model';
import { LabelDef, World } from './world';

export type Mode = 'outside' | 'inside';

export interface EngineState {
  mode: Mode;
  level: LevelId | null;
  explode: boolean;
  time: TimeOfDay;
  preset: Preset;
  touring: boolean;
  tourIndex: number;
}

export interface Pose { mode: Mode; level: LevelId | null; x: number; z: number; yaw: number }

export interface EngineHooks {
  onState(s: EngineState): void;
  onPose(p: Pose): void;
  onTour(stop: TourStop | null, index: number, total: number): void;
}

export interface EngineOptions {
  host: HTMLElement;
  reduceMotion: boolean;
  lowPower: boolean;
  hooks: EngineHooks;
  initial?: Partial<EngineState>;
}

const B = BUILDING;
const FT = B.ft;
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const damp = (k: number, dt: number): number => 1 - Math.exp(-k * dt);
const wrapAngle = (a: number): number => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const EXPLODE_GAP = 4.6;
const HIDE_LIFT = 38;

interface Orbit { theta: number; phi: number; r: number; tx: number; ty: number; tz: number }
interface Eye { x: number; z: number; y: number; yaw: number; pitch: number }

export class Engine {
  readonly state: EngineState;
  private host: HTMLElement;
  private hooks: EngineHooks;
  private reduce: boolean;
  private lowPower: boolean;

  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(40, 1, 0.1, 900);
  private mats = new Mats();
  private world: World;
  private model: BuildingModel;
  private hemi = new HemisphereLight('#ffffff', '#887766', 1);
  private sun = new DirectionalLight('#ffffff', 3);
  private pmrem: PMREMGenerator;
  private overlay: HTMLDivElement;
  private labelEls = new Map<string, HTMLDivElement>();
  private levelLabels: LabelDef[] = [];
  private hoverRing: Mesh;

  // rigs: `goal` is what input drives, `cur` is what the camera shows
  private orbitGoal: Orbit = { theta: 0.38, phi: 0.3, r: 46, tx: wx(B.plate.x0 + 20), ty: 6.8, tz: 13 };
  private orbitCur: Orbit = { ...this.orbitGoal };
  private eyeGoal: Eye = { x: 0, z: 0, y: 1.62, yaw: 0, pitch: 0 };
  private eyeCur: Eye = { ...this.eyeGoal };
  private hover = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  private camPos = new Vector3();
  private camLook = new Vector3();
  private fov = 40;
  private flight = 0;

  private pointers = new Map<number, { x: number; y: number }>();
  private down = { x: 0, y: 0, t: 0, moved: 0, id: -1 };
  private pinchDist = 0;
  private keys = new Set<string>();
  private raycaster = new Raycaster();
  private ndc = new Vector2();

  private time = 0;
  private last = 0;
  private running = false;
  private visible = true;
  /** Film capture only: drives the lift from its own clock so a shot can be timed to the car. */
  liftClock: number | null = null;
  private tourTimer = 0;
  private poseTimer = 0;
  private frameTimes: number[] = [];
  private pixelRatio = 1;
  private disposers: (() => void)[] = [];
  private immersive = false;
  private w = 1;
  private h = 1;

  constructor(o: EngineOptions) {
    this.host = o.host; this.hooks = o.hooks; this.reduce = o.reduceMotion; this.lowPower = o.lowPower;
    this.state = {
      mode: 'outside', level: null, explode: false, time: 'day', preset: 'open', touring: false, tourIndex: 0, ...o.initial,
    };

    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.lowPower ? 1.5 : 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    const cv = this.renderer.domElement;
    cv.style.cssText = 'display:block;width:100%;height:100%;outline:none;touch-action:pan-y;cursor:grab;';
    cv.setAttribute('aria-hidden', 'true');
    this.host.appendChild(cv);

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
    this.host.appendChild(this.overlay);

    // environment lighting for the glass, brass and stone
    this.pmrem = new PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.scene.environment = this.pmrem.fromScene(room, 0.04).texture;
    room.dispose();

    this.scene.add(this.hemi);
    this.sun.castShadow = true;
    const ss = this.lowPower ? 1024 : 2048;
    this.sun.shadow.mapSize.set(ss, ss);
    const sc = this.sun.shadow.camera;
    sc.left = -42; sc.right = 42; sc.top = 42; sc.bottom = -42; sc.near = 1; sc.far = 160;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.04;
    this.sun.target.position.set(0, 3, 12);
    this.scene.add(this.sun, this.sun.target);

    this.world = new World(this.mats, this.scene, this.reduce);
    this.model = buildBuilding(this.mats);
    this.model.levels.forEach((l) => { l.group.userData['level'] = l.info.id; });
    this.scene.add(this.model.root);

    this.hoverRing = new Mesh(new RingGeometry(0.28, 0.4, 28), new MeshBasicMaterial({ color: '#e8cf96', transparent: true, opacity: 0.9, depthTest: false }));
    this.hoverRing.rotation.x = -Math.PI / 2;
    this.hoverRing.renderOrder = 10;
    this.hoverRing.visible = false;
    this.scene.add(this.hoverRing);

    this.buildLabels();
    this.applyPreset(this.state.preset);
    this.applyTime(this.state.time);
    this.resize();
    this.initFromState();
    this.bind();
    this.camPos.copy(this.desiredPos());
    this.camLook.copy(this.desiredLook());
    this.fov = this.desiredFov();
    this.camera.fov = this.fov;
    this.renderFrame();
    this.emitState();
  }

  /* ── public API ─────────────────────────────────────────────────────────── */

  start(): void {
    if (this.running || !this.visible) return;
    this.running = true;
    this.last = performance.now();
    this.renderer.setAnimationLoop((t) => this.loop(t));
  }

  pause(): void {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  setVisible(v: boolean): void {
    this.visible = v;
    if (v) this.start(); else this.pause();
  }

  /** Make the canvas use the whole gesture area (full screen), or leave vertical swipes to the page. */
  setImmersive(on: boolean): void {
    this.immersive = on;
    this.renderer.domElement.style.touchAction = on ? 'none' : 'pan-y';
    this.resize();
  }

  setMode(mode: Mode, level?: LevelId | null): void {
    this.stopTour();
    this.changeMode(mode, level);
  }

  setLevel(level: LevelId | null): void {
    this.stopTour();
    if (this.state.mode === 'inside') {
      if (level === null) return;
      this.goInside(level, true);
    } else {
      this.state.level = level;
      this.frameLevel();
      this.applyLevelState();
      this.emitState();
    }
  }

  setExplode(on: boolean): void {
    this.stopTour();
    this.state.explode = on && this.state.mode === 'outside';
    if (this.state.explode) { this.orbitGoal.phi = Math.max(this.orbitGoal.phi, 0.3); this.orbitGoal.r = Math.max(this.orbitGoal.r, 62); this.orbitGoal.ty = 11; }
    else this.frameLevel();
    this.applyLevelState();
    this.emitState();
  }

  setTime(t: TimeOfDay): void { this.state.time = t; this.applyTime(t); this.emitState(); }

  setPreset(p: Preset): void { this.state.preset = p; this.applyPreset(p); this.emitState(); }

  /** Jump to a named spot on the current floor. */
  goTo(id: string): void {
    this.stopTour();
    const wp = WAYPOINTS.find((w) => w.id === id);
    if (!wp) return;
    if (this.state.mode !== 'inside') { this.changeMode('inside', wp.levels[0]); }
    const lvl = this.state.level ?? 1;
    const lv = wp.levels.includes(lvl as LevelId) ? lvl : wp.levels[0];
    if (lv !== this.state.level) this.goInside(lv as LevelId, false);
    this.flight = 1.2;
    this.setEye(wp.eye.x, wp.eye.z, wp.eye.yaw, 0);
  }

  /** Walk to a point on the plan (plot feet). */
  walkTo(xft: number, zft: number): void {
    if (this.state.mode !== 'inside' || this.state.level === null) return;
    this.stopTour();
    const [x, z] = this.walkable(xft, zft, this.state.level);
    this.eyeGoal.x = wx(x); this.eyeGoal.z = wz(z);
  }

  zoom(dir: 1 | -1): void {
    this.stopTour();
    if (this.state.mode === 'outside') this.orbitGoal.r = clamp(this.orbitGoal.r * (dir > 0 ? 0.85 : 1.18), 14, 120);
  }

  turn(dir: 1 | -1): void {
    this.stopTour();
    if (this.state.mode === 'outside') this.orbitGoal.theta += dir * 0.35;
    else this.eyeGoal.yaw += dir * 0.4;
  }

  resetView(): void {
    this.stopTour();
    if (this.state.mode === 'outside') {
      this.state.level = null; this.state.explode = false;
      this.orbitGoal = { theta: 0.38, phi: 0.3, r: 46, tx: wx(B.plate.x0 + 20), ty: 6.8, tz: 13 };
      this.applyLevelState();
    } else {
      this.goInside(this.state.level ?? 1, false);
    }
    this.emitState();
  }

  startTour(): void {
    this.state.touring = true;
    this.state.tourIndex = 0;
    this.state.explode = false;
    this.applyTour(0);
    this.tourTimer = 0;
    this.emitState();
  }

  nextTour(delta: 1 | -1 = 1): void {
    if (!this.state.touring) return;
    const n = TOUR.length;
    this.state.tourIndex = (this.state.tourIndex + delta + n) % n;
    this.applyTour(this.state.tourIndex);
    this.tourTimer = 0;
    this.emitState();
  }

  stopTour(): void {
    if (!this.state.touring) return;
    this.state.touring = false;
    this.hooks.onTour(null, 0, TOUR.length);
    this.emitState();
  }

  /** Step the simulation without waiting for real frames, then draw once. Used by tests and screenshots. */
  advance(seconds: number): void {
    const n = Math.max(1, Math.ceil(seconds / 0.05));
    for (let i = 0; i < n; i++) { this.time += 0.05; this.update(0.05); }
    this.renderFrame();
  }

  dispose(): void {
    this.pause();
    this.disposers.forEach((d) => d());
    this.model.dispose();
    this.world.dispose();
    this.mats.dispose();
    this.hoverRing.geometry.dispose();
    (this.hoverRing.material as MeshBasicMaterial).dispose();
    this.scene.environment?.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.overlay.remove();
  }

  /* ── state plumbing ─────────────────────────────────────────────────────── */

  private emitState(): void { this.hooks.onState({ ...this.state }); }

  private initFromState(): void {
    if (this.state.mode === 'inside') this.goInside(this.state.level ?? 1, false);
    else this.frameLevel();
    this.applyLevelState(true);
  }

  private changeMode(mode: Mode, level?: LevelId | null): void {
    if (mode === 'inside') {
      this.goInside(level ?? this.state.level ?? 1, false);
    } else {
      this.state.mode = 'outside';
      this.state.level = level ?? null;
      this.state.explode = false;
      this.frameLevel();
      this.flight = 1.8;
      this.applyLevelState();
      this.emitState();
    }
  }

  private eyeHeight(level: LevelId): number { return LEVELS[level].baseY + B.h.eye; }

  private goInside(level: LevelId, keepPosition: boolean): void {
    const prevMode = this.state.mode;
    this.state.mode = 'inside';
    this.state.level = level;
    this.state.explode = false;
    if (!keepPosition || prevMode !== 'inside') {
      if (level === 0) this.setEye(22, 9, 168 * Math.PI / 180, -0.02);
      else this.setEye(25.2, 53.4, -58 * Math.PI / 180, -0.02);
      this.flight = prevMode === 'inside' ? 0.8 : 1.8;
    } else {
      const [fx, fz] = this.walkable(ftX(this.eyeGoal.x), ftZ(this.eyeGoal.z), level);
      this.eyeGoal.x = wx(fx); this.eyeGoal.z = wz(fz);
      this.eyeGoal.y = this.eyeHeight(level);
    }
    this.applyLevelState();
    this.emitState();
  }

  private setEye(xft: number, zft: number, yaw: number, pitch: number): void {
    const lvl = (this.state.level ?? 1) as LevelId;
    const [x, z] = this.walkable(xft, zft, lvl);
    this.eyeGoal.x = wx(x); this.eyeGoal.z = wz(z);
    this.eyeGoal.y = this.eyeHeight(lvl);
    this.eyeGoal.yaw = yaw; this.eyeGoal.pitch = pitch;
    if (this.reduce) { this.eyeCur = { ...this.eyeGoal }; }
  }

  /** Orbit target and distance that frame the whole building, or a single level opened from above. */
  private frameLevel(): void {
    const g = this.orbitGoal;
    const lvl = this.state.level;
    g.tx = wx(B.plate.x0 + 20); g.tz = 13;
    const portrait = this.camera.aspect < 0.85;
    if (lvl === null) { g.ty = 6.8; g.r = clamp(g.r, 40, 60) * (portrait && g.r < 56 ? 1.3 : 1); g.phi = Math.min(g.phi, 0.7); }
    else { g.ty = LEVELS[lvl].baseY + 0.5; g.phi = 0.78; g.r = portrait ? 70 : 52; g.tz = 16; }
  }

  private applyLevelState(immediate = false): void {
    const { mode, level, explode } = this.state;
    this.model.levels.forEach((l, i) => {
      const hide = mode === 'outside' && level !== null && i > level;
      l.target = (explode ? i * EXPLODE_GAP : 0) + (hide ? HIDE_LIFT : 0);
      if (immediate || this.reduce) { l.offset = l.target; this.placeLevel(l); }
      l.ceiling.visible = !(mode === 'outside' && level === i);
    });
    this.model.roof.visible = !(mode === 'outside' && level !== null);
  }

  private placeLevel(l: { group: Group; offset: number; target: number }): void {
    l.group.position.y = l.offset;
    l.group.visible = l.offset < HIDE_LIFT - 1 || l.target < HIDE_LIFT - 1;
  }

  private applyPreset(p: Preset): void {
    for (const l of this.model.levels) {
      l.furniture.traverse((o) => { (o as Mesh).geometry?.dispose(); });
      l.furniture.clear();
      if (l.info.id === 0) continue;
      l.furniture.add(buildPreset(p, l.info.baseY, this.mats));
    }
  }

  private applyTime(key: TimeOfDay): void {
    const t = this.world.setTime(key);
    this.hemi.color.set(t.hemi.sky); this.hemi.groundColor.set(t.hemi.ground); this.hemi.intensity = t.hemi.intensity;
    this.sun.color.set(t.sun.color); this.sun.intensity = t.sun.intensity;
    this.sun.position.set(t.sun.pos[0], t.sun.pos[1] + 3, t.sun.pos[2] + 12);
    this.renderer.toneMappingExposure = t.exposure;
    for (const m of this.mats.all()) m.envMapIntensity = t.env;
    this.mats.glass.emissiveIntensity = t.glassGlow;
    this.mats.strip.emissiveIntensity = t.strips;
    this.mats.plaqueGlow.emissiveIntensity = t.plaque;
    this.mats.sign.emissiveIntensity = t.plaque * 0.5;
    this.mats.glowWarm.emissiveIntensity = 0.35 + t.lamps * 1.0;
    this.mats.lampGlow.emissiveIntensity = 0.5 + t.lamps * 2.2;
    this.mats.ghat.emissiveIntensity = 0.04 + t.lamps * 0.3;
    this.mats.liftSign.emissiveIntensity = 0.4 + t.plaque * 0.8;
    this.mats.waterfall.emissiveIntensity = 0.3 + t.lamps * 0.9;
    this.mats.basin.emissiveIntensity = 0.22 + t.lamps * 0.8;
    this.mats.cabinLight.emissiveIntensity = 0.6 + t.lamps * 1.2;
    for (const lm of [this.mats.wallLeaf, this.mats.wallLeafDark, this.mats.wallLeafLight]) lm.emissiveIntensity = 0.12 + t.lamps * 0.5;
    this.mats.stairSign.emissiveIntensity = 0.4 + t.plaque * 0.8;
    this.model.accent.forEach((l) => { l.intensity = 0.5 + t.lamps * 6.5; });
    this.model.levels.forEach((l) => { l.light.intensity = t.interiorLight * (l.info.id === 0 ? 0.6 : 1); });
  }

  /* ── tour ───────────────────────────────────────────────────────────────── */

  private applyTour(i: number): void {
    const s = TOUR[i];
    this.flight = 2.4;
    this.state.mode = s.mode;
    this.state.level = s.level;
    this.state.explode = false;
    if (s.mode === 'outside' && s.orbit) {
      this.state.level = null;
      this.orbitGoal.theta = s.orbit.theta; this.orbitGoal.phi = s.orbit.phi; this.orbitGoal.r = s.orbit.r;
      this.orbitGoal.tx = wx(B.plate.x0 + 20); this.orbitGoal.ty = s.orbit.phi < 0.2 ? 5.5 : 6.8; this.orbitGoal.tz = 13;
    } else if (s.eye) {
      this.setEye(s.eye.x, s.eye.z, s.eye.yaw, s.eye.pitch ?? 0);
    }
    this.applyLevelState();
    this.hooks.onTour(s, i, TOUR.length);
  }

  /* ── walking ────────────────────────────────────────────────────────────── */

  /** Keep a walking position (plot feet) on the floor: inside the plate, out of the lift and stair bay except the lobby, round the columns. */
  private walkable(xf: number, zf: number, level: LevelId): [number, number] {
    let x = xf, z = zf;
    const bay = B.bay, lb = B.lobby;
    if (level === 0) { x = clamp(x, 1.0, B.plot.w - 1.0); z = clamp(z, 1.2, B.plot.d - 1.2); }
    else { x = clamp(x, 5.4, 43.4); z = clamp(z, B.plate.zGlass + 1.4, B.plate.z1 - 1.1); }

    const pad = 1.0;
    const eastSolid = level === 0 ? bay.x1 + pad : bay.x1 + 0.2;
    if (x > bay.x0 - pad && x < eastSolid && z > bay.z0 - pad && z < bay.z1 + pad) {
      const inLobbyZ = z > lb.z0 + 0.7 && z < lb.z1 - 0.7;
      const inLobbyX = x > bay.x0 - pad - 0.1 && x < bay.x1 + (level === 0 ? pad : -0.9);
      if (!(inLobbyZ && inLobbyX)) {
        // push out through the nearest free edge
        const toW = x - (bay.x0 - pad), toE = eastSolid - x, toN = z - (bay.z0 - pad), toS = bay.z1 + pad - z;
        const lim = level === 0 ? Math.min(toW, toE, toN, toS) : Math.min(toW, toN, toS);
        if (lim === toW) x = bay.x0 - pad;
        else if (level === 0 && lim === toE) x = eastSolid;
        else if (lim === toN) z = bay.z0 - pad;
        else z = bay.z1 + pad;
      }
    }
    // the east recess is open air: stay out of it
    if (level > 0 && x > B.recess.x0 - 0.5 && z > B.recess.z0 - 0.5 && z < B.recess.z1 + 0.5) {
      z = Math.abs(z - B.recess.z0) < Math.abs(z - B.recess.z1) ? B.recess.z0 - 0.5 : B.recess.z1 + 0.5;
    }
    // free columns
    const cols: [number, number][] = [
      [B.cols.A, B.rows[0] + 1], [B.cols.B, B.rows[0] + 1], [B.cols.C, B.rows[0] + 1],
      [B.cols.A, B.rows[6] - 1], [B.cols.B, B.rows[6] - 1], [B.cols.C, B.rows[6] - 1],
    ];
    for (const [cx, cz] of cols) {
      const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz), r = 1.9;
      if (d < r) {
        if (d < 0.001) x = cx + r;
        else { x = cx + dx * (r / d); z = cz + dz * (r / d); }
      }
    }
    // pilasters on the west wall
    if (level > 0 && x < 7.4) for (let i = 1; i <= 5; i++) if (Math.abs(z - B.rows[i]) < 1.6) x = 7.4;
    return [x, z];
  }

  /* ── input ──────────────────────────────────────────────────────────────── */

  private bind(): void {
    const cv = this.renderer.domElement;
    const norm = (e: PointerEvent): void => {
      const r = cv.getBoundingClientRect();
      this.hover.tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      this.hover.ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
      this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };

    const pd = (e: PointerEvent): void => {
      this.stopTour();
      cv.setPointerCapture?.(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1) this.down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, id: e.pointerId };
      if (this.pointers.size === 2) this.pinchDist = this.pointerDistance();
      cv.style.cursor = 'grabbing';
      this.host.focus({ preventScroll: true });
    };
    const pm = (e: PointerEvent): void => {
      norm(e);
      if (e.pointerType === 'mouse') this.hover.active = true;
      const p = this.pointers.get(e.pointerId);
      if (!p) { this.updateHoverRing(); return; }
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (this.pointers.size === 2) {
        const d = this.pointerDistance();
        if (this.pinchDist > 0 && this.state.mode === 'outside') this.orbitGoal.r = clamp(this.orbitGoal.r * (this.pinchDist / d), 14, 120);
        this.pinchDist = d;
        return;
      }
      if (e.pointerId !== this.down.id) return;
      this.down.moved += Math.abs(dx) + Math.abs(dy);
      if (this.down.moved < 4) return;
      if (this.state.mode === 'outside') {
        this.orbitGoal.theta -= dx * 0.0062;
        this.orbitGoal.phi = clamp(this.orbitGoal.phi + dy * 0.0042, 0.03, 1.35);
      } else {
        this.eyeGoal.yaw -= dx * 0.0046;
        this.eyeGoal.pitch = clamp(this.eyeGoal.pitch + dy * 0.0036, -1.05, 1.05);
      }
    };
    const pu = (e: PointerEvent): void => {
      const wasDown = this.pointers.has(e.pointerId);
      this.pointers.delete(e.pointerId);
      cv.style.cursor = 'grab';
      if (this.pointers.size < 2) this.pinchDist = 0;
      if (!wasDown || e.pointerId !== this.down.id) return;
      const quick = performance.now() - this.down.t < 450;
      if (this.down.moved < 6 && quick) { norm(e); this.tap(); }
    };
    const pc = (e: PointerEvent): void => { this.pointers.delete(e.pointerId); cv.style.cursor = 'grab'; };
    const pl = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') { this.hover.active = false; this.hover.tx = 0; this.hover.ty = 0; this.hoverRing.visible = false; }
    };
    const wheel = (e: WheelEvent): void => {
      if (!(e.ctrlKey || e.metaKey) && !this.immersive) return;
      e.preventDefault();
      this.stopTour();
      if (this.state.mode === 'outside') this.orbitGoal.r = clamp(this.orbitGoal.r * (1 + clamp(e.deltaY, -60, 60) * 0.0025), 14, 120);
    };
    const kd = (e: KeyboardEvent): void => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q', 'e', '+', '=', '-', '_'].includes(k)) {
        e.preventDefault();
        this.stopTour();
        this.keys.add(k);
      }
    };
    const ku = (e: KeyboardEvent): void => { this.keys.delete(e.key.toLowerCase()); };
    const blur = (): void => { this.keys.clear(); };

    cv.addEventListener('pointerdown', pd);
    cv.addEventListener('pointermove', pm);
    cv.addEventListener('pointerup', pu);
    cv.addEventListener('pointercancel', pc);
    cv.addEventListener('pointerleave', pl);
    cv.addEventListener('wheel', wheel, { passive: false });
    this.host.addEventListener('keydown', kd);
    this.host.addEventListener('keyup', ku);
    this.host.addEventListener('blur', blur);
    this.disposers.push(() => {
      cv.removeEventListener('pointerdown', pd); cv.removeEventListener('pointermove', pm); cv.removeEventListener('pointerup', pu);
      cv.removeEventListener('pointercancel', pc); cv.removeEventListener('pointerleave', pl); cv.removeEventListener('wheel', wheel);
      this.host.removeEventListener('keydown', kd); this.host.removeEventListener('keyup', ku); this.host.removeEventListener('blur', blur);
    });

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.host);
    this.disposers.push(() => ro.disconnect());
    const io = new IntersectionObserver((es) => { for (const e of es) this.setVisible(e.isIntersecting && !document.hidden); }, { threshold: 0.05 });
    io.observe(this.host);
    this.disposers.push(() => io.disconnect());
    const vis = (): void => { if (document.hidden) this.pause(); else this.setVisible(true); };
    document.addEventListener('visibilitychange', vis);
    this.disposers.push(() => document.removeEventListener('visibilitychange', vis));
  }

  private pointerDistance(): number {
    const [a, b] = [...this.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  private floorPoint(): Vector3 | null {
    if (this.state.level === null) return null;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const y = LEVELS[this.state.level].baseY;
    const hit = new Vector3();
    return this.raycaster.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), -y), hit) ? hit : null;
  }

  private updateHoverRing(): void {
    if (this.state.mode !== 'inside' || !this.hover.active || this.state.level === null) { this.hoverRing.visible = false; return; }
    const p = this.floorPoint();
    if (!p || p.distanceTo(this.camera.position) > 26 || p.distanceTo(this.camera.position) < 1.2) { this.hoverRing.visible = false; return; }
    const [fx, fz] = this.walkable(ftX(p.x), ftZ(p.z), this.state.level);
    this.hoverRing.position.set(wx(fx), LEVELS[this.state.level].baseY + 0.03, wz(fz));
    this.hoverRing.visible = true;
  }

  /** A tap or click without dragging: walk there (inside) or open that floor (outside). */
  private tap(): void {
    if (this.state.mode === 'inside') {
      const p = this.floorPoint();
      if (!p || this.state.level === null) return;
      const [fx, fz] = this.walkable(ftX(p.x), ftZ(p.z), this.state.level);
      this.eyeGoal.x = wx(fx); this.eyeGoal.z = wz(fz);
      return;
    }
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.model.levels.filter((l) => l.group.visible).map((l) => l.group), true);
    for (const h of hits) {
      let o: Group | null = h.object as unknown as Group;
      while (o && o.userData['level'] === undefined) o = o.parent as Group | null;
      if (o) { this.setLevel(o.userData['level'] as LevelId); return; }
    }
  }

  /* ── labels ─────────────────────────────────────────────────────────────── */

  private buildLabels(): void {
    const defs: LabelDef[] = [...this.world.labels];
    for (const l of LEVELS) {
      this.levelLabels.push({
        id: `lvl-${l.id}`, title: l.label, pos: new Vector3(wx(B.plate.x1) + 1.8, l.baseY + 1.6, wz(24)), modes: ['outside'], kind: 'plain',
      });
    }
    defs.push(...this.levelLabels);
    defs.push(
      { id: 'lift', title: 'Lift', sub: '8 persons', pos: new Vector3(wx(36.8), 2.6, wz(48.6)), modes: ['inside'], maxDist: 22, kind: 'plain' },
      { id: 'stair', title: 'Stair', pos: new Vector3(wx(34.3), 2.6, wz(62)), modes: ['inside'], maxDist: 18, kind: 'plain' },
    );
    for (const d of defs) {
      const el = document.createElement('div');
      el.className = d.kind === 'anchor' ? 'wt-label wt-anchor' : 'wt-label';
      el.innerHTML = `<b></b>${d.sub ? '<small></small>' : ''}`;
      (el.querySelector('b') as HTMLElement).textContent = d.title;
      const sm = el.querySelector('small');
      if (sm) sm.textContent = d.sub ?? '';
      el.style.cssText = 'position:absolute;left:0;top:0;opacity:0;will-change:transform;white-space:nowrap;';
      this.overlay.appendChild(el);
      this.labelEls.set(d.id, el);
    }
    this.allLabels = defs;
  }

  private allLabels: LabelDef[] = [];

  private labelVisible(d: LabelDef): boolean {
    const { mode, level, explode } = this.state;
    if (!d.modes.includes(mode)) return false;
    if (d.id.startsWith('lvl-')) {
      const id = Number(d.id.slice(4));
      return explode || (level !== null && id === level);
    }
    if (d.id === 'trade' || d.id === 'road') return level === null && !explode;
    if (mode === 'inside' && (d.id === 'apollo' || d.id === 'nift')) return level !== null && level > 0 && this.eyeCur.z < wz(48);
    return true;
  }

  private updateLabels(): void {
    const w = this.w, h = this.h;
    const v = new Vector3();
    for (const d of this.allLabels) {
      const el = this.labelEls.get(d.id);
      if (!el) continue;
      let show = this.labelVisible(d);
      let x = 0, y = 0, arrow = '';
      if (show) {
        v.copy(d.pos);
        if (d.id.startsWith('lvl-')) {
          const lv = this.model.levels[Number(d.id.slice(4))];
          v.y += lv.offset;
        } else if (d.id === 'lift' || d.id === 'stair') {
          v.y = LEVELS[this.state.level ?? 1].baseY + 2.6;
        }
        const dist = v.distanceTo(this.camera.position);
        v.project(this.camera);
        if (v.z > 1) show = false;
        x = (v.x * 0.5 + 0.5) * w; y = (-v.y * 0.5 + 0.5) * h;
        if (d.edge) {
          if (x < 120) { x = 120; arrow = '◀ '; } else if (x > w - 120) { x = w - 120; arrow = '▶ '; }
          if (v.z > 1) { x = 120; y = h * 0.62; arrow = '◀ '; show = true; }
          y = clamp(y, 60, h - 80);
        } else if (x < -40 || x > w + 40 || y < -20 || y > h + 20) show = false;
        if (d.maxDist && dist > d.maxDist) show = false;
      }
      const b = el.firstElementChild as HTMLElement;
      if (show) {
        if (b && b.dataset['arrow'] !== arrow) { b.textContent = arrow + d.title; b.dataset['arrow'] = arrow; }
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
        el.style.opacity = '1';
      } else if (el.style.opacity !== '0') el.style.opacity = '0';
    }
  }

  /* ── frame loop ─────────────────────────────────────────────────────────── */

  private resize(): void {
    const r = this.host.getBoundingClientRect();
    this.w = Math.max(1, Math.round(r.width)); this.h = Math.max(1, Math.round(r.height));
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
  }

  private desiredFov(): number {
    const portrait = this.camera.aspect < 0.85;
    return this.state.mode === 'outside' ? (portrait ? 56 : 38) : (portrait ? 84 : 72);
  }

  private orbitPos(o: Orbit, out: Vector3): Vector3 {
    return out.set(o.tx + o.r * Math.sin(o.theta) * Math.cos(o.phi), o.ty + o.r * Math.sin(o.phi), o.tz - o.r * Math.cos(o.theta) * Math.cos(o.phi));
  }

  private desiredPos(): Vector3 {
    if (this.state.mode === 'outside') return this.orbitPos(this.orbitCur, new Vector3());
    return new Vector3(this.eyeCur.x, this.eyeCur.y, this.eyeCur.z);
  }

  private desiredLook(): Vector3 {
    if (this.state.mode === 'outside') return new Vector3(this.orbitCur.tx, this.orbitCur.ty, this.orbitCur.tz);
    const e = this.eyeCur;
    const cp = Math.cos(e.pitch);
    return new Vector3(e.x + Math.sin(e.yaw) * cp * 10, e.y + Math.sin(e.pitch) * 10, e.z - Math.cos(e.yaw) * cp * 10);
  }

  private loop(now: number): void {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    this.time += dt;
    this.update(dt);
    this.renderFrame();
    this.governor(dt);
  }

  private update(dt: number): void {
    const reduce = this.reduce;
    const s = this.state;

    // keyboard
    if (this.keys.size) {
      const k = this.keys;
      const speed = (k.has('shift') ? 3.2 : 1.8) * dt;
      if (s.mode === 'inside') {
        const e = this.eyeGoal;
        const fwd = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
        const str = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0);
        e.yaw += ((k.has('arrowright') || k.has('e') ? 1 : 0) - (k.has('arrowleft') || k.has('q') ? 1 : 0)) * 1.7 * dt;
        if (fwd || str) {
          const fx = Math.sin(e.yaw), fz = -Math.cos(e.yaw);
          const rx = Math.cos(e.yaw), rz = Math.sin(e.yaw);
          const nx = e.x + (fx * fwd + rx * str) * speed * 1.6;
          const nz = e.z + (fz * fwd + rz * str) * speed * 1.6;
          const [wxF, wzF] = this.walkable(ftX(nx), ftZ(nz), (s.level ?? 1) as LevelId);
          e.x = wx(wxF); e.z = wz(wzF);
        }
      } else {
        const o = this.orbitGoal;
        o.theta += ((k.has('arrowright') || k.has('d') || k.has('e') ? 1 : 0) - (k.has('arrowleft') || k.has('a') || k.has('q') ? 1 : 0)) * 1.1 * dt;
        o.phi = clamp(o.phi + ((k.has('arrowdown') || k.has('s') ? 1 : 0) - (k.has('arrowup') || k.has('w') ? 1 : 0)) * 0.8 * dt, 0.03, 1.35);
        if (k.has('+') || k.has('=')) o.r = clamp(o.r * (1 - 0.9 * dt), 14, 120);
        if (k.has('-') || k.has('_')) o.r = clamp(o.r * (1 + 0.9 * dt), 14, 120);
      }
    }

    // hover look: the view leans with the pointer
    const hk = damp(5, dt);
    this.hover.x += (this.hover.tx - this.hover.x) * hk;
    this.hover.y += (this.hover.ty - this.hover.y) * hk;
    const lean = reduce ? 0 : 1;

    // idle sway outside, so the model never looks frozen
    const idle = !reduce && s.mode === 'outside' && !s.touring && this.pointers.size === 0 && !this.hover.active ? Math.sin(this.time * 0.22) * 0.16 : 0;

    // chase the goals
    const og = this.orbitGoal, oc = this.orbitCur;
    const ko = reduce ? 1 : damp(4.2, dt);
    oc.theta += (og.theta + this.hover.x * 0.42 * lean + idle - oc.theta) * ko;
    oc.phi += (clamp(og.phi + this.hover.y * 0.09 * lean, 0.03, 1.4) - oc.phi) * ko;
    oc.r += (og.r - oc.r) * ko;
    oc.tx += (og.tx - oc.tx) * ko; oc.ty += (og.ty - oc.ty) * ko; oc.tz += (og.tz - oc.tz) * ko;

    const eg = this.eyeGoal, ec = this.eyeCur;
    const ke = reduce ? 1 : damp(5, dt);
    ec.x += (eg.x - ec.x) * ke; ec.z += (eg.z - ec.z) * ke; ec.y += (eg.y - ec.y) * damp(reduce ? 1 : 4, dt);
    ec.yaw += wrapAngle(eg.yaw + this.hover.x * 0.5 * lean - ec.yaw) * ke;
    ec.pitch += (clamp(eg.pitch - this.hover.y * 0.2 * lean, -1.1, 1.1) - ec.pitch) * ke;

    // camera follows the active rig; during mode changes and tour moves it flies
    if (this.flight > 0) this.flight = Math.max(0, this.flight - dt);
    const kc = reduce ? 1 : this.flight > 0 ? damp(2.6, dt) : damp(30, dt);
    this.camPos.lerp(this.desiredPos(), kc);
    this.camLook.lerp(this.desiredLook(), kc);
    this.fov += (this.desiredFov() - this.fov) * (reduce ? 1 : damp(3, dt));
    if (Math.abs(this.camera.fov - this.fov) > 0.01) { this.camera.fov = this.fov; this.camera.updateProjectionMatrix(); }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);

    // floors sliding apart / away
    const lk = reduce ? 1 : damp(3.6, dt);
    for (const l of this.model.levels) {
      if (Math.abs(l.target - l.offset) > 0.002) { l.offset += (l.target - l.offset) * lk; this.placeLevel(l); }
    }

    // tour
    if (s.touring) {
      this.tourTimer += dt;
      if (this.tourTimer * 1000 > TOUR[s.tourIndex].dwell + 2200) {
        if (s.tourIndex >= TOUR.length - 1) this.stopTour(); else this.nextTour(1);
      }
    }

    this.world.update(dt, this.time);
    this.model.animate(reduce ? 1.6 : (this.liftClock ?? this.time));
    if (!reduce) {
      this.mats.waterfallTex.offset.y = -((this.time * 0.9) % 1);
      this.mats.rippleTex.offset.x = (this.time * 0.03) % 1;
      this.mats.rippleTex.offset.y = (this.time * 0.015) % 1;
    }
    this.updateHoverRing();

    // hand the pose to the UI at about 10 Hz
    this.poseTimer += dt;
    if (this.poseTimer > 0.1) {
      this.poseTimer = 0;
      this.hooks.onPose({ mode: s.mode, level: s.level, x: ftX(ec.x), z: ftZ(ec.z), yaw: ec.yaw + this.hover.x * 0.5 * lean });
    }
  }

  private renderFrame(): void {
    this.updateLabels();
    this.renderer.render(this.scene, this.camera);
  }

  /** Lower the pixel ratio when frames run long, so slower phones stay smooth. */
  private governor(dt: number): void {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    if (avg > 0.034 && this.pixelRatio > 1) {
      this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.resize();
    } else if (avg > 0.05 && this.renderer.shadowMap.enabled) {
      // still slow at 1x: drop shadows, the most expensive pass
      this.renderer.shadowMap.enabled = false;
      this.sun.castShadow = false;
      this.scene.traverse((o) => { const mt = (o as Mesh).material; if (mt) (Array.isArray(mt) ? mt : [mt]).forEach((x) => { x.needsUpdate = true; }); });
    }
  }
}
