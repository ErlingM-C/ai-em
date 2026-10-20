import { DOOR_COUNT } from './config.ts'

const KEY_PREFIX = 'adventskalender:opened:'

/**
 * Nyckeln i localStorage för en kalenders öppnade luckor. Förhandsgranskningen
 * sparas separat, så att luckor som öppnats vid test inte syns som öppna i december.
 */
export function openedDoorsKey(configUrl: string, previewMode: boolean): string {
  return `${KEY_PREFIX}${previewMode ? 'preview:' : ''}${configUrl}`
}

function isDay(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= DOOR_COUNT
}

/** Tolkar sparade luckor. Sparad data betros inte: allt som inte är en giltig dag ignoreras. */
export function parseOpenedDays(raw: string | null): ReadonlySet<number> {
  if (raw === null) {
    return new Set()
  }
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return new Set()
  }
  if (!Array.isArray(data)) {
    return new Set()
  }
  const items: unknown[] = data
  return new Set(items.filter(isDay))
}

export function serializeOpenedDays(days: ReadonlySet<number>): string {
  return JSON.stringify([...days].sort((a, b) => a - b))
}
