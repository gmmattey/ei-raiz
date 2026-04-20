import React, { useMemo, useState } from 'react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
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

export default function GraficoRentabilidade({ historicoMensal, monthlyPerformance, benchmark, ativos }) {
  const { ocultarValores } = useModoVisualizacao();
  const [showCDI, setShowCDI] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroTempo, setFiltroTempo] = useState('1A');

  // Regra de produto: sem série mensal real suficiente, não renderiza o card.
  // Sem placeholder, sem "sem dados", sem gráfico vazio.
  if (!monthlyPerformance?.available || (monthlyPerformance.points?.length ?? 0) < 2) {
    return null;
  }

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

  // Fonte canônica: monthlyPerformance.points (TWR pré-calculado pelo backend,
  // base de valorInvestimentos, ajustado por aportes do mês).
  // historicoMensal é mantido apenas para backward-compat (não alimenta cálculo).
  const pontosTwr = monthlyPerformance?.points ?? [];
  const n = pontosTwr.length;
  const filtrosDisponiveis = ['1M', '3M', '6M', '1A', 'Max'].filter(f => {
    if (f === 'Max') return n > 0;
    return n >= FILTROS_MESES[f];
  });
  const filtroEfetivo = filtrosDisponiveis.includes(filtroTempo)
    ? filtroTempo
    : (filtrosDisponiveis[filtrosDisponiveis.length - 1] ?? 'Max');

  const dadosGrafico = useMemo(() => {
    const fatia = filtroEfetivo === 'Max' ? pontosTwr : pontosTwr.slice(-FILTROS_MESES[filtroEfetivo]);

    // CDI normalizado ao início do período exibido (benchmark serie é composto desde o início do histórico)
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

    // Re-base: returnPercent é acumulado desde o primeiro ponto da série de 24m.
    // Ao filtrar, o primeiro ponto da janela deve ser zero — subtraímos a base da fatia.
    const base = Number(fatia[0]?.returnPercent ?? 0);
    return fatia.map(p => ({
      anoMes: p.month,
      carteira: Number(p.returnPercent ?? 0) - base,
      cdi: cdiMap[p.month] ?? null,
    }));
  }, [pontosTwr, benchmark, filtroTipo, filtroEfetivo]);

  const semDados = dadosGrafico.length < 2 || dadosGrafico.every(p => p.carteira === null);

  // TWR plano: todos os pontos iguais (variância zero). Acontece quando o
  // backend de fechamento mensal registrou snapshots sem marcação a mercado
  // (valorInvestimentos == totalInvestido em todos os meses). Linha reta em 0%
  // é inútil e enganosa — esconde o card até haver variação real.
  const valoresCarteira = dadosGrafico.map(p => Number(p.carteira ?? 0));
  const twrPlano = valoresCarteira.every(v => v === valoresCarteira[0]);

  // Defesa-em-profundidade: mesmo com monthlyPerformance.available=true, a
  // derivação por tipo/tempo pode zerar os pontos úteis (ex: filtroTipo sem
  // cobertura). Nesse caso, oculta o card por completo — nunca placeholder.
  if (semDados || twrPlano) return null;

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
      </div>

      {/* Legenda CDI */}
      {isCdiMode && (
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
