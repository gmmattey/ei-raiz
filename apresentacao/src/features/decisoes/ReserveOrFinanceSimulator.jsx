import React, { useState } from 'react';
import { ShieldCheck, Calculator, Save, RefreshCw } from 'lucide-react';
import DecisionSimulatorLayout from './components/DecisionSimulatorLayout';
import DecisionFormSection from './components/DecisionFormSection';
import ScenarioComparisonCard from './components/ScenarioComparisonCard';
import DecisionDiagnosisCard from './components/DecisionDiagnosisCard';
import SimulationResultBlock from './components/SimulationResultBlock';
import PremissasMercadoCard from './components/PremissasMercadoCard';
import { usePremissasMercado, buildPremissasReservaFinanciar } from './hooks/usePremissasMercado';
import { decisoesApi, telemetriaApi } from '../../cliente-api';
import MaskedInput from '../../components/forms/MaskedInput';

const ReserveOrFinanceSimulator = () => {
  const { premissas: premissasMercado, getValor } = usePremissasMercado('reserva_ou_financiar');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);
  const [form, setForm] = useState({
    nome: 'Simulação Reserva',
    valorCompra: 100000,
    reservaDisponivel: 50000,
    reservaMinimaDesejada: 20000,
    prazoMeses: 36,
  });

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: key === 'nome' ? e.target.value : Number(e.target.value || 0) }));

  const buildPremissas = () => buildPremissasReservaFinanciar(form, getValor);

  const calcular = async () => {
    try {
      setLoading(true); setErro('');
      await telemetriaApi.registrarEvento({ nome: 'simulator_started', dadosJson: { tipo: 'reserva_ou_financiar' } });
      setResultado(await decisoesApi.calcularSimulacao({ tipo: 'reserva_ou_financiar', nome: form.nome, premissas: buildPremissas() }));
    } catch { setErro('Falha ao calcular cenário.'); }
    finally { setLoading(false); }
  };

  const salvar = async () => {
    try {
      setLoading(true); setErro('');
      await decisoesApi.salvarSimulacao({ tipo: 'reserva_ou_financiar', nome: form.nome, premissas: buildPremissas() });
      await telemetriaApi.registrarEvento({ nome: 'simulator_saved', dadosJson: { tipo: 'reserva_ou_financiar' } });
    } catch { setErro('Falha ao salvar simulação.'); }
    finally { setLoading(false); }
  };

  return (
    <DecisionSimulatorLayout title="Usar Reserva ou Financiar">
      <div className="space-y-8">
        <DecisionFormSection title="Premissas" description="Dados da decisão" icon={ShieldCheck}>
          <MaskedInput label="Nome" value={form.nome} onChange={onChange('nome')} />
          <MaskedInput label="Valor da compra" maskType="currency" value={form.valorCompra} onChange={onChange('valorCompra')} suffix="BRL" />
          <MaskedInput label="Reserva disponível" maskType="currency" value={form.reservaDisponivel} onChange={onChange('reservaDisponivel')} suffix="BRL" />
          <MaskedInput label="Reserva mínima desejada" maskType="currency" value={form.reservaMinimaDesejada} onChange={onChange('reservaMinimaDesejada')} suffix="BRL" />
          <MaskedInput label="Prazo" type="number" value={form.prazoMeses} onChange={onChange('prazoMeses')} suffix="meses" />
        </DecisionFormSection>

        {erro && <p className="text-sm text-[#E85C5C]">{erro}</p>}

        <div className="flex justify-center gap-3 pt-4">
          <button onClick={calcular} disabled={loading} className="flex items-center gap-3 rounded-xl bg-[var(--text-primary)] px-12 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--bg-primary)] transition-all hover:opacity-90 disabled:opacity-50"><Calculator size={18} /> Calcular</button>
          <button onClick={salvar} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[var(--text-primary)] px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] transition-all hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] disabled:opacity-50"><Save size={16} /> Salvar</button>
        </div>

        {resultado && (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <ScenarioComparisonCard title="Cenário A — Usar Reserva" items={resultado.cenarioA || []} />
              <ScenarioComparisonCard title="Cenário B — Financiar" items={resultado.cenarioB || []} isHighlighted={true} />
            </div>
            <DecisionDiagnosisCard
              recommendation={resultado.diagnostico?.titulo}
              reason={resultado.diagnostico?.descricao}
              action={resultado.diagnostico?.acao}
              scoreImpact={`${(resultado.impactoScore?.delta ?? 0) >= 0 ? '+' : ''}${resultado.impactoScore?.delta ?? 0} pts`}
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

export default ReserveOrFinanceSimulator;
