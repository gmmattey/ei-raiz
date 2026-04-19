import React, { useState } from 'react';
import { Save } from 'lucide-react';
import SimuladorWizard from './components/SimuladorWizard';
import ResultadoSimuladorMobile from './components/ResultadoSimuladorMobile';
import MaskedInput from '../../components/forms/MaskedInput';
import { decisoesApi, telemetriaApi } from '../../cliente-api';

const STEPS = [
  { label: 'Geral', title: 'Configure a simulação', desc: 'Nome, prazo e seu score atual.' },
  { label: 'Cenários', title: 'Defina os dois cenários', desc: 'Compare dois caminhos financeiros distintos.' },
  { label: 'Resultado', title: 'Avaliação final', desc: 'Qual cenário entrega mais no prazo definido?' },
];

export default function FreeSimulationSimulatorMobile() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);
  const [salvando, setSalvando] = useState(false);
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

  const calcular = async () => {
    try {
      setLoading(true); setErro('');
      await telemetriaApi.registrarEventoTelemetria('simulator_started', { tipo: 'livre' });
      const data = await decisoesApi.calcularSimulacao({ tipo: 'livre', nome: form.nome, premissas: form });
      setResultado(data);
    } catch { setErro('Falha ao calcular cenário.'); }
    finally { setLoading(false); }
  };

  const salvar = async () => {
    try {
      setSalvando(true);
      await decisoesApi.salvarSimulacao({ tipo: 'livre', nome: form.nome, premissas: form });
      await telemetriaApi.registrarEventoTelemetria('simulator_saved', { tipo: 'livre' });
    } catch { /* silencioso */ }
    finally { setSalvando(false); }
  };

  if (resultado) {
    return (
      <section className="space-y-5 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="font-['Sora'] text-[17px] font-bold text-[var(--text-primary)]">Simulação Livre</h1>
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)] disabled:opacity-50">
            <Save size={12} /> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <ResultadoSimuladorMobile resultado={resultado} scoreAtual={form.scoreAtual} onRecalcular={() => { setResultado(null); setStep(0); }} loading={false} recalcularLabel="Nova simulação" />
      </section>
    );
  }

  return (
    <SimuladorWizard
      title="Simulação Livre"
      steps={STEPS}
      currentStep={step}
      onNext={() => setStep((s) => s + 1)}
      onPrev={() => setStep((s) => s - 1)}
      onCalcular={calcular}
      loading={loading}
    >
      {step === 0 && (
        <div className="space-y-4">
          <MaskedInput label="Nome da simulação" value={form.nome} onChange={onChange('nome')} />
          <MaskedInput label="Prazo de análise" type="number" value={form.prazoAnos} onChange={onChange('prazoAnos')} suffix="anos" />
          <MaskedInput label="Score atual" type="number" value={form.scoreAtual} onChange={onChange('scoreAtual')} />
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Cenário A</p>
            <MaskedInput label="Valor inicial" maskType="currency" value={form.valorA} onChange={onChange('valorA')} suffix="BRL" />
            <MaskedInput label="Retorno esperado" type="number" value={form.retornoA} onChange={onChange('retornoA')} suffix="ao ano" step="0.01" />
          </div>
          <div className="rounded-[14px] border border-[#F56A2A]/30 bg-[#F56A2A]/5 p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#F56A2A]">Cenário B</p>
            <MaskedInput label="Valor inicial" maskType="currency" value={form.valorB} onChange={onChange('valorB')} suffix="BRL" />
            <MaskedInput label="Retorno esperado" type="number" value={form.retornoB} onChange={onChange('retornoB')} suffix="ao ano" step="0.01" />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Cenário A</p>
              <p className="text-[13px] font-bold text-[var(--text-primary)]">R$ {form.valorA.toLocaleString('pt-BR')}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">{(form.retornoA * 100).toFixed(1)}% a.a.</p>
            </div>
            <div className="rounded-[14px] border border-[#F56A2A]/30 bg-[#F56A2A]/5 p-3 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#F56A2A]">Cenário B</p>
              <p className="text-[13px] font-bold text-[var(--text-primary)]">R$ {form.valorB.toLocaleString('pt-BR')}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">{(form.retornoB * 100).toFixed(1)}% a.a.</p>
            </div>
          </div>
          <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] p-3 flex justify-between">
            <span className="text-[12px] text-[var(--text-secondary)]">Prazo</span>
            <span className="text-[12px] font-bold text-[var(--text-primary)]">{form.prazoAnos} anos</span>
          </div>
          {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
          <p className="text-[12px] text-[var(--text-secondary)]">Pressione <strong>Calcular</strong> para comparar os dois cenários no horizonte definido.</p>
        </div>
      )}
    </SimuladorWizard>
  );
}
