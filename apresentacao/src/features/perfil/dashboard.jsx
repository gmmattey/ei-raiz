import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { ApiError, patrimonioApi } from "../../cliente-api";
import { useNavigate } from "react-router-dom";
import { useModoVisualizacao } from "../../context/ModoVisualizacaoContext";

const filtros = [
  { label: "Todos", value: "todos" },
  { label: "Ações", value: "acao" },
  { label: "Fundos", value: "fundo" },
  { label: "Previdência", value: "previdencia" },
  { label: "Renda Fixa", value: "renda_fixa" },
  { label: "Poupança", value: "poupanca" },
  { label: "Bens", value: "bens" },
];

const TIPO_PARA_FILTRO = {
  acao: "acao",
  fii: "acao",
  etf: "acao",
  fundo: "fundo",
  previdencia: "previdencia",
  renda_fixa: "renda_fixa",
  poupanca: "poupanca",
  imovel: "bens",
  veiculo: "bens",
  cripto: "todos",
  caixa: "todos",
  divida: null,
  outro: "todos",
};

function montarDashboard(resumo) {
  const filtrosMap = {
    todos: [], acao: [], fundo: [], previdencia: [], renda_fixa: [], poupanca: [], bens: [],
  };
  const totais = {
    todos: resumo.patrimonioBrutoBrl ?? 0,
    acao: 0, fundo: 0, previdencia: 0, renda_fixa: 0, poupanca: 0, bens: 0,
  };
  for (const item of resumo.principaisAtivos ?? []) {
    const entrada = {
      id: item.id,
      nome: item.nome,
      categoria: item.tipo,
      valor: item.valorAtualBrl ?? 0,
      percentual: item.pesoPct ?? 0,
    };
    filtrosMap.todos.push(entrada);
    const bucket = TIPO_PARA_FILTRO[item.tipo];
    if (bucket && bucket !== "todos" && bucket in filtrosMap) {
      filtrosMap[bucket].push(entrada);
      totais[bucket] += entrada.valor;
    }
  }
  return { filtros: filtrosMap, totais };
}

const CORES = ["#F56A2A", "#6FCF97", "#F2C94C", "#5DADE2", "#9B59B6", "#A7B0BC", "#E67E22", "#16A085"];

const moeda = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const TooltipGrafico = ({ active, payload, ocultarValores = false }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 shadow-sm">
      <p className="text-xs font-bold text-[var(--text-primary)]">{p.nome}</p>
      <p className="text-[11px] text-[var(--text-secondary)]">{ocultarValores ? "••••••••" : moeda(p.valor)}</p>
      <p className="text-[10px] text-[var(--text-muted)]">{ocultarValores ? "••••••••" : `${p.percentual.toFixed(1)}%`}</p>
    </div>
  );
};

export default function Dashboard({ embedded = false }) {
  const navigate = useNavigate();
  const { ocultarValores } = useModoVisualizacao();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const resumo = await patrimonioApi.obterResumo();
        if (!ativo) return;
        setDashboardData(montarDashboard(resumo));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        if (ativo) setError("Não foi possível carregar os gráficos agora.");
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [navigate]);

  const dadosGraficos = useMemo(
    () => dashboardData?.filtros?.[filtro] ?? [],
    [dashboardData, filtro],
  );
  const totalFiltro = dashboardData?.totais?.[filtro] ?? 0;
  const semBase = !loading && !error && dadosGraficos.length === 0;

  return (
    <div className="w-full bg-[var(--bg-primary)] font-['Inter'] text-[var(--text-primary)]">
      <div className="w-full">
        {!embedded && (
          <div className="mb-6">
            <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
          </div>
        )}

        <div className="mb-5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {filtros.map((item) => (
            <button
              key={item.value}
              onClick={() => setFiltro(item.value)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border whitespace-nowrap ${
                filtro === item.value
                  ? "bg-[#F56A2A] text-white border-[#F56A2A]"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-[var(--text-secondary)]">Carregando gráficos...</p>}
        {error && <p className="text-sm text-[#E85C5C]">{error}</p>}

        {!loading && !error && semBase && (
          <div className="border border-[var(--border-color)] bg-[var(--bg-card)] p-6 rounded-xl text-sm text-[var(--text-secondary)]">
            Sem base para o filtro selecionado.
          </div>
        )}

        {!loading && !error && !semBase && (
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
            <section className="border border-[var(--border-color)] rounded-xl p-4 bg-[var(--bg-card)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Distribuição</h3>
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  {ocultarValores ? "••••••••" : moeda(totalFiltro)}
                </span>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dadosGraficos} dataKey="valor" nameKey="nome" innerRadius={62} outerRadius={98}>
                      {dadosGraficos.map((_, idx) => (
                        <Cell key={idx} fill={CORES[idx % CORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipGrafico ocultarValores={ocultarValores} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="border border-[var(--border-color)] rounded-xl p-4 bg-[var(--bg-card)]">
              <h3 className="mb-3 font-['Sora'] text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Comparativo</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficos.slice(0, 8)}>
                    <XAxis dataKey="nome" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={48} />
                    <YAxis hide />
                    <Bar dataKey="valor" radius={[3, 3, 0, 0]}>
                      {dadosGraficos.slice(0, 8).map((_, idx) => (
                        <Cell key={idx} fill={CORES[idx % CORES.length]} />
                      ))}
                    </Bar>
                    <Tooltip content={<TooltipGrafico ocultarValores={ocultarValores} />} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
