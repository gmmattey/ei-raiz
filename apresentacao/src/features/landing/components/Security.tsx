import React from 'react'
import { Link } from 'react-router-dom'

const GUARANTEES = [
  'Seu patrimônio fica em um cofre criptografado no aparelho.',
  'A chave é protegida pelos recursos de segurança do celular.',
  'O backup manual é protegido por uma senha escolhida por você.',
  'O Savro não recebe uma cópia da sua carteira.',
]

const LIMITS = [
  'Sem a senha, um backup não pode ser recuperado.',
  'O arquivo CSV não é criptografado.',
  'Em aparelhos comprometidos, nenhuma proteção é absoluta.',
]

const Security: React.FC = () => {
  return (
    <section id="seguranca" className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-[1.75rem] font-bold sm:text-[2.25rem]">Segurança, sem promessa vazia</h2>
        <p className="mx-auto mb-14 max-w-2xl text-center text-[1.0625rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Mostramos como o Savro protege seus dados — e também os limites dessa proteção.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl p-7" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="mb-5 text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--positive)' }}>
              Como protegemos seus dados
            </h3>
            <ul className="flex flex-col gap-4">
              {GUARANTEES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="mt-1 flex-shrink-0" aria-hidden="true">
                    <path d="M4 10.5l4 4L16 6" stroke="var(--positive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl p-7" style={{ background: 'var(--surface)', border: '1px solid rgba(244,201,93,.3)' }}>
            <h3 className="mb-5 text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>
              Limites honestos
            </h3>
            <ul className="flex flex-col gap-4">
              {LIMITS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="mt-1 flex-shrink-0" aria-hidden="true">
                    <path d="M10 3v7M10 13.5h.01" stroke="var(--warning)" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 text-center text-[13px]">
          <Link to="/privacidade" className="font-semibold" style={{ color: 'var(--secondary)' }}>
            Veja como protegemos seus dados
          </Link>
        </p>
      </div>
    </section>
  )
}

export default Security
