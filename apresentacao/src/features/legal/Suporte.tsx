import React from 'react'
import { useSeo } from '../../hooks/useSeo'
import LegalLayout from './LegalLayout'
import LegalSection from './LegalSection'
import { SUPPORT_EMAIL } from '../../config/platforms'

const TOPICS = [
  {
    title: 'Como criar um backup',
    desc: 'No app, acesse as configurações do cofre e escolha "Criar backup". Defina uma senha forte — sem ela, o arquivo não pode ser restaurado depois.',
  },
  {
    title: 'Como restaurar um backup',
    desc: 'Escolha "Restaurar backup", selecione o arquivo .savrobackup e informe a senha. O app mostra uma prévia (quantidade de itens e moedas) antes de confirmar — a restauração substitui os dados atuais do cofre.',
  },
  {
    title: 'Como exportar CSV',
    desc: 'Nas configurações, escolha "Exportar CSV". Lembre-se: esse arquivo não é criptografado, então evite compartilhá-lo por canais inseguros.',
  },
  {
    title: 'Como relatar um problema sem enviar dados patrimoniais',
    desc: 'Descreva o que aconteceu (o que você esperava, o que aconteceu de fato) sem anexar o backup, o CSV ou prints com valores reais. Se possível, informe o modelo do aparelho e a versão do app.',
  },
]

const Suporte: React.FC = () => {
  useSeo({
    title: 'Suporte',
    description: 'Canal de contato do Savro e tópicos comuns: como criar backup, restaurar, exportar CSV e relatar problemas com segurança.',
    path: '/suporte',
  })

  return (
    <LegalLayout title="Suporte">
      <LegalSection title="Canal de contato">
        {SUPPORT_EMAIL ? (
          <p>
            Fale com a gente em <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        ) : (
          <p style={{ color: 'var(--warning)' }}>
            [Canal de contato ainda não configurado. Nenhum e-mail de suporte foi aprovado até a
            publicação desta página — não invente um endereço nem confie em outro canal como
            oficial.]
          </p>
        )}
      </LegalSection>

      <LegalSection title="Nunca envie estes dados pelo suporte">
        <p style={{ color: 'var(--negative)' }}>
          Nunca envie sua senha, seu arquivo de backup (<code>.savrobackup</code>) ou seu CSV
          exportado por e-mail, chat ou qualquer canal de suporte — mesmo que pareça o canal
          oficial do Savro. Ninguém do time precisa desses arquivos para te ajudar.
        </p>
      </LegalSection>

      <LegalSection title="Tópicos comuns">
        <div className="grid gap-4 sm:grid-cols-2">
          {TOPICS.map((topic) => (
            <div key={topic.title} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="mb-2 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {topic.title}
              </h3>
              <p className="text-[13px] leading-relaxed">{topic.desc}</p>
            </div>
          ))}
        </div>
      </LegalSection>
    </LegalLayout>
  )
}

export default Suporte
