import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App'
import './styles/index.css'

// Micro-haptics em ações primárias — Android PWA standalone apenas.
// iOS PWA não suporta navigator.vibrate; degrada silenciosamente.
if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
  document.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('[data-haptic]')) {
      navigator.vibrate(8)
    }
  }, { passive: true })
}

const isLegacy =
  typeof document !== 'undefined' &&
  (document.documentElement.classList.contains('legacy') ||
    // fallback para ambientes onde a classe ainda não foi setada
    Boolean((window as any).__EI_LEGACY__))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion={isLegacy ? 'always' : 'user'}>
      <App />
    </MotionConfig>
  </React.StrictMode>,
)
