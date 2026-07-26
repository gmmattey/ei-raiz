// Cálculo puro de confiança do contexto financeiro canônico.
// Usado por Score, simulações e Vera para saber se os números do resumo
// patrimonial podem ser citados como atuais, parciais, defasados ou inexistentes.
// Nunca deve ser usado para calcular totais — só para avaliar a confiabilidade
// do resumo patrimonial já calculado em patrimonio.servico.

import type { PatrimonioResumoSaida } from '@ei/contratos';

export type ConfiancaContextoFinanceiro = 'sem_dados' | 'parcial' | 'defasada' | 'atual';

export interface DiagnosticoContextoFinanceiro {
  confianca: ConfiancaContextoFinanceiro;
  motivos: string[];
}

const DIAS_PARA_DEFASAGEM = 35;

export function avaliarConfiancaContextoFinanceiro(
  resumo: PatrimonioResumoSaida,
  agora: Date = new Date(),
): DiagnosticoContextoFinanceiro {
  if (resumo.quantidadeItens === 0) {
    return { confianca: 'sem_dados', motivos: ['nenhum_item_patrimonial'] };
  }

  if (resumo.scoreTotal === null || resumo.scoreCalculadoEm === null) {
    return { confianca: 'parcial', motivos: ['score_nao_calculado'] };
  }

  const calculadoEm = new Date(resumo.scoreCalculadoEm);
  const diasDesdeCalculo = Number.isFinite(calculadoEm.getTime())
    ? (agora.getTime() - calculadoEm.getTime()) / (1000 * 60 * 60 * 24)
    : Number.POSITIVE_INFINITY;

  if (diasDesdeCalculo > DIAS_PARA_DEFASAGEM) {
    return { confianca: 'defasada', motivos: ['score_defasado'] };
  }

  return { confianca: 'atual', motivos: [] };
}

// Fingerprint estável do resumo: só muda quando score, quantidade de itens
// ou patrimônio líquido mudam — não a cada chamada (diferente de atualizadoEm,
// que é gerado on-the-fly). Permite Vera e simulações citarem "a mesma versão".
export function versaoContextoFinanceiro(resumo: PatrimonioResumoSaida): string {
  return [
    resumo.scoreCalculadoEm ?? 'sem-score',
    resumo.quantidadeItens,
    Math.round(resumo.patrimonioLiquidoBrl),
  ].join('|');
}
