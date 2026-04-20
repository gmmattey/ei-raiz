import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, Tooltip,
} from 'recharts';
import { patrimonioApi } from '../../cliente-api';
import { cache } from '../../utils/cache';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { assetPath } from '../../utils/assetPath';

// ─── Constantes ──────────────────────────────────────────────────────────────

const CACHE_KEY = 'carteira_mobile_v1';
const CACHE_TTL = 60 * 1000;

const CATS_INVESTIMENTO = ['acao', 'fundo', 'renda_fixa', 'previdencia', 'poupanca'];

const CATEGORIAS = [
  { key: 'acao',       label: 'Ações',       route: '/acoes',      icon: '/assets/icons/laranja/grafico-premium.svg' },
  { key: 'fundo',      label: 'Fundos',      route: '/fundos',     icon: '/assets/icons/laranja/fundos-premium.svg' },
  { key: 'renda_fixa', label: 'Renda Fixa',  route: '/renda-fixa', icon: '/assets/icons/laranja/carteira-premium.svg' },
  { key: 'previdencia',label: 'Previdência', route: '/previdencia',icon: '/assets/icons/laranja/previdencia-premium.svg' },
  { key: 'bens',       label: 'Bens',        route: '/bens',       icon: '/assets/icons/laranja/home-premium.svg' },
  { key: 'poupanca',   label: 'Poupança',    route: '/poupanca',   icon: '/assets/icons/laranja/carteira-premium.svg' },
];

const FILTROS_ALL   = ['1M', '3M', '6M', '1A', 'Max'];
const FILTROS_MESES = { '1M': 1, '3M': 3, '6M': 6, '1A': 12 };
const MESES_ABREV   = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const LABEL_TIPO = {
  todos:       'Todos',
  acao:        'Ações',
  fundo:       'Fundos',
  renda_fixa:  'Renda Fixa',
  previdencia: 'Previdência',
  poupanca:    'Poupança',
};

const SCORE_FAIXAS = {
  critico:   { label: 'Crítico',  cor: '#E85C5C' },
  baixo:     { label: 'Baixo',    cor: '#F2C94C' },
  medio:     { label: 'Médio',    cor: '#F2C94C' },
  bom:       { label: 'Bom',      cor: '#6FCF97' },
  excelente: { label: 'Excelente', cor: '#6FCF97' },
};

const TIPO_PARA_CATEGORIA = {
  acao: 'acao', fii: 'acao', etf: 'acao',
  fundo: 'fundo', previdencia: 'previdencia', renda_fixa: 'renda_fixa',
  poupanca: 'poupanca', imovel: 'bens', veiculo: 'bens',
  cripto: 'outros', caixa: 'outros', divida: null, outro: 'outros',
};

function adaptarItem(item) {
  const categoria = TIPO_PARA_CATEGORIA[item.tipo] ?? 'outros';
  if (categoria === null) return null;
  return {
    id: item.id,
    ticker: item.ticker,
    nome: item.nome,
    categoria,
    quantidade: item.quantidade ?? 0,
    precoMedio: item.precoMedioBrl ?? 0,
    preco_medio: item.precoMedioBrl ?? 0,
    precoAtual: item.precoAtualBrl,
    valorAtual: item.valorAtualBrl ?? 0,
    participacao: item.pesoPct ?? 0,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v || 0));

const fmtPct = (v) => {
  const n = Number(v ?? 0);
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

const formatMes = (anoMes) => {
  const [, mes] = (anoMes || '').split('-');
  return MESES_ABREV[parseInt(mes, 10) - 1] ?? anoMes;
};

const getConsolidationKey = (asset) => {
  if (asset.categoria === 'acao')       return asset.ticker;
  if (asset.categoria === 'fundo')      return `fundo_${asset.nome || asset.ticker}`;
  if (asset.categoria === 'renda_fixa') return `rf_${asset.nome || asset.ticker}`;
  if (asset.categoria === 'previdencia')return `prev_${asset.nome || asset.ticker}`;
  if (asset.categoria === 'poupanca')   return `poup_${asset.nome}`;
  if (asset.categoria === 'bens')       return `bem_${asset.nome}`;
  return asset.ticker || asset.nome;
};

const consolidarAtivos = (ativos) => {
  const mapa = {};
  for (const ativo of ativos) {
    const chave = getConsolidationKey(ativo);
    if (!mapa[chave]) {
      mapa[chave] = { ...ativo };
    } else {
      const existing  = mapa[chave];
      const qtdNova   = Number(ativo.quantidade ?? 0);
      const precoNovo = Number(ativo.precoMedio ?? ativo.preco_medio ?? 0);
      const qtdExisting   = Number(existing.quantidade ?? 0);
      const precoExisting = Number(existing.precoMedio ?? existing.preco_medio ?? 0);
      const totalQtd = qtdExisting + qtdNova;
      existing.quantidade  = totalQtd;
      existing.precoMedio  = totalQtd > 0 ? ((qtdExisting * precoExisting) + (qtdNova * precoNovo)) / totalQtd : precoExisting;
      existing.preco_medio = existing.precoMedio;
      existing.valorAtual  = Number(existing.valorAtual ?? 0) + Number(ativo.valorAtual ?? 0);
    }
  }
  return Object.values(mapa);
};

function HiddenValue({ hidden, children }) {
  return <>{hidden ? '••••••' : children}</>;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function CarteiraMobile() {
  const navigate = useNavigate();
  const { ocultarValores } = useModoVisualizacao();

  const cached = cache.get(CACHE_KEY);

  const [loading, setLoading]         = useState(!cached?.ativos);
  const [erro, setErro]               = useState('');
  const [ativos, setAtivos]           = useState(() => cached?.ativos ?? []);
  const [insights, setInsights]       = useState(() => cached?.insights ?? null);
  const [historicoMensal, setHistoricoMensal] = useState(() => cached?.historicoMensal ?? []);
  const [monthlyPerformance, setMonthlyPerformance] = useState(() => cached?.monthlyPerformance ?? { available: false, points: [] });
  const [benchmark, setBenchmark]     = useState(() => cached?.benchmark ?? null);

  // Controles do gráfico
  const [filtroTempo, setFiltroTempo] = useState('1A');
  const [filtroTipo, setFiltroTipo]   = useState('todos');
  const [showCDI, setShowCDI]         = useState(false);

  const buscarDados = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [itensResp, scoreResp, historicoResp] = await Promise.all([
        patrimonioApi.listarItens().catch(() => ({ itens: [] })),
        patrimonioApi.obterScore().catch(() => null),
        patrimonioApi.obterHistorico().catch(() => ({ itens: [] })),
      ]);

      const consolidados = consolidarAtivos((itensResp?.itens ?? []).map(adaptarItem).filter(Boolean));
      const pontos = (historicoResp?.itens ?? [])
        .map((p) => ({ anoMes: p.anoMes, totalAtual: p.patrimonioBrutoBrl ?? 0 }))
        .sort((a, b) => a.anoMes.localeCompare(b.anoMes));
      const dadosInsights = scoreResp
        ? { scoreUnificado: { score: scoreResp.scoreTotal ?? 0, band: scoreResp.faixa ?? null } }
        : null;
      const monthlyPerf = { available: false, points: [] };

      setAtivos(consolidados);
      setInsights(dadosInsights);
      setHistoricoMensal(pontos);
      setMonthlyPerformance(monthlyPerf);
      setBenchmark(null);
      setErro('');

      cache.set(CACHE_KEY, { ativos: consolidados, insights: dadosInsights, historicoMensal: pontos, monthlyPerformance: monthlyPerf, benchmark: null });
    } catch {
      if (!silencioso) setErro('Não foi possível carregar a carteira.');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    let ativo = true;
    const dadosCache = cache.get(CACHE_KEY);

    if (dadosCache?.ativos) {
      // Cache hit: exibe imediatamente e atualiza em background sem piscar
      void buscarDados(true);
    } else {
      void buscarDados(false);
    }

    return () => { ativo = false; };
  }, []);

  // ── Dados derivados ─────────────────────────────────────────────────────────

  const totalInvestimentos = useMemo(() =>
    ativos
      .filter(a => CATS_INVESTIMENTO.includes(a.categoria))
      .reduce((acc, a) => acc + Number(a.valorAtual ?? 0), 0),
  [ativos]);

  const qtdInvestimentos = useMemo(() =>
    ativos.filter(a => CATS_INVESTIMENTO.includes(a.categoria)).length,
  [ativos]);

  const score      = insights?.scoreUnificado?.score ?? 0;
  const scoreBand  = insights?.scoreUnificado?.band  ?? null;
  const scoreFaixa = SCORE_FAIXAS[scoreBand] ?? { label: '—', cor: '#F56A2A' };

  // Cards de categoria — exibe apenas categorias com ativos cadastrados
  const cards = useMemo(() => {
    const totais = {};
    for (const a of ativos) {
      const cat  = a.categoria || 'outros';
      const valor = Number(a.valorAtual ?? 0);
      totais[cat] = (totais[cat] ?? 0) + valor;
    }
    return CATEGORIAS
      .filter(cat => (totais[cat.key] ?? 0) > 0)
      .map(cat => ({ ...cat, valor: totais[cat.key] }))
      .sort((a, b) => b.valor - a.valor);
  }, [ativos]);

  // Tipos disponíveis para filtro do gráfico
  const tiposDisponiveis = useMemo(() => {
    const tipos = new Set();
    ativos.forEach(a => { if (a.categoria && a.categoria !== 'bens') tipos.add(a.categoria); });
    return ['todos', ...Array.from(tipos).sort()];
  }, [ativos]);

  // Fonte canônica: monthlyPerformance.points (TWR pré-calculado).
  const pontosTwr = monthlyPerformance?.points ?? [];
  const n = pontosTwr.length;
  const filtrosDisponiveis = FILTROS_ALL.filter(f => {
    if (f === 'Max') return n > 0;
    return n >= FILTROS_MESES[f];
  });
  const filtroEfetivo = filtrosDisponiveis.includes(filtroTempo)
    ? filtroTempo
    : (filtrosDisponiveis[filtrosDisponiveis.length - 1] ?? 'Max');

  const temBenchmark = filtroTipo === 'todos' && Boolean(benchmark?.serie?.length);
  const isCdiMode    = showCDI && temBenchmark;

  const dadosGrafico = useMemo(() => {
    const fatia = filtroEfetivo === 'Max' ? pontosTwr : pontosTwr.slice(-FILTROS_MESES[filtroEfetivo]);

    // CDI re-normalizado ao início da fatia (benchmark.serie é base-100 desde o início do histórico).
    const cdiMap = {};
    if (filtroTipo === 'todos' && benchmark?.serie?.length) {
      const benchSerie = [...benchmark.serie].sort((a, b) => a.data.localeCompare(b.data));
      const inicioAnoMes = fatia[0]?.month ?? '';
      const pontoBase = benchSerie.find(p => (p.data?.slice(0, 7) ?? '') >= inicioAnoMes) ?? benchSerie[0];
      const cdiBase = Number(pontoBase?.cdi ?? 100);
      benchSerie.forEach(p => {
        const anoMes = p.data?.slice(0, 7) ?? '';
        if (anoMes >= inicioAnoMes) {
          cdiMap[anoMes] = cdiBase > 0 ? ((Number(p.cdi) / cdiBase) - 1) * 100 : 0;
        }
      });
    }

    // Re-base: returnPercent acumula desde o primeiro ponto da série; ao filtrar
    // período, subtraímos a base da fatia para que a janela comece em zero.
    const base = Number(fatia[0]?.returnPercent ?? 0);
    return fatia.map(p => ({
      anoMes: p.month,
      carteira: Number(p.returnPercent ?? 0) - base,
      cdi: cdiMap[p.month] ?? null,
    }));
  }, [pontosTwr, benchmark, filtroTipo, filtroEfetivo]);

  // TWR plano (variância zero em todos os pontos): backend não está marcando a
  // mercado. Esconde o card — não mostra linha reta em 0% que não serve para
  // decisão nenhuma.
  const twrPlano = dadosGrafico.length > 0 && dadosGrafico.every(p => Number(p.carteira ?? 0) === Number(dadosGrafico[0].carteira ?? 0));


  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-4 pb-4">

      {/* Cards: Investimentos + Score */}
      <div className="grid grid-cols-2 gap-3">

        {/* Card Investimentos */}
        <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] mb-2">
              Investimentos
            </p>
            <p className="font-['Sora'] text-[18px] font-bold leading-tight text-[var(--text-primary)]">
              <HiddenValue hidden={ocultarValores}>{fmt(totalInvestimentos)}</HiddenValue>
            </p>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2">
            {loading ? '...' : `${qtdInvestimentos} ativo${qtdInvestimentos !== 1 ? 's' : ''}`}
          </p>
        </article>

        {/* Card Score */}
        <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] mb-2">
              Score
            </p>
            <p
              className="font-['Sora'] text-[28px] font-bold leading-tight"
              style={{ color: scoreFaixa.cor }}
            >
              <HiddenValue hidden={ocultarValores}>
                {Math.round(score)}
                <span className="text-[14px] font-semibold text-[var(--text-muted)]">/1000</span>
              </HiddenValue>
            </p>
          </div>
          <p
            className="text-[10px] font-semibold mt-2"
            style={{ color: scoreFaixa.cor }}
          >
            {scoreFaixa.label}
          </p>
        </article>
      </div>

      {/* Gráfico de Rentabilidade — só aparece com série mensal real suficiente.
          Sem dados reais = card oculto por completo. Sem placeholder. */}
      {monthlyPerformance.available && pontosTwr.length >= 2 && !twrPlano && (
      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        {/* Cabeçalho do gráfico */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-['Sora'] text-[13px] font-bold text-[var(--text-primary)]">
            Rentabilidade
          </h3>
          <div className="flex gap-1">
            {filtrosDisponiveis.map(f => (
              <button
                key={f}
                onClick={() => setFiltroTempo(f)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                  filtroEfetivo === f
                    ? 'bg-[#F56A2A] text-white'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros: tipo de investimento + CDI */}
        <div className="flex items-center gap-2 mb-3">
          <select
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value);
              if (e.target.value === 'acao') setShowCDI(false);
            }}
            className="flex-1 h-[28px] px-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-semibold rounded-[8px] focus:outline-none focus:border-[#F56A2A] text-[var(--text-primary)]"
          >
            {tiposDisponiveis.map(tipo => (
              <option key={tipo} value={tipo}>{LABEL_TIPO[tipo] || tipo}</option>
            ))}
          </select>

          {temBenchmark && (
            <button
              onClick={() => setShowCDI(v => !v)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-[8px] border transition-colors flex-shrink-0 ${
                showCDI
                  ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                  : 'border-[var(--border-color)] text-[var(--text-muted)]'
              }`}
            >
              CDI
            </button>
          )}

          {filtroTipo === 'acao' && (
            <span className="text-[9px] text-[#F2C94C] flex-shrink-0">
              CDI indisponível para Ações
            </span>
          )}
        </div>

        {/* Área do gráfico */}
        <div className={`h-[110px] ${ocultarValores ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
              {isCdiMode ? (
                <LineChart data={dadosGrafico} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="anoMes"
                    tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatMes}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v, name) => [
                      ocultarValores ? '••••••' : fmtPct(v),
                      name === 'carteira' ? 'Carteira' : 'CDI',
                    ]}
                    labelFormatter={formatMes}
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="carteira"
                    stroke="#F56A2A"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
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
                </LineChart>
              ) : (
                <AreaChart data={dadosGrafico} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCarteiraRent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#F56A2A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#F56A2A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="anoMes"
                    tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatMes}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v) => [
                      ocultarValores ? '••••••' : fmtPct(v),
                      'Rentabilidade',
                    ]}
                    labelFormatter={formatMes}
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="carteira"
                    stroke="#F56A2A"
                    strokeWidth={2}
                    fill="url(#gradCarteiraRent)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
        </div>

        {/* Legenda CDI */}
        {isCdiMode && (
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-[#F56A2A] rounded-full inline-block" />
              <span className="text-[9px] text-[var(--text-muted)]">Carteira</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block" style={{ width: 16, height: 2, background: 'repeating-linear-gradient(to right, #3B82F6 0px, #3B82F6 4px, transparent 4px, transparent 6px)' }} />
              <span className="text-[9px] text-[var(--text-muted)]">CDI</span>
            </div>
          </div>
        )}
      </article>
      )}

      {/* Cards por categoria — apenas categorias com ativos cadastrados */}
      {cards.length > 0 && (
        <div className="space-y-2">
          {cards.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.route)}
              className="flex w-full items-center justify-between rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <img src={assetPath(item.icon)} alt="" className="h-5 w-5" />
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{item.label}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Toque para abrir detalhes</p>
                </div>
              </div>
              <p className="text-[12px] font-bold text-[var(--text-primary)]">
                <HiddenValue hidden={ocultarValores}>{fmt(item.valor)}</HiddenValue>
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Botão Importar */}
      <div className="w-full">
        <button
          onClick={() => navigate('/importar')}
          className="w-full rounded-[12px] bg-[#F56A2A] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white"
        >
          Importar
        </button>
      </div>

      {loading && !ativos.length && (
        <p className="text-[12px] text-[var(--text-secondary)]">Carregando carteira...</p>
      )}
      {erro && (
        <div className="rounded-[12px] border border-[#E85C5C] bg-[#E85C5C]/10 p-3">
          <p className="text-[12px] font-medium text-[#E85C5C]">{erro}</p>
        </div>
      )}
    </section>
  );
}
