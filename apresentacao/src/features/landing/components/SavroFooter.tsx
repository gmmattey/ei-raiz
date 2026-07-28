import React from 'react'
import { Link } from 'react-router-dom'
import { SUPPORT_EMAIL } from '../../../config/platforms'

const SavroFooter: React.FC = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--border)' }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <img src="/assets/savro/savro-logo-completo-white.svg" alt="Savro" className="h-6 w-auto" />
          <p className="max-w-xs text-[13px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Seus dados ficam no seu aparelho. O Savro está em desenvolvimento.
          </p>
        </div>

        <nav aria-label="Links institucionais" className="grid grid-cols-2 gap-x-10 gap-y-3 text-[13px] sm:flex sm:gap-10">
          <Link to="/privacidade" className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            Privacidade
          </Link>
          <Link to="/termos" className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            Termos de uso
          </Link>
          <Link to="/suporte" className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            Suporte
          </Link>
          <Link to="/faq" className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            FAQ
          </Link>
          <Link to="/changelog" className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            Changelog
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-10 text-[12px] sm:px-8" style={{ color: 'var(--text-tertiary)' }}>
        © {new Date().getFullYear()} Savro. Todos os direitos reservados.
        {SUPPORT_EMAIL && (
          <>
            {' · '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              {SUPPORT_EMAIL}
            </a>
          </>
        )}
      </div>
    </footer>
  )
}

export default SavroFooter
