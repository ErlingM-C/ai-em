/**
 * Sant om användaren har valt minskade animationer i sitt system. Äldre webbläsare
 * saknar matchMedia, och då visas animationerna som vanligt.
 */
export function readPrefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
