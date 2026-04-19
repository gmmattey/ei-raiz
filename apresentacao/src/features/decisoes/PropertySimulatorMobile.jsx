import React, { useState } from 'react';
import { Save } from 'lucide-react';
import SimuladorWizard from './components/SimuladorWizard';
import ResultadoSimuladorMobile from './components/ResultadoSimuladorMobile';
import MaskedInput from '../../components/forms/MaskedInput';
import { usePremissasMercado, buildPremissasImovel } from './hooks/usePremissasMercado';
import { decisoesApi, getStoredUser, telemetriaApi } from '../../cliente-api';

const STEPS = [
  { label: 'Imóvel', title: 'O imóvel que você quer', desc: 'Valor, entrada e prazo do financiamento.' },
  { label: 'Aluguel', title: 'O cenário de alugar', desc: 'Quanto custaria alugar um imóvel equivalente.' },
  { label: 'Contexto', title: 'Seu momento financeiro', desc: 'Renda, horizonte e liquidez disponível.' },
  { label: 'Resultado', title: 'Avaliação final', desc: 'Comprar ou alugar: o que faz mais sentido pra você?' },
];

export default function PropertySimulatorMobile() {
  const user = getStoredUser();
  const { premissas: premissasMercado, getValor } = usePremissasMercado('imovel');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(() => {
    try { const s = sessionStorage.getItem('sim_res_imovel'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [salvando, setSalvando] = useState(false);
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

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: key === 'nome' ? e.target.value : Number(e.target.value || 0) }));

  const buildPremissas = () => buildPremissasImovel(form, getValor);

  const calcular = async () => {
    try {
      setLoading(true); setErro('');
      await telemetriaApi.registrarEventoTelemetria('simulator_started', { tipo: 'imovel' });
      const data = await decisoesApi.calcularSimulacao({ tipo: 'imovel', nome: form.nome, premissas: buildPremissas() });
      setResultado(data);
      sessionStorage.setItem('sim_res_imovel', JSON.stringify(data));
      sessionStorage.setItem('sim_form_imovel', JSON.stringify(form));
    } catch { setErro('Falha ao calcular simulação de imóvel.'); }
    finally { setLoading(false); }
  };

  const salvar = async () => {
    try {
      setSalvando(true);
      const data = await decisoesApi.salvarSimulacao({ tipo: 'imovel', nome: form.nome, premissas: buildPremissas() });
      await telemetriaApi.registrarEventoTelemetria('simulator_saved', { tipo: 'imovel', id: data?.id });
      sessionStorage.setItem('sim_form_imovel', JSON.stringify(form));
    } catch { /**/ }
    finally { setSalvando(false); }
  };

  if (resultado) {
    return (
      <section className="space-y-5 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="font-['Sora'] text-[17px] font-bold text-[var(--text-primary)]">Comprar ou Alugar Imóvel</h1>
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)] disabled:opacity-50">
            <Save size={12} /> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <ResultadoSimuladorMobile resultado={resultado} onRecalcular={() => { setResultado(null); sessionStorage.removeItem('sim_res_imovel'); setStep(0); }} loading={false} recalcularLabel="Nova simulação" premissasMercado={premissasMercado} />
      </section>
    );
  }

  return (
    <SimuladorWizard title="Comprar ou Alugar Imóvel" steps={STEPS} currentStep={step} onNext={() => setStep((s) => s + 1)} onPrev={() => setStep((s) => s - 1)} onCalcular={calcular} loading={loading}>
      {step === 0 && (
        <div className="space-y-4">
          <MaskedInput label="Nome da simulação" value={form.nome} onChange={onChange('nome')} />
          <MaskedInput label="Valor do imóvel" maskType="currency" value={form.valorImovel} onChange={onChange('valorImovel')} suffix="BRL" />
          <MaskedInput label="Valor de entrada" maskType="currency" value={form.entrada} onChange={onChange('entrada')} suffix="BRL" />
          <MaskedInput label="Prazo do financiamento" type="number" value={form.prazoMeses} onChange={onChange('prazoMeses')} suffix="meses" />
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <MaskedInput label="Aluguel mensal equivalente" maskType="currency" value={form.aluguelMensal} onChange={onChange('aluguelMensal')} suffix="BRL" />
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <MaskedInput label="Renda mensal" maskType="currency" value={form.rendaMensal} onChange={onChange('rendaMensal')} suffix="BRL" />
          <MaskedInput label="Horizonte de análise" type="number" value={form.horizonteAnos} onChange={onChange('horizonteAnos')} suffix="anos" />
          <MaskedInput label="Liquidez disponível" maskType="currency" value={form.liquidezAtual} onChange={onChange('liquidezAtual')} suffix="BRL" />
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Resumo</p>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Valor do imóvel</span><span className="font-bold text-[var(--text-primary)]">R$ {form.valorImovel.toLocaleString('pt-BR')}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Entrada</span><span className="font-bold text-[var(--text-primary)]">R$ {form.entrada.toLocaleString('pt-BR')}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Prazo</span><span className="font-bold text-[var(--text-primary)]">{form.prazoMeses} meses</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Aluguel equiv.</span><span className="font-bold text-[var(--text-primary)]">R$ {form.aluguelMensal.toLocaleString('pt-BR')}/mês</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Horizonte</span><span className="font-bold text-[var(--text-primary)]">{form.horizonteAnos} anos</span></div>
          </div>
          {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
          <p className="text-[12px] text-[var(--text-secondary)]">Taxas de mercado (juros, ITBI, manutenção) são obtidas automaticamente. Pressione <strong>Calcular</strong> para ver a análise.</p>
        </div>
      )}
    </SimuladorWizard>
  );
}
