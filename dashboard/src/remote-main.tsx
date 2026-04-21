import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RemoteControlApp } from '@/RemoteControlApp'

createRoot(document.getElementById('remote-root')!).render(
  <StrictMode>
    <RemoteControlApp />
  </StrictMode>,
)
