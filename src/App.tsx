import { useState } from 'react'
import Calendar, { type DoorView } from './components/Calendar.tsx'
import ErrorPage from './components/ErrorPage.tsx'
import ImageModal from './components/ImageModal.tsx'
import Snow from './components/Snow.tsx'
import StartPage from './components/StartPage.tsx'
import StatusPage from './components/StatusPage.tsx'
import { useCalendarConfig } from './hooks/useCalendarConfig.ts'
import { useOpenedDoors } from './hooks/useOpenedDoors.ts'
import { readToday } from './io/clock.ts'
import { readOrigin, readPreviewParam } from './io/location.ts'
import { readPrefersReducedMotion } from './io/motion.ts'
import type { CalendarConfig } from './lib/config.ts'
import { isDoorOpenable } from './lib/isDoorOpenable.ts'
import { openedDoorsKey } from './lib/openedDoorsStorage.ts'

type CalendarControllerProps = {
  config: CalendarConfig
  configUrl: string
}

/** Styr kalendern: vilka luckor som går att öppna och vad som händer vid klick. */
function CalendarController({ config, configUrl }: CalendarControllerProps) {
  const [today] = useState(readToday)
  const [previewMode] = useState(readPreviewParam)
  const { openedDays, openDoor, closeDoor } = useOpenedDoors(openedDoorsKey(configUrl, previewMode))
  const [message, setMessage] = useState<string | null>(null)
  const [shown, setShown] = useState<{ day: number; origin: HTMLElement } | null>(null)
  const [reducedMotion] = useState(readPrefersReducedMotion)

  // En sparad lucka visas bara som öppen om den får öppnas idag, så att datumspärren gäller även för sparade luckor.
  const doors: DoorView[] = config.doors.map((door) => {
    const isOpenable = isDoorOpenable(door.day, config.year, today, previewMode)
    return { door, isOpenable, isOpen: isOpenable && openedDays.has(door.day) }
  })

  function handleDoorClick(day: number): void {
    if (!isDoorOpenable(day, config.year, today, previewMode)) {
      setMessage(`Lucka ${day} går att öppna från och med ${day} december ${config.year}.`)
    } else if (openedDays.has(day)) {
      closeDoor(day)
      setMessage(null)
    } else {
      openDoor(day)
      setMessage(null)
    }
  }

  const shownDoor = config.doors.find((door) => door.day === shown?.day)

  return (
    <>
      {!reducedMotion && <Snow placement="page" intensity={shown === null ? 'light' : 'none'} />}
      <Calendar
        title={config.title}
        background={config.background}
        doors={doors}
        message={message}
        onDoorClick={handleDoorClick}
        onPhotoClick={(day, origin) => setShown({ day, origin })}
      />
      {shown !== null && shownDoor !== undefined && (
        <ImageModal
          key={shownDoor.day}
          day={shownDoor.day}
          image={shownDoor.image}
          alt={shownDoor.alt}
          text={shownDoor.text}
          origin={shown.origin}
          reducedMotion={reducedMotion}
          onClose={() => setShown(null)}
        />
      )}
    </>
  )
}

function App() {
  const state = useCalendarConfig()
  const [origin] = useState(readOrigin)

  switch (state.status) {
    case 'missing':
      return <StartPage origin={origin} />
    case 'loading':
      return (
        <StatusPage title="Adventskalender">
          <p>Hämtar kalendern…</p>
        </StatusPage>
      )
    case 'error':
      return <ErrorPage errors={state.errors} />
    case 'ready':
      return <CalendarController config={state.config} configUrl={state.configUrl} />
  }
}

export default App
