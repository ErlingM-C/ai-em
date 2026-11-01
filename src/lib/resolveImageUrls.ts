import type { CalendarConfig } from './config.ts'

/**
 * Gör om relativa bildsökvägar i en exempelkalender till fullständiga adresser.
 * Sökvägarna räknas från kalenderfilens adress, så att "demo/dag1.svg" i
 * /ai-em/examples/demo.json blir /ai-em/examples/demo/dag1.svg.
 */
export function resolveImageUrls(config: CalendarConfig, configUrl: string): CalendarConfig {
  const resolve = (image: string): string => new URL(image, configUrl).href
  return {
    ...config,
    background: { ...config.background, image: resolve(config.background.image) },
    doors: config.doors.map((door) => ({ ...door, image: resolve(door.image) })),
  }
}
