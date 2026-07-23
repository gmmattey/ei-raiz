import type { Hono } from 'hono'
import type { CreateSnapshotResponse, PortfolioHistory } from '../../../packages/contracts/history'
import type { Bindings, Variables } from '../types'

type HistoryApp = Hono<{ Bindings: Bindings; Variables: Variables }>

type RegisterHistoryRoutesDeps = {
  upsertSnapshot: (
    db: D1Database,
    userId: number,
  ) => Promise<{ month: string; total: number; invested: number; created: boolean }>
}

export function registerHistoryRoutes(app: HistoryApp, deps: RegisterHistoryRoutesDeps) {
  const { upsertSnapshot } = deps

  app.get('/api/history', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB

    try {
      const result = await db.prepare(
        `SELECT month, total, invested, created_at
         FROM snapshots
         WHERE user_id = ?
         ORDER BY month DESC`,
      ).bind(userId).all<{ month: string; total: number; invested: number; created_at: string }>()

      const snapshots: PortfolioHistory = result.results.map((row) => {
        const gain = row.invested > 0 ? row.total - row.invested : 0
        const gainPct = row.invested > 0 ? ((row.total / row.invested) - 1) * 100 : 0
        return {
          month: row.month,
          total: row.total,
          invested: row.invested,
          gain,
          gainPct,
        }
      })

      return c.json(snapshots)
    } catch (err) {
      console.error('GET /api/history', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.post('/api/snapshot', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB

    try {
      const result: CreateSnapshotResponse = await upsertSnapshot(db, userId)
      return c.json(result, 200)
    } catch (err) {
      console.error('POST /api/snapshot', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })
}
