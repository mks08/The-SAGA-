import { Color, DoubleSide, MeshStandardMaterial, Texture } from 'three';
import { asphaltTexture, ghatTexture, graniteTexture, jaaliTexture, jaliStoneTexture, rippleTexture, signTexture, tileTexture, timberTexture, warmGlowTexture, waterfallTexture } from './textures';

/** Every material the model uses, created once. Colours follow the façade renders: cream stone, taupe spine, copper screens, brass. */
export class Mats {
  cream = new MeshStandardMaterial({ color: '#e7dfd0', roughness: 0.92, metalness: 0 });
  creamWarm = new MeshStandardMaterial({ color: '#d8c8ac', roughness: 0.9, metalness: 0 });
  taupe = new MeshStandardMaterial({ color: '#8d7c6b', roughness: 0.85, metalness: 0 });
  concrete = new MeshStandardMaterial({ color: '#b9b2a6', roughness: 0.95, metalness: 0 });
  ceiling = new MeshStandardMaterial({ color: '#f4efe6', roughness: 0.95, metalness: 0, side: DoubleSide, emissive: new Color('#efe7d8'), emissiveIntensity: 0.38 });
  roofTop = new MeshStandardMaterial({ color: '#8f8a82', roughness: 1, metalness: 0 });
  frame = new MeshStandardMaterial({ color: '#2f2822', roughness: 0.45, metalness: 0.6 });
  brass = new MeshStandardMaterial({ color: '#c9a15a', roughness: 0.32, metalness: 0.85 });
  liftDoor = new MeshStandardMaterial({ color: '#4a3f35', roughness: 0.35, metalness: 0.7 });
  wood = new MeshStandardMaterial({ color: '#8a5a33', roughness: 0.65, metalness: 0 });
  woodDark = new MeshStandardMaterial({ color: '#4d3626', roughness: 0.6, metalness: 0 });
  laminate = new MeshStandardMaterial({ color: '#ebe6dc', roughness: 0.55, metalness: 0 });
  fabric = new MeshStandardMaterial({ color: '#3a3733', roughness: 0.9, metalness: 0 });
  fabricTeal = new MeshStandardMaterial({ color: '#3e6b73', roughness: 0.9, metalness: 0 });
  green = new MeshStandardMaterial({ color: '#4c7a49', roughness: 0.95, metalness: 0 });
  greenDark = new MeshStandardMaterial({ color: '#2d5a34', roughness: 0.95, metalness: 0 });
  trunk = new MeshStandardMaterial({ color: '#5b4331', roughness: 1, metalness: 0 });
  skin = new MeshStandardMaterial({ color: '#c79a76', roughness: 0.9, metalness: 0 });
  neighbour = new MeshStandardMaterial({ color: '#e6dccb', roughness: 1, metalness: 0 });
  neighbourWarm = new MeshStandardMaterial({ color: '#d6c3a5', roughness: 1, metalness: 0 });
  neighbourWin = new MeshStandardMaterial({ color: '#7f8d98', roughness: 0.3, metalness: 0.1 });

  /* ground-floor walls: Varanasi sandstone tones, lit niches, planting */
  sandstone = new MeshStandardMaterial({ color: '#cdb088', roughness: 0.9, metalness: 0 });
  sandstoneDark = new MeshStandardMaterial({ color: '#a98a5f', roughness: 0.92, metalness: 0 });
  sandstoneLight = new MeshStandardMaterial({ color: '#e0cfae', roughness: 0.88, metalness: 0 });
  stoneTread = new MeshStandardMaterial({ color: '#ddd4c2', roughness: 0.55, metalness: 0.04 });
  soil = new MeshStandardMaterial({ color: '#4a3a2c', roughness: 1, metalness: 0 });
  leafLight = new MeshStandardMaterial({ color: '#6f9c57', roughness: 0.95, metalness: 0 });
  /** Warm light behind niches and jali: emissive level is driven by time of day. */
  glowTex: Texture = warmGlowTexture();
  glowWarm = new MeshStandardMaterial({ map: this.glowTex, color: '#ffffff', emissive: new Color('#ffffff'), emissiveMap: this.glowTex, emissiveIntensity: 0.35, roughness: 0.6 });
  lampGlow = new MeshStandardMaterial({ color: '#fff0cf', emissive: new Color('#ffd187'), emissiveIntensity: 0.5, roughness: 0.4 });

  glass = new MeshStandardMaterial({ color: '#86aec6', roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.36, depthWrite: false, emissive: new Color('#ffcf85'), emissiveIntensity: 0 });
  glassPartition = new MeshStandardMaterial({ color: '#b9d6e0', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false });
  /** Ceiling light strips and shop-front glow: emissive intensity is driven by time of day. */
  strip = new MeshStandardMaterial({ color: '#fff4dc', emissive: new Color('#fff1d0'), emissiveIntensity: 0.5, roughness: 0.4 });
  bulb = new MeshStandardMaterial({ color: '#ffe3ad', emissive: new Color('#ffd58a'), emissiveIntensity: 0.4 });
  plaqueGlow = new MeshStandardMaterial({ color: '#c9a15a', emissive: new Color('#c9a15a'), emissiveIntensity: 0.1, roughness: 0.4, metalness: 0.6 });
  headlight = new MeshStandardMaterial({ color: '#fff', emissive: new Color('#fff0cc'), emissiveIntensity: 0.2 });
  marker = new MeshStandardMaterial({ color: '#e8cf96', emissive: new Color('#e8cf96'), emissiveIntensity: 0.9, transparent: true, opacity: 0.55, depthWrite: false });

  floorTex: Texture = tileTexture('#e3dccd', '#c4b9a5', 2);
  pavingTex: Texture = tileTexture('#cfc6b4', '#aa9f8b', 2);
  timberTex: Texture = timberTexture();
  jaaliTex: Texture = jaaliTexture();
  asphaltTex: Texture = asphaltTexture();
  signTex: Texture = signTexture('SHRINEVA', false);
  ghatTex: Texture = ghatTexture();
  jaliStoneTex: Texture = jaliStoneTexture();
  liftSignTex: Texture = signTexture('LIFT', false);
  stairSignTex: Texture = signTexture('STAIRS', false);

  floor = new MeshStandardMaterial({ map: this.floorTex, roughness: 0.42, metalness: 0.05 });
  paving = new MeshStandardMaterial({ map: this.pavingTex, roughness: 0.85, metalness: 0 });
  timber = new MeshStandardMaterial({ map: this.timberTex, roughness: 0.7, metalness: 0 });
  jaali = new MeshStandardMaterial({ map: this.jaaliTex, roughness: 0.6, metalness: 0.25, side: DoubleSide });
  sign = new MeshStandardMaterial({ map: this.signTex, roughness: 0.5, metalness: 0.2, emissive: new Color('#c9a15a'), emissiveMap: this.signTex, emissiveIntensity: 0.05 });
  asphalt = new MeshStandardMaterial({ map: this.asphaltTex, roughness: 0.95, metalness: 0 });
  ghat = new MeshStandardMaterial({ map: this.ghatTex, roughness: 0.85, metalness: 0, emissive: new Color('#ffcf8a'), emissiveMap: this.ghatTex, emissiveIntensity: 0.04 });
  jaliStone = new MeshStandardMaterial({ map: this.jaliStoneTex, roughness: 0.85, metalness: 0, side: DoubleSide, alphaTest: 0.5 });
  liftSign = new MeshStandardMaterial({ map: this.liftSignTex, roughness: 0.5, metalness: 0.2, emissive: new Color('#c9a15a'), emissiveMap: this.liftSignTex, emissiveIntensity: 0.4 });
  stairSign = new MeshStandardMaterial({ map: this.stairSignTex, roughness: 0.5, metalness: 0.2, emissive: new Color('#c9a15a'), emissiveMap: this.stairSignTex, emissiveIntensity: 0.4 });
  /* water walls, glass lift */
  waterfallTex: Texture = waterfallTexture();
  rippleTex: Texture = rippleTexture();
  graniteTex: Texture = graniteTexture();
  granite = new MeshStandardMaterial({ map: this.graniteTex, roughness: 0.3, metalness: 0.2 });
  waterfall = new MeshStandardMaterial({ map: this.waterfallTex, transparent: true, opacity: 0.9, depthWrite: false, roughness: 0.15, metalness: 0.1, emissive: new Color('#bfe4ff'), emissiveMap: this.waterfallTex, emissiveIntensity: 0.3 });
  basin = new MeshStandardMaterial({ map: this.rippleTex, color: '#8ac4cb', transparent: true, opacity: 0.86, depthWrite: false, roughness: 0.08, metalness: 0.2, emissive: new Color('#6fcbd6'), emissiveIntensity: 0.22 });
  /** Leaves of the green walls: a slight self-glow so the planting still reads under the soft evening light. */
  wallLeaf = new MeshStandardMaterial({ color: '#5f9356', roughness: 0.95, metalness: 0, emissive: new Color('#2f7a35'), emissiveIntensity: 0.15 });
  wallLeafDark = new MeshStandardMaterial({ color: '#376b3d', roughness: 0.95, metalness: 0, emissive: new Color('#1d5a26'), emissiveIntensity: 0.15 });
  wallLeafLight = new MeshStandardMaterial({ color: '#7bab5e', roughness: 0.95, metalness: 0, emissive: new Color('#3f8a3a'), emissiveIntensity: 0.15 });
  bronze = new MeshStandardMaterial({ color: '#3d3128', roughness: 0.38, metalness: 0.78 });
  liftGlass = new MeshStandardMaterial({ color: '#a9d3e3', roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.22, depthWrite: false, side: DoubleSide });
  cabinLight = new MeshStandardMaterial({ color: '#fff3d6', emissive: new Color('#ffe4a8'), emissiveIntensity: 0.8, roughness: 0.4 });
  footpath = new MeshStandardMaterial({ color: '#c8c1b3', roughness: 1, metalness: 0 });
  ground = new MeshStandardMaterial({ color: '#c2b79f', roughness: 1, metalness: 0 });
  roadLine = new MeshStandardMaterial({ color: '#e5dcc3', roughness: 0.9, metalness: 0 });

  constructor() {
    for (const t of [this.floorTex, this.pavingTex]) t.repeat.set(1 / 2.4, 1 / 2.4);
    this.timberTex.repeat.set(1, 1);
    this.asphaltTex.repeat.set(30, 30);
    this.waterfallTex.repeat.set(5, 2);
    this.rippleTex.repeat.set(3, 1);
    this.graniteTex.repeat.set(3, 2);
  }

  all(): MeshStandardMaterial[] {
    return Object.values(this).filter((v): v is MeshStandardMaterial => v instanceof MeshStandardMaterial);
  }

  dispose(): void {
    this.all().forEach((m) => m.dispose());
    [this.floorTex, this.pavingTex, this.timberTex, this.jaaliTex, this.asphaltTex, this.signTex, this.ghatTex, this.glowTex, this.jaliStoneTex, this.liftSignTex, this.stairSignTex, this.waterfallTex, this.rippleTex, this.graniteTex].forEach((t) => t.dispose());
  }
}
