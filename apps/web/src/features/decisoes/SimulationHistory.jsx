import React, { useEffect, useMemo, useState } from 'react';
import { History, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DecisionSimulatorLayout from './components/DecisionSimulatorLayout';
import SavedSimulationCard from './components/SavedSimulationCard';
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0B1218]/20" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar simulação..."
              className="w-full rounded-sm border border-[#EFE7DC] bg-white py-4 pl-12 pr-4 text-sm outline-none focus:border-[#F56A2A]"
            />
          </div>
          <button className="flex items-center gap-2 rounded-sm border border-[#EFE7DC] bg-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#0B1218] hover:bg-[#FDFCFB]">
            <Filter size={16} /> Filtros
          </button>
        </div>

        {loading && <p className="text-sm text-[#0B1218]/50">Carregando simulações...</p>}
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#EFE7DC]/30 text-[#0B1218]/20">
              <History size={40} />
            </div>
            <h3 className="font-['Sora'] text-xl font-bold text-[#0B1218]">Nenhuma simulação encontrada</h3>
            <p className="mt-2 text-sm text-[#0B1218]/40">Você ainda não salvou nenhuma análise financeira.</p>
          </div>
        )}
      </div>
    </DecisionSimulatorLayout>
  );
};

export default SimulationHistory;
