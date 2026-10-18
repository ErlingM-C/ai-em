import { describe, expect, it } from 'vitest'
import { isAllowedAspectRatio, isAllowedUrl, rectsOverlap, validateConfig } from './validateConfig.ts'

const strict = { allowRelativeUrls: false }

function makeDoor(day: number): Record<string, unknown> {
  const index = day - 1
  return {
    day,
    x: 60 + (index % 6) * 310,
    y: 40 + Math.floor(index / 6) * 260,
    width: 200,
    height: 200,
    image: `https://example.com/dag${day}.jpg`,
    alt: `Bild för dag ${day}`,
    text: `Text för dag ${day}`,
  }
}

function makeConfig(): Record<string, unknown> {
  return {
    version: 1,
    title: 'Testkalender',
    year: 2026,
    background: { image: 'https://example.com/bakgrund.jpg', width: 1920, height: 1080 },
    doors: Array.from({ length: 24 }, (_, i) => makeDoor(i + 1)),
  }
}

function makeConfigWithDoor(day: number, changes: Record<string, unknown>): Record<string, unknown> {
  return {
    ...makeConfig(),
    doors: Array.from({ length: 24 }, (_, i) =>
      i + 1 === day ? { ...makeDoor(day), ...changes } : makeDoor(i + 1),
    ),
  }
}

function errorsOf(data: unknown, options = strict): string[] {
  const result = validateConfig(data, options)
  return result.ok ? [] : result.errors
}

describe('validateConfig', () => {
  it('godkänner en giltig kalender', () => {
    const result = validateConfig(makeConfig(), strict)
    expect(result.ok).toBe(true)
  })

  it('returnerar luckorna sorterade efter dag', () => {
    const config = makeConfig()
    const result = validateConfig({ ...config, doors: Array.from({ length: 24 }, (_, i) => makeDoor(24 - i)) }, strict)
    expect(result.ok && result.config.doors.map((d) => d.day)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    )
  })

  it('ignorerar okända fält', () => {
    expect(validateConfig({ ...makeConfig(), extra: 'hej' }, strict).ok).toBe(true)
  })

  it.each([null, [], 'text', 42])('underkänner %j som inte är ett objekt', (data) => {
    expect(errorsOf(data)).toEqual(['Filen innehåller inte ett JSON-objekt.'])
  })

  it('kräver version 1', () => {
    expect(errorsOf({ ...makeConfig(), version: 2 })).toEqual(['version måste vara 1.'])
  })

  it('kräver en titel som inte är tom', () => {
    expect(errorsOf({ ...makeConfig(), title: '  ' })).toEqual(['title saknas eller är tom.'])
  })

  it.each([1999, 2101, 2026.5, '2026'])('underkänner året %j', (year) => {
    expect(errorsOf({ ...makeConfig(), year })).toHaveLength(1)
  })

  it('underkänner en bakgrund som varken är 16:9 eller 16:10', () => {
    const background = { image: 'https://example.com/b.jpg', width: 1600, height: 1200 }
    expect(errorsOf({ ...makeConfig(), background })).toEqual([
      'Bakgrundsbilden måste vara i 16:9- eller 16:10-format, till exempel 1920×1080 eller 1920×1200, men är 1600×1200.',
    ])
  })

  it('godkänner en bakgrund i 16:10', () => {
    const background = { image: 'https://example.com/b.jpg', width: 1920, height: 1200 }
    expect(validateConfig({ ...makeConfig(), background }, strict).ok).toBe(true)
  })

  it('underkänner en bakgrund med http://', () => {
    const background = { image: 'http://example.com/b.jpg', width: 1920, height: 1080 }
    expect(errorsOf({ ...makeConfig(), background })[0]).toContain('https://')
  })

  it('underkänner när en lucka saknas', () => {
    const config = makeConfig()
    const doors = Array.from({ length: 23 }, (_, i) => makeDoor(i + 1))
    expect(errorsOf({ ...config, doors })).toEqual(['Lucka 24 saknas.'])
  })

  it('underkänner en lucka som finns två gånger', () => {
    const doors = [...Array.from({ length: 24 }, (_, i) => makeDoor(i + 1)), makeDoor(3)]
    const errors = errorsOf({ ...makeConfig(), doors })
    expect(errors).toContain('Lucka 3 finns 2 gånger.')
  })

  it.each([0, 25, 1.5, '1'])('underkänner dagen %j', (day) => {
    expect(errorsOf(makeConfigWithDoor(1, { day }))[0]).toContain('day måste vara ett heltal')
  })

  it('underkänner en lucka utanför bakgrundsbilden', () => {
    expect(errorsOf(makeConfigWithDoor(6, { x: 1800 }))).toContain(
      'Lucka 6 hamnar utanför bakgrundsbilden (1920×1080).',
    )
  })

  it('underkänner negativa koordinater', () => {
    expect(errorsOf(makeConfigWithDoor(1, { x: -1 }))).toEqual([
      'Lucka 1: x och y måste vara tal som är 0 eller större.',
    ])
  })

  it('underkänner en lucka utan storlek', () => {
    expect(errorsOf(makeConfigWithDoor(1, { width: 0 }))).toEqual([
      'Lucka 1: width och height måste vara tal större än 0.',
    ])
  })

  it('underkänner överlappande luckor', () => {
    expect(errorsOf(makeConfigWithDoor(2, { x: 100 }))).toEqual([
      'Lucka 1 och lucka 2 överlappar varandra.',
    ])
  })

  it('kräver alt-text', () => {
    expect(errorsOf(makeConfigWithDoor(5, { alt: '' }))).toEqual([
      'Lucka 5: alt saknas. Beskriv kort vad bilden visar.',
    ])
  })

  it('kräver en text som inte är tom', () => {
    expect(errorsOf(makeConfigWithDoor(5, { text: '' }))).toEqual(['Lucka 5: text saknas eller är tom.'])
  })

  it('underkänner javascript:-adresser för luckbilder', () => {
    expect(errorsOf(makeConfigWithDoor(1, { image: 'javascript:alert(1)' }))[0]).toContain('https://')
  })

  it('tillåter relativa sökvägar bara när det är påslaget', () => {
    const data = makeConfigWithDoor(1, { image: '/examples/dag1.svg' })
    expect(validateConfig(data, strict).ok).toBe(false)
    expect(validateConfig(data, { allowRelativeUrls: true }).ok).toBe(true)
  })

  it('samlar flera fel samtidigt', () => {
    expect(errorsOf({ ...makeConfig(), version: 2, title: '' })).toHaveLength(2)
  })
})

describe('isAllowedUrl', () => {
  it.each([
    ['https://example.com/a.jpg', false, true],
    ['http://example.com/a.jpg', false, false],
    ['javascript:alert(1)', false, false],
    ['data:image/png;base64,AAAA', false, false],
    ['/examples/a.jpg', false, false],
    ['/examples/a.jpg', true, true],
    ['//evil.example/a.jpg', true, false],
    ['inte en adress', false, false],
  ])('%s med relativa=%s ger %s', (url, allowRelative, expected) => {
    expect(isAllowedUrl(url, allowRelative)).toBe(expected)
  })
})

describe('isAllowedAspectRatio', () => {
  it.each([
    [1920, 1080, true],
    [3840, 2160, true],
    [1366, 768, true],
    [1920, 1200, true],
    [2560, 1600, true],
    [1440, 900, true],
    [1600, 1200, false],
    [2560, 1080, false],
    [1080, 1920, false],
    [1200, 1920, false],
  ])('%i×%i ger %s', (width, height, expected) => {
    expect(isAllowedAspectRatio(width, height)).toBe(expected)
  })
})

describe('rectsOverlap', () => {
  const a = { x: 0, y: 0, width: 100, height: 100 }

  it('upptäcker överlapp', () => {
    expect(rectsOverlap(a, { x: 50, y: 50, width: 100, height: 100 })).toBe(true)
  })

  it('räknar luckor som bara nuddar varandra som ej överlappande', () => {
    expect(rectsOverlap(a, { x: 100, y: 0, width: 100, height: 100 })).toBe(false)
  })
})
