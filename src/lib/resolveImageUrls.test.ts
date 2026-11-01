import { describe, expect, it } from 'vitest'
import type { CalendarConfig } from './config.ts'
import { resolveImageUrls } from './resolveImageUrls.ts'

function makeConfig(background: string, door: string): CalendarConfig {
  return {
    version: 1,
    title: 'Testkalender',
    year: 2026,
    background: { image: background, width: 1920, height: 1080 },
    doors: [{ day: 1, x: 0, y: 0, width: 200, height: 200, image: door, alt: 'Bild', text: 'Text' }],
  }
}

describe('resolveImageUrls', () => {
  it('räknar relativa sökvägar från kalenderfilens adress', () => {
    const config = makeConfig('demo/bakgrund.svg', 'demo/dag01.svg')
    const resolved = resolveImageUrls(config, 'https://erlingm-c.github.io/ai-em/examples/demo.json')
    expect(resolved.background.image).toBe('https://erlingm-c.github.io/ai-em/examples/demo/bakgrund.svg')
    expect(resolved.doors[0].image).toBe('https://erlingm-c.github.io/ai-em/examples/demo/dag01.svg')
  })

  it('räknar sökvägar som börjar med "/" från webbplatsens rot', () => {
    const resolved = resolveImageUrls(makeConfig('/b.svg', '/d.svg'), 'http://localhost:5173/examples/demo.json')
    expect(resolved.background.image).toBe('http://localhost:5173/b.svg')
  })

  it('behåller fullständiga https-adresser', () => {
    const resolved = resolveImageUrls(
      makeConfig('https://example.com/b.jpg', 'https://example.com/d.jpg'),
      'https://erlingm-c.github.io/ai-em/examples/demo.json',
    )
    expect(resolved.doors[0].image).toBe('https://example.com/d.jpg')
  })

  it('ändrar inte övriga fält', () => {
    const config = makeConfig('demo/b.svg', 'demo/d.svg')
    const resolved = resolveImageUrls(config, 'https://example.com/examples/demo.json')
    expect({ ...resolved.doors[0], image: '' }).toEqual({ ...config.doors[0], image: '' })
    expect(resolved.title).toBe(config.title)
  })
})
