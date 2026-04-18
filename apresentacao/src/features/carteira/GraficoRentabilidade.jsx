import React, { useMemo, useState } from 'react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatMes = (anoMes) => {
  const [, mes] = (anoMes || '').split('-');
  return MESES_ABREV[parseInt(mes, 10) - 1] ?? anoMes;
};

export default function GraficoRentabilidade({ historicoMensal, benchmark, ativos }) {
  const { ocultarValores } = useModoVisualizacao();
  const [showCDI, setShowCDI] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const tiposDisponiveis = useMemo(() => {
    const tipos = new Set();
    (ativos ?? []).forEach(a => {
      if (a.categoria && a.categoria !== 'bens') {
        tipos.add(a.categoria);
      }
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

  const isAcoesOnly = filtroTipo === 'acao';
  const isCdiMode = showCDI && Boolean(benchmark?.serie?.length) && !isAcoesOnly;

  const dadosGrafico = useMemo(() => {
    if (isCdiMode) {
      const serie = [...(benchmark?.serie ?? [])].sort((a, b) => a.data.localeCompare(b.data));
      return serie.map(p => ({
        ...p,
        anoMes: p.data?.slice(0, 7),
        carteira: Number(p.carteira ?? p.valor ?? 0),
        cdi: Number(p.cdi ?? p.benchmark ?? 0),
      }));
    }

    if (!historicoMensal?.length) return [];

    let dados = [...historicoMensal];
    if (filtroTipo !== 'todos') {
      const ativosDoTipo = (ativos ?? []).filter(a => a.categoria === filtroTipo).map(a => a.id);
      dados = dados.map(ponto => ({
        ...ponto,
        totalAtual: ponto.investimentos?.filter(inv => ativosDoTipo.includes(inv.id))
          ?.reduce((acc, inv) => acc + (Number(inv.valor ?? 0)), 0) ?? 0,
        rentabilidade: ponto.rentabilidade ?? 0,
        anoMes: ponto.anoMes,
      }));
    }

    return dados.sort((a, b) => a.anoMes.localeCompare(b.anoMes));
  }, [historicoMensal, benchmark, filtroTipo, isCdiMode, ativos]);

  if (!historicoMensal?.length && !benchmark?.serie?.length) {
    return (
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <TrendingUp size={24} className="text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">Sem histórico de rentabilidade disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 mb-8 fade-in-up">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-['Sora'] text-sm font-bold">Rentabilidade Histórica</h3>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por tipo */}
          <div className="flex items-center gap-2">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="h-[32px] px-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-widest rounded-xl focus:outline-none focus:border-[#F56A2A]"
            >
              {tiposDisponiveis.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {labelTipo[tipo] || tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle CDI */}
          {!isAcoesOnly && (
            <button
              onClick={() => setShowCDI(!showCDI)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${
                showCDI
                  ? 'border-[#6FCF97] bg-[#6FCF97]/15 text-[#6FCF97]'
                  : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[#6FCF97]'
              }`}
            >
              vs CDI
            </button>
          )}

          {isAcoesOnly && showCDI && (
            <p className="text-[10px] text-[#F2C94C]">CDI não disponível para Ações</p>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <div className={`h-64 ${ocultarValores ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
        {dadosGrafico.length > 1 ? (
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
                <YAxis hide />
                <Tooltip
                  formatter={(v, name) => [
                    ocultarValores ? '••••••' : `${Number(v - 100 || 0) >= 0 ? '+' : ''}${Number(v - 100 || 0).toFixed(2)}%`,
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
                  stroke="#6FCF97"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 2"
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
                <YAxis hide />
                <Tooltip
                  formatter={(v, name) => [
                    ocultarValores
                      ? '••••••'
                      : `${Number(v || 0) >= 0 ? '+' : ''}${Number(v || 0).toFixed(2)}%`,
                    name === 'totalAtual' ? 'Patrimônio' : 'Rentabilidade',
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
                  dataKey="totalAtual"
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
    </div>
  );
}
