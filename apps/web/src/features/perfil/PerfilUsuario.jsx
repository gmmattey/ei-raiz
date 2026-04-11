import React, { useEffect, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { ApiError, perfilApi, telemetriaApi } from "../../cliente-api";
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
    gastoMensal: 0,
    aporteMensal: 0,
    reservaCaixa: 0,
    horizonte: "longo_prazo",
    perfilRisco: "moderado",
    objetivo: "independencia_financeira",
    frequenciaAporte: "mensal",
    experienciaInvestimentos: "intermediario",
    toleranciaRiscoReal: "media",
    maturidade: 3,
  });
  const [contexto, setContexto] = useState({
    objetivoPrincipal: "",
    objetivosSecundarios: [],
    horizonte: "longo",
    dependentes: false,
    faixaEtaria: "",
    rendaMensal: 0,
    gastoMensal: 0,
    aporteMensal: 0,
    perfilRiscoDeclarado: "",
    maturidadeInvestidor: 3,
    frequenciaAporte: "mensal",
    experienciaInvestimentos: "intermediario",
    toleranciaRiscoReal: "media",
    patrimonioExterno: {
      imoveis: [],
      veiculos: [],
      caixaDisponivel: 0,
    },
    dividas: [],
  });

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        const [perfilApiData, plataformasData, contextoApiData] = await Promise.all([
          perfilApi.obterPerfil(),
          perfilApi.listarPlataformas(),
          perfilApi.obterContextoFinanceiro(),
        ]);
        if (!ativo) return;
        if (perfilApiData) {
          setPerfil({
            rendaMensal: perfilApiData.rendaMensal,
            gastoMensal: perfilApiData.gastoMensal ?? 0,
            aporteMensal: perfilApiData.aporteMensal,
            reservaCaixa: perfilApiData.reservaCaixa ?? 0,
            horizonte: perfilApiData.horizonte,
            perfilRisco: perfilApiData.perfilRisco,
            objetivo: perfilApiData.objetivo,
            frequenciaAporte: perfilApiData.frequenciaAporte || "mensal",
            experienciaInvestimentos: perfilApiData.experienciaInvestimentos || "intermediario",
            toleranciaRiscoReal: perfilApiData.toleranciaRiscoReal || "media",
            maturidade: perfilApiData.maturidade,
          });
        }
        if (contextoApiData) {
          setContexto({
            ...contexto,
            ...contextoApiData,
            patrimonioExterno: {
              imoveis: contextoApiData.patrimonioExterno?.imoveis ?? [],
              veiculos: contextoApiData.patrimonioExterno?.veiculos ?? [],
              caixaDisponivel: contextoApiData.patrimonioExterno?.caixaDisponivel ?? 0,
            },
            dividas: contextoApiData.dividas ?? [],
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
        gastoMensal: Number.isFinite(perfil.gastoMensal) ? Math.max(0, Number(perfil.gastoMensal)) : 0,
        aporteMensal: Number.isFinite(perfil.aporteMensal) ? Math.max(0, Number(perfil.aporteMensal)) : 0,
        reservaCaixa: Number.isFinite(perfil.reservaCaixa) ? Math.max(0, Number(perfil.reservaCaixa)) : 0,
        horizonte: (perfil.horizonte || "").trim() || "Nao informado",
        perfilRisco: (perfil.perfilRisco || "").trim() || "moderado",
        objetivo: (perfil.objetivo || "").trim() || "Nao informado",
        frequenciaAporte: (perfil.frequenciaAporte || "").trim() || "mensal",
        experienciaInvestimentos: (perfil.experienciaInvestimentos || "").trim() || "intermediario",
        toleranciaRiscoReal: (perfil.toleranciaRiscoReal || "").trim() || "media",
        maturidade: Math.max(1, Math.min(5, Number(perfil.maturidade) || 1)),
      });
      await perfilApi.salvarContextoFinanceiro({
        ...contexto,
        rendaMensal: Number.isFinite(contexto.rendaMensal) ? Math.max(0, Number(contexto.rendaMensal)) : 0,
        gastoMensal: Number.isFinite(contexto.gastoMensal) ? Math.max(0, Number(contexto.gastoMensal)) : 0,
        aporteMensal: Number.isFinite(contexto.aporteMensal) ? Math.max(0, Number(contexto.aporteMensal)) : 0,
        maturidadeInvestidor: Math.max(1, Math.min(5, Number(contexto.maturidadeInvestidor) || 1)),
        patrimonioExterno: {
          imoveis: contexto.patrimonioExterno.imoveis.map((item) => ({
            ...item,
            valorEstimado: Number.isFinite(item.valorEstimado) ? item.valorEstimado : 0,
            saldoFinanciamento: Number.isFinite(item.saldoFinanciamento) ? item.saldoFinanciamento : 0,
          })),
          veiculos: contexto.patrimonioExterno.veiculos.map((item) => ({
            ...item,
            valorEstimado: Number.isFinite(item.valorEstimado) ? item.valorEstimado : 0,
          })),
          caixaDisponivel: Number.isFinite(contexto.patrimonioExterno.caixaDisponivel) ? contexto.patrimonioExterno.caixaDisponivel : 0,
        },
        dividas: contexto.dividas.map((item) => ({
          ...item,
          saldoDevedor: Number.isFinite(item.saldoDevedor) ? item.saldoDevedor : 0,
          parcelaMensal: Number.isFinite(item.parcelaMensal) ? item.parcelaMensal : 0,
        })),
      });
      await telemetriaApi.registrarEventoTelemetria("profile_completed", { origem: "perfil_usuario" });
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
            <Field label="Gasto mensal" value={perfil.gastoMensal} onChange={(v) => setPerfil((p) => ({ ...p, gastoMensal: Number(v) }))} type="number" currency />
            <Field label="Aporte mensal" value={perfil.aporteMensal} onChange={(v) => setPerfil((p) => ({ ...p, aporteMensal: Number(v) }))} type="number" currency />
            <Field label="Reserva de caixa" value={perfil.reservaCaixa} onChange={(v) => setPerfil((p) => ({ ...p, reservaCaixa: Number(v) }))} type="number" currency />
            <Field label="Horizonte" value={perfil.horizonte} onChange={(v) => setPerfil((p) => ({ ...p, horizonte: v }))} />
            <Field label="Perfil de risco" value={perfil.perfilRisco} onChange={(v) => setPerfil((p) => ({ ...p, perfilRisco: v }))} />
            <Field label="Objetivo" value={perfil.objetivo} onChange={(v) => setPerfil((p) => ({ ...p, objetivo: v }))} />
            <Field label="Frequência de aporte" value={perfil.frequenciaAporte} onChange={(v) => setPerfil((p) => ({ ...p, frequenciaAporte: v }))} />
            <Field label="Experiência com investimentos" value={perfil.experienciaInvestimentos} onChange={(v) => setPerfil((p) => ({ ...p, experienciaInvestimentos: v }))} />
            <Field label="Tolerância a risco real" value={perfil.toleranciaRiscoReal} onChange={(v) => setPerfil((p) => ({ ...p, toleranciaRiscoReal: v }))} />
            <Field label="Maturidade (1-5)" value={perfil.maturidade} onChange={(v) => setPerfil((p) => ({ ...p, maturidade: Number(v) }))} type="number" />

            <div className="mt-10 p-8 border border-[#EFE7DC] rounded-sm">
              <h4 className="font-['Sora'] text-sm font-bold text-[#0B1218] mb-4 uppercase tracking-tight">Contexto financeiro expandido</h4>
              <div className="space-y-4">
                <Field label="Objetivo principal" value={contexto.objetivoPrincipal || ""} onChange={(v) => setContexto((c) => ({ ...c, objetivoPrincipal: v }))} />
                <Field label="Faixa etária" value={contexto.faixaEtaria || ""} onChange={(v) => setContexto((c) => ({ ...c, faixaEtaria: v }))} />
                <Field label="Renda mensal (contexto)" value={contexto.rendaMensal || 0} onChange={(v) => setContexto((c) => ({ ...c, rendaMensal: Number(v) }))} type="number" currency />
                <Field label="Gasto mensal (contexto)" value={contexto.gastoMensal || 0} onChange={(v) => setContexto((c) => ({ ...c, gastoMensal: Number(v) }))} type="number" currency />
                <Field label="Aporte mensal (contexto)" value={contexto.aporteMensal || 0} onChange={(v) => setContexto((c) => ({ ...c, aporteMensal: Number(v) }))} type="number" currency />
              </div>
            </div>

            <IncrementalSection
              title="Imóveis"
              items={contexto.patrimonioExterno.imoveis}
              onAdd={() =>
                setContexto((c) => ({
                  ...c,
                  patrimonioExterno: {
                    ...c.patrimonioExterno,
                    imoveis: [...c.patrimonioExterno.imoveis, { id: crypto.randomUUID(), tipo: "", valorEstimado: 0, saldoFinanciamento: 0, geraRenda: false }],
                  },
                }))
              }
              onRemove={(id) =>
                setContexto((c) => ({
                  ...c,
                  patrimonioExterno: {
                    ...c.patrimonioExterno,
                    imoveis: c.patrimonioExterno.imoveis.filter((item) => item.id !== id),
                  },
                }))
              }
              renderItem={(item) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Tipo" value={item.tipo} onChange={(v) => updateImovel(contexto, setContexto, item.id, { tipo: v })} />
                  <Field label="Valor estimado" value={item.valorEstimado} onChange={(v) => updateImovel(contexto, setContexto, item.id, { valorEstimado: Number(v) })} type="number" currency />
                  <Field label="Saldo financiamento" value={item.saldoFinanciamento || 0} onChange={(v) => updateImovel(contexto, setContexto, item.id, { saldoFinanciamento: Number(v) })} type="number" currency />
                </div>
              )}
            />

            <IncrementalSection
              title="Veículos"
              items={contexto.patrimonioExterno.veiculos}
              onAdd={() =>
                setContexto((c) => ({
                  ...c,
                  patrimonioExterno: {
                    ...c.patrimonioExterno,
                    veiculos: [...c.patrimonioExterno.veiculos, { id: crypto.randomUUID(), tipo: "", valorEstimado: 0, quitado: false }],
                  },
                }))
              }
              onRemove={(id) =>
                setContexto((c) => ({
                  ...c,
                  patrimonioExterno: {
                    ...c.patrimonioExterno,
                    veiculos: c.patrimonioExterno.veiculos.filter((item) => item.id !== id),
                  },
                }))
              }
              renderItem={(item) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Tipo" value={item.tipo} onChange={(v) => updateVeiculo(contexto, setContexto, item.id, { tipo: v })} />
                  <Field label="Valor estimado" value={item.valorEstimado} onChange={(v) => updateVeiculo(contexto, setContexto, item.id, { valorEstimado: Number(v) })} type="number" currency />
                </div>
              )}
            />

            <IncrementalSection
              title="Dívidas"
              items={contexto.dividas}
              onAdd={() =>
                setContexto((c) => ({
                  ...c,
                  dividas: [...c.dividas, { id: crypto.randomUUID(), tipo: "", saldoDevedor: 0, parcelaMensal: 0 }],
                }))
              }
              onRemove={(id) =>
                setContexto((c) => ({
                  ...c,
                  dividas: c.dividas.filter((item) => item.id !== id),
                }))
              }
              renderItem={(item) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Tipo" value={item.tipo} onChange={(v) => updateDivida(contexto, setContexto, item.id, { tipo: v })} />
                  <Field label="Saldo devedor" value={item.saldoDevedor} onChange={(v) => updateDivida(contexto, setContexto, item.id, { saldoDevedor: Number(v) })} type="number" currency />
                  <Field label="Parcela mensal" value={item.parcelaMensal || 0} onChange={(v) => updateDivida(contexto, setContexto, item.id, { parcelaMensal: Number(v) })} type="number" currency />
                </div>
              )}
            />

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

const IncrementalSection = ({ title, items, onAdd, onRemove, renderItem }) => (
  <div className="mt-6 p-6 border border-[#EFE7DC] rounded-sm">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-['Sora'] text-sm font-bold text-[#0B1218] uppercase tracking-tight">{title}</h4>
      <button type="button" onClick={onAdd} className="text-[10px] font-bold uppercase tracking-widest text-[#F56A2A]">
        Adicionar
      </button>
    </div>
    {items.length === 0 && <p className="text-xs text-[#0B1218]/55">Nenhum item informado.</p>}
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="p-4 bg-[#FAFAFA] border border-[#EFE7DC] rounded-sm">
          {renderItem(item)}
          <button type="button" onClick={() => onRemove(item.id)} className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#E85C5C]">
            Remover
          </button>
        </div>
      ))}
    </div>
  </div>
);

const updateImovel = (contexto, setContexto, id, patch) => {
  setContexto({
    ...contexto,
    patrimonioExterno: {
      ...contexto.patrimonioExterno,
      imoveis: contexto.patrimonioExterno.imoveis.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    },
  });
};

const updateVeiculo = (contexto, setContexto, id, patch) => {
  setContexto({
    ...contexto,
    patrimonioExterno: {
      ...contexto.patrimonioExterno,
      veiculos: contexto.patrimonioExterno.veiculos.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    },
  });
};

const updateDivida = (contexto, setContexto, id, patch) => {
  setContexto({
    ...contexto,
    dividas: contexto.dividas.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  });
};
