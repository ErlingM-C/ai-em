import { describe, expect, it } from 'vitest'
import { resolveConfigSource } from './configSource.ts'

describe('resolveConfigSource', () => {
  it('godkänner en https-adress utan relativa bildsökvägar', () => {
    expect(resolveConfigSource('https://example.com/kalender.json', '/')).toEqual({
      ok: true,
      url: 'https://example.com/kalender.json',
      allowRelativeUrls: false,
    })
  })

  it('godkänner exempelkalendern med relativa bildsökvägar', () => {
    expect(resolveConfigSource('/examples/demo.json', '/')).toEqual({
      ok: true,
      url: '/examples/demo.json',
      allowRelativeUrls: true,
    })
  })

  it('godkänner exempelkalendern när webbplatsen ligger i en undermapp', () => {
    expect(resolveConfigSource('/ai-em/examples/demo.json', '/ai-em/')).toEqual({
      ok: true,
      url: '/ai-em/examples/demo.json',
      allowRelativeUrls: true,
    })
  })

  it('underkänner exempelsökvägen utan undermappen när webbplatsen ligger i en', () => {
    expect(resolveConfigSource('/examples/demo.json', '/ai-em/').ok).toBe(false)
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
    expect(resolveConfigSource(value, '/').ok).toBe(false)
  })
})
