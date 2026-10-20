import { readTextWithLimit } from './readTextWithLimit.ts'

export type FetchJsonResult = { ok: true; data: unknown } | { ok: false; error: string }

/** Största tillåtna kalenderfil. En vanlig kalenderfil är några kB. */
const MAX_CONFIG_BYTES = 1_000_000

/** Hämtar och tolkar en JSON-fil. Fel returneras som begripliga meddelanden. */
export async function fetchJson(url: string, signal: AbortSignal): Promise<FetchJsonResult> {
  const networkError: FetchJsonResult = {
    ok: false,
    error:
      `Kunde inte hämta kalenderfilen från ${url}. Kontrollera att adressen stämmer och att ` +
      'servern tillåter att filen hämtas från andra webbplatser (CORS).',
  }
  let response: Response
  try {
    response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
  } catch {
    return networkError
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined)
    return {
      ok: false,
      error: `Servern svarade med felkod ${response.status} när kalenderfilen hämtades från ${url}.`,
    }
  }
  let body: string | null
  try {
    body = await readTextWithLimit(response, MAX_CONFIG_BYTES)
  } catch {
    return networkError
  }
  if (body === null) {
    return {
      ok: false,
      error:
        `Kalenderfilen är större än ${MAX_CONFIG_BYTES / 1_000_000} MB. En kalenderfil brukar bara vara ` +
        'några kB. Kontrollera att adressen pekar på JSON-filen och inte på till exempel en bild eller en webbsida.',
    }
  }
  try {
    const data: unknown = JSON.parse(body)
    return { ok: true, data }
  } catch {
    return {
      ok: false,
      error: 'Kalenderfilen är inte giltig JSON. Kontrollera till exempel kommatecken och citattecken.',
    }
  }
}
