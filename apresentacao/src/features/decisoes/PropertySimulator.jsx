import React, { useState } from 'react';
import { Home, Key, User, Calculator, Save, RefreshCw } from 'lucide-react';
import DecisionSimulatorLayout from './components/DecisionSimulatorLayout';
import DecisionFormSection from './components/DecisionFormSection';
import ScenarioComparisonCard from './components/ScenarioComparisonCard';
import DecisionDiagnosisCard from './components/DecisionDiagnosisCard';
import SimulationResultBlock from './components/SimulationResultBlock';
import PremissasMercadoCard from './components/PremissasMercadoCard';
import { usePremissasMercado, buildPremissasImovel } from './hooks/usePremissasMercado';
import { decisoesApi, getStoredUser, telemetriaApi } from '../../cliente-api';

const PropertySimulator = () => {
  const user = getStoredUser();
  const { premissas: premissasMercado, getValor } = usePremissasMercado('imovel');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(() => {
    try { const s = sessionStorage.getItem('sim_res_imovel'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [form, setForm] = useState(() => {
    try { const s = sessionStorage.getItem('sim_form_imovel'); if (s) return JSON.parse(s); } catch { /**/ }
    return {
      nome: 'Simulação Imóvel',
      valorImovel: 850000,
      entrada: 200000,
      prazoMeses: 360,
      aluguelMensal: 3200,
      rendaMensal: user?.rendaMensal || 15000,
      horizonteAnos: 10,
      liquidezAtual: 250000,
    };
  });

  const onChange = (key) => (e) => {
    const v = e.target.value;
    setForm((prev) => ({ ...prev, [key]: key === 'nome' ? v : Number(v || 0) }));
  };

  const buildPremissas = () => buildPremissasImovel(form, getValor);

  const calcular = async () => {
    try {
      setLoading(true); setErro('');
      await telemetriaApi.registrarEvento({ nome: 'simulator_started', dadosJson: { tipo: 'imovel' } });
      const data = await decisoesApi.calcularSimulacao({ tipo: 'imovel', nome: form.nome, premissas: buildPremissas() });
      setResultado(data);
      sessionStorage.setItem('sim_res_imovel', JSON.stringify(data));
      sessionStorage.setItem('sim_form_imovel', JSON.stringify(form));
    } catch { setErro('Falha ao calcular simulação de imóvel.'); }
    finally { setLoading(false); }
  };

  const salvar = async () => {
    try {
      setLoading(true); setErro('');
      const data = await decisoesApi.salvarSimulacao({ tipo: 'imovel', nome: form.nome, premissas: buildPremissas() });
      await telemetriaApi.registrarEvento({ nome: 'simulator_saved', dadosJson: { tipo: 'imovel', id: data?.id } });
      setResultado(data.resultado || resultado);
      sessionStorage.setItem('sim_res_imovel', JSON.stringify(data.resultado || resultado));
      sessionStorage.setItem('sim_form_imovel', JSON.stringify(form));
    } catch { setErro('Falha ao salvar simulação.'); }
    finally { setLoading(false); }
  };

  const InputField = ({ label, field, suffix, type = 'number' }) => (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={form[field]}
          onChange={onChange(field)}
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)]"
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--text-muted)]">{suffix}</span>}
      </div>
    </div>
  );

  const impacto = resultado?.impactoScore;

  return (
    <DecisionSimulatorLayout title="Comprar ou Alugar Imóvel">
      <div className="space-y-8">
        <DecisionFormSection title="Dados do Imóvel" description="Informações sobre a aquisição" icon={Home}>
          <InputField label="Nome da simulação" field="nome" type="text" />
          <InputField label="Valor do Imóvel" field="valorImovel" suffix="BRL" />
          <InputField label="Valor de Entrada" field="entrada" suffix="BRL" />
          <InputField label="Prazo (meses)" field="prazoMeses" />
        </DecisionFormSection>

        <DecisionFormSection title="Cenário de Aluguel" description="Custos do aluguel equivalente" icon={Key}>
          <InputField label="Aluguel Mensal" field="aluguelMensal" suffix="BRL" />
        </DecisionFormSection>

        <DecisionFormSection title="Contexto Pessoal" description="Dados do seu momento financeiro" icon={User}>
          <InputField label="Renda Mensal" field="rendaMensal" suffix="BRL" />
          <InputField label="Horizonte" field="horizonteAnos" suffix="anos" />
          <InputField label="Liquidez Disponível" field="liquidezAtual" suffix="BRL" />
        </DecisionFormSection>

        {erro && <p className="text-sm text-[#E85C5C]">{erro}</p>}

        <div className="flex justify-center gap-3 pt-4">
          <button onClick={calcular} disabled={loading} className="flex items-center gap-3 rounded-xl bg-[var(--text-primary)] px-12 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--bg-primary)] transition-all hover:bg-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50">
            <Calculator size={18} /> {loading ? 'Calculando...' : 'Calcular Cenários'}
          </button>
          <button onClick={salvar} disabled={loading} className="flex items-center gap-3 rounded-xl border border-[var(--text-primary)] px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] transition-all hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] disabled:opacity-50">
            <Save size={16} /> Salvar
          </button>
          {resultado && (
            <button onClick={() => { sessionStorage.removeItem('sim_res_imovel'); sessionStorage.removeItem('sim_form_imovel'); setResultado(null); }} className="flex items-center gap-3 rounded-xl border border-[#E85C5C] px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#E85C5C] transition-all hover:bg-[#E85C5C] hover:text-white">
              Nova Simulação
            </button>
          )}
        </div>

        {resultado && (
          <>
            <div className="pt-12">
              <h2 className="mb-6 font-['Sora'] text-2xl font-bold text-[#0B1218]">Resultado Comparativo</h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <ScenarioComparisonCard title="Cenário A — Comprar" items={resultado.cenarioA || []} icon={Home} />
                <ScenarioComparisonCard title="Cenário B — Alugar" items={resultado.cenarioB || []} isHighlighted={true} icon={Key} />
              </div>
            </div>

            <DecisionDiagnosisCard
              recommendation={resultado.diagnostico?.titulo}
              reason={resultado.diagnostico?.descricao}
              action={resultado.diagnostico?.acao}
              scoreImpact={`${(impacto?.delta ?? 0) >= 0 ? '+' : ''}${impacto?.delta ?? 0} pts`}
              financialImpact={(resultado.cenarioA?.[1]?.value && resultado.cenarioB?.[1]?.value) ? `${resultado.cenarioA[1].value} vs ${resultado.cenarioB[1].value}` : undefined}
              risk={impacto?.regraDominante ? impacto.regraDominante.replaceAll('_', ' ') : undefined}
              alert={impacto?.regraDominante ? `Regra dominante: ${impacto.regraDominante}` : undefined}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SimulationResultBlock title="Score Atual" value={`${impacto?.scoreAtual ?? '—'}`} description="Base atual" />
              <SimulationResultBlock title="Score Projetado" value={`${impacto?.scoreProjetado ?? '—'}`} description="Após decisão" />
              <SimulationResultBlock title="Delta" value={`${(impacto?.delta ?? 0) >= 0 ? '+' : ''}${impacto?.delta ?? 0}`} description="Impacto da decisão" trend={{ label: 'Score', isPositive: (impacto?.delta ?? 0) >= 0 }} />
            </div>

            <PremissasMercadoCard premissas={premissasMercado} />

            <div className="flex flex-col gap-4 border-t border-[var(--border-color)] pt-12 md:flex-row md:justify-end">
              <button onClick={calcular} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] transition-all hover:bg-[var(--bg-secondary)]">
                <RefreshCw size={16} /> Recalcular
              </button>
            </div>
          </>
        )}
      </div>
    </DecisionSimulatorLayout>
  );
};

export default PropertySimulator;
