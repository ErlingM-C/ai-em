/** Läser ett värde ur localStorage, eller null om det saknas eller inte går att läsa (till exempel i privat läge). */
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/** Sparar ett värde i localStorage. Går det inte fungerar kalendern ändå, men minns inget till nästa gång. */
export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Lagringen är avstängd eller full. Luckorna gäller då bara medan sidan är öppen.
  }
}
