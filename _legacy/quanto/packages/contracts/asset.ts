import type { AssetClass, AssetInstitution, AssetStatus } from './portfolio'

export interface CreateAssetInput {
  institution: AssetInstitution
  institution_name?: string | null
  class: AssetClass
  name: string
  ticker?: string | null
  cvm_cnpj?: string | null
  qty?: number | null
  initial_balance?: number | null
  invested?: number | null
  manual_balance?: number | null
  purchase_date?: string | null
}

export interface CreateAssetResponse {
  id: number
  user_id: number
  institution: AssetInstitution
  institution_name: string | null
  class: AssetClass
  name: string
  display_name: string | null
  ticker: string | null
  qty: number | null
  invested: number | null
  manual_balance: number | null
  balance_updated_at: string | null
  status: 'active'
  quote_source: 'BRAPI' | 'CVM' | null
  created_at: string | null
}

export interface UpdateAssetInput {
  institution?: AssetInstitution | null
  institution_name?: string | null
  class?: AssetClass | null
  name?: string | null
  ticker?: string | null
  qty?: number | null
  invested?: number | null
  manual_balance?: number | null
  status?: AssetStatus | null
  quote_source?: 'BRAPI' | 'CVM' | null
}

export interface UpdateAssetResponse {
  id: number
  user_id: number
  institution: AssetInstitution
  institution_name: string | null
  class: AssetClass
  name: string
  display_name: string | null
  ticker: string | null
  qty: number | null
  invested: number | null
  manual_balance: number | null
  balance_updated_at: string | null
  status: AssetStatus
  quote_source: 'BRAPI' | 'CVM' | null
  created_at: string | null
}
