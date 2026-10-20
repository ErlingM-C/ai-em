import { DOOR_COUNT, type Background, type CalendarConfig, type Door } from './config.ts'

export type ValidationResult =
  | { ok: true; config: CalendarConfig }
  | { ok: false; errors: string[] }

export type ValidationOptions = {
  /** Tillåter sökvägar som börjar med "/" (bara för exempelkalendern). */
  allowRelativeUrls: boolean
}

const MIN_YEAR = 2000
const MAX_YEAR = 2100
/** Tillåtna format för bakgrundsbilden: 16:9 och 16:10. */
const ASPECT_RATIOS = [16 / 9, 16 / 10]
const ASPECT_TOLERANCE = 0.01

type Rect = { x: number; y: number; width: number; height: number }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

export function isAllowedUrl(value: string, allowRelativeUrls: boolean): boolean {
  if (allowRelativeUrls && value.startsWith('/') && !value.startsWith('//')) {
    return true
  }
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function isAllowedAspectRatio(width: number, height: number): boolean {
  return ASPECT_RATIOS.some((ratio) => Math.abs(width / height - ratio) / ratio <= ASPECT_TOLERANCE)
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  )
}

function validateImageUrl(
  value: unknown,
  field: string,
  options: ValidationOptions,
  errors: string[],
): string | undefined {
  if (!isNonEmptyString(value)) {
    errors.push(`${field} saknas eller är inte en text.`)
    return undefined
  }
  if (!isAllowedUrl(value, options.allowRelativeUrls)) {
    errors.push(`${field} måste vara en adress som börjar med https:// (fick "${value}").`)
    return undefined
  }
  return value
}

function validateBackground(
  value: unknown,
  options: ValidationOptions,
  errors: string[],
): Background | undefined {
  if (!isRecord(value)) {
    errors.push('background saknas eller är inte ett objekt med image, width och height.')
    return undefined
  }
  const image = validateImageUrl(value.image, 'background.image', options, errors)
  const { width, height } = value
  if (!isFiniteNumber(width) || width <= 0 || !isFiniteNumber(height) || height <= 0) {
    errors.push('background.width och background.height måste vara positiva tal (bildens storlek i pixlar).')
    return undefined
  }
  if (!isAllowedAspectRatio(width, height)) {
    errors.push(
      'Bakgrundsbilden måste vara i 16:9- eller 16:10-format, till exempel 1920×1080 ' +
        `eller 1920×1200, men är ${width}×${height}.`,
    )
    return undefined
  }
  return image === undefined ? undefined : { image, width, height }
}

function validateDoorRect(
  door: Record<string, unknown>,
  label: string,
  background: Background | undefined,
  errors: string[],
): Rect | undefined {
  const { x, y, width, height } = door
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || x < 0 || y < 0) {
    errors.push(`${label}: x och y måste vara tal som är 0 eller större.`)
    return undefined
  }
  if (!isFiniteNumber(width) || !isFiniteNumber(height) || width <= 0 || height <= 0) {
    errors.push(`${label}: width och height måste vara tal större än 0.`)
    return undefined
  }
  if (background !== undefined && (x + width > background.width || y + height > background.height)) {
    errors.push(
      `${label} hamnar utanför bakgrundsbilden (${background.width}×${background.height}).`,
    )
    return undefined
  }
  return { x, y, width, height }
}

function validateDoor(
  value: unknown,
  index: number,
  background: Background | undefined,
  options: ValidationOptions,
  errors: string[],
): Door | undefined {
  if (!isRecord(value)) {
    errors.push(`Lucka nummer ${index + 1} i listan är inte ett objekt.`)
    return undefined
  }
  const { day } = value
  if (!Number.isInteger(day) || !isFiniteNumber(day) || day < 1 || day > DOOR_COUNT) {
    errors.push(`Lucka nummer ${index + 1} i listan: day måste vara ett heltal 1–${DOOR_COUNT}.`)
    return undefined
  }
  const label = `Lucka ${day}`
  const rect = validateDoorRect(value, label, background, errors)
  const image = validateImageUrl(value.image, `${label}: image`, options, errors)
  const { alt, text } = value
  if (!isNonEmptyString(alt)) {
    errors.push(`${label}: alt saknas. Beskriv kort vad bilden visar.`)
  }
  if (!isNonEmptyString(text)) {
    errors.push(`${label}: text saknas eller är tom.`)
  }
  if (rect === undefined || image === undefined || !isNonEmptyString(alt) || !isNonEmptyString(text)) {
    return undefined
  }
  return { day, ...rect, image, alt, text }
}

function validateDaysComplete(doors: Door[], errors: string[]): void {
  const counts = new Map<number, number>()
  for (const door of doors) {
    counts.set(door.day, (counts.get(door.day) ?? 0) + 1)
  }
  for (let day = 1; day <= DOOR_COUNT; day++) {
    const count = counts.get(day) ?? 0
    if (count === 0) {
      errors.push(`Lucka ${day} saknas.`)
    } else if (count > 1) {
      errors.push(`Lucka ${day} finns ${count} gånger.`)
    }
  }
}

function validateNoOverlap(doors: Door[], errors: string[]): void {
  for (let i = 0; i < doors.length; i++) {
    for (let j = i + 1; j < doors.length; j++) {
      if (rectsOverlap(doors[i], doors[j])) {
        errors.push(`Lucka ${doors[i].day} och lucka ${doors[j].day} överlappar varandra.`)
      }
    }
  }
}

function validateDoors(
  value: unknown,
  background: Background | undefined,
  options: ValidationOptions,
  errors: string[],
): Door[] | undefined {
  if (!Array.isArray(value)) {
    errors.push(`doors saknas eller är inte en lista med ${DOOR_COUNT} luckor.`)
    return undefined
  }
  const doors: Door[] = []
  value.forEach((item: unknown, index) => {
    const door = validateDoor(item, index, background, options, errors)
    if (door !== undefined) {
      doors.push(door)
    }
  })
  if (doors.length !== value.length) {
    return undefined
  }
  const errorCountBefore = errors.length
  validateDaysComplete(doors, errors)
  validateNoOverlap(doors, errors)
  if (errors.length > errorCountBefore) {
    return undefined
  }
  return [...doors].sort((a, b) => a.day - b.day)
}

export function validateConfig(data: unknown, options: ValidationOptions): ValidationResult {
  if (!isRecord(data)) {
    return { ok: false, errors: ['Filen innehåller inte ett JSON-objekt.'] }
  }
  const errors: string[] = []
  const { version, title, year } = data
  if (version !== 1) {
    errors.push('version måste vara 1.')
  }
  if (!isNonEmptyString(title)) {
    errors.push('title saknas eller är tom.')
  }
  if (!Number.isInteger(year) || !isFiniteNumber(year) || year < MIN_YEAR || year > MAX_YEAR) {
    errors.push(`year måste vara ett årtal mellan ${MIN_YEAR} och ${MAX_YEAR}.`)
  }
  const background = validateBackground(data.background, options, errors)
  const doors = validateDoors(data.doors, background, options, errors)

  if (
    errors.length > 0 ||
    version !== 1 ||
    !isNonEmptyString(title) ||
    !isFiniteNumber(year) ||
    background === undefined ||
    doors === undefined
  ) {
    return { ok: false, errors }
  }
  return { ok: true, config: { version, title, year, background, doors } }
}
