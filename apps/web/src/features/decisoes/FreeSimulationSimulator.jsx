import React, { useState } from 'react';
import { Settings, Calculator, Save, RefreshCw, Layers } from 'lucide-react';
import DecisionSimulatorLayout from './components/DecisionSimulatorLayout';
import DecisionFormSection from './components/DecisionFormSection';
import ScenarioComparisonCard from './components/ScenarioComparisonCard';
import DecisionDiagnosisCard from './components/DecisionDiagnosisCard';
import SimulationResultBlock from './components/SimulationResultBlock';
import { decisoesApi, telemetriaApi } from '../../cliente-api';
import MaskedInput from '../../components/forms/MaskedInput';

const FreeSimulationSimulator = () => {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);
  const [form, setForm] = useState({
    nome: 'Simulação Livre',
    valorA: 10000,
    retornoA: 0.05,
    valorB: 12000,
    retornoB: 0.12,
    prazoAnos: 3,
    scoreAtual: 68,
  });

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: key === 'nome' ? e.target.value : Number(e.target.value || 0) }));

  return (
    <DecisionSimulatorLayout title="Simulação Livre" subtitle="Defina cenários próprios e compare resultados em estrutura padrão do Esquilo.">
      <div className="space-y-8">
        <DecisionFormSection title="Configuração Geral" description="Parâmetros da simulação" icon={Settings}>
          <MaskedInput label="Nome" value={form.nome} onChange={onChange('nome')} />
          <MaskedInput label="Prazo" type="number" value={form.prazoAnos} onChange={onChange('prazoAnos')} suffix="anos" />
          <MaskedInput label="Score atual" type="number" value={form.scoreAtual} onChange={onChange('scoreAtual')} />
        </DecisionFormSection>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <DecisionFormSection title="Cenário A" description="Premissas iniciais" icon={Layers}>
            <MaskedInput label="Valor" maskType="currency" value={form.valorA} onChange={onChange('valorA')} suffix="BRL" />
            <MaskedInput label="Retorno" type="number" value={form.retornoA} onChange={onChange('retornoA')} suffix="aa" step="0.01" />
          </DecisionFormSection>

          <DecisionFormSection title="Cenário B" description="Premissas alternativas" icon={Layers}>
            <MaskedInput label="Valor" maskType="currency" value={form.valorB} onChange={onChange('valorB')} suffix="BRL" />
            <MaskedInput label="Retorno" type="number" value={form.retornoB} onChange={onChange('retornoB')} suffix="aa" step="0.01" />
          </DecisionFormSection>
        </div>

        {erro && <p className="text-sm text-[#E85C5C]">{erro}</p>}

        <div className="flex justify-center gap-3 pt-4">
          <button onClick={calcular} disabled={loading} className="flex items-center gap-3 rounded-sm bg-[#0B1218] px-12 py-5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-[#111923] disabled:opacity-50"><Calculator size={18} /> Calcular</button>
          <button onClick={salvar} disabled={loading} className="flex items-center gap-2 rounded-sm border border-[#0B1218] px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#0B1218] hover:bg-[#0B1218] hover:text-white disabled:opacity-50"><Save size={16} /> Salvar</button>
        </div>

        {resultado && (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <ScenarioComparisonCard title="Cenário A" items={resultado.cenarioA || []} icon={Layers} />
              <ScenarioComparisonCard title="Cenário B" items={resultado.cenarioB || []} isHighlighted={true} icon={Layers} />
            </div>
            <DecisionDiagnosisCard
              recommendation={resultado.diagnostico?.titulo}
              reason={resultado.diagnostico?.descricao}
              action={resultado.diagnostico?.acao}
              scoreImpact={`${(resultado.impactoScore?.delta ?? 0) >= 0 ? '+' : ''}${resultado.impactoScore?.delta ?? 0} pts`}
              financialImpact={(resultado.cenarioA?.[2]?.value && resultado.cenarioB?.[2]?.value) ? `${resultado.cenarioA[2].value} vs ${resultado.cenarioB[2].value}` : undefined}
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

export default FreeSimulationSimulator;
