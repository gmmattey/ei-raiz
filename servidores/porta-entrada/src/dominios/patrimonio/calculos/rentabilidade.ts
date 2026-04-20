// Cálculo puro de rentabilidade.

export function calcularRentabilidadePct(
  valorAtualBrl: number | null,
  valorInvestidoBrl: number | null,
): number | null {
  if (valorAtualBrl == null || valorInvestidoBrl == null) return null;
  if (valorInvestidoBrl === 0) return null;
  return ((valorAtualBrl - valorInvestidoBrl) / valorInvestidoBrl) * 100;
}

export function calcularVariacaoMensalPct(
  valorAtual: number,
  valorAnterior: number,
): number | null {
  if (!Number.isFinite(valorAnterior) || valorAnterior === 0) return null;
  return ((valorAtual - valorAnterior) / valorAnterior) * 100;
}
