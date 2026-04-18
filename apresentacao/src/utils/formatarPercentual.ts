/**
 * Padroniza a formatação de porcentagens para o padrão financeiro brasileiro (pt-BR).
 * Exemplo: 0.1234 -> 12,3% ou 12,34% (dependendo da precisão).
 * Aceita números negativos: -0.037 -> -3,7%.
 */
export const formatarPercentual = (valor: number | string | undefined | null, decimais: number = 1): string => {
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (num === undefined || num === null || !Number.isFinite(num)) {
    return "--";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(num);
};
