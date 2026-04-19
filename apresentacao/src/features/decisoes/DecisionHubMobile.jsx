import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Car, ShieldCheck, TrendingUp, Settings, ArrowRight } from 'lucide-react';
import { decisoesApi } from '../../cliente-api';

const BLOCOS = [
  {
    titulo: 'Objetivos patrimoniais',
    itens: [
      {
        label: 'Imóvel',
        desc: 'Comprar ou alugar com base no seu patrimônio real.',
        route: '/decisoes/imovel',
        icon: Home,
        cor: '#F56A2A',
        bg: 'rgba(245,106,42,0.12)',
      },
      {
        label: 'Carro',
        desc: 'Compare custo de posse contra investir o valor.',
        route: '/decisoes/carro',
        icon: Car,
        cor: '#3B82F6',
        bg: 'rgba(59,130,246,0.12)',
      },
    ],
  },
  {
    titulo: 'Decisões de caixa e liquidez',
    itens: [
      {
        label: 'Reserva ou financiar',
        desc: 'Descapitalizar agora ou manter liquidez?',
        route: '/decisoes/reserva-ou-financiar',
        icon: ShieldCheck,
        cor: '#10B981',
        bg: 'rgba(16,185,129,0.12)',
      },
      {
        label: 'Gastar ou investir',
        desc: 'Visualize o custo de oportunidade do consumo.',
        route: '/decisoes/gastar-ou-investir',
        icon: TrendingUp,
        cor: '#8B5CF6',
        bg: 'rgba(139,92,246,0.12)',
      },
    ],
  },
];

export default function DecisionHubMobile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await decisoesApi.listarSimulacoes();
        if (!ativo) return;
        setHistorico(dados || []);
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  return (
    <section className="space-y-6 pb-4">
      {BLOCOS.map((bloco) => (
        <div key={bloco.titulo} className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            {bloco.titulo}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {bloco.itens.map((sim) => {
              const Icon = sim.icon;
              return (
                <button
                  key={sim.route}
                  onClick={() => navigate(sim.route)}
                  className="flex flex-col items-start gap-3 rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-left active:opacity-80"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                    style={{ background: sim.bg }}
                  >
                    <Icon size={18} style={{ color: sim.cor }} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[13px] font-bold leading-tight text-[var(--text-primary)]">{sim.label}</p>
                    <p className="text-[11px] leading-snug text-[var(--text-secondary)]">{sim.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={() => navigate('/decisoes/livre')}
        className="flex w-full items-center justify-between rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-left active:opacity-80"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ background: 'rgba(245,106,42,0.10)' }}>
            <Settings size={15} style={{ color: '#F56A2A' }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">Simulação livre</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Crie seu próprio cenário</p>
          </div>
        </div>
        <ArrowRight size={14} className="text-[#F56A2A]" />
      </button>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Simulações recentes</p>
          <button
            onClick={() => navigate('/decisoes/historico')}
            className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F56A2A]"
          >
            Ver tudo
          </button>
        </div>
        <div className="space-y-2">
          {historico.slice(0, 3).map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/decisoes/resultado/${item.id}`)}
              className="flex w-full items-center justify-between rounded-[12px] border border-[var(--border-color)] px-3 py-2 text-left"
            >
              <span className="text-[12px] font-semibold text-[var(--text-primary)]">{item.tipoDecisao || 'Simulação'}</span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                {item.criadoEm ? new Date(item.criadoEm).toLocaleDateString('pt-BR') : 'Recente'}
              </span>
            </button>
          ))}
          {!loading && historico.length === 0 && (
            <p className="text-[12px] text-[var(--text-secondary)]">Nenhuma simulação salva.</p>
          )}
        </div>
      </article>
    </section>
  );
}
