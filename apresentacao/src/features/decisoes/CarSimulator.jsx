import React, { useEffect, useMemo, useState } from 'react';
import { Car, Calculator, Save, RefreshCw } from 'lucide-react';
import DecisionSimulatorLayout from './components/DecisionSimulatorLayout';
import DecisionFormSection from './components/DecisionFormSection';
import ScenarioComparisonCard from './components/ScenarioComparisonCard';
import DecisionDiagnosisCard from './components/DecisionDiagnosisCard';
import SimulationResultBlock from './components/SimulationResultBlock';
import PremissasMercadoCard from './components/PremissasMercadoCard';
import { usePremissasMercado, buildPremissasCarro } from './hooks/usePremissasMercado';
import { ApiError, decisoesApi, fipeApi, telemetriaApi } from '../../cliente-api';
import MaskedInput from '../../components/forms/MaskedInput';

const CarSimulator = () => {
  const { premissas: premissasMercado, getValor } = usePremissasMercado('carro');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(() => {
    try { const s = sessionStorage.getItem('sim_res_carro'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
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
    (async () => {
      try {
        setStatusFipe('carregando');
        const data = await fipeApi.listarMontadorasCarro();
        if (!ativo) return;
        setBrands(data.items || []);
        setStatusFipe('ok');
      } catch { if (!ativo) return; setStatusFipe('erro'); setFipeErro('Não foi possível carregar montadoras da FIPE.'); }
    })();
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (!selectedBrand) return;
    let ativo = true;
    (async () => {
      try {
        setModels([]); setYears([]); setSelectedModel(''); setSelectedYear(''); setPriceRef(null);
        const data = await fipeApi.listarModelosCarro(selectedBrand);
        if (!ativo) return;
        setModels(data.items || []);
      } catch { if (!ativo) return; setFipeErro('Falha ao carregar modelos FIPE.'); }
    })();
    return () => { ativo = false; };
  }, [selectedBrand]);

  useEffect(() => {
    if (!selectedBrand || !selectedModel) return;
    let ativo = true;
    (async () => {
      try {
        setYears([]); setSelectedYear(''); setPriceRef(null);
        const data = await fipeApi.listarAnosCarro(selectedBrand, selectedModel);
        if (!ativo) return;
        setYears(data.items || []);
      } catch { if (!ativo) return; setFipeErro('Falha ao carregar anos/versões FIPE.'); }
    })();
    return () => { ativo = false; };
  }, [selectedBrand, selectedModel]);

  useEffect(() => {
    if (!selectedBrand || !selectedModel || !selectedYear) return;
    let ativo = true;
    (async () => {
      try {
        setPriceRef(null);
        const data = await fipeApi.obterPrecoFipeCarro(selectedBrand, selectedModel, selectedYear);
        if (!ativo) return;
        setPriceRef(data);
        if (typeof data.referencePrice === 'number' && Number.isFinite(data.referencePrice)) {
          setForm((prev) => ({ ...prev, valorCarro: data.referencePrice }));
        }
      } catch { if (!ativo) return; setFipeErro('Não foi possível carregar preço de referência FIPE.'); }
    })();
    return () => { ativo = false; };
  }, [selectedBrand, selectedModel, selectedYear]);

  const statusMercado = useMemo(() => {
    if (statusFipe === 'carregando') return 'Carregando FIPE...';
    if (statusFipe === 'erro') return 'FIPE indisponível';
    if (priceRef?.fetchedAt) return `FIPE atualizada ${new Date(priceRef.fetchedAt).toLocaleString('pt-BR')}`;
    return 'Selecione veículo para obter preço FIPE';
  }, [statusFipe, priceRef]);

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: key === 'nome' ? e.target.value : Number(e.target.value || 0) }));

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
      setLoading(true); setErro('');
      const data = await decisoesApi.salvarSimulacao({ tipo: 'carro', nome: form.nome, premissas: buildPremissas() });
      await telemetriaApi.registrarEvento({ nome: 'simulator_saved', dadosJson: { tipo: 'carro', id: data?.id } });
      setResultado(data.resultado || resultado);
      sessionStorage.setItem('sim_res_carro', JSON.stringify(data.resultado || resultado));
      sessionStorage.setItem('sim_form_carro', JSON.stringify(form));
    } catch { /**/ }
    finally { setLoading(false); }
  };

  return (
    <DecisionSimulatorLayout title="Comprar Carro ou Investir">
      <div className="space-y-8">
        <DecisionFormSection title="Premissas" description="Dados de compra e operação" icon={Car}>
          <div className="md:col-span-2 border border-[#EFE7DC] rounded-xl p-4 bg-[#FDFCFB]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40 mb-3">Preço de referência via FIPE</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">Montadora</label>
                <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full rounded-xl border border-[#EFE7DC] bg-white px-3 py-3 text-sm">
                  <option value="">Selecione</option>
                  {brands.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">Modelo</label>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} disabled={!selectedBrand} className="w-full rounded-xl border border-[#EFE7DC] bg-white px-3 py-3 text-sm disabled:opacity-50">
                  <option value="">Selecione</option>
                  {models.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">Ano/versão</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={!selectedModel} className="w-full rounded-xl border border-[#EFE7DC] bg-white px-3 py-3 text-sm disabled:opacity-50">
                  <option value="">Selecione</option>
                  {years.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-[#0B1218]/60 mt-3">{statusMercado}</p>
            {fipeErro ? <p className="text-[11px] text-[#E85C5C] mt-2">{fipeErro}</p> : null}
            {priceRef?.referencePriceLabel ? (
              <p className="text-[11px] text-[#0B1218]/60 mt-2">Preço FIPE aplicado: <strong>{priceRef.referencePriceLabel}</strong></p>
            ) : null}
          </div>

          <MaskedInput label="Nome" value={form.nome} onChange={onChange('nome')} className="md:col-span-1" />
          <MaskedInput label="Valor do carro" maskType="currency" value={form.valorCarro} onChange={onChange('valorCarro')} suffix="BRL" />
          <MaskedInput label="Entrada" maskType="currency" value={form.entrada} onChange={onChange('entrada')} suffix="BRL" />
          <MaskedInput label="Prazo" type="number" value={form.prazoMeses} onChange={onChange('prazoMeses')} suffix="meses" />
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
            <button onClick={() => { sessionStorage.removeItem('sim_res_carro'); sessionStorage.removeItem('sim_form_carro'); setResultado(null); }} className="flex items-center gap-3 rounded-xl border border-[#E85C5C] px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#E85C5C] transition-all hover:bg-[#E85C5C] hover:text-white">
              Nova Simulação
            </button>
          )}
        </div>

        {resultado && (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <ScenarioComparisonCard title="Cenário A — Comprar" items={resultado.cenarioA || []} icon={Car} />
              <ScenarioComparisonCard title="Cenário B — Investir" items={resultado.cenarioB || []} isHighlighted={true} />
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
              <SimulationResultBlock title="Score Atual" value={`${resultado.impactoScore?.scoreAtual ?? '—'}`} description="Antes" />
              <SimulationResultBlock title="Score Projetado" value={`${resultado.impactoScore?.scoreProjetado ?? '—'}`} description="Depois" />
              <SimulationResultBlock title="Delta" value={`${(resultado.impactoScore?.delta ?? 0) >= 0 ? '+' : ''}${resultado.impactoScore?.delta ?? 0}`} description={resultado.impactoScore?.regraDominante || 'impacto'} trend={{ label: 'Score', isPositive: (resultado.impactoScore?.delta ?? 0) >= 0 }} />
            </div>
            <PremissasMercadoCard premissas={premissasMercado} />
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

export default CarSimulator;
