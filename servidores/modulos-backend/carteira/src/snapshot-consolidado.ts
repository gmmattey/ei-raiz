import type { ContextoFinanceiroUsuario } from "@ei/contratos";

/**
 * Projeção de ativo usada pelo snapshot consolidado.
 * Campos canônicos (contratos v2): `rentabilidadeDesdeAquisicaoPct`
 * e `rentabilidadeConfiavel`. O antigo `retorno12m` foi removido —
 * era nome enganoso (mostrava rentabilidade desde aquisição, não 12m).
 */
export type AtivoParaSnapshot = {
  id: string;
  ticker: string | null;
  nome: string;
  categoria: string;
  valorAtual: number;
  quantidade?: number;
  precoMedio?: number;
  rentabilidadeDesdeAquisicaoPct: number | null;
  rentabilidadeConfiavel: boolean;
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
  rentabilidadeDesdeAquisicaoPct: number | null;
  rentabilidadeConfiavel: boolean;
  participacao: number;
};

export type PayloadSnapshotConsolidado = {
  ativos: AtivoConsolidado[];
  /** Soma marcada a mercado dos ativos (famílias A, B, C) — base de rentabilidade. */
  valorInvestimentos: number;
  /** Alias de `valorInvestimentos`, preservado para clientes legados. */
  patrimonioInvestimentos: number;
  patrimonioBens: number;
  patrimonioPoupanca: number;
  patrimonioDividas: number;
  /** Patrimônio líquido: investimentos + bens + poupança − dívidas. */
  patrimonioTotal: number;
  distribuicaoPatrimonio: DistribuicaoPatrimonial[];
  /** true somente se TODOS os ativos tiveram rentabilidade auditável. */
  confiavel: boolean;
};

export type SnapshotConsolidado = {
  payload: PayloadSnapshotConsolidado;
  totalInvestido: number;
  /** Marcação a mercado dos investimentos — base de retornoTotal. */
  totalAtual: number;
  /** Rentabilidade agregada desde aquisição, calculada sobre investimentos. */
  retornoTotal: number;
};

const arredondarCentavos = (valor: number): number => Number(valor.toFixed(2));
const arredondarPercentual = (valor: number): number => Number(valor.toFixed(4));

/**
 * Soma dívidas do contexto financeiro. Preferência: posições tipo `divida`
 * injetadas pelo caller (param `dividasTotais`); fallback: saldoDevedor do
 * array `contexto.dividas`. Nunca negativo.
 */
const resolverDividas = (
  contexto: ContextoFinanceiroUsuario | null,
  dividasTotais?: number,
): number => {
  if (typeof dividasTotais === "number" && Number.isFinite(dividasTotais)) {
    return Math.max(0, dividasTotais);
  }
  const lista = contexto?.dividas ?? [];
  const soma = lista.reduce((acc, d) => acc + Math.max(0, Number(d.saldoDevedor ?? 0)), 0);
  return Math.max(0, soma);
};

/**
 * Função pura: dados os ativos atualizados e o contexto financeiro,
 * produz o snapshot consolidado com escopos separados.
 *
 *   valorInvestimentos = soma(ativos.valorAtual)           ⇐ base de rentabilidade
 *   patrimonioBens     = Σ(imóveis líquidos + veículos)
 *   patrimonioPoupanca = contexto.patrimonioExterno.poupanca
 *   patrimonioDividas  = Σ posições `divida` ativas (param) ou Σ contexto.dividas
 *   patrimonioTotal    = investimentos + bens + poupança − dívidas  (patrimônio líquido)
 *
 * `confiavel` propaga o `rentabilidadeConfiavel` dos ativos: basta um ativo
 * não-confiável para marcar o snapshot inteiro como não-auditável.
 */
export function calcularSnapshotConsolidado(
  ativos: AtivoParaSnapshot[],
  contexto: ContextoFinanceiroUsuario | null,
  dividasTotais?: number,
): SnapshotConsolidado {
  const valorInvestimentos = ativos.reduce(
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

  const patrimonioDividas = resolverDividas(contexto, dividasTotais);

  const patrimonioTotal =
    valorInvestimentos + patrimonioBens + patrimonioPoupanca - patrimonioDividas;

  const baseDistribuicao = valorInvestimentos + patrimonioBens + patrimonioPoupanca;
  const distribuicaoBase = [
    { id: "investimentos", label: "Investimentos", valor: valorInvestimentos },
    { id: "bens", label: "Bens", valor: patrimonioBens },
    { id: "poupanca", label: "Poupança", valor: patrimonioPoupanca },
  ].filter((item) => item.valor > 0);

  const distribuicaoPatrimonio: DistribuicaoPatrimonial[] = distribuicaoBase.map(
    (item) => ({
      ...item,
      percentual:
        baseDistribuicao > 0
          ? arredondarPercentual((item.valor / baseDistribuicao) * 100)
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
    rentabilidadeDesdeAquisicaoPct:
      typeof a.rentabilidadeDesdeAquisicaoPct === "number"
        ? a.rentabilidadeDesdeAquisicaoPct
        : null,
    rentabilidadeConfiavel: a.rentabilidadeConfiavel !== false,
    participacao: Number(a.participacao ?? 0),
  }));

  const todosConfiaveis =
    ativosConsolidados.length > 0 &&
    ativosConsolidados.every((a) => a.rentabilidadeConfiavel);

  const valorInvestimentosCent = arredondarCentavos(valorInvestimentos);

  const payload: PayloadSnapshotConsolidado = {
    ativos: ativosConsolidados,
    valorInvestimentos: valorInvestimentosCent,
    patrimonioInvestimentos: valorInvestimentosCent,
    patrimonioBens: arredondarCentavos(patrimonioBens),
    patrimonioPoupanca: arredondarCentavos(patrimonioPoupanca),
    patrimonioDividas: arredondarCentavos(patrimonioDividas),
    patrimonioTotal: arredondarCentavos(patrimonioTotal),
    distribuicaoPatrimonio,
    confiavel: todosConfiaveis,
  };

  const totalInvestido = ativos.reduce(
    (acc, a) => acc + Number((a.quantidade ?? 0) * (a.precoMedio ?? 0)),
    0,
  );

  const retornoTotal =
    totalInvestido > 0
      ? ((valorInvestimentos - totalInvestido) / totalInvestido) * 100
      : 0;

  return {
    payload,
    totalInvestido: arredondarCentavos(totalInvestido),
    totalAtual: valorInvestimentosCent,
    retornoTotal: arredondarPercentual(retornoTotal),
  };
}
