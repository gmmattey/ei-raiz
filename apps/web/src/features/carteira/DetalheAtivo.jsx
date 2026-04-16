import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowRightLeft, ArrowRight, ArrowUpRight, Briefcase, Building2, ChevronLeft, Clock3, Landmark, Layers, RefreshCw, Shield, TrendingUp } from "lucide-react";
import { formatarData } from "../../utils/formatarData";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, carteiraApi, marketApi, portfolioApi } from "../../cliente-api";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);

const categoriaLabel = (categoria) => {
  if (categoria === "acao") return "Ação";
  if (categoria === "fii") return "FII";
  if (categoria === "fundo") return "Fundo";
  if (categoria === "renda_fixa") return "Renda Fixa";
  if (categoria === "previdencia") return "Previdência";
  return categoria || "--";
};

const CategoriaIcone = ({ categoria, size = 28 }) => {
  const props = { size };
  if (categoria === "acao") return <TrendingUp {...props} />;
  if (categoria === "fii") return <Building2 {...props} />;
  if (categoria === "fundo") return <Layers {...props} />;
  if (categoria === "renda_fixa") return <Landmark {...props} />;
  if (categoria === "previdencia") return <Shield {...props} />;
  return <Briefcase {...props} />;
};

const normalizarDataInput = (data) => {
  if (!data) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const formatarHoraSimples = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
};

const TIPO_TIMELINE = {
  aporte: "Compra registrada",
  exclusao: "Ativo removido",
  aquisicao: "Primeira compra",
  cotacao: "Cotação atualizada",
};

// Gráfico SVG com eixos
const GraficoEvolucao = ({ serie }) => {
  const W = 560;
  const H = 180;
  const PADDING_LEFT = 80;
  const PADDING_BOTTOM = 30;
  const chartW = W - PADDING_LEFT - 10;
  const chartH = H - PADDING_BOTTOM - 10;

  if (!serie || serie.length === 0) return null;

  const valores = serie.map((p) => Number(p.valor ?? 0));
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const span = max - min || 1;

  const toX = (idx) => PADDING_LEFT + (idx / Math.max(1, serie.length - 1)) * chartW;
  const toY = (val) => 10 + chartH - ((val - min) / span) * chartH;

  const points = serie.map((p, idx) => `${toX(idx).toFixed(1)},${toY(Number(p.valor ?? 0)).toFixed(1)}`).join(" ");
  const mid = (min + max) / 2;

  const dataInicio = serie[0]?.data ? formatarData(serie[0].data) : "";
  const dataFim = serie[serie.length - 1]?.data ? formatarData(serie[serie.length - 1].data) : "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px] bg-white">
      {/* Eixo Y — linhas guia */}
      {[min, mid, max].map((val, i) => {
        const y = toY(val).toFixed(1);
        return (
          <g key={i}>
            <line x1={PADDING_LEFT} y1={y} x2={W - 10} y2={y} stroke="#EFE7DC" strokeWidth="1" strokeDasharray="4 3" />
            <text x={PADDING_LEFT - 6} y={Number(y) + 4} textAnchor="end" fontSize="9" fill="#0B1218" opacity="0.4">
              {new Intl.NumberFormat("pt-BR", { notation: "compact", style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val)}
            </text>
          </g>
        );
      })}
      {/* Eixo X — datas */}
      {dataInicio && (
        <text x={PADDING_LEFT} y={H - 4} textAnchor="start" fontSize="9" fill="#0B1218" opacity="0.4">{dataInicio}</text>
      )}
      {dataFim && (
        <text x={W - 10} y={H - 4} textAnchor="end" fontSize="9" fill="#0B1218" opacity="0.4">{dataFim}</text>
      )}
      {/* Linha do gráfico */}
      <polyline points={points} fill="none" stroke="#F56A2A" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
};

export default function DetalheAtivo() {
  const navigate = useNavigate();
  const { ticker } = useParams();
  const [loading, setLoading] = useState(true);
  const [salvandoData, setSalvandoData] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [aplicandoAporte, setAplicandoAporte] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [motivoExclusao, setMotivoExclusao] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [refreshingMarket, setRefreshingMarket] = useState(false);
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [ativo, setAtivo] = useState(null);
  const [ativosCarteira, setAtivosCarteira] = useState([]);
  const [dataAquisicao, setDataAquisicao] = useState("");
  const [movimentacao, setMovimentacao] = useState({ ativoDestinoId: "", valor: "", dataMovimentacao: "", observacao: "" });
  const [aporte, setAporte] = useState({ valorAporte: "", quantidade: "", precoUnitario: "", dataOperacao: "", observacao: "" });

  const carregar = async () => {
    if (!ticker) return;
    setLoading(true);
    setError("");
    try {
      const [detalhe, ativos] = await Promise.all([carteiraApi.obterDetalheAtivo(ticker), carteiraApi.listarAtivosCarteira()]);
      const quantity = Number(detalhe.quantidade ?? 0);
      const averagePrice = Number(detalhe.precoMedio ?? detalhe.preco_medio ?? 0);
      let nextAnalysis = null;
      if (quantity > 0 && averagePrice > 0) {
        try {
          nextAnalysis = await portfolioApi.analisarPosicao({ ticker, quantity, averagePrice });
        } catch {
          nextAnalysis = null;
        }
      }
      try {
        const quote = await marketApi.obterCotacao(ticker);
        const qty = Number(detalhe.quantidade ?? 0);
        const valorAtualMercado = quote?.price != null && qty > 0 ? qty * quote.price : null;
        detalhe.precoAtual = quote.price ?? detalhe.precoAtual;
        detalhe.valorAtual = valorAtualMercado ?? detalhe.valorAtual;
        detalhe.fontePreco = quote.source ?? detalhe.fontePreco;
        detalhe.ultimaAtualizacao = quote.updatedAt || quote.fetchedAt || detalhe.ultimaAtualizacao;
        detalhe.statusAtualizacao = quote.price != null ? "atualizado" : (detalhe.statusAtualizacao || "indisponivel");
      } catch {
        // mantém detalhe original
      }
      setAtivo(detalhe);
      setAnalysis(nextAnalysis);
      setAtivosCarteira(ativos);
      const dataBase = detalhe.dataAquisicao || detalhe.data_aquisicao || detalhe.dataCadastro || detalhe.data_cadastro;
      const dataNormalizada = normalizarDataInput(dataBase);
      setDataAquisicao(dataNormalizada);
      setAporte((anterior) => ({ ...anterior, dataOperacao: anterior.dataOperacao || new Date().toISOString().slice(0, 10) }));
      setMovimentacao((anterior) => ({ ...anterior, dataMovimentacao: anterior.dataMovimentacao || dataNormalizada || new Date().toISOString().slice(0, 10) }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/", { replace: true });
        return;
      }
      setError("Falha ao carregar detalhe do ativo.");
    } finally {
      setLoading(false);
    }
  };

  const refreshMarketData = async () => {
    if (!ticker || !ativo) return;
    setRefreshingMarket(true);
    try {
      await carregar();
    } finally {
      setRefreshingMarket(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, [ticker]);

  // Auto-calcular valorAporte ao preencher quantidade + precoUnitario
  useEffect(() => {
    const qtd = Number(aporte.quantidade);
    const preco = Number(aporte.precoUnitario);
    if (qtd > 0 && preco > 0) {
      setAporte((ant) => ({ ...ant, valorAporte: (qtd * preco).toFixed(2) }));
    }
  }, [aporte.quantidade, aporte.precoUnitario]);

  const ativosDestino = useMemo(() => ativosCarteira.filter((item) => item.id !== ativo?.id), [ativosCarteira, ativo]);

  const salvarDataAquisicao = async () => {
    if (!ativo?.id || !dataAquisicao) return;
    if (!window.confirm("Confirmar atualização da data de aquisição? O comparativo será recalculado.")) return;
    setSalvandoData(true);
    setError("");
    setSucesso("");
    try {
      const resposta = await carteiraApi.atualizarDataAquisicaoAtivo(ativo.id, dataAquisicao);
      setSucesso(resposta.mensagem || "Data de aquisição atualizada e comparativos recalculados.");
      await carregar();
    } catch {
      setError("Não foi possível atualizar a data de aquisição.");
    } finally {
      setSalvandoData(false);
    }
  };

  const vincularMovimentacao = async () => {
    if (!ativo?.id || !movimentacao.ativoDestinoId || !movimentacao.valor || !movimentacao.dataMovimentacao) {
      setError("Preencha destino, valor e data da movimentação.");
      return;
    }
    if (!window.confirm("Confirmar vínculo da movimentação entre os ativos?")) return;
    setVinculando(true);
    setError("");
    setSucesso("");
    try {
      const resposta = await carteiraApi.vincularMovimentacaoAtivos({
        ativoOrigemId: ativo.id,
        ativoDestinoId: movimentacao.ativoDestinoId,
        valor: Number(movimentacao.valor),
        dataMovimentacao: movimentacao.dataMovimentacao,
        observacao: movimentacao.observacao?.trim() || undefined,
      });
      setSucesso(resposta.mensagem || "Movimentação vinculada com sucesso.");
      setMovimentacao((anterior) => ({ ...anterior, valor: "", observacao: "" }));
      await carregar();
    } catch {
      setError("Não foi possível vincular a movimentação.");
    } finally {
      setVinculando(false);
    }
  };

  const registrarAporte = async () => {
    if (!ativo?.id || !aporte.valorAporte) {
      setError("Informe ao menos o valor da compra.");
      return;
    }
    if (!window.confirm("Confirmar registro desta compra?")) return;
    setAplicandoAporte(true);
    setError("");
    setSucesso("");
    try {
      const resposta = await carteiraApi.registrarAporteAtivo(ativo.id, {
        valorAporte: Number(aporte.valorAporte),
        quantidade: aporte.quantidade ? Number(aporte.quantidade) : undefined,
        precoUnitario: aporte.precoUnitario ? Number(aporte.precoUnitario) : undefined,
        dataOperacao: aporte.dataOperacao || undefined,
        observacao: aporte.observacao?.trim() || undefined,
      });
      setSucesso(resposta.mensagem || "Compra registrada com sucesso.");
      setAporte((anterior) => ({ ...anterior, valorAporte: "", quantidade: "", precoUnitario: "", observacao: "" }));
      await carregar();
    } catch {
      setError("Não foi possível registrar a compra.");
    } finally {
      setAplicandoAporte(false);
    }
  };

  const excluirAtivo = async () => {
    if (!ativo?.id) return;
    const motivo = motivoExclusao.trim();
    if (motivo.length < 5) {
      setError("Motivo obrigatório para remover o ativo.");
      return;
    }
    if (!window.confirm("Confirmar remoção deste ativo? Essa ação não pode ser desfeita.")) return;
    setExcluindo(true);
    setError("");
    setSucesso("");
    try {
      const resposta = await carteiraApi.excluirAtivo(ativo.id, motivo);
      setSucesso(resposta.mensagem || "Ativo removido com sucesso.");
      setModalExclusaoAberto(false);
      setMotivoExclusao("");
      navigate("/carteira", { replace: true });
    } catch {
      setError("Não foi possível remover o ativo.");
    } finally {
      setExcluindo(false);
    }
  };

  if (loading) return <p className="text-sm text-[#0B1218]/50 p-6">Carregando detalhe...</p>;
  if (error && !ativo) return <p className="text-sm text-[#E85C5C] p-6">{error}</p>;
  if (!ativo) return <p className="text-sm text-[#0B1218]/50 p-6">Ativo não encontrado.</p>;

  const statusCotacao = ativo.statusAtualizacao || ativo.status_atualizacao || "indisponivel";
  const temCotacao = statusCotacao === "atualizado" && ativo.precoAtual != null;
  const ultimaAtualizacao = ativo.ultimaAtualizacao || ativo.ultima_atualizacao;
  const benchmark = ativo.benchmarkDesdeAquisicao || ativo.benchmark_desde_aquisicao;
  const serieTicker = ativo.serieTicker || ativo.serie_ticker || [];
  const eventosTicker = ativo.eventosTicker || ativo.eventos_ticker || [];

  // Métricas calculadas (3.2)
  const quantidade = Number(ativo.quantidade ?? 0);
  const precoMedio = Number(ativo.precoMedio ?? ativo.preco_medio ?? 0);
  const totalInvestido = quantidade * precoMedio;
  const valorAtual = Number(ativo.valorAtual ?? 0);
  const ganhoPerda = valorAtual - totalInvestido;
  const ganhoPerdaPerc = totalInvestido > 0 ? ((valorAtual / totalInvestido) - 1) * 100 : null;
  const ganhoPositivo = ganhoPerda >= 0;

  // Benchmark (3.4)
  const retornoAtivo = Number.isFinite(Number(benchmark?.carteiraRetornoPeriodo)) ? Number(benchmark.carteiraRetornoPeriodo) : null;
  const retornoCDI = Number.isFinite(Number(benchmark?.cdiRetornoPeriodo)) ? Number(benchmark.cdiRetornoPeriodo) : null;
  const excesso = Number.isFinite(Number(benchmark?.excessoRetorno)) ? Number(benchmark.excessoRetorno) : null;

  // Analysis signal (3.6)
  const SIGNAL_LABEL = { buy: "COMPRAR", hold: "MANTER", sell: "VENDER" };
  const SIGNAL_COLOR = { buy: "text-[#1A7A45]", hold: "text-[#0B1218]/60", sell: "text-[#E85C5C]" };
  const SIGNAL_ICON = {
    buy: <ArrowUpRight size={16} />,
    hold: <ArrowRight size={16} />,
    sell: <ArrowDownRight size={16} />,
  };
  const CONFIDENCE_LABEL = {
    high: "Alta confiança",
    medium: "Confiança moderada",
    low: "Confiança baixa — use com cautela",
  };

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218]">
      <div className="w-full">

        {/* 3.1 — Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/carteira")}
            className="flex items-center gap-1 text-sm text-[#0B1218]/50 hover:text-[#0B1218] transition-colors mb-5"
          >
            <ChevronLeft size={16} /> Voltar para carteira
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex gap-5 items-center">
              <div className="w-14 h-14 rounded-xl bg-[#0B1218] text-white flex items-center justify-center shrink-0">
                <CategoriaIcone categoria={ativo.categoria} size={26} />
              </div>
              <div>
                <h1 className="font-['Sora'] text-4xl font-bold tracking-tighter">{ativo.ticker}</h1>
                <p className="text-[#0B1218]/55 text-sm font-medium mt-0.5">{ativo.nome}</p>
                <p className="text-sm text-[#0B1218]/40 mt-0.5">
                  {categoriaLabel(ativo.categoria)}
                  {ativo.plataforma && ativo.plataforma !== "Importacao CSV" ? ` · ${ativo.plataforma}` : ""}
                </p>
              </div>
            </div>

            {/* Cotação atual */}
            <div className="border border-[#EFE7DC] rounded-xl p-4 min-w-[200px]">
              <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest mb-1">Cotação atual</p>
              {temCotacao ? (
                <>
                  <p className="font-['Sora'] text-2xl font-bold text-[#0B1218]">{moeda(ativo.precoAtual)}</p>
                  {ultimaAtualizacao && (
                    <p className="text-[10px] text-[#0B1218]/40 mt-1">
                      Atualizado às {formatarHoraSimples(ultimaAtualizacao)}
                    </p>
                  )}
                  <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-xl bg-[rgba(111,207,151,0.15)] text-[#1A7A45]">
                    Com cotação
                  </span>
                </>
              ) : (
                <>
                  <p className="font-['Sora'] text-xl font-bold text-[#0B1218]/40">{moeda(precoMedio)}</p>
                  <p className="text-[10px] text-[#0B1218]/40 mt-1">Preço de importação</p>
                  <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-xl bg-[#EFE7DC] text-[#0B1218]/50">
                    Sem cotação
                  </span>
                </>
              )}
              <button
                onClick={() => void refreshMarketData()}
                className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40 hover:text-[#0B1218] transition-colors"
              >
                <RefreshCw size={11} className={refreshingMarket ? "animate-spin" : ""} />
                Atualizar cotação
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-[#E85C5C] mb-4">{error}</p>}
        {sucesso && <p className="text-sm text-[#1A7A45] mb-4">{sucesso}</p>}

        {/* 3.2 — Métricas */}
        <section className="border border-[#EFE7DC] rounded-xl p-5 mb-6">
          {/* Linha 1 — Posição */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pb-5 border-b border-[#EFE7DC]">
            <MetricaItem label="Quantidade" value={`${quantidade % 1 === 0 ? quantidade.toFixed(0) : quantidade.toFixed(2)} ${ativo.categoria === "acao" ? "ações" : "cotas"}`} />
            <MetricaItem label="Preço médio" value={moeda(precoMedio)} />
            <MetricaItem label="Total investido" value={moeda(totalInvestido)} />
            <MetricaItem label="Valor atual" value={moeda(valorAtual)} />
          </div>
          {/* Linha 2 — Resultado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pt-5">
            <MetricaItem
              label="Ganho/Perda R$"
              value={moeda(ganhoPerda)}
              cor={ganhoPositivo ? "#1A7A45" : "#E85C5C"}
              sinal
            />
            <MetricaItem
              label="Ganho/Perda %"
              value={ganhoPerdaPerc != null ? `${ganhoPerdaPerc >= 0 ? "+" : ""}${ganhoPerdaPerc.toFixed(2)}%` : "—"}
              cor={ganhoPerdaPerc != null ? (ganhoPerdaPerc >= 0 ? "#1A7A45" : "#E85C5C") : undefined}
            />
            <MetricaItem label="% da carteira" value={`${Number(ativo.participacao || 0).toFixed(2)}%`} />
            <MetricaItem label="Categoria" value={categoriaLabel(ativo.categoria)} />
          </div>
        </section>

        {/* 3.6 — Análise automática */}
        {analysis && (
          <section className="border border-[#EFE7DC] rounded-xl p-5 mb-6">
            <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-4">Análise automática da posição</h2>
            <div className="flex flex-col md:flex-row gap-6 mb-4">
              <div>
                <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest mb-1">Sinal</p>
                <div className={`flex items-center gap-1.5 font-['Sora'] text-base font-bold ${SIGNAL_COLOR[analysis.signal] ?? "text-[#0B1218]"}`}>
                  {SIGNAL_ICON[analysis.signal]}
                  {SIGNAL_LABEL[analysis.signal] ?? analysis.signal?.toUpperCase()}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest mb-1">Confiança</p>
                <p className="text-sm font-medium text-[#0B1218]">{CONFIDENCE_LABEL[analysis.confidence] ?? analysis.confidence}</p>
              </div>
              {analysis.profitLossPercent != null && (
                <div>
                  <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest mb-1">P/L atual</p>
                  <p className={`text-sm font-semibold ${Number(analysis.profitLossPercent) >= 0 ? "text-[#1A7A45]" : "text-[#E85C5C]"}`}>
                    {Number(analysis.profitLossPercent) >= 0 ? "+" : ""}{Number(analysis.profitLossPercent).toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
            {(analysis.rationale || []).length > 0 && (
              <ul className="space-y-1 mb-4">
                {(analysis.rationale || []).map((item, idx) => (
                  <li key={`${item}-${idx}`} className="text-sm text-[#0B1218]/75 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#0B1218]/30 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {analysis.disclaimer && (
              <div className="flex items-start gap-2 bg-[#FAFAFA] border border-[#EFE7DC] rounded-xl p-3">
                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-[#0B1218]/40" />
                <p className="text-xs text-[#0B1218]/55">{analysis.disclaimer}</p>
              </div>
            )}
          </section>
        )}

        {/* 3.4 — Desempenho desde a compra */}
        <section className="border border-[#EFE7DC] rounded-xl p-5 mb-6">
          <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-4">Desempenho desde a compra</h2>
          {retornoAtivo == null && retornoCDI == null ? (
            <p className="text-sm text-[#0B1218]/55">Para calcular, informe a data de aquisição abaixo.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#EFE7DC] pb-3">
                <span className="text-sm text-[#0B1218]/70">Retorno do ativo</span>
                <span className={`font-['Sora'] text-sm font-bold ${retornoAtivo != null && retornoAtivo >= 0 ? "text-[#1A7A45]" : "text-[#E85C5C]"}`}>
                  {retornoAtivo != null ? `${retornoAtivo >= 0 ? "+" : ""}${retornoAtivo.toFixed(2)}%` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#EFE7DC] pb-3">
                <span className="text-sm text-[#0B1218]/70">Retorno do CDI</span>
                <span className="font-['Sora'] text-sm font-bold text-[#0B1218]/60">
                  {retornoCDI != null ? `+${retornoCDI.toFixed(2)}%` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#0B1218]/70">
                  {excesso != null && excesso >= 0 ? "Você ganhou do CDI" : "Ficou abaixo do CDI"}
                </span>
                <span className={`font-['Sora'] text-sm font-bold ${excesso != null && excesso >= 0 ? "text-[#1A7A45]" : "text-[#E85C5C]"}`}>
                  {excesso != null ? `${excesso >= 0 ? "+" : ""}${excesso.toFixed(2)}%` : "—"}
                </span>
              </div>
            </div>
          )}
          {excesso != null && (
            <p className="mt-3 text-xs text-[#0B1218]/50">
              {excesso > 0
                ? `Este ativo ganhou do CDI por ${excesso.toFixed(2)} pontos percentuais.`
                : `Este ativo ficou abaixo do CDI por ${Math.abs(excesso).toFixed(2)} pontos percentuais.`}
            </p>
          )}
        </section>

        {/* Data de aquisição */}
        <section className="border border-[#EFE7DC] rounded-xl p-5 mb-6">
          <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-3">Data de aquisição (base comparativa)</h2>
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Data</label>
              <input
                type="date"
                value={dataAquisicao}
                onChange={(e) => setDataAquisicao(e.target.value)}
                className="px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
              />
            </div>
            <button
              onClick={salvarDataAquisicao}
              disabled={!dataAquisicao || salvandoData}
              className="px-4 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {salvandoData ? "Salvando..." : "Salvar e recalcular"}
            </button>
          </div>
          <p className="text-xs text-[#0B1218]/55 mt-2">Se não informada, a referência padrão é a data de cadastro do ativo.</p>
        </section>

        {/* 3.3 — Evolução da posição */}
        <section className="border border-[#EFE7DC] rounded-xl p-5 mb-6">
          <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-3">Evolução do valor da posição</h2>
          {serieTicker.length === 0 ? (
            <p className="text-sm text-[#0B1218]/55">Ainda não há histórico suficiente para este ativo.</p>
          ) : (
            <GraficoEvolucao serie={serieTicker} />
          )}
        </section>

        {/* 3.5 — Registrar nova compra */}
        <section className="border border-[#EFE7DC] rounded-xl p-5 mb-6">
          <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-4">Registrar nova compra</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Data da operação</label>
              <input
                type="date"
                value={aporte.dataOperacao}
                onChange={(e) => setAporte((ant) => ({ ...ant, dataOperacao: e.target.value }))}
                className="w-full px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Quantidade de cotas</label>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={aporte.quantidade}
                onChange={(e) => setAporte((ant) => ({ ...ant, quantidade: e.target.value }))}
                className="w-full px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Preço unitário pago</label>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={aporte.precoUnitario}
                onChange={(e) => setAporte((ant) => ({ ...ant, precoUnitario: e.target.value }))}
                className="w-full px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">
                Valor total{" "}
                <span className="normal-case text-[#0B1218]/30 font-normal">(calculado automaticamente)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={aporte.valorAporte}
                onChange={(e) => setAporte((ant) => ({ ...ant, valorAporte: e.target.value }))}
                className="w-full px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={registrarAporte}
              disabled={aplicandoAporte}
              className="px-4 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {aplicandoAporte ? "Registrando..." : "Registrar compra"}
            </button>
            <button
              onClick={() => {
                setError("");
                setModalExclusaoAberto(true);
              }}
              disabled={excluindo}
              className="px-4 py-2 bg-[#E85C5C] text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {excluindo ? "Removendo..." : "Remover ativo"}
            </button>
          </div>
        </section>

        {/* 3.7 — Timeline */}
        <section className="border border-[#EFE7DC] rounded-xl p-5 mb-6">
          <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-4">Histórico do ativo</h2>
          {eventosTicker.length === 0 ? (
            <p className="text-sm text-[#0B1218]/55">Nenhuma movimentação registrada ainda.</p>
          ) : (
            <div className="relative pl-6 border-l-2 border-[#EFE7DC] space-y-5">
              {eventosTicker.map((evento, idx) => (
                <div key={evento.id ?? idx} className="relative">
                  <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-[#F56A2A] border-2 border-white" />
                  <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">
                    {TIPO_TIMELINE[evento.tipo] ?? evento.tipo} · {formatarData(evento.data)}
                  </p>
                  <p className="text-sm text-[#0B1218]/80 mt-0.5">{evento.descricao}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3.8 — Registrar venda ou troca */}
        <section className="border border-[#EFE7DC] rounded-xl p-5 mb-6">
          <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-4">Registrar venda ou troca de ativo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Para qual ativo foi o dinheiro?</label>
              <select
                value={movimentacao.ativoDestinoId}
                onChange={(e) => setMovimentacao((ant) => ({ ...ant, ativoDestinoId: e.target.value }))}
                className="w-full px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
              >
                <option value="">Selecione</option>
                {ativosDestino.map((item) => (
                  <option key={item.id} value={item.id}>{item.ticker} - {item.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Valor</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={movimentacao.valor}
                onChange={(e) => setMovimentacao((ant) => ({ ...ant, valor: e.target.value }))}
                className="w-full px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Data da movimentação</label>
              <input
                type="date"
                value={movimentacao.dataMovimentacao}
                onChange={(e) => setMovimentacao((ant) => ({ ...ant, dataMovimentacao: e.target.value }))}
                className="w-full px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Observação</label>
              <input
                type="text"
                value={movimentacao.observacao}
                onChange={(e) => setMovimentacao((ant) => ({ ...ant, observacao: e.target.value }))}
                className="w-full px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
                placeholder="Ex.: rotação para tese de crescimento"
              />
            </div>
          </div>
          <button
            onClick={vincularMovimentacao}
            disabled={vinculando}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            <ArrowRightLeft size={12} /> {vinculando ? "Vinculando..." : "Confirmar movimentação"}
          </button>

          <div className="mt-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 mb-3">Histórico de movimentações vinculadas</h3>
            {(ativo.movimentacoes || []).length === 0 && <p className="text-sm text-[#0B1218]/55">Nenhuma movimentação registrada ainda.</p>}
            {(ativo.movimentacoes || []).length > 0 && (
              <div className="space-y-2">
                {(ativo.movimentacoes || []).map((mov) => (
                  <div key={mov.id} className="border border-[#EFE7DC] p-3 rounded-xl text-sm text-[#0B1218]/80">
                    <p><strong>Data:</strong> {formatarData(mov.data_movimentacao) || mov.data_movimentacao}</p>
                    <p><strong>Valor:</strong> {moeda(mov.valor)}</p>
                    <p><strong>Origem:</strong> {mov.ativo_origem_id} | <strong>Destino:</strong> {mov.ativo_destino_id}</p>
                    {mov.observacao ? <p><strong>Obs:</strong> {mov.observacao}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3.9 — Modal de remoção */}
        {modalExclusaoAberto && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white border border-[#EFE7DC] rounded-xl p-5">
              <h3 className="font-['Sora'] text-sm font-bold uppercase tracking-widest mb-3">Remover este ativo da carteira</h3>
              <p className="text-xs text-[#0B1218]/65 mb-3">
                Informe o motivo da remoção para auditoria. Esta ação não poderá ser desfeita.
              </p>
              <textarea
                value={motivoExclusao}
                onChange={(e) => setMotivoExclusao(e.target.value)}
                rows={4}
                maxLength={280}
                className="w-full px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
                placeholder="Por que você está removendo este ativo? Ex.: vendi toda a posição"
              />
              <p className="text-[10px] uppercase tracking-widest text-[#0B1218]/45 mt-2">{motivoExclusao.trim().length}/280</p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalExclusaoAberto(false);
                    setMotivoExclusao("");
                  }}
                  className="px-4 py-2 border border-[#EFE7DC] bg-white text-[10px] font-bold uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={excluirAtivo}
                  disabled={excluindo || motivoExclusao.trim().length < 5}
                  className="px-4 py-2 bg-[#E85C5C] text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  {excluindo ? "Removendo..." : "Remover ativo"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const MetricaItem = ({ label, value, cor, sinal }) => (
  <div>
    <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest mb-1">{label}</p>
    <p
      className="font-['Sora'] text-base font-bold break-words"
      style={cor ? { color: cor } : undefined}
    >
      {sinal && value && !value.startsWith("-") && !value.startsWith("+") ? `+${value}` : value}
    </p>
  </div>
);
