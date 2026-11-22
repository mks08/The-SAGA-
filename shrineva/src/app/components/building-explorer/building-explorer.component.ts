import { AfterViewInit, Component, ElementRef, Inject, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EXPLORER_IMAGE, EXPLORER_LEVELS, EXPLORER_VIEW, ExplorerLevel, LEASE_OPTIONS, LevelId } from '../../config/explorer.config';
import { MediaItem, PLAN_LEVELS } from '../../config/media.config';
import { AnalyticsService } from '../../core/services/analytics.service';
import { openChaix, openLeadPath } from '../../core/ui-events';
import type { Explorer3D, ViewPreset } from '../../explorer3d/explorer3d';

/** What the stage shows: the building render, the 3D plan loading, or the 3D plan itself. */
type StageMode = 'elevation' | 'loading' | 'plan3d';

/** The graphics library is a separate download, fetched the first time it is needed (or a moment before, when the connection is good). */
type Module3D = typeof import('../../explorer3d/explorer3d');

/** True when the browser can draw 3D. The throwaway context is released at once. */
function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | WebGL2RenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

/** A level as the template needs it: the config plus the drawn shapes and the plan sheets. */
interface LevelView extends ExplorerLevel {
  /** The tappable shape (the outline, or the larger area for the top floor). */
  shape: string;
  /** Everything except the shape, as one path, used to dim the rest of the building when this level is chosen. */
  dimPath: string;
  markerLeft: number;
  markerTop: number;
  /** The drawings for this level: 2D plan first, then the 3D cutaway. */
  sheets: MediaItem[];
  /** Natural size of the small 2D plan image (half of the full sheet), for the img width and height attributes. */
  thumbW: number;
  thumbH: number;
}

const { w: VW, h: VH } = EXPLORER_VIEW;

const toPath = (points: string): string => 'M' + points.trim().replace(/\s+/g, ' L') + ' Z';

/**
 * Interactive building explorer (home page, right under the hero).
 *
 * The building render carries a tappable outline for each level (Ground floor: parking; Floors 1, 2, 3: commercial). Choosing a
 * level - by tapping the building, the marker beside it, or the tab under it - dims the rest of the building and opens that
 * level's details beside it: the floor plan (tap to enlarge, 2D then 3D), the area, the facts, and the three ways to get in touch.
 *
 * Mobile first: the picture is full width, the G / 1 / 2 / 3 tabs stay pinned under the header while the details scroll, and
 * the details swipe left and right. Tabs follow the WAI-ARIA tabs pattern (arrow keys, Home, End); the outlines and markers are
 * an extra way to choose and are hidden from assistive technology, since the tabs do the same job. All panels are in the
 * page's HTML (the others are only hidden), so search engines and assistants read every floor.
 *
 * 3D plan: choosing a level also turns the picture into a 3D model of that floor (explorer3d/). The floors above lift away and
 * show as faint outlines, the chosen floor is cut open low so its whole plan can be read, and the model can be turned from any
 * side (drag, pinch, keys) or set to Top, Angle or Front with one tap. The front-elevation render stays the standard look: it is
 * the picture until a floor is chosen, and the "Building" button brings it back. The graphics library is a separate download
 * and loads only when needed; with data saver on, 3D opens only from its own button. Where 3D cannot run, the render does the job.
 *
 * Data: config/explorer.config.ts (floor facts come from content.config.ts; availability is LEVEL_STATUS there).
 */
@Component({
  selector: 'app-building-explorer',
  templateUrl: './building-explorer.component.html',
  styleUrls: ['./building-explorer.component.scss'],
})
export class BuildingExplorerComponent implements AfterViewInit, OnDestroy {
  readonly image = EXPLORER_IMAGE;
  readonly view = EXPLORER_VIEW;
  readonly lease = LEASE_OPTIONS;

  readonly levels: LevelView[] = EXPLORER_LEVELS.map((l) => {
    const shape = l.hit || l.outline;
    const sheets = (PLAN_LEVELS.find((p) => p.id === l.planKey)?.views ?? []).map((v) => v.item);
    return {
      ...l,
      shape,
      dimPath: `M0 0 H${VW} V${VH} H0 Z ${toPath(shape)}`,
      markerLeft: (l.marker.x / VW) * 100,
      markerTop: (l.marker.y / VH) * 100,
      sheets,
      thumbW: Math.round(sheets[0].width / 2),
      thumbH: Math.round(sheets[0].height / 2),
    };
  });

  /** The chosen level. The first commercial floor opens by default. */
  sel: LevelId = 'f1';
  /** The level under the pointer (desktop); only previews the name. */
  hoverId: LevelId | null = null;
  /** Becomes true once the visitor has chosen a level themselves (the hint then goes away). */
  touched = false;

  /** What the stage shows now. */
  mode: StageMode = 'elevation';
  /** The 3D preset in force, or null once the visitor has turned the model by hand. */
  view3d: ViewPreset | null = 'angle';
  readonly presets: { id: ViewPreset; label: string; hint: string }[] = [
    { id: 'top', label: 'Top', hint: 'Look straight down on the plan' },
    { id: 'angle', label: 'Angle', hint: 'Look from the road side at an angle' },
    { id: 'front', label: 'Front', hint: 'Look at the front from the road' },
  ];
  /** False on the server, and once 3D is found not to work on this device. Hides the 3D buttons. */
  canUse3d = false;
  /** Choosing a floor opens 3D by itself. Off with data saver or a slow connection (3D then opens from its button only). */
  private auto3d = true;
  /** The "drag to turn" hint, shown for a few seconds after the model first appears. */
  hint3d = false;
  /** Spoken (screen reader) description of the 3D view; changes with the floor. */
  live3d = '';

  lbItems: MediaItem[] = [];
  lbIndex: number | null = null;

  private io?: IntersectionObserver;
  private vis?: IntersectionObserver;
  private swipe: { x: number; y: number; t: number } | null = null;
  private readonly browser: boolean;
  private mod?: Promise<Module3D>;
  private engine?: Explorer3D;
  private stageOn = false;
  private warmed = false;
  /** A floor was chosen while the picture was off screen (the pinned tabs allow it): 3D opens when the picture comes back into view. */
  private pending3d: string | null = null;
  private seen?: IntersectionObserver;
  private hintTimer?: ReturnType<typeof setTimeout>;
  /** The model has been shown at least once, so the hint is not repeated. */
  private touchedModel = false;

  constructor(
    private host: ElementRef<HTMLElement>,
    private zone: NgZone,
    private analytics: AnalyticsService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.browser = isPlatformBrowser(platformId);
    if (this.browser) {
      this.canUse3d = true;
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) this.auto3d = false;
    }
  }

  get selected(): LevelView { return this.levels.find((l) => l.id === this.sel) as LevelView; }
  /** The name shown on the picture: the level under the pointer, otherwise the chosen one (always the chosen one in 3D). */
  get labelled(): LevelView { return this.levels.find((l) => l.id === (this.mode === 'plan3d' ? this.sel : this.hoverId || this.sel)) as LevelView; }
  get statusLines(): string {
    const open = this.levels.filter((l) => l.use === 'Commercial' && l.status === 'available');
    const all = this.levels.filter((l) => l.use === 'Commercial');
    if (!open.length) return '';
    if (open.length === all.length) return 'Floors 1, 2 and 3 are available to lease.';
    return `Available to lease: ${open.map((l) => l.title.toLowerCase()).join(', ')}.`;
  }

  ngAfterViewInit(): void {
    if (!this.browser) return;
    this.watchStage();
    // Is 3D possible here? Checked when the browser is idle, so it never delays the first paint.
    this.idle(() => { if (!webglAvailable()) { this.canUse3d = false; this.mode = 'elevation'; } });
    if (typeof IntersectionObserver === 'undefined') return;
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = this.host.nativeElement.querySelector<HTMLElement>('.ex-root');
    const stage = this.host.nativeElement.querySelector<HTMLElement>('.ex-stage');
    if (!root || !stage) return;
    // Already on screen when the page is first shown: leave it as it is, no hide-then-reveal flash.
    const r = stage.getBoundingClientRect();
    if (r.top < innerHeight * 0.8 && r.bottom > 0) return;
    root.classList.add('ex-armed');
    this.zone.runOutsideAngular(() => {
      this.io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        root.classList.add('ex-in');
        this.io?.disconnect();
      }, { threshold: 0.3 });
      this.io.observe(stage);
    });
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    this.vis?.disconnect();
    this.seen?.disconnect();
    if (this.hintTimer) clearTimeout(this.hintTimer);
    this.engine?.dispose();
    this.engine = undefined;
  }

  /* ── 3D plan ─────────────────────────────────────────────────────────────────────────── */

  /** Warm the 3D download shortly before the stage scrolls into view (good connections only), and pause drawing while it is off screen. */
  private watchStage(): void {
    const stage = this.host.nativeElement.querySelector<HTMLElement>('.ex-stage');
    if (!stage || typeof IntersectionObserver === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      this.vis = new IntersectionObserver((entries) => {
        this.stageOn = entries.some((e) => e.isIntersecting);
        if (this.stageOn && !this.warmed && this.auto3d && this.canUse3d) {
          this.warmed = true;
          this.idle(() => { this.load3d().catch(() => undefined); });
        }
        this.engine?.setActive(this.stageOn && this.mode === 'plan3d');
      }, { rootMargin: '400px 0px' });
      this.vis.observe(stage);
      // the picture itself coming into view (no margin): the moment to open a 3D plan that was asked for while it was away
      this.seen = new IntersectionObserver((entries) => {
        if (!this.pending3d || !entries.some((e) => e.isIntersecting)) return;
        const via = this.pending3d;
        this.pending3d = null;
        this.zone.run(() => { if (this.mode === 'elevation' && this.auto3d && this.canUse3d) void this.enter3d(via); });
      }, { threshold: 0.15 });
      this.seen.observe(stage);
    });
  }

  /** True when the picture is on screen right now. */
  private stageVisible(): boolean {
    const stage = this.host.nativeElement.querySelector<HTMLElement>('.ex-stage');
    if (!stage) return false;
    const r = stage.getBoundingClientRect();
    return r.bottom > 40 && r.top < innerHeight - 40;
  }

  private idle(fn: () => void): void {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 2500 });
    else setTimeout(fn, 600);
  }

  private load3d(): Promise<Module3D> {
    if (!this.mod) {
      this.mod = import('../../explorer3d/explorer3d');
      this.mod.catch(() => { this.mod = undefined; });
    }
    return this.mod;
  }

  /** The buttons: the building render, or the 3D plan. */
  showBuilding(): void {
    if (this.mode === 'elevation') return;
    this.auto3d = false; // the visitor chose the render: choosing a floor no longer switches to 3D
    this.pending3d = null;
    this.leave3d('button');
  }
  show3d(via: 'button' | 'stage' | 'marker' | 'tab' | 'swipe' | 'key'): void {
    if (via === 'button') this.auto3d = true;
    void this.enter3d(via);
  }

  private async enter3d(via: string): Promise<void> {
    if (!this.browser || !this.canUse3d || this.mode === 'loading') return;
    if (this.mode === 'plan3d') return;
    const fresh = !this.engine;
    this.mode = 'loading';
    this.analytics.event('explorer_3d_open', { floor: this.sel, via });
    try {
      const mod = await this.load3d();
      if (this.mode !== 'loading') return; // the visitor went back to the render meanwhile
      if (fresh || !this.engine) {
        const el = this.host.nativeElement;
        const stageHost = el.querySelector<HTMLElement>('.ex-3d');
        if (!stageHost) throw new Error('no 3D host');
        const compass = el.querySelector<HTMLElement>('.ex-compass-rose');
        const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.zone.runOutsideAngular(() => {
          this.engine = new mod.Explorer3D({
            host: stageHost,
            level: this.sel,
            reduceMotion,
            compass,
            onFirstFrame: () => this.zone.run(() => this.shown3d()),
            onView: (v) => this.zone.run(() => { this.view3d = v; if (v === null) this.hint3d = false; }),
            onLost: () => this.zone.run(() => this.lost3d()),
          });
        });
      } else {
        this.engine.setLevel(this.sel);
        this.engine.setActive(true);
        this.shown3d();
      }
    } catch {
      this.lost3d();
    }
  }

  /** The first 3D frame is drawn: cross-fade from the render. */
  private shown3d(): void {
    if (this.mode !== 'loading') return;
    this.mode = 'plan3d';
    this.engine?.setActive(this.stageOn || !this.vis);
    this.live3d = this.describe(this.selected);
    this.hint3d = !this.touchedModel;
    this.touchedModel = true;
    if (this.hintTimer) clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => { this.hint3d = false; }, 5800);
  }

  private leave3d(via: string): void {
    if (this.mode === 'elevation') return;
    this.analytics.event('explorer_3d_close', { floor: this.sel, via });
    this.mode = 'elevation';
    this.hint3d = false;
    this.engine?.setActive(false);
  }

  /** 3D cannot run (no WebGL, the library did not load, or the graphics context was lost): the render does the job. */
  private lost3d(): void {
    this.canUse3d = false;
    this.mode = 'elevation';
    this.hint3d = false;
    this.engine?.dispose();
    this.engine = undefined;
  }

  setView(v: ViewPreset): void {
    this.engine?.setView(v);
    this.view3d = v;
    this.hint3d = false;
    this.analytics.event('explorer_3d_view', { view: v, floor: this.sel });
  }
  zoom3d(factor: number): void { this.engine?.zoom(factor); this.hint3d = false; }

  private describe(l: LevelView): string {
    const lifted = l.id === 'f3' ? 'The roof is lifted away.' : 'The floors above are lifted away.';
    return `${l.title}, ${l.use.toLowerCase()}, in 3D. ${lifted} Drag to turn the model, or use the Top, Angle and Front buttons. With the keyboard, the arrow keys turn it and plus and minus zoom.`;
  }

  /** Choose a level. `via` says how, for the statistics (no personal data is involved). */
  pick(id: LevelId, via: 'stage' | 'marker' | 'tab' | 'swipe' | 'key'): void {
    const same = id === this.sel;
    this.touched = true;
    if (!same) {
      this.sel = id;
      this.analytics.event('explorer_select', { floor: id, via });
    }
    if (this.mode === 'plan3d' || this.mode === 'loading') {
      if (!same) {
        this.engine?.setLevel(id);
        if (this.mode === 'plan3d') this.live3d = this.describe(this.selected);
      }
    } else if (this.auto3d && this.canUse3d) {
      // the picture grows taller in 3D, so it opens only while it is on screen (otherwise the page would jump under the visitor's finger)
      if (!this.browser || this.stageVisible()) void this.enter3d(via);
      else this.pending3d = via;
    }
  }

  hover(id: LevelId | null): void { this.hoverId = id; }

  tabKey(e: KeyboardEvent): void {
    const i = this.levels.findIndex((l) => l.id === this.sel);
    const n = this.levels.length;
    let t = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') t = (i + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') t = (i + n - 1) % n;
    else if (e.key === 'Home') t = 0;
    else if (e.key === 'End') t = n - 1;
    else return;
    e.preventDefault();
    this.pick(this.levels[t].id, 'key');
    (this.host.nativeElement.querySelector(`#ex-tab-${this.levels[t].id}`) as HTMLElement | null)?.focus();
  }

  /** Swipe the details left or right to move to the next or previous level (touch and pen only). */
  swipeStart(e: PointerEvent): void {
    if (e.pointerType === 'mouse') return;
    this.swipe = { x: e.clientX, y: e.clientY, t: Date.now() };
  }
  swipeEnd(e: PointerEvent): void {
    const s = this.swipe;
    this.swipe = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.6 || Date.now() - s.t > 700) return;
    const i = this.levels.findIndex((l) => l.id === this.sel);
    const t = i + (dx < 0 ? 1 : -1);
    if (t < 0 || t >= this.levels.length) return;
    this.pick(this.levels[t].id, 'swipe');
  }

  openPlan(l: LevelView): void {
    this.lbItems = l.sheets;
    this.lbIndex = 0;
    this.analytics.event('explorer_plan_open', { floor: l.id });
  }

  visit(l: LevelView): void {
    this.analytics.event('site_visit_click', { source: 'explorer', floor: l.id });
    openLeadPath({ source: 'explorer', path: 'visit', context: l.title });
  }
  brochure(l: LevelView): void {
    this.analytics.event('brochure_click', { source: 'explorer', floor: l.id });
    openLeadPath({ source: 'explorer', path: 'brochure', context: l.title });
  }
  chaix(l: LevelView): void {
    openChaix({ source: 'explorer', question: `Tell me about the ${l.title.toLowerCase()}` });
  }

  trackById(_: number, l: LevelView): string { return l.id; }
}
