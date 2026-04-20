// Cálculo puro do score unificado do patrimônio.
// Score 0-100 a partir de 4 pilares com pesos definidos.

export interface EntradaScore {
  rendaMensalBrl: number | null;
  aporteMensalBrl: number | null;
  reservaEmergenciaBrl: number | null;
  patrimonioLiquidoBrl: number;
  dividaTotalBrl: number;
  numeroClassesAlocadas: number;
  numeroItens: number;
  temPerfilDefinido: boolean;
}

export interface ResultadoScore {
  score: number;
  pilares: {
    chave: 'disciplina' | 'protecao' | 'diversificacao' | 'endividamento';
    rotulo: string;
    valor: number;
    peso: number;
  }[];
}

const PESOS = {
  disciplina: 0.3,
  protecao: 0.25,
  diversificacao: 0.25,
  endividamento: 0.2,
} as const;

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

export function calcularScore(e: EntradaScore): ResultadoScore {
  // Disciplina: razão aporte_mensal / renda_mensal (alvo 20%).
  const disciplina = (() => {
    if (!e.rendaMensalBrl || !e.aporteMensalBrl || e.rendaMensalBrl <= 0) return 0;
    const razao = e.aporteMensalBrl / e.rendaMensalBrl;
    return clamp((razao / 0.2) * 100);
  })();

  // Proteção: reserva em meses de renda (alvo 6 meses).
  const protecao = (() => {
    if (!e.reservaEmergenciaBrl || !e.rendaMensalBrl || e.rendaMensalBrl <= 0) return 0;
    const meses = e.reservaEmergenciaBrl / e.rendaMensalBrl;
    return clamp((meses / 6) * 100);
  })();

  // Diversificação: número de classes distintas (alvo 5+).
  const diversificacao = e.numeroItens === 0 ? 0 : clamp((e.numeroClassesAlocadas / 5) * 100);

  // Endividamento: 100 - (dívida/patrimônio bruto)*100.
  const endividamento = (() => {
    const bruto = e.patrimonioLiquidoBrl + e.dividaTotalBrl;
    if (bruto <= 0) return e.dividaTotalBrl > 0 ? 0 : 100;
    return clamp(100 - (e.dividaTotalBrl / bruto) * 100);
  })();

  const score = clamp(
    disciplina * PESOS.disciplina +
      protecao * PESOS.protecao +
      diversificacao * PESOS.diversificacao +
      endividamento * PESOS.endividamento,
  );

  return {
    score,
    pilares: [
      { chave: 'disciplina', rotulo: 'Disciplina de aporte', valor: disciplina, peso: PESOS.disciplina },
      { chave: 'protecao', rotulo: 'Proteção (reserva)', valor: protecao, peso: PESOS.protecao },
      { chave: 'diversificacao', rotulo: 'Diversificação', valor: diversificacao, peso: PESOS.diversificacao },
      { chave: 'endividamento', rotulo: 'Endividamento', valor: endividamento, peso: PESOS.endividamento },
    ],
  };
}
