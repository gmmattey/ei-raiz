export const ASSET_INSTITUTIONS = ['XP', 'ITAU', 'ONZE', 'OUTROS'] as const
export const ASSET_CLASSES = ['ACAO', 'FII', 'FUNDO', 'RF', 'TESOURO', 'PREVIDENCIA', 'POUPANCA', 'COFRINHO'] as const
export const ASSET_STATUSES = ['active', 'redeeming', 'sold', 'archived'] as const

export type AssetInstitution = typeof ASSET_INSTITUTIONS[number]
export type AssetClass = typeof ASSET_CLASSES[number]
export type AssetStatus = typeof ASSET_STATUSES[number]

export type QuoteProviderStatus = 'idle' | 'ok' | 'stale' | 'degraded'

export type GoodType = 'FGTS' | 'IMOVEL' | 'VEICULO'

export interface PortfolioAssetSummary {
  id: number
  institution: AssetInstitution
  institutionName: string | null
  class: AssetClass
  name: string
  displayName: string | null
  ticker: string | null
  qty: number | null
  price: number | null
  invested: number | null
  balance: number | null
  gain: number | null
  gainPct: number | null
  mode: 'auto' | 'manual'
  quoteSource: 'BRAPI' | 'CVM' | null
  quoteFetchedAt: string | null
  status: AssetStatus
  balanceUpdatedAt: string | null
  staleDays: number | null
  createdAt: string | null
  refDate: string | null
  contributionCount: number
  firstContributionAt: string | null
  lastContributionAt: string | null
}

export interface AllocationSlice {
  key: string
  label: string
  total: number
  pct: number
}

export interface FreshnessStaleAsset {
  id: number
  name: string
  daysAgo: number
}

export interface FreshnessInstitutionSummary {
  institution: AssetInstitution
  institutionName?: string
  ok: number
  total: number
  staleAssets: FreshnessStaleAsset[]
}

export interface FreshnessSummary {
  ok: number
  total: number
  byInstitution: FreshnessInstitutionSummary[]
}

export interface QuoteHealth {
  name: 'BRAPI'
  marketTimeZone: string
  hasTokenConfigured: boolean
  trackedTickers: number
  cachedTickers: number
  missingTickers: number
  staleTickers: number
  latestFetchedAt: string | null
  refreshAttempted: number
  refreshSucceeded: number
  status: QuoteProviderStatus
}

export interface BenchmarkPoint {
  value: number
  referenceDate: string | null
}

export interface BenchmarksSummary {
  cdi: BenchmarkPoint | null
  selic: BenchmarkPoint | null
  ipca12m: BenchmarkPoint | null
  fetchedAt: string | null
}

export interface GoodsByType {
  FGTS: number
  IMOVEL: number
  VEICULO: number
}

export interface GoodsSummary {
  total: number
  byType: GoodsByType
}

export interface GrossWealthSummary {
  investmentsTotal: number
  goodsTotal: number
  grossWealth: number | null
}

export interface PortfolioSummary {
  userName: string | null
  total: number
  invested: number
  gain: number | null
  gainPct: number | null
  quotesFetchedAt: string | null
  quoteProvider: QuoteHealth
  benchmarks: BenchmarksSummary
  goods: GoodsSummary | null
  grossWealth: number | null
  freshness: FreshnessSummary
  byInstitution: AllocationSlice[]
  byClass: AllocationSlice[]
  assets: PortfolioAssetSummary[]
  redeeming: PortfolioAssetSummary[]
}
