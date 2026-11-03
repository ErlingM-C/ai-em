/**
 * Antal millisekunder från `now` till nästa midnatt i lokal tid. Nästa midnatt räknas
 * fram som ett datum, så att dagar med sommartid eller vintertid (23 eller 25 timmar)
 * blir rätt.
 */
export function msUntilNextMidnight(now: Date): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return nextMidnight.getTime() - now.getTime()
}
