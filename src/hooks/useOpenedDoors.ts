import { useCallback, useEffect, useState } from 'react'
import { readStorage, writeStorage } from '../io/storage.ts'
import { parseOpenedDays, serializeOpenedDays } from '../lib/openedDoorsStorage.ts'

export type OpenedDoors = {
  openedDays: ReadonlySet<number>
  openDoor: (day: number) => void
  closeDoor: (day: number) => void
}

/** Håller reda på vilka luckor som är öppnade och sparar dem i webbläsaren under `storageKey`. */
export function useOpenedDoors(storageKey: string): OpenedDoors {
  const [openedDays, setOpenedDays] = useState<ReadonlySet<number>>(() =>
    parseOpenedDays(readStorage(storageKey)),
  )

  useEffect(() => {
    writeStorage(storageKey, serializeOpenedDays(openedDays))
  }, [storageKey, openedDays])

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
