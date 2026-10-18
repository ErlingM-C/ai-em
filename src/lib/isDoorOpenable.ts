/**
 * En lucka går att öppna från och med midnatt (lokal tid) den dag i december
 * som luckan gäller. I förhandsgranskningsläget går alla luckor att öppna.
 */
export function isDoorOpenable(day: number, year: number, today: Date, previewMode: boolean): boolean {
  if (previewMode) {
    return true
  }
  const opensAt = new Date(year, 11, day)
  return today.getTime() >= opensAt.getTime()
}
