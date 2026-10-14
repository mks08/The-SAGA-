/** Shared helpers for the motion directives. */
export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
