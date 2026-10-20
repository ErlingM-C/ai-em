/**
 * Läser svaret som text, men högst `maxBytes` byte. Returnerar null om svaret är större.
 * Content-Length kontrolleras först, så att en för stor fil inte laddas ner alls. Svaret
 * räknas ändå under läsningen, eftersom Content-Length kan saknas, vara fel eller gälla
 * den komprimerade storleken.
 */
export async function readTextWithLimit(response: Response, maxBytes: number): Promise<string | null> {
  const declared = Number(response.headers.get('Content-Length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel()
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
      await reader.cancel()
      return null
    }
    text += decoder.decode(value, { stream: true })
  }
}
