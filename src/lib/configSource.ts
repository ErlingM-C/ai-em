export type ConfigSource =
  | { ok: true; url: string; allowRelativeUrls: boolean }
  | { ok: false; error: string }

const EXAMPLES_PREFIX = '/examples/'

function isExamplePath(value: string): boolean {
  return value.startsWith(EXAMPLES_PREFIX) && !value.includes('..') && !value.includes('//')
}

/**
 * Avgör om config-adressen får användas. Bara https-adresser tillåts,
 * förutom exempelkalendrar på den egna webbplatsen under /examples/.
 */
export function resolveConfigSource(value: string): ConfigSource {
  if (isExamplePath(value)) {
    return { ok: true, url: value, allowRelativeUrls: true }
  }
  try {
    if (new URL(value).protocol === 'https:') {
      return { ok: true, url: value, allowRelativeUrls: false }
    }
  } catch {
    // Faller igenom till felmeddelandet nedan.
  }
  return {
    ok: false,
    error: `Adressen till kalenderfilen måste börja med https:// (fick "${value}").`,
  }
}
