import type { GoodType, GoodsByType, GoodsSummary } from '../contracts/portfolio'

export interface RuntimeGoodValue {
  type: GoodType
  estimatedValue: number
}

export interface PerformanceSummary {
  gain: number | null
  gainPct: number | null
}

export function calculatePerformance(
  balance: number | null | undefined,
  invested: number | null | undefined,
): PerformanceSummary {
  if (balance == null || invested == null || invested <= 0) {
    return { gain: null, gainPct: null }
  }

  const gain = balance - invested
  const gainPct = ((balance / invested) - 1) * 100
  return { gain, gainPct }
}

export function emptyGoodsByType(): GoodsByType {
  return { FGTS: 0, IMOVEL: 0, VEICULO: 0 }
}

export function summarizeGoods(items: RuntimeGoodValue[]): GoodsSummary {
  const byType = emptyGoodsByType()

  for (const item of items) {
    byType[item.type] += Number(item.estimatedValue || 0)
  }

  return {
    total: byType.FGTS + byType.IMOVEL + byType.VEICULO,
    byType,
  }
}

export function calculateGrossWealth(investmentsTotal: number, goodsTotal: number): number {
  return Number(investmentsTotal || 0) + Number(goodsTotal || 0)
}
