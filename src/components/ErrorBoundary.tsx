import { Component, type ReactNode } from 'react'
import StatusPage from './StatusPage.tsx'

type ErrorBoundaryProps = {
  children: ReactNode
  onReload: () => void
}

type ErrorBoundaryState = {
  failed: boolean
}

/**
 * Fångar oväntade fel som annars skulle ge en vit sida och visar ett felmeddelande i stället.
 * Det måste vara en klasskomponent, eftersom React bara kan fånga renderingsfel på det sättet.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  render(): ReactNode {
    if (!this.state.failed) {
      return this.props.children
    }
    return (
      <StatusPage title="Något gick fel">
        <p role="alert">Kalendern stötte på ett oväntat fel och kunde inte visas.</p>
        <p>
          Ladda om sidan och försök igen. Luckorna du redan har öppnat finns kvar. Om felet kommer
          tillbaka kan du uppdatera webbläsaren eller öppna länken i en annan webbläsare.
        </p>
        <button type="button" onClick={this.props.onReload}>
          Ladda om sidan
        </button>
      </StatusPage>
    )
  }
}

export default ErrorBoundary
