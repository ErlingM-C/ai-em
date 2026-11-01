export type ConfigSource =
  | { ok: true; url: string; allowRelativeUrls: boolean }
  | { ok: false; error: string }

function isExamplePath(value: string, basePath: string): boolean {
  return value.startsWith(`${basePath}examples/`) && !value.includes('..') && !value.includes('//')
}

/**
 * Avgör om config-adressen får användas. Bara https-adresser tillåts,
 * förutom exempelkalendrar på den egna webbplatsen under <basePath>examples/.
 * basePath är sökvägen där webbplatsen ligger, till exempel "/" eller "/ai-em/".
 */
export function resolveConfigSource(value: string, basePath: string): ConfigSource {
  if (isExamplePath(value, basePath)) {
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
