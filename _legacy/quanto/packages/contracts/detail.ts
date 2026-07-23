import type { AssetClass, AssetInstitution, AssetStatus } from './portfolio'

export const ASSET_HISTORY_PERIODS = ['1mo', '3mo', '6mo', '1y'] as const
export const ASSET_LIFECYCLE_EVENT_TYPES = ['redeeming_started', 'redeeming_canceled', 'sale_completed'] as const

export type AssetHistoryPeriod = typeof ASSET_HISTORY_PERIODS[number]

export interface AssetDetailSummary {
  id: number
  institution: AssetInstitution
  institutionName: string | null
  class: AssetClass
  name: string
  displayName: string | null
  ticker: string | null
  qty: number | null
  invested: number | null
  manualBalance: number | null
  price: number | null
  balance: number | null
  gain: number | null
  gainPct: number | null
  avgCost: number | null
  quoteSource: 'BRAPI' | 'CVM' | null
  quoteFetchedAt: string | null
  balanceUpdatedAt: string | null
  staleDays: number | null
  status: AssetStatus
  createdAt: string | null
}

export interface AssetFundSummary {
  cnpj?: string | null
  denom_social?: string | null
  classe?: string | null
  classe_anbima?: string | null
  gestor?: string | null
  admin?: string | null
  vl_patrim_liq?: number | null
}

export interface AssetDetailContext {
  portfolioTotal: number
  assetPct: number
  classPct: number
  classTotal: number
}

export type AssetLifecycleEventType = typeof ASSET_LIFECYCLE_EVENT_TYPES[number]

export interface AssetLifecycleEvent {
  type: AssetLifecycleEventType
  eventAt: string
  grossAmount: number | null
  qtySnapshot: number | null
  note: string | null
}

export interface AssetLatestSale {
  soldAt: string
  grossAmount: number | null
  qtySnapshot: number | null
  note: string | null
}

export interface AssetContribution {
  id: number
  amount: number
  qty: number | null
  unitPrice: number | null
  contributedAt: string
  note: string | null
}

export interface AssetDetailResponse {
  asset: AssetDetailSummary
  fund: AssetFundSummary | null
  context: AssetDetailContext
  lifecycle: {
    latestSale: AssetLatestSale | null
    events: AssetLifecycleEvent[]
  }
  contributions: AssetContribution[]
}

export interface AssetHistoryPoint {
  date: string
  close: number
}

export interface AssetHistoryResponse {
  ticker: string
  period: AssetHistoryPeriod
  dataPoints: AssetHistoryPoint[]
}

export interface UpdateManualBalanceInput {
  manual_balance: number
}

export interface UpdateAssetDetailInput {
  name?: string
  invested?: number | null
}

export interface CreateAssetContributionInput {
  amount: number
  contributedAt: string
  qty?: number
  note?: string
}

export interface CreateAssetContributionResponse {
  id: number
  assetId: number
  amount: number
  contributedAt: string
  qty: number | null
  note: string | null
  invested: number | null
  assetQty: number | null
}

export interface AssetContributionListItem {
  id: number
  amount: number
  qty: number | null
  unitPrice: number | null
  contributedAt: string
  note: string | null
  createdAt?: string
}

export interface AssetContributionListResponse {
  assetId: number
  total: number
  count: number
  contributions: AssetContributionListItem[]
}

export interface DeleteAssetContributionResponse {
  deleted: true
  invested: number | null
  assetQty: number | null
}

export interface ArchiveAssetResponse {
  archived: true
}

export interface StartAssetExitInput {
  startedAt?: string
  note?: string
}

export interface StartAssetExitResponse {
  started: true
  assetId: number
  status: 'redeeming'
  startedAt: string
}

export interface CancelAssetExitInput {
  canceledAt?: string
  note?: string
}

export interface CancelAssetExitResponse {
  canceled: true
  assetId: number
  status: 'active'
  canceledAt: string
}

export interface CompleteAssetSaleInput {
  soldAt: string
  grossAmount: number
  note?: string
}

export interface CompleteAssetSaleResponse {
  sold: true
  assetId: number
  status: 'sold'
  soldAt: string
  grossAmount: number
}
