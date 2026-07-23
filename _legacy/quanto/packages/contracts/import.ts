import type { AssetClass, AssetInstitution } from './portfolio'

export const IMPORTABLE_ASSET_STATUSES = ['active', 'redeeming'] as const

export type ImportableAssetStatus = typeof IMPORTABLE_ASSET_STATUSES[number]

export interface ImportAnalyzeItemInput {
  name: string
  institution?: AssetInstitution
  class?: AssetClass
  ticker?: string
}

export interface ImportAnalyzeInput {
  items: ImportAnalyzeItemInput[]
}

export interface ImportAnalyzeSuggestion {
  index: number
  class: AssetClass
  confidence: number
}

export interface ImportAnalyzeResponse {
  suggestions: ImportAnalyzeSuggestion[]
}

export interface ImportAssetInput {
  institution: AssetInstitution
  institution_name?: string | null
  class: AssetClass
  name: string
  status?: ImportableAssetStatus
  ticker?: string | null
  qty?: number | null
  manual_balance?: number | null
  invested?: number | null
  purchase_date?: string | null
}

export interface ImportAssetsInput {
  items: ImportAssetInput[]
}

export interface ImportAssetsResponse {
  created: number
  assets: Array<{
    id: number
    institution: AssetInstitution
    institution_name: string | null
    class: AssetClass
    name: string
    ticker: string | null
    qty: number | null
    invested: number | null
    manual_balance: number | null
    status: ImportableAssetStatus
    quote_source: 'BRAPI' | null
  }>
}
