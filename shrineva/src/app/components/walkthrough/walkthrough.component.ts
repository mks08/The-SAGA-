import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, NgZone, OnDestroy, ViewChild,
} from '@angular/core';
import {
  BUILDING, LEVELS, LevelId, PRESETS, Preset, STAIR_HOLE, TIMES, TOUR, TourStop, TimeOfDay, WALKTHROUGH_NOTE, WAYPOINTS, plateOutline,
} from '../../config/building.config';
import { AnalyticsService } from '../../core/services/analytics.service';
import type { Engine, EngineState, Pose } from '../../walkthrough/engine';

type Phase = 'idle' | 'loading' | 'live' | 'unsupported';

const DEFAULT_STATE: EngineState = { mode: 'outside', level: null, explode: false, time: 'day', preset: 'open', touring: false, tourIndex: 0 };

interface PlanShape {
  box: string;
  outline: string;
  plate: string;
  bay: { x: number; y: number; w: number; h: number };
  lobby: { x: number; y: number; w: number; h: number };
  cols: { x: number; y: number }[];
  stair: { x: number; y: number; w: number; h: number };
}

/**
 * Interactive 3D model of the building. The engine (Three.js) is a separate lazy chunk: nothing is downloaded until the
 * section is opened. Without WebGL, or on request of a data-saver, the visitor sees a still render and the 2D plans instead.
 */
@Component({
  selector: 'app-walkthrough',
  templateUrl: './walkthrough.component.html',
  styleUrls: ['./walkthrough.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalkthroughComponent implements AfterViewInit, OnDestroy {
  /** `embed` on the home page, `page` on /walkthrough (taller, loads at once). */
  @Input() variant: 'embed' | 'page' = 'embed';

  @ViewChild('stage', { static: true }) stageRef!: ElementRef<HTMLElement>;
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLElement>;
  @ViewChild('marker') markerRef?: ElementRef<SVGGElement>;
  @ViewChild('planSvg') planRef?: ElementRef<SVGSVGElement>;

  phase: Phase = 'idle';
  state: EngineState = { ...DEFAULT_STATE };
  tourStop: TourStop | null = null;
  tourTotal = TOUR.length;
  immersive = false;
  showPlan = true;
  hintDismissed = false;
  loadError = '';

  levels = LEVELS;
  levelsDesc = [...LEVELS].reverse();
  tourDots = TOUR.map((_, i) => i);
  presets = PRESETS;
  times = TIMES;
  waypoints = WAYPOINTS;
  note = WALKTHROUGH_NOTE;
  plan: PlanShape = this.buildPlan(1);

  private engine?: Engine;
  private io?: IntersectionObserver;
  private destroyed = false;
  private poseMarker?: SVGGElement;

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef, public analytics: AnalyticsService) {}

  /* ── lifecycle ──────────────────────────────────────────────────────────── */

  ngAfterViewInit(): void {
    this.showPlan = matchMedia('(min-width: 640px)').matches;
    this.hostRef.nativeElement.setAttribute('tabindex', '0');
    if (this.variant === 'page') { this.start(); return; }
    // desktop with a fast connection: start when the section is on screen; phones and data-savers wait for a tap
    if (this.canAutoStart() && typeof IntersectionObserver !== 'undefined') {
      this.zone.runOutsideAngular(() => {
        this.io = new IntersectionObserver((es) => {
          if (es.some((e) => e.isIntersecting)) { this.io?.disconnect(); this.zone.run(() => this.start()); }
        }, { threshold: 0.35 });
        this.io.observe(this.stageRef.nativeElement);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.io?.disconnect();
    this.setBodyLock(false);
    this.engine?.dispose();
    this.engine = undefined;
  }

  private canAutoStart(): boolean {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
    if (nav.connection?.saveData) return false;
    if (/(^|-)2g$/.test(nav.connection?.effectiveType ?? '')) return false;
    return matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  private webglOk(): boolean {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch { return false; }
  }

  /* ── start ──────────────────────────────────────────────────────────────── */

  async start(): Promise<void> {
    if (this.phase === 'loading' || this.phase === 'live') return;
    if (!this.webglOk()) { this.phase = 'unsupported'; this.cdr.markForCheck(); return; }
    this.phase = 'loading';
    this.loadError = '';
    this.cdr.markForCheck();
    this.analytics.event('walkthrough_start', { variant: this.variant });
    try {
      const mod = await import('../../walkthrough/engine');
      if (this.destroyed) return;
      const nav = navigator as Navigator & { deviceMemory?: number };
      const lowPower = matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
      const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.engine = await this.zone.runOutsideAngular(() => mod.createEngine({
        host: this.hostRef.nativeElement,
        reduceMotion,
        lowPower,
        hooks: {
          onState: (s) => this.zone.run(() => { this.state = s; this.syncPlan(); this.cdr.markForCheck(); }),
          onPose: (p) => this.onPose(p),
          onTour: (stop) => this.zone.run(() => { this.tourStop = stop; this.cdr.markForCheck(); }),
        },
      }));
      if (this.destroyed) { this.engine.dispose(); this.engine = undefined; return; }
      this.phase = 'live';
      this.cdr.markForCheck();
      this.zone.runOutsideAngular(() => this.engine?.start());
      if (new URLSearchParams(location.search).has('wtdebug')) (window as unknown as { __wt: Engine }).__wt = this.engine;
    } catch (err) {
      this.phase = 'unsupported';
      this.loadError = err instanceof Error ? err.message : 'The 3D view could not start.';
      this.cdr.markForCheck();
    }
  }

  /* ── controls ───────────────────────────────────────────────────────────── */

  get inside(): boolean { return this.state.mode === 'inside'; }
  get activeLevelLabel(): string { return this.state.level === null ? 'Whole building' : LEVELS[this.state.level].label; }
  get activePresetNote(): string { return PRESETS.find((p) => p.id === this.state.preset)?.note ?? ''; }
  get canPreset(): boolean { return this.state.level !== null && this.state.level > 0; }
  get hint(): string {
    if (this.inside) return 'Move to look · drag to turn · click the floor to walk · W A S D to move';
    return 'Move your mouse to look · drag to orbit · click a floor to open it';
  }
  get hintTouch(): string {
    return this.inside ? 'Drag to look · tap the floor to walk' : 'Swipe sideways to orbit · tap ⤢ for full screen';
  }

  setMode(m: 'outside' | 'inside'): void {
    this.engine?.setMode(m, m === 'inside' ? (this.state.level ?? 1) : null);
    this.analytics.event('walkthrough_mode', { mode: m });
  }

  setLevel(l: LevelId | null): void {
    this.engine?.setLevel(l);
    this.analytics.event('walkthrough_floor', { level: l ?? 'all' });
  }

  toggleExplode(): void { this.engine?.setExplode(!this.state.explode); this.analytics.event('walkthrough_explode'); }
  setTime(t: TimeOfDay): void { this.engine?.setTime(t); this.analytics.event('walkthrough_time', { time: t }); }
  setPreset(p: Preset): void { this.engine?.setPreset(p); this.analytics.event('walkthrough_layout', { layout: p }); }
  goTo(id: string): void { this.engine?.goTo(id); }
  turn(d: 1 | -1): void { this.engine?.turn(d); }
  zoom(d: 1 | -1): void { this.engine?.zoom(d); }
  reset(): void { this.engine?.resetView(); }

  toggleTour(): void {
    if (this.state.touring) this.engine?.stopTour();
    else { this.engine?.startTour(); this.analytics.event('walkthrough_tour'); }
  }
  tourStep(d: 1 | -1): void { this.engine?.nextTour(d); }

  levelAvailable(wpLevels: LevelId[]): boolean { return this.state.level !== null && wpLevels.includes(this.state.level); }

  /** Floors the tap on the plan inset can reach. */
  planClick(ev: MouseEvent): void {
    const svg = this.planRef?.nativeElement;
    if (!svg || !this.engine) return;
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    this.engine.walkTo(p.x, p.y);
  }

  /* ── full screen ────────────────────────────────────────────────────────── */

  toggleImmersive(): void { this.setImmersive(!this.immersive); }

  private setImmersive(on: boolean): void {
    this.immersive = on;
    this.engine?.setImmersive(on);
    this.setBodyLock(on);
    const el = this.stageRef.nativeElement;
    if (on) { void el.requestFullscreen?.().catch(() => undefined); }
    else if (document.fullscreenElement) { void document.exitFullscreen().catch(() => undefined); }
    this.analytics.event('walkthrough_fullscreen', { on });
    this.cdr.markForCheck();
  }

  private setBodyLock(on: boolean): void { document.documentElement.classList.toggle('wt-lock', on); }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (!document.fullscreenElement && this.immersive && this.stageRef.nativeElement.dataset['fs'] === '1') this.setImmersive(false);
    this.stageRef.nativeElement.dataset['fs'] = document.fullscreenElement ? '1' : '0';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.immersive) this.setImmersive(false); }

  /* ── plan inset ─────────────────────────────────────────────────────────── */

  private onPose(p: Pose): void {
    if (p.mode !== 'inside') return;
    const m = this.poseMarker ?? (this.poseMarker = this.markerRef?.nativeElement);
    if (!m) return;
    m.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.z.toFixed(2)}) rotate(${((p.yaw * 180) / Math.PI).toFixed(1)})`);
  }

  private syncPlan(): void {
    const kind = (this.state.level ?? 1) === 0 ? 0 : 1;
    if (kind !== this.planKind) { this.planKind = kind; this.plan = this.buildPlan(kind); }
  }
  private planKind: 0 | 1 = 1;

  private buildPlan(kind: 0 | 1): PlanShape {
    const b = BUILDING;
    const o = plateOutline();
    const zone = b.zone;
    const parking = kind === 0;
    const pts = parking ? [[zone.x0, zone.z0], [zone.x1, zone.z0], [zone.x1, zone.z1], [zone.x0, zone.z1]] : o;
    const d = (arr: number[][]) => arr.map(([x, z], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${z.toFixed(2)}`).join(' ') + ' Z';
    const cols: { x: number; y: number }[] = [];
    for (const r of [b.rows[0] + 1, b.rows[6] - 1]) for (const c of [b.cols.A, b.cols.B, b.cols.C]) cols.push({ x: c, y: r });
    for (let i = 1; i <= 5; i++) cols.push({ x: b.cols.A, y: b.rows[i] });
    return {
      box: '-3 -7 55.5 126',
      outline: `M0 0 H${b.plot.w} V${b.plot.d} H0 Z`,
      plate: d(pts),
      bay: { x: b.bay.x0, y: b.bay.z0, w: b.bay.x1 - b.bay.x0, h: b.bay.z1 - b.bay.z0 },
      lobby: { x: b.bay.x0 - 0.4, y: b.lobby.z0, w: 0.8, h: b.lobby.z1 - b.lobby.z0 },
      cols,
      stair: { x: STAIR_HOLE.x0, y: STAIR_HOLE.z0, w: STAIR_HOLE.x1 - STAIR_HOLE.x0, h: STAIR_HOLE.z1 - STAIR_HOLE.z0 },
    };
  }

  trackLevel(_: number, l: { id: number }): number { return l.id; }
}
