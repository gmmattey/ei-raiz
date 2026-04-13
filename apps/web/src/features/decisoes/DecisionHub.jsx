import React, { useEffect, useMemo, useState } from 'react';
import { Home, Car, ShieldCheck, ShoppingBag, Settings, History, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { decisoesApi } from '../../cliente-api';

const DecisionHub = () => {
  const navigate = useNavigate();
  const [recentes, setRecentes] = useState([]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const data = await decisoesApi.listarSimulacoes();
        if (!ativo) return;
        setRecentes((data || []).slice(0, 3));
      } catch {
        if (!ativo) return;
        setRecentes([]);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const simulators = [
    {
      id: 'imovel',
      title: 'Comprar ou alugar imóvel',
      desc: 'Análise profunda entre aquisição própria e aluguel com investimento da diferença.',
      icon: <Home size={24} />,
      path: '/decisoes/imovel',
    },
    {
      id: 'carro',
      title: 'Comprar carro ou investir',
      desc: 'Compare o custo total de posse de um veículo contra o potencial de investimento.',
      icon: <Car size={24} />,
      path: '/decisoes/carro',
    },
    {
      id: 'reserva-ou-financiar',
      title: 'Usar reserva ou financiar',
      desc: 'Descubra se vale a pena descapitalizar agora ou manter a liquidez com financiamento.',
      icon: <ShieldCheck size={24} />,
      path: '/decisoes/reserva-ou-financiar',
    },
    {
      id: 'gastar-ou-investir',
      title: 'Gastar agora ou investir',
      desc: 'Visualize o custo de oportunidade de um consumo imediato no seu longo prazo.',
      icon: <ShoppingBag size={24} />,
      path: '/decisoes/gastar-ou-investir',
    },
    {
      id: 'livre',
      title: 'Simulação livre',
      desc: 'Crie seu próprio cenário de comparação financeira com parâmetros flexíveis.',
      icon: <Settings size={24} />,
      path: '/decisoes/livre',
    },
    {
      id: 'historico',
      title: 'Histórico de simulações',
      desc: 'Acesse e compare suas análises salvas anteriormente.',
      icon: <History size={24} />,
      path: '/decisoes/historico',
    },
  ];

  const blocos = [
    { titulo: 'Objetivos patrimoniais', itens: simulators.filter((s) => ['imovel', 'carro'].includes(s.id)) },
    { titulo: 'Decisões de caixa e liquidez', itens: simulators.filter((s) => ['reserva-ou-financiar', 'gastar-ou-investir'].includes(s.id)) },
    { titulo: 'Acompanhamento', itens: simulators.filter((s) => ['livre', 'historico'].includes(s.id)) },
  ];

  return (
    <div className="w-full font-['Inter'] text-[#0B1218]">
      <section className="mb-12 fade-in-up">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">
          Inteligência Estratégica
        </p>
        <h1 className="mb-4 font-['Sora'] text-3xl font-bold tracking-tight text-[#0B1218] md:text-4xl">
          Decisões Financeiras.
        </h1>
        <p className="text-sm text-[#0B1218]/60 max-w-2xl leading-relaxed">
          O Esquilo ajuda você a simular cenários complexos com base no seu patrimônio real, 
          perfil de risco e objetivos de vida. Escolha um simulador abaixo para começar.
        </p>
      </section>

      <div className="space-y-10 fade-in-up" style={{ animationDelay: '0.1s' }}>
        {blocos.map((bloco) => (
          <section key={bloco.titulo}>
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">{bloco.titulo}</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bloco.itens.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="group flex flex-col items-start gap-6 rounded-sm border border-[#EFE7DC] bg-white p-8 text-left transition-all hover:border-[#F56A2A] hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#F56A2A]/10 text-[#F56A2A] transition-colors group-hover:bg-[#F56A2A] group-hover:text-white">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-['Sora'] text-lg font-bold text-[#0B1218] group-hover:text-[#F56A2A] transition-colors">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-[#0B1218]/50">
                      {item.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#F56A2A] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1">
                    Simular <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {recentes.length > 0 && (
        <section className="mt-12">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">Simulações recentes</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recentes.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/decisoes/resultado/${item.id}`)}
                className="rounded-sm border border-[#EFE7DC] bg-white p-4 text-left hover:border-[#F56A2A]"
              >
                <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">{item.nome}</p>
                <p className="mt-1 text-[11px] text-[#0B1218]/60">{item.resumoCurto || item.diagnosticoTitulo || 'Sem resumo'}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default DecisionHub;
