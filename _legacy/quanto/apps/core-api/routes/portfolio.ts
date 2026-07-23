import type { Hono } from 'hono'
import type {
  AllocationSlice,
  AssetClass,
  AssetInstitution,
  AssetStatus,
  BenchmarksSummary,
  FreshnessInstitutionSummary,
  GoodsSummary,
  PortfolioAssetSummary,
  PortfolioSummary,
  QuoteHealth,
} from '../../../packages/contracts/portfolio'
import { calculateGrossWealth, calculatePerformance, summarizeGoods } from '../../../packages/domain'
import type { Bindings, Variables } from '../types'

type PortfolioApp = Hono<{ Bindings: Bindings; Variables: Variables }>

type RegisterPortfolioRouteDeps = {
  hasTable: (db: D1Database, tableName: string) => Promise<boolean>
  refreshBrapiTicker: (db: D1Database, env: Bindings, ticker: string) => Promise<number | null>
}

type AssetRow = {
  id: number
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
  created_at: string | null
  status: AssetStatus
  quote_source: string | null
  price: number | null
  quote_fetched_at: string | null
  balance: number | null
  stale_days: number | null
}

export function registerPortfolioRoutes(app: PortfolioApp, deps: RegisterPortfolioRouteDeps) {
  const { hasTable, refreshBrapiTicker } = deps

  app.get('/api/portfolio', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB

    try {
      const staleTickersResult = await db
        .prepare(
          `SELECT DISTINCT a.ticker
           FROM assets a
           LEFT JOIN quotes_cache q ON q.ticker = a.ticker
           WHERE a.user_id = ?
             AND a.ticker IS NOT NULL
             AND (a.quote_source IS NULL OR a.quote_source = 'BRAPI')
             AND a.status IN ('active', 'redeeming')
             AND (q.ticker IS NULL OR (julianday('now') - julianday(q.fetched_at)) * 1440 > 15)`,
        )
        .bind(userId)
        .all<{ ticker: string }>()

      let quoteRefreshSucceeded = 0
      if (staleTickersResult.results.length > 0) {
        const fetches = staleTickersResult.results.map((r) => refreshBrapiTicker(db, c.env, r.ticker))
        const refreshResults = await Promise.all(fetches)
        quoteRefreshSucceeded = refreshResults.filter((price) => typeof price === 'number').length
      }

      const user = await db
        .prepare(`SELECT name FROM users WHERE id = ?`)
        .bind(userId)
        .first<{ name: string | null }>()

      const summary = await db
        .prepare(`SELECT * FROM vw_portfolio_summary WHERE user_id = ?`)
        .bind(userId)
        .first<{
          asset_count: number
          total_invested: number
          total_balance: number
          gain: number
        }>()

      const latestQuote = await db
        .prepare(
          `SELECT MAX(q.fetched_at) AS fetched_at
           FROM quotes_cache q
           INNER JOIN assets a ON a.ticker = q.ticker
           WHERE a.user_id = ? AND a.status IN ('active', 'redeeming')`,
        )
        .bind(userId)
        .first<{ fetched_at: string | null }>()

      const quoteProviderSummary = await db
        .prepare(
          `SELECT
             COUNT(DISTINCT a.ticker) AS tracked_tickers,
             COUNT(DISTINCT CASE WHEN q.ticker IS NOT NULL THEN a.ticker END) AS cached_tickers,
             COUNT(DISTINCT CASE WHEN q.ticker IS NULL THEN a.ticker END) AS missing_tickers,
             COUNT(DISTINCT CASE
               WHEN q.ticker IS NOT NULL
                AND (julianday('now') - julianday(q.fetched_at)) * 1440 > 15
               THEN a.ticker
             END) AS stale_tickers,
             MAX(q.fetched_at) AS latest_fetched_at
           FROM assets a
           LEFT JOIN quotes_cache q ON q.ticker = a.ticker
           WHERE a.user_id = ?
             AND a.ticker IS NOT NULL
             AND (a.quote_source IS NULL OR a.quote_source = 'BRAPI')
             AND a.status IN ('active', 'redeeming')`,
        )
        .bind(userId)
        .first<{
          tracked_tickers: number
          cached_tickers: number
          missing_tickers: number
          stale_tickers: number
          latest_fetched_at: string | null
        }>()

      const byInstResult = await db
        .prepare(
          `SELECT institution, institution_name, display_name, asset_count, total_balance
           FROM vw_allocation_by_institution
           WHERE user_id = ?
           ORDER BY total_balance DESC`,
        )
        .bind(userId)
        .all<{
          institution: AssetInstitution
          institution_name: string | null
          display_name: string
          asset_count: number
          total_balance: number
        }>()

      const byClassResult = await db
        .prepare(
          `SELECT class, asset_count, total_balance
           FROM vw_allocation_by_class
           WHERE user_id = ?
           ORDER BY total_balance DESC`,
        )
        .bind(userId)
        .all<{ class: AssetClass; asset_count: number; total_balance: number }>()

      const freshnessResult = await db
        .prepare(
          `SELECT institution, institution_name, display_name, total_manual,
                  fresh_count, stale_count, oldest_stale_name, oldest_stale_days
           FROM vw_freshness
           WHERE user_id = ?`,
        )
        .bind(userId)
        .all<{
          institution: AssetInstitution
          institution_name: string | null
          display_name: string
          total_manual: number
          fresh_count: number
          stale_count: number
          oldest_stale_name: string | null
          oldest_stale_days: number | null
        }>()

      const activeAssets = await db
        .prepare(
          `SELECT
             a.id, a.institution, a.institution_name, a.class, a.name, a.display_name,
             a.ticker, a.qty, a.invested, a.manual_balance,
             a.balance_updated_at, a.status, a.quote_source, a.created_at,
             q.price, q.fetched_at AS quote_fetched_at,
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
           WHERE a.user_id = ? AND a.status = 'active'
           ORDER BY a.institution, a.class, a.name`,
        )
        .bind(userId)
        .all<AssetRow>()

      const redeemingAssets = await db
        .prepare(
          `SELECT
             a.id, a.institution, a.institution_name, a.class, a.name, a.display_name,
             a.ticker, a.qty, a.invested, a.manual_balance,
             a.balance_updated_at, a.status, a.quote_source, a.created_at,
             q.price, q.fetched_at AS quote_fetched_at,
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
           WHERE a.user_id = ? AND a.status = 'redeeming'
           ORDER BY a.institution, a.class, a.name`,
        )
        .bind(userId)
        .all<AssetRow>()

      const contributionsEnabled = await hasTable(db, 'asset_contributions')
      const contributionSummary = contributionsEnabled
        ? await db
            .prepare(
              `SELECT asset_id,
                      COUNT(*) AS contribution_count,
                      MIN(contributed_at) AS first_contribution_at,
                      MAX(contributed_at) AS last_contribution_at
               FROM asset_contributions
               WHERE user_id = ?
               GROUP BY asset_id`,
            )
            .bind(userId)
            .all<{
              asset_id: number
              contribution_count: number
              first_contribution_at: string | null
              last_contribution_at: string | null
            }>()
        : { results: [] as {
            asset_id: number
            contribution_count: number
            first_contribution_at: string | null
            last_contribution_at: string | null
          }[] }

      const contributionMap = new Map(
        contributionSummary.results.map((row) => [
          row.asset_id,
          {
            count: row.contribution_count ?? 0,
            firstAt: row.first_contribution_at ?? null,
            lastAt: row.last_contribution_at ?? null,
          },
        ]),
      )

      function mapAsset(row: AssetRow): PortfolioAssetSummary {
        const balance = row.balance
        const invested = row.invested ?? null
        const { gain, gainPct } = calculatePerformance(balance, invested)
        const contrib = contributionMap.get(row.id)
        const refDate = contrib?.firstAt ?? row.created_at ?? null
        return {
          id: row.id,
          institution: row.institution,
          institutionName: row.institution_name ?? null,
          class: row.class,
          name: row.name,
          displayName: row.display_name ?? null,
          ticker: row.ticker ?? null,
          qty: row.qty ?? null,
          price: row.price ?? null,
          invested: row.invested ?? null,
          balance,
          gain,
          gainPct,
          mode: row.ticker ? 'auto' : 'manual',
          quoteSource: (row.quote_source === 'BRAPI' || row.quote_source === 'CVM')
            ? row.quote_source
            : (row.ticker ? 'BRAPI' : null),
          quoteFetchedAt: row.quote_fetched_at ?? null,
          status: row.status,
          balanceUpdatedAt: row.balance_updated_at ?? null,
          staleDays: row.stale_days ?? null,
          createdAt: row.created_at ?? null,
          refDate,
          contributionCount: contrib?.count ?? 0,
          firstContributionAt: contrib?.firstAt ?? null,
          lastContributionAt: contrib?.lastAt ?? null,
        }
      }

      const totalBalance = summary?.total_balance ?? 0
      const totalInvested = summary?.total_invested ?? 0
      const gainItems = activeAssets.results.filter((r) => r.balance != null && r.invested != null && r.invested > 0)
      const gain = gainItems.length > 0 ? gainItems.reduce((s, r) => s + (r.balance! - r.invested!), 0) : null
      const gainPct = gain != null && totalInvested > 0 ? (gain / totalInvested) * 100 : null

      const freshnessRows = freshnessResult.results
      const freshnessOkTotal = freshnessRows.reduce((s, r) => s + (r.fresh_count ?? 0), 0)
      const freshnessTotalManual = freshnessRows.reduce((s, r) => s + (r.total_manual ?? 0), 0)

      const staleAssetsByInst: Record<string, { id: number; name: string; daysAgo: number }[]> = {}
      for (const asset of activeAssets.results) {
        if (!asset.ticker && asset.stale_days !== null && asset.stale_days > 30) {
          const key = `${asset.institution}::${asset.institution_name ?? ''}`
          if (!staleAssetsByInst[key]) staleAssetsByInst[key] = []
          staleAssetsByInst[key].push({ id: asset.id, name: asset.name, daysAgo: asset.stale_days })
        }
      }

      const freshnessInst: FreshnessInstitutionSummary[] = freshnessRows.map((r) => {
        const key = `${r.institution}::${r.institution_name ?? ''}`
        return {
          institution: r.institution,
          ...(r.institution_name ? { institutionName: r.institution_name } : {}),
          ok: r.fresh_count ?? 0,
          total: r.total_manual ?? 0,
          staleAssets: staleAssetsByInst[key] ?? [],
        }
      })

      const byInstitution: AllocationSlice[] = byInstResult.results.map((r) => ({
        key: `${r.institution}::${r.institution_name ?? ''}`,
        label: r.display_name,
        total: r.total_balance ?? 0,
        pct: totalBalance > 0 ? ((r.total_balance ?? 0) / totalBalance) * 100 : 0,
      }))

      const byClass: AllocationSlice[] = byClassResult.results.map((r) => ({
        key: r.class,
        label: r.class,
        total: r.total_balance ?? 0,
        pct: totalBalance > 0 ? ((r.total_balance ?? 0) / totalBalance) * 100 : 0,
      }))

      let benchmarks: BenchmarksSummary = { cdi: null, selic: null, ipca12m: null, fetchedAt: null }
      try {
        const macroRows = await db
          .prepare(`SELECT slug, value, reference_date, fetched_at FROM macro_cache`)
          .all<{ slug: string; value: number; reference_date: string | null; fetched_at: string }>()
        const macroMap = Object.fromEntries(macroRows.results.map((r) => [r.slug, r]))
        benchmarks = {
          cdi: macroMap.cdi ? { value: macroMap.cdi.value, referenceDate: macroMap.cdi.reference_date } : null,
          selic: macroMap.selic ? { value: macroMap.selic.value, referenceDate: macroMap.selic.reference_date } : null,
          ipca12m: macroMap.ipca12m ? { value: macroMap.ipca12m.value, referenceDate: macroMap.ipca12m.reference_date } : null,
          fetchedAt: macroMap.cdi?.fetched_at ?? null,
        }
      } catch {
        // Non-fatal
      }

      let goodsSummary: GoodsSummary | null = null
      let grossWealth: number | null = null
      try {
        const goodsRows = await db
          .prepare(`SELECT type, SUM(estimated_value) AS subtotal FROM goods WHERE user_id = ? AND status = 'active' GROUP BY type`)
          .bind(userId)
          .all<{ type: 'FGTS' | 'IMOVEL' | 'VEICULO'; subtotal: number }>()
        goodsSummary = summarizeGoods(goodsRows.results.map((row) => ({
          type: row.type,
          estimatedValue: row.subtotal ?? 0,
        })))
        grossWealth = calculateGrossWealth(totalBalance, goodsSummary.total)
      } catch {
        // Non-fatal
      }

      const quoteProvider: QuoteHealth = {
        name: 'BRAPI',
        marketTimeZone: 'America/Sao_Paulo',
        hasTokenConfigured: !!c.env.BRAPI_TOKEN,
        trackedTickers: quoteProviderSummary?.tracked_tickers ?? 0,
        cachedTickers: quoteProviderSummary?.cached_tickers ?? 0,
        missingTickers: quoteProviderSummary?.missing_tickers ?? 0,
        staleTickers: quoteProviderSummary?.stale_tickers ?? 0,
        latestFetchedAt: quoteProviderSummary?.latest_fetched_at ?? null,
        refreshAttempted: staleTickersResult.results.length,
        refreshSucceeded: quoteRefreshSucceeded,
        status: (quoteProviderSummary?.tracked_tickers ?? 0) === 0
          ? 'idle'
          : (quoteProviderSummary?.missing_tickers ?? 0) > 0
            ? 'degraded'
            : (quoteProviderSummary?.stale_tickers ?? 0) > 0
              ? 'stale'
              : 'ok',
      }

      const response: PortfolioSummary = {
        userName: user?.name ?? null,
        total: totalBalance,
        invested: totalInvested,
        gain,
        gainPct,
        quotesFetchedAt: latestQuote?.fetched_at ?? null,
        quoteProvider,
        benchmarks,
        goods: goodsSummary,
        grossWealth,
        freshness: {
          ok: freshnessOkTotal,
          total: freshnessTotalManual,
          byInstitution: freshnessInst,
        },
        byInstitution,
        byClass,
        assets: activeAssets.results.map(mapAsset),
        redeeming: redeemingAssets.results.map(mapAsset),
      }

      return c.json(response)
    } catch (err) {
      console.error('GET /api/portfolio', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })
}
