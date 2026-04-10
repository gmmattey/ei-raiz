import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, carteiraApi } from "../../cliente-api";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumo, setResumo] = useState(null);
  const [ativos, setAtivos] = useState([]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [resumoData, ativosData] = await Promise.all([
          carteiraApi.obterResumoCarteira(),
          carteiraApi.listarAtivosCarteira(),
        ]);
        if (!ativo) return;
        setResumo(resumoData);
        setAtivos(ativosData);
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
  }, [navigate]);

  const topAtivos = useMemo(() => [...ativos].sort((a, b) => b.valorAtual - a.valorAtual).slice(0, 3), [ativos]);
  const semBase = !loading && !error && (resumo?.quantidadeAtivos ?? 0) === 0;

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <div className="w-full">
        <div className="mb-10">
          <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-[#0B1218]/40 text-sm font-medium">Visao consolidada da sua carteira real.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <MetricCard label="Patrimonio" value={moeda(resumo?.patrimonioTotal)} />
              <MetricCard label="Score" value={`${resumo?.score ?? 0}/100`} />
              <MetricCard label="Retorno 12M" value={`${resumo?.retorno12m?.toFixed?.(2) ?? "0.00"}%`} />
              <MetricCard label="Ativos" value={`${resumo?.quantidadeAtivos ?? 0}`} />
            </div>

            <section className="border border-[#EFE7DC] rounded-sm overflow-hidden">
              <div className="p-6 border-b border-[#EFE7DC] bg-[#FAFAFA]">
                <h3 className="font-['Sora'] text-xs font-bold uppercase tracking-widest text-[#0B1218]">Maiores posicoes</h3>
              </div>
              {topAtivos.map((item) => (
                <div key={item.id} className="p-6 border-b border-[#EFE7DC]/50 flex items-center justify-between">
                  <div>
                    <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">{item.ticker}</p>
                    <p className="text-[10px] text-[#0B1218]/40 font-bold uppercase tracking-tight">{item.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#0B1218]">{moeda(item.valorAtual)}</p>
                    <p className="text-[10px] text-[#0B1218]/35 font-bold uppercase">{item.participacao.toFixed(2)}%</p>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const MetricCard = ({ label, value }) => (
  <div className="bg-white border border-[#EFE7DC] p-6 rounded-sm">
    <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest mb-2">{label}</p>
    <h3 className="font-['Sora'] text-2xl font-bold text-[#0B1218]">{value}</h3>
  </div>
);
