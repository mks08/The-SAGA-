import {
  AdditiveBlending, BackSide, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, Color, CylinderGeometry, Fog, Group,
  InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Object3D, OctahedronGeometry, PlaneGeometry, Points, PointsMaterial,
  Scene, ShaderMaterial, SphereGeometry, Sprite, SpriteMaterial, TorusGeometry, Vector3, SRGBColorSpace,
} from 'three';
import { BUILDING } from '../../config/building.config';
import { Mats } from './materials';
import { tree } from './model';

export type TimeKey = 'day' | 'golden' | 'night';

export interface TimeSet {
  skyTop: string; skyHorizon: string; skyBottom: string;
  fog: string; fogNear: number; fogFar: number;
  sun: { color: string; intensity: number; pos: [number, number, number] };
  hemi: { sky: string; ground: string; intensity: number };
  exposure: number; env: number;
  glassGlow: number; strips: number; interiorLight: number; lamps: number; stars: number; plaque: number;
}

export const TIME_SETS: Record<TimeKey, TimeSet> = {
  day: {
    skyTop: '#5f9bd8', skyHorizon: '#e3edf4', skyBottom: '#cfc8b8', fog: '#dbe6ee', fogNear: 80, fogFar: 340,
    sun: { color: '#fff1d6', intensity: 3.1, pos: [26, 38, -30] },
    hemi: { sky: '#d3e5f6', ground: '#d8ccb6', intensity: 1.05 },
    exposure: 1.0, env: 0.55, glassGlow: 0, strips: 0.45, interiorLight: 2.5, lamps: 0, stars: 0, plaque: 0.04,
  },
  golden: {
    skyTop: '#4f6fa8', skyHorizon: '#f4c28c', skyBottom: '#85705c', fog: '#e9cba7', fogNear: 60, fogFar: 300,
    sun: { color: '#ffb46e', intensity: 3.6, pos: [-38, 13, -28] },
    hemi: { sky: '#f1cba4', ground: '#6f5c4a', intensity: 0.75 },
    exposure: 0.98, env: 0.4, glassGlow: 0.1, strips: 0.9, interiorLight: 7, lamps: 0.35, stars: 0, plaque: 0.2,
  },
  night: {
    skyTop: '#0a1230', skyHorizon: '#2c375b', skyBottom: '#14141c', fog: '#171c34', fogNear: 45, fogFar: 230,
    sun: { color: '#a6b9ff', intensity: 0.55, pos: [-12, 32, -30] },
    hemi: { sky: '#3d4d7e', ground: '#1c1c26', intensity: 0.4 },
    exposure: 0.95, env: 0.14, glassGlow: 0.55, strips: 2.4, interiorLight: 34, lamps: 1.7, stars: 1, plaque: 1.0,
  },
};

export interface LabelDef {
  id: string;
  title: string;
  sub?: string;
  pos: Vector3;
  /** Show only in these modes. */
  modes: ('outside' | 'inside')[];
  /** Clamp to the screen edge with an arrow when off screen. */
  edge?: boolean;
  /** Fade out beyond this distance (m). */
  maxDist?: number;
  /** Anchor label (brass) vs. plain label. */
  kind: 'anchor' | 'plain';
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function skyMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { top: { value: new Color() }, horizon: { value: new Color() }, bottom: { value: new Color() } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vDir;
      void main(){ float h = vDir.y; vec3 c = h > 0.0 ? mix(horizon, top, pow(clamp(h, 0.0, 1.0), 0.5)) : mix(horizon, bottom, pow(clamp(-h, 0.0, 1.0), 0.5));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
    side: BackSide, depthWrite: false, fog: false,
  });
}

function glowTex(): CanvasTexture {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,230,180,1)'); g.addColorStop(0.35, 'rgba(255,200,120,0.45)'); g.addColorStop(1, 'rgba(255,190,100,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace;
  return t;
}

interface Mover { obj: Object3D; vx: number; wrap: number; bob?: number; phase: number }

/** Sky, ground, road, neighbours, trees, traffic, people, street lights and the Apollo / NIFT markers. */
export class World {
  readonly group = new Group();
  readonly labels: LabelDef[] = [];
  private sky = skyMaterial();
  private stars!: Points;
  private lamps: SpriteMaterial[] = [];
  private movers: Mover[] = [];
  private disposables: { dispose(): void }[] = [];
  private markerRings: Mesh[] = [];
  private reduce: boolean;

  constructor(private m: Mats, private scene: Scene, reduceMotion: boolean) {
    this.reduce = reduceMotion;
    const skyMesh = new Mesh(new SphereGeometry(520, 24, 16), this.sky);
    skyMesh.renderOrder = -10;
    this.group.add(skyMesh);
    this.disposables.push(skyMesh.geometry, this.sky);
    this.buildStars();
    this.buildGround();
    this.buildRoad();
    this.buildNeighbours();
    this.buildTrees();
    this.buildTraffic();
    this.buildPeople();
    this.buildLamps();
    this.buildMarkers();
    scene.add(this.group);
  }

  private buildStars(): void {
    const n = 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random(), v = Math.random() * 0.9 + 0.08;
      const th = u * Math.PI * 2, ph = Math.acos(1 - v);
      pos[i * 3] = 500 * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = 500 * Math.cos(ph);
      pos[i * 3 + 2] = 500 * Math.sin(ph) * Math.sin(th);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    this.stars = new Points(g, new PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    this.group.add(this.stars);
    this.disposables.push(g, this.stars.material as PointsMaterial);
  }

  private buildGround(): void {
    const ground = new Mesh(new PlaneGeometry(900, 900), this.m.ground);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true;
    this.group.add(ground);
    this.disposables.push(ground.geometry);
  }

  private buildRoad(): void {
    const m = this.m;
    const L = 700;
    const zNear = -2.6, zFar = zNear - BUILDING.plot.roadWidthM;
    const road = new Mesh(new PlaneGeometry(L, BUILDING.plot.roadWidthM), m.asphalt);
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0, (zNear + zFar) / 2); road.receiveShadow = true;
    this.group.add(road);
    // footpaths
    const fp = (zc: number, w: number) => {
      const p = new Mesh(new BoxGeometry(L, 0.14, w), m.footpath);
      p.position.set(0, 0.07, zc); p.receiveShadow = true; p.castShadow = false;
      this.group.add(p); this.disposables.push(p.geometry);
    };
    fp(zNear / 2 - 0.0, Math.abs(zNear) + 0.0);
    fp(zFar - 1.3, 2.6);
    // dashed centre line and edge lines
    const zc = (zNear + zFar) / 2;
    const dash = new InstancedMesh(new BoxGeometry(3, 0.02, 0.18), m.roadLine, 90);
    const mat4 = new Matrix4();
    for (let i = 0; i < 90; i++) { mat4.makeTranslation(-L / 2 + 4 + i * 7.8, 0.015, zc); dash.setMatrixAt(i, mat4); }
    this.group.add(dash);
    const edge = (z: number) => {
      const e = new Mesh(new PlaneGeometry(L, 0.14), m.roadLine);
      e.rotation.x = -Math.PI / 2; e.position.set(0, 0.012, z);
      this.group.add(e); this.disposables.push(e.geometry);
    };
    edge(zNear - 0.45); edge(zFar + 0.45);
    this.disposables.push(dash.geometry, road.geometry);
  }

  private block(x0: number, x1: number, z0: number, z1: number, h: number, warm = false): void {
    const m = this.m;
    const body = new Mesh(new BoxGeometry(x1 - x0, h, z1 - z0), warm ? m.neighbourWarm : m.neighbour);
    body.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    body.castShadow = true; body.receiveShadow = true;
    this.group.add(body);
    this.disposables.push(body.geometry);
    // window bands on the road-facing side, one per storey
    const storeys = Math.max(1, Math.round(h / 3.4));
    for (let s = 0; s < storeys; s++) {
      const band = new Mesh(new BoxGeometry((x1 - x0) * 0.82, 1.05, 0.06), m.neighbourWin);
      band.position.set((x0 + x1) / 2, 1.9 + s * 3.3, z0 - 0.02);
      this.group.add(band);
      this.disposables.push(band.geometry);
    }
    const cap = new Mesh(new BoxGeometry(x1 - x0 + 0.3, 0.2, z1 - z0 + 0.3), m.concrete);
    cap.position.set((x0 + x1) / 2, h + 0.1, (z0 + z1) / 2); cap.castShadow = true;
    this.group.add(cap);
    this.disposables.push(cap.geometry);
  }

  private buildNeighbours(): void {
    const half = BUILDING.plot.w * BUILDING.ft / 2;
    // beside the plot
    this.block(-half - 17.5, -half - 0.35, 0.4, 22, 6.8, true);
    this.block(-half - 40, -half - 19, -0.5, 18, 6.6);
    this.block(half + 0.4, half + 14, 1.0, 20, 7.6);
    this.block(half + 16, half + 36, -0.3, 22, 7.2, true);
    this.block(half + 38, half + 62, 0.5, 20, 8.4);
    this.block(-half - 66, -half - 42, 0.5, 20, 7.6, true);
    // behind
    this.block(-20, 18, 38, 60, 8.4);
    this.block(24, 48, 30, 52, 10.4, true);
    this.block(-48, -26, 32, 54, 6.8);
    this.block(-12, 14, 66, 84, 11);
    // low shops across the road, far side
    this.block(-70, -52, -40, -33, 4.2, true);
    this.block(-26, -8, -41, -34, 3.6);
    this.block(18, 38, -40, -33.5, 4.4, true);
    this.block(60, 84, -42, -34, 3.8);
  }

  private buildTrees(): void {
    const half = BUILDING.plot.w * BUILDING.ft / 2;
    const xs = [-52, -40, -30, -22, -14, 14, 22, 32, 46, 56];
    for (const x of xs) {
      if (Math.abs(x) < half + 1) continue;
      this.group.add(tree(this.m, x, -1.5, rand(4.6, 6)));
    }
    for (let x = -72; x <= 72; x += 14) this.group.add(tree(this.m, x + rand(-3, 3), -28.8, rand(4.4, 6)));
    for (const [x, z] of [[-34, 26], [30, 26], [-30, 62], [36, 58], [0, 34]]) this.group.add(tree(this.m, x, z, rand(5, 7)));
  }

  private buildTraffic(): void {
    const m = this.m;
    const palette = ['#e9e7e1', '#b9bec4', '#2c3a55', '#8c2f2a', '#c9b99a', '#4a4f55', '#f1efe8'];
    for (let i = 0; i < 10; i++) {
      const g = new Group();
      const mat = new MeshStandardMaterial({ color: palette[i % palette.length], roughness: 0.4, metalness: 0.5 });
      const body = new Mesh(new BoxGeometry(4.2, 0.85, 1.75), mat); body.position.y = 0.65; body.castShadow = true;
      const cab = new Mesh(new BoxGeometry(2.2, 0.7, 1.55), m.glassPartition); cab.position.set(-0.2, 1.4, 0);
      const roof = new Mesh(new BoxGeometry(2.0, 0.08, 1.6), mat); roof.position.set(-0.2, 1.77, 0);
      const h1 = new Mesh(new BoxGeometry(0.06, 0.16, 0.34), m.headlight); h1.position.set(2.1, 0.7, 0.55);
      const h2 = h1.clone(); h2.position.z = -0.55;
      g.add(body, cab, roof, h1, h2);
      // left-hand traffic: the lanes nearer the plot run west, the far lanes run east
      const westward = i % 2 === 0;
      const z = westward ? (i % 4 === 0 ? -6.9 : -9.2) : (i % 4 === 1 ? -16.3 : -18.7);
      g.position.set(rand(-90, 90), 0.02, z);
      g.rotation.y = westward ? Math.PI : 0;
      this.group.add(g);
      this.movers.push({ obj: g, vx: (westward ? -1 : 1) * rand(3.5, 7), wrap: 100, phase: 0 });
      this.disposables.push(mat, body.geometry);
    }
  }

  private buildPeople(): void {
    const m = this.m;
    const clothes = ['#7a3b2e', '#2f4a5c', '#d8cfae', '#3c3c3c', '#8a6a2a', '#5a2d57', '#e9e1d3'];
    // x, y, z, walking speed (0 = standing). The first six use the footpath; the last two stand by the east entry.
    const spots: [number, number, number, number][] = [
      [-18, 0.14, -1.0, 1.0], [-9, 0.14, -1.6, -0.9], [6, 0.14, -1.2, 1.1], [16, 0.14, -1.7, -1.0], [28, 0.14, -1.1, 0.8], [-30, 0.14, -1.6, 0.9],
      [6.4, 0, 3.2, 0], [7.4, 0, 3.8, 0],
    ];
    spots.forEach(([x, y, z, v], i) => {
      const g = new Group();
      const mat = new MeshStandardMaterial({ color: clothes[i % clothes.length], roughness: 0.9 });
      const body = new Mesh(new CylinderGeometry(0.2, 0.24, 0.95, 8), mat); body.position.y = 1.0; body.castShadow = true;
      const legs = new Mesh(new CylinderGeometry(0.13, 0.14, 0.62, 8), m.fabric); legs.position.y = 0.31;
      const head = new Mesh(new SphereGeometry(0.14, 10, 8), m.skin); head.position.y = 1.62;
      g.add(body, legs, head);
      g.position.set(x, y, z);
      this.group.add(g);
      if (v !== 0) this.movers.push({ obj: g, vx: v, wrap: 46, bob: 0.03, phase: i });
      this.disposables.push(mat, body.geometry);
    });
  }

  private buildLamps(): void {
    const tex = glowTex();
    this.disposables.push(tex);
    for (let x = -66; x <= 66; x += 22) {
      const pole = new Mesh(new CylinderGeometry(0.07, 0.1, 7.2, 8), this.m.frame);
      pole.position.set(x, 3.6, -2.5);
      const arm = new Mesh(new BoxGeometry(0.06, 0.06, 2.2), this.m.frame);
      arm.position.set(x, 7.1, -3.5);
      const bulb = new Mesh(new BoxGeometry(0.5, 0.1, 0.25), this.m.bulb);
      bulb.position.set(x, 7.02, -4.5);
      const mat = new SpriteMaterial({ map: tex, color: '#ffd9a0', blending: AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, fog: false });
      const spr = new Sprite(mat); spr.scale.set(7, 7, 1); spr.position.set(x, 6.9, -4.5);
      this.group.add(pole, arm, bulb, spr);
      this.lamps.push(mat);
      this.disposables.push(pole.geometry, mat);
    }
  }

  /** Apollo and NIFT: a ground ring and a slim beam, not a building. The real buildings are not drawn because no design is published. */
  private buildMarkers(): void {
    const origin = new Vector3(0, 0, 8);
    for (const a of BUILDING.anchors) {
      const rad = (a.bearing * Math.PI) / 180;
      const p = new Vector3(origin.x + a.metres * Math.sin(rad), 0, origin.z - a.metres * Math.cos(rad));
      const ring = new Mesh(new TorusGeometry(6, 0.14, 8, 48), this.m.marker);
      ring.rotation.x = Math.PI / 2; ring.position.set(p.x, 0.2, p.z);
      const beam = new Mesh(new CylinderGeometry(0.08, 0.08, 26, 8), this.m.marker);
      beam.position.set(p.x, 13, p.z);
      const gem = new Mesh(new OctahedronGeometry(0.6), this.m.marker);
      gem.position.set(p.x, 26.8, p.z);
      this.group.add(ring, beam, gem);
      this.markerRings.push(ring, gem);
      this.labels.push({ id: a.id, title: a.label, sub: a.sub, pos: new Vector3(p.x, 27.8, p.z), modes: ['outside', 'inside'], maxDist: 180, kind: 'anchor' });
      this.disposables.push(ring.geometry, beam.geometry, gem.geometry);
    }
    this.labels.push({
      id: 'trade', title: BUILDING.tradeCentre.label, sub: BUILDING.tradeCentre.sub,
      pos: new Vector3(-120, 6, -14.5), modes: ['outside'], edge: true, kind: 'anchor',
    });
    this.labels.push({ id: 'road', title: '24 m road', pos: new Vector3(0, 0.4, -14.5), modes: ['outside'], maxDist: 90, kind: 'plain' });
  }

  setTime(key: TimeKey): TimeSet {
    const t = TIME_SETS[key];
    const u = this.sky.uniforms as Record<string, { value: Color }>;
    u['top'].value.set(t.skyTop); u['horizon'].value.set(t.skyHorizon); u['bottom'].value.set(t.skyBottom);
    this.scene.fog = new Fog(t.fog, t.fogNear, t.fogFar);
    (this.stars.material as PointsMaterial).opacity = t.stars;
    this.lamps.forEach((l) => (l.opacity = Math.min(1, t.lamps * 0.6)));
    this.m.bulb.emissiveIntensity = 0.3 + t.lamps * 1.2;
    this.m.headlight.emissiveIntensity = 0.2 + t.lamps * 2;
    return t;
  }

  update(dt: number, time: number): void {
    for (const r of this.markerRings) r.rotation.z = time * 0.6;
    if (this.reduce) return;
    for (const mv of this.movers) {
      mv.obj.position.x += mv.vx * dt;
      if (mv.obj.position.x > mv.wrap) mv.obj.position.x = -mv.wrap;
      if (mv.obj.position.x < -mv.wrap) mv.obj.position.x = mv.wrap;
      if (mv.bob) mv.obj.position.y = 0.14 + Math.abs(Math.sin(time * 5 + mv.phase)) * mv.bob;
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.scene.remove(this.group);
  }
}
