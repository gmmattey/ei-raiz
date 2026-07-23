import type { CreateAssetInput } from '../contracts/asset'
import type { ImportAssetInput, ImportableAssetStatus } from '../contracts/import'
import type {
  AssetClass,
  AssetInstitution,
  AssetStatus,
  PortfolioAssetSummary,
} from '../contracts/portfolio'

export type CanonicalPortfolioKind =
  | 'listed_equity'
  | 'listed_reit'
  | 'fund'
  | 'fixed_income'
  | 'treasury'
  | 'private_pension'
  | 'cash_reserve'

export type CanonicalValuationMode = 'manual_balance' | 'market_quote'
export type CanonicalMarketProvider = 'BRAPI' | 'CVM' | null
export type RuntimeImportCompatibility = 'batch_import' | 'direct_create'

export interface CanonicalAssetIdentity {
  institution: AssetInstitution
  institutionName: string | null
  assetClass: AssetClass
  portfolioKind: CanonicalPortfolioKind
  name: string
  marketProvider: CanonicalMarketProvider
  marketCode: string | null
}

export type CanonicalImportValuation =
  | {
      valuationMode: 'manual_balance'
      manualBalance: number
      invested: number | null
      purchaseDate: string | null
    }
  | {
      valuationMode: 'market_quote'
      marketProvider: 'BRAPI'
      ticker: string
      qty: number
      invested: number | null
      purchaseDate: string | null
    }
  | {
      valuationMode: 'market_quote'
      marketProvider: 'CVM'
      cnpj: string
      qty: number | null
      initialBalance: number | null
      invested: number | null
      purchaseDate: string | null
    }

export interface CanonicalImportItem {
  identity: CanonicalAssetIdentity
  status: ImportableAssetStatus
  valuation: CanonicalImportValuation
}

export interface CanonicalPortfolioPosition {
  id: number
  status: AssetStatus
  identity: CanonicalAssetIdentity
  valuation: {
    valuationMode: CanonicalValuationMode
    qty: number | null
    price: number | null
    invested: number | null
    currentBalance: number | null
    quoteFetchedAt: string | null
    balanceUpdatedAt: string | null
    staleDays: number | null
  }
  performance: {
    gain: number | null
    gainPct: number | null
  }
  timeline: {
    createdAt: string | null
    referenceDate: string | null
    firstContributionAt: string | null
    lastContributionAt: string | null
  }
  contributionCount: number
}

export interface RuntimeImportSplit {
  batchImportItems: ImportAssetInput[]
  directCreateItems: CreateAssetInput[]
}

export function mapAssetClassToCanonicalKind(assetClass: AssetClass): CanonicalPortfolioKind {
  switch (assetClass) {
    case 'ACAO':
      return 'listed_equity'
    case 'FII':
      return 'listed_reit'
    case 'FUNDO':
      return 'fund'
    case 'RF':
      return 'fixed_income'
    case 'TESOURO':
      return 'treasury'
    case 'PREVIDENCIA':
      return 'private_pension'
    case 'POUPANCA':
    case 'COFRINHO':
      return 'cash_reserve'
  }
}

export function getRuntimeImportCompatibility(item: CanonicalImportItem): RuntimeImportCompatibility {
  if (item.valuation.valuationMode === 'market_quote' && item.valuation.marketProvider === 'CVM') {
    return 'direct_create'
  }

  return 'batch_import'
}

export function toRuntimeCreateAssetInput(item: CanonicalImportItem): CreateAssetInput {
  const base: CreateAssetInput = {
    institution: item.identity.institution,
    institution_name: item.identity.institutionName,
    class: item.identity.assetClass,
    name: item.identity.name,
    purchase_date: item.valuation.purchaseDate,
  }

  if (item.valuation.valuationMode === 'manual_balance') {
    return {
      ...base,
      invested: item.valuation.invested,
      manual_balance: item.valuation.manualBalance,
    }
  }

  if (item.valuation.marketProvider === 'BRAPI') {
    return {
      ...base,
      ticker: item.valuation.ticker,
      qty: item.valuation.qty,
      invested: item.valuation.invested,
    }
  }

  return {
    ...base,
    cvm_cnpj: item.valuation.cnpj,
    qty: item.valuation.qty,
    initial_balance: item.valuation.initialBalance,
    invested: item.valuation.invested,
  }
}

export function toRuntimeImportAssetInput(item: CanonicalImportItem): ImportAssetInput | null {
  if (getRuntimeImportCompatibility(item) !== 'batch_import') {
    return null
  }

  const base: ImportAssetInput = {
    institution: item.identity.institution,
    institution_name: item.identity.institutionName,
    class: item.identity.assetClass,
    name: item.identity.name,
    status: item.status,
    purchase_date: item.valuation.purchaseDate,
  }

  if (item.valuation.valuationMode === 'manual_balance') {
    return {
      ...base,
      invested: item.valuation.invested,
      manual_balance: item.valuation.manualBalance,
    }
  }

  if (item.valuation.marketProvider !== 'BRAPI') {
    return null
  }

  return {
    ...base,
    ticker: item.valuation.ticker,
    qty: item.valuation.qty,
    invested: item.valuation.invested,
  }
}

export function splitCanonicalImportItemsForRuntime(items: CanonicalImportItem[]): RuntimeImportSplit {
  const split: RuntimeImportSplit = {
    batchImportItems: [],
    directCreateItems: [],
  }

  for (const item of items) {
    const batchCompatible = toRuntimeImportAssetInput(item)
    if (batchCompatible) {
      split.batchImportItems.push(batchCompatible)
    } else {
      split.directCreateItems.push(toRuntimeCreateAssetInput(item))
    }
  }

  return split
}

export function fromPortfolioAssetSummary(asset: PortfolioAssetSummary): CanonicalPortfolioPosition {
  const marketProvider = asset.quoteSource ?? null

  return {
    id: asset.id,
    status: asset.status,
    identity: {
      institution: asset.institution,
      institutionName: asset.institutionName,
      assetClass: asset.class,
      portfolioKind: mapAssetClassToCanonicalKind(asset.class),
      name: asset.name,
      marketProvider,
      marketCode: asset.ticker,
    },
    valuation: {
      valuationMode: asset.mode === 'manual' ? 'manual_balance' : 'market_quote',
      qty: asset.qty,
      price: asset.price,
      invested: asset.invested,
      currentBalance: asset.balance,
      quoteFetchedAt: asset.quoteFetchedAt,
      balanceUpdatedAt: asset.balanceUpdatedAt,
      staleDays: asset.staleDays,
    },
    performance: {
      gain: asset.gain,
      gainPct: asset.gainPct,
    },
    timeline: {
      createdAt: asset.createdAt,
      referenceDate: asset.refDate,
      firstContributionAt: asset.firstContributionAt,
      lastContributionAt: asset.lastContributionAt,
    },
    contributionCount: asset.contributionCount,
  }
}
