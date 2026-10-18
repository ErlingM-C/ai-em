export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * CSS-transform som får ett element med läget `to` att täcka `from` i stället.
 * Förutsätter transform-origin: top left. Används för att animera modalen
 * från luckans plats till sin egen och tillbaka.
 */
export function flipTransform(from: Rect, to: Rect): string {
  const dx = from.x - to.x
  const dy = from.y - to.y
  const scaleX = to.width === 0 ? 1 : from.width / to.width
  const scaleY = to.height === 0 ? 1 : from.height / to.height
  return `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`
}
