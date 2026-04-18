import type { ContextoFinanceiroUsuario } from "@ei/contratos";

export type AtivoParaSnapshot = {
  id: string;
  ticker: string | null;
  nome: string;
  categoria: string;
  valorAtual: number;
  quantidade?: number;
  precoMedio?: number;
  retorno12m: number;
  participacao: number;
};

export type DistribuicaoPatrimonial = {
  id: string;
  label: string;
  valor: number;
  percentual: number;
};

export type AtivoConsolidado = {
  id: string;
  ticker: string | null;
  nome: string;
  categoria: string;
  valorAtual: number;
  totalInvestido: number;
  retorno12m: number;
  participacao: number;
};

export type PayloadSnapshotConsolidado = {
  ativos: AtivoConsolidado[];
  patrimonioInvestimentos: number;
  patrimonioBens: number;
  patrimonioPoupanca: number;
  patrimonioTotal: number;
  distribuicaoPatrimonio: DistribuicaoPatrimonial[];
};

export type SnapshotConsolidado = {
  payload: PayloadSnapshotConsolidado;
  totalInvestido: number;
  totalAtual: number;
  retornoTotal: number;
};

const arredondarCentavos = (valor: number): number => Number(valor.toFixed(2));
const arredondarPercentual = (valor: number): number => Number(valor.toFixed(4));

/**
 * Função pura: dados os ativos atualizados e o contexto financeiro,
 * produz o snapshot consolidado. Não toca no banco.
 *
 * Usada por:
 *   - portfolio-reprocess.job.ts (persistência em portfolio_snapshots)
 *   - reconstrucao.servico.ts (reconstrução retroativa por mês)
 */
export function calcularSnapshotConsolidado(
  ativos: AtivoParaSnapshot[],
  contexto: ContextoFinanceiroUsuario | null,
): SnapshotConsolidado {
  const patrimonioInvestimentos = ativos.reduce(
    (acc, a) => acc + Number(a.valorAtual ?? 0),
    0,
  );

  const imoveis = contexto?.patrimonioExterno?.imoveis ?? [];
  const veiculos = contexto?.patrimonioExterno?.veiculos ?? [];

  const patrimonioImoveis = imoveis.reduce(
    (acc, i) =>
      acc + Math.max(0, Number(i.valorEstimado ?? 0) - Number(i.saldoFinanciamento ?? 0)),
    0,
  );
  const patrimonioVeiculos = veiculos.reduce(
    (acc, v) => acc + Math.max(0, Number(v.valorEstimado ?? 0)),
    0,
  );
  const patrimonioBens = patrimonioImoveis + patrimonioVeiculos;

  const patrimonioPoupanca = Number(
    contexto?.patrimonioExterno?.poupanca ??
      contexto?.patrimonioExterno?.caixaDisponivel ??
      0,
  );

  const patrimonioTotal =
    patrimonioInvestimentos + patrimonioBens + patrimonioPoupanca;

  const distribuicaoBase = [
    { id: "investimentos", label: "Investimentos", valor: patrimonioInvestimentos },
    { id: "bens", label: "Bens", valor: patrimonioBens },
    { id: "poupanca", label: "Poupança", valor: patrimonioPoupanca },
  ].filter((item) => item.valor > 0);

  const distribuicaoPatrimonio: DistribuicaoPatrimonial[] = distribuicaoBase.map(
    (item) => ({
      ...item,
      percentual:
        patrimonioTotal > 0
          ? arredondarPercentual((item.valor / patrimonioTotal) * 100)
          : 0,
    }),
  );

  const ativosConsolidados: AtivoConsolidado[] = ativos.map((a) => ({
    id: a.id,
    ticker: a.ticker ?? null,
    nome: a.nome,
    categoria: a.categoria,
    valorAtual: Number(a.valorAtual ?? 0),
    totalInvestido: Number((a.quantidade ?? 0) * (a.precoMedio ?? 0)),
    retorno12m: Number(a.retorno12m ?? 0),
    participacao: Number(a.participacao ?? 0),
  }));

  const payload: PayloadSnapshotConsolidado = {
    ativos: ativosConsolidados,
    patrimonioInvestimentos: arredondarCentavos(patrimonioInvestimentos),
    patrimonioBens: arredondarCentavos(patrimonioBens),
    patrimonioPoupanca: arredondarCentavos(patrimonioPoupanca),
    patrimonioTotal: arredondarCentavos(patrimonioTotal),
    distribuicaoPatrimonio,
  };

  const totalInvestido = ativos.reduce(
    (acc, a) => acc + Number((a.quantidade ?? 0) * (a.precoMedio ?? 0)),
    0,
  );

  const retornoTotal =
    totalInvestido > 0
      ? ((patrimonioInvestimentos - totalInvestido) / totalInvestido) * 100
      : 0;

  return {
    payload,
    totalInvestido: arredondarCentavos(totalInvestido),
    totalAtual: arredondarCentavos(patrimonioInvestimentos),
    retornoTotal: arredondarPercentual(retornoTotal),
  };
}
