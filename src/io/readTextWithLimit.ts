/**
 * Läser svaret som text, men högst `maxBytes` byte. Returnerar null om svaret är större.
 * Content-Length kontrolleras först, så att en för stor fil inte laddas ner alls. Svaret
 * räknas ändå under läsningen, eftersom Content-Length kan saknas, vara fel eller gälla
 * den komprimerade storleken. Om det inte går att avbryta ett för stort svar returneras
 * ändå null, så att felet blir att filen är för stor och inte ett nätverksfel.
 */
export async function readTextWithLimit(response: Response, maxBytes: number): Promise<string | null> {
  const declared = Number(response.headers.get('Content-Length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel().catch(() => undefined)
    return null
  }
  if (response.body === null) {
    return ''
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let text = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) {
      return text + decoder.decode()
    }
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined)
      return null
    }
    text += decoder.decode(value, { stream: true })
  }
}
