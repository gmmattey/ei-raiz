import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { carteiraApi, insightsApi, getStoredUser } from '../../cliente-api';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { assetPath } from '../../utils/assetPath';

const COLORS = ['#F56A2A', '#6FCF97', '#3B82F6', '#F2C94C', '#A7B0BC'];

const QUICK_ACTIONS = [
  { label: 'Importar', icon: '/assets/icons/laranja/importar-premium.svg', route: '/importar' },
  { label: 'Carteira', icon: '/assets/icons/laranja/carteira-premium.svg', route: '/carteira' },
  { label: 'Insights', icon: '/assets/icons/laranja/radar-premium.svg', route: '/insights' },
  { label: 'Historico', icon: '/assets/icons/laranja/historico-premium.svg', route: '/historico' },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value || 0));

const formatPercent = (value) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(value || 0));

function HiddenValue({ hidden, children }) {
  return <>{hidden ? '••••••' : children}</>;
}

export default function HomeMobile() {
  const navigate = useNavigate();
  const { ocultarValores, toggleOcultarValores } = useModoVisualizacao();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [usuario, setUsuario] = useState(() => getStoredUser());
  const [resumo, setResumo] = useState(null);
  const [insights, setInsights] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setErro('');
        const [dadosResumo, dadosInsights, dadosDashboard] = await Promise.all([
          carteiraApi.obterResumoCarteira(),
          insightsApi.obterResumo(),
          carteiraApi.obterDashboardPatrimonio(),
        ]);
        if (!ativo) return;
        setUsuario(getStoredUser());
        setResumo(dadosResumo);
        setInsights(dadosInsights);
        setDashboard(dadosDashboard);
      } catch {
        if (ativo) setErro('Nao foi possivel carregar os dados da home mobile.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const distribuicao = useMemo(() => {
    const totais = dashboard?.totais ?? {};
    const buckets = [
      { name: 'Acoes', value: Number(totais.acao ?? 0) },
      { name: 'Fundos', value: Number(totais.fundo ?? 0) },
      { name: 'Renda fixa', value: Number(totais.renda_fixa ?? 0) },
      { name: 'Previdencia', value: Number(totais.previdencia ?? 0) },
      { name: 'Bens', value: Number(totais.bens ?? 0) },
    ].filter((item) => item.value > 0);
    return buckets.length ? buckets : [{ name: 'Sem dados', value: 1 }];
  }, [dashboard]);

  const totalDistribuicao = distribuicao.reduce((acc, item) => acc + item.value, 0);
  const score = insights?.scoreUnificado?.score ?? insights?.score_unificado?.score ?? 0;
  const scoreBand = insights?.scoreUnificado?.band ?? insights?.score_unificado?.band;
  const patrimonio = Number(resumo?.patrimonioTotal ?? 0);
  const insightPrincipal =
    insights?.insightPrincipal?.titulo ||
    insights?.acaoPrioritaria?.titulo ||
    'Sem orientacoes criticas no momento';
  const nome = usuario?.nome?.split?.(' ')?.[0] || 'investidor';
  const scoreHistorico = insights?.scoreHistorico || [42, 50, 56, 60, 64, 66, 71, 73, 76];
  const scorePercent = Math.max(0, Math.min(100, score / 10));
  const faixaScore = scoreBand === 'critical' ? 'Critico' : scoreBand === 'fragile' ? 'Fragil' : scoreBand === 'stable' ? 'Estavel' : scoreBand === 'good' ? 'Bom' : 'Forte';
  const faixaCor = scoreBand === 'critical' ? '#E85C5C' : scoreBand === 'fragile' ? '#F2C94C' : '#6FCF97';

  return (
    <section className="space-y-4 pb-4">
      <header className="flex items-center justify-between pt-[max(8px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <img src={assetPath('/assets/logo/esquilo-invest-simbolo.png')} alt="Esquilo Invest" className="h-10 w-10 rounded-xl" />
          <div>
            <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Bom dia,</p>
            <p className="font-['Sora'] text-[20px] font-bold leading-6 text-[var(--text-primary)]">{nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleOcultarValores} className="rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] p-2">
            <img
              src={assetPath(ocultarValores ? '/assets/icons/laranja/ocultar-premium.svg' : '/assets/icons/laranja/olho-premium.svg')}
              alt="Alternar visibilidade"
              className="h-5 w-5"
            />
          </button>
          <button className="rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] p-2">
            <img src={assetPath('/assets/icons/laranja/alerta-premium.svg')} alt="Notificacoes" className="h-5 w-5" />
          </button>
        </div>
      </header>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Patrimonio total</p>
        <p className="mt-2 font-['Sora'] text-[32px] font-bold leading-[38px] text-[var(--text-primary)]">
          <HiddenValue hidden={ocultarValores}>{formatCurrency(patrimonio)}</HiddenValue>
        </p>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-medium text-[var(--text-secondary)]">Score da carteira</span>
            <span className="font-bold text-[#F56A2A]">
              <HiddenValue hidden={ocultarValores}>{Math.round(score)}/1000</HiddenValue>
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--border-color)]">
            <div className="h-2 rounded-full bg-[#F56A2A] transition-all duration-500" style={{ width: `${scorePercent}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
            <span>{faixaScore}</span>
            <span style={{ color: faixaCor }}>Atualizado</span>
          </div>
        </div>

        <div className={`mt-4 h-10 ${ocultarValores ? 'opacity-20 blur-[2px]' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scoreHistorico.map((value, index) => ({ value, index }))}>
              <Line type="monotone" dataKey="value" stroke="#6FCF97" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Acesso rapido</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.route)}
              className="flex flex-col items-center gap-1 rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] px-2 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
            >
              <img src={assetPath(action.icon)} alt={action.label} className="h-6 w-6" />
              <span className="text-[10px] font-semibold text-[var(--text-primary)]">{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Distribuicao da carteira</p>
        <div className="mt-3 flex items-center gap-4">
          <div className={`h-[112px] w-[112px] ${ocultarValores ? 'opacity-20 blur-[2px]' : ''}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribuicao} dataKey="value" innerRadius={28} outerRadius={50} paddingAngle={3}>
                  {distribuicao.map((item, index) => (
                    <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {distribuicao.map((item, index) => {
              const percentual = totalDistribuicao > 0 ? (item.value / totalDistribuicao) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[var(--text-secondary)]">{item.name}</span>
                  </div>
                  <span className="font-semibold text-[var(--text-primary)]">
                    <HiddenValue hidden={ocultarValores}>{formatPercent(percentual)}%</HiddenValue>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </article>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Insight prioritario</p>
        <div className="mt-2 flex items-start gap-2">
          <img src={assetPath('/assets/icons/laranja/info-premium.svg')} alt="" className="mt-[2px] h-4 w-4" />
          <p className="text-[14px] leading-5 text-[var(--text-primary)]">{insightPrincipal}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/insights')}
          className="mt-4 h-11 w-full rounded-[12px] bg-[#F56A2A] text-[12px] font-bold uppercase tracking-[0.12em] text-white"
        >
          Ver detalhes
        </button>
      </article>

      {loading && <p className="text-[12px] text-[var(--text-secondary)]">Carregando dados...</p>}
      {erro && (
        <div className="rounded-[12px] border border-[#E85C5C] bg-[#E85C5C]/10 p-3">
          <p className="text-[12px] font-medium text-[#E85C5C]">{erro}</p>
        </div>
      )}
    </section>
  );
}

