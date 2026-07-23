import type { Hono } from 'hono'
import type { FundSearchResult } from '../../../packages/contracts/funds'
import type { HealthResponse } from '../../../packages/contracts/public'
import type { Bindings, Variables } from '../types'

type PublicApp = Hono<{ Bindings: Bindings; Variables: Variables }>

type RegisterPublicRoutesDeps = {
  searchFunds: (db: D1Database, query: string) => Promise<FundSearchResult[]>
}

export function registerPublicRoutes(app: PublicApp, deps: RegisterPublicRoutesDeps) {
  const { searchFunds } = deps

  app.get('/api/health', (c) => {
    const response: HealthResponse = { status: 'ok', timestamp: new Date().toISOString() }
    return c.json(response)
  })

  app.get('/api/funds/search', async (c) => {
    const q = c.req.query('q')?.trim()
    if (!q || q.length < 3) return c.json({ results: [] })

    try {
      const results = await searchFunds(c.env.DB, q)
      return c.json({ results })
    } catch (err) {
      console.error('GET /api/funds/search', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })
}
