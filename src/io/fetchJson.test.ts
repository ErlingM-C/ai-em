import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchJson } from './fetchJson.ts'

const URL = 'https://example.com/kalender.json'

/** En server som aldrig svarar. Hämtningen avslutas först när den avbryts, som med riktig fetch. */
function neverResponds(_url: string, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const aborted = (): void => reject(new DOMException('Avbruten', 'AbortError'))
    if (init?.signal?.aborted) {
      aborted()
    }
    init?.signal?.addEventListener('abort', aborted)
  })
}

/** Felmeddelandet från en hämtning, eller en tom text om den lyckades. */
async function errorOf(): Promise<string> {
  const result = await fetchJson(URL, new AbortController().signal)
  return result.ok ? '' : result.error
}

describe('fetchJson', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('tolkar ett giltigt svar', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('{"version":1}')))
    expect(await fetchJson(URL, new AbortController().signal)).toEqual({ ok: true, data: { version: 1 } })
  })

  it('ger upp efter 20 sekunder om servern inte svarar', async () => {
    vi.stubGlobal('fetch', neverResponds)
    const result = fetchJson(URL, new AbortController().signal)
    await vi.advanceTimersByTimeAsync(20_000)
    const settled = await result
    expect(settled.ok).toBe(false)
    expect(settled.ok ? '' : settled.error).toContain('svarade inte inom 20 sekunder')
  })

  it('väntar så länge tidsgränsen inte har passerats', async () => {
    vi.stubGlobal('fetch', neverResponds)
    let settled = false
    void fetchJson(URL, new AbortController().signal).then(() => {
      settled = true
    })
    await vi.advanceTimersByTimeAsync(19_999)
    expect(settled).toBe(false)
  })

  it('räknar inte ett avbrott utifrån som en tidsgräns', async () => {
    vi.stubGlobal('fetch', neverResponds)
    const controller = new AbortController()
    const result = fetchJson(URL, controller.signal)
    controller.abort()
    const settled = await result
    expect(settled.ok ? '' : settled.error).not.toContain('svarade inte inom')
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([
    [404, 'finns inte'],
    [410, 'finns inte'],
    [401, 'nekade åtkomst'],
    [403, 'nekade åtkomst'],
    [429, 'för många förfrågningar'],
    [503, 'tillfälliga problem'],
    [418, 'felkod 418'],
  ])('förklarar felkoden %i', async (status, expected) => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status })))
    expect(await errorOf()).toContain(expected)
  })

  it('säger att filen är tom', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(' \n')))
    expect(await errorOf()).toContain('är tom')
  })

  it('säger att adressen pekar på en webbsida när svaret är HTML', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('\n<!DOCTYPE html><html></html>')))
    expect(await errorOf()).toContain('pekar på en webbsida')
  })

  it('anger var JSON-felet finns', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('{\n  "a": 1,\n}')))
    expect(await errorOf()).toContain('rad 3, kolumn 1')
  })

  it('säger att enheten är offline när nätverket saknas', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')))
    vi.stubGlobal('navigator', { onLine: false })
    expect(await errorOf()).toContain('inte vara ansluten till internet')
  })

  it('nämner CORS när nätverksfelet inte beror på att enheten är offline', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')))
    vi.stubGlobal('navigator', { onLine: true })
    expect(await errorOf()).toContain('CORS')
  })

  it('avbryter direkt om signalen redan är avbruten', async () => {
    vi.stubGlobal('fetch', neverResponds)
    const controller = new AbortController()
    controller.abort()
    expect((await fetchJson(URL, controller.signal)).ok).toBe(false)
  })
})
