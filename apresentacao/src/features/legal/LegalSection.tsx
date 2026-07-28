import React from 'react'

interface LegalSectionProps {
  title: string
  children: React.ReactNode
}

const LegalSection: React.FC<LegalSectionProps> = ({ title, children }) => (
  <section>
    <h2 className="mb-3 text-[1.125rem] font-bold" style={{ color: 'var(--text-primary)' }}>
      {title}
    </h2>
    <div className="flex flex-col gap-3 text-[14.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </div>
  </section>
)

export default LegalSection
