import { describe, expect, it } from 'vitest'
import { resolveConfigSource } from './configSource.ts'

describe('resolveConfigSource', () => {
  it('godkänner en https-adress utan relativa bildsökvägar', () => {
    expect(resolveConfigSource('https://example.com/kalender.json')).toEqual({
      ok: true,
      url: 'https://example.com/kalender.json',
      allowRelativeUrls: false,
    })
  })

  it('godkänner exempelkalendern med relativa bildsökvägar', () => {
    expect(resolveConfigSource('/examples/demo.json')).toEqual({
      ok: true,
      url: '/examples/demo.json',
      allowRelativeUrls: true,
    })
  })

  it.each([
    'http://example.com/kalender.json',
    'javascript:alert(1)',
    'data:application/json,{}',
    '/annan/kalender.json',
    '/examples/../hemlig.json',
    '/examples//evil.example/x.json',
    'kalender.json',
    '',
  ])('underkänner %j', (value) => {
    expect(resolveConfigSource(value).ok).toBe(false)
  })
})
