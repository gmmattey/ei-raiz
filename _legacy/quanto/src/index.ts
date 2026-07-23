import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { refreshQuotes } from '../apps/ingestion-plane/brapi'
import { refreshMacroIndicators } from '../apps/ingestion-plane/macro'
import { runMonthlySnapshot, upsertSnapshot } from '../apps/ingestion-plane/snapshots'
import { refreshCvmQuotes, refreshCvmFundsCache, searchFunds } from './cvm'
import { hashPassword, verifyPassword, signToken, verifyToken } from './auth'
import { generateDisplayName } from '../apps/core-api/ai/display-name'
import { refreshBrapiTicker } from '../apps/core-api/market/brapi'
import { hasTable } from '../apps/core-api/runtime/db'
import { insertLifecycleEvent } from '../apps/core-api/runtime/lifecycle'
import type { Bindings, Variables } from '../apps/core-api/types'
import { registerAiAnalysisRoutes } from '../apps/core-api/routes/ai-analysis'
import { registerAssetCreateRoutes } from '../apps/core-api/routes/assets-create'
import { registerAuthMiddleware, registerAuthRoutes } from '../apps/core-api/auth'
import { registerAssetDetailRoutes } from '../apps/core-api/routes/assets-detail'
import { registerAssetMutationRoutes } from '../apps/core-api/routes/assets-mutations'
import { registerGoodsRoutes } from '../apps/core-api/routes/goods'
import { registerHistoryRoutes } from '../apps/core-api/routes/history'
import { registerImportRoutes } from '../apps/core-api/routes/import'
import { registerPortfolioRoutes } from '../apps/core-api/routes/portfolio'
import { registerPublicRoutes } from '../apps/core-api/routes/public'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', cors())

registerPublicRoutes(app, { searchFunds })

registerAuthRoutes(app, { hashPassword, verifyPassword, signToken, verifyToken })
registerAuthMiddleware(app, { verifyToken })

registerPortfolioRoutes(app, { hasTable, refreshBrapiTicker })
registerAssetCreateRoutes(app, { generateDisplayName, refreshBrapiTicker })
registerHistoryRoutes(app, { upsertSnapshot })
registerImportRoutes(app, { refreshBrapiTicker })

registerAssetMutationRoutes(app, {
  hasTable,
  insertLifecycleEvent,
  generateDisplayName,
})
registerAssetDetailRoutes(app, { hasTable, refreshBrapiTicker })
registerGoodsRoutes(app)
registerAiAnalysisRoutes(app)

// ── Export ──────────────────────────────────────────────────────────────────

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    if (event.cron === '0 12 * * *') {
      ctx.waitUntil(Promise.all([refreshQuotes(env.DB, env), refreshMacroIndicators(env.DB, env)]))
    } else if (event.cron === '0 12 1 * *') {
      ctx.waitUntil(runMonthlySnapshot(env.DB))
    } else if (event.cron === '0 22 * * 1-5') {
      ctx.waitUntil(refreshCvmQuotes(env.DB))
    } else if (event.cron === '0 23 2 * *') {
      ctx.waitUntil(refreshCvmFundsCache(env.DB))
    }
  },
}
