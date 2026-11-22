import {
  ACESFilmicToneMapping, BufferGeometry, DirectionalLight, Float32BufferAttribute, HemisphereLight, LineBasicMaterial, LineSegments, PCFSoftShadowMap,
  PerspectiveCamera, PMREMGenerator, Scene, Vector3, WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BuildingModel, LabelDef, LevelRig, RigKey, buildModel, dimensionLines, labelsFor } from './model';
import { BASE_Y, DIM, H, LEVEL_ORDER, LevelKey, PLOT_CENTRE, ROOF_Y, wx, wz } from './plan-dims';

/**
 * The lift-off 3D view of the building explorer.
 *
 * Choosing a level lifts every level above it away (they stay as faint brass outlines), cuts the chosen floor's walls low, and
 * turns the camera so the whole plan can be read. The visitor can then turn it from any side, zoom, or jump to Top, Angle or
 * Front. Drawn from the architect's plan dimensions (plan-dims.ts); nothing else is modelled.
 *
 * Built for phones: one merged mesh per material, one shadow-casting light, a render loop that only runs while something moves,
 * a pixel-ratio cap, and touch handling that keeps the page scrollable (a sideways drag turns the model, pinch zooms, an up or
 * down drag scrolls the page; the Top / Angle / Front buttons change the tilt).
 */

export type ViewPreset = 'top' | 'angle' | 'front';

export interface Explorer3DOptions {
  host: HTMLElement;
  level: LevelKey;
  reduceMotion: boolean;
  /** The north arrow, rotated to follow the camera. */
  compass?: HTMLElement | null;
  onFirstFrame?: () => void;
  /** The preset in force, or null once the visitor has turned the model by hand. */
  onView?: (v: ViewPreset | null) => void;
  /** The graphics context was lost: the page falls back to the picture. */
  onLost?: () => void;
}

interface Cam { yaw: number; pitch: number; dist: number; tx: number; ty: number; tz: number }

const VFOV = 36;
const LIFT_FIRST = 7;
const LIFT_STEP = 4.6;
/** How solid a lifted level is when seen from the side. It thins out as the camera rises, so it never hides the plan. */
const LIFT_ALPHA = 0.2;
const MIN_PITCH = 0.1;
const MAX_PITCH = 1.5;
/** Pixels at the bottom and top of the stage taken by the buttons, kept free of labels and left out when fitting the plan. */
const BOTTOM_UI = 62;
const TOP_UI = 52;

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const wrap = (a: number): number => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const damp = (k: number, dt: number): number => 1 - Math.exp(-k * dt);

/** Camera angle (yaw from north towards east, pitch above the horizon) for each preset. */
const PRESET: Record<ViewPreset, { yaw: number; pitch: number }> = {
  top: { yaw: Math.PI, pitch: MAX_PITCH },
  angle: { yaw: 0.62, pitch: 0.84 },
  front: { yaw: 0, pitch: 0.12 },
};
const smooth = (a: number, b: number, v: number): number => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

interface LabelEl { def: LabelDef; el: HTMLDivElement; w: number; h: number; measured: boolean; rig?: LevelRig }

export class Explorer3D {
  private host: HTMLElement;
  private opts: Explorer3DOptions;
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(VFOV, 1, 0.5, 400);
  private model: BuildingModel;
  private sun = new DirectionalLight('#ffe9c8', 2.2);
  private hemi = new HemisphereLight('#c3ccff', '#46382b', 0.8);
  private pmrem: PMREMGenerator;
  private dims = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ color: '#e8cf96', transparent: true, opacity: 0.9 }));
  private labelLayer: HTMLDivElement;
  private labels: LabelEl[] = [];
  /** Names that float beside the levels that have been lifted away. */
  private lifted: LabelEl[] = [];
  private road?: LabelEl;

  private level: LevelKey;
  private view: ViewPreset | null = 'angle';
  /** The visitor's zoom, relative to the distance that fits the plan (1 = fitted). Kept when the floor changes, reset by a preset. */
  private zoomRel = 1;
  private cur!: Cam;
  private goal!: Cam;
  private w = 1;
  private h = 1;
  private lowPower: boolean;
  /** Lifted levels thin out as the camera rises and fade almost away looking straight down, where they would only cross the plan. */
  private alphaK = 1;
  private edgeK = 1;

  private raf = 0;
  private last = 0;
  private active = true;
  private firstFrame = false;
  private settledAt = 0;
  private lastInput = 0;
  private lastMove = 0;
  private velYaw = 0;
  private disposed = false;

  private pointers = new Map<number, { x: number; y: number }>();
  private pinch = 0;
  private pinchStart = 0;
  private dragMoved = 0;
  private ro?: ResizeObserver;
  private cleanups: (() => void)[] = [];
  private readonly v3 = new Vector3();

  constructor(opts: Explorer3DOptions) {
    this.opts = opts;
    this.host = opts.host;
    this.level = opts.level;
    const nav = navigator as Navigator & { deviceMemory?: number };
    this.lowPower = (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4;

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lowPower ? 1.5 : 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    const cv = this.renderer.domElement;
    // pan-y: the page still scrolls when a finger moves up or down over the model; sideways drags turn it
    cv.style.cssText = 'display:block;width:100%;height:100%;outline:none;touch-action:pan-y;cursor:grab;-webkit-tap-highlight-color:transparent;';
    cv.setAttribute('aria-hidden', 'true');
    this.host.appendChild(cv);

    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'ex3d-labels';
    this.labelLayer.setAttribute('aria-hidden', 'true');
    this.host.appendChild(this.labelLayer);

    this.pmrem = new PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.scene.environment = this.pmrem.fromScene(room, 0.04).texture;
    room.dispose();

    this.model = buildModel();
    this.model.rigs.forEach((r) => [r.baseMats, r.upperMats].forEach((s) => s.all().forEach((m) => { m.envMapIntensity = 0.45; })));
    this.scene.add(this.model.root, this.hemi, this.sun, this.sun.target, this.dims);

    const ss = this.lowPower ? 1024 : 2048;
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(ss, ss);
    const sc = this.sun.shadow.camera;
    sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 140;
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.03;
    this.sun.position.set(-20, 54, -8);
    this.sun.target.position.set(0, 0, PLOT_CENTRE.z);

    this.buildLabels();
    this.setSizeFromHost();

    // The first view: the whole building from the road, like the front-elevation picture, and then it opens up
    this.model.rigs.forEach((r) => { r.state = { offset: 0, base: 1, upper: 1, ghost: 0 }; this.paint(r); });
    this.goal = this.poseFor(this.level, 'angle');
    this.cur = opts.reduceMotion
      ? { ...this.goal }
      : { yaw: -0.42, pitch: 0.1, dist: this.fitDist(this.level, 'front') * 1.3, tx: 0, ty: 6.5, tz: PLOT_CENTRE.z };
    this.applyLevel(this.level, opts.reduceMotion);
    this.setDimensions();
    this.updateLabelVisibility();
    this.bind();
    this.request();
  }

  /* ── public ─────────────────────────────────────────────────────────────────────────── */

  /** Choose the level: the levels above lift away, this one is cut open. */
  setLevel(key: LevelKey): void {
    // a model the visitor has turned by hand keeps its heading and tilt; the zoom is kept either way
    const keepHeading = this.view === null;
    const { yaw, pitch } = this.goal;
    this.level = key;
    this.applyLevel(key, this.opts.reduceMotion);
    this.setDimensions();
    const p = this.poseFor(key, this.view ?? 'angle');
    if (keepHeading) { p.yaw = yaw; p.pitch = pitch; p.dist = this.fitAt(key, yaw, pitch) * this.zoomRel; }
    this.goTo(p, this.opts.reduceMotion);
    this.updateLabelVisibility();
    this.request();
  }

  setView(v: ViewPreset): void {
    this.view = v;
    this.zoomRel = 1;
    this.goTo(this.poseFor(this.level, v), this.opts.reduceMotion);
    this.opts.onView?.(v);
    this.request();
  }

  zoom(factor: number): void {
    this.lastInput = performance.now();
    this.zoomRel = clamp(this.zoomRel * factor, 0.38, 1.8);
    this.goal.dist = this.autoDist();
    this.request();
  }

  reset(): void { this.setView(this.view ?? 'angle'); }

  /** Stop drawing while the model is off screen or the tab is hidden. */
  setActive(on: boolean): void {
    this.active = on;
    if (on) this.request();
    else if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; }
  }

  dispose(): void {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.cleanups.forEach((f) => f());
    this.cleanups = [];
    this.dims.geometry.dispose();
    (this.dims.material as LineBasicMaterial).dispose();
    this.model.dispose();
    this.scene.environment?.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.labelLayer.remove();
  }

  /* ── levels ─────────────────────────────────────────────────────────────────────────── */

  private applyLevel(key: LevelKey, instant: boolean): void {
    const idx = LEVEL_ORDER.indexOf(key);
    this.model.rigs.forEach((r, i) => {
      if (i < idx) r.goal = { offset: 0, base: 1, upper: 1, ghost: 0 };
      else if (i === idx) r.goal = { offset: 0, base: 1, upper: 0, ghost: 0 };
      else r.goal = { offset: LIFT_FIRST + (i - idx - 1) * LIFT_STEP, base: LIFT_ALPHA, upper: LIFT_ALPHA, ghost: 1 };
      const lifted = i > idx;
      if (r.castOn === lifted) {
        r.castOn = !lifted;
        r.meshes.forEach((m) => { m.castShadow = !lifted && !(m.material as { transparent?: boolean }).transparent; });
      }
      if (instant) { r.state = { ...r.goal }; this.paint(r); }
    });
  }

  private paint(r: LevelRig): void {
    const lifted = r.goal.ghost > 0;
    const k = lifted ? this.alphaK : 1;
    r.root.position.y = r.state.offset;
    r.baseMats.setFade(r.state.base * k); r.base.visible = r.state.base * k > 0.01;
    r.upperMats.setFade(r.state.upper * k); r.upper.visible = r.state.upper * k > 0.01;
    r.fillMat.opacity = 0.05 * r.state.ghost * this.edgeK;
    r.edgeMat.opacity = 0.36 * r.state.ghost * this.edgeK;
    r.ghost.visible = r.state.ghost > 0.01;
  }

  private setDimensions(): void {
    this.dims.geometry.dispose();
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(dimensionLines(this.level), 3));
    this.dims.geometry = g;
  }

  /* ── camera ─────────────────────────────────────────────────────────────────────────── */

  /** The corners of what the camera has to keep in view for a level and a view, and the point it looks at. */
  private frame(key: LevelKey, v: ViewPreset): { pts: Vector3[]; target: Vector3 } {
    const ground = key === 'g';
    const y0 = BASE_Y[key];
    const x0 = ground ? wx(0) : wx(DIM.plate.x0), x1 = ground ? wx(DIM.plot.w) : wx(DIM.plate.x1);
    // on the ground level a strip of the road is kept in view, so the north side reads
    const z0 = ground ? -4.4 : wz(DIM.plate.zGlass), z1 = ground ? wz(DIM.plot.d) : wz(DIM.plate.z1);
    const yLo = ground ? 0 : y0 - H.slab, yHi = y0 + (ground ? 3 : 3.4);
    // the front view shows the floor and the first floor lifted above it
    const yTop = v === 'front' ? yHi + 10.5 : yHi;
    const pts: Vector3[] = [];
    for (const x of [x0, x1]) for (const y of [yLo, yTop]) for (const z of [z0, z1]) pts.push(new Vector3(x, y, z));
    const target = new Vector3((x0 + x1) / 2, (yLo + yTop) / 2, (z0 + z1) / 2);
    return { pts, target };
  }

  /** Camera distance at which every corner is inside the stage, clear of the buttons, for the given angle. */
  private distFor(pts: Vector3[], target: Vector3, yaw: number, pitch: number): number {
    const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
    const back = new Vector3(sy * cp, sp, -cy * cp); // from the target to the camera
    const right = new Vector3(-cy, 0, -sy);
    const up = new Vector3().crossVectors(back, right);
    const tanV = Math.tan((VFOV * Math.PI) / 360);
    const tanH = tanV * this.camera.aspect;
    const fx = clamp(1 - 14 / this.w, 0.8, 0.97);
    const fy = clamp((this.h - TOP_UI - BOTTOM_UI) / this.h, 0.5, 0.95);
    const r = new Vector3();
    let d = 1;
    for (const p of pts) {
      r.copy(p).sub(target);
      const b = r.dot(back);
      d = Math.max(d, b + Math.abs(r.dot(right)) / (fx * tanH), b + Math.abs(r.dot(up)) / (fy * tanV));
    }
    return d;
  }

  /** The distance that fits a level's plan when seen from an arbitrary heading. */
  private fitAt(key: LevelKey, yaw: number, pitch: number): number {
    const f = this.frame(key, 'angle');
    return this.distFor(f.pts, f.target, yaw, pitch);
  }

  /** The distance that fits the level in a view: the base for zooming and for keeping the zoom through a resize. */
  private fitDist(key: LevelKey, v: ViewPreset): number {
    const f = this.frame(key, v);
    const p = this.presetFor(v);
    return this.distFor(f.pts, f.target, p.yaw, p.pitch);
  }

  /** The distance that fits the plan at the heading the camera is heading for (the whole plan stays in view while it is turned). */
  private autoFit(): number {
    return this.view ? this.fitDist(this.level, this.view) : this.fitAt(this.level, this.goal.yaw, this.goal.pitch);
  }
  private autoDist(): number { return this.autoFit() * this.zoomRel; }

  /** The angle of a preset. The Angle view turns less on a tall, narrow stage (a phone held upright), so the long plan fills it. */
  private presetFor(v: ViewPreset): { yaw: number; pitch: number } {
    const p = PRESET[v];
    if (v !== 'angle') return p;
    return { yaw: 0.26 + 0.42 * smooth(0.55, 1.45, this.camera.aspect), pitch: p.pitch };
  }

  private poseFor(key: LevelKey, v: ViewPreset): Cam {
    const f = this.frame(key, v);
    const p = this.presetFor(v);
    return { yaw: p.yaw, pitch: p.pitch, dist: this.distFor(f.pts, f.target, p.yaw, p.pitch) * this.zoomRel, tx: f.target.x, ty: f.target.y, tz: f.target.z };
  }

  private goTo(p: Cam, instant: boolean): void {
    p.yaw = this.cur.yaw + wrap(p.yaw - this.cur.yaw);
    this.goal = p;
    this.velYaw = 0;
    if (instant) this.cur = { ...p };
  }

  private placeCamera(): void {
    const c = this.cur;
    const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    this.camera.position.set(c.tx + c.dist * Math.sin(c.yaw) * cp, c.ty + c.dist * sp, c.tz - c.dist * Math.cos(c.yaw) * cp);
    this.camera.lookAt(c.tx, c.ty, c.tz);
  }

  /* ── size and input ─────────────────────────────────────────────────────────────────── */

  private setSizeFromHost(): void {
    const r = this.host.getBoundingClientRect();
    this.w = Math.max(1, Math.round(r.width));
    this.h = Math.max(1, Math.round(r.height));
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    // the plan is centred in the part of the stage between the top margin and the buttons
    this.camera.setViewOffset(this.w, this.h, 0, (BOTTOM_UI - TOP_UI) / 2, this.w, this.h);
    this.camera.updateProjectionMatrix();
  }

  private bind(): void {
    const cv = this.renderer.domElement;
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void, o?: AddEventListenerOptions): void => {
      el.addEventListener(type, fn as EventListener, o);
      this.cleanups.push(() => el.removeEventListener(type, fn as EventListener, o));
    };

    if (typeof ResizeObserver === 'function') {
      this.ro = new ResizeObserver(() => {
        const before = this.autoFit();
        this.setSizeFromHost();
        const ratio = this.autoFit() / before;
        if (isFinite(ratio) && ratio > 0) { this.goal.dist *= ratio; this.cur.dist *= ratio; }
        this.request();
      });
      this.ro.observe(this.host);
    }

    on(cv, 'pointerdown', (e) => {
      cv.setPointerCapture?.(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dragMoved = 0;
      this.velYaw = 0;
      this.lastMove = performance.now();
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.pinch = Math.hypot(a.x - b.x, a.y - b.y);
        this.pinchStart = this.zoomRel;
      }
      cv.style.cursor = 'grabbing';
    });
    on(cv, 'pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      const t = performance.now();
      this.lastInput = t;
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinch > 0 && d > 0) {
          this.zoomRel = clamp(this.pinchStart * (this.pinch / d), 0.38, 1.8);
          this.goal.dist = this.autoDist();
        }
      } else {
        this.dragMoved += Math.abs(dx) + Math.abs(dy);
        const k = 0.0062;
        this.goal.yaw += dx * k;
        const inst = (dx * k) / (Math.max(8, t - this.lastMove) / 1000);
        this.velYaw = this.velYaw * 0.55 + inst * 0.45;
        this.lastMove = t;
        // a mouse can tilt as well; a finger's up and down belongs to the page, so touch tilts with the buttons
        if (e.pointerType !== 'touch') this.goal.pitch = clamp(this.goal.pitch + dy * 0.0055, MIN_PITCH, MAX_PITCH);
        if (this.dragMoved > 6 && this.view !== null) { this.view = null; this.opts.onView?.(null); }
        if (this.view === null) this.goal.dist = this.autoDist();
      }
      this.request();
    });
    const up = (e: PointerEvent): void => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = 0;
      if (!this.pointers.size) {
        cv.style.cursor = 'grab';
        // a quick sideways flick glides a little; a slow release stops where it is
        if (performance.now() - this.lastMove > 90 || this.opts.reduceMotion) this.velYaw = 0;
        this.velYaw = clamp(this.velYaw, -2.6, 2.6);
      }
      this.request();
    };
    on(cv, 'pointerup', up);
    on(cv, 'pointercancel', up);
    on(cv, 'wheel', (e) => {
      // plain scrolling keeps scrolling the page; Ctrl or Cmd (or a trackpad pinch) zooms the model
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      this.zoom(Math.exp(e.deltaY * 0.0025));
    }, { passive: false });
    on(cv, 'dblclick', () => this.reset());

    // keyboard: arrows turn it, plus and minus zoom, zero resets
    on(this.host, 'keydown', (e) => {
      const k = e.key;
      let used = true;
      if (k === 'ArrowLeft') this.nudge(-0.14, 0);
      else if (k === 'ArrowRight') this.nudge(0.14, 0);
      else if (k === 'ArrowUp') this.nudge(0, 0.1);
      else if (k === 'ArrowDown') this.nudge(0, -0.1);
      else if (k === '+' || k === '=') this.zoom(0.85);
      else if (k === '-' || k === '_') this.zoom(1.18);
      else if (k === '0' || k === 'Home') this.reset();
      else used = false;
      if (used) e.preventDefault();
    });

    const lost = (e: Event): void => { e.preventDefault(); this.opts.onLost?.(); };
    cv.addEventListener('webglcontextlost', lost);
    this.cleanups.push(() => cv.removeEventListener('webglcontextlost', lost));
  }

  private nudge(dyaw: number, dpitch: number): void {
    this.lastInput = performance.now();
    this.goal.yaw += dyaw;
    this.goal.pitch = clamp(this.goal.pitch + dpitch, MIN_PITCH, MAX_PITCH);
    if (this.view !== null) { this.view = null; this.opts.onView?.(null); }
    this.goal.dist = this.autoDist();
    this.request();
  }

  /* ── labels ─────────────────────────────────────────────────────────────────────────── */

  private makeLabel(def: LabelDef): LabelEl {
    const el = document.createElement('div');
    el.className = 'ex3d-label' + (def.tone ? ' is-' + def.tone : '');
    el.textContent = def.text;
    el.style.display = 'none';
    this.labelLayer.appendChild(el);
    return { def, el, w: 14 + def.text.length * 6.4, h: 24, measured: false };
  }

  private buildLabels(): void {
    for (const def of labelsFor()) this.labels.push(this.makeLabel(def));
    this.road = this.makeLabel({ id: 'road', text: '24 m wide road', x: 0, y: 0.05, z: -3.4, levels: ['g'], tone: 'plain', priority: 6 });
    const names: Partial<Record<RigKey, string>> = { f1: 'First floor', f2: 'Second floor', f3: 'Third floor', roof: 'Roof' };
    for (const rig of this.model.rigs) {
      const name = names[rig.key];
      if (!name) continue;
      const y = rig.key === 'roof' ? ROOF_Y : BASE_Y[rig.key];
      const l = this.makeLabel({ id: 'lift-' + rig.key, text: name + ' · lifted', x: wx(DIM.plate.x0) - 0.5, y: y + H.floor * 0.5, z: wz(DIM.plate.zGlass), levels: LEVEL_ORDER, tone: 'gold', priority: 3 });
      l.rig = rig;
      this.lifted.push(l);
    }
    this.updateLabelVisibility();
  }

  private updateLabelVisibility(): void {
    for (const l of this.labels) l.el.style.display = l.def.levels.includes(this.level) ? '' : 'none';
    if (this.road) this.road.el.style.display = this.level === 'g' ? '' : 'none';
    for (const l of this.lifted) l.el.style.display = '';
  }

  private placeLabels(show: boolean): void {
    const taken: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const items = this.labels.filter((l) => l.def.levels.includes(this.level));
    if (this.road && this.level === 'g') items.push(this.road);
    // a level's name floats beside it once it has been lifted away
    for (const l of this.lifted) if (l.rig && l.rig.state.ghost > 0.6) items.push(l);
    items.sort((a, b) => a.def.priority - b.def.priority);
    const narrow = this.w < 460;
    const pt = this.v3;
    for (const l of this.lifted) if (!(l.rig && l.rig.state.ghost > 0.6)) l.el.style.opacity = '0';
    for (const l of items) {
      if (!l.measured && l.el.offsetWidth) { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; l.measured = true; }
      pt.set(l.def.x, l.def.y + (l.rig ? l.rig.state.offset : 0), l.def.z);
      pt.project(this.camera);
      const sx = (pt.x * 0.5 + 0.5) * this.w, sy = (-pt.y * 0.5 + 0.5) * this.h;
      const box = { x0: sx - l.w / 2 - 4, x1: sx + l.w / 2 + 4, y0: sy - l.h - 10, y1: sy + 4 };
      let ok = show && pt.z < 1 && pt.z > -1;
      if (narrow && l.def.priority > 3) ok = false;
      // keep clear of the edges, the title block at the top left and the buttons along the bottom
      if (ok && (box.x0 < 4 || box.x1 > this.w - 4 || box.y0 < 4 || box.y1 > this.h - BOTTOM_UI + 6)) ok = false;
      if (ok && box.x0 < 210 && box.y0 < 74) ok = false;
      if (ok && taken.some((a) => box.x0 < a.x1 && box.x1 > a.x0 && box.y0 < a.y1 && box.y1 > a.y0)) ok = false;
      if (ok) taken.push(box);
      l.el.style.transform = `translate3d(${Math.round(sx)}px,${Math.round(sy)}px,0) translate(-50%,-100%)`;
      l.el.style.opacity = ok ? '1' : '0';
    }
  }

  /* ── loop ───────────────────────────────────────────────────────────────────────────── */

  private request(): void {
    if (!this.raf && this.active && !this.disposed) this.raf = requestAnimationFrame((t) => this.tick(t));
  }

  private tick(now: number): void {
    this.raf = 0;
    if (this.disposed || !this.active) return;
    const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 0.016);
    this.last = now;
    const reduce = this.opts.reduceMotion;
    const step = (a: number, b: number, k: number, eps: number): number => (reduce || Math.abs(b - a) < eps ? b : a + (b - a) * k);

    // levels: lift and fade
    let rigsMoving = false;
    const kl = damp(3.4, dt), kf = damp(5, dt);
    for (const r of this.model.rigs) {
      const s = r.state, g = r.goal;
      if (s.offset === g.offset && s.base === g.base && s.upper === g.upper && s.ghost === g.ghost) continue;
      s.offset = step(s.offset, g.offset, kl, 0.01);
      s.base = step(s.base, g.base, kf, 0.004);
      s.upper = step(s.upper, g.upper, kf, 0.004);
      s.ghost = step(s.ghost, g.ghost, kf, 0.004);
      this.paint(r);
      rigsMoving = true;
    }

    // camera: eased towards the goal, and quick to follow while the visitor is turning it
    const touching = this.pointers.size > 0;
    const user = touching || now - this.lastInput < 700;
    if (!touching && Math.abs(this.velYaw) > 0.03) {
      this.goal.yaw += this.velYaw * dt;
      this.velYaw *= Math.exp(-3.4 * dt);
      if (this.view === null) this.goal.dist = this.autoDist();
    } else if (!touching) this.velYaw = 0;
    const ck = damp(user ? 20 : 3.6, dt);
    const c = this.cur, g = this.goal;
    const before = c.yaw + c.pitch * 7 + c.dist * 13 + c.tx * 17 + c.ty * 19 + c.tz * 23;
    c.yaw = step(c.yaw, g.yaw, ck, 0.0004);
    c.pitch = step(c.pitch, g.pitch, ck, 0.0004);
    c.dist = step(c.dist, g.dist, ck, 0.01);
    c.tx = step(c.tx, g.tx, ck, 0.005);
    c.ty = step(c.ty, g.ty, ck, 0.005);
    c.tz = step(c.tz, g.tz, ck, 0.005);
    const camMoving = before !== c.yaw + c.pitch * 7 + c.dist * 13 + c.tx * 17 + c.ty * 19 + c.tz * 23 || Math.abs(this.velYaw) > 0.03;

    this.placeCamera();
    const ak = (0.3 + 0.7 * (1 - smooth(0.25, 0.95, c.pitch))) * (1 - smooth(1.1, 1.45, c.pitch));
    const ek = 1 - 0.78 * smooth(0.95, 1.42, c.pitch);
    if (Math.abs(ak - this.alphaK) > 0.01 || Math.abs(ek - this.edgeK) > 0.01) {
      this.alphaK = ak; this.edgeK = ek;
      for (const r of this.model.rigs) if (r.goal.ghost > 0) this.paint(r);
    }
    // labels appear once the lift and the turn have settled, and stay while the visitor turns the model by hand
    const animating = rigsMoving || (camMoving && !user);
    if (animating) this.settledAt = 0; else if (!this.settledAt) this.settledAt = now;
    const labelsOn = !animating && (user || now - this.settledAt > 160);
    this.renderer.render(this.scene, this.camera);
    this.placeLabels(labelsOn);
    if (this.opts.compass) this.opts.compass.style.transform = `rotate(${((Math.PI - c.yaw) * 180) / Math.PI}deg)`;
    if (!this.firstFrame) { this.firstFrame = true; this.opts.onFirstFrame?.(); }

    if (rigsMoving || camMoving || touching || (!animating && !labelsOn)) this.raf = requestAnimationFrame((t) => this.tick(t));
  }
}
