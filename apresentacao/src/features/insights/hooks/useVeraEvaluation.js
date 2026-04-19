import { useState, useCallback } from 'react';
import { avaliarComVera } from '../../../cliente-api';
import { cache } from '../../../utils/cache';

const VERA_CACHE_KEY = 'vera_payload';
const VERA_CACHE_TTL = 15 * 60 * 1000; // 15 min - sync com insights

export const useVeraEvaluation = () => {
  const [veraPayload, setVeraPayload] = useState(() => cache.get(VERA_CACHE_KEY, VERA_CACHE_TTL));
  const [veraLoading, setVeraLoading] = useState(false);
  const [veraError, setVeraError] = useState(null);

  const avaliar = useCallback(async (resumo) => {
    if (!resumo) return;

    // Retorna cached se disponível
    const cached = cache.get(VERA_CACHE_KEY, VERA_CACHE_TTL);
    if (cached) {
      setVeraPayload(cached);
      return;
    }

    setVeraLoading(true);
    setVeraError(null);

    try {
      const veraRequest = {
        profile: {
          monthly_income: resumo?.contextoFinanceiro?.rendaMensal
            ? { value: resumo.contextoFinanceiro.rendaMensal, state: 'HAS_VALUE' }
            : undefined,
          monthly_expenses: resumo?.contextoFinanceiro?.gastoMensal
            ? { value: resumo.contextoFinanceiro.gastoMensal, state: 'HAS_VALUE' }
            : undefined,
          current_reserve: resumo?.patrimonio
            ? { value: resumo.patrimonio, state: 'HAS_VALUE' }
            : undefined,
          debt_total: resumo?.contextoFinanceiro?.dividas
            ? { value: resumo.contextoFinanceiro.dividas.reduce((sum, d) => sum + (d.saldoDevedor || 0), 0), state: 'HAS_VALUE' }
            : undefined,
          age: resumo?.contextoFinanceiro?.faixaEtaria
            ? { value: parseInt(resumo.contextoFinanceiro.faixaEtaria) || 30, state: 'HAS_VALUE' }
            : undefined,
          investor_profile_declared: resumo?.contextoFinanceiro?.perfilRiscoDeclarado
            ? { value: resumo.contextoFinanceiro.perfilRiscoDeclarado, state: 'HAS_VALUE' }
            : undefined,
        },
        history: {
          recommendations_completed: 0,
          recommendations_ignored: 0,
          recommendations_postponed: 0,
          promised_vs_actual_contribution_ratio: 0.5,
        },
      };

      const veraResponse = await avaliarComVera(veraRequest);

      if (veraResponse?.frontend_payload) {
        const payload = {
          ...veraResponse.frontend_payload,
          source: veraResponse.source || veraResponse.provider || 'fallback',
        };
        cache.set(VERA_CACHE_KEY, payload);
        setVeraPayload(payload);
      }
    } catch (err) {
      console.warn('[Vera] Falha ao carregar avaliação:', err);
      setVeraError(err);
    } finally {
      setVeraLoading(false);
    }
  }, []);

  return {
    veraPayload,
    veraLoading,
    veraError,
    avaliar,
  };
};
