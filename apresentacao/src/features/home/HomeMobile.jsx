import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, Line, ResponsiveContainer,
  XAxis, Tooltip,
} from 'recharts';
import { carteiraApi, insightsApi, historicoApi, getStoredUser } from '../../cliente-api';
import { cache } from '../../utils/cache';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { assetPath } from '../../utils/assetPath';

const HOME_MOBILE_CACHE_KEY = 'home_mobile_v1';
const HOME_MOBILE_CACHE_FRESCA_TTL = 60 * 1000;
const FILTROS_ALL = ['1M', '3M', '6M', '1A', 'Max'];
const FILTROS_MESES = { '1M': 1, '3M': 3, '6M': 6, '1A': 12 };

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(Number(v || 0));

const fmtPct = (v) =>
  `${Number(v || 0) >= 0 ? '+' : ''}${Number(v || 0).toFixed(1)}%`;

const retornoDesdeAquisicao = (obj) =>
  obj?.retornoDesdeAquisicao ?? obj?.retorno_desde_aquisicao ?? obj?.retorno12m ?? 0;

const getSaudacao = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const getNomeExibicao = (nomeCompleto) => {
  const partes = String(nomeCompleto || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return 'investidor(a)';
  if (partes.length >= 2) return `${partes[0]} ${partes[1]}`;
  return partes[0];
};

function HiddenValue({ hidden, children }) {
  return <>{hidden ? '••••••' : children}</>;
}

export default function HomeMobile() {
  const navigate = useNavigate();
  const { ocultarValores } = useModoVisualizacao();

  const [loading, setLoading]     = useState(() => !cache.get(HOME_MOBILE_CACHE_KEY)?.resumo);
  const [erro, setErro]           = useState('');
  const [usuario, setUsuario]     = useState(() => getStoredUser());
  const [resumo, setResumo]       = useState(() => cache.get(HOME_MOBILE_CACHE_KEY)?.resumo ?? null);
  const [insights, setInsights]   = useState(() => cache.get(HOME_MOBILE_CACHE_KEY)?.insights ?? null);
  const [ativos, setAtivos]       = useState(() => cache.get(HOME_MOBILE_CACHE_KEY)?.ativos ?? []);
  const [historicoMensal, setHistoricoMensal] = useState(() =>
    cache.get(HOME_MOBILE_CACHE_KEY)?.historicoMensal ?? []);
  const [benchmark, setBenchmark] = useState(() =>
    cache.get(HOME_MOBILE_CACHE_KEY)?.benchmark ?? null);

  const [filtroTempo, setFiltroTempo] = useState('1A');
  const [showCDI, setShowCDI]         = useState(false);

  const salvarCache = (dados) => cache.set(HOME_MOBILE_CACHE_KEY, dados);

  const recarregarSemPiscada = async () => {
    try {
      const TTL = 60 * 1000;
      const resumoCached   = cache.get('carteira_resumo', TTL);
      const insightsCached = cache.get('insights_resumo', TTL);

      const [dadosResumo, dadosInsights, dadosAtivos, dadosHistorico, dadosBenchmark] = await Promise.all([
        resumoCached
          ? Promise.resolve(resumoCached)
          : carteiraApi.obterResumoCarteiraComFallback().then(r => { cache.set('carteira_resumo', r); return r; }),
        insightsCached
          ? Promise.resolve(insightsCached)
          : insightsApi.obterResumoComFallback().then(r => { cache.set('insights_resumo', r); return r; }),
        carteiraApi.listarAtivosCarteira().catch(() => []),
        historicoApi.listarHistoricoMensal(24).catch(() => ({ pontos: [] })),
        carteiraApi.obterBenchmarkCarteiraComFallback(24).catch(() => null),
      ]);

      const pontos = [...(dadosHistorico?.pontos ?? [])].sort((a, b) => a.anoMes.localeCompare(b.anoMes));
      setUsuario(getStoredUser());
      setResumo(dadosResumo);
      setInsights(dadosInsights);
      setAtivos(dadosAtivos);
      setHistoricoMensal(pontos);
      setBenchmark(dadosBenchmark);
      salvarCache({
        resumo: dadosResumo, insights: dadosInsights,
        ativos: dadosAtivos, historicoMensal: pontos, benchmark: dadosBenchmark,
      });
    } catch {
      setErro('Falha ao atualizar dados.');
    }
  };

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setErro('');

        const dadosCache = cache.get(HOME_MOBILE_CACHE_KEY);
        if (dadosCache?.resumo) {
          // Renderizar imediatamente com cache existente
          setResumo(dadosCache.resumo);
          setInsights(dadosCache.insights ?? null);
          setAtivos(dadosCache.ativos ?? []);
          setHistoricoMensal(dadosCache.historicoMensal ?? []);
          setBenchmark(dadosCache.benchmark ?? null);
          setLoading(false);
          // Recarregar em background só se cache tiver mais de 60s
          const cacheEstaFresco = Boolean(cache.get(HOME_MOBILE_CACHE_KEY, HOME_MOBILE_CACHE_FRESCA_TTL));
          if (!cacheEstaFresco && ativo) {
            setTimeout(() => { if (ativo) void recarregarSemPiscada(); }, 0);
          }
          return;
        }

        setLoading(true);
        const [dadosResumo, dadosInsights, dadosAtivos, dadosHistorico, dadosBenchmark] = await Promise.all([
          carteiraApi.obterResumoCarteiraComFallback(),
          insightsApi.obterResumoComFallback(),
          carteiraApi.listarAtivosCarteira().catch(() => []),
          historicoApi.listarHistoricoMensal(24).catch(() => ({ pontos: [] })),
          carteiraApi.obterBenchmarkCarteiraComFallback(24).catch(() => null),
        ]);
        if (!ativo) return;

        const pontos = [...(dadosHistorico?.pontos ?? [])].sort((a, b) => a.anoMes.localeCompare(b.anoMes));
        setUsuario(getStoredUser());
        setResumo(dadosResumo);
        setInsights(dadosInsights);
        setAtivos(dadosAtivos);
        setHistoricoMensal(pontos);
        setBenchmark(dadosBenchmark);
        // Salvar cache imediatamente
        salvarCache({
          resumo: dadosResumo, insights: dadosInsights,
          ativos: dadosAtivos, historicoMensal: pontos, benchmark: dadosBenchmark,
        });
      } catch {
        if (ativo) setErro('Não foi possível carregar os dados.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  const score        = insights?.scoreUnificado?.score ?? insights?.score_unificado?.score ?? 0;
  const patrimonio   = Number(resumo?.patrimonioTotal ?? 0);
  const alertasCount = insights?.diagnostico?.riscos?.length ?? 0;

  const n = historicoMensal.length;
  const filtrosDisponiveis = FILTROS_ALL.filter(f => {
    if (f === 'Max') return n > 0;
    return n >= FILTROS_MESES[f];
  });

  const filtroEfetivo = filtrosDisponiveis.includes(filtroTempo)
    ? filtroTempo
    : (filtrosDisponiveis[filtrosDisponiveis.length - 1] ?? 'Max');

  /* benchmark.serie usa índice base-100 — escala incompatível com R$ absoluto.
     Quando CDI está ON, usa os dados do benchmark diretamente. */
  const isCdiMode = showCDI && Boolean(benchmark?.serie?.length);
  const dadosGrafico = useMemo(() => {
    if (isCdiMode) {
      const serie = [...benchmark.serie].sort((a, b) => a.data.localeCompare(b.data));
      const filtrada = filtroEfetivo === 'Max' ? serie : serie.slice(-FILTROS_MESES[filtroEfetivo]);
      return filtrada.map(p => ({ ...p, anoMes: p.data?.slice(0, 7) }));
    }
    const pontos = filtroEfetivo === 'Max' ? historicoMensal : historicoMensal.slice(-FILTROS_MESES[filtroEfetivo]);
    return pontos;
  }, [historicoMensal, filtroEfetivo, isCdiMode, benchmark]);

  const ativosTop = useMemo(() =>
    [...ativos].sort((a, b) => Number(b.valorAtual) - Number(a.valorAtual)).slice(0, 5),
  [ativos]);

  const alertasList = useMemo(() => {
    const riscos = insights?.diagnostico?.riscos ?? [];
    const acoes  = insights?.diagnostico?.acoes  ?? [];
    return [
      ...riscos.slice(0, 1).map(r => ({ tipo: 'alerta',       titulo: r.titulo })),
      ...acoes.slice(0,  1).map(a => ({ tipo: 'oportunidade', titulo: a.titulo })),
    ];
  }, [insights]);

  return (
    <section className="space-y-4 pb-4">

      {/* Saudação */}
      <div className="px-0.5">
        <p className="font-['Sora'] text-sm font-semibold text-[var(--text-primary)]">{getSaudacao()},</p>
        <h1 className="font-['Sora'] text-2xl font-bold leading-tight mt-0.5">
          <span className="text-[#F56A2A]">{getNomeExibicao(usuario?.nome)}</span>
          <span className="text-[var(--text-primary)]">.</span>
        </h1>
      </div>

      {/* Card patrimônio */}
      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] mb-2">
          Patrimônio total
        </p>
        <p className="font-['Sora'] text-[32px] font-bold leading-[38px] text-[var(--text-primary)]">
          <HiddenValue hidden={ocultarValores}>{fmt(patrimonio)}</HiddenValue>
        </p>

        <div className="mt-3 flex items-center gap-5 flex-wrap">
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Desde aquisição</p>
            <p className={`text-[14px] font-bold mt-0.5 ${retornoDesdeAquisicao(resumo) >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
              <HiddenValue hidden={ocultarValores}>{fmtPct(retornoDesdeAquisicao(resumo))}</HiddenValue>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Score</p>
            <p className="text-[14px] font-bold mt-0.5 text-[#F56A2A]">
              <HiddenValue hidden={ocultarValores}>{Math.round(score)}</HiddenValue>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Alertas</p>
            <p className={`text-[14px] font-bold mt-0.5 ${alertasCount > 0 ? 'text-[#E85C5C]' : 'text-[#6FCF97]'}`}>
              {alertasCount}
            </p>
          </div>
        </div>
      </article>

      {/* Evolução patrimonial */}
      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-['Sora'] text-[13px] font-bold text-[var(--text-primary)]">Evolução</h3>
            {benchmark?.serie?.length > 0 && (
              <button
                onClick={() => setShowCDI(v => !v)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-colors ${
                  showCDI
                    ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                    : 'border-[var(--border-color)] text-[var(--text-muted)]'
                }`}
              >
                CDI
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {filtrosDisponiveis.map(f => (
              <button
                key={f}
                onClick={() => setFiltroTempo(f)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                  filtroEfetivo === f ? 'bg-[#F56A2A] text-white' : 'text-[var(--text-muted)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className={`h-[100px] ${ocultarValores ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
          {dadosGrafico.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGrafico} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F56A2A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#F56A2A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey={isCdiMode ? 'carteira' : 'totalAtual'}
                  stroke="#F56A2A"
                  strokeWidth={2}
                  fill="url(#gradMobile)"
                  dot={false}
                  isAnimationActive={false}
                />
                {isCdiMode && (
                  <Line
                    type="monotone"
                    dataKey="cdi"
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-[12px] text-[var(--text-muted)]">
                {loading ? 'Carregando...' : 'Sem histórico disponível'}
              </p>
            </div>
          )}
        </div>
      </article>

      {/* Principais Ativos */}
      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-['Sora'] text-[13px] font-bold text-[var(--text-primary)]">Principais Ativos</h3>
          {ativosTop.length > 0 && (
            <button onClick={() => navigate('/carteira')} className="text-[11px] font-semibold text-[#F56A2A]">
              Ver tudo
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-[12px] text-[var(--text-muted)] text-center py-4">Carregando...</p>
        ) : ativosTop.length > 0 ? (
          <div className="space-y-3">
            {ativosTop.map(ativo => (
              <button
                key={ativo.id}
                onClick={() => navigate(`/ativo/${ativo.ticker}`)}
                className="w-full flex items-center justify-between"
              >
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[var(--text-primary)]">{ativo.ticker}</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{ativo.nome}</p>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="text-[13px] font-bold text-[var(--text-primary)]">
                    <HiddenValue hidden={ocultarValores}>{fmt(ativo.valorAtual)}</HiddenValue>
                  </p>
                  <p className={`text-[11px] font-semibold ${retornoDesdeAquisicao(ativo) >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
                    <HiddenValue hidden={ocultarValores}>{fmtPct(retornoDesdeAquisicao(ativo))}</HiddenValue>
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-[12px] text-[var(--text-muted)] text-center">Nenhum ativo cadastrado ainda.</p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => navigate('/importar')}
                className="flex-1 rounded-xl bg-[#F56A2A] py-2.5 text-[11px] font-bold text-white"
              >
                Importar
              </button>
              <button
                onClick={() => navigate('/carteira')}
                className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2.5 text-[11px] font-bold text-[var(--text-primary)]"
              >
                Cadastrar manualmente
              </button>
            </div>
          </div>
        )}
      </article>

      {/* Alertas */}
      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-['Sora'] text-[13px] font-bold text-[var(--text-primary)]">Alertas</h3>
          <button onClick={() => navigate('/insights')} className="text-[11px] font-semibold text-[#F56A2A]">
            Ver análise
          </button>
        </div>

        {alertasList.length > 0 ? (
          <div className="space-y-2.5">
            {alertasList.map((alerta, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-3 flex items-center justify-between ${
                  alerta.tipo === 'alerta' ? 'bg-[#E85C5C]/8' : 'bg-[#6FCF97]/8'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${
                    alerta.tipo === 'alerta' ? 'text-[#E85C5C]' : 'text-[#6FCF97]'
                  }`}>
                    {alerta.tipo === 'alerta' ? 'Ação' : 'Oportunidade'}
                  </span>
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] mt-0.5 truncate">{alerta.titulo}</p>
                </div>
                <button
                  onClick={() => navigate('/insights')}
                  className="text-[11px] font-bold text-[#F56A2A] ml-3 flex-shrink-0"
                >
                  {alerta.tipo === 'alerta' ? 'Agir >' : 'Ver >'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[var(--text-muted)] text-center py-2">
            {loading ? 'Carregando alertas...' : 'Nenhum alerta no momento'}
          </p>
        )}
      </article>

      {erro && (
        <div className="rounded-[12px] border border-[#E85C5C] bg-[#E85C5C]/10 p-3">
          <p className="text-[12px] font-medium text-[#E85C5C]">{erro}</p>
        </div>
      )}
    </section>
  );
}
