import React from 'react'
import '../landing/savro-tokens.css'
import SavroHeader from '../landing/components/SavroHeader'
import SavroFooter from '../landing/components/SavroFooter'

interface LegalLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

const LegalLayout: React.FC<LegalLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="savro">
      <SavroHeader />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <h1 className="mb-3 text-[1.875rem] font-bold sm:text-[2.25rem]">{title}</h1>
        {subtitle && (
          <p className="mb-10 text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
            {subtitle}
          </p>
        )}
        <div className="legal-content flex flex-col gap-8">{children}</div>
      </main>
      <SavroFooter />
    </div>
  )
}

export default LegalLayout
