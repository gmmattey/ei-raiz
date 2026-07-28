import React from 'react'
import { useSeo } from '../../hooks/useSeo'
import LegalLayout from './LegalLayout'

const Changelog: React.FC = () => {
  useSeo({
    title: 'Changelog',
    description: 'Histórico público de mudanças do Savro. O changelog começa a valer a partir do lançamento do MVP1.',
    path: '/changelog',
  })

  return (
    <LegalLayout title="Changelog">
      <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="mb-1 text-[13px] font-semibold" style={{ color: 'var(--secondary)' }}>
          Em desenvolvimento
        </div>
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          O MVP1 do Savro ainda está sendo construído e não foi publicado nas lojas. O changelog
          público começa a partir do lançamento — não há histórico de versões anterior a isso.
        </p>
      </div>
    </LegalLayout>
  )
}

export default Changelog
