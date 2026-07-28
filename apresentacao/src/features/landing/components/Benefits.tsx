import React from 'react'
import { LayoutGrid, WifiOff, ShieldCheck, RefreshCw } from 'lucide-react'

const ITEMS = [
  { icon: LayoutGrid, title: 'Tudo em um lugar', desc: 'Organize bens, contas, investimentos e dívidas em uma visão única.' },
  { icon: WifiOff, title: 'Funciona offline', desc: 'Consulte e atualize seu patrimônio mesmo sem conexão.' },
  { icon: ShieldCheck, title: 'Protegido no aparelho', desc: 'Seu cofre é criptografado e protegido pelos recursos de segurança do celular.' },
  { icon: RefreshCw, title: 'Seus dados, suas escolhas', desc: 'Crie backups, troque entre Android e iPhone ou exporte uma planilha quando precisar.' },
]

const Benefits: React.FC = () => {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-xl">
          <h2 className="mb-4 text-[1.75rem] font-bold sm:text-[2.25rem]">Feito para o seu dia a dia</h2>
          <p className="text-[1.0625rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Recursos pensados para você enxergar e organizar seu patrimônio com clareza.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
