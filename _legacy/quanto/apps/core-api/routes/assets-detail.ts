import type { Hono } from 'hono'
import {
  ASSET_HISTORY_PERIODS,
  type AssetHistoryPeriod,
  type AssetDetailResponse,
  type AssetHistoryResponse,
  type AssetLifecycleEventType,
} from '../../../packages/contracts/detail'
import { calculatePerformance } from '../../../packages/domain'
import type { Bindings, Variables } from '../types'

type AssetDetailApp = Hono<{ Bindings: Bindings; Variables: Variables }>

type RegisterAssetDetailRoutesDeps = {
  hasTable: (db: D1Database, tableName: string) => Promise<boolean>
  refreshBrapiTicker: (db: D1Database, env: Bindings, ticker: string) => Promise<number | null>
}

export function registerAssetDetailRoutes(app: AssetDetailApp, deps: RegisterAssetDetailRoutesDeps) {
  const { hasTable, refreshBrapiTicker } = deps

  app.get('/api/assets/:id/detail', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id < 1) {
      return c.json({ error: 'Invalid asset id' }, 400)
    }

    try {
      const tickerInfo = await db.prepare(
        `SELECT ticker, quote_source FROM assets WHERE id = ? AND user_id = ? AND status != 'archived'`,
      ).bind(id, userId).first<{ ticker: string | null; quote_source: string | null }>()

      if (!tickerInfo) return c.json({ error: 'Asset not found' }, 404)

      if (tickerInfo.ticker && (!tickerInfo.quote_source || tickerInfo.quote_source === 'BRAPI')) {
        const freshEntry = await db.prepare(
          `SELECT 1 FROM quotes_cache WHERE ticker = ? AND (julianday('now') - julianday(fetched_at)) * 1440 <= 15`,
        ).bind(tickerInfo.ticker).first()

        if (!freshEntry) {
          await refreshBrapiTicker(db, c.env, tickerInfo.ticker)
        }
      }

      const asset = await db.prepare(`
        SELECT a.*, q.price, q.fetched_at AS quote_fetched_at,
          CASE
            WHEN a.ticker IS NOT NULL AND q.price IS NOT NULL THEN a.qty * q.price
            WHEN a.ticker IS NOT NULL THEN NULL
            ELSE COALESCE(a.manual_balance, 0)
          END AS balance,
          CASE
            WHEN a.balance_updated_at IS NOT NULL
              THEN CAST(julianday('now') - julianday(a.balance_updated_at) AS INTEGER)
            ELSE NULL
          END AS stale_days
        FROM assets a
        LEFT JOIN quotes_cache q ON q.ticker = a.ticker
        WHERE a.id = ? AND a.user_id = ? AND a.status != 'archived'
      `).bind(id, userId).first<Record<string, unknown>>()

      if (!asset) return c.json({ error: 'Asset not found' }, 404)

      const summary = await db.prepare(
        `SELECT total_balance FROM vw_portfolio_summary WHERE user_id = ?`,
      ).bind(userId).first<{ total_balance: number }>()

      const classTotal = await db.prepare(
        `SELECT total_balance FROM vw_allocation_by_class WHERE user_id = ? AND class = ?`,
      ).bind(userId, asset.class).first<{ total_balance: number }>()

      const portfolioTotal = summary?.total_balance ?? 0
      const rawBalance = (asset.balance as number | null) ?? null

      let fund: Record<string, unknown> | null = null
      if (asset.quote_source === 'CVM' && asset.ticker) {
        fund = await db.prepare(
          `SELECT cnpj, denom_social, classe, classe_anbima, gestor, admin, vl_patrim_liq
           FROM cvm_funds_cache WHERE cnpj = ?`,
        ).bind(asset.ticker).first<Record<string, unknown>>() ?? null
      }

      const contributionsEnabled = await hasTable(db, 'asset_contributions')
      const contribResult = contributionsEnabled
        ? await db.prepare(
            `SELECT id, amount, qty, contributed_at, note
             FROM asset_contributions
             WHERE asset_id = ? AND user_id = ?
             ORDER BY contributed_at DESC`,
          ).bind(id, userId).all<{ id: number; amount: number; qty: number | null; contributed_at: string; note: string | null }>()
        : { results: [] as { id: number; amount: number; qty: number | null; contributed_at: string; note: string | null }[] }

      const lifecycleEnabled = await hasTable(db, 'asset_lifecycle_events')
      const lifecycleResult = lifecycleEnabled
        ? await db.prepare(
            `SELECT event_type, event_at, gross_amount, qty_snapshot, note
             FROM asset_lifecycle_events
             WHERE asset_id = ? AND user_id = ?
             ORDER BY event_at DESC, id DESC
             LIMIT 6`,
          ).bind(id, userId).all<{
            event_type: AssetLifecycleEventType
            event_at: string
            gross_amount: number | null
            qty_snapshot: number | null
            note: string | null
          }>()
        : { results: [] as {
            event_type: AssetLifecycleEventType
            event_at: string
            gross_amount: number | null
            qty_snapshot: number | null
            note: string | null
          }[] }

      const latestSale = lifecycleResult.results.find((event) => event.event_type === 'sale_completed') ?? null

      const balance = asset.status === 'sold' && latestSale?.gross_amount != null
        ? latestSale.gross_amount
        : rawBalance
      const invested = (asset.invested as number | null) ?? null
      const { gain, gainPct } = calculatePerformance(balance, invested)
      const qty = asset.qty as number | null
      const avgCost = asset.ticker && qty && invested ? invested / qty : null

      const response: AssetDetailResponse = {
        asset: {
          id: asset.id as number,
          institution: asset.institution as AssetDetailResponse['asset']['institution'],
          institutionName: (asset.institution_name as string | null) ?? null,
          class: asset.class as AssetDetailResponse['asset']['class'],
          name: asset.name as string,
          displayName: (asset.display_name as string | null) ?? null,
          ticker: (asset.ticker as string | null) ?? null,
          qty: qty ?? null,
          invested,
          manualBalance: (asset.manual_balance as number | null) ?? null,
          price: (asset.price as number | null) ?? null,
          balance,
          gain,
          gainPct,
          avgCost,
          quoteSource: ((asset.quote_source as 'BRAPI' | 'CVM' | null) ?? (asset.ticker ? 'BRAPI' : null)),
          quoteFetchedAt: (asset.quote_fetched_at as string | null) ?? null,
          balanceUpdatedAt: (asset.balance_updated_at as string | null) ?? null,
          staleDays: (asset.stale_days as number | null) ?? null,
          status: asset.status as AssetDetailResponse['asset']['status'],
          createdAt: (asset.created_at as string | null) ?? null,
        },
        fund,
        context: {
          portfolioTotal,
          assetPct: asset.status === 'sold' ? 0 : (balance != null && portfolioTotal > 0 ? (balance / portfolioTotal) * 100 : 0),
          classPct: portfolioTotal > 0 ? ((classTotal?.total_balance ?? 0) / portfolioTotal) * 100 : 0,
          classTotal: classTotal?.total_balance ?? 0,
        },
        lifecycle: {
          latestSale: latestSale ? {
            soldAt: latestSale.event_at,
            grossAmount: latestSale.gross_amount ?? null,
            qtySnapshot: latestSale.qty_snapshot ?? null,
            note: latestSale.note ?? null,
          } : null,
          events: lifecycleResult.results.map((event) => ({
            type: event.event_type,
            eventAt: event.event_at,
            grossAmount: event.gross_amount ?? null,
            qtySnapshot: event.qty_snapshot ?? null,
            note: event.note ?? null,
          })),
        },
        contributions: contribResult.results.map((r) => ({
          id: r.id,
          amount: r.amount,
          qty: r.qty ?? null,
          unitPrice: r.qty && r.qty > 0 ? r.amount / r.qty : null,
          contributedAt: r.contributed_at,
          note: r.note ?? null,
        })),
      }

      return c.json(response)
    } catch (err) {
      console.error('GET /api/assets/:id/detail', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.get('/api/assets/:id/history', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const id = Number(c.req.param('id'))
    const period = c.req.query('period') ?? '6mo'

    if (!Number.isInteger(id) || id < 1) {
      return c.json({ error: 'Invalid asset id' }, 400)
    }

    if (!ASSET_HISTORY_PERIODS.includes(period as AssetHistoryPeriod)) {
      return c.json({ error: 'Invalid period' }, 400)
    }

    try {
      const asset = await db.prepare(
        `SELECT ticker, quote_source FROM assets WHERE id = ? AND user_id = ? AND status != 'archived'`,
      ).bind(id, userId).first<{ ticker: string | null; quote_source: string | null }>()

      if (!asset) return c.json({ error: 'Asset not found' }, 404)

      const isbrapi = !asset.quote_source || asset.quote_source === 'BRAPI'
      if (!asset.ticker || !isbrapi) {
        return c.json({ error: 'History not available for this asset type' }, 422)
      }

      const baseUrl = c.env.BRAPI_BASE_URL ?? 'https://brapi.dev/api'
      const token = c.env.BRAPI_TOKEN
      const url = token
        ? `${baseUrl}/quote/${asset.ticker}?range=${period}&interval=1d&fundamental=false&dividends=false&token=${token}`
        : `${baseUrl}/quote/${asset.ticker}?range=${period}&interval=1d&fundamental=false&dividends=false`

      const resp = await fetch(url)
      if (!resp.ok) return c.json({ error: 'Failed to fetch history' }, 502)

      const data = await resp.json<{
        results?: {
          symbol: string
          historicalDataPrice?: { date: number; close: number }[]
        }[]
      }>()

      const result = data.results?.[0]
      if (!result?.historicalDataPrice?.length) {
        const response: AssetHistoryResponse = { ticker: asset.ticker, period: period as AssetHistoryPeriod, dataPoints: [] }
        return c.json(response)
      }

      const dataPoints = result.historicalDataPrice
        .filter((p) => p.close > 0)
        .map((p) => ({
          date: new Date(p.date * 1000).toISOString().slice(0, 10),
          close: p.close,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      const response: AssetHistoryResponse = { ticker: asset.ticker, period: period as AssetHistoryPeriod, dataPoints }
      return c.json(response)
    } catch (err) {
      console.error('GET /api/assets/:id/history', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })
}
