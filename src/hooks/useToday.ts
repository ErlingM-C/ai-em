import { useEffect, useState } from 'react'
import { readToday } from '../io/clock.ts'
import { onPageVisible } from '../io/visibility.ts'
import { msUntilNextMidnight } from '../lib/msUntilNextMidnight.ts'

/**
 * Dagens datum, som uppdateras vid midnatt. Då låses nästa lucka upp även om sidan
 * står öppen över natten. Datumet läses också om när sidan blir synlig igen, eftersom
 * webbläsaren kan pausa timern när fliken ligger i bakgrunden eller enheten sover.
 */
export function useToday(): Date {
  const [today, setToday] = useState(readToday)

  useEffect(() => {
    // Om timern går lite för tidigt räknas en ny, kort väntan ut från det nya datumet.
    const timer = setTimeout(() => setToday(readToday()), msUntilNextMidnight(today))
    return () => clearTimeout(timer)
  }, [today])

  useEffect(() => onPageVisible(() => setToday(readToday())), [])

  return today
}
