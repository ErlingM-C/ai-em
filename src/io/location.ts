/** Läser parametern config från sidans adress, eller null om den saknas. */
export function readConfigParam(): string | null {
  return new URLSearchParams(window.location.search).get('config')
}

/** Webbplatsens egen adress, till exempel https://ai-em-62129.web.app. */
export function readOrigin(): string {
  return window.location.origin
}
