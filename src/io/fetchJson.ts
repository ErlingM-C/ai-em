export type FetchJsonResult = { ok: true; data: unknown } | { ok: false; error: string }

/** Hämtar och tolkar en JSON-fil. Fel returneras som begripliga meddelanden. */
export async function fetchJson(url: string, signal: AbortSignal): Promise<FetchJsonResult> {
  const networkError: FetchJsonResult = {
    ok: false,
    error:
      `Kunde inte hämta kalenderfilen från ${url}. Kontrollera att adressen stämmer och att ` +
      'servern tillåter att filen hämtas från andra webbplatser (CORS).',
  }
  let response: Response
  let body: string
  try {
    response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
    body = await response.text()
  } catch {
    return networkError
  }
  if (!response.ok) {
    return {
      ok: false,
      error: `Servern svarade med felkod ${response.status} när kalenderfilen hämtades från ${url}.`,
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
