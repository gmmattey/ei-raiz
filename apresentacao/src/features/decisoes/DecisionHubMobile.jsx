import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { decisoesApi } from '../../cliente-api';
import { assetPath } from '../../utils/assetPath';

const SIMULADORES = [
  { label: 'Imovel', route: '/decisoes/imovel', icon: '/assets/icons/laranja/home-premium.svg' },
  { label: 'Carro', route: '/decisoes/carro', icon: '/assets/icons/laranja/carteira-premium.svg' },
  { label: 'Reserva ou financiar', route: '/decisoes/reserva-ou-financiar', icon: '/assets/icons/laranja/score-premium.svg' },
  { label: 'Gastar ou investir', route: '/decisoes/gastar-ou-investir', icon: '/assets/icons/laranja/tendencia-premium.svg' },
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
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <section className="space-y-4 pb-4">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Decisoes</p>
        <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Simuladores estrategicos</h1>
      </header>

      <div className="space-y-2">
        {SIMULADORES.map((sim) => (
          <button
            key={sim.route}
            onClick={() => navigate(sim.route)}
            className="flex w-full items-center justify-between rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <img src={assetPath(sim.icon)} alt="" className="h-5 w-5" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">{sim.label}</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F56A2A]">Abrir</span>
          </button>
        ))}
      </div>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Historico recente</p>
          <button onClick={() => navigate('/decisoes/historico')} className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F56A2A]">
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
              <span className="text-[12px] font-semibold text-[var(--text-primary)]">{item.tipoDecisao || 'Simulacao'}</span>
              <span className="text-[11px] text-[var(--text-secondary)]">{item.criadoEm ? new Date(item.criadoEm).toLocaleDateString('pt-BR') : 'Recente'}</span>
            </button>
          ))}
          {!loading && historico.length === 0 && <p className="text-[12px] text-[var(--text-secondary)]">Nenhuma simulacao salva.</p>}
        </div>
      </article>
    </section>
  );
}

