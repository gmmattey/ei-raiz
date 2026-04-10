import React, { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, carteiraApi } from "../../cliente-api";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);

export default function DetalheAtivo() {
  const navigate = useNavigate();
  const { ticker } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ativo, setAtivo] = useState(null);
  const [categoria, setCategoria] = useState("acao");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const lista = await carteiraApi.listarAtivosCarteira();
        const ativoBase = lista.find((item) => item.ticker === ticker) ?? lista[0] ?? null;
        if (!ativoBase) {
          if (mounted) setAtivo(null);
          return;
        }
        const detalhe = await carteiraApi.obterDetalheCategoria(ativoBase.categoria);
        const selecionado = detalhe.ativos.find((item) => item.ticker === (ticker ?? ativoBase.ticker)) ?? ativoBase;
        if (mounted) {
          setAtivo(selecionado);
          setCategoria(detalhe.categoria);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        if (mounted) setError("Falha ao carregar detalhe do ativo.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate, ticker]);

  if (loading) return <p className="text-sm text-[#0B1218]/50">Carregando detalhe...</p>;
  if (error) return <p className="text-sm text-[#E85C5C]">{error}</p>;
  if (!ativo) return <p className="text-sm text-[#0B1218]/50">Ativo não encontrado.</p>;

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12 mb-12 md:mb-20">
          <div className="flex gap-4 md:gap-8 items-center">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-sm bg-[#F56A2A] text-white flex items-center justify-center">
              <TrendingUp size={40} />
            </div>
            <div>
              <h1 className="font-['Sora'] text-3xl md:text-5xl font-bold tracking-tighter">{ativo.ticker}</h1>
              <p className="text-[#0B1218]/40 text-sm md:text-lg font-medium">{ativo.nome}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 md:gap-12 w-full md:w-auto">
            <Info label="Categoria" value={categoria} />
            <Info label="Plataforma" value={ativo.plataforma} />
            <Info label="Valor Atual" value={moeda(ativo.valorAtual)} />
            <Info label="Retorno 12M" value={`${ativo.retorno12m.toFixed(2)}%`} />
          </div>
        </div>
      </div>
    </div>
  );
}

const Info = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest mb-2">{label}</p>
    <p className="font-['Sora'] text-base md:text-xl font-bold break-words">{value}</p>
  </div>
);
