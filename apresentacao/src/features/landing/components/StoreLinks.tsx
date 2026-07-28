import React from 'react'
import { PLAY_STORE_URL, APP_STORE_URL } from '../../../config/platforms'

interface StoreButtonProps {
  href: string
  label: string
  sublabel: string
}

const StoreButton: React.FC<StoreButtonProps> = ({ href, label, sublabel }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 rounded-2xl px-5 py-3 transition hover:opacity-90"
    style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
  >
    <div className="text-left">
      <div className="text-[10.5px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
        {sublabel}
      </div>
      <div className="text-[14.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        {label}
      </div>
    </div>
  </a>
)

/**
 * Só renderiza o botão de uma loja quando a URL real existir e for válida (env var).
 * Hoje nenhuma das duas envs está configurada — nenhum botão aparece, só o status textual
 * em cada card de plataforma (ver Platforms.tsx).
 */
const StoreLinks: React.FC = () => {
  if (!PLAY_STORE_URL && !APP_STORE_URL) return null

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {PLAY_STORE_URL && <StoreButton href={PLAY_STORE_URL} label="Google Play" sublabel="Disponível em" />}
      {APP_STORE_URL && <StoreButton href={APP_STORE_URL} label="App Store" sublabel="Disponível em" />}
    </div>
  )
}

export default StoreLinks
