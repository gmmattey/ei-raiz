import React from 'react'

// PENDENTE (bloqueio para o PR): não existe valor/plano/assinatura aprovado até esta issue —
// não incluir preço aqui até o Luiz aprovar um. Ver relatório final da tarefa.

const Commercial: React.FC = () => {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-5 text-[1.75rem] font-bold sm:text-[2.25rem]">Como o Savro se sustenta</h2>
        <p className="mx-auto text-[1.0625rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          O modelo é simples: quem usa o Savro paga pelo app. Seu patrimônio não é o produto — não
          há anúncio, não há venda de dado, não há monetização em cima da sua informação
          financeira. Os detalhes de preço e planos serão anunciados quando o app estiver
          disponível para publicação.
        </p>
      </div>
    </section>
  )
}

export default Commercial
