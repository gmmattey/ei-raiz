import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, patrimonioApi } from '../../cliente-api';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';

const anoMesParaData = (anoMes) => {
  if (!anoMes) return null;
  const [ano, mes] = String(anoMes).split('-');
  if (!ano || !mes) return null;
  return `${ano}-${mes}-01`;
};

const formatarAnoMes = (anoMes) => {
  if (!anoMes) return '—';
  const [ano, mes] = String(anoMes).split('-');
  if (!ano || !mes) return anoMes;
  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const idx = Math.max(1, Math.min(12, Number(mes))) - 1;
  return `${mesesNomes[idx]}/${ano}`;
};

const RANGES = [
  { label: '3m',  months: 3 },
  { label: '6m',  months: 6 },
  { label: '12m', months: 12 },
];

const moeda = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v ?? 0));

const formatarTipoEvento = (tipo) => {
  if (!tipo) return '—';
  const n = String(tipo).toLowerCase();
  if (n === 'importacao') return 'Importação';
  return n.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
};

const formatarData = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
};

export default function HistoricoMobile() {
  const navigate = useNavigate();
  const { ocultarValores } = useModoVisualizacao();
  const [activeRange, setActiveRange] = useState(RANGES[1]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [snapshots, setSnapshots] = useState([]);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setErro('');
        const resp = await patrimonioApi.obterHistorico();
        if (!ativo) return;
        const itens = (resp?.itens ?? [])
          .slice()
          .sort((a, b) => String(b.anoMes).localeCompare(String(a.anoMes)));
        const limite = new Date();
        limite.setMonth(limite.getMonth() - activeRange.months);
        const listaSnapshots = itens
          .map((p, idx) => ({
            id: `${p.anoMes}-${idx}`,
            data: formatarAnoMes(p.anoMes),
            dataRef: anoMesParaData(p.anoMes),
            valorTotal: Number(p.patrimonioBrutoBrl ?? 0),
            variacaoPercentual: Number(p.rentabilidadeMesPct ?? 0),
          }))
          .filter((item) => {
            if (!item.dataRef) return false;
            const d = new Date(item.dataRef);
            return !Number.isNaN(d.getTime()) && d >= limite;
          });
        setSnapshots(listaSnapshots);
        setEventos([]);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/', { replace: true });
          return;
        }
        if (ativo) setErro('Falha ao carregar histórico.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, [activeRange, navigate]);

  const { valorFinal, evolucao, evolucaoPct } = useMemo(() => {
    if (snapshots.length < 2) {
      return { valorFinal: snapshots[0]?.valorTotal ?? 0, evolucao: null, evolucaoPct: null };
    }
    const vFinal   = Number(snapshots[0]?.valorTotal ?? 0);
    const vInicial = Number(snapshots[snapshots.length - 1]?.valorTotal ?? 0);
    const diff     = vFinal - vInicial;
    const pct      = vInicial > 0 ? (diff / vInicial) * 100 : null;
    return { valorFinal: vFinal, evolucao: diff, evolucaoPct: pct };
  }, [snapshots]);

  const semHistorico = !loading && !erro && snapshots.length === 0 && eventos.length === 0;

  return (
    <section className="space-y-4 pb-4">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Histórico</p>
        <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Evolução patrimonial</h1>
      </header>

      {/* Seletor de período */}
      <div className="flex gap-1 p-1 bg-[var(--bg-card-alt)] border border-[var(--border-color)] rounded-xl w-fit">
        {RANGES.map(r => (
          <button
            key={r.label}
            onClick={() => setActiveRange(r)}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${
              activeRange.label === r.label
                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-[12px] text-[var(--text-secondary)]">Carregando histórico...</p>}
      {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}

      {!loading && !erro && semHistorico && (
        <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 text-center">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">Sem evolução patrimonial</p>
          <p className="text-[12px] text-[var(--text-secondary)] mb-3">Nenhum dado salvo. O histórico aparece após a primeira importação.</p>
          <button
            onClick={() => navigate('/home', { state: { openQuickModal: 'quick_importar' } })}
            className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[#F56A2A] text-white"
          >
            Importar extrato
          </button>
        </article>
      )}

      {!loading && !erro && !semHistorico && (
        <>
          {/* Card de evolução no período */}
          <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">
              Evolução no período ({activeRange.label})
            </p>
            {evolucao !== null ? (
              <>
                <p className={`font-['Sora'] text-[24px] font-bold leading-tight ${evolucao >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
                  {ocultarValores
                    ? '••••••'
                    : `${evolucao >= 0 ? '+' : ''}${moeda(evolucao)}`}
                </p>
                {evolucaoPct !== null && (
                  <p className={`mt-1 text-[11px] font-bold ${evolucao >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
                    {ocultarValores
                      ? '••••••'
                      : `${evolucao >= 0 ? '+' : ''}${evolucaoPct.toFixed(2)}% no período`}
                  </p>
                )}
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Valor atual: <span className="text-[var(--text-primary)]">{ocultarValores ? '••••••' : moeda(valorFinal)}</span>
                </p>
              </>
            ) : (
              <p className="text-[12px] text-[var(--text-muted)]">Dados insuficientes para calcular a evolução.</p>
            )}
          </article>

          {/* Snapshots */}
          {snapshots.length > 0 && (
            <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
              <header className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card-alt)] flex items-center justify-between">
                <h3 className="font-['Sora'] text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Snapshots</h3>
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">{snapshots.length} itens</span>
              </header>
              <div>
                {snapshots.map((snap, i) => (
                  <div
                    key={snap.id ?? `${snap.data}-${i}`}
                    className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] last:border-b-0"
                  >
                    <div>
                      <p className="font-['Sora'] text-[12px] font-bold text-[var(--text-primary)]">
                        {snap.data}
                      </p>
                      <p className="text-[10px] font-semibold uppercase text-[var(--text-secondary)]">
                        {ocultarValores
                          ? 'Variação ••••'
                          : `Variação ${Number(snap.variacaoPercentual ?? 0) >= 0 ? '+' : ''}${Number(snap.variacaoPercentual ?? 0).toFixed(2)}%`}
                      </p>
                    </div>
                    <p className="font-['Sora'] text-[12px] font-bold text-[var(--text-primary)]">
                      {ocultarValores ? '••••••' : moeda(snap.valorTotal)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* Eventos */}
          {eventos.length > 0 && (
            <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <h3 className="font-['Sora'] text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)] mb-3">Eventos relevantes</h3>
              <div className="space-y-3">
                {eventos.map((evento, i) => (
                  <div key={evento.id ?? `${evento.data}-${i}`}>
                    <p className="text-[11px] font-bold uppercase text-[var(--text-primary)]">{formatarTipoEvento(evento.tipo)}</p>
                    {evento.descricao && (
                      <p className="text-[11px] text-[var(--text-secondary)]">{evento.descricao}</p>
                    )}
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatarData(evento.data)}</p>
                  </div>
                ))}
              </div>
            </article>
          )}
        </>
      )}
    </section>
  );
}
