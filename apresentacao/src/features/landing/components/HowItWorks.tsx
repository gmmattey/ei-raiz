import React from 'react'

const STEPS = [
  { n: '01', title: 'Instala o app', desc: 'Baixa o Savro na loja do seu aparelho, quando disponível.' },
  { n: '02', title: 'Cria o cofre local', desc: 'Define a proteção do seu cofre — os dados nascem cifrados desde o primeiro item.' },
  { n: '03', title: 'Cadastra o patrimônio', desc: 'Adiciona contas, bens e investimentos manualmente, no seu ritmo.' },
  { n: '04', title: 'Acompanha no aparelho', desc: 'Consulta a visão consolidada sempre que quiser, mesmo sem internet.' },
  { n: '05', title: 'Cria backup quando quiser', desc: 'Gera um backup criptografado manual para levar o cofre para outro aparelho.' },
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
