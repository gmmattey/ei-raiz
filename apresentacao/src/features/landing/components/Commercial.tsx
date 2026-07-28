import React from 'react'

// PENDENTE (bloqueio para o PR): não existe valor/plano/assinatura aprovado até esta issue —
// não incluir preço aqui até o Luiz aprovar um. Ver relatório final da tarefa.

const Commercial: React.FC = () => {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-5 text-[1.75rem] font-bold sm:text-[2.25rem]">Você será o cliente. Seus dados, não.</h2>
        <p className="mx-auto text-[1.0625rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          O modelo comercial do Savro será simples e transparente. O aplicativo não será
          financiado por anúncios nem pela venda das suas informações. Os detalhes serão
          apresentados antes do lançamento.
        </p>
      </div>
    </section>
  )
}

export default Commercial
