/** Sant om användaren har valt minskade animationer i sitt system. */
export function readPrefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
