import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RefreshCw, ArrowUpRight, ArrowDownRight, Search, Pencil, Filter, Download, AlertTriangle, Info } from "lucide-react";
import { ApiError, carteiraApi, marketApi } from "../../cliente-api";
import { cache } from "../../utils/cache";
import PageHeader from "../../components/design-system/PageHeader";
import MetricCard from "../../components/design-system/MetricCard";
import EstadoVazio from "../../components/feedback/EstadoVazio";
import { IconeCategoria } from "../../components/base/IconeCategoria";
import { useModoVisualizacao } from "../../context/ModoVisualizacaoContext";

const CATEGORIA_CONFIG = {
  acoes: {
    label: "Ações",
    icon: "acao",
    cols: ["Ativo", "Quantidade", "Preço Médio", "Cotação", "Saldo", "Rent. %", "Ganho R$"],
    metrics: (resumo) => [
      { label: "Total em Ações", value: resumo?.valorTotal || 0 },
      { label: "% na Carteira", value: `${(resumo?.participacao || 0).toFixed(1)}%` },
      { label: "Ativos", value: resumo?.ativos?.length || 0 },
    ]
  },
  fundos: {
    label: "Fundos",
    icon: "fundo",
    cols: ["Fundo", "Valor Aplicado", "Saldo Atual", "Rent. %", "% Aloc", ""],
    metrics: (resumo) => [
      { label: "Total em Fundos", value: resumo?.valorTotal || 0 },
      { label: "% na Carteira", value: `${(resumo?.participacao || 0).toFixed(1)}%` },
      { label: "Nº de Fundos", value: resumo?.ativos?.length || 0 },
    ]
  },
  "renda-fixa": {
    label: "Renda Fixa",
    icon: "renda_fixa",
    cols: ["Título", "Vencimento", "Taxa", "Valor Aplicado", "Saldo Atual", "Rent. %"],
    metrics: (resumo) => [
      { label: "Total Renda Fixa", value: resumo?.valorTotal || 0 },
      { label: "% na Carteira", value: `${(resumo?.participacao || 0).toFixed(1)}%` },
      { label: "Títulos", value: resumo?.ativos?.length || 0 },
    ]
  },
  previdencia: {
    label: "Previdência",
    icon: "previdencia",
    cols: ["Plano", "Fundo Vinculado", "Valor Aplicado", "Saldo Atual", "Rent. %", ""],
    metrics: (resumo) => [
      { label: "Total Previdência", value: resumo?.valorTotal || 0 },
      { label: "% na Carteira", value: `${(resumo?.participacao || 0).toFixed(1)}%` },
      { label: "Planos", value: resumo?.ativos?.length || 0 },
    ]
  },
  poupanca: {
    label: "Poupança",
    icon: "poupanca",
    cols: ["Instituição", "Saldo", "% Aloc", ""],
    metrics: (resumo) => [
      { label: "Total Poupança", value: resumo?.valorTotal || 0 },
      { label: "% na Carteira", value: `${(resumo?.participacao || 0).toFixed(1)}%` },
    ]
  },
  bens: {
    label: "Bens & Imóveis",
    icon: "bens",
    cols: ["Descrição", "Valor Estimado", "% Aloc", ""],
    metrics: (resumo) => [
      { label: "Total em Bens", value: resumo?.valorTotal || 0 },
      { label: "% na Carteira", value: `${(resumo?.participacao || 0).toFixed(1)}%` },
      { label: "Itens", value: resumo?.ativos?.length || 0 },
    ]
  }
};

const moeda = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

/**
 * @param {Object} props
 * @param {string} [props.manualCategoriaId] - Categoria manual sobrescrevendo a URL
 */
export default function AssetCategoryView({ manualCategoriaId = undefined }) {
  const { categoria: routeCategoriaId } = useParams();
  const categoriaId = manualCategoriaId || routeCategoriaId || "acoes";
  const navigate = useNavigate();
  const { ocultarValores } = useModoVisualizacao();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dados, setDados] = useState(null);
  const [busca, setBusca] = useState("");
  const [atualizando, setAtualizando] = useState(false);

  const config = CATEGORIA_CONFIG[categoriaId] || CATEGORIA_CONFIG["acoes"];
  
  // Mapeamento de rotas plurais para parâmetros singulares da API
  const categoriaApiTipo = {
    "acoes": "acao",
    "fundos": "fundo",
    "previdencia": "previdencia",
    "renda-fixa": "renda_fixa",
    "poupanca": "poupanca",
    "bens": "bens"
  }[categoriaId] || categoriaId;

  const revalidarCategoria = useCallback(async (isAtivo) => {
    try {
      const res = await carteiraApi.obterDetalheCategoria(categoriaApiTipo);
      if (!isAtivo) return;
      
      setDados(res);
      setLoading(false);
      
      // Salvar no cache
      const CACHE_KEY = `cat_detail_${categoriaId}`;
      cache.set(CACHE_KEY, res);
      
      // Tentar atualizar cotações se for ação
      if (categoriaId === "acoes" && res.ativos.length > 0) {
        const tickers = res.ativos.map(a => a.ticker).filter(Boolean);
        if (tickers.length > 0) {
          setAtualizando(true);
          try {
            const quotes = await marketApi.obterCotacoes(tickers);
            if (isAtivo && quotes.items) {
              const quoteMap = new Map(quotes.items.map(q => [q.ticker, q]));
              const ativosAtualizados = res.ativos.map(a => {
                const q = quoteMap.get(a.ticker);
                if (!q) return a;
                return {
                  ...a,
                  precoAtual: q.price,
                  statusAtualizacao: "atualizado",
                  valorAtual: (a.quantidade || 0) * q.price
                };
              });
              const novosDados = { ...res, ativos: ativosAtualizados };
              setDados(novosDados);
              cache.set(CACHE_KEY, novosDados);
            }
          } catch (e) {
            console.warn("Falha ao atualizar cotações em background", e);
          } finally {
            setAtualizando(false);
          }
        }
      }
    } catch (e) {
      if (isAtivo) {
        setLoading(false);
        setError("Erro ao carregar dados atualizados.");
      }
    }
  }, [categoriaId, categoriaApiTipo]);

  const carregar = useCallback(async (isAtivo = true) => {
    try {
      const CACHE_KEY = `cat_detail_${categoriaId}`;
      const dadosCache = cache.get(CACHE_KEY);
      
      if (dadosCache && isAtivo) {
        setDados(dadosCache);
        setLoading(false);
        void revalidarCategoria(isAtivo);
        return;
      }

      setLoading(true);
      setError("");
      await revalidarCategoria(isAtivo);
    } catch (err) {
      if (isAtivo) {
        setError("Falha ao carregar categoria.");
        setLoading(false);
      }
    }
  }, [categoriaId, revalidarCategoria]);

  useEffect(() => {
    let ativo = true;
    void carregar(ativo);
    return () => { ativo = false; };
  }, [carregar]);

  const ativosFiltrados = useMemo(() => {
    if (!dados?.ativos) return [];
    if (!busca.trim()) return dados.ativos;
    const t = busca.toLowerCase();
    return dados.ativos.filter(a => a.ticker.toLowerCase().includes(t) || a.nome.toLowerCase().includes(t));
  }, [dados, busca]);

  const metrics = useMemo(() => {
    if (!dados || !config.metrics) return [];
    try {
      return config.metrics(dados);
    } catch (e) {
      console.warn("Falha ao calcular métricas:", e);
      return [];
    }
  }, [config, dados]);

  if (loading && !dados) return (
    <div className="w-full space-y-8 animate-pulse">
      <div className="h-20 bg-gray-100 rounded-2xl w-full" />
      <div className="grid grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-96 bg-gray-100 rounded-2xl w-full" />
    </div>
  );

  if (error && !dados) return <EstadoVazio titulo="Erro ao carregar" descricao={error} />;

  return (
    <div className="w-full font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <PageHeader
        title={config.label}
        subtitle={`Gerenciamento detalhado de ${config.label.toLowerCase()} na sua carteira.`}
        actions={
          <button 
            onClick={carregar}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest hover:bg-[#FAFAFA] transition-all rounded-xl"
          >
            <RefreshCw size={14} className={atualizando ? "animate-spin" : ""} /> Atualizar
          </button>
        }
      />

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {metrics.map((m, idx) => (
          <MetricCard
            key={idx}
            label={m.label}
            value={typeof m.value === "number" ? (ocultarValores ? "••••••••" : moeda(m.value)) : m.value}
          />
        ))}
      </div>

      {/* Barra de Filtro */}
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0B1218]/30" size={16} />
          <input
            type="text"
            placeholder={`Buscar por ${categoriaId === "acoes" ? "ticker ou nome" : "nome"}...`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#EFE7DC] rounded-2xl text-sm focus:outline-none focus:border-[#F56A2A] transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-3 bg-white border border-[#EFE7DC] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/60 hover:text-[#0B1218] transition-colors">
              <Filter size={14} /> Filtros
           </button>
           <button className="flex items-center gap-2 px-4 py-3 bg-[#0B1218] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors">
              <Download size={14} /> Exportar
           </button>
        </div>
      </div>

      {/* Grid de Ativos (XP Style) */}
      <div className="bg-white border border-[#EFE7DC] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#EFE7DC]">
                {config.cols.map((col, i) => (
                  <th key={i} className="py-5 px-6 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-[0.1em]">
                    {col}
                  </th>
                ))}
                <th className="py-5 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE7DC]/50">
              {ativosFiltrados.map((item) => (
                <AssetRow key={item.id} asset={item} categoria={categoriaId} ocultarValores={ocultarValores} navigate={navigate} />
              ))}
              {ativosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={config.cols.length + 1} className="py-20 text-center">
                    <p className="text-sm text-[#0B1218]/30 font-medium">Nenhum ativo encontrado nesta categoria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusPrecoMedioBadge({ status }) {
  if (!status || status === "confiavel") return null;
  const isAjustado = status === "ajustado_heuristica";
  const title = isAjustado
    ? "Preço médio ajustado automaticamente (heurística de reconciliação)"
    : "Preço médio inconsistente — revise na tela do ativo";
  const color = isAjustado ? "text-[#F2C94C]" : "text-[#E85C5C]";
  const Icon = isAjustado ? Info : AlertTriangle;
  return (
    <span title={title} className={`inline-flex items-center ml-1 align-middle ${color}`}>
      <Icon size={12} />
    </span>
  );
}

function AssetRow({ asset, categoria, ocultarValores, navigate }) {
  const valorAtual = asset.valorAtual ?? 0;
  const precoMedio = asset.precoMedio ?? asset.preco_medio ?? 0;
  const statusPrecoMedio = asset.statusPrecoMedio ?? asset.status_preco_medio ?? null;
  const rentabilidadeConfiavel = asset.rentabilidadeConfiavel !== false && asset.rentabilidade_confiavel !== false;
  const rentabilidadeBruta = asset.rentabilidadeDesdeAquisicaoPct ?? asset.rentabilidade_desde_aquisicao_pct;
  const rentabilidadeIndisponivel = !rentabilidadeConfiavel || typeof rentabilidadeBruta !== "number" || !Number.isFinite(rentabilidadeBruta);
  const rentabilidade = rentabilidadeIndisponivel ? 0 : Number(rentabilidadeBruta);
  const ganho = asset.ganhoPerda ?? (valorAtual - (asset.quantidade ?? 0) * precoMedio);
  const valorAplicado = (asset.quantidade ?? 0) * precoMedio;

  const getRentColor = (v) => v >= 0 ? "text-[#1A7A45]" : "text-[#E85C5C]";

  if (categoria === "acoes") {
    return (
      <tr className="hover:bg-[#FAFAFA] transition-colors group">
        <td className="py-5 px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F56A2A]/10 flex items-center justify-center text-[#F56A2A]">
              <IconeCategoria categoria="acao" size={16} />
            </div>
            <div>
              <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">{asset.ticker}</p>
              <p className="text-[10px] text-[#0B1218]/40 font-medium truncate max-w-[120px]">{asset.nome}</p>
            </div>
          </div>
        </td>
        <td className="py-5 px-6 text-sm font-medium text-[#0B1218]">{asset.quantidade?.toFixed(0)}</td>
        <td className="py-5 px-6 text-sm font-medium text-[#0B1218]">
          {ocultarValores ? "••••" : moeda(precoMedio)}
          <StatusPrecoMedioBadge status={statusPrecoMedio} />
        </td>
        <td className="py-5 px-6 text-sm font-medium text-[#0B1218]">{ocultarValores ? "••••" : moeda(asset.precoAtual ?? precoMedio)}</td>
        <td className="py-5 px-6 text-sm font-bold text-[#0B1218]">{ocultarValores ? "••••" : moeda(valorAtual)}</td>
        <td className={`py-5 px-6 text-sm font-bold ${rentabilidadeIndisponivel ? "text-[#0B1218]/40" : getRentColor(rentabilidade)}`}>
           {ocultarValores ? "••••" : (rentabilidadeIndisponivel ? "—" : `${rentabilidade >= 0 ? "+" : ""}${rentabilidade.toFixed(2)}%`)}
        </td>
        <td className="py-5 px-6 text-sm font-semibold">
           <span className={getRentColor(ganho)}>
             {ocultarValores ? "••••" : moeda(ganho)}
           </span>
        </td>
        <td className="py-5 px-6 text-right">
          <button 
            onClick={() => navigate(`/ativo/${asset.ticker}`)}
            className="p-2.5 border border-[#EFE7DC] rounded-xl hover:bg-white transition-all opacity-0 group-hover:opacity-100"
          >
            <Pencil size={14} className="text-[#0B1218]/40" />
          </button>
        </td>
      </tr>
    );
  }

  if (categoria === "fundos") {
    return (
      <tr className="hover:bg-[#FAFAFA] transition-colors group">
        <td className="py-5 px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0B1218]/5 flex items-center justify-center text-[#0B1218]/40">
              <IconeCategoria categoria="fundo" size={16} />
            </div>
            <div>
              <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">{asset.nome || asset.ticker}</p>
              <p className="text-[10px] text-[#0B1218]/40 font-medium">Fundo de Investimento</p>
            </div>
          </div>
        </td>
        <td className="py-5 px-6 text-sm font-medium text-[#0B1218]">{ocultarValores ? "••••" : moeda(valorAplicado)}</td>
        <td className="py-5 px-6 text-sm font-bold text-[#0B1218]">{ocultarValores ? "••••" : moeda(valorAtual)}</td>
        <td className={`py-5 px-6 text-sm font-bold ${rentabilidadeIndisponivel ? "text-[#0B1218]/40" : getRentColor(rentabilidade)}`}>
           {ocultarValores ? "••••" : (rentabilidadeIndisponivel ? "—" : `${rentabilidade >= 0 ? "+" : ""}${rentabilidade.toFixed(2)}%`)}
        </td>
        <td className="py-5 px-6 text-sm font-medium text-[#0B1218]">{ocultarValores ? "••••" : `${(asset.participacao ?? 0).toFixed(2)}%`}</td>
        <td className="py-5 px-6 text-right">
          <button
            onClick={() => navigate(asset.ticker ? `/ativo/${asset.ticker}` : '/perfil')}
            className="p-2.5 border border-[#EFE7DC] rounded-xl hover:bg-white transition-all opacity-0 group-hover:opacity-100"
          >
            <Pencil size={14} className="text-[#0B1218]/40" />
          </button>
        </td>
      </tr>
    );
  }

  if (categoria === "renda-fixa") {
    return (
      <tr className="hover:bg-[#FAFAFA] transition-colors group">
        <td className="py-5 px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#6FCF97]/10 flex items-center justify-center text-[#6FCF97]">
              <IconeCategoria categoria="renda_fixa" size={16} />
            </div>
            <div>
              <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">{asset.nome || asset.ticker}</p>
              <p className="text-[10px] text-[#0B1218]/40 font-medium">{asset.plataforma || "Renda Fixa"}</p>
            </div>
          </div>
        </td>
        <td className="py-5 px-6 text-sm font-medium text-[#0B1218]">{asset.vencimento || asset.data_vencimento || "—"}</td>
        <td className="py-5 px-6 text-sm font-medium text-[#0B1218]">{asset.taxa || asset.indexador || "100% CDI"}</td>
        <td className="py-5 px-6 text-sm font-medium text-[#0B1218]">{ocultarValores ? "••••" : moeda(valorAplicado)}</td>
        <td className="py-5 px-6 text-sm font-bold text-[#0B1218]">{ocultarValores ? "••••" : moeda(valorAtual)}</td>
        <td className={`py-5 px-6 text-sm font-bold ${rentabilidadeIndisponivel ? "text-[#0B1218]/40" : getRentColor(rentabilidade)}`}>
           {ocultarValores ? "••••" : (rentabilidadeIndisponivel ? "—" : `${rentabilidade >= 0 ? "+" : ""}${rentabilidade.toFixed(2)}%`)}
        </td>
        <td className="py-5 px-6 text-right">
          <button 
            onClick={() => navigate(asset.ticker ? `/ativo/${asset.ticker}` : '/perfil')}
            className="p-2.5 border border-[#EFE7DC] rounded-xl hover:bg-white transition-all opacity-0 group-hover:opacity-100"
          >
            <Pencil size={14} className="text-[#0B1218]/40" />
          </button>
        </td>
      </tr>
    );
  }

  // Fallback for previdencia, poupanca, bens
  return (
    <tr className="hover:bg-[#FAFAFA] transition-colors group">
      <td className="py-5 px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0B1218]/5 flex items-center justify-center text-[#0B1218]/40">
            <IconeCategoria categoria={categoria === "renda-fixa" ? "renda_fixa" : categoria} size={16} />
          </div>
          <div>
            <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">{asset.nome || asset.ticker}</p>
            {asset.plataforma && <p className="text-[10px] text-[#0B1218]/40 font-medium">{asset.plataforma}</p>}
          </div>
        </div>
      </td>
      <td className="py-5 px-6 text-sm font-bold text-[#0B1218]">{ocultarValores ? "••••" : moeda(valorAtual)}</td>
      <td className="py-5 px-6 text-sm font-medium text-[#0B1218]">{ocultarValores ? "••••" : `${(asset.participacao ?? 0).toFixed(2)}%`}</td>
      <td colSpan={config.cols.length - 3}></td>
      <td className="py-5 px-6 text-right">
        <button 
          onClick={() => navigate(asset.ticker ? `/ativo/${asset.ticker}` : '/perfil')}
          className="p-2.5 border border-[#EFE7DC] rounded-xl hover:bg-white transition-all opacity-0 group-hover:opacity-100"
        >
          <Pencil size={14} className="text-[#0B1218]/40" />
        </button>
      </td>
    </tr>
  );
}

