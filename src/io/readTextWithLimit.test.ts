import { describe, expect, it } from 'vitest'
import { readTextWithLimit } from './readTextWithLimit.ts'

/** Ett svar som skickas i flera bitar och saknar Content-Length, som vid chunked-överföring. */
function chunkedResponse(chunks: string[]): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
  return new Response(stream)
}

describe('readTextWithLimit', () => {
  it('läser ett svar som är mindre än gränsen', async () => {
    expect(await readTextWithLimit(new Response('{"a":1}'), 100)).toBe('{"a":1}')
  })

  it('läser ett svar som är exakt lika stort som gränsen', async () => {
    expect(await readTextWithLimit(new Response('12345'), 5)).toBe('12345')
  })

  it('stoppar när Content-Length är större än gränsen', async () => {
    const response = new Response('kort', { headers: { 'Content-Length': '5000' } })
    expect(await readTextWithLimit(response, 100)).toBeNull()
  })

  it('stoppar under läsningen när svaret saknar Content-Length', async () => {
    expect(await readTextWithLimit(chunkedResponse(['12345', '67890', 'abcde']), 12)).toBeNull()
  })

  it('stoppar även om Content-Length anger en mindre storlek än svaret har', async () => {
    const response = new Response('x'.repeat(200), { headers: { 'Content-Length': '10' } })
    expect(await readTextWithLimit(response, 100)).toBeNull()
  })

  it('räknar byte och inte tecken', async () => {
    // "å" är två byte i UTF-8.
    expect(await readTextWithLimit(new Response('ååå'), 5)).toBeNull()
    expect(await readTextWithLimit(new Response('ååå'), 6)).toBe('ååå')
  })

  it('avkodar tecken som delas mellan två bitar', async () => {
    const bytes = new TextEncoder().encode('jul å')
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 5))
        controller.enqueue(bytes.slice(5))
        controller.close()
      },
    })
    expect(await readTextWithLimit(new Response(stream), 100)).toBe('jul å')
  })

  it('ger tom text för ett svar utan innehåll', async () => {
    expect(await readTextWithLimit(new Response(null), 100)).toBe('')
  })
})
