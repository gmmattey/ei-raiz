import React, { useState } from 'react';
import { Save } from 'lucide-react';
import SimuladorWizard from './components/SimuladorWizard';
import ResultadoSimuladorMobile from './components/ResultadoSimuladorMobile';
import MaskedInput from '../../components/forms/MaskedInput';
import { usePremissasMercado, buildPremissasGastarInvestir } from './hooks/usePremissasMercado';
import { decisoesApi, telemetriaApi } from '../../cliente-api';

const STEPS = [
  { label: 'Decisão', title: 'O que você quer gastar?', desc: 'Defina o valor e o prazo da análise.' },
  { label: 'Resultado', title: 'Avaliação final', desc: 'Compare gastar agora contra investir.' },
];

export default function SpendOrInvestSimulatorMobile() {
  const { premissas: premissasMercado, getValor } = usePremissasMercado('gastar_ou_investir');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: 'Gastar ou Investir', valor: 5000, prazoAnos: 10 });

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: key === 'nome' ? e.target.value : Number(e.target.value || 0) }));

  const buildPremissas = () => buildPremissasGastarInvestir(form, getValor);

  const calcular = async () => {
    try {
      setLoading(true); setErro('');
      await telemetriaApi.registrarEvento({ nome: 'simulator_started', dadosJson: { tipo: 'gastar_ou_investir' } });
      const data = await decisoesApi.calcularSimulacao({ tipo: 'gastar_ou_investir', nome: form.nome, premissas: buildPremissas() });
      setResultado(data);
    } catch { setErro('Falha ao calcular cenário.'); }
    finally { setLoading(false); }
  };

  const salvar = async () => {
    try {
      setSalvando(true);
      await decisoesApi.salvarSimulacao({ tipo: 'gastar_ou_investir', nome: form.nome, premissas: buildPremissas() });
      await telemetriaApi.registrarEvento({ nome: 'simulator_saved', dadosJson: { tipo: 'gastar_ou_investir' } });
    } catch { /**/ }
    finally { setSalvando(false); }
  };

  if (resultado) {
    return (
      <section className="space-y-5 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="font-['Sora'] text-[17px] font-bold text-[var(--text-primary)]">Gastar agora ou Investir</h1>
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)] disabled:opacity-50">
            <Save size={12} /> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <ResultadoSimuladorMobile resultado={resultado} onRecalcular={() => { setResultado(null); setStep(0); }} loading={false} recalcularLabel="Nova simulação" premissasMercado={premissasMercado} />
      </section>
    );
  }

  return (
    <SimuladorWizard title="Gastar agora ou Investir" steps={STEPS} currentStep={step} onNext={() => setStep((s) => s + 1)} onPrev={() => setStep((s) => s - 1)} onCalcular={calcular} loading={loading}>
      {step === 0 && (
        <div className="space-y-4">
          <MaskedInput label="Nome da simulação" value={form.nome} onChange={onChange('nome')} />
          <MaskedInput label="Valor do gasto" maskType="currency" value={form.valor} onChange={onChange('valor')} suffix="BRL" />
          <MaskedInput label="Prazo de análise" type="number" value={form.prazoAnos} onChange={onChange('prazoAnos')} suffix="anos" />
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Resumo</p>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Valor</span><span className="font-bold text-[var(--text-primary)]">R$ {form.valor.toLocaleString('pt-BR')}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Prazo</span><span className="font-bold text-[var(--text-primary)]">{form.prazoAnos} anos</span></div>
          </div>
          {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
          <p className="text-[12px] text-[var(--text-secondary)]">Retorno de mercado é obtido automaticamente. Pressione <strong>Calcular</strong> para ver o custo de oportunidade e impacto no score.</p>
        </div>
      )}
    </SimuladorWizard>
  );
}
