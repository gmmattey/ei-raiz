import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, BarChart3, Clock3, LineChart } from "lucide-react";
import { ApiError, carteiraApi } from "../../cliente-api";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);

const periodos = [
  { label: "3M", value: 3 },
  { label: "6M", value: 6 },
  { label: "12M", value: 12 },
];

const categorias = [
  { label: "Todas", value: "todos" },
  { label: "Ações", value: "acao" },
  { label: "Fundos", value: "fundo" },
  { label: "Previdência", value: "previdencia" },
  { label: "Renda fixa", value: "renda_fixa" },
];

const construirPolyline = (serie, key, width = 560, height = 180) => {
  if (!serie || serie.length === 0) return "";
  const min = Math.min(...serie.map((p) => p[key]));
  const max = Math.max(...serie.map((p) => p[key]));
  const span = max - min || 1;
  return serie
    .map((p, idx) => {
      const x = (idx / Math.max(1, serie.length - 1)) * width;
      const y = height - ((p[key] - min) / span) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(12);
  const [categoria, setCategoria] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumo, setResumo] = useState(null);
  const [ativos, setAtivos] = useState([]);
  const [benchmark, setBenchmark] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [resumoData, ativosData, benchmarkData] = await Promise.all([
          carteiraApi.obterResumoCarteira(),
          carteiraApi.listarAtivosCarteira(),
          carteiraApi.obterBenchmarkCarteira(periodo),
        ]);
        if (!ativo) return;
        setResumo(resumoData);
        setAtivos(ativosData);
        setBenchmark(benchmarkData);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        if (ativo) setError("Nao foi possivel carregar o dashboard agora.");
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [navigate, periodo]);

  const ativosFiltrados = useMemo(
    () => (categoria === "todos" ? ativos : ativos.filter((item) => item.categoria === categoria)),
    [ativos, categoria],
  );
  const topAtivos = useMemo(() => [...ativosFiltrados].sort((a, b) => b.valorAtual - a.valorAtual).slice(0, 8), [ativosFiltrados]);
  const ativosAtualizados = useMemo(
    () => ativosFiltrados.filter((item) => (item.statusAtualizacao || item.status_atualizacao) === "atualizado").length,
    [ativosFiltrados],
  );
  const statusMercado = ativosAtualizados > 0 ? (ativosAtualizados === ativosFiltrados.length ? "atualizado" : "atrasado") : "indisponivel";
  const ultimaAtualizacao = useMemo(() => {
    const datas = ativosFiltrados
      .map((item) => item.ultimaAtualizacao || item.ultima_atualizacao)
      .filter(Boolean)
      .sort((a, b) => (a > b ? -1 : 1));
    return datas[0] ?? null;
  }, [ativosFiltrados]);
  const concentracao = useMemo(() => {
    const total = ativosFiltrados.reduce((acc, item) => acc + (item.valorAtual || 0), 0);
    const byCategoria = ativosFiltrados.reduce((acc, item) => {
      acc[item.categoria] = (acc[item.categoria] || 0) + (item.valorAtual || 0);
      return acc;
    }, {});
    return Object.entries(byCategoria)
      .map(([key, valor]) => ({ key, valor, participacao: total > 0 ? (valor / total) * 100 : 0 }))
      .sort((a, b) => b.participacao - a.participacao);
  }, [ativosFiltrados]);

  const polyCarteira = useMemo(() => construirPolyline(benchmark?.serie, "carteira"), [benchmark]);
  const polyCDI = useMemo(() => construirPolyline(benchmark?.serie, "cdi"), [benchmark]);
  const semBase = !loading && !error && (resumo?.quantidadeAtivos ?? 0) === 0;

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <div className="w-full">
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-[#0B1218]/40 text-sm font-medium">Painel analítico completo da carteira, com comparativo CDI e filtros.</p>
          </div>
          <div className="flex items-center gap-2">
            {periodos.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border ${periodo === p.value ? "bg-[#0B1218] text-white border-[#0B1218]" : "bg-white text-[#0B1218]/60 border-[#EFE7DC]"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categorias.map((item) => (
            <button
              key={item.value}
              onClick={() => setCategoria(item.value)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border ${categoria === item.value ? "bg-[#F56A2A] text-white border-[#F56A2A]" : "bg-white text-[#0B1218]/60 border-[#EFE7DC]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-[#0B1218]/50">Carregando dashboard...</p>}
        {error && <p className="text-sm text-[#E85C5C]">{error}</p>}

        {semBase && (
          <div className="p-8 border border-[#EFE7DC] rounded-sm text-center">
            <p className="text-sm text-[#0B1218]/60">Seu dashboard ainda nao tem base de dados reais.</p>
            <button
              onClick={() => navigate("/importar")}
              className="mt-4 px-5 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              Importar primeiro extrato
            </button>
          </div>
        )}

        {!loading && !error && !semBase && (
          <>
            <section className="mb-6 border border-[#EFE7DC] rounded-sm p-4 bg-[#FAFAFA] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
                {statusMercado === "atualizado" ? <LineChart size={16} className="text-[#6FCF97]" /> : <AlertTriangle size={16} className="text-[#F2C94C]" />}
                <p className="text-[11px] font-semibold text-[#0B1218]/80">
                  Mercado: {statusMercado === "atualizado" ? "cotações atualizadas" : statusMercado === "atrasado" ? "cotações parcialmente atrasadas" : "cotação indisponível"}
                </p>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[#0B1218]/45 flex items-center gap-2">
                <Clock3 size={12} /> última atualização: {ultimaAtualizacao ? new Date(ultimaAtualizacao).toLocaleString("pt-BR") : "sem timestamp"}
              </p>
            </section>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Patrimonio" value={moeda(resumo?.patrimonioTotal)} />
              <MetricCard label={`Retorno ${periodo}M`} value={`${Number(benchmark?.carteiraRetornoPeriodo ?? 0).toFixed(2)}%`} />
              <MetricCard label={`CDI ${periodo}M`} value={`${Number(benchmark?.cdiRetornoPeriodo ?? 0).toFixed(2)}%`} />
              <MetricCard
                label="Excesso vs CDI"
                value={`${Number(benchmark?.excessoRetorno ?? 0).toFixed(2)}%`}
                valueClassName={(benchmark?.excessoRetorno ?? 0) >= 0 ? "text-[#6FCF97]" : "text-[#E85C5C]"}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6 mb-6">
              <section className="border border-[#EFE7DC] rounded-sm overflow-hidden">
                <div className="p-4 border-b border-[#EFE7DC] bg-[#FAFAFA] flex items-center justify-between">
                  <h3 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218]">Carteira vs CDI</h3>
                  <p className="text-[10px] uppercase tracking-widest text-[#0B1218]/45">
                    fonte: {(benchmark?.fonteBenchmark || benchmark?.fonte_benchmark || "indisponivel").toUpperCase()}
                  </p>
                </div>
                <div className="p-4">
                  <svg viewBox="0 0 560 180" className="w-full h-[220px] bg-white">
                    <polyline points={polyCDI} fill="none" stroke="#4A5A6A" strokeWidth="2" />
                    <polyline points={polyCarteira} fill="none" stroke="#F56A2A" strokeWidth="2.4" />
                  </svg>
                  <div className="mt-3 flex items-center gap-5 text-[10px] uppercase tracking-widest">
                    <span className="text-[#F56A2A] font-bold">Carteira</span>
                    <span className="text-[#4A5A6A] font-bold">CDI</span>
                  </div>
                </div>
              </section>

              <section className="border border-[#EFE7DC] rounded-sm overflow-hidden">
                <div className="p-4 border-b border-[#EFE7DC] bg-[#FAFAFA] flex items-center gap-2">
                  <BarChart3 size={14} className="text-[#0B1218]/60" />
                  <h3 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218]">Concentração por categoria</h3>
                </div>
                <div className="p-4 space-y-3">
                  {concentracao.map((item) => (
                    <div key={item.key}>
                      <div className="flex justify-between text-[11px] font-semibold text-[#0B1218]/75 mb-1">
                        <span>{item.key}</span>
                        <span>{item.participacao.toFixed(2)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#EFE7DC]">
                        <div className="h-2 rounded-full bg-[#F56A2A]" style={{ width: `${Math.max(1, Math.min(100, item.participacao))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="border border-[#EFE7DC] rounded-sm overflow-hidden">
              <div className="p-4 border-b border-[#EFE7DC] bg-[#FAFAFA]">
                <h3 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218]">Top posições ({topAtivos.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#EFE7DC]">
                      <th className="p-3 text-[10px] uppercase tracking-widest text-[#0B1218]/45">Ativo</th>
                      <th className="p-3 text-[10px] uppercase tracking-widest text-[#0B1218]/45">Categoria</th>
                      <th className="p-3 text-[10px] uppercase tracking-widest text-[#0B1218]/45">Valor</th>
                      <th className="p-3 text-[10px] uppercase tracking-widest text-[#0B1218]/45">Part.</th>
                      <th className="p-3 text-[10px] uppercase tracking-widest text-[#0B1218]/45">Mercado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAtivos.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/carteira?categoria=acao&ticker=${encodeURIComponent(item.ticker)}`)}
                        className="border-b border-[#EFE7DC]/50 hover:bg-[#FAFAFA] cursor-pointer"
                      >
                        <td className="p-3">
                          <p className="font-['Sora'] text-sm font-bold">{item.ticker}</p>
                          <p className="text-[10px] text-[#0B1218]/45">{item.nome}</p>
                        </td>
                        <td className="p-3 text-sm">{item.categoria}</td>
                        <td className="p-3 text-sm font-semibold">{moeda(item.valorAtual)}</td>
                        <td className="p-3 text-sm">{item.participacao.toFixed(2)}%</td>
                        <td className="p-3 text-[10px] uppercase tracking-widest text-[#0B1218]/55">
                          {(item.fontePreco || item.fonte_preco || "nenhuma").toUpperCase()} · {(item.statusAtualizacao || item.status_atualizacao || "indisponivel").toUpperCase()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const MetricCard = ({ label, value, valueClassName = "text-[#0B1218]" }) => (
  <div className="bg-white border border-[#EFE7DC] p-4 rounded-sm">
    <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest mb-1">{label}</p>
    <h3 className={`font-['Sora'] text-xl font-bold ${valueClassName}`}>{value}</h3>
  </div>
);
