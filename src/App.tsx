import { useState } from 'react'
import Calendar from './components/Calendar.tsx'
import ErrorPage from './components/ErrorPage.tsx'
import StartPage from './components/StartPage.tsx'
import StatusPage from './components/StatusPage.tsx'
import { useCalendarConfig } from './hooks/useCalendarConfig.ts'
import { readOrigin } from './io/location.ts'

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
      return (
        <Calendar
          title={state.config.title}
          background={state.config.background}
          doors={state.config.doors}
        />
      )
  }
}

export default App
