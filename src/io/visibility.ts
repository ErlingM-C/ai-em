/**
 * Anropar `callback` när sidan blir synlig igen, till exempel när man byter tillbaka
 * till fliken eller väcker telefonen. Returnerar en funktion som slutar lyssna.
 */
export function onPageVisible(callback: () => void): () => void {
  const handleChange = (): void => {
    if (document.visibilityState === 'visible') {
      callback()
    }
  }
  document.addEventListener('visibilitychange', handleChange)
  return () => document.removeEventListener('visibilitychange', handleChange)
}
