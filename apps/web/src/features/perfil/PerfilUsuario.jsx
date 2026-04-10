import React, { useEffect, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { ApiError, perfilApi } from "../../cliente-api";
import { useNavigate } from "react-router-dom";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plataformas, setPlataformas] = useState([]);
  const [perfil, setPerfil] = useState({
    rendaMensal: 0,
    aporteMensal: 0,
    horizonte: "longo_prazo",
    perfilRisco: "moderado",
    objetivo: "independencia_financeira",
    maturidade: 3,
  });

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        const [perfilApiData, plataformasData] = await Promise.all([perfilApi.obterPerfil(), perfilApi.listarPlataformas()]);
        if (!ativo) return;
        if (perfilApiData) {
          setPerfil({
            rendaMensal: perfilApiData.rendaMensal,
            aporteMensal: perfilApiData.aporteMensal,
            horizonte: perfilApiData.horizonte,
            perfilRisco: perfilApiData.perfilRisco,
            objetivo: perfilApiData.objetivo,
            maturidade: perfilApiData.maturidade,
          });
        }
        setPlataformas(plataformasData);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        if (ativo) setError("Falha ao carregar perfil.");
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [navigate]);

  const salvar = async () => {
    try {
      setSaving(true);
      setError("");
      await perfilApi.salvarPerfil({
        rendaMensal: Number.isFinite(perfil.rendaMensal) ? Math.max(0, Number(perfil.rendaMensal)) : 0,
        aporteMensal: Number.isFinite(perfil.aporteMensal) ? Math.max(0, Number(perfil.aporteMensal)) : 0,
        horizonte: (perfil.horizonte || "").trim() || "Nao informado",
        perfilRisco: (perfil.perfilRisco || "").trim() || "moderado",
        objetivo: (perfil.objetivo || "").trim() || "Nao informado",
        maturidade: Math.max(1, Math.min(5, Number(perfil.maturidade) || 1)),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/", { replace: true });
        return;
      }
      setError("Falha ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <div className="w-full max-w-[896px]">
        <section className="flex flex-col md:flex-row items-center gap-8 mb-16">
          <div className="flex-1">
            <h1 className="font-['Sora'] text-4xl font-bold tracking-tight">Meu Perfil Financeiro</h1>
            <p className="text-[#0B1218]/40 text-sm font-medium mt-2">Dados persistidos no serviço de perfil.</p>
          </div>
          <button onClick={salvar} className="flex items-center gap-2 px-6 py-2 bg-[#F56A2A] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#d95a20] transition-all rounded-sm">
            {saving ? <Save className="animate-spin" size={14} /> : <Save size={14} />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </section>

        {loading && <p className="text-sm text-[#0B1218]/50">Carregando perfil...</p>}
        {error && <p className="text-sm text-[#E85C5C] mb-4">{error}</p>}

        {!loading && (
          <div className="space-y-6">
            <Field label="Renda mensal" value={perfil.rendaMensal} onChange={(v) => setPerfil((p) => ({ ...p, rendaMensal: Number(v) }))} type="number" currency />
            <Field label="Aporte mensal" value={perfil.aporteMensal} onChange={(v) => setPerfil((p) => ({ ...p, aporteMensal: Number(v) }))} type="number" currency />
            <Field label="Horizonte" value={perfil.horizonte} onChange={(v) => setPerfil((p) => ({ ...p, horizonte: v }))} />
            <Field label="Perfil de risco" value={perfil.perfilRisco} onChange={(v) => setPerfil((p) => ({ ...p, perfilRisco: v }))} />
            <Field label="Objetivo" value={perfil.objetivo} onChange={(v) => setPerfil((p) => ({ ...p, objetivo: v }))} />
            <Field label="Maturidade (1-5)" value={perfil.maturidade} onChange={(v) => setPerfil((p) => ({ ...p, maturidade: Number(v) }))} type="number" />

            <div className="mt-10 p-8 bg-[#F5F0EB] rounded-sm border-l-4 border-[#F56A2A]">
              <div className="flex items-start gap-4">
                <ShieldCheck className="text-[#F56A2A] shrink-0" size={24} />
                <div>
                  <h4 className="font-['Sora'] text-sm font-bold text-[#0B1218] mb-2 uppercase tracking-tight">Plataformas Vinculadas</h4>
                  {plataformas.length === 0 && <p className="text-xs text-[#0B1218]/60">Sem plataformas vinculadas.</p>}
                  {plataformas.map((plataforma) => (
                    <p key={plataforma.id} className="text-xs text-[#0B1218]/60">
                      {plataforma.nome} • último import: {plataforma.ultimoImport ?? "nunca"} • {plataforma.status}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, value, onChange, type = "text", currency = false }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-b border-[#EFE7DC] py-3 font-['Inter'] text-sm text-[#0B1218] focus:outline-none focus:border-[#F56A2A] transition-colors"
    />
    {type === "number" && currency && <p className="text-[10px] text-[#0B1218]/40">{moeda(Number(value || 0))}</p>}
  </div>
);
