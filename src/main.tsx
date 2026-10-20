import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { reloadPage } from './io/location.ts'

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('Hittade inget element med id "root" i index.html.')
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary onReload={reloadPage}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
