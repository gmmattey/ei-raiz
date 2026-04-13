import React, { useEffect, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { ApiError, fipeApi, perfilApi, telemetriaApi } from "../../cliente-api";
import { useNavigate } from "react-router-dom";
import MaskedInput from "../../components/forms/MaskedInput";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);
const parseCurrencyInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
};
const formatCurrencyInput = (value) => moeda(Number(value || 0));

export default function PerfilUsuario({ embedded = false }) {
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
  const [fipeBrands, setFipeBrands] = useState([]);
  const [fipeModelsByVehicle, setFipeModelsByVehicle] = useState({});
  const [fipeYearsByVehicle, setFipeYearsByVehicle] = useState({});
  const [fipeSelectionByVehicle, setFipeSelectionByVehicle] = useState({});
  const [fipeError, setFipeError] = useState("");
  const [activeTab, setActiveTab] = useState("dados");
  const tabs = [
    { id: "dados", label: "Sobre você" },
    { id: "fluxo", label: "Renda e gastos" },
    { id: "patrimonio", label: "Patrimônio externo" },
    { id: "dividas", label: "Dívidas" },
    { id: "risco", label: "Perfil de investidor" },
    { id: "preferencias", label: "Plataformas" },
  ];

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

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const data = await fipeApi.listarMontadorasCarro();
        if (!ativo) return;
        setFipeBrands(data.items || []);
      } catch {
        if (!ativo) return;
        setFipeError("Não foi possível carregar montadoras FIPE no momento.");
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

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

  const carregarModelosFipe = async (vehicleId, brandCode) => {
    if (!brandCode) return;
    try {
      setFipeError("");
      const data = await fipeApi.listarModelosCarro(brandCode);
      setFipeModelsByVehicle((prev) => ({ ...prev, [vehicleId]: data.items || [] }));
      setFipeYearsByVehicle((prev) => ({ ...prev, [vehicleId]: [] }));
      setFipeSelectionByVehicle((prev) => ({
        ...prev,
        [vehicleId]: { brandCode, modelCode: "", yearCode: "" },
      }));
    } catch {
      setFipeError("Falha ao carregar modelos FIPE.");
    }
  };

  const carregarAnosFipe = async (vehicleId, brandCode, modelCode) => {
    if (!brandCode || !modelCode) return;
    try {
      setFipeError("");
      const data = await fipeApi.listarAnosCarro(brandCode, modelCode);
      setFipeYearsByVehicle((prev) => ({ ...prev, [vehicleId]: data.items || [] }));
      setFipeSelectionByVehicle((prev) => ({
        ...prev,
        [vehicleId]: { brandCode, modelCode, yearCode: "" },
      }));
    } catch {
      setFipeError("Falha ao carregar ano/versão FIPE.");
    }
  };

  const aplicarPrecoFipe = async (vehicleId, brandCode, modelCode, yearCode) => {
    if (!brandCode || !modelCode || !yearCode) return;
    try {
      setFipeError("");
      const data = await fipeApi.obterPrecoFipeCarro(brandCode, modelCode, yearCode);
      updateVeiculo(contexto, setContexto, vehicleId, {
        valorEstimado: Number.isFinite(data.referencePrice) ? Number(data.referencePrice) : 0,
      });
      setFipeSelectionByVehicle((prev) => ({
        ...prev,
        [vehicleId]: { brandCode, modelCode, yearCode },
      }));
    } catch {
      setFipeError("Falha ao carregar preço FIPE.");
    }
  };

  return (
    <div className={`w-full bg-transparent font-['Inter'] text-[#0B1218] ${embedded ? '' : 'animate-in fade-in duration-500'}`}>
      <div className={`w-full ${embedded ? '' : 'max-w-[896px]'}`}>
        <section className={`flex flex-col md:flex-row items-start md:items-center gap-4 ${embedded ? 'mb-8' : 'mb-16'}`}>
          <div className="flex-1">
            <h1 className={`font-['Sora'] font-bold tracking-tight ${embedded ? 'text-3xl' : 'text-4xl'}`}>Meu Perfil</h1>
            <p className="text-[#0B1218]/50 text-sm font-medium mt-2">Suas informações personalizam score, leitura de risco e recomendações.</p>
          </div>
          <button onClick={salvar} className="flex items-center gap-2 px-6 py-2.5 bg-[#F56A2A] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#d95a20] transition-all rounded-sm shadow-sm">
            {saving ? <Save className="animate-spin" size={14} /> : <Save size={14} />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </section>

        {loading && <p className="text-sm text-[#0B1218]/50">Carregando perfil...</p>}
        {error && <p className="text-sm text-[#E85C5C] mb-4">{error}</p>}

        {!loading && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border border-[#EFE7DC] bg-white p-2 rounded-sm shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors ${activeTab === tab.id ? "bg-[#0B1218] text-white shadow-sm" : "bg-[#FAFAFA] text-[#0B1218]/70 hover:bg-[#F5F0EB]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "dados" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-[#EFE7DC] bg-white rounded-sm p-6 shadow-sm">
                <SelectField
                  label="Qual é o seu principal objetivo?"
                  value={perfil.objetivo}
                  onChange={(v) => setPerfil((p) => ({ ...p, objetivo: v }))}
                  options={[
                    { value: "independencia_financeira", label: "Construir patrimônio no longo prazo" },
                    { value: "independencia_financeira", label: "Ter independência financeira" },
                    { value: "aposentadoria",            label: "Guardar para aposentadoria" },
                    { value: "imovel",                   label: "Comprar um imóvel" },
                    { value: "reserva_emergencia",       label: "Criar reserva de emergência" },
                    { value: "outro",                    label: "Outro" },
                  ]}
                />
                <SelectField
                  label="Faixa etária"
                  value={contexto.faixaEtaria || ""}
                  onChange={(v) => setContexto((c) => ({ ...c, faixaEtaria: v }))}
                  options={[
                    { value: "18-25", label: "18 – 25 anos" },
                    { value: "26-35", label: "26 – 35 anos" },
                    { value: "36-45", label: "36 – 45 anos" },
                    { value: "46-55", label: "46 – 55 anos" },
                    { value: "56+",   label: "56 anos ou mais" },
                  ]}
                />
                <SelectField
                  label="Horizonte de investimento"
                  value={perfil.horizonte}
                  onChange={(v) => setPerfil((p) => ({ ...p, horizonte: v }))}
                  options={[
                    { value: "curto_prazo",  label: "Menos de 1 ano (curto prazo)" },
                    { value: "medio_prazo",  label: "1 a 3 anos (médio prazo)" },
                    { value: "longo_prazo",  label: "3 a 10 anos (longo prazo)" },
                    { value: "longo_prazo",  label: "Mais de 10 anos (muito longo prazo)" },
                  ]}
                />
              </div>
            )}

            {activeTab === "fluxo" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-[#EFE7DC] bg-white rounded-sm p-6 shadow-sm">
                <Field label="Renda mensal" value={perfil.rendaMensal} onChange={(v) => setPerfil((p) => ({ ...p, rendaMensal: v }))} currency />
                <Field label="Gasto mensal" value={perfil.gastoMensal} onChange={(v) => setPerfil((p) => ({ ...p, gastoMensal: v }))} currency />
                <Field label="Aporte mensal" value={perfil.aporteMensal} onChange={(v) => setPerfil((p) => ({ ...p, aporteMensal: v }))} currency />
                <Field label="Reserva de caixa" value={perfil.reservaCaixa} onChange={(v) => setPerfil((p) => ({ ...p, reservaCaixa: v }))} currency />
              </div>
            )}

            {activeTab === "patrimonio" && (
              <>
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
                      <Field label="Valor estimado" value={item.valorEstimado} onChange={(v) => updateImovel(contexto, setContexto, item.id, { valorEstimado: v })} currency />
                      <Field label="Saldo financiamento" value={item.saldoFinanciamento || 0} onChange={(v) => updateImovel(contexto, setContexto, item.id, { saldoFinanciamento: v })} currency />
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
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field label="Tipo" value={item.tipo} onChange={(v) => updateVeiculo(contexto, setContexto, item.id, { tipo: v })} />
                        <Field label="Valor FIPE/estimado" value={item.valorEstimado} onChange={(v) => updateVeiculo(contexto, setContexto, item.id, { valorEstimado: v })} currency />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">Montadora (FIPE)</label>
                          <select
                            value={fipeSelectionByVehicle[item.id]?.brandCode || ""}
                            onChange={(e) => carregarModelosFipe(item.id, e.target.value)}
                            className="bg-transparent border-b border-[#EFE7DC] py-3 text-sm text-[#0B1218] focus:outline-none focus:border-[#F56A2A]"
                          >
                            <option value="">Selecione</option>
                            {fipeBrands.map((brand) => (
                              <option key={brand.code} value={brand.code}>{brand.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">Modelo (FIPE)</label>
                          <select
                            value={fipeSelectionByVehicle[item.id]?.modelCode || ""}
                            onChange={(e) => carregarAnosFipe(item.id, fipeSelectionByVehicle[item.id]?.brandCode || "", e.target.value)}
                            disabled={!fipeSelectionByVehicle[item.id]?.brandCode}
                            className="bg-transparent border-b border-[#EFE7DC] py-3 text-sm text-[#0B1218] disabled:opacity-50 focus:outline-none focus:border-[#F56A2A]"
                          >
                            <option value="">Selecione</option>
                            {(fipeModelsByVehicle[item.id] || []).map((model) => (
                              <option key={model.code} value={model.code}>{model.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">Ano/versão (FIPE)</label>
                          <select
                            value={fipeSelectionByVehicle[item.id]?.yearCode || ""}
                            onChange={(e) =>
                              aplicarPrecoFipe(
                                item.id,
                                fipeSelectionByVehicle[item.id]?.brandCode || "",
                                fipeSelectionByVehicle[item.id]?.modelCode || "",
                                e.target.value,
                              )
                            }
                            disabled={!fipeSelectionByVehicle[item.id]?.modelCode}
                            className="bg-transparent border-b border-[#EFE7DC] py-3 text-sm text-[#0B1218] disabled:opacity-50 focus:outline-none focus:border-[#F56A2A]"
                          >
                            <option value="">Selecione</option>
                            {(fipeYearsByVehicle[item.id] || []).map((year) => (
                              <option key={year.code} value={year.code}>{year.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                />
                {fipeError && <p className="text-xs text-[#E85C5C] mt-2">{fipeError}</p>}
              </>
            )}

            {activeTab === "dividas" && (
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
                    <Field label="Saldo devedor" value={item.saldoDevedor} onChange={(v) => updateDivida(contexto, setContexto, item.id, { saldoDevedor: v })} currency />
                    <Field label="Parcela mensal" value={item.parcelaMensal || 0} onChange={(v) => updateDivida(contexto, setContexto, item.id, { parcelaMensal: v })} currency />
                  </div>
                )}
              />
            )}

            {activeTab === "risco" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-[#EFE7DC] bg-white rounded-sm p-6 shadow-sm">
                <SelectField
                  label="Perfil de risco"
                  value={perfil.perfilRisco}
                  onChange={(v) => setPerfil((p) => ({ ...p, perfilRisco: v }))}
                  options={[
                    { value: "conservador", label: "Conservador — prefiro segurança mesmo com retorno menor" },
                    { value: "moderado",    label: "Moderado — aceito alguma oscilação por retorno maior" },
                    { value: "arrojado",    label: "Arrojado — aceito grandes oscilações em busca de altos retornos" },
                  ]}
                />
                <SelectField
                  label="Experiência com investimentos"
                  value={perfil.experienciaInvestimentos}
                  onChange={(v) => setPerfil((p) => ({ ...p, experienciaInvestimentos: v }))}
                  options={[
                    { value: "iniciante",      label: "Iniciante — estou começando agora" },
                    { value: "intermediario",  label: "Intermediário — já invisto há algum tempo" },
                    { value: "avancado",       label: "Avançado — tenho boa experiência com mercado financeiro" },
                  ]}
                />
                <SelectField
                  label="Frequência de aporte"
                  value={perfil.frequenciaAporte}
                  onChange={(v) => setPerfil((p) => ({ ...p, frequenciaAporte: v }))}
                  options={[
                    { value: "mensal",          label: "Mensal" },
                    { value: "trimestral",      label: "Trimestral" },
                    { value: "semestral",       label: "Semestral" },
                    { value: "disponibilidade", label: "Conforme disponibilidade" },
                  ]}
                />
                <div className="md:col-span-2">
                  <EscalaMaturidade
                    value={perfil.maturidade}
                    onChange={(v) => setPerfil((p) => ({ ...p, maturidade: v }))}
                  />
                </div>
              </div>
            )}

            {activeTab === "preferencias" && (
              <div className="mt-2 p-8 bg-[#F5F0EB] rounded-sm border-l-4 border-[#F56A2A] shadow-sm">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="text-[#F56A2A] shrink-0" size={24} />
                  <div>
                    <h4 className="font-['Sora'] text-sm font-bold text-[#0B1218] mb-2 uppercase tracking-tight">Corretoras e plataformas</h4>
                    {plataformas.length === 0 && <p className="text-xs text-[#0B1218]/60">Nenhuma plataforma vinculada ainda.</p>}
                    {plataformas.map((plataforma) => (
                      <p key={plataforma.id} className="text-xs text-[#0B1218]/60">
                        {plataforma.nome} • {plataforma.ultimoImport ? `última importação: ${plataforma.ultimoImport}` : "Sem importações"} • {plataforma.status}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const SelectField = ({ label, value, onChange, options = [] }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-b border-[#EFE7DC] py-3 font-['Inter'] text-sm text-[#0B1218] focus:outline-none focus:border-[#F56A2A] transition-colors"
    >
      <option value="">Selecione...</option>
      {options.map((opt, i) => (
        <option key={`${opt.value}-${i}`} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const MATURIDADE_LABELS = [
  { nivel: 1, desc: "Ainda aprendendo" },
  { nivel: 2, desc: "Conheço o básico" },
  { nivel: 3, desc: "Tenho alguma experiência" },
  { nivel: 4, desc: "Experiente" },
  { nivel: 5, desc: "Especialista" },
];

const EscalaMaturidade = ({ value, onChange }) => (
  <div className="flex flex-col gap-3">
    <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">Como você se define como investidor?</label>
    <div className="flex flex-col gap-2">
      {MATURIDADE_LABELS.map(({ nivel, desc }) => (
        <button
          key={nivel}
          type="button"
          onClick={() => onChange(nivel)}
          className={`flex items-center gap-3 px-4 py-3 border rounded-sm text-left transition-all ${
            Number(value) === nivel
              ? "border-[#F56A2A] bg-[#F56A2A]/5"
              : "border-[#EFE7DC] hover:border-[#F56A2A]/40"
          }`}
        >
          <span className={`font-['Sora'] text-sm font-bold w-5 ${Number(value) === nivel ? "text-[#F56A2A]" : "text-[#0B1218]/30"}`}>
            {nivel}
          </span>
          <span className={`text-sm ${Number(value) === nivel ? "text-[#0B1218] font-medium" : "text-[#0B1218]/60"}`}>
            {desc}
          </span>
        </button>
      ))}
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", currency = false }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">{label}</label>
    <input
      type={currency ? "text" : type}
      inputMode={currency ? "numeric" : undefined}
      value={currency ? formatCurrencyInput(value) : value}
      onChange={(e) => onChange(currency ? parseCurrencyInput(e.target.value) : e.target.value)}
      className="bg-transparent border-b border-[#EFE7DC] py-3 font-['Inter'] text-sm text-[#0B1218] focus:outline-none focus:border-[#F56A2A] transition-colors"
    />
  </div>
);

const IncrementalSection = ({ title, items, onAdd, onRemove, renderItem }) => (
  <div className="mt-6 p-6 border border-[#EFE7DC] bg-white rounded-sm shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-['Sora'] text-sm font-bold text-[#0B1218] uppercase tracking-tight">{title}</h4>
      <button type="button" onClick={onAdd} className="text-[10px] font-bold uppercase tracking-widest text-[#F56A2A]">
        Adicionar
      </button>
    </div>
    {items.length === 0 && <p className="text-xs text-[#0B1218]/55">Nenhum item adicionado ainda.</p>}
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
