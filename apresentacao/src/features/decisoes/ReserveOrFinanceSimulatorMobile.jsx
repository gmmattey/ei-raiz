import React, { useState } from 'react';
import { Save } from 'lucide-react';
import SimuladorWizard from './components/SimuladorWizard';
import ResultadoSimuladorMobile from './components/ResultadoSimuladorMobile';
import MaskedInput from '../../components/forms/MaskedInput';
import { usePremissasMercado, buildPremissasReservaFinanciar } from './hooks/usePremissasMercado';
import { decisoesApi, telemetriaApi } from '../../cliente-api';

const STEPS = [
  { label: 'Compra', title: 'O que você quer comprar?', desc: 'Informe o valor e o que você tem disponível.' },
  { label: 'Resultado', title: 'Avaliação final', desc: 'Reserve agora ou financie e invista a diferença?' },
];

export default function ReserveOrFinanceSimulatorMobile() {
  const { premissas: premissasMercado, getValor } = usePremissasMercado('reserva_ou_financiar');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);
  const [salvando, setSalvando] = useState(false);
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
      const data = await decisoesApi.calcularSimulacao({ tipo: 'reserva_ou_financiar', nome: form.nome, premissas: buildPremissas() });
      setResultado(data);
    } catch { setErro('Falha ao calcular cenário.'); }
    finally { setLoading(false); }
  };

  const salvar = async () => {
    try {
      setSalvando(true);
      await decisoesApi.salvarSimulacao({ tipo: 'reserva_ou_financiar', nome: form.nome, premissas: buildPremissas() });
      await telemetriaApi.registrarEvento({ nome: 'simulator_saved', dadosJson: { tipo: 'reserva_ou_financiar' } });
    } catch { /**/ }
    finally { setSalvando(false); }
  };

  if (resultado) {
    return (
      <section className="space-y-5 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="font-['Sora'] text-[17px] font-bold text-[var(--text-primary)]">Usar Reserva ou Financiar</h1>
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)] disabled:opacity-50">
            <Save size={12} /> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <ResultadoSimuladorMobile resultado={resultado} onRecalcular={() => { setResultado(null); setStep(0); }} loading={false} recalcularLabel="Nova simulação" premissasMercado={premissasMercado} />
      </section>
    );
  }

  return (
    <SimuladorWizard title="Usar Reserva ou Financiar" steps={STEPS} currentStep={step} onNext={() => setStep((s) => s + 1)} onPrev={() => setStep((s) => s - 1)} onCalcular={calcular} loading={loading}>
      {step === 0 && (
        <div className="space-y-4">
          <MaskedInput label="Nome da simulação" value={form.nome} onChange={onChange('nome')} />
          <MaskedInput label="Valor da compra" maskType="currency" value={form.valorCompra} onChange={onChange('valorCompra')} suffix="BRL" />
          <MaskedInput label="Reserva disponível" maskType="currency" value={form.reservaDisponivel} onChange={onChange('reservaDisponivel')} suffix="BRL" />
          <MaskedInput label="Reserva mínima desejada" maskType="currency" value={form.reservaMinimaDesejada} onChange={onChange('reservaMinimaDesejada')} suffix="BRL" />
          <MaskedInput label="Prazo do financiamento" type="number" value={form.prazoMeses} onChange={onChange('prazoMeses')} suffix="meses" />
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Resumo</p>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Valor da compra</span><span className="font-bold text-[var(--text-primary)]">R$ {form.valorCompra.toLocaleString('pt-BR')}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Reserva disponível</span><span className="font-bold text-[var(--text-primary)]">R$ {form.reservaDisponivel.toLocaleString('pt-BR')}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Reserva mínima</span><span className="font-bold text-[var(--text-primary)]">R$ {form.reservaMinimaDesejada.toLocaleString('pt-BR')}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Prazo</span><span className="font-bold text-[var(--text-primary)]">{form.prazoMeses} meses</span></div>
          </div>
          {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
          <p className="text-[12px] text-[var(--text-secondary)]">Taxa de crédito e retorno de investimento são obtidos automaticamente. Pressione <strong>Calcular</strong> para ver o resultado.</p>
        </div>
      )}
    </SimuladorWizard>
  );
}
