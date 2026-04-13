import React, { useEffect, useMemo, useState } from 'react';
import { History, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DecisionSimulatorLayout from './components/DecisionSimulatorLayout';
import SavedSimulationCard from './components/SavedSimulationCard';
import EstadoVazio from '../../components/feedback/EstadoVazio';
import { ApiError, decisoesApi } from '../../cliente-api';

const tipoLabel = {
  imovel: 'Imóvel',
  carro: 'Veículo',
  reserva_ou_financiar: 'Reserva vs Crédito',
  gastar_ou_investir: 'Consumo',
  livre: 'Livre',
};

const SimulationHistory = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setErro('');
        const data = await decisoesApi.listarSimulacoes();
        if (!ativo) return;
        setHistory(data || []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/', { replace: true });
          return;
        }
        if (ativo) setErro('Falha ao carregar histórico de simulações.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [navigate]);

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return history;
    return history.filter((item) =>
      String(item.nome || '').toLowerCase().includes(q) ||
      String(tipoLabel[item.tipo] || item.tipo || '').toLowerCase().includes(q) ||
      String(item.resumoCurto || '').toLowerCase().includes(q),
    );
  }, [history, query]);

  return (
    <DecisionSimulatorLayout
      title="Histórico de Simulações"
      subtitle="Reveja suas análises passadas, compare cenários e acompanhe como suas premissas mudaram ao longo do tempo."
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar simulação..."
              className="w-full rounded-sm border border-[var(--border-color)] bg-[var(--bg-primary)] py-4 pl-12 pr-4 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button className="flex items-center gap-2 rounded-sm border border-[var(--border-color)] bg-[var(--bg-primary)] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
            <Filter size={16} /> Filtros
          </button>
        </div>

        {loading && <p className="text-sm text-[var(--text-muted)]">Carregando simulações...</p>}
        {erro && <p className="text-sm text-[#E85C5C]">{erro}</p>}

        {!loading && !erro && (
          <div className="space-y-4">
            {filtradas.map((item) => (
              <SavedSimulationCard
                key={item.id}
                title={item.nome}
                type={tipoLabel[item.tipo] || item.tipo}
                date={new Date(item.atualizadoEm).toLocaleDateString('pt-BR')}
                recommendation={item.diagnosticoTitulo || item.resumoCurto || 'Sem recomendação'}
                onClick={() => navigate(`/decisoes/resultado/${item.id}`)}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}

        {!loading && !erro && filtradas.length === 0 && (
          <EstadoVazio 
            titulo="Nenhuma simulação encontrada"
            descricao="Você ainda não salvou nenhuma análise financeira ou nenhuma simulação corresponde à sua busca."
            acaoTexto="Nova Simulação"
            onAcao={() => navigate('/decisoes')}
          />
        )}
      </div>
    </DecisionSimulatorLayout>
  );
};

export default SimulationHistory;
