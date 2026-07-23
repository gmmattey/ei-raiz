import type { Bindings } from '../core-api/types'
import { recordOperationLog } from '../core-api/runtime/audit'

export async function refreshQuotes(db: D1Database, env: Bindings): Promise<void> {
  const tickersResult = await db.prepare(
    `SELECT DISTINCT ticker FROM assets
     WHERE ticker IS NOT NULL
       AND (quote_source IS NULL OR quote_source = 'BRAPI')
       AND status IN ('active', 'redeeming')`,
  ).all<{ ticker: string }>()

  if (tickersResult.results.length === 0) {
    await recordOperationLog(db, {
      operationType: 'cron_brapi_quotes',
      status: 'skipped',
      triggerSource: 'scheduled',
      summary: { trackedTickers: 0, refreshedTickers: 0 },
    })
    return
  }

  const baseUrl = env.BRAPI_BASE_URL ?? 'https://brapi.dev/api'
  const token = env.BRAPI_TOKEN

  let refreshedTickers = 0
  const fetches = tickersResult.results.map(async (row) => {
    const url = token
      ? `${baseUrl}/quote/${row.ticker}?token=${token}`
      : `${baseUrl}/quote/${row.ticker}`

    try {
      const resp = await fetch(url)
      if (!resp.ok) return

      const data = await resp.json<{ results?: { symbol: string; regularMarketPrice: number }[] }>()
      if (!data.results?.[0]) return

      await db.prepare(
        `INSERT INTO quotes_cache (ticker, price, fetched_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(ticker) DO UPDATE SET price = excluded.price, fetched_at = excluded.fetched_at`,
      ).bind(data.results[0].symbol, data.results[0].regularMarketPrice).run()
      refreshedTickers += 1
    } catch {
      // Non-fatal: skip this ticker.
    }
  })

  await Promise.all(fetches)
  await recordOperationLog(db, {
    operationType: 'cron_brapi_quotes',
    status: 'completed',
    triggerSource: 'scheduled',
    summary: {
      trackedTickers: tickersResult.results.length,
      refreshedTickers,
      cacheIntegrity: refreshedTickers <= tickersResult.results.length,
    },
  })
}
