import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Download, RefreshCw, Search, Pencil, ChevronDown, Check } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from "recharts";
import { ApiError, carteiraApi, insightsApi, marketApi, portfolioApi } from "../../cliente-api";
import PageHeader from "../../components/design-system/PageHeader";
import MetricCard from "../../components/design-system/MetricCard";
import EstadoVazio from "../../components/feedback/EstadoVazio";
import { formatarHora } from "../../utils/formatarData";
import { useModoVisualizacao } from "../../context/ModoVisualizacaoContext";

const tiposDisponiveis = ["acao", "fundo", "previdencia", "renda_fixa", "poupanca", "bens"];
const periodosDisponiveis = [3, 6, 12, 24];

const COR_CATEGORIA = {
  acao:       "#F56A2A",
  fundo:      "#0B1218",
  renda_fixa: "#6FCF97",
  previdencia:"#F2C94C",
  fii:        "#9B59B6",
  outros:     "#EFE7DC",
};

const LABEL_CATEGORIA = {
  acao:       "Ações",
  fundo:      "Fundos",
  renda_fixa: "Renda Fixa",
  previdencia:"Previdência",
  fii:        "FIIs",
  outros:     "Outros",
};

const TooltipDonut = ({ active, payload, ocultarValores = false }) => {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0];
  return (
    <div className="bg-white border border-[#EFE7DC] shadow-md px-4 py-3 text-sm">
      <p className="font-['Sora'] font-bold text-[#0B1218] mb-1">{name}</p>
      <p className="text-[#0B1218]/70">{ocultarValores ? "••••••••" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}</p>
      <p className="text-[#0B1218]/50">{ocultarValores ? "••••••••" : `${(percent * 100).toFixed(1)}%`}</p>
    </div>
  );
};

const GraficoAlocacao = ({ ativos, patrimonioTotal, ocultarValores = false }) => {
  const dados = useMemo(() => {
    const mapa = {};
    for (const a of ativos) {
      const cat = a.categoria || "outros";
      mapa[cat] = (mapa[cat] ?? 0) + Number(a.valorAtual ?? 0);
    }
    return Object.entries(mapa)
      .filter(([, v]) => v > 0)
      .map(([cat, valor]) => ({
        name: LABEL_CATEGORIA[cat] ?? cat,
        cat,
        value: valor,
        percent: patrimonioTotal > 0 ? valor / patrimonioTotal : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [ativos, patrimonioTotal]);

  if (dados.length === 0) return null;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm mb-8 p-6 fade-in-up" style={{ animationDelay: "0.05s" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Alocação por categoria</p>
      <div className="flex flex-col md:flex-row items-center gap-6" style={{ minHeight: 220 }}>
        {/* Donut */}
        <div className="w-full md:w-[60%] h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dados}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
              >
                {dados.map((entry) => (
                  <Cell key={entry.cat} fill={COR_CATEGORIA[entry.cat] ?? "#EFE7DC"} />
                ))}
              </Pie>
              <Tooltip content={<TooltipDonut ocultarValores={ocultarValores} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legenda */}
        <div className="w-full md:w-[40%] space-y-2.5">
          {dados.map((entry) => (
            <div key={entry.cat} className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: COR_CATEGORIA[entry.cat] ?? "#EFE7DC" }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-[var(--text-primary)]">{entry.name}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {ocultarValores ? "••••••••" : `${(entry.percent * 100).toFixed(1)}%`}
                </span>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {ocultarValores ? "••••••••" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(entry.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);
const isMercadoDisponivel = (asset) => (asset.statusAtualizacao || asset.status_atualizacao || "indisponivel") !== "indisponivel";

const calcGanhoPerda = (asset) => {
  if (asset.ganhoPerda != null) return Number(asset.ganhoPerda);
  const qtd = Number(asset.quantidade ?? 0);
  const pm = Number(asset.precoMedio ?? asset.preco_medio ?? 0);
  const va = Number(asset.valorAtual ?? 0);
  if (qtd > 0 && pm > 0 && va > 0) return va - qtd * pm;
  return null;
};

const calcGanhoPerdaPerc = (asset) => {
  if (asset.retorno12m != null) return Number(asset.retorno12m);
  const ganho = calcGanhoPerda(asset);
  const qtd = Number(asset.quantidade ?? 0);
  const pm = Number(asset.precoMedio ?? asset.preco_medio ?? 0);
  const custo = qtd * pm;
  if (ganho != null && custo > 0) return (ganho / custo) * 100;
  return null;
};

const formatarQtd = (asset) => {
  const qtd = Number(asset.quantidade ?? 0);
  return asset.categoria === "acao" ? qtd.toFixed(0) : qtd.toFixed(2);
};

const GanhoPerdaCell = ({ asset, className = "", ocultarValores = false }) => {
  const ganho = isMercadoDisponivel(asset) ? calcGanhoPerda(asset) : null;
  const perc = isMercadoDisponivel(asset) ? calcGanhoPerdaPerc(asset) : null;
  if (ganho == null || perc == null) return <span className={`text-[#0B1218]/35 ${className}`}>—</span>;
  if (ocultarValores) return <span className={`font-semibold ${className}`}>••••••••</span>;
  const positivo = ganho >= 0;
  const cor = positivo ? "text-[#1A7A45]" : "text-[#E85C5C]";
  const sinal = positivo ? "+" : "";
  return (
    <span className={`font-semibold ${cor} ${className}`}>
      {sinal}{moeda(ganho)}{" "}
      <span className="text-[11px]">({sinal}{perc.toFixed(2)}%)</span>
    </span>
  );
};

const PrecoAtualCell = ({ asset, ocultarValores = false }) => {
  const status = asset.statusAtualizacao || asset.status_atualizacao || "indisponivel";
  if (ocultarValores) {
    return <span className="text-sm font-medium text-[#0B1218]">••••••••</span>;
  }
  if (status === "atualizado" && asset.precoAtual != null) {
    return <span className="text-sm font-medium text-[#0B1218]">{moeda(asset.precoAtual)}</span>;
  }
  return (
    <div>
      <span className="text-sm font-medium text-[#0B1218]">{moeda(asset.precoMedio ?? asset.preco_medio ?? 0)}</span>
      <p className="text-[10px] text-[#0B1218]/40 mt-0.5">Preço de importação</p>
    </div>
  );
};

const AssetCard = ({ asset, navigate, ocultarValores = false }) => {
  const ganho = isMercadoDisponivel(asset) ? calcGanhoPerda(asset) : null;
  const perc = isMercadoDisponivel(asset) ? calcGanhoPerdaPerc(asset) : null;
  const positivo = perc != null && perc >= 0;
  const corRetorno = positivo ? "text-[#1A7A45]" : "text-[#E85C5C]";
  const sinal = positivo ? "+" : "";
  const status = asset.statusAtualizacao || asset.status_atualizacao || "indisponivel";
  const temCotacao = status === "atualizado" && asset.precoAtual != null;

  return (
    <button
      type="button"
      onClick={() => navigate(`/ativo/${asset.ticker}`)}
      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm p-5 text-left hover:bg-[var(--bg-elevated)] transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-['Sora'] text-base font-bold text-[#0B1218]">{asset.ticker}</p>
          <p className="text-[10px] text-[#0B1218]/40 font-medium truncate max-w-[160px]">{asset.nome}</p>
        </div>
        {perc != null ? (
          <div className={`flex items-center gap-0.5 text-[11px] font-bold ${corRetorno}`}>
            {ocultarValores ? (
              "••••••••"
            ) : (
              <>
                {positivo ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {sinal}{perc.toFixed(2)}%
              </>
            )}
          </div>
        ) : (
          <span className="text-[11px] font-bold text-[#0B1218]/30">—</span>
        )}
      </div>

      {/* Linha 1 */}
      <div className="mt-4 border-t border-[#EFE7DC] pt-3 grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Qtd.</p>
          <p className="text-sm font-semibold text-[#0B1218] mt-0.5">{formatarQtd(asset)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Preço médio</p>
          <p className="text-sm font-semibold text-[#0B1218] mt-0.5">{ocultarValores ? "••••••••" : moeda(asset.precoMedio ?? asset.preco_medio ?? 0)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Preço atual</p>
          {temCotacao ? (
            <p className="text-sm font-semibold text-[#0B1218] mt-0.5">{ocultarValores ? "••••••••" : moeda(asset.precoAtual)}</p>
          ) : (
            <p className="text-sm font-semibold text-[#0B1218]/40 mt-0.5">Sem cotação</p>
          )}
        </div>
      </div>

      {/* Linha 2 */}
      <div className="mt-3 border-t border-[#EFE7DC] pt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Valor total</p>
          <p className="text-sm font-semibold text-[#0B1218] mt-0.5">{ocultarValores ? "••••••••" : moeda(asset.valorAtual)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">% da carteira</p>
          <p className="text-sm font-semibold text-[#0B1218] mt-0.5">{ocultarValores ? "••••••••" : `${(asset.participacao ?? 0).toFixed(2)}%`}</p>
        </div>
      </div>

      {/* Ganho/Perda */}
      <div className="mt-3 border-t border-[#EFE7DC] pt-3">
        <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Ganho/Perda</p>
        <div className="mt-0.5">
          <GanhoPerdaCell asset={asset} className="text-sm" ocultarValores={ocultarValores} />
        </div>
      </div>
    </button>
  );
};

export default function Carteira({ embedded = false }) {
  const navigate = useNavigate();
  const { ocultarValores } = useModoVisualizacao();
  const [searchParams] = useSearchParams();
  const filtroInicial = searchParams.get("categoria") || null;
  const tickerDestacado = searchParams.get("ticker");
  const [tiposSelecionados, setTiposSelecionados] = useState(() => (
    filtroInicial && tiposDisponiveis.includes(filtroInicial) ? [filtroInicial] : [...tiposDisponiveis]
  ));
  const [periodoMeses, setPeriodoMeses] = useState(12);
  const [tiposMenuOpen, setTiposMenuOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [plataformaFiltro, setPlataformaFiltro] = useState("todas");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("valor_desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumo, setResumo] = useState(null);
  const [ativos, setAtivos] = useState([]);
  const [atualizandoMercado, setAtualizandoMercado] = useState(false);
  const [ultimoRefreshMercado, setUltimoRefreshMercado] = useState(null);
  const [scoreUnificado, setScoreUnificado] = useState(null);
  const [classificacaoScore, setClassificacaoScore] = useState(null);
  const [dashboardPatrimonio, setDashboardPatrimonio] = useState(null);
  const [benchmark, setBenchmark] = useState(null);

  const refreshMercado = async (listaAtivos) => {
    const tickers = Array.from(new Set((listaAtivos || []).map((item) => item.ticker).filter(Boolean)));
    if (tickers.length === 0) return;
    setAtualizandoMercado(true);
    try {
      const [quotes, analyses] = await Promise.all([
        marketApi.obterCotacoes(tickers),
        portfolioApi.analisarPosicoes({
          items: (listaAtivos || [])
            .map((item) => ({
              ticker: item.ticker,
              quantity: Number(item.quantidade ?? 0),
              averagePrice: Number(item.precoMedio ?? item.preco_medio ?? 0),
            }))
            .filter((item) => item.ticker && item.quantity > 0 && item.averagePrice > 0),
        }),
      ]);

      const quoteMap = new Map((quotes.items || []).map((item) => [item.ticker, item]));
      const analysisMap = new Map((analyses.items || []).map((item) => [item.ticker, item]));
      const merged = (listaAtivos || []).map((item) => {
        const quote = quoteMap.get(item.ticker);
        const analysis = analysisMap.get(item.ticker);
        const quantity = Number(item.quantidade ?? 0);
        const marketValueByQuote = quote?.price != null && quantity > 0 ? quantity * quote.price : null;
        const nextValorAtual = analysis?.marketValue ?? marketValueByQuote ?? item.valorAtual;
        return {
          ...item,
          precoAtual: quote?.price ?? item.precoAtual,
          valorAtual: nextValorAtual,
          ultimaAtualizacao: quote?.updatedAt || quote?.fetchedAt || item.ultimaAtualizacao || item.ultima_atualizacao,
          fontePreco: quote?.source || item.fontePreco || item.fonte_preco,
          statusAtualizacao: quote?.price != null ? "atualizado" : (item.statusAtualizacao || item.status_atualizacao || "indisponivel"),
          signal: analysis?.signal ?? "hold",
          signalConfidence: analysis?.confidence ?? "low",
          signalRationale: analysis?.rationale ?? [],
          signalDisclaimer: analysis?.disclaimer ?? null,
          ganhoPerda: analysis?.profitLossValue ?? item.ganhoPerda,
          retorno12m: analysis?.profitLossPercent ?? item.retorno12m,
        };
      });
      setAtivos(merged);
      setUltimoRefreshMercado(analyses.updatedAt || quotes.fetchedAt || new Date().toISOString());
    } catch {
      // mantém dados atuais sem quebrar a tela
    } finally {
      setAtualizandoMercado(false);
    }
  };

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        setLoading(true);
        setError("");
        const [resumoCarteira, listaAtivos, resumoInsights, dashboard, benchmarkData] = await Promise.all([
          carteiraApi.obterResumoCarteira(),
          carteiraApi.listarAtivosCarteira(),
          insightsApi.obterResumo().catch(() => null),
          carteiraApi.obterDashboardPatrimonio().catch(() => null),
          carteiraApi.obterBenchmarkCarteira(periodoMeses).catch(() => null),
        ]);
        if (!ativo) return;
        setResumo(resumoCarteira);
        setAtivos(listaAtivos);
        setScoreUnificado(resumoInsights?.scoreUnificado || resumoInsights?.score_unificado || null);
        setClassificacaoScore(resumoInsights?.classificacao || null);
        setDashboardPatrimonio(dashboard);
        setBenchmark(benchmarkData);
        await refreshMercado(listaAtivos);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        if (ativo) setError("Falha ao carregar dados da carteira.");
      } finally {
        if (ativo) setLoading(false);
      }
    };

    carregar();
    return () => {
      ativo = false;
    };
  }, [navigate, periodoMeses]);

  useEffect(() => {
    const id = setInterval(() => {
      if (ativos.length > 0) void refreshMercado(ativos);
    }, 30000);
    return () => clearInterval(id);
  }, [ativos]);

  useEffect(() => {
    if (filtroInicial && tiposDisponiveis.includes(filtroInicial)) {
      setTiposSelecionados([filtroInicial]);
    }
  }, [filtroInicial]);

  const plataformas = useMemo(() => ["todas", ...Array.from(new Set((ativos || []).map((a) => a.plataforma).filter(Boolean)))], [ativos]);

  const ativosFiltrados = useMemo(() => {
    if (!busca.trim()) return ativos;
    const termo = busca.toLowerCase();
    return ativos.filter((item) => item.ticker.toLowerCase().includes(termo) || item.nome.toLowerCase().includes(termo));
  }, [ativos, busca]);
  const ativosFiltradosComRegras = useMemo(() => {
    let lista = [...ativosFiltrados];
    lista = lista.filter((item) => tiposSelecionados.includes(item.categoria));
    if (plataformaFiltro !== "todas") lista = lista.filter((item) => item.plataforma === plataformaFiltro);
    if (statusFiltro !== "todos") lista = lista.filter((item) => (item.statusAtualizacao || item.status_atualizacao || "indisponivel") === statusFiltro);
    if (ordenacao === "valor_desc") lista.sort((a, b) => (b.valorAtual || 0) - (a.valorAtual || 0));
    if (ordenacao === "participacao_desc") lista.sort((a, b) => (b.participacao || 0) - (a.participacao || 0));
    if (ordenacao === "retorno_desc") lista.sort((a, b) => (b.retorno12m || 0) - (a.retorno12m || 0));
    return lista;
  }, [ativosFiltrados, tiposSelecionados, plataformaFiltro, statusFiltro, ordenacao]);
  const semAtivos = !loading && !error && linhasResumo.length === 0;
  const scoreValor = scoreUnificado?.score ?? resumo?.score ?? 0;

  const badgeScore = (() => {
    const mapa = {
      critico:   { bg: "rgba(232,92,92,0.12)",  color: "#E85C5C", label: "Crítico" },
      baixo:     { bg: "rgba(242,201,76,0.15)", color: "#B8880A", label: "Atenção" },
      ok:        { bg: "#EFE7DC",               color: "#0B1218", label: "Regular" },
      bom:       { bg: "rgba(111,207,151,0.15)",color: "#1A7A45", label: "Bom" },
      excelente: { bg: "rgba(111,207,151,0.25)",color: "#1A7A45", label: "Excelente" },
    };
    return classificacaoScore ? mapa[classificacaoScore] ?? null : null;
  })();

  const categoriasUnicas = useMemo(
    () => new Set((ativos || []).map((a) => a.categoria).filter(Boolean)).size,
    [ativos]
  );
  const itensGrafico = useMemo(() => {
    const base = dashboardPatrimonio?.filtros?.todos ?? [];
    return base
      .filter((i) => tiposSelecionados.includes(i.categoria))
      .map((i) => ({ ...i, name: i.nome, value: i.valor }));
  }, [dashboardPatrimonio, tiposSelecionados]);
  const serieComparativa = (benchmark?.serie ?? []).map((i) => ({ data: String(i.data || "").slice(5), carteira: Number(i.carteira ?? 0), cdi: Number(i.cdi ?? 0) }));
  const linhasResumo = useMemo(() => {
    const linhasInvestimentos = ativosFiltradosComRegras.map((asset) => ({
      id: asset.id,
      nome: asset.ticker,
      tipo: asset.categoria,
      valorInvestido: Number(asset.quantidade ?? 0) * Number(asset.precoMedio ?? asset.preco_medio ?? 0),
      valorAtualizado: Number(asset.valorAtual ?? 0),
      rentabilidade: Number(asset.retorno12m ?? 0),
      ticker: asset.ticker,
    }));
    const linhasBensPoupanca = (dashboardPatrimonio?.filtros?.todos ?? [])
      .filter((item) => ["bens", "poupanca"].includes(item.categoria) && tiposSelecionados.includes(item.categoria))
      .map((item) => ({
        id: item.id,
        nome: item.nome,
        tipo: item.categoria,
        valorInvestido: item.valor,
        valorAtualizado: item.valor,
        rentabilidade: 0,
        ticker: null,
      }));
    return [...linhasInvestimentos, ...linhasBensPoupanca];
  }, [dashboardPatrimonio, ativosFiltradosComRegras, tiposSelecionados]);

  return (
    <div className={`w-full bg-[var(--bg-primary)] font-['Inter'] text-[var(--text-primary)] ${embedded ? '' : 'animate-in fade-in duration-500'}`}>
      <div className="w-full">
        {!embedded && (
          <PageHeader
            title="Sua Carteira"
            subtitle="Acompanhe todos os seus ativos em um só lugar"
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void refreshMercado(ativos)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest hover:bg-[#EFE7DC] transition-all rounded-sm"
                >
                  <RefreshCw size={14} className={atualizandoMercado ? "animate-spin" : ""} /> Atualizar
                </button>
                <button onClick={() => navigate("/historico")} className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest hover:bg-[#EFE7DC] transition-all rounded-sm">
                  <Download size={14} /> Histórico
                </button>
              </div>
            }
          />
        )}
        {ultimoRefreshMercado && (() => {
          const isAoVivo = (new Date() - new Date(ultimoRefreshMercado)) < 5 * 60 * 1000;
          return (
            <div className="flex items-center gap-2 mb-4 group cursor-pointer" onClick={() => void refreshMercado(ativos)}>
              <div 
                className={`w-2 h-2 rounded-full ${isAoVivo ? 'bg-[#1A7A45] animate-pulse' : 'bg-gray-400'}`} 
                title={isAoVivo ? "Cotação ao vivo" : "Cotação desatualizada — atualizar"}
              />
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">
                Cotações atualizadas {isAoVivo ? 'agora' : `às ${formatarHora(ultimoRefreshMercado)}`}
              </p>
            </div>
          );
        })()}

        {!embedded && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <MetricCard
              label="Patrimônio investido"
              value={moeda(resumo?.patrimonioTotal)}
            />
            <MetricCard
              label="Retorno da carteira"
              value={resumo?.retornoDisponivel ? `${resumo?.retorno12m?.toFixed?.(2) ?? "0.00"}%` : "Sem histórico"}
            />
            <MetricCard
              label="Score de saúde"
              value={`${scoreValor}`}
              badge={badgeScore}
            />
            <MetricCard
              label="Ativos na carteira"
              value={`${resumo?.quantidadeAtivos ?? 0}`}
              subtitle={categoriasUnicas > 0 ? `em ${categoriasUnicas} ${categoriasUnicas === 1 ? "categoria" : "categorias"}` : undefined}
            />
          </div>
        )}

        {!embedded && !loading && !error && ativos.length > 0 && (
          <GraficoAlocacao ativos={ativos} patrimonioTotal={resumo?.patrimonioTotal ?? 0} ocultarValores={ocultarValores} />
        )}

        <div className="bg-white border border-[#EFE7DC] rounded-sm overflow-hidden fade-in-up" style={{ animationDelay: '0.1s' }}>
          {tickerDestacado && tiposSelecionados.includes("acao") && (
            <div className="px-6 py-3 border-b border-[#EFE7DC] bg-[#FAFAFA] flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#0B1218]/75">
                Você veio de outra tela para gerenciar <strong>{tickerDestacado.toUpperCase()}</strong> em ações.
              </p>
              <button
                onClick={() => navigate(`/ativo/${encodeURIComponent(tickerDestacado)}`)}
                className="px-3 py-1.5 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest"
              >
                Abrir detalhamento
              </button>
            </div>
          )}
          <div className="p-6 border-b border-[#EFE7DC] flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTiposMenuOpen((v) => !v)}
                  className="px-3 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest min-w-[200px] h-[42px] flex items-center justify-between"
                >
                  <span>Tipos ({tiposSelecionados.length})</span>
                  <ChevronDown size={14} className={`transition-transform ${tiposMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {tiposMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setTiposMenuOpen(false)} />
                    <div className="absolute z-20 mt-1 w-[240px] bg-white border border-[#EFE7DC] shadow-lg rounded-sm p-2 space-y-1">
                      {tiposDisponiveis.map((tipo) => {
                        const ativo = tiposSelecionados.includes(tipo);
                        return (
                          <button
                            key={tipo}
                            type="button"
                            onClick={() => {
                              setTiposSelecionados((prev) => {
                                if (prev.includes(tipo)) {
                                  const next = prev.filter((t) => t !== tipo);
                                  return next.length ? next : prev;
                                }
                                return [...prev, tipo];
                              });
                            }}
                            className={`w-full px-2 py-2 text-left text-[10px] font-bold uppercase tracking-widest flex items-center justify-between border ${
                              ativo ? "bg-[#0B1218] text-white border-[#0B1218]" : "bg-white text-[#0B1218]/70 border-[#EFE7DC]"
                            }`}
                          >
                            <span>{tipo.replace("_", " ")}</span>
                            {ativo && <Check size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <select value={periodoMeses} onChange={(e) => setPeriodoMeses(Number(e.target.value))} className="h-[42px] px-2 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest">
                {periodosDisponiveis.map((p) => <option key={p} value={p}>{p}M</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0B1218]/20" size={14} />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por ticker ou nome..."
                  className="pl-10 pr-4 h-[42px] bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-[#F56A2A] w-full md:w-[320px]"
                />
              </div>
              <select value={plataformaFiltro} onChange={(e) => setPlataformaFiltro(e.target.value)} className="h-[42px] px-2 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest">
                {plataformas.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="h-[42px] px-2 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest">
                <option value="todos">Todos os ativos</option>
                <option value="atualizado">Com cotação</option>
                <option value="atrasado">Cotação atrasada</option>
                <option value="indisponivel">Sem cotação</option>
              </select>
              <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} className="h-[42px] px-2 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest">
                <option value="valor_desc">Ordenar por valor</option>
                <option value="participacao_desc">Ordenar por alocação</option>
                <option value="retorno_desc">Ordenar por retorno</option>
              </select>
            </div>
          </div>

          {!loading && !error && itensGrafico.length > 0 && (
            <div className="p-6 border-b border-[#EFE7DC]">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="border border-[#EFE7DC] rounded-sm p-4 bg-[#FAFAFA]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/50 mb-2">Distribuição</p>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={itensGrafico} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84}>
                          {itensGrafico.map((_, idx) => (
                            <Cell key={idx} fill={["#F56A2A", "#6FCF97", "#F2C94C", "#5DADE2", "#A7B0BC", "#9B59B6"][idx % 6]} />
                          ))}
                        </Pie>
                        <Tooltip content={<TooltipDonut ocultarValores={ocultarValores} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="border border-[#EFE7DC] rounded-sm p-4 bg-[#FAFAFA]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/50 mb-2">Carteira vs CDI</p>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={serieComparativa}>
                        <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                        <YAxis hide />
                        <Line type="monotone" dataKey="carteira" stroke="#F56A2A" strokeWidth={2.2} dot={false} />
                        <Line type="monotone" dataKey="cdi" stroke="#4A5A6A" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && <div className="p-6 text-sm text-[#0B1218]/50">Carregando seus ativos...</div>}
          {error && <div className="p-6 text-sm text-[#E85C5C]">Não conseguimos carregar seus dados. Tente novamente.</div>}

          {!loading && !error && linhasResumo.length > 0 && (
            <>
            <div className="md:hidden p-4 space-y-3">
              {linhasResumo.map((row) => (
                <div key={row.id} className="border border-[#EFE7DC] rounded-sm p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-['Sora'] text-sm font-bold">{row.nome}</p>
                      <p className="text-[10px] text-[#0B1218]/45 uppercase">{row.tipo}</p>
                    </div>
                    <button onClick={() => row.ticker ? navigate(`/ativo/${row.ticker}`) : navigate('/perfil')} className="p-2 border border-[#EFE7DC] rounded-sm">
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#EFE7DC]">
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Nome</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Tipo</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Val. Investido</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Val. Atualizado</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">% Rent.</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasResumo.map((row) => (
                    <tr key={row.id} className="border-b border-[#EFE7DC]/50 hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-4 px-4 text-sm font-semibold">{row.nome}</td>
                      <td className="py-4 px-4 text-sm uppercase">{row.tipo}</td>
                      <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(row.valorInvestido)}</td>
                      <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(row.valorAtualizado)}</td>
                      <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : `${row.rentabilidade.toFixed(2)}%`}</td>
                      <td className="py-4 px-4">
                        <button onClick={() => row.ticker ? navigate(`/ativo/${row.ticker}`) : navigate('/perfil')} className="p-2 border border-[#EFE7DC] rounded-sm hover:bg-white">
                          <Pencil size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
          {!loading && !error && linhasResumo.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-[#0B1218]/60">Nenhum ativo encontrado para esse filtro.</p>
            </div>
          )}
          {semAtivos && (
            <EstadoVazio 
              titulo="Sua carteira está vazia"
              descricao="Sua carteira ainda não possui ativos vinculados. Importe seu extrato para destravar as funcionalidades."
              acaoTexto="Importar Extrato"
              onAcao={() => navigate('/home', { state: { openQuickModal: 'quick_importar' } })}
            />
          )}
        </div>

      </div>
    </div>
  );
}

