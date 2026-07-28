import React from 'react'

const STEPS = [
  { n: '01', title: 'Instalar o Savro', desc: 'Baixe o Savro na loja do seu aparelho quando ele estiver disponível.' },
  { n: '02', title: 'Proteger o cofre', desc: 'Defina a proteção do cofre antes de adicionar seus dados.' },
  { n: '03', title: 'Adicionar o patrimônio', desc: 'Cadastre bens, contas, investimentos e dívidas no seu ritmo.' },
  { n: '04', title: 'Acompanhar tudo', desc: 'Consulte sua visão consolidada mesmo sem internet.' },
  { n: '05', title: 'Criar um backup', desc: 'Quando quiser, crie um backup protegido por senha para trocar de aparelho.' },
]

const HowItWorks: React.FC = () => {
  return (
    <section id="como-funciona" className="px-5 py-20 sm:px-8 sm:py-28" style={{ background: 'var(--bg-secondary)' }}>
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-14 text-center text-[1.75rem] font-bold sm:text-[2.25rem]">Como funciona</h2>

        <div className="grid gap-6 sm:grid-cols-5">
          {STEPS.map((step) => (
            <div key={step.n} className="flex flex-col gap-3">
              <span className="text-[13px] font-bold" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-display)' }}>
                {step.n}
              </span>
              <h3 className="text-[14.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {step.title}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
