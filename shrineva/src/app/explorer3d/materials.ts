import { Color, DoubleSide, MeshStandardMaterial, Texture } from 'three';
import { asphaltTexture, concreteTexture, glowTexture, jaliTexture, signTexture, tileTexture } from './textures';

/** Textures shared by every material set. Created once, disposed with the scene. */
export class SharedTextures {
  floor: Texture = tileTexture('#d9cdb5', '#b9aa8c', 2, 7);
  paving: Texture = tileTexture('#cdc4b2', '#a99e8a', 2, 10);
  concrete: Texture = concreteTexture();
  jali: Texture = jaliTexture();
  crown: Texture = signTexture('SHRINEVA', 9);
  board: Texture = signTexture('SHRINEVA  ·  BADA LALPUR', 16);
  asphalt: Texture = asphaltTexture();
  glow: Texture = glowTexture();

  constructor() {
    // one tile cell is about 1.2 m, the way large-format stone is laid
    for (const t of [this.floor, this.paving, this.concrete]) t.repeat.set(1 / 2.4, 1 / 2.4);
    this.asphalt.repeat.set(10, 10);
  }

  dispose(): void {
    [this.floor, this.paving, this.concrete, this.jali, this.crown, this.board, this.asphalt, this.glow].forEach((t) => t.dispose());
  }
}

const std = (o: ConstructorParameters<typeof MeshStandardMaterial>[0]): MeshStandardMaterial => new MeshStandardMaterial(o);

/**
 * Every material one part of the building uses. Each level gets its own sets so its parts can fade independently when the level is
 * lifted away (fade 1 = solid, 0 = gone). Colours follow the front-elevation render: charcoal bands, glass with dark fins, a brass
 * jali screen, sandstone walls.
 */
export class MatSet {
  floor: MeshStandardMaterial;
  slabEdge = std({ color: '#b6afa1', roughness: 0.95, metalness: 0 });
  wall = std({ color: '#c4a67c', roughness: 0.92, metalness: 0 });
  wallInner = std({ color: '#e9e0cd', roughness: 0.92, metalness: 0 });
  cladding = std({ color: '#d8c19b', roughness: 0.9, metalness: 0 });
  column = std({ color: '#a39a8a', roughness: 0.85, metalness: 0.02 });
  step = std({ color: '#c4bba9', roughness: 0.9, metalness: 0 });
  charcoal = std({ color: '#26221f', roughness: 0.5, metalness: 0.3 });
  frame = std({ color: '#201c19', roughness: 0.45, metalness: 0.6 });
  fin = std({ color: '#43362b', roughness: 0.6, metalness: 0.05 });
  brass = std({ color: '#c9a15a', roughness: 0.32, metalness: 0.85 });
  glass = std({ color: '#9ec2d8', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.3, depthWrite: false, emissive: new Color('#ffcf85'), emissiveIntensity: 0.2 });
  liftGlass = std({ color: '#b3d9e8', roughness: 0.04, metalness: 0.15, transparent: true, opacity: 0.24, depthWrite: false, side: DoubleSide });
  exit = std({ color: '#15934f', roughness: 0.5, metalness: 0.1, emissive: new Color('#15934f'), emissiveIntensity: 0.7 });
  jali: MeshStandardMaterial;
  crown: MeshStandardMaterial;
  board: MeshStandardMaterial;
  paving: MeshStandardMaterial;
  structure: MeshStandardMaterial;
  coping = std({ color: '#2b2622', roughness: 0.7, metalness: 0.1 });
  roofTop = std({ color: '#8f8a82', roughness: 1, metalness: 0 });

  private base = new Map<MeshStandardMaterial, { o: number; t: boolean; d: boolean }>();

  constructor(tex: SharedTextures) {
    this.floor = std({ map: tex.floor, roughness: 0.72, metalness: 0.02 });
    this.jali = std({ map: tex.jali, roughness: 0.5, metalness: 0.35, side: DoubleSide, emissive: new Color('#7a5420'), emissiveIntensity: 0.25 });
    this.crown = std({ map: tex.crown, roughness: 0.5, metalness: 0.25, emissive: new Color('#c9a15a'), emissiveMap: tex.crown, emissiveIntensity: 0.55 });
    this.board = std({ map: tex.board, roughness: 0.5, metalness: 0.25, emissive: new Color('#c9a15a'), emissiveMap: tex.board, emissiveIntensity: 0.5 });
    this.paving = std({ map: tex.paving, roughness: 0.85, metalness: 0 });
    this.structure = std({ map: tex.concrete, roughness: 0.8, metalness: 0.02 });
    this.all().forEach((m) => this.base.set(m, { o: m.opacity, t: m.transparent, d: m.depthWrite }));
  }

  all(): MeshStandardMaterial[] {
    return Object.values(this).filter((v): v is MeshStandardMaterial => v instanceof MeshStandardMaterial);
  }

  /** 1 = as designed, 0 = invisible. Opacity is multiplied into each material's own, and depth writing stops while it is see-through. */
  setFade(v: number): void {
    const solid = v > 0.995;
    this.base.forEach((b, m) => {
      m.opacity = b.o * v;
      m.transparent = b.t || !solid;
      m.depthWrite = b.d && solid;
    });
  }

  dispose(): void { this.all().forEach((m) => m.dispose()); }
}
