import React, { useEffect, useState } from "react";
import { ArrowUpRight, Clock, Filter } from "lucide-react";
import EstadoVazio from "../../components/feedback/EstadoVazio";
import { ApiError, historicoApi } from "../../cliente-api";
import { useNavigate } from "react-router-dom";
import { useModoVisualizacao } from "../../context/ModoVisualizacaoContext";

const ranges = [
  { label: "3m", months: 3 },
  { label: "6m", months: 6 },
  { label: "12m", months: 12 },
];

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);
const formatarTipoEvento = (tipo) => {
  if (!tipo) return "--";
  const normalizado = String(tipo).toLowerCase();
  if (normalizado === "importacao") return "Importação";
  return normalizado
    .split("_")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
};

export default function Historico() {
  const navigate = useNavigate();
  const { ocultarValores } = useModoVisualizacao();
  const [activeRange, setActiveRange] = useState(ranges[1]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshots, setSnapshots] = useState([]);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        setLoading(true);
        setError("");
        // Prefere o histórico mensal novo (historico_carteira_mensal); se vazio,
        // cai para snapshots_patrimonio legado. Eventos seguem o caminho antigo.
        const [respMensal, listaSnapshotsLegado, listaEventos] = await Promise.all([
          historicoApi.listarHistoricoMensal(24).catch(() => ({ pontos: [] })),
          historicoApi.listarSnapshots(24),
          historicoApi.listarEventos(24),
        ]);
        if (!ativo) return;
        const pontosMensais = respMensal?.pontos ?? [];
        const listaSnapshots = pontosMensais.length > 0
          ? pontosMensais.map((p) => ({
              id: p.id,
              usuarioId: p.usuarioId,
              data: p.dataFechamento,
              valorTotal: p.totalAtual,
              variacaoPercentual: p.retornoMes,
            }))
          : listaSnapshotsLegado;
        const limiteData = new Date();
        limiteData.setMonth(limiteData.getMonth() - activeRange.months);
        const filtradosSnapshots = listaSnapshots.filter((item) => {
          const data = new Date(item.data);
          return !Number.isNaN(data.getTime()) && data >= limiteData;
        });
        const filtradosEventos = listaEventos.filter((item) => {
          const data = new Date(item.data);
          return !Number.isNaN(data.getTime()) && data >= limiteData;
        });
        setSnapshots(filtradosSnapshots);
        setEventos(filtradosEventos);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        if (ativo) setError("Falha ao carregar histórico.");
      } finally {
        if (ativo) setLoading(false);

      }
    };
    carregar();
    return () => {
      ativo = false;
    };
  }, [activeRange, navigate]);

  // Evolução real do período: último valor registrado vs. primeiro valor registrado.
  // snapshots vem ordenado do mais recente ao mais antigo.
  const valorFinal = snapshots.length > 0 ? (snapshots[0]?.valorTotal ?? 0) : 0;
  const valorInicial = snapshots.length > 1 ? (snapshots[snapshots.length - 1]?.valorTotal ?? 0) : 0;
  const evolucaoPeriodo = snapshots.length > 1 ? valorFinal - valorInicial : null;
  const evolucaoPeriodoPct = valorInicial > 0 ? (evolucaoPeriodo / valorInicial) * 100 : null;
  const semHistorico = !loading && !error && snapshots.length === 0 && eventos.length === 0;

  return (
    <div className="w-full bg-[var(--bg-primary)] font-['Inter'] text-[var(--text-primary)] animate-in fade-in duration-500">
      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-3 text-[#F56A2A] mb-4">
              <Clock size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.3em]">Linha do Tempo</span>
            </div>
            <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-2">Evolução Patrimonial</h1>
            <p className="text-[var(--text-secondary)] text-sm font-medium">Acompanhe como seu patrimônio evoluiu ao longo do tempo.</p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-[var(--bg-card-alt)] border border-[var(--border-color)] rounded-xl">
            {ranges.map((range) => (
              <button
                key={range.label}
                onClick={() => setActiveRange(range)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${activeRange.label === range.label ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-sm text-[var(--text-muted)]">Carregando histórico...</p>}
        {error && <p className="text-sm text-[#E85C5C]">{error}</p>}

        {!loading && !error && semHistorico && (
          <EstadoVazio 
            titulo="Sem evolução patrimonial"
            descricao="Nenhum dado salvo. O histórico das suas movimentações aparecerá após a primeira importação."
            acaoTexto="Importar primeiro extrato"
            onAcao={() => navigate('/home', { state: { openQuickModal: 'quick_importar' } })}
          />
        )}

        {!loading && !error && !semHistorico && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 md:gap-16 items-start">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden mb-6">
              <div className="p-5 md:p-8 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card-alt)]">
                <h3 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Snapshots</h3>
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-[var(--text-muted)]">
                  <Filter size={14} /> {snapshots.length} itens
                </span>
              </div>
              <div>
                {snapshots.map((snap) => (
                  <div key={snap.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 md:p-6 border-b border-[var(--border-color)]">
                    <div>
                      <p className="font-['Sora'] text-sm font-bold">{snap.data}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-tight">
                        Variação {ocultarValores ? '••••••••' : `${snap.variacaoPercentual >= 0 ? '+' : ''}${snap.variacaoPercentual.toFixed(2)}%`}
                      </p>
                    </div>
                    <p className="font-['Sora'] text-sm font-bold">{ocultarValores ? '••••••••' : moeda(snap.valorTotal)}</p>
                  </div>
                ))}
                {snapshots.length === 0 && <p className="p-6 text-sm text-[var(--text-muted)]">Sem snapshots no período selecionado.</p>}
              </div>
            </div>

            <aside className="space-y-8">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 md:p-8 text-[var(--text-primary)] rounded-xl">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">Evolução no período ({activeRange.label})</h4>
                {evolucaoPeriodo !== null ? (
                  <>
                    <p className={`font-['Sora'] text-3xl font-bold mb-2 ${evolucaoPeriodo >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
                      {ocultarValores ? '••••••••' : `${evolucaoPeriodo >= 0 ? '+' : ''}${moeda(evolucaoPeriodo)}`}
                    </p>
                    {evolucaoPeriodoPct !== null && (
                      <div className={`flex items-center gap-2 text-[10px] font-bold uppercase ${evolucaoPeriodo >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
                        <ArrowUpRight size={14} />
                        {ocultarValores ? '••••••••' : `${evolucaoPeriodo >= 0 ? '+' : ''}${evolucaoPeriodoPct.toFixed(2)}% no período`}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">Dados insuficientes para calcular a evolução.</p>
                )}
              </div>

              <div className="p-6 md:p-8 border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl">
                <h4 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-6">Eventos Relevantes</h4>
                <div className="space-y-4">
                  {eventos.map((evento) => (
                    <div key={evento.id}>
                      <p className="text-xs font-bold uppercase text-[var(--text-primary)]">{formatarTipoEvento(evento.tipo)}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{evento.descricao}</p>
                    </div>
                  ))}
                  {eventos.length === 0 && <p className="text-xs text-[var(--text-muted)]">Sem eventos no período selecionado.</p>}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
