import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Download, RefreshCw, Search, Pencil, ChevronDown, Check } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from "recharts";
import { ApiError, carteiraApi, insightsApi, marketApi, portfolioApi } from "../../cliente-api";
import { cache } from "../../utils/cache";
import PageHeader from "../../components/design-system/PageHeader";
import MetricCard from "../../components/design-system/MetricCard";
import EstadoVazio from "../../components/feedback/EstadoVazio";
import { IconeCategoria } from "../../components/base/IconeCategoria";
import { formatarHora } from "../../utils/formatarData";
import { useModoVisualizacao } from "../../context/ModoVisualizacaoContext";

const tiposDisponiveis = ["acao", "fundo", "previdencia", "renda_fixa", "poupanca", "bens"];
const periodosDisponiveis = [3, 6, 12, 24];
const ORDEM_CATEGORIAS = ["acao", "fundo", "previdencia", "renda_fixa", "poupanca", "bens"];

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
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl mb-8 p-6 fade-in-up" style={{ animationDelay: "0.05s" }}>
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
      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 text-left hover:bg-[var(--bg-elevated)] transition-colors"
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


// Componente para linha de ativo dentro de grupo
const AssetRow = React.memo(({ asset, categoria, navigate, ocultarValores, isLast = false }) => {
  const rowBorderClass = isLast ? "" : "border-b border-[#EFE7DC]/50";
  const isAcao = categoria === "acao";
  const isFundoOuRendaFixa = ["fundo", "renda_fixa"].includes(categoria);
  const isPrevidencia = categoria === "previdencia";

  const precoMedio = asset.precoMedio ?? asset.preco_medio ?? 0;
  const valorAtual = asset.valorAtual ?? asset.valor ?? 0;
  const quantidade = asset.quantidade ?? 0;
  const rentabilidade = asset.retorno12m ?? 0;

  const valorAplicado = quantidade * precoMedio;
  const ganhoAbsoluto = valorAtual - valorAplicado;

  if (isAcao) {
    return (
      <tr className={`${rowBorderClass} hover:bg-[#FAFAFA] transition-colors`}>
        <td className="py-4 px-4 text-sm font-semibold">{asset.ticker}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(valorAtual)}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : `${(asset.participacao ?? 0).toFixed(2)}%`}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : `${rentabilidade.toFixed(2)}%`}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(precoMedio)}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(asset.precoAtual ?? precoMedio)}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : quantidade.toFixed(0)}</td>
        <td className="py-4 px-4">
          <button onClick={() => navigate(`/ativo/${asset.ticker}`)} className="p-2 border border-[#EFE7DC] rounded-xl hover:bg-white text-[var(--text-secondary)] hover:text-[#F56A2A] transition-colors">
            <Pencil size={13} />
          </button>
        </td>
      </tr>
    );
  }

  if (isFundoOuRendaFixa) {
    return (
      <tr className={`${rowBorderClass} hover:bg-[#FAFAFA] transition-colors`}>
        <td className="py-4 px-4 text-sm font-semibold">{asset.nome || asset.ticker}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(valorAtual)}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : `${(asset.participacao ?? 0).toFixed(2)}%`}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : `${rentabilidade.toFixed(2)}%`}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(valorAplicado)}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(valorAtual)}</td>
        <td className="py-4 px-4">
          <button onClick={() => navigate(asset.ticker ? `/ativo/${asset.ticker}` : '/perfil')} className="p-2 border border-[#EFE7DC] rounded-xl hover:bg-white text-[var(--text-secondary)] hover:text-[#F56A2A] transition-colors">
            <Pencil size={13} />
          </button>
        </td>
      </tr>
    );
  }

  if (isPrevidencia) {
    return (
      <tr className={`${rowBorderClass} hover:bg-[#FAFAFA] transition-colors`}>
        <td className="py-4 px-4 text-sm font-semibold">{asset.nome || asset.ticker}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(valorAtual)}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : `${(asset.participacao ?? 0).toFixed(2)}%`}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(ganhoAbsoluto)}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : `${rentabilidade.toFixed(2)}%`}</td>
        <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(valorAplicado)}</td>
        <td className="py-4 px-4">
          <button onClick={() => navigate(asset.ticker ? `/ativo/${asset.ticker}` : '/perfil')} className="p-2 border border-[#EFE7DC] rounded-xl hover:bg-white text-[var(--text-secondary)] hover:text-[#F56A2A] transition-colors">
            <Pencil size={13} />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`${rowBorderClass} hover:bg-[#FAFAFA] transition-colors`}>
      <td className="py-4 px-4 text-sm font-semibold">{asset.nome || asset.ticker}</td>
      <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : moeda(valorAtual)}</td>
      <td className="py-4 px-4 text-sm">{ocultarValores ? "••••••••" : `${(asset.participacao ?? 0).toFixed(2)}%`}</td>
      <td colSpan="5"></td>
      <td className="py-4 px-4">
        <button onClick={() => navigate('/perfil')} className="p-2 border border-[#EFE7DC] rounded-xl hover:bg-white text-[var(--text-secondary)] hover:text-[#F56A2A] transition-colors">
          <Pencil size={13} />
        </button>
      </td>
    </tr>
  );
});

// Componente para grupo de categoria
const GrupoCategoria = React.memo(({ categoria, ativos: grupoAtivos, ocultarValores, resumo, isColapsed, onToggle, navigate }) => {
  const totalGrupo = grupoAtivos.reduce((acc, a) => acc + Number(a.valorAtual ?? a.valor ?? 0), 0);
  const percGrupo = resumo?.patrimonioTotal > 0 ? (totalGrupo / resumo.patrimonioTotal) * 100 : 0;

  const colunasPorTipo = {
    acao: ["Ticker", "Posição", "%Aloc", "Rent.%", "Preço Médio", "Último Preço", "Qtd", ""],
    fundo: ["Nome", "Posição", "%Aloc", "Rentabilidade", "Valor Aplicado", "Valor Líquido", ""],
    previdencia: ["Nome", "Posição", "%Aloc", "Rendimento (R$)", "Rentabilidade", "Valor Aplicado", ""],
    renda_fixa: ["Nome", "Posição", "%Aloc", "Rentabilidade", "Valor Aplicado", "Valor Líquido", ""],
    poupanca: ["Nome", "Posição", "%Aloc", ""],
    bens: ["Nome", "Posição", "%Aloc", ""],
  };

  const colunas = colunasPorTipo[categoria] || [];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl mb-6 overflow-hidden shadow-md shadow-black/5 fade-in-up">
      {/* Header do grupo */}
      <button
        onClick={() => onToggle(categoria)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors"
      >
        <div className="w-8 h-8 shrink-0">
          <IconeCategoria categoria={categoria} size={24} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-[var(--text-primary)]">{LABEL_CATEGORIA[categoria]}</p>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Saldo</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {ocultarValores ? "••••••••" : moeda(totalGrupo)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">% Patrimônio</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {ocultarValores ? "••••••••" : `${percGrupo.toFixed(1)}%`}
            </p>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-[var(--text-secondary)] transition-transform ${isColapsed ? "rotate-180" : ""}`}
        />
      </button>

      {/* Conteúdo (tabela) */}
      {!isColapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA]">
                {colunas.map((col, idx) => (
                  <th key={idx} className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grupoAtivos.map((asset, idx) => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  categoria={categoria}
                  navigate={navigate}
                  ocultarValores={ocultarValores}
                  isLast={idx === grupoAtivos.length - 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

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
  const [loading, setLoading] = useState(() => {
    const cv1 = cache.get('carteira_v1');
    return !cv1?.resumo || !Array.isArray(cv1?.ativos);
  });
  const [error, setError] = useState("");
  const [resumo, setResumo] = useState(() => cache.get('carteira_v1')?.resumo ?? null);
  const [ativos, setAtivos] = useState(() => {
    const cv1 = cache.get('carteira_v1');
    return Array.isArray(cv1?.ativos) ? cv1.ativos : [];
  });
  const [atualizandoMercado, setAtualizandoMercado] = useState(false);
  const [ultimoRefreshMercado, setUltimoRefreshMercado] = useState(null);
  const [scoreUnificado, setScoreUnificado] = useState(() => {
    const ins = cache.get('insights_resumo', 300_000);
    return ins?.scoreUnificado ?? ins?.score_unificado ?? null;
  });
  const [classificacaoScore, setClassificacaoScore] = useState(() => {
    const ins = cache.get('insights_resumo', 300_000);
    return ins?.classificacao ?? null;
  });
  const [dashboardPatrimonio, setDashboardPatrimonio] = useState(() =>
    cache.get('carteira_dashboard', 300_000) ?? null
  );
  const [benchmark, setBenchmark] = useState(null);
  const [categoriasColapsadas, setCategoriasColapsadas] = useState(() => 
    Object.fromEntries(tiposDisponiveis.map(cat => [cat, true]))
  );
  const [resumoExpandido, setResumoExpandido] = useState({ acoes: false, fundos: false });

  const toggleCategoria = useCallback((cat) => {
    setCategoriasColapsadas(prev => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  const carregarDados = useCallback(async () => {
    const cv1Cache = cache.get('carteira_v1');
    if (!cv1Cache?.resumo) {
      setLoading(true);
    }
    setError("");
    try {
      const TTL = 300 * 1000;
      const resumoCached = cache.get('carteira_resumo', TTL);
      const insightsCached = cache.get('insights_resumo', TTL);
      const dashboardCached = cache.get('carteira_dashboard', TTL);
      const [resumoResp, ativosResp, insightsResp, dashboardResp, benchmarkResp] = await Promise.all([
        resumoCached
          ? Promise.resolve(resumoCached)
          : carteiraApi.obterResumoCarteira().then(r => { cache.set('carteira_resumo', r); return r; }),
        carteiraApi.listarAtivosCarteira(),
        insightsCached
          ? Promise.resolve(insightsCached)
          : insightsApi.obterResumo().catch(() => null).then(r => { if (r) cache.set('insights_resumo', r); return r; }),
        dashboardCached
          ? Promise.resolve(dashboardCached)
          : carteiraApi.obterDashboardPatrimonio().catch(() => null).then(r => { if (r) cache.set('carteira_dashboard', r); return r; }),
        carteiraApi.obterBenchmarkCarteira(periodoMeses).catch(() => null),
      ]);
      setResumo(resumoResp ?? null);
      setAtivos(Array.isArray(ativosResp) ? ativosResp : []);
      setScoreUnificado(insightsResp?.scoreUnificado ?? insightsResp?.score_unificado ?? null);
      setClassificacaoScore(insightsResp?.classificacao ?? null);
      setDashboardPatrimonio(dashboardResp ?? null);
      setBenchmark(benchmarkResp ?? null);
      setUltimoRefreshMercado(new Date().toISOString());
      cache.set("carteira_v1", { resumo: resumoResp, ativos: ativosResp, timestamp: Date.now() });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        navigate("/", { replace: true });
        return;
      }
      setError("Falha ao carregar carteira.");
    } finally {
      setLoading(false);
    }
  }, [navigate, periodoMeses]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const refreshMercado = useCallback(async () => {
    setAtualizandoMercado(true);
    try {
      await carregarDados();
    } finally {
      setAtualizandoMercado(false);
    }
  }, [carregarDados]);

  const plataformas = useMemo(() => {
    const valores = new Set((ativos ?? []).map((a) => String(a.plataforma ?? "N/A")));
    return ["todas", ...Array.from(valores).sort((a, b) => a.localeCompare(b))];
  }, [ativos]);

  const ativosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let lista = (ativos ?? []).filter((asset) => {
      const categoria = String(asset.categoria ?? "");
      if (!tiposSelecionados.includes(categoria)) return false;
      if (plataformaFiltro !== "todas" && String(asset.plataforma ?? "N/A") !== plataformaFiltro) return false;
      if (statusFiltro === "atualizado" && !isMercadoDisponivel(asset)) return false;
      if (statusFiltro === "indisponivel" && isMercadoDisponivel(asset)) return false;
      if (!termo) return true;
      const alvo = `${asset.ticker ?? ""} ${asset.nome ?? ""}`.toLowerCase();
      return alvo.includes(termo);
    });

    lista = [...lista].sort((a, b) => {
      if (ordenacao === "participacao_desc") return Number(b.participacao ?? 0) - Number(a.participacao ?? 0);
      if (ordenacao === "retorno_desc") return Number(b.retorno12m ?? 0) - Number(a.retorno12m ?? 0);
      return Number(b.valorAtual ?? 0) - Number(a.valorAtual ?? 0);
    });

    return lista;
  }, [ativos, busca, ordenacao, plataformaFiltro, statusFiltro, tiposSelecionados]);

  const ativosPorCategoria = useMemo(() => {
    return ativosFiltrados.reduce((acc, asset) => {
      const cat = String(asset.categoria ?? "outros");
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(asset);
      return acc;
    }, {});
  }, [ativosFiltrados]);

  const scoreValor = Number(scoreUnificado?.score ?? 0);
  const badgeScore = classificacaoScore || (scoreUnificado?.band ?? "—");
  const categoriasUnicas = new Set((ativos ?? []).map((a) => a.categoria).filter(Boolean)).size;
  const semAtivos = !loading && !error && (ativos?.length ?? 0) === 0;
  const resumoFundos = useMemo(() => {
    const fundos = [...(ativosPorCategoria.fundo ?? [])].sort((a, b) => Number(b.valorAtual ?? 0) - Number(a.valorAtual ?? 0));
    return fundos.slice(0, 6).map((f) => {
      const quantidade = Number(f.quantidade ?? 0);
      const precoMedio = Number(f.precoMedio ?? f.preco_medio ?? 0);
      const valorAplicado = quantidade > 0 && precoMedio > 0 ? quantidade * precoMedio : Number(f.valorAtual ?? 0);
      const valorLiquido = Number(f.valorAtual ?? 0);
      return {
        id: f.id,
        nome: f.nome || f.ticker || "Fundo",
        posicao: valorLiquido,
        alocacao: Number(f.participacao ?? 0),
        rentabilidade: Number(f.retorno12m ?? 0),
        valorAplicado,
        valorLiquido,
      };
    });
  }, [ativosPorCategoria]);

  const resumoAcoes = useMemo(() => {
    const acoes = [...(ativosPorCategoria.acao ?? [])].sort((a, b) => Number(b.valorAtual ?? 0) - Number(a.valorAtual ?? 0));
    return acoes.slice(0, 8).map((a) => ({
      id: a.id,
      ticker: a.ticker || "-",
      nome: a.nome || a.ticker || "Ação",
      quantidade: Number(a.quantidade ?? 0),
      precoMedio: Number(a.precoMedio ?? a.preco_medio ?? 0),
      precoAtual: Number(a.precoAtual ?? a.precoMedio ?? a.preco_medio ?? 0),
      posicao: Number(a.valorAtual ?? 0),
      alocacao: Number(a.participacao ?? 0),
    }));
  }, [ativosPorCategoria]);

  const totaisResumo = useMemo(() => {
    const total = Number(resumo?.patrimonioTotal ?? 0);
    const totalAcoes = resumoAcoes.reduce((acc, i) => acc + i.posicao, 0);
    const totalFundos = resumoFundos.reduce((acc, i) => acc + i.posicao, 0);
    return {
      acoes: {
        valor: totalAcoes,
        percentual: total > 0 ? (totalAcoes / total) * 100 : 0,
      },
      fundos: {
        valor: totalFundos,
        percentual: total > 0 ? (totalFundos / total) * 100 : 0,
      },
    };
  }, [resumo?.patrimonioTotal, resumoAcoes, resumoFundos]);

  if (embedded) {
    return (
      <div className="w-full bg-[var(--bg-primary)] font-['Inter'] text-[var(--text-primary)]">
        <div className="w-full space-y-4">
          <GraficoAlocacao ativos={ativos} patrimonioTotal={resumo?.patrimonioTotal ?? 0} ocultarValores={ocultarValores} />

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-md shadow-black/5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Resumo da carteira</p>
              <button
                onClick={() => navigate("/carteira")}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--text-primary)] hover:border-[#F56A2A]"
              >
                Ver carteira
              </button>
            </div>
            {resumoAcoes.length > 0 && (
              <div className="mt-2 rounded-lg border border-[var(--border-color)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setResumoExpandido((prev) => ({ ...prev, acoes: !prev.acoes }))}
                  className="w-full bg-[var(--bg-secondary)] px-3 py-2 text-left"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Ações</p>
                  <p className="text-xs font-semibold text-[var(--text-primary)] mt-1">
                    {ocultarValores ? "••••••••" : moeda(totaisResumo.acoes.valor)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {ocultarValores ? "••••••••" : `${totaisResumo.acoes.percentual.toFixed(2)}% do patrimônio`}
                  </p>
                </button>
                {resumoExpandido.acoes && (
                  <div className="overflow-x-auto">
                    <table className="min-w-[760px] w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[var(--bg-secondary)]">
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Ticker</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Posição</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">% Aloc</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Qtd</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Preço médio</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Preço atual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumoAcoes.map((row, idx) => (
                          <tr key={row.id} className={idx === resumoAcoes.length - 1 ? "" : "border-b border-[var(--border-color)]"}>
                            <td className="px-3 py-2 text-xs font-semibold text-[var(--text-primary)]">{row.ticker}</td>
                            <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{ocultarValores ? "••••••••" : moeda(row.posicao)}</td>
                            <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{ocultarValores ? "••••••••" : `${row.alocacao.toFixed(2)}%`}</td>
                            <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{ocultarValores ? "••••••••" : row.quantidade.toFixed(0)}</td>
                            <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{ocultarValores ? "••••••••" : moeda(row.precoMedio)}</td>
                            <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{ocultarValores ? "••••••••" : moeda(row.precoAtual)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {resumoFundos.length > 0 && (
              <div className="mt-3 rounded-lg border border-[var(--border-color)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setResumoExpandido((prev) => ({ ...prev, fundos: !prev.fundos }))}
                  className="w-full bg-[var(--bg-secondary)] px-3 py-2 text-left"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Fundos</p>
                  <p className="text-xs font-semibold text-[var(--text-primary)] mt-1">
                    {ocultarValores ? "••••••••" : moeda(totaisResumo.fundos.valor)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {ocultarValores ? "••••••••" : `${totaisResumo.fundos.percentual.toFixed(2)}% do patrimônio`}
                  </p>
                </button>
                {resumoExpandido.fundos && (
                  <div className="overflow-x-auto">
                    <table className="min-w-[720px] w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[var(--bg-secondary)]">
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Nome</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Posição</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">% Aloc</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Rentabilidade</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Valor aplicado</th>
                          <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Valor líquido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumoFundos.map((row, idx) => (
                          <tr key={row.id} className={idx === resumoFundos.length - 1 ? "" : "border-b border-[var(--border-color)]"}>
                            <td className="px-3 py-2 text-xs font-semibold text-[var(--text-primary)]">{row.nome}</td>
                            <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{ocultarValores ? "••••••••" : moeda(row.posicao)}</td>
                            <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{ocultarValores ? "••••••••" : `${row.alocacao.toFixed(2)}%`}</td>
                            <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{ocultarValores ? "••••••••" : `${row.rentabilidade.toFixed(2)}%`}</td>
                            <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{ocultarValores ? "••••••••" : moeda(row.valorAplicado)}</td>
                            <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{ocultarValores ? "••••••••" : moeda(row.valorLiquido)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
                  className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest hover:bg-[#EFE7DC] transition-all rounded-xl"
                >
                  <RefreshCw size={14} className={atualizandoMercado ? "animate-spin" : ""} /> Atualizar
                </button>
                <button onClick={() => navigate("/historico")} className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest hover:bg-[#EFE7DC] transition-all rounded-xl">
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

        {embedded && ativos.length > 0 && (
          <div className="mb-8 w-full">
            <GraficoAlocacao ativos={ativos} patrimonioTotal={resumo?.patrimonioTotal ?? 0} ocultarValores={ocultarValores} />
          </div>
        )}

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-lg shadow-black/8 fade-in-up" style={{ animationDelay: '0.1s' }}>
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
          <div className="p-6 border-b border-[var(--border-color)] flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {tiposDisponiveis.map(tipo => {
                const isSelected = tiposSelecionados.includes(tipo);
                return (
                  <button 
                    key={tipo}
                    onClick={() => {
                      setTiposSelecionados(prev => {
                        if (prev.includes(tipo)) {
                          const next = prev.filter(t => t !== tipo);
                          return next.length ? next : prev;
                        }
                        return [...prev, tipo];
                      });
                    }}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all ${
                      isSelected 
                        ? 'bg-[#F56A2A] border-[#F56A2A] text-white shadow-sm' 
                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[#F56A2A] hover:text-[#F56A2A]'
                    }`}
                  >
                    {LABEL_CATEGORIA[tipo] || tipo}
                  </button>
                );
              })}
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <select value={periodoMeses} onChange={(e) => setPeriodoMeses(Number(e.target.value))} className="h-[32px] px-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-widest rounded-xl focus:outline-none focus:border-[#F56A2A]">
                  {periodosDisponiveis.map((p) => <option key={p} value={p}>{p}M</option>)}
                </select>
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar ativos..."
                  className="pl-9 pr-4 h-[32px] w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-widest rounded-xl focus:outline-none focus:border-[#F56A2A]"
                />
              </div>
              <select value={plataformaFiltro} onChange={(e) => setPlataformaFiltro(e.target.value)} className="h-[32px] px-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-widest rounded-xl focus:outline-none focus:border-[#F56A2A]">
                {plataformas.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="h-[32px] px-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-widest rounded-xl focus:outline-none focus:border-[#F56A2A]">
                <option value="todos">Todos os status</option>
                <option value="atualizado">Com cotação</option>
                <option value="indisponivel">Sem cotação</option>
              </select>
              <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} className="h-[32px] px-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-widest rounded-xl focus:outline-none focus:border-[#F56A2A]">
                <option value="valor_desc">Valor ↓</option>
                <option value="participacao_desc">Alocação ↓</option>
                <option value="retorno_desc">Retorno ↓</option>
              </select>
            </div>
          </div>

          {loading && <div className="p-6 text-sm text-[#0B1218]/50">Carregando seus ativos...</div>}
          {error && <div className="p-6 text-sm text-[#E85C5C]">Não conseguimos carregar seus dados. Tente novamente.</div>}

          {!loading && !error && Object.keys(ativosPorCategoria).length > 0 && (
            <div className="space-y-6">
            {ORDEM_CATEGORIAS.map(cat => {
              if (!ativosPorCategoria[cat]) return null;
              return (
                <GrupoCategoria
                  key={cat}
                  categoria={cat}
                  ativos={ativosPorCategoria[cat]}
                  ocultarValores={ocultarValores}
                  resumo={resumo}
                  isColapsed={categoriasColapsadas[cat] ?? false}
                  onToggle={toggleCategoria}
                  navigate={navigate}
                />
              );
            })}
          </div>
          )}
          {!loading && !error && Object.keys(ativosPorCategoria).length === 0 && (
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
