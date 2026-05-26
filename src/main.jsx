import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TelemetryProvider } from './contexts/TelemetryContext.jsx'
import { RadioProvider } from './contexts/RadioContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TelemetryProvider>
      <RadioProvider>
        <App />
      </RadioProvider>
    </TelemetryProvider>
  </StrictMode>,
)
