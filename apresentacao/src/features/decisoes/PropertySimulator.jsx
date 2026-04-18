import React, { useMemo, useState } from 'react';
import { Home, Key, User, Calculator, Save, RefreshCw } from 'lucide-react';
import DecisionSimulatorLayout from './components/DecisionSimulatorLayout';
import DecisionFormSection from './components/DecisionFormSection';
import ScenarioComparisonCard from './components/ScenarioComparisonCard';
import DecisionDiagnosisCard from './components/DecisionDiagnosisCard';
import SimulationResultBlock from './components/SimulationResultBlock';
import { decisoesApi, getStoredUser, telemetriaApi } from '../../cliente-api';

const PropertySimulator = () => {
  const user = getStoredUser();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(() => {
    try {
      const salvo = sessionStorage.getItem('sim_res_imovel');
      return salvo ? JSON.parse(salvo) : null;
    } catch { return null; }
  });
  const [form, setForm] = useState(() => {
    try {
      const formSalvo = sessionStorage.getItem('sim_form_imovel');
      if (formSalvo) return JSON.parse(formSalvo);
    } catch { /* ignore */ }
    return {

      nome: 'Simulação Imóvel',
      valorImovel: 850000,
      entrada: 200000,
      prazoMeses: 360,
      jurosAnual: 0.105,
      custosDocumentacao: 50000,
      manutencaoMensal: 1200,
      valorizacaoAnual: 0.06,
      aluguelMensal: 3200,
      reajusteAluguelAnual: 0.06,
      retornoInvestimentoAnual: 0.1,
      rendaMensal: user?.rendaMensal || 15000,
      horizonteAnos: 10,
      liquidezAtual: 250000,
      scoreAtual: 68,
    };
  });

  const onChange = (key) => (e) => {
    const v = e.target.value;
    setForm((prev) => ({ ...prev, [key]: key === 'nome' ? v : Number(v || 0) }));
  };

  const calcular = async () => {
    try {
      setLoading(true);
      setErro('');
      await telemetriaApi.registrarEventoTelemetria('simulator_started', { tipo: 'imovel' });
      const data = await decisoesApi.calcularSimulacao({ tipo: 'imovel', nome: form.nome, premissas: form });
      setResultado(data);
      sessionStorage.setItem('sim_res_imovel', JSON.stringify(data));
      sessionStorage.setItem('sim_form_imovel', JSON.stringify(form));
    } catch {
      setErro('Falha ao calcular simulação de imóvel.');
    } finally {
      setLoading(false);
    }
  };

  const salvar = async () => {
    try {
      setLoading(true);
      setErro('');
      const data = await decisoesApi.salvarSimulacao({ tipo: 'imovel', nome: form.nome, premissas: form });
      await telemetriaApi.registrarEventoTelemetria('simulator_saved', { tipo: 'imovel', id: data?.id });
      setResultado(data.resultado || resultado);
      sessionStorage.setItem('sim_res_imovel', JSON.stringify(data.resultado || resultado));
      sessionStorage.setItem('sim_form_imovel', JSON.stringify(form));
    } catch {
      setErro('Falha ao salvar simulação.');
    } finally {
      setLoading(false);
    }
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
    <DecisionSimulatorLayout
      title="Comprar ou Alugar Imóvel"
      subtitle="Uma análise estratégica que considera patrimônio, liquidez, perfil e horizonte para determinar o melhor caminho patrimonial."
    >
      <div className="space-y-8">
        <DecisionFormSection title="Dados do Imóvel" description="Informações sobre a aquisição" icon={Home}>
          <InputField label="Nome da simulação" field="nome" type="text" />
          <InputField label="Valor do Imóvel" field="valorImovel" suffix="BRL" />
          <InputField label="Valor de Entrada" field="entrada" suffix="BRL" />
          <InputField label="Prazo (meses)" field="prazoMeses" />
          <InputField label="Taxa de Juros" field="jurosAnual" suffix="aa" />
          <InputField label="Custos Doc/ITBI" field="custosDocumentacao" suffix="BRL" />
          <InputField label="Manutenção/mês" field="manutencaoMensal" suffix="BRL" />
          <InputField label="Valorização Anual" field="valorizacaoAnual" suffix="aa" />
        </DecisionFormSection>

        <DecisionFormSection title="Cenário de Aluguel" description="Custos do aluguel equivalente" icon={Key}>
          <InputField label="Aluguel Mensal" field="aluguelMensal" suffix="BRL" />
          <InputField label="Reajuste Estimado" field="reajusteAluguelAnual" suffix="aa" />
          <InputField label="Retorno investimento" field="retornoInvestimentoAnual" suffix="aa" />
        </DecisionFormSection>

        <DecisionFormSection title="Contexto do Usuário" description="Dados do seu momento" icon={User}>
          <InputField label="Renda Mensal" field="rendaMensal" suffix="BRL" />
          <InputField label="Horizonte" field="horizonteAnos" suffix="anos" />
          <InputField label="Liquidez Disponível" field="liquidezAtual" suffix="BRL" />
          <InputField label="Score Atual" field="scoreAtual" />
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
            <button onClick={() => {
              sessionStorage.removeItem('sim_res_imovel');
              sessionStorage.removeItem('sim_form_imovel');
              setResultado(null);
            }} className="flex items-center gap-3 rounded-xl border border-[#E85C5C] px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#E85C5C] transition-all hover:bg-[#E85C5C] hover:text-white">
              Nova Simulação
            </button>
          )}
        </div>

        {resultado && (
          <>
            <div className="pt-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-['Sora'] text-2xl font-bold text-[#0B1218]">Resultado Comparativo</h2>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <ScenarioComparisonCard title="Cenário A" items={resultado.cenarioA || []} icon={Home} />
                <ScenarioComparisonCard title="Cenário B" items={resultado.cenarioB || []} isHighlighted={true} icon={Key} />
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SimulationResultBlock title="Score Atual" value={`${impacto?.scoreAtual ?? form.scoreAtual}`} description="Base atual" />
              <SimulationResultBlock title="Score Projetado" value={`${impacto?.scoreProjetado ?? form.scoreAtual}`} description="Após decisão" />
              <SimulationResultBlock title="Delta" value={`${(impacto?.delta ?? 0) >= 0 ? '+' : ''}${impacto?.delta ?? 0}`} description="Impacto da decisão" trend={{ label: 'Score', isPositive: (impacto?.delta ?? 0) >= 0 }} />
              <SimulationResultBlock title="Classificação" value={(impacto?.regraDominante || 'neutro').replaceAll('_', ' ')} description="Regra dominante" />
            </div>

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
