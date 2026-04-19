import React, { useState } from 'react';
import { ShoppingBag, Calculator, Save, RefreshCw } from 'lucide-react';
import DecisionSimulatorLayout from './components/DecisionSimulatorLayout';
import DecisionFormSection from './components/DecisionFormSection';
import ScenarioComparisonCard from './components/ScenarioComparisonCard';
import DecisionDiagnosisCard from './components/DecisionDiagnosisCard';
import SimulationResultBlock from './components/SimulationResultBlock';
import PremissasMercadoCard from './components/PremissasMercadoCard';
import { usePremissasMercado, buildPremissasGastarInvestir } from './hooks/usePremissasMercado';
import { decisoesApi, telemetriaApi } from '../../cliente-api';
import MaskedInput from '../../components/forms/MaskedInput';

const SpendOrInvestSimulator = () => {
  const { premissas: premissasMercado, getValor } = usePremissasMercado('gastar_ou_investir');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);
  const [form, setForm] = useState({ nome: 'Gastar ou Investir', valor: 5000, prazoAnos: 10 });

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: key === 'nome' ? e.target.value : Number(e.target.value || 0) }));

  const buildPremissas = () => buildPremissasGastarInvestir(form, getValor);

  const calcular = async () => {
    try {
      setLoading(true); setErro('');
      await telemetriaApi.registrarEventoTelemetria('simulator_started', { tipo: 'gastar_ou_investir' });
      setResultado(await decisoesApi.calcularSimulacao({ tipo: 'gastar_ou_investir', nome: form.nome, premissas: buildPremissas() }));
    } catch { setErro('Falha ao calcular cenário.'); }
    finally { setLoading(false); }
  };

  const salvar = async () => {
    try {
      setLoading(true); setErro('');
      await decisoesApi.salvarSimulacao({ tipo: 'gastar_ou_investir', nome: form.nome, premissas: buildPremissas() });
      await telemetriaApi.registrarEventoTelemetria('simulator_saved', { tipo: 'gastar_ou_investir' });
    } catch { setErro('Falha ao salvar simulação.'); }
    finally { setLoading(false); }
  };

  return (
    <DecisionSimulatorLayout title="Gastar agora ou Investir">
      <div className="space-y-8">
        <DecisionFormSection title="Premissas da decisão" description="Parâmetros do cenário" icon={ShoppingBag}>
          <MaskedInput label="Nome" value={form.nome} onChange={onChange('nome')} />
          <MaskedInput label="Valor" maskType="currency" value={form.valor} onChange={onChange('valor')} suffix="BRL" />
          <MaskedInput label="Prazo" type="number" value={form.prazoAnos} onChange={onChange('prazoAnos')} suffix="anos" />
        </DecisionFormSection>

        {erro && <p className="text-sm text-[#E85C5C]">{erro}</p>}

        <div className="flex justify-center gap-3 pt-4">
          <button onClick={calcular} disabled={loading} className="flex items-center gap-3 rounded-xl bg-[var(--text-primary)] px-12 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--bg-primary)] transition-all hover:opacity-90 disabled:opacity-50"><Calculator size={18} /> Calcular</button>
          <button onClick={salvar} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[var(--text-primary)] px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] transition-all hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] disabled:opacity-50"><Save size={16} /> Salvar</button>
        </div>

        {resultado && (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <ScenarioComparisonCard title="Cenário A — Gastar" items={resultado.cenarioA || []} />
              <ScenarioComparisonCard title="Cenário B — Investir" items={resultado.cenarioB || []} isHighlighted={true} />
            </div>
            <DecisionDiagnosisCard
              recommendation={resultado.diagnostico?.titulo}
              reason={resultado.diagnostico?.descricao}
              action={resultado.diagnostico?.acao}
              scoreImpact={`${(resultado.impactoScore?.delta ?? 0) >= 0 ? '+' : ''}${resultado.impactoScore?.delta ?? 0} pts`}
              financialImpact={(resultado.cenarioB?.[2]?.value) ? `Oportunidade ${resultado.cenarioB[2].value}` : undefined}
              risk={resultado.impactoScore?.regraDominante?.replaceAll('_', ' ')}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SimulationResultBlock title="Score Atual" value={`${resultado.impactoScore?.scoreAtual ?? '—'}`} description="Antes" />
              <SimulationResultBlock title="Score Projetado" value={`${resultado.impactoScore?.scoreProjetado ?? '—'}`} description="Depois" />
              <SimulationResultBlock title="Delta" value={`${(resultado.impactoScore?.delta ?? 0) >= 0 ? '+' : ''}${resultado.impactoScore?.delta ?? 0}`} description={resultado.impactoScore?.regraDominante || 'impacto'} trend={{ label: 'Score', isPositive: (resultado.impactoScore?.delta ?? 0) >= 0 }} />
            </div>
            <PremissasMercadoCard premissas={premissasMercado} />
            <div className="flex justify-end border-t border-[var(--border-color)] pt-8">
              <button onClick={calcular} className="flex items-center gap-2 rounded-xl border border-[var(--text-primary)] px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"><RefreshCw size={16} /> Recalcular</button>
            </div>
          </>
        )}
      </div>
    </DecisionSimulatorLayout>
  );
};

export default SpendOrInvestSimulator;
