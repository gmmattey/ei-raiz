import React, { useEffect, useState } from "react";
import { ArrowUpRight, Clock, Filter } from "lucide-react";
import { ApiError, historicoApi } from "../../cliente-api";
import { useNavigate } from "react-router-dom";

const ranges = [
  { label: "3m", months: 3 },
  { label: "6m", months: 6 },
  { label: "12m", months: 12 },
];

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);

export default function Historico() {
  const navigate = useNavigate();
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
        const [listaSnapshots, listaEventos] = await Promise.all([
          historicoApi.listarSnapshots(24),
          historicoApi.listarEventos(24),
        ]);
        if (!ativo) return;
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

  const totalProventos = snapshots
    .filter((s) => s.variacaoPercentual > 0)
    .reduce((acc, s) => acc + (s.valorTotal * s.variacaoPercentual) / 100, 0);
  const semHistorico = !loading && !error && snapshots.length === 0 && eventos.length === 0;

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-3 text-[#F56A2A] mb-4">
              <Clock size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.3em]">Linha do Tempo</span>
            </div>
            <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-2">Evolução Patrimonial</h1>
            <p className="text-[#0B1218]/40 text-sm font-medium">Snapshots e eventos vindo da API.</p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-[#FAFAFA] border border-[#EFE7DC] rounded-sm">
            {ranges.map((range) => (
              <button
                key={range.label}
                onClick={() => setActiveRange(range)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${activeRange.label === range.label ? "bg-[#0B1218] text-white shadow-sm" : "text-[#0B1218]/30 hover:text-[#0B1218]"}`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-sm text-[#0B1218]/50">Carregando histórico...</p>}
        {error && <p className="text-sm text-[#E85C5C]">{error}</p>}

        {!loading && !error && semHistorico && (
          <div className="p-8 border border-[#EFE7DC] rounded-sm text-center">
            <p className="text-sm text-[#0B1218]/60">
              Sem histórico disponível para este usuário. O histórico começa a aparecer após a primeira importação confirmada.
            </p>
            <button
              onClick={() => navigate('/importar')}
              className="mt-4 px-5 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              Importar primeiro extrato
            </button>
          </div>
        )}

        {!loading && !error && !semHistorico && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 md:gap-16 items-start">
            <div className="bg-white border border-[#EFE7DC] rounded-sm overflow-hidden">
              <div className="p-5 md:p-8 border-b border-[#EFE7DC] flex justify-between items-center bg-[#FAFAFA]">
                <h3 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218]">Snapshots</h3>
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#0B1218]/40">
                  <Filter size={14} /> {snapshots.length} itens
                </span>
              </div>
              <div>
                {snapshots.map((snap) => (
                  <div key={snap.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 md:p-6 border-b border-[#EFE7DC]/50">
                    <div>
                      <p className="font-['Sora'] text-sm font-bold">{snap.data}</p>
                      <p className="text-[10px] text-[#0B1218]/40 font-bold uppercase tracking-tight">
                        Variação {snap.variacaoPercentual.toFixed(2)}%
                      </p>
                    </div>
                    <p className="font-['Sora'] text-sm font-bold">{moeda(snap.valorTotal)}</p>
                  </div>
                ))}
                {snapshots.length === 0 && <p className="p-6 text-sm text-[#0B1218]/50">Sem snapshots no período selecionado.</p>}
              </div>
            </div>

            <aside className="space-y-8">
              <div className="bg-[#0B1218] p-6 md:p-8 text-white rounded-sm">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Acumulado Positivo</h4>
                <p className="font-['Sora'] text-3xl font-bold mb-2">{moeda(totalProventos)}</p>
                <div className="flex items-center gap-2 text-[#6FCF97] text-[10px] font-bold uppercase mb-8">
                  <ArrowUpRight size={14} /> baseado em snapshots
                </div>
              </div>

              <div className="p-6 md:p-8 border border-[#EFE7DC] rounded-sm">
                <h4 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218] mb-6">Eventos Relevantes</h4>
                <div className="space-y-4">
                  {eventos.map((evento) => (
                    <div key={evento.id}>
                      <p className="text-xs font-bold uppercase text-[#0B1218]/70">{evento.tipo}</p>
                      <p className="text-xs text-[#0B1218]/60">{evento.descricao}</p>
                    </div>
                  ))}
                  {eventos.length === 0 && <p className="text-xs text-[#0B1218]/50">Sem eventos no período selecionado.</p>}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
