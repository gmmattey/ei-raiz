import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, carteiraApi, perfilApi } from "../../cliente-api";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);
const parseCurrencyInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
};
const formatCurrencyInput = (value) => moeda(Number(value || 0));

export default function Aportes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState("");
  const [resumo, setResumo] = useState(null);
  const [aporteMensal, setAporteMensal] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [dados, perfil] = await Promise.all([
          carteiraApi.obterResumoCarteira(),
          perfilApi.obterPerfil(),
        ]);
        if (!ativo) return;
        setResumo(dados);
        setAporteMensal(perfil?.aporteMensal ?? 0);
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
  }, [navigate]);

  const salvarAporteMensal = async () => {
    try {
      setSalvando(true);
      setFeedback("");
      const perfilAtual = await perfilApi.obterPerfil();
      await perfilApi.salvarPerfil({
        rendaMensal: perfilAtual?.rendaMensal ?? 0,
        aporteMensal: Math.max(0, Number(aporteMensal) || 0),
        horizonte: perfilAtual?.horizonte ?? "longo_prazo",
        perfilRisco: perfilAtual?.perfilRisco ?? "moderado",
        objetivo: perfilAtual?.objetivo ?? "independencia_financeira",
        maturidade: Math.max(1, Math.min(5, perfilAtual?.maturidade ?? 3)),
      });
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
          <div className="p-8 border border-[#EFE7DC] rounded-sm text-center">
            <p className="text-sm text-[#0B1218]/60">Sem carteira importada, ainda não há recomendação real de aporte.</p>
            <button
              onClick={() => navigate("/home", { state: { openQuickModal: "quick_importar" } })}
              className="mt-4 px-5 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              Importar primeiro extrato
            </button>
          </div>
        )}

        {!loading && !error && !semBase && (
          <div className="p-8 border border-[#EFE7DC] rounded-sm space-y-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40 mb-3">Base atual</p>
            <p className="text-sm text-[#0B1218]/70 mb-2">Patrimonio: <span className="font-semibold text-[#0B1218]">{moeda(resumo?.patrimonioTotal)}</span></p>
            <p className="text-sm text-[#0B1218]/70 mb-6">Ativos: <span className="font-semibold text-[#0B1218]">{resumo?.quantidadeAtivos ?? 0}</span></p>
            <div className="border border-[#EFE7DC] rounded-sm p-5 bg-[#FAFAFA]">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40 mb-2">Meta de aporte mensal</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrencyInput(aporteMensal)}
                onChange={(e) => setAporteMensal(parseCurrencyInput(e.target.value))}
                className="w-full md:w-64 bg-white border border-[#EFE7DC] px-4 py-3 text-sm focus:outline-none focus:border-[#F56A2A]"
              />
              <p className="text-xs text-[#0B1218]/60 mt-2">A meta é usada pelo diagnóstico para medir consistência de aportes.</p>
              <button
                onClick={salvarAporteMensal}
                disabled={salvando}
                className="mt-4 px-5 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50"
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
              className="px-5 py-2 border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest hover:bg-[#FAFAFA] transition-all"
            >
              Ver diagnóstico da carteira
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
