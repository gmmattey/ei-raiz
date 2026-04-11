import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowDownRight, ArrowUpRight, Download, Search } from "lucide-react";
import { ApiError, carteiraApi } from "../../cliente-api";
import PageHeader from "../../components/design-system/PageHeader";
import MetricCard from "../../components/design-system/MetricCard";

const categorias = [
  { label: "Todos", value: "todos" },
  { label: "Ações", value: "acao" },
  { label: "Fundos", value: "fundo" },
  { label: "Previdência", value: "previdencia" },
  { label: "Renda Fixa", value: "renda_fixa" },
];

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);

const AssetRow = ({ asset, navigate }) => (
  <tr onClick={() => navigate(`/ativo/${asset.ticker}`)} className="border-b border-[#EFE7DC]/50 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
    <td className="py-5 px-4">
      <div>
        <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">{asset.ticker}</p>
        <p className="text-[10px] text-[#0B1218]/40 font-bold uppercase tracking-tight">{asset.nome}</p>
      </div>
    </td>
    <td className="py-5 px-4 text-sm font-medium text-[#0B1218]">{asset.participacao.toFixed(2)}%</td>
    <td className="py-5 px-4 text-sm font-medium text-[#0B1218]">{moeda(asset.valorAtual)}</td>
    <td className="py-5 px-4 text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/50">
      {(asset.fontePreco || asset.fonte_preco || "nenhuma").toUpperCase()} · {(asset.statusAtualizacao || asset.status_atualizacao || "indisponivel").toUpperCase()}
    </td>
    <td className="py-5 px-4">
      <div className={`flex items-center text-[11px] font-bold ${asset.retorno12m >= 0 ? "text-[#6FCF97]" : "text-[#E85C5C]"}`}>
        {asset.retorno12m >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {asset.retorno12m.toFixed(2)}%
      </div>
    </td>
  </tr>
);

const AssetCard = ({ asset, navigate }) => (
  <button
    type="button"
    onClick={() => navigate(`/ativo/${asset.ticker}`)}
    className="w-full border border-[#EFE7DC] rounded-sm p-4 text-left hover:bg-[#FAFAFA] transition-colors"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">{asset.ticker}</p>
        <p className="text-[10px] text-[#0B1218]/40 font-bold uppercase tracking-tight">{asset.nome}</p>
      </div>
      <div className={`flex items-center text-[11px] font-bold ${asset.retorno12m >= 0 ? "text-[#6FCF97]" : "text-[#E85C5C]"}`}>
        {asset.retorno12m >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {asset.retorno12m.toFixed(2)}%
      </div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div>
        <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Alocação</p>
        <p className="text-sm font-semibold text-[#0B1218]">{asset.participacao.toFixed(2)}%</p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Valor Atual</p>
        <p className="text-sm font-semibold text-[#0B1218]">{moeda(asset.valorAtual)}</p>
      </div>
    </div>
    <p className="mt-3 text-[10px] uppercase tracking-widest text-[#0B1218]/50">
      {(asset.fontePreco || asset.fonte_preco || "nenhuma").toUpperCase()} · {(asset.statusAtualizacao || asset.status_atualizacao || "indisponivel").toUpperCase()}
    </p>
  </button>
);

export default function Carteira() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filtroInicial = searchParams.get("categoria") || "todos";
  const tickerDestacado = searchParams.get("ticker");
  const [filtro, setFiltro] = useState(filtroInicial);
  const [busca, setBusca] = useState("");
  const [plataformaFiltro, setPlataformaFiltro] = useState("todas");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("valor_desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumo, setResumo] = useState(null);
  const [ativos, setAtivos] = useState([]);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        setLoading(true);
        setError("");
        const [resumoCarteira, listaAtivos] = await Promise.all([
          carteiraApi.obterResumoCarteira(),
          filtro === "todos" ? carteiraApi.listarAtivosCarteira() : carteiraApi.obterDetalheCategoria(filtro).then((d) => d.ativos),
        ]);
        if (!ativo) return;
        setResumo(resumoCarteira);
        setAtivos(listaAtivos);
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
  }, [filtro, navigate]);

  useEffect(() => {
    setFiltro(filtroInicial);
  }, [filtroInicial]);

  const plataformas = useMemo(() => ["todas", ...Array.from(new Set((ativos || []).map((a) => a.plataforma).filter(Boolean)))], [ativos]);

  const ativosFiltrados = useMemo(() => {
    if (!busca.trim()) return ativos;
    const termo = busca.toLowerCase();
    return ativos.filter((item) => item.ticker.toLowerCase().includes(termo) || item.nome.toLowerCase().includes(termo));
  }, [ativos, busca]);
  const ativosFiltradosComRegras = useMemo(() => {
    let lista = [...ativosFiltrados];
    if (plataformaFiltro !== "todas") lista = lista.filter((item) => item.plataforma === plataformaFiltro);
    if (statusFiltro !== "todos") lista = lista.filter((item) => (item.statusAtualizacao || item.status_atualizacao || "indisponivel") === statusFiltro);
    if (ordenacao === "valor_desc") lista.sort((a, b) => (b.valorAtual || 0) - (a.valorAtual || 0));
    if (ordenacao === "participacao_desc") lista.sort((a, b) => (b.participacao || 0) - (a.participacao || 0));
    if (ordenacao === "retorno_desc") lista.sort((a, b) => (b.retorno12m || 0) - (a.retorno12m || 0));
    return lista;
  }, [ativosFiltrados, plataformaFiltro, statusFiltro, ordenacao]);
  const semAtivos = !loading && !error && ativos.length === 0;

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <div className="w-full">
        <PageHeader
          title="Tudo que você tem"
          subtitle="Dados reais consolidados da API."
          actions={
            <button onClick={() => navigate("/historico")} className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest hover:bg-[#EFE7DC] transition-all rounded-sm">
              <Download size={14} /> Histórico
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <MetricCard label="Patrimônio Total" value={moeda(resumo?.patrimonioTotal)} />
          <MetricCard label="Retorno Consolidado" value={`${resumo?.retorno12m?.toFixed?.(2) ?? "0.00"}%`} />
          <MetricCard label="Score" value={`${resumo?.score ?? 0}/100`} />
          <MetricCard label="Ativos" value={`${resumo?.quantidadeAtivos ?? 0}`} />
        </div>

        <div className="bg-white border border-[#EFE7DC] rounded-sm overflow-hidden fade-in-up" style={{ animationDelay: '0.1s' }}>
          {tickerDestacado && filtro === "acao" && (
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
          <div className="p-6 border-b border-[#EFE7DC] flex flex-col md:flex-row justify-between gap-6">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {categorias.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFiltro(tab.value)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${filtro === tab.value ? "bg-[#0B1218] text-white" : "text-[#0B1218]/40 hover:text-[#0B1218]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0B1218]/20" size={14} />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="BUSCAR ATIVO..."
                  className="pl-10 pr-4 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-[#F56A2A] w-full md:w-56"
                />
              </div>
              <select value={plataformaFiltro} onChange={(e) => setPlataformaFiltro(e.target.value)} className="px-2 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest">
                {plataformas.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="px-2 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest">
                <option value="todos">todos status</option>
                <option value="atualizado">atualizado</option>
                <option value="atrasado">atrasado</option>
                <option value="indisponivel">indisponível</option>
              </select>
              <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} className="px-2 py-2 bg-[#FAFAFA] border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest">
                <option value="valor_desc">ord: valor</option>
                <option value="participacao_desc">ord: participação</option>
                <option value="retorno_desc">ord: retorno</option>
              </select>
            </div>
          </div>

          {loading && <div className="p-6 text-sm text-[#0B1218]/50">Carregando carteira...</div>}
          {error && <div className="p-6 text-sm text-[#E85C5C]">{error}</div>}

          {!loading && !error && !semAtivos && ativosFiltradosComRegras.length > 0 && (
            <>
            <div className="md:hidden p-4 space-y-3">
              {ativosFiltradosComRegras.map((asset) => (
                <AssetCard key={asset.id} asset={asset} navigate={navigate} />
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#EFE7DC]">
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Ativo</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Alocação</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Qtd.</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Preço médio</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Valor Atual</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Mercado</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">P/L (R$)</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">Retorno Consolidado</th>
                  </tr>
                </thead>
                <tbody>
                  {ativosFiltradosComRegras.map((asset) => (
                    <tr key={asset.id} onClick={() => navigate(`/ativo/${asset.ticker}`)} className="border-b border-[#EFE7DC]/50 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                      <td className="py-5 px-4">
                        <div>
                          <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">{asset.ticker}</p>
                          <p className="text-[10px] text-[#0B1218]/40 font-bold uppercase tracking-tight">{asset.nome}</p>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-sm font-medium text-[#0B1218]">{asset.participacao.toFixed(2)}%</td>
                      <td className="py-5 px-4 text-sm font-medium text-[#0B1218]">{Number(asset.quantidade ?? 0).toFixed(4)}</td>
                      <td className="py-5 px-4 text-sm font-medium text-[#0B1218]">{moeda(asset.precoMedio || asset.preco_medio || 0)}</td>
                      <td className="py-5 px-4 text-sm font-medium text-[#0B1218]">{moeda(asset.valorAtual)}</td>
                      <td className="py-5 px-4 text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/50">
                        {(asset.fontePreco || asset.fonte_preco || "nenhuma").toUpperCase()} · {(asset.statusAtualizacao || asset.status_atualizacao || "indisponivel").toUpperCase()}
                      </td>
                      <td className={`py-5 px-4 text-sm font-semibold ${(asset.ganhoPerda || 0) >= 0 ? "text-[#6FCF97]" : "text-[#E85C5C]"}`}>{moeda(asset.ganhoPerda || 0)}</td>
                      <td className="py-5 px-4">
                        <div className={`flex items-center text-[11px] font-bold ${asset.retorno12m >= 0 ? "text-[#6FCF97]" : "text-[#E85C5C]"}`}>
                          {asset.retorno12m >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {asset.retorno12m.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  ))}                  
                </tbody>
              </table>
            </div>
            </>
          )}
          {!loading && !error && !semAtivos && ativosFiltradosComRegras.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-[#0B1218]/60">Nenhum ativo encontrado para o filtro e busca atuais.</p>
            </div>
          )}
          {semAtivos && (
            <div className="p-8 text-center">
              <p className="text-sm text-[#0B1218]/60">
                Você ainda não possui ativos importados. Use o template CSV e importe seu primeiro extrato para liberar visão de alocação e retorno.
              </p>
              <button
                onClick={() => navigate('/importar')}
                className="mt-4 px-5 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
              >
                Importar primeiro extrato
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 p-6 bg-[#E85C5C]/5 border-l-4 border-[#E85C5C] flex items-start gap-4">
          <AlertCircle className="text-[#E85C5C] shrink-0" size={20} />
          <div>
            <h4 className="font-['Sora'] text-sm font-bold text-[#E85C5C] mb-1 uppercase tracking-tight">Integração ativa</h4>
            <p className="text-xs text-[#0B1218]/70 leading-relaxed font-medium">
              Esta tela está consumindo `{filtro === "todos" ? "/api/carteira/ativos" : `/api/carteira/categoria/${filtro}`}` e `/api/carteira/resumo`.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

