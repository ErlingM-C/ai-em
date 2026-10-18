import { useCallback, useState } from 'react'

export type OpenedDoors = {
  openedDays: ReadonlySet<number>
  openDoor: (day: number) => void
  closeDoor: (day: number) => void
}

/** Håller reda på vilka luckor som är öppnade medan sidan är öppen. */
export function useOpenedDoors(): OpenedDoors {
  const [openedDays, setOpenedDays] = useState<ReadonlySet<number>>(() => new Set())

  const openDoor = useCallback((day: number) => {
    setOpenedDays((previous) => (previous.has(day) ? previous : new Set(previous).add(day)))
  }, [])

  const closeDoor = useCallback((day: number) => {
    setOpenedDays((previous) => {
      if (!previous.has(day)) {
        return previous
      }
      const next = new Set(previous)
      next.delete(day)
      return next
    })
  }, [])

  return { openedDays, openDoor, closeDoor }
}
