import React, { useState } from 'react';
import { Car, Calculator, Save, RefreshCw } from 'lucide-react';
import DecisionSimulatorLayout from './components/DecisionSimulatorLayout';
import DecisionFormSection from './components/DecisionFormSection';
import ScenarioComparisonCard from './components/ScenarioComparisonCard';
import DecisionDiagnosisCard from './components/DecisionDiagnosisCard';
import SimulationResultBlock from './components/SimulationResultBlock';
import { decisoesApi } from '../../cliente-api';

const CarSimulator = () => {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);
  const [form, setForm] = useState({
    nome: 'Simulação Veículo',
    valorCarro: 120000,
    entrada: 20000,
    prazoMeses: 60,
    jurosAnual: 0.16,
    seguroAnual: 4500,
    manutencaoAnual: 3200,
    combustivelMensal: 900,
    depreciacaoAnual: 0.15,
    retornoInvestimentoAnual: 0.1,
    scoreAtual: 68,
  });

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: key === 'nome' ? e.target.value : Number(e.target.value || 0) }));

  const calcular = async () => {
    try {
      setLoading(true); setErro('');
      setResultado(await decisoesApi.calcularSimulacao({ tipo: 'carro', nome: form.nome, premissas: form }));
    } catch {
      setErro('Falha ao calcular simulação de veículo.');
    } finally {
      setLoading(false);
    }
  };

  const salvar = async () => {
    try {
      setLoading(true); setErro('');
      await decisoesApi.salvarSimulacao({ tipo: 'carro', nome: form.nome, premissas: form });
    } catch {
      setErro('Falha ao salvar simulação.');
    } finally {
      setLoading(false);
    }
  };

  const Input = ({ label, field, suffix }) => (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">{label}</label>
      <div className="relative">
        <input type={field === 'nome' ? 'text' : 'number'} value={form[field]} onChange={onChange(field)} className="w-full rounded-sm border border-[#EFE7DC] bg-[#FDFCFB] px-4 py-3 text-sm font-medium text-[#0B1218] outline-none focus:border-[#F56A2A] focus:bg-white" />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#0B1218]/20">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <DecisionSimulatorLayout title="Comprar Carro ou Investir" subtitle="Compare custo de posse e custo de oportunidade com base no seu contexto real.">
      <div className="space-y-8">
        <DecisionFormSection title="Premissas" description="Dados de compra e operação" icon={Car}>
          <Input label="Nome" field="nome" />
          <Input label="Valor do carro" field="valorCarro" suffix="BRL" />
          <Input label="Entrada" field="entrada" suffix="BRL" />
          <Input label="Prazo" field="prazoMeses" suffix="meses" />
          <Input label="Juros" field="jurosAnual" suffix="aa" />
          <Input label="Seguro anual" field="seguroAnual" suffix="BRL" />
          <Input label="Manutenção anual" field="manutencaoAnual" suffix="BRL" />
          <Input label="Combustível mensal" field="combustivelMensal" suffix="BRL" />
          <Input label="Depreciação anual" field="depreciacaoAnual" suffix="aa" />
          <Input label="Retorno alternativo" field="retornoInvestimentoAnual" suffix="aa" />
          <Input label="Score atual" field="scoreAtual" />
        </DecisionFormSection>

        {erro && <p className="text-sm text-[#E85C5C]">{erro}</p>}

        <div className="flex justify-center gap-3 pt-4">
          <button onClick={calcular} disabled={loading} className="flex items-center gap-3 rounded-sm bg-[#0B1218] px-12 py-5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-[#111923] disabled:opacity-50"><Calculator size={18} /> Calcular</button>
          <button onClick={salvar} disabled={loading} className="flex items-center gap-2 rounded-sm border border-[#0B1218] px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#0B1218] hover:bg-[#0B1218] hover:text-white disabled:opacity-50"><Save size={16} /> Salvar</button>
        </div>

        {resultado && (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <ScenarioComparisonCard title="Cenário A" items={resultado.cenarioA || []} icon={Car} />
              <ScenarioComparisonCard title="Cenário B" items={resultado.cenarioB || []} isHighlighted={true} />
            </div>
            <DecisionDiagnosisCard
              recommendation={resultado.diagnostico?.titulo}
              reason={resultado.diagnostico?.descricao}
              action={resultado.diagnostico?.acao}
              scoreImpact={`${(resultado.impactoScore?.delta ?? 0) >= 0 ? '+' : ''}${resultado.impactoScore?.delta ?? 0} pts`}
              financialImpact={(resultado.cenarioA?.[0]?.value && resultado.cenarioB?.[2]?.value) ? `${resultado.cenarioA[0].value}/mês | oportunidade ${resultado.cenarioB[2].value}` : undefined}
              risk={resultado.impactoScore?.regraDominante?.replaceAll('_', ' ')}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SimulationResultBlock title="Score Atual" value={`${resultado.impactoScore?.scoreAtual ?? form.scoreAtual}`} description="Antes" />
              <SimulationResultBlock title="Score Projetado" value={`${resultado.impactoScore?.scoreProjetado ?? form.scoreAtual}`} description="Depois" />
              <SimulationResultBlock title="Delta" value={`${(resultado.impactoScore?.delta ?? 0) >= 0 ? '+' : ''}${resultado.impactoScore?.delta ?? 0}`} description={resultado.impactoScore?.regraDominante || 'impacto'} trend={{ label: 'Score', isPositive: (resultado.impactoScore?.delta ?? 0) >= 0 }} />
            </div>
            <div className="flex justify-end border-t border-[#EFE7DC] pt-8"><button onClick={calcular} className="flex items-center gap-2 rounded-sm border border-[#0B1218] px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#0B1218] hover:text-white"><RefreshCw size={16} /> Recalcular</button></div>
          </>
        )}
      </div>
    </DecisionSimulatorLayout>
  );
};

export default CarSimulator;
