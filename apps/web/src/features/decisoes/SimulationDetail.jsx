import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, ArrowLeft, RefreshCw } from 'lucide-react';
import DecisionSimulatorLayout from './components/DecisionSimulatorLayout';
import ScenarioComparisonCard from './components/ScenarioComparisonCard';
import DecisionDiagnosisCard from './components/DecisionDiagnosisCard';
import SimulationResultBlock from './components/SimulationResultBlock';
import { ApiError, decisoesApi, telemetriaApi } from '../../cliente-api';

const SimulationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        setErro('');
        const data = await decisoesApi.obterSimulacao(id);
        if (!ativo) return;
        setSimulation(data);
        await telemetriaApi.registrarEventoTelemetria('simulation_reopened', { id, origem: 'detail_open' });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/', { replace: true });
          return;
        }
        if (ativo) setErro('Falha ao carregar simulação.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [id, navigate]);

  const resultado = useMemo(() => {
    if (!simulation?.resultado) return null;
    return simulation.resultado;
  }, [simulation]);

  const recalcular = async () => {
    if (!id) return;
    try {
      setErro('');
      const data = await decisoesApi.recalcularSimulacao(id);
      setSimulation(data);
      await telemetriaApi.registrarEventoTelemetria('simulation_reopened', { id, origem: 'recalculo' });
    } catch {
      setErro('Falha ao recalcular simulação.');
    }
  };

  if (loading) {
    return <DecisionSimulatorLayout title="Carregando" subtitle="Buscando sua simulação salva..." />;
  }

  if (erro || !simulation || !resultado) {
    return (
      <DecisionSimulatorLayout title="Simulação indisponível" subtitle={erro || 'Não foi possível carregar os dados.'}>
        <button
          onClick={() => navigate('/decisoes/historico')}
          className="rounded-sm border border-[#0B1218] px-6 py-3 text-[10px] font-bold uppercase tracking-widest"
        >
          Voltar
        </button>
      </DecisionSimulatorLayout>
    );
  }

  return (
    <DecisionSimulatorLayout
      title={simulation.nome}
      subtitle={`Análise realizada em ${new Date(simulation.atualizadoEm).toLocaleDateString('pt-BR')} na categoria ${simulation.tipo}.`}
      onBack={() => navigate('/decisoes/historico')}
    >
      <div className="space-y-12">
        <section className="rounded-sm border border-[#EFE7DC] bg-white p-8">
          <h3 className="mb-6 font-['Sora'] text-lg font-bold text-[#0B1218]">Premissas Utilizadas</h3>
          <pre className="overflow-auto rounded-sm bg-[#FDFCFB] p-4 text-xs text-[#0B1218]/70">{JSON.stringify(simulation.premissas, null, 2)}</pre>
        </section>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <ScenarioComparisonCard title="Cenário A" items={resultado.cenarioA || []} />
          <ScenarioComparisonCard title="Cenário B" items={resultado.cenarioB || []} isHighlighted={true} />
        </div>

        <DecisionDiagnosisCard
          recommendation={resultado?.diagnostico?.titulo || simulation.diagnosticoTitulo || 'Sem diagnóstico'}
          reason={resultado?.diagnostico?.descricao || simulation.diagnosticoDescricao || 'Sem explicação'}
          action={resultado?.diagnostico?.acao || simulation.diagnosticoAcao || 'Revisar premissas'}
          scoreImpact={`${(resultado?.impactoScore?.delta ?? simulation.deltaScore ?? 0) >= 0 ? '+' : ''}${resultado?.impactoScore?.delta ?? simulation.deltaScore ?? 0} pts`}
          financialImpact={(resultado?.cenarioA?.[1]?.value && resultado?.cenarioB?.[1]?.value) ? `${resultado.cenarioA[1].value} vs ${resultado.cenarioB[1].value}` : undefined}
          risk={resultado?.impactoScore?.regraDominante?.replaceAll('_', ' ')}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SimulationResultBlock title="Score Atual" value={`${resultado.impactoScore?.scoreAtual ?? simulation.scoreAtual ?? 0}`} description="Antes da decisão" />
          <SimulationResultBlock title="Score Projetado" value={`${resultado.impactoScore?.scoreProjetado ?? simulation.scoreProjetado ?? 0}`} description="Após cenário" trend={{ label: 'Projeção', isPositive: (resultado.impactoScore?.delta ?? simulation.deltaScore ?? 0) >= 0 }} />
          <SimulationResultBlock title="Delta" value={`${(resultado.impactoScore?.delta ?? simulation.deltaScore ?? 0) >= 0 ? '+' : ''}${resultado.impactoScore?.delta ?? simulation.deltaScore ?? 0}`} description={resultado.impactoScore?.regraDominante || 'impacto'} />
        </div>

        <div className="flex flex-col gap-4 border-t border-[#EFE7DC] pt-12 md:flex-row md:justify-end">
          <button
            onClick={recalcular}
            className="flex items-center justify-center gap-2 rounded-sm border border-[#0B1218] px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#0B1218] hover:bg-[#0B1218] hover:text-white"
          >
            <RefreshCw size={16} /> Recalcular
          </button>
          <button
            onClick={() => navigate(`/decisoes/${simulation.tipo}`)}
            className="flex items-center justify-center gap-2 rounded-sm bg-[#0B1218] px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-[#111923]"
          >
            <Edit3 size={16} /> Editar Premissas
          </button>
        </div>
      </div>
    </DecisionSimulatorLayout>
  );
};

export default SimulationDetail;
