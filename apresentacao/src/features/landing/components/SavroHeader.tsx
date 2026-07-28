import React from 'react'
import { Link } from 'react-router-dom'

const SavroHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md" style={{ background: 'rgba(7,17,31,.72)', borderBottom: '1px solid var(--border)' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2" aria-label="Savro — página inicial">
          <img src="/assets/savro/savro-logo-completo-white.svg" alt="Savro" className="h-6 w-auto sm:h-7" />
        </Link>
        <nav aria-label="Navegação principal" className="flex items-center gap-5 text-[13px] sm:gap-7 sm:text-sm">
          <a href="#como-funciona" className="hidden font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] sm:inline">
            Como funciona
          </a>
          <a href="#seguranca" className="hidden font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] sm:inline">
            Segurança
          </a>
          <Link to="/faq" className="font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
            FAQ
          </Link>
          <a
            href="#plataformas"
            className="rounded-full px-4 py-2 text-[13px] font-semibold transition"
            style={{ background: 'var(--gradient-primary)', color: '#fff', boxShadow: 'var(--shadow-cta)' }}
          >
            Acompanhar lançamento
          </a>
        </nav>
      </div>
    </header>
  )
}

export default SavroHeader
