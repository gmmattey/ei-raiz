import React from 'react'

/**
 * Composição própria (não é print do protótipo real do app — o protótipo de tela completo do
 * MVP1 mobile fica em claude.ai/design, projeto "Novo Esquilo", e não foi copiado 1:1 aqui por
 * instrução da issue #122). Representa, de forma estilizada, a tela de Home consolidada do MVP1
 * (contas/bens/investimentos, valores mascaráveis, sem nenhum dado real de usuário).
 */
const PhoneMockup: React.FC = () => {
  return (
    <div
      className="relative mx-auto w-[260px] sm:w-[300px]"
      role="img"
      aria-label="Ilustração da tela inicial do app Savro, mostrando o patrimônio consolidado organizado por categoria, com os valores podendo ser ocultados."
    >
      <div
        className="relative rounded-[38px] p-2.5"
        style={{ background: 'linear-gradient(155deg,#1c2e4d,#0a1526)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="rounded-[30px] overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
          {/* Notch */}
          <div className="flex justify-center pt-2.5">
            <div className="h-1.5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,.15)' }} />
          </div>

          <div className="px-4 pb-6 pt-4">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Meu patrimônio
              </span>
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: 'var(--surface)' }}
                aria-hidden="true"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10.5c2-4 5.5-6 8-6s6 2 8 6c-2 4-5.5 6-8 6s-6-2-8-6Z" stroke="var(--text-tertiary)" strokeWidth="1.4" />
                  <circle cx="10" cy="10.5" r="2" stroke="var(--text-tertiary)" strokeWidth="1.4" />
                </svg>
              </span>
            </div>

            <div className="mb-6">
              <div className="text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                Patrimônio total
              </div>
              <div
                className="font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text-primary)' }}
              >
                •••••••
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Investimentos', pct: '58%', color: 'var(--primary)' },
                { label: 'Contas e reservas', pct: '27%', color: 'var(--secondary)' },
                { label: 'Bens', pct: '15%', color: 'var(--accent)' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl px-3.5 py-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: item.color }} aria-hidden="true" />
                    <span className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {item.pct}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-5 rounded-2xl px-3.5 py-3 flex items-center gap-2.5"
              style={{ background: 'rgba(41,211,178,.1)', border: '1px solid rgba(41,211,178,.25)' }}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 10.5l4 4L16 6" stroke="var(--positive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11.5px] font-medium" style={{ color: 'var(--positive)' }}>
                Backup local em dia
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhoneMockup
