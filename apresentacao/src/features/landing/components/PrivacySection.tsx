import React from 'react'
import { EyeOff } from 'lucide-react'

const POINTS = [
  { title: 'Seus dados ficam com você', desc: 'O Savro guarda seu patrimônio somente no aparelho.' },
  { title: 'Sem conta ou cadastro', desc: 'Você abre o app, protege o cofre e começa a usar.' },
  { title: 'Sem anúncios ou venda de dados', desc: 'O modelo de negócio não depende das suas informações.' },
  { title: 'Sem patrimônio enviado para IA', desc: 'Nenhum serviço de inteligência artificial recebe seus valores ou registros.' },
]

const PrivacySection: React.FC = () => {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28" style={{ background: 'var(--bg-secondary)' }}>
      <div className="mx-auto max-w-4xl text-center">
        <div
          className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          aria-hidden="true"
        >
          <EyeOff size={24} color="var(--secondary)" strokeWidth={1.75} />
        </div>
        <h2 className="mb-5 text-[1.75rem] font-bold sm:text-[2.25rem]">Privacidade não é uma configuração</h2>
        <p className="mx-auto mb-12 max-w-2xl text-[1.0625rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          É como o Savro foi desenhado desde o início — não é algo que você precisa ativar.
        </p>

        <div className="grid gap-4 text-left sm:grid-cols-2">
          {POINTS.map((point) => (
            <div
              key={point.title}
              className="flex items-start gap-3 rounded-2xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="mt-0.5 flex-shrink-0" aria-hidden="true">
                <path d="M4 10.5l4 4L16 6" stroke="var(--positive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <h3 className="mb-1 text-[14.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {point.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {point.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PrivacySection
