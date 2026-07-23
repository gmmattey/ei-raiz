import { expect, test } from '@playwright/test'
import type { PortfolioAssetSummary } from '../packages/contracts'
import {
  fromPortfolioAssetSummary,
  getRuntimeImportCompatibility,
  splitCanonicalImportItemsForRuntime,
  toRuntimeCreateAssetInput,
} from '../packages/domain'

test('modelo canonico separa batch import e create direto sem destruir compatibilidade', async () => {
  const split = splitCanonicalImportItemsForRuntime([
    {
      identity: {
        institution: 'XP',
        institutionName: null,
        assetClass: 'ACAO',
        portfolioKind: 'listed_equity',
        name: 'PETR4 · Petrobras',
        marketProvider: 'BRAPI',
        marketCode: 'PETR4',
      },
      status: 'active',
      valuation: {
        valuationMode: 'market_quote',
        marketProvider: 'BRAPI',
        ticker: 'PETR4',
        qty: 10,
        invested: 420,
        purchaseDate: '2026-06-10T12:00:00.000Z',
      },
    },
    {
      identity: {
        institution: 'ITAU',
        institutionName: null,
        assetClass: 'POUPANCA',
        portfolioKind: 'cash_reserve',
        name: 'Reserva Caixa',
        marketProvider: null,
        marketCode: null,
      },
      status: 'redeeming',
      valuation: {
        valuationMode: 'manual_balance',
        manualBalance: 1000,
        invested: 1000,
        purchaseDate: null,
      },
    },
    {
      identity: {
        institution: 'XP',
        institutionName: null,
        assetClass: 'FUNDO',
        portfolioKind: 'fund',
        name: 'XP Crédito Privado',
        marketProvider: 'CVM',
        marketCode: '12.345.678/0001-90',
      },
      status: 'active',
      valuation: {
        valuationMode: 'market_quote',
        marketProvider: 'CVM',
        cnpj: '12.345.678/0001-90',
        qty: null,
        initialBalance: 2500,
        invested: 2400,
        purchaseDate: '2026-06-12T12:00:00.000Z',
      },
    },
  ])

  expect(split.batchImportItems).toHaveLength(2)
  expect(split.directCreateItems).toHaveLength(1)
  expect(split.batchImportItems[0].ticker).toBe('PETR4')
  expect(split.batchImportItems[1].manual_balance).toBe(1000)
  expect(split.directCreateItems[0].cvm_cnpj).toBe('12.345.678/0001-90')
  expect(split.directCreateItems[0].initial_balance).toBe(2500)
})

test('modelo canonico explicita que item CVM ainda nao cabe no batch import vivo', async () => {
  const item = {
    identity: {
      institution: 'XP' as const,
      institutionName: null,
      assetClass: 'FUNDO' as const,
      portfolioKind: 'fund' as const,
      name: 'XP Macro',
      marketProvider: 'CVM' as const,
      marketCode: '55.444.333/0001-22',
    },
    status: 'active' as const,
    valuation: {
      valuationMode: 'market_quote' as const,
      marketProvider: 'CVM' as const,
      cnpj: '55.444.333/0001-22',
      qty: 12,
      initialBalance: null,
      invested: 1800,
      purchaseDate: null,
    },
  }

  expect(getRuntimeImportCompatibility(item)).toBe('direct_create')

  const createInput = toRuntimeCreateAssetInput(item)
  expect(createInput.cvm_cnpj).toBe('55.444.333/0001-22')
  expect(createInput.qty).toBe(12)
})

test('modelo canonico deriva uma posicao coerente a partir do contrato vivo de portfolio', async () => {
  const runtimeAsset: PortfolioAssetSummary = {
    id: 42,
    institution: 'XP',
    institutionName: null,
    class: 'FII',
    name: 'HGLG11',
    displayName: 'HGLG11',
    ticker: 'HGLG11',
    qty: 15,
    price: 162.3,
    invested: 2100,
    balance: 2434.5,
    gain: 334.5,
    gainPct: 15.928571,
    mode: 'auto',
    quoteSource: 'BRAPI',
    quoteFetchedAt: '2026-06-18T12:00:00.000Z',
    status: 'active',
    balanceUpdatedAt: null,
    staleDays: null,
    createdAt: '2026-06-01T12:00:00.000Z',
    refDate: '2026-06-01T12:00:00.000Z',
    contributionCount: 2,
    firstContributionAt: '2026-06-01T12:00:00.000Z',
    lastContributionAt: '2026-06-12T12:00:00.000Z',
  }

  const canonical = fromPortfolioAssetSummary(runtimeAsset)
  expect(canonical.identity.portfolioKind).toBe('listed_reit')
  expect(canonical.identity.marketProvider).toBe('BRAPI')
  expect(canonical.valuation.valuationMode).toBe('market_quote')
  expect(canonical.timeline.lastContributionAt).toContain('2026-06-12')
  expect(canonical.performance.gain).toBeCloseTo(334.5, 6)
})
