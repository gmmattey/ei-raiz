import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import SimuladorWizard from './components/SimuladorWizard';
import ResultadoSimuladorMobile from './components/ResultadoSimuladorMobile';
import MaskedInput from '../../components/forms/MaskedInput';
import { usePremissasMercado, buildPremissasCarro } from './hooks/usePremissasMercado';
import { decisoesApi, fipeApi, telemetriaApi } from '../../cliente-api';

const STEPS = [
  { label: 'Veículo', title: 'Qual carro você quer?', desc: 'Busque na tabela FIPE ou informe o valor manualmente.' },
  { label: 'Compra', title: 'Condições de compra', desc: 'Entrada e prazo do financiamento.' },
  { label: 'Resultado', title: 'Avaliação final', desc: 'Comprar o carro ou investir o dinheiro?' },
];

const Select = ({ label, value, onChange: onChangeFn, disabled, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">{label}</label>
    <select value={value} onChange={onChangeFn} disabled={disabled} className="w-full rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-3 text-[13px] text-[var(--text-primary)] disabled:opacity-40">
      {children}
    </select>
  </div>
);

export default function CarSimulatorMobile() {
  const { premissas: premissasMercado, getValor } = usePremissasMercado('carro');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(() => {
    try { const s = sessionStorage.getItem('sim_res_carro'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [salvando, setSalvando] = useState(false);
  const [statusFipe, setStatusFipe] = useState('carregando');
  const [fipeErro, setFipeErro] = useState('');
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [priceRef, setPriceRef] = useState(null);
  const [form, setForm] = useState(() => {
    try { const s = sessionStorage.getItem('sim_form_carro'); if (s) return JSON.parse(s); } catch { /**/ }
    return { nome: 'Simulação Veículo', valorCarro: 120000, entrada: 20000, prazoMeses: 60 };
  });

  useEffect(() => {
    let ativo = true;
    fipeApi.listarMontadorasCarro()
      .then((data) => { if (!ativo) return; setBrands(data.items || []); setStatusFipe('ok'); })
      .catch(() => { if (!ativo) return; setStatusFipe('erro'); setFipeErro('Não foi possível carregar a tabela FIPE.'); });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (!selectedBrand) return;
    let ativo = true;
    setModels([]); setYears([]); setSelectedModel(''); setSelectedYear(''); setPriceRef(null);
    fipeApi.listarModelosCarro(selectedBrand)
      .then((data) => { if (!ativo) return; setModels(data.items || []); })
      .catch(() => { if (!ativo) return; setFipeErro('Falha ao carregar modelos FIPE.'); });
    return () => { ativo = false; };
  }, [selectedBrand]);

  useEffect(() => {
    if (!selectedBrand || !selectedModel) return;
    let ativo = true;
    setYears([]); setSelectedYear(''); setPriceRef(null);
    fipeApi.listarAnosCarro(selectedBrand, selectedModel)
      .then((data) => { if (!ativo) return; setYears(data.items || []); })
      .catch(() => { if (!ativo) return; setFipeErro('Falha ao carregar anos FIPE.'); });
    return () => { ativo = false; };
  }, [selectedBrand, selectedModel]);

  useEffect(() => {
    if (!selectedBrand || !selectedModel || !selectedYear) return;
    let ativo = true;
    setPriceRef(null);
    fipeApi.obterPrecoFipeCarro(selectedBrand, selectedModel, selectedYear)
      .then((data) => {
        if (!ativo) return;
        setPriceRef(data);
        if (typeof data.referencePrice === 'number' && Number.isFinite(data.referencePrice)) {
          setForm((prev) => ({ ...prev, valorCarro: data.referencePrice }));
        }
      })
      .catch(() => { if (!ativo) return; setFipeErro('Não foi possível obter preço FIPE.'); });
    return () => { ativo = false; };
  }, [selectedBrand, selectedModel, selectedYear]);

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: key === 'nome' ? e.target.value : Number(e.target.value || 0) }));

  const buildPremissas = () => buildPremissasCarro(form, getValor);

  const calcular = async () => {
    try {
      setLoading(true); setErro('');
      await telemetriaApi.registrarEvento({ nome: 'simulator_started', dadosJson: { tipo: 'carro' } });
      const data = await decisoesApi.calcularSimulacao({ tipo: 'carro', nome: form.nome, premissas: buildPremissas() });
      setResultado(data);
      sessionStorage.setItem('sim_res_carro', JSON.stringify(data));
      sessionStorage.setItem('sim_form_carro', JSON.stringify(form));
    } catch { setErro('Falha ao calcular simulação de veículo.'); }
    finally { setLoading(false); }
  };

  const salvar = async () => {
    try {
      setSalvando(true);
      const data = await decisoesApi.salvarSimulacao({ tipo: 'carro', nome: form.nome, premissas: buildPremissas() });
      await telemetriaApi.registrarEvento({ nome: 'simulator_saved', dadosJson: { tipo: 'carro', id: data?.id } });
      sessionStorage.setItem('sim_form_carro', JSON.stringify(form));
    } catch { /**/ }
    finally { setSalvando(false); }
  };

  if (resultado) {
    return (
      <section className="space-y-5 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="font-['Sora'] text-[17px] font-bold text-[var(--text-primary)]">Comprar Carro ou Investir</h1>
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)] disabled:opacity-50">
            <Save size={12} /> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <ResultadoSimuladorMobile resultado={resultado} onRecalcular={() => { setResultado(null); sessionStorage.removeItem('sim_res_carro'); setStep(0); }} loading={false} recalcularLabel="Nova simulação" premissasMercado={premissasMercado} />
      </section>
    );
  }

  return (
    <SimuladorWizard title="Comprar Carro ou Investir" steps={STEPS} currentStep={step} onNext={() => setStep((s) => s + 1)} onPrev={() => setStep((s) => s - 1)} onCalcular={calcular} loading={loading}>
      {step === 0 && (
        <div className="space-y-4">
          <MaskedInput label="Nome da simulação" value={form.nome} onChange={onChange('nome')} />
          {statusFipe === 'carregando' && <p className="text-[12px] text-[var(--text-secondary)]">Carregando tabela FIPE...</p>}
          {statusFipe === 'ok' && (
            <>
              <Select label="Montadora" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
                <option value="">Selecione a montadora</option>
                {brands.map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}
              </Select>
              <Select label="Modelo" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} disabled={!selectedBrand}>
                <option value="">Selecione o modelo</option>
                {models.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
              </Select>
              <Select label="Ano / versão" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={!selectedModel}>
                <option value="">Selecione o ano</option>
                {years.map((y) => <option key={y.code} value={y.code}>{y.label}</option>)}
              </Select>
              {priceRef?.referencePriceLabel && (
                <div className="rounded-[12px] bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-2">
                  <p className="text-[11px] font-semibold text-[#10B981]">FIPE aplicado: {priceRef.referencePriceLabel}</p>
                </div>
              )}
            </>
          )}
          {fipeErro && <p className="text-[11px] text-[#E85C5C]">{fipeErro}</p>}
          <MaskedInput label="Valor do carro (ou informe manualmente)" maskType="currency" value={form.valorCarro} onChange={onChange('valorCarro')} suffix="BRL" />
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <MaskedInput label="Valor de entrada" maskType="currency" value={form.entrada} onChange={onChange('entrada')} suffix="BRL" />
          <MaskedInput label="Prazo do financiamento" type="number" value={form.prazoMeses} onChange={onChange('prazoMeses')} suffix="meses" />
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Resumo</p>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Valor do carro</span><span className="font-bold text-[var(--text-primary)]">R$ {form.valorCarro.toLocaleString('pt-BR')}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Entrada</span><span className="font-bold text-[var(--text-primary)]">R$ {form.entrada.toLocaleString('pt-BR')}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">Prazo</span><span className="font-bold text-[var(--text-primary)]">{form.prazoMeses} meses</span></div>
          </div>
          {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
          <p className="text-[12px] text-[var(--text-secondary)]">Juros, seguro, manutenção e depreciação são obtidos automaticamente. Pressione <strong>Calcular</strong> para ver a comparação.</p>
        </div>
      )}
    </SimuladorWizard>
  );
}
