
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setOptions } from '@googlemaps/js-api-loader'

import './index.css'
import App from './App.tsx'

// Configure Google Maps once, before React renders.
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

if (!apiKey) {
  console.warn('Google Maps API key is missing. Map features will show setup guidance.')
} else {
  setOptions({
    key: apiKey,
    v: 'weekly',
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
