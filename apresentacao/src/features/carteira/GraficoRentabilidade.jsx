import React, { useMemo, useState } from 'react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const FILTROS_MESES = { '1M': 1, '3M': 3, '6M': 6, '1A': 12 };

const formatMes = (anoMes) => {
  const [, mes] = (anoMes || '').split('-');
  return MESES_ABREV[parseInt(mes, 10) - 1] ?? anoMes;
};

const fmtPct = (v) => {
  const n = Number(v ?? 0);
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

export default function GraficoRentabilidade({ historicoMensal, benchmark, ativos }) {
  const { ocultarValores } = useModoVisualizacao();
  const [showCDI, setShowCDI] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroTempo, setFiltroTempo] = useState('1A');

  const tiposDisponiveis = useMemo(() => {
    const tipos = new Set();
    (ativos ?? []).forEach(a => {
      if (a.categoria && a.categoria !== 'bens') tipos.add(a.categoria);
    });
    return ['todos', ...Array.from(tipos).sort()];
  }, [ativos]);

  const labelTipo = {
    todos: 'Todos',
    acao: 'Ações',
    fundo: 'Fundos',
    renda_fixa: 'Renda Fixa',
    previdencia: 'Previdência',
    poupanca: 'Poupança',
  };

  // CDI só faz sentido para "todos" (não temos CDI por categoria)
  const temBenchmark = filtroTipo === 'todos' && Boolean(benchmark?.serie?.length);
  const isCdiMode = showCDI && temBenchmark;

  // Filtros de tempo disponíveis (baseados no histórico mensal)
  const n = (historicoMensal ?? []).length;
  const filtrosDisponiveis = ['1M', '3M', '6M', '1A', 'Max'].filter(f => {
    if (f === 'Max') return n > 0;
    return n >= FILTROS_MESES[f];
  });
  const filtroEfetivo = filtrosDisponiveis.includes(filtroTempo)
    ? filtroTempo
    : (filtrosDisponiveis[filtrosDisponiveis.length - 1] ?? 'Max');

  const dadosGrafico = useMemo(() => {
    const dados = [...(historicoMensal ?? [])];
    const fatia = filtroEfetivo === 'Max' ? dados : dados.slice(-FILTROS_MESES[filtroEfetivo]);

    // CDI normalizado ao início do período exibido (benchmark serie é composto desde o início do histórico)
    const cdiMap = {};
    if (filtroTipo === 'todos' && benchmark?.serie?.length) {
      const benchSerie = [...benchmark.serie].sort((a, b) => a.data.localeCompare(b.data));
      const inicioAnoMes = fatia[0]?.anoMes ?? '';
      const pontoBase = benchSerie.find(p => (p.data?.slice(0, 7) ?? '') >= inicioAnoMes) ?? benchSerie[0];
      const cdiBase = Number(pontoBase?.cdi ?? 100);
      benchSerie.forEach(p => {
        const anoMes = p.data?.slice(0, 7) ?? '';
        if (anoMes >= inicioAnoMes) {
          cdiMap[anoMes] = cdiBase > 0 ? ((Number(p.cdi) / cdiBase) - 1) * 100 : 0;
        }
      });
    }

    return fatia.map(p => {
      const totalAtual     = Number(p.totalAtual ?? 0);
      const totalInvestido = Number(p.totalInvestido ?? 0);
      const carteira = totalInvestido > 0 ? ((totalAtual / totalInvestido) - 1) * 100 : null;
      return { anoMes: p.anoMes, carteira, cdi: cdiMap[p.anoMes] ?? null };
    });
  }, [historicoMensal, benchmark, filtroTipo, filtroEfetivo]);

  const semDados = dadosGrafico.length < 2 || dadosGrafico.every(p => p.carteira === null);

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 mb-8 fade-in-up">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-['Sora'] text-sm font-bold">Rentabilidade Histórica</h3>
          {/* Filtros de tempo */}
          <div className="flex gap-1">
            {filtrosDisponiveis.map(f => (
              <button
                key={f}
                onClick={() => setFiltroTempo(f)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
                  filtroEfetivo === f ? 'bg-[#F56A2A] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por tipo + toggle CDI */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value);
              if (e.target.value !== 'todos') setShowCDI(false);
            }}
            className="h-[32px] px-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-widest rounded-xl focus:outline-none focus:border-[#F56A2A]"
          >
            {tiposDisponiveis.map((tipo) => (
              <option key={tipo} value={tipo}>{labelTipo[tipo] || tipo}</option>
            ))}
          </select>

          {temBenchmark && (
            <button
              onClick={() => setShowCDI(!showCDI)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${
                showCDI
                  ? 'border-[#3B82F6] bg-[#3B82F6]/15 text-[#3B82F6]'
                  : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[#3B82F6]'
              }`}
            >
              vs CDI
            </button>
          )}

          {filtroTipo === 'acao' && (
            <p className="text-[10px] text-[#F2C94C]">CDI não disponível para Ações</p>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <div className={`h-64 ${ocultarValores ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
        {!semDados ? (
          <ResponsiveContainer width="100%" height="100%">
            {isCdiMode ? (
              <LineChart data={dadosGrafico} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="anoMes"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatMes}
                  interval="preserveStartEnd"
                />
                <YAxis
                  hide={false}
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
                  width={46}
                />
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
                  <linearGradient id="gradRentabilidade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F56A2A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#F56A2A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="anoMes"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatMes}
                  interval="preserveStartEnd"
                />
                <YAxis
                  hide={false}
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
                  width={46}
                />
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
                  fill="url(#gradRentabilidade)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <TrendingUp size={24} className="text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">Dados insuficientes para exibição</p>
          </div>
        )}
      </div>

      {/* Legenda CDI */}
      {isCdiMode && !semDados && (
        <div className="flex items-center gap-5 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-[#F56A2A] inline-block" />
            <span className="text-[10px] text-[var(--text-muted)]">Carteira</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block"
              style={{ width: 16, height: 2, background: 'repeating-linear-gradient(to right, #3B82F6 0px, #3B82F6 4px, transparent 4px, transparent 6px)' }}
            />
            <span className="text-[10px] text-[var(--text-muted)]">CDI</span>
          </div>
        </div>
      )}
    </div>
  );
}
