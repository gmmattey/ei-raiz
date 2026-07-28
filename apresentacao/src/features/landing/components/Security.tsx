import React from 'react'

const GUARANTEES = [
  'Banco local criptografado (AES-256) — os dados nunca ficam em texto claro no aparelho.',
  'A chave que protege o cofre fica guardada pelo mecanismo seguro do próprio aparelho (Android Keystore / iOS Keychain), nunca em texto claro.',
  'O backup manual é protegido por senha escolhida por você — sem essa senha, o arquivo não abre.',
  'Nenhuma carteira ou dado patrimonial é enviado para servidor do Savro — porque esse servidor não existe.',
  'O banco interno do app não entra em backup automático de nuvem (Android Auto Backup ou iCloud/iTunes).',
]

const LIMITS = [
  'Se você perder a senha do backup, não há como recuperar o conteúdo desse arquivo — não existe recuperação por servidor.',
  'O CSV exportado é texto claro, sem criptografia — quem tiver acesso ao arquivo lê o conteúdo.',
  'Um aparelho comprometido (root/jailbreak com malware ativo) reduz as garantias de proteção — isso é um limite de qualquer app local, não só do Savro.',
  'O Savro não tem servidor patrimonial, então não recupera nada remotamente em nenhuma hipótese.',
]

const Security: React.FC = () => {
  return (
    <section id="seguranca" className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-[1.75rem] font-bold sm:text-[2.25rem]">Segurança, sem promessa vazia</h2>
        <p className="mx-auto mb-14 max-w-2xl text-center text-[1.0625rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Contamos o que o Savro protege — e também o que ele não consegue proteger.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl p-7" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="mb-5 text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--positive)' }}>
              O que garantimos
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
      </div>
    </section>
  )
}

export default Security
