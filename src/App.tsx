import { useState } from 'react'
import Calendar, { type DoorView } from './components/Calendar.tsx'
import ErrorPage from './components/ErrorPage.tsx'
import StartPage from './components/StartPage.tsx'
import StatusPage from './components/StatusPage.tsx'
import { useCalendarConfig } from './hooks/useCalendarConfig.ts'
import { useOpenedDoors } from './hooks/useOpenedDoors.ts'
import { readToday } from './io/clock.ts'
import { readOrigin, readPreviewParam } from './io/location.ts'
import type { CalendarConfig } from './lib/config.ts'
import { isDoorOpenable } from './lib/isDoorOpenable.ts'

type CalendarControllerProps = {
  config: CalendarConfig
}

/** Styr kalendern: vilka luckor som går att öppna och vad som händer vid klick. */
function CalendarController({ config }: CalendarControllerProps) {
  const [today] = useState(readToday)
  const [previewMode] = useState(readPreviewParam)
  const { openedDays, openDoor, closeDoor } = useOpenedDoors()
  const [message, setMessage] = useState<string | null>(null)

  const doors: DoorView[] = config.doors.map((door) => ({
    door,
    isOpen: openedDays.has(door.day),
    isOpenable: isDoorOpenable(door.day, config.year, today, previewMode),
  }))

  function handleDoorClick(day: number): void {
    if (openedDays.has(day)) {
      closeDoor(day)
      setMessage(null)
    } else if (isDoorOpenable(day, config.year, today, previewMode)) {
      openDoor(day)
      setMessage(null)
    } else {
      setMessage(`Lucka ${day} går att öppna från och med ${day} december ${config.year}.`)
    }
  }

  return (
    <Calendar
      title={config.title}
      background={config.background}
      doors={doors}
      message={message}
      onDoorClick={handleDoorClick}
    />
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
      return <CalendarController config={state.config} />
  }
}

export default App
