import { useCallback } from 'react';

// Backend canônico não expõe endpoint de "avaliação" da Vera como insight card.
// /api/decisoes/vera/mensagens é chat (pergunta/resposta), não cartão de decisão.
// Este hook vira no-op até um endpoint equivalente nascer no domínio patrimonio/score.
export const useVeraEvaluation = () => {
  const avaliar = useCallback(async () => {}, []);
  return {
    veraPayload: null,
    veraLoading: false,
    veraError: null,
    avaliar,
  };
};
