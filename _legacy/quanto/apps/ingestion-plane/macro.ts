import type { Bindings } from '../core-api/types'
import { recordOperationLog } from '../core-api/runtime/audit'

export async function refreshMacroIndicators(db: D1Database, env: Bindings): Promise<void> {
  const baseUrl = env.BRAPI_BASE_URL ?? 'https://brapi.dev/api'
  const token = env.BRAPI_TOKEN
  const symbols = 'cdi,selic,ipca12m'
  const url = token
    ? `${baseUrl}/v2/macro/latest?symbols=${symbols}&token=${token}`
    : `${baseUrl}/v2/macro/latest?symbols=${symbols}`

  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      await recordOperationLog(db, {
        operationType: 'cron_macro',
        status: 'failed',
        triggerSource: 'scheduled',
        errorMessage: `HTTP ${resp.status}`,
      })
      return
    }

    const data = await resp.json<{
      results?: {
        slug: string
        latestValue: number
        latestDate: string
      }[]
    }>()

    if (!data.results?.length) {
      await recordOperationLog(db, {
        operationType: 'cron_macro',
        status: 'skipped',
        triggerSource: 'scheduled',
        summary: { indicatorsUpserted: 0 },
      })
      return
    }

    const stmts = data.results
      .filter((row) => ['cdi', 'selic', 'ipca12m'].includes(row.slug))
      .map((row) =>
        db.prepare(
          `INSERT INTO macro_cache (slug, value, reference_date, fetched_at)
           VALUES (?, ?, ?, datetime('now'))
           ON CONFLICT(slug) DO UPDATE
             SET value          = excluded.value,
                 reference_date = excluded.reference_date,
                 fetched_at     = excluded.fetched_at`,
        ).bind(row.slug, row.latestValue, row.latestDate ?? null),
      )

    if (stmts.length > 0) {
      await db.batch(stmts)
    }
    await recordOperationLog(db, {
      operationType: 'cron_macro',
      status: 'completed',
      triggerSource: 'scheduled',
      summary: { indicatorsUpserted: stmts.length },
    })
  } catch {
    await recordOperationLog(db, {
      operationType: 'cron_macro',
      status: 'failed',
      triggerSource: 'scheduled',
      errorMessage: 'fetch_failed',
    })
    // Non-fatal: stale data is acceptable for macro indicators.
  }
}
