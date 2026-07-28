import React from 'react'
import { Link } from 'react-router-dom'
import { useSeo } from '../../hooks/useSeo'
import '../landing/savro-tokens.css'
import SavroHeader from '../landing/components/SavroHeader'
import SavroFooter from '../landing/components/SavroFooter'

const NotFound: React.FC = () => {
  useSeo({
    title: 'Página não encontrada',
    description: 'A página que você tentou acessar não existe.',
    path: '/404',
    noindex: true,
  })

  return (
    <div className="savro flex min-h-screen flex-col">
      <SavroHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-24 text-center">
        <img src="/assets/savro/savro-icone.svg" alt="" aria-hidden="true" className="mb-8 h-14 w-14" />
        <h1 className="mb-4 text-[1.875rem] font-bold sm:text-[2.25rem]">Página não encontrada</h1>
        <p className="mb-10 max-w-md text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          O endereço acessado não existe neste site. Se você chegou aqui por um link antigo, ele
          pode ter sido descontinuado na migração do Savro para o app.
        </p>
        <Link
          to="/"
          className="rounded-full px-6 py-3.5 text-sm font-bold transition hover:opacity-90"
          style={{ background: 'var(--gradient-primary)', color: '#fff', boxShadow: 'var(--shadow-cta)' }}
        >
          Voltar para a página inicial
        </Link>
      </main>
      <SavroFooter />
    </div>
  )
}

export default NotFound
