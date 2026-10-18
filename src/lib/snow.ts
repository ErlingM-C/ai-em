export type Flake = {
  x: number
  y: number
  radius: number
  /** Fallhastighet i pixlar per sekund. */
  speed: number
  /** Hur mycket flingan driver i sidled, i pixlar per sekund. */
  drift: number
  phase: number
  opacity: number
}

export type SnowIntensity = 'light' | 'minimal' | 'none'

/** Antal flingor per kvadratpixel för varje intensitet. */
const DENSITY: Record<SnowIntensity, number> = {
  light: 1 / 14_000,
  minimal: 1 / 150_000,
  none: 0,
}

export function targetFlakeCount(intensity: SnowIntensity, width: number, height: number): number {
  return Math.round(width * height * DENSITY[intensity])
}

/**
 * Skapar en ny flinga. `random` ger tal i [0, 1) och skickas in så att
 * funktionen går att testa. Nya flingor startar ovanför ytan, utom när
 * snön startar och ytan ska fyllas direkt.
 */
export function createFlake(random: () => number, width: number, height: number, fromTop: boolean): Flake {
  const radius = 1 + random() * 2.5
  return {
    x: random() * width,
    y: fromTop ? -radius * 2 : random() * height,
    radius,
    // Större flingor faller snabbare, som om de vore närmare.
    speed: 18 + radius * 12 + random() * 10,
    drift: 8 + random() * 18,
    phase: random() * Math.PI * 2,
    opacity: 0.4 + random() * 0.5,
  }
}

/** Flyttar flingan `seconds` sekunder framåt. Flingor som driver ut i sidled kommer in på andra sidan. */
export function moveFlake(flake: Flake, seconds: number, time: number, width: number): Flake {
  let x = flake.x + Math.sin(time * 0.8 + flake.phase) * flake.drift * seconds
  if (x < -flake.radius) {
    x = width + flake.radius
  } else if (x > width + flake.radius) {
    x = -flake.radius
  }
  return { ...flake, x, y: flake.y + flake.speed * seconds }
}

export function hasFallenOut(flake: Flake, height: number): boolean {
  return flake.y - flake.radius > height
}
