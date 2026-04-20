import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, patrimonioApi, perfilApi } from "../../cliente-api";
import { invalidarCacheUsuario } from "../../utils/cache";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);
const parseCurrencyInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
};
const formatCurrencyInput = (value) => moeda(Number(value || 0));

const adaptarAporte = (a) => ({
  id: a.id,
  valor: Number(a.valorBrl ?? 0),
  dataAporte: a.data,
  observacao: a.descricao ?? "",
  origem: a.origem ?? "manual",
});

const calcularResumoUltimos6m = (itens) => {
  const hoje = new Date();
  const corte = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
  const mesesSet = new Set();
  let valorTotal = 0;
  for (const a of itens) {
    const d = new Date(a.dataAporte);
    if (Number.isNaN(d.getTime())) continue;
    if (d < corte) continue;
    mesesSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    valorTotal += Number(a.valor ?? 0);
  }
  return { mesesDistintos6m: mesesSet.size, valorTotal6m: valorTotal };
};

export default function Aportes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState("");
  const [resumo, setResumo] = useState(null);
  const [aporteMensal, setAporteMensal] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [aportesReais, setAportesReais] = useState([]);
  const [resumoAportes, setResumoAportes] = useState(null);
  const [novoValor, setNovoValor] = useState(0);
  const [novaData, setNovaData] = useState(() => new Date().toISOString().slice(0, 10));
  const [novaObservacao, setNovaObservacao] = useState("");
  const [registrandoAporte, setRegistrandoAporte] = useState(false);
  const [feedbackAporte, setFeedbackAporte] = useState("");

  const recarregarAportes = React.useCallback(async () => {
    try {
      const resp = await patrimonioApi.listarAportes();
      const adaptados = (resp?.itens ?? []).map(adaptarAporte).slice(0, 50);
      setAportesReais(adaptados);
      setResumoAportes(calcularResumoUltimos6m(adaptados));
    } catch {
      // silencia — lista vazia é aceitável
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [dados, perfil] = await Promise.all([
          patrimonioApi.obterResumo(),
          perfilApi.obterPerfil().catch(() => null),
        ]);
        if (!ativo) return;
        setResumo({
          quantidadeAtivos: dados?.quantidadeItens ?? 0,
          patrimonioLiquido: dados?.patrimonioLiquidoBrl ?? 0,
          valorInvestimentos: dados?.patrimonioBrutoBrl ?? 0,
        });
        setAporteMensal(perfil?.aporteMensalBrl ?? 0);
        await recarregarAportes();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        if (ativo) setError("Nao foi possivel carregar a tela de aportes agora.");
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [navigate, recarregarAportes]);

  const registrarAporte = async () => {
    const valorNumerico = Math.max(0, Number(novoValor) || 0);
    if (valorNumerico <= 0) {
      setFeedbackAporte("Informe um valor maior que zero.");
      return;
    }
    if (!novaData) {
      setFeedbackAporte("Informe a data do aporte.");
      return;
    }
    try {
      setRegistrandoAporte(true);
      setFeedbackAporte("");
      await patrimonioApi.criarAporte({
        tipo: "aporte",
        valorBrl: valorNumerico,
        data: novaData,
        descricao: novaObservacao.trim() || null,
      });
      setNovoValor(0);
      setNovaObservacao("");
      setFeedbackAporte("Aporte registrado.");
      await recarregarAportes();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/", { replace: true });
        return;
      }
      setFeedbackAporte("Falha ao registrar o aporte.");
    } finally {
      setRegistrandoAporte(false);
    }
  };

  const excluirAporte = async (id) => {
    try {
      await patrimonioApi.removerAporte(id);
      await recarregarAportes();
    } catch {
      // mantém lista; UI mostra estado atual na próxima recarga
    }
  };

  const salvarAporteMensal = async () => {
    try {
      setSalvando(true);
      setFeedback("");
      await perfilApi.atualizarPerfil({
        aporteMensalBrl: Math.max(0, Number(aporteMensal) || 0),
      });
      invalidarCacheUsuario();
      setFeedback("Meta de aporte salva com sucesso.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/", { replace: true });
        return;
      }
      setFeedback("Não foi possível salvar a meta agora.");
    } finally {
      setSalvando(false);
    }
  };

  const semBase = !loading && !error && (resumo?.quantidadeAtivos ?? 0) === 0;

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <div className="w-full">
        <div className="mb-10">
          <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-2">Aportes</h1>
          <p className="text-[#0B1218]/40 text-sm font-medium">Distribuicao de novos aportes baseada na sua carteira real.</p>
        </div>

        {loading && <p className="text-sm text-[#0B1218]/50">Carregando aportes...</p>}
        {error && <p className="text-sm text-[#E85C5C]">{error}</p>}

        {semBase && (
          <div className="p-8 border border-[#EFE7DC] rounded-xl text-center">
            <p className="text-sm text-[#0B1218]/60">Sem carteira importada, ainda não há recomendação real de aporte.</p>
            <button
              onClick={() => navigate("/home", { state: { openQuickModal: "quick_importar" } })}
              className="mt-4 px-5 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all rounded-xl"
            >
              Importar primeiro extrato
            </button>
          </div>
        )}

        {!loading && !error && !semBase && (
          <div className="p-8 border border-[#EFE7DC] rounded-xl space-y-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40 mb-3">Base atual</p>
            <p className="text-sm text-[#0B1218]/70 mb-2">Patrimonio: <span className="font-semibold text-[#0B1218]">{moeda(resumo?.patrimonioLiquido ?? resumo?.valorInvestimentos)}</span></p>
            <p className="text-sm text-[#0B1218]/70 mb-6">Ativos: <span className="font-semibold text-[#0B1218]">{resumo?.quantidadeAtivos ?? 0}</span></p>
            <div className="border border-[#EFE7DC] rounded-xl p-5 bg-[#FAFAFA]">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40 mb-2">Meta de aporte mensal</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrencyInput(aporteMensal)}
                onChange={(e) => setAporteMensal(parseCurrencyInput(e.target.value))}
                className="w-full md:w-64 bg-white border border-[#EFE7DC] px-4 py-3 text-sm focus:outline-none focus:border-[#F56A2A] rounded-xl"
              />
              <p className="text-xs text-[#0B1218]/60 mt-2">A meta é usada pelo diagnóstico para medir consistência de aportes.</p>
              <button
                onClick={salvarAporteMensal}
                disabled={salvando}
                className="mt-4 px-5 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 rounded-xl"
              >
                {salvando ? "Salvando..." : "Salvar meta"}
              </button>
              {feedback && <p className={`mt-3 text-xs font-semibold ${feedback.includes("sucesso") ? "text-[#6FCF97]" : "text-[#E85C5C]"}`}>{feedback}</p>}
            </div>
            <p className="text-sm text-[#0B1218]/60">
              Use a meta mensal e os insights da carteira para orientar o próximo aporte com base em dados reais.
            </p>
            <button
              onClick={() => navigate("/insights")}
              className="px-5 py-2 border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest hover:bg-[#FAFAFA] transition-all rounded-xl"
            >
              Ver diagnóstico da carteira
            </button>
          </div>
        )}

        {!loading && !error && !semBase && (
          <div className="mt-8 p-8 border border-[#EFE7DC] rounded-xl space-y-6">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">Aportes registrados</p>
              {resumoAportes && (
                <p className="text-xs text-[#0B1218]/60">
                  {resumoAportes.mesesDistintos6m} mes(es) com aporte nos últimos 6 meses · {moeda(resumoAportes.valorTotal6m)} aportados
                </p>
              )}
            </div>

            <div className="border border-[#EFE7DC] rounded-xl p-5 bg-[#FAFAFA] space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">Novo aporte</p>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3">
                <div>
                  <label className="block text-xs text-[#0B1218]/60 mb-1">Valor</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrencyInput(novoValor)}
                    onChange={(e) => setNovoValor(parseCurrencyInput(e.target.value))}
                    className="w-full bg-white border border-[#EFE7DC] px-4 py-3 text-sm focus:outline-none focus:border-[#F56A2A] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#0B1218]/60 mb-1">Data</label>
                  <input
                    type="date"
                    value={novaData}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full bg-white border border-[#EFE7DC] px-4 py-3 text-sm focus:outline-none focus:border-[#F56A2A] rounded-xl"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={registrarAporte}
                    disabled={registrandoAporte}
                    className="w-full md:w-auto px-5 py-3 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 rounded-xl"
                  >
                    {registrandoAporte ? "Registrando..." : "Registrar"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#0B1218]/60 mb-1">Observação (opcional)</label>
                <input
                  type="text"
                  value={novaObservacao}
                  onChange={(e) => setNovaObservacao(e.target.value)}
                  placeholder="ex.: aporte mensal em tesouro"
                  maxLength={200}
                  className="w-full bg-white border border-[#EFE7DC] px-4 py-3 text-sm focus:outline-none focus:border-[#F56A2A] rounded-xl"
                />
              </div>
              {feedbackAporte && (
                <p className={`text-xs font-semibold ${feedbackAporte === "Aporte registrado." ? "text-[#6FCF97]" : "text-[#E85C5C]"}`}>
                  {feedbackAporte}
                </p>
              )}
            </div>

            {aportesReais.length === 0 ? (
              <p className="text-sm text-[#0B1218]/50">
                Nenhum aporte registrado ainda. Registros reais substituem o sinal indireto de crescimento patrimonial no diagnóstico.
              </p>
            ) : (
              <div className="divide-y divide-[#EFE7DC]">
                {aportesReais.map((a) => (
                  <div key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0B1218]">{moeda(a.valor)}</p>
                      <p className="text-xs text-[#0B1218]/50 truncate">
                        {new Date(a.dataAporte).toLocaleDateString("pt-BR")} · {a.origem}
                        {a.observacao ? ` · ${a.observacao}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => excluirAporte(a.id)}
                      className="text-[10px] font-bold uppercase tracking-widest text-[#E85C5C] hover:text-[#c04a4a] transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
