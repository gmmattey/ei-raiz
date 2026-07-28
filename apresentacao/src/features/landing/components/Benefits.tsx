import React from 'react'
import { LayoutGrid, WifiOff, Database, RefreshCw, FileDown, ShieldCheck, EyeOff as EyeOffIcon } from 'lucide-react'

const ITEMS = [
  { icon: LayoutGrid, title: 'Organização patrimonial manual', desc: 'Cadastre contas, bens e investimentos do seu jeito, sem depender de integração automática.' },
  { icon: LayoutGrid, title: 'Visão consolidada', desc: 'Veja o todo do seu patrimônio em um único lugar, organizado por categoria.' },
  { icon: WifiOff, title: 'Funciona offline', desc: 'Sem internet, sem problema — o app não depende de rede para nada.' },
  { icon: Database, title: 'Banco local cifrado', desc: 'Seus dados ficam guardados em um banco criptografado, só no seu aparelho.' },
  { icon: RefreshCw, title: 'Backup Android ↔ iOS', desc: 'Gere um backup criptografado e restaure no mesmo aparelho ou em outro, mesmo trocando de plataforma.' },
  { icon: FileDown, title: 'Exportação CSV', desc: 'Exporte seus dados para planilha quando quiser, sob sua decisão explícita.' },
  { icon: EyeOffIcon, title: 'Máscara de valores', desc: 'Oculte os valores na tela com um toque — útil em qualquer lugar público.' },
  { icon: ShieldCheck, title: 'Restauração controlada', desc: 'Restaurar um backup mostra uma prévia antes de qualquer confirmação.' },
]

const Benefits: React.FC = () => {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-xl">
          <h2 className="mb-4 text-[1.75rem] font-bold sm:text-[2.25rem]">Feito para quem quer controle, não complicação</h2>
          <p className="text-[1.0625rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Recursos pensados para organizar patrimônio sem depender de conta, nuvem ou terceiros.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'rgba(71,114,245,.12)' }}
                aria-hidden="true"
              >
                <Icon size={19} color="var(--secondary)" strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Benefits
