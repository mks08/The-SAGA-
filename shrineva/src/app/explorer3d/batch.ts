import { BoxGeometry, BufferGeometry, Group, Material, Mesh } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Collects many boxes per material and merges them into one mesh per material, so a whole floor is a handful of draw calls
 * instead of several hundred. That is what keeps the model smooth on phones. Coordinates are metres in world axes.
 */
export class Batcher {
  private buckets = new Map<Material, BufferGeometry[]>();

  box(mat: Material, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): void {
    if (sx <= 0 || sy <= 0 || sz <= 0) return;
    const g = new BoxGeometry(sx, sy, sz);
    g.translate(cx, cy, cz);
    this.geo(mat, g);
  }

  /** Any geometry, already placed in world coordinates. Indexed and non-indexed geometries can be mixed. */
  geo(mat: Material, g: BufferGeometry): void {
    const flat = g.index ? g.toNonIndexed() : g;
    if (flat !== g) g.dispose();
    for (const k of Object.keys(flat.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') flat.deleteAttribute(k);
    flat.clearGroups();
    let list = this.buckets.get(mat);
    if (!list) { list = []; this.buckets.set(mat, list); }
    list.push(flat);
  }

  /** Box from two opposite corners. */
  span(mat: Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
    this.box(mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  }

  /** Merge into meshes and add them to `into`. */
  build(into: Group, opts: { cast?: boolean; receive?: boolean } = {}): Mesh[] {
    const out: Mesh[] = [];
    this.buckets.forEach((list, mat) => {
      if (!list.length) return;
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!merged) return;
      const mesh = new Mesh(merged, mat);
      const transparent = (mat as { transparent?: boolean }).transparent;
      mesh.castShadow = (opts.cast ?? true) && !transparent;
      mesh.receiveShadow = opts.receive ?? true;
      into.add(mesh);
      out.push(mesh);
    });
    this.buckets.clear();
    return out;
  }
}
