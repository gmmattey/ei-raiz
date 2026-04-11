import React, { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Clock3, TrendingUp } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, carteiraApi } from "../../cliente-api";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);

const normalizarDataInput = (data) => {
  if (!data) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const construirPolyline = (serie, width = 560, height = 180) => {
  if (!serie || serie.length === 0) return "";
  const min = Math.min(...serie.map((p) => Number(p.valor ?? 0)));
  const max = Math.max(...serie.map((p) => Number(p.valor ?? 0)));
  const span = max - min || 1;
  return serie
    .map((p, idx) => {
      const x = (idx / Math.max(1, serie.length - 1)) * width;
      const y = height - ((Number(p.valor ?? 0) - min) / span) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
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
      setAtivo(detalhe);
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

  useEffect(() => {
    void carregar();
  }, [ticker]);

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
    } catch (err) {
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
      setError("Informe ao menos o valor do aporte.");
      return;
    }
    if (!window.confirm("Confirmar registro do aporte neste ativo?")) return;
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
      setSucesso(resposta.mensagem || "Aporte registrado com sucesso.");
      setAporte((anterior) => ({ ...anterior, valorAporte: "", quantidade: "", precoUnitario: "", observacao: "" }));
      await carregar();
    } catch {
      setError("Não foi possível registrar o aporte.");
    } finally {
      setAplicandoAporte(false);
    }
  };

  const excluirAtivo = async () => {
    if (!ativo?.id) return;
    const motivo = motivoExclusao.trim();
    if (motivo.length < 5) {
      setError("Motivo obrigatório para excluir o ativo.");
      return;
    }
    if (!window.confirm("Confirmar exclusão deste ativo? Essa ação não pode ser desfeita.")) return;
    setExcluindo(true);
    setError("");
    setSucesso("");
    try {
      const resposta = await carteiraApi.excluirAtivo(ativo.id, motivo);
      setSucesso(resposta.mensagem || "Ativo excluído com sucesso.");
      setModalExclusaoAberto(false);
      setMotivoExclusao("");
      navigate("/carteira?categoria=acao", { replace: true });
    } catch {
      setError("Não foi possível excluir o ativo.");
    } finally {
      setExcluindo(false);
    }
  };

  if (loading) return <p className="text-sm text-[#0B1218]/50">Carregando detalhe...</p>;
  if (error && !ativo) return <p className="text-sm text-[#E85C5C]">{error}</p>;
  if (!ativo) return <p className="text-sm text-[#0B1218]/50">Ativo não encontrado.</p>;

  const fonte = (ativo.fontePreco || ativo.fonte_preco || "nenhuma").toUpperCase();
  const status = (ativo.statusAtualizacao || ativo.status_atualizacao || "indisponivel").toUpperCase();
  const ultimaAtualizacao = ativo.ultimaAtualizacao || ativo.ultima_atualizacao;
  const benchmark = ativo.benchmarkDesdeAquisicao || ativo.benchmark_desde_aquisicao;
  const serieTicker = ativo.serieTicker || ativo.serie_ticker || [];
  const eventosTicker = ativo.eventosTicker || ativo.eventos_ticker || [];
  const polyTicker = construirPolyline(serieTicker);

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
          <div className="flex gap-6 items-center">
            <div className="w-16 h-16 rounded-sm bg-[#F56A2A] text-white flex items-center justify-center">
              <TrendingUp size={32} />
            </div>
            <div>
              <h1 className="font-['Sora'] text-4xl font-bold tracking-tighter">{ativo.ticker}</h1>
              <p className="text-[#0B1218]/40 text-sm font-medium">{ativo.nome}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#0B1218]/50 mt-2">{fonte} · {status}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/carteira?categoria=acao")}
            className="px-4 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-[10px] font-bold uppercase tracking-widest hover:bg-[#EFE7DC]"
          >
            Voltar para ações
          </button>
        </div>

        {error && <p className="text-sm text-[#E85C5C] mb-4">{error}</p>}
        {sucesso && <p className="text-sm text-[#6FCF97] mb-4">{sucesso}</p>}

        <section className="border border-[#EFE7DC] rounded-sm p-4 mb-6 bg-[#FAFAFA]">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Info label="Valor atual" value={moeda(ativo.valorAtual)} />
            <Info label="Participação" value={`${Number(ativo.participacao || 0).toFixed(2)}%`} />
            <Info label="Retorno" value={`${Number(ativo.retorno12m || 0).toFixed(2)}%`} />
            <Info label="Categoria" value={ativo.categoria} />
            <Info label="Plataforma" value={ativo.plataforma} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[#0B1218]/45 mt-3 flex items-center gap-2">
            <Clock3 size={12} /> última atualização: {ultimaAtualizacao ? new Date(ultimaAtualizacao).toLocaleString("pt-BR") : "sem timestamp"}
          </p>
        </section>

        <section className="border border-[#EFE7DC] rounded-sm p-4 mb-6">
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
          <p className="text-xs text-[#0B1218]/60 mt-2">Se não informada, a referência padrão é a data de cadastro do ativo.</p>
        </section>

        <section className="border border-[#EFE7DC] rounded-sm p-4 mb-6">
          <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-3">Comparativo desde aquisição</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Info label="Retorno ativo" value={`${Number(benchmark?.carteiraRetornoPeriodo ?? 0).toFixed(2)}%`} />
            <Info label="Retorno CDI" value={`${Number(benchmark?.cdiRetornoPeriodo ?? 0).toFixed(2)}%`} />
            <Info label="Excesso vs CDI" value={`${Number(benchmark?.excessoRetorno ?? 0).toFixed(2)}%`} />
          </div>
        </section>

        <section className="border border-[#EFE7DC] rounded-sm p-4 mb-6">
          <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-3">Operações da ação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Valor do aporte</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={aporte.valorAporte}
                onChange={(e) => setAporte((ant) => ({ ...ant, valorAporte: e.target.value }))}
                className="w-full px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Quantidade (opcional)</label>
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Preço unitário (opcional)</label>
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Data operação</label>
              <input
                type="date"
                value={aporte.dataOperacao}
                onChange={(e) => setAporte((ant) => ({ ...ant, dataOperacao: e.target.value }))}
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
              {aplicandoAporte ? "Registrando..." : "Registrar aporte"}
            </button>
            <button
              onClick={() => {
                setError("");
                setModalExclusaoAberto(true);
              }}
              disabled={excluindo}
              className="px-4 py-2 bg-[#E85C5C] text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {excluindo ? "Excluindo..." : "Excluir ação"}
            </button>
          </div>
        </section>

        <section className="border border-[#EFE7DC] rounded-sm p-4 mb-6">
          <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-3">Evolução da posição ({ativo.ticker})</h2>
          {serieTicker.length === 0 ? (
            <p className="text-sm text-[#0B1218]/55">Sem série suficiente para este ativo.</p>
          ) : (
            <>
              <svg viewBox="0 0 560 180" className="w-full h-[220px] bg-white">
                <polyline points={polyTicker} fill="none" stroke="#F56A2A" strokeWidth="2.4" />
              </svg>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Info label="Pontos" value={`${serieTicker.length}`} />
                <Info label="Menor valor" value={moeda(Math.min(...serieTicker.map((p) => Number(p.valor ?? 0))))} />
                <Info label="Maior valor" value={moeda(Math.max(...serieTicker.map((p) => Number(p.valor ?? 0))))} />
              </div>
            </>
          )}
        </section>

        <section className="border border-[#EFE7DC] rounded-sm p-4 mb-6">
          <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-3">Vincular movimentação (troca de ativo)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 block mb-1">Ativo destino</label>
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
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45 mb-2">Histórico de movimentações vinculadas</h3>
            {(ativo.movimentacoes || []).length === 0 && <p className="text-sm text-[#0B1218]/55">Nenhuma movimentação vinculada.</p>}
            {(ativo.movimentacoes || []).length > 0 && (
              <div className="space-y-2">
                {(ativo.movimentacoes || []).map((mov) => (
                  <div key={mov.id} className="border border-[#EFE7DC] p-3 rounded-sm text-sm text-[#0B1218]/80">
                    <p><strong>Data:</strong> {mov.data_movimentacao}</p>
                    <p><strong>Valor:</strong> {moeda(mov.valor)}</p>
                    <p><strong>Origem:</strong> {mov.ativo_origem_id} | <strong>Destino:</strong> {mov.ativo_destino_id}</p>
                    {mov.observacao ? <p><strong>Obs:</strong> {mov.observacao}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border border-[#EFE7DC] rounded-sm p-4 mb-6">
          <h2 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-3">Timeline do ativo</h2>
          {eventosTicker.length === 0 && <p className="text-sm text-[#0B1218]/55">Sem eventos recentes para este ativo.</p>}
          {eventosTicker.length > 0 && (
            <div className="space-y-2">
              {eventosTicker.map((evento) => (
                <div key={evento.id} className="border border-[#EFE7DC] p-3 rounded-sm text-sm text-[#0B1218]/80">
                  <p className="text-[10px] uppercase tracking-widest text-[#0B1218]/45">{evento.tipo}</p>
                  <p className="font-semibold">{evento.descricao}</p>
                  <p className="text-xs text-[#0B1218]/55">{new Date(evento.data).toLocaleString("pt-BR")}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {modalExclusaoAberto && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white border border-[#EFE7DC] rounded-sm p-5">
              <h3 className="font-['Sora'] text-sm font-bold uppercase tracking-widest mb-3">Confirmar exclusão da ação</h3>
              <p className="text-xs text-[#0B1218]/65 mb-3">
                Informe o motivo da exclusão para auditoria. Esta ação não poderá ser desfeita.
              </p>
              <textarea
                value={motivoExclusao}
                onChange={(e) => setMotivoExclusao(e.target.value)}
                rows={4}
                maxLength={280}
                className="w-full px-3 py-2 border border-[#EFE7DC] bg-[#FAFAFA] text-sm focus:outline-none focus:border-[#F56A2A]"
                placeholder="Motivo da exclusão (mínimo 5 caracteres)"
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
                  {excluindo ? "Excluindo..." : "Confirmar exclusão"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Info = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest mb-1">{label}</p>
    <p className="font-['Sora'] text-base font-bold break-words">{value}</p>
  </div>
);
