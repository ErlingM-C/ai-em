/** Läser parametern config från sidans adress, eller null om den saknas. */
export function readConfigParam(): string | null {
  return new URLSearchParams(window.location.search).get('config')
}

/** Sant om sidan öppnats med preview=1, som låser upp alla luckor. */
export function readPreviewParam(): boolean {
  return new URLSearchParams(window.location.search).get('preview') === '1'
}

/** Webbplatsens egen adress, till exempel https://ai-em-62129.web.app. */
export function readOrigin(): string {
  return window.location.origin
}

/** Laddar om sidan, till exempel efter ett oväntat fel. */
export function reloadPage(): void {
  window.location.reload()
}
