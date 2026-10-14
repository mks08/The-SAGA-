import { Group, MeshStandardMaterial } from 'three';
import { BUILDING, Preset } from '../../config/building.config';
import { Batcher } from './batch';
import { Mats } from './materials';
import { wx, wz } from './model';

const FT = BUILDING.ft;
const CEIL = BUILDING.h.ceiling;

/** Illustrative layouts only. Positions are plot feet, so they sit correctly on the architect's plate. */
export function buildPreset(preset: Preset, y0: number, m: Mats): Group {
  const out = new Group();
  if (preset === 'open') return out;
  const B = new Batcher();
  const f = (x: number) => wx(x);
  const g = (z: number) => wz(z);

  const chair = (x: number, z: number, facing: number, mat: MeshStandardMaterial = m.fabric): void => {
    const cx = f(x), cz = g(z);
    const dx = Math.sin(facing), dz = -Math.cos(facing);
    B.box(mat, cx, y0 + 0.44, cz, 0.46, 0.06, 0.46, facing);
    B.box(mat, cx - dx * 0.21, y0 + 0.7, cz - dz * 0.21, 0.46, 0.46, 0.05, facing);
    B.box(m.frame, cx, y0 + 0.22, cz, 0.06, 0.44, 0.06);
  };
  const desk = (x: number, z: number, w: number, d: number, mat: MeshStandardMaterial = m.laminate): void => {
    B.box(mat, f(x), y0 + 0.74, g(z), w * FT, 0.04, d * FT);
    B.box(m.frame, f(x) - (w * FT) / 2 + 0.04, y0 + 0.37, g(z), 0.04, 0.72, d * FT * 0.9);
    B.box(m.frame, f(x) + (w * FT) / 2 - 0.04, y0 + 0.37, g(z), 0.04, 0.72, d * FT * 0.9);
  };
  const plant = (x: number, z: number): void => {
    B.box(m.laminate, f(x), y0 + 0.2, g(z), 0.4, 0.4, 0.4);
    B.box(m.green, f(x), y0 + 0.7, g(z), 0.5, 0.7, 0.5);
  };
  /** Glass partition along x or z with a door gap. */
  const partX = (z: number, xa: number, xb: number, gap?: [number, number]): void => {
    const segs: [number, number][] = gap ? [[xa, gap[0]], [gap[1], xb]] : [[xa, xb]];
    for (const [a, b] of segs) B.span(m.glassPartition, f(a), y0, g(z) - 0.03, f(b), y0 + 2.6, g(z) + 0.03);
    B.span(m.frame, f(xa), y0 + 2.6, g(z) - 0.04, f(xb), y0 + 2.66, g(z) + 0.04);
  };
  const partZ = (x: number, za: number, zb: number, gap?: [number, number]): void => {
    const segs: [number, number][] = gap ? [[za, gap[0]], [gap[1], zb]] : [[za, zb]];
    for (const [a, b] of segs) B.span(m.glassPartition, f(x) - 0.03, y0, g(a), f(x) + 0.03, y0 + 2.6, g(b));
    B.span(m.frame, f(x) - 0.04, y0 + 2.6, g(za), f(x) + 0.04, y0 + 2.66, g(zb));
  };
  const solidX = (z: number, xa: number, xb: number): void => B.span(m.cream, f(xa), y0, g(z) - 0.05, f(xb), y0 + 2.7, g(z) + 0.05);
  const solidZ = (x: number, za: number, zb: number): void => B.span(m.cream, f(x) - 0.05, y0, g(za), f(x) + 0.05, y0 + 2.7, g(zb));

  if (preset === 'office') {
    for (const px of [11, 20, 29.5, 38]) {
      for (const pz of [19, 31]) {
        for (const dx of [-2.9, 2.9]) {
          desk(px + dx, pz, 5, 2.5);
          chair(px + dx, pz + 2.6, 0);
          B.box(m.frame, f(px + dx), y0 + 1.05, g(pz) - 0.2, 0.55, 0.32, 0.03); // monitor
        }
      }
    }
    // meeting room
    partX(76, 6.5, 24, [14, 17]);
    partZ(24, 76, 92);
    desk(15, 84.5, 9, 3.5, m.wood);
    for (let i = 0; i < 4; i++) { chair(11.5 + i * 2.6, 81.6, Math.PI); chair(11.5 + i * 2.6, 87.4, 0); }
    // reception by the lobby
    desk(18, 46, 6, 2, m.wood);
    chair(18, 44.4, Math.PI, m.fabricTeal);
    plant(8, 14); plant(42, 14); plant(8, 102); plant(42, 102);
  } else if (preset === 'clinic') {
    desk(18, 47.5, 8, 2.5, m.wood);
    chair(18, 45.7, Math.PI, m.fabricTeal);
    for (const rz of [60.2, 64.6]) for (let i = 0; i < 4; i++) chair(10 + i * 3.4, rz, rz < 62 ? 0 : Math.PI, m.fabricTeal);
    desk(15.7, 62.4, 5, 1.6, m.laminate);
    const room = (z0: number, z1: number): void => {
      partZ(16.5, z0, z1, [z0 + 1.6, z0 + 4.2]);
      const zc = (z0 + z1) / 2;
      B.box(m.laminate, f(11), y0 + 0.52, g(zc + 2.0), 6.5 * FT, 0.1, 2.5 * FT);
      B.box(m.fabricTeal, f(11), y0 + 0.62, g(zc + 2.0), 6.2 * FT, 0.1, 2.3 * FT);
      desk(10.5, zc - 2.6, 4.5, 2, m.wood);
      chair(10.5, zc - 1.1, Math.PI);
      chair(13, zc - 2.6, -Math.PI / 2, m.fabricTeal);
    };
    room(12, 22); room(22, 32); room(32, 42);
    room(72, 82); room(82, 92.5); room(92.5, 103);
    partX(42, 5.5, 16.5); partX(72, 5.5, 16.5);
    plant(30, 14); plant(42, 102);
  } else {
    // café: counter at the rear, tables in the front zone, banquette south-east
    B.box(m.wood, f(16), y0 + 0.52, g(97.2), 16 * FT, 1.04, 2.5 * FT);
    B.box(m.laminate, f(16), y0 + 1.06, g(97.2), 16.4 * FT, 0.05, 2.9 * FT);
    for (let i = 0; i < 5; i++) {
      const sx = f(9 + i * 3.3), sz = g(94.4);
      B.box(m.woodDark, sx, y0 + 0.62, sz, 0.34, 0.05, 0.34);
      B.box(m.frame, sx, y0 + 0.3, sz, 0.05, 0.6, 0.05);
    }
    B.box(m.woodDark, f(16), y0 + 1.1, g(103.2), 16 * FT, 2.2, 0.35);
    B.box(m.frame, f(12), y0 + 1.3, g(97.2), 0.5, 0.45, 0.4); // machine
    for (const tx of [9, 17, 25, 33, 41]) {
      for (const tz of [18, 27, 36]) {
        const cx = f(tx), cz = g(tz);
        B.box(m.wood, cx, y0 + 0.74, cz, 0.75, 0.04, 0.75);
        B.box(m.frame, cx, y0 + 0.37, cz, 0.06, 0.72, 0.06);
        chair(tx - 2.2, tz, Math.PI / 2);
        chair(tx + 2.2, tz, -Math.PI / 2);
        B.box(m.frame, cx, y0 + CEIL - 0.45, cz, 0.012, 0.9, 0.012);
        B.box(m.bulb, cx, y0 + CEIL - 0.95, cz, 0.2, 0.2, 0.2);
      }
    }
    B.box(m.fabricTeal, f(35), y0 + 0.3, g(103 - 3), 10 * FT, 0.6, 1.8 * FT);
    B.box(m.fabricTeal, f(35), y0 + 0.75, g(104), 10 * FT, 0.5, 0.2);
    for (let i = 0; i < 3; i++) {
      const cz = g(76 + i * 6);
      B.box(m.wood, f(36), y0 + 0.74, cz, 0.75, 0.04, 0.75);
      B.box(m.frame, f(36), y0 + 0.37, cz, 0.06, 0.72, 0.06);
      chair(33.4, 76 + i * 6, Math.PI / 2);
      chair(38.6, 76 + i * 6, -Math.PI / 2);
    }
    plant(8, 14); plant(42, 14);
  }

  B.build(out, { cast: true, receive: true });
  return out;
}
