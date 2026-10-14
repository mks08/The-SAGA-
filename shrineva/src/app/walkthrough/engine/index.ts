/**
 * Entry point of the lazily loaded 3D chunk. The page imports this file dynamically, so Three.js is only downloaded
 * when a visitor opens the walkthrough.
 */
import { Engine, EngineOptions } from './engine';

export type { EngineState, Pose, Mode, EngineHooks } from './engine';
export { Engine };

export async function createEngine(opts: EngineOptions): Promise<Engine> {
  // the sign texture draws with the site's display face, so make sure it is loaded first
  try { await (document as Document & { fonts?: FontFaceSet }).fonts?.load('48px "Instrument Serif"'); } catch { /* fall back to Georgia */ }
  return new Engine(opts);
}
