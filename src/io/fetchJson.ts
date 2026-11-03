import { jsonErrorLocation } from '../lib/jsonErrorLocation.ts'
import { readTextWithLimit } from './readTextWithLimit.ts'

export type FetchJsonResult = { ok: true; data: unknown } | { ok: false; error: string }

/** Största tillåtna kalenderfil. En vanlig kalenderfil är några kB. */
const MAX_CONFIG_BYTES = 1_000_000
/** Så länge väntar vi på kalenderfilen innan hämtningen avbryts. */
const TIMEOUT_MS = 20_000

/**
 * Hämtar och tolkar en JSON-fil. Fel returneras som begripliga meddelanden.
 * Om servern inte har svarat inom TIMEOUT_MS avbryts hämtningen.
 */
export async function fetchJson(url: string, signal: AbortSignal): Promise<FetchJsonResult> {
  // AbortSignal.timeout och AbortSignal.any saknas i äldre webbläsare, så tidsgränsen byggs för hand.
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, TIMEOUT_MS)
  const abort = (): void => controller.abort()
  if (signal.aborted) {
    abort()
  }
  signal.addEventListener('abort', abort)

  try {
    const result = await fetchAndParse(url, controller.signal)
    return timedOut && !result.ok ? timeoutError(url) : result
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', abort)
  }
}

function timeoutError(url: string): FetchJsonResult {
  return {
    ok: false,
    error:
      `Servern svarade inte inom ${TIMEOUT_MS / 1000} sekunder när kalenderfilen hämtades från ${url}. ` +
      'Försök igen om en stund, eller kontrollera att adressen stämmer.',
  }
}

/** Sant bara när webbläsaren vet att enheten saknar nätverk. Äldre webbläsare saknar navigator.onLine. */
function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

function networkError(url: string): FetchJsonResult {
  if (isOffline()) {
    return {
      ok: false,
      error: 'Du verkar inte vara ansluten till internet. Anslut till ett nätverk och ladda om sidan.',
    }
  }
  return {
    ok: false,
    error:
      `Kunde inte hämta kalenderfilen från ${url}. Kontrollera att adressen stämmer och att ` +
      'servern tillåter att filen hämtas från andra webbplatser (CORS).',
  }
}

/** Förklarar felkoden från servern och vad användaren kan göra åt den. */
function httpErrorMessage(status: number, url: string): string {
  const code = `(felkod ${status})`
  if (status === 404 || status === 410) {
    return (
      `Kalenderfilen finns inte på ${url} ${code}. Kontrollera att adressen är rätt stavad och ` +
      'att filen inte har flyttats eller tagits bort.'
    )
  }
  if (status === 401 || status === 403) {
    return (
      `Servern nekade åtkomst till kalenderfilen på ${url} ${code}. Filen måste vara delad så att ` +
      'vem som helst med länken kan läsa den, utan att logga in.'
    )
  }
  if (status === 429) {
    return `Servern där kalenderfilen ligger har fått för många förfrågningar ${code}. Vänta en stund och ladda om sidan.`
  }
  if (status >= 500) {
    return `Servern där kalenderfilen ligger har tillfälliga problem ${code}. Försök igen om en stund.`
  }
  return `Servern svarade med felkod ${status} när kalenderfilen hämtades från ${url}. Kontrollera att adressen stämmer.`
}

/** Förklarar varför texten inte gick att tolka som JSON, med var felet finns om det går att ta reda på. */
function parseErrorMessage(error: unknown, body: string, url: string): string {
  if (body.trim() === '') {
    return `Kalenderfilen på ${url} är tom. Kontrollera att filen är sparad och att adressen pekar på rätt fil.`
  }
  if (body.trimStart().startsWith('<')) {
    return (
      `Adressen ${url} pekar på en webbsida, inte på själva JSON-filen. Det händer ofta med ` +
      'delningslänkar från till exempel Google Drive, Dropbox eller GitHub. Använd en direktlänk ' +
      'till filen (på GitHub knappen "Raw").'
    )
  }
  const location = error instanceof SyntaxError ? jsonErrorLocation(error.message, body) : null
  const where = location === null ? '' : ` Felet finns på rad ${location.line}, kolumn ${location.column}.`
  return (
    `Kalenderfilen är inte giltig JSON.${where} Kontrollera till exempel kommatecken och ` +
    'citattecken, eller klistra in filen i en JSON-validerare för att hitta felet.'
  )
}

async function fetchAndParse(url: string, signal: AbortSignal): Promise<FetchJsonResult> {
  let response: Response
  try {
    response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
  } catch {
    return networkError(url)
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined)
    return { ok: false, error: httpErrorMessage(response.status, url) }
  }
  let body: string | null
  try {
    body = await readTextWithLimit(response, MAX_CONFIG_BYTES)
  } catch {
    return networkError(url)
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
  } catch (error: unknown) {
    return { ok: false, error: parseErrorMessage(error, body, url) }
  }
}
