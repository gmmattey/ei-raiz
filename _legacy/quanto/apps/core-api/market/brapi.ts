import type { Bindings } from '../types'

export async function refreshBrapiTicker(
  db: D1Database,
  env: Bindings,
  ticker: string,
): Promise<number | null> {
  const baseUrl = env.BRAPI_BASE_URL ?? 'https://brapi.dev/api'
  const token = env.BRAPI_TOKEN
  const url = token
    ? `${baseUrl}/quote/${ticker}?token=${token}`
    : `${baseUrl}/quote/${ticker}`

  try {
    const resp = await fetch(url)
    if (!resp.ok) return null

    const data = await resp.json<{ results?: { symbol: string; regularMarketPrice: number }[] }>()
    const row = data.results?.[0]
    if (!row || typeof row.regularMarketPrice !== 'number') return null

    await db.prepare(
      `INSERT INTO quotes_cache (ticker, price, fetched_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(ticker) DO UPDATE SET price = excluded.price, fetched_at = excluded.fetched_at`,
    ).bind(row.symbol, row.regularMarketPrice).run()

    return row.regularMarketPrice
  } catch {
    return null
  }
}
