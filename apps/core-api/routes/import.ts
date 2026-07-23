import type { Hono } from 'hono'
import type {
  ImportAnalyzeInput,
  ImportAnalyzeResponse,
  ImportAnalyzeSuggestion,
  ImportAssetsInput,
  ImportAssetsResponse,
} from '../../../packages/contracts/import'
import { IMPORTABLE_STATUSES, VALID_CLASSES, VALID_INSTITUTIONS } from '../domain/assets'
import { recordOperationLog } from '../runtime/audit'
import type { AssetClass, ImportableAssetStatus, Institution } from '../domain/assets'
import type { Bindings, Variables } from '../types'

type ImportApp = Hono<{ Bindings: Bindings; Variables: Variables }>

type RegisterImportRoutesDeps = {
  refreshBrapiTicker: (db: D1Database, env: Bindings, ticker: string) => Promise<number | null>
}

export function registerImportRoutes(app: ImportApp, deps: RegisterImportRoutesDeps) {
  const { refreshBrapiTicker } = deps

  app.post('/api/import/analyze', async (c) => {
    if (!c.env.AI) {
      return c.json({ error: 'AI not available' }, 503)
    }

    let body: ImportAnalyzeInput
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    const items = body.items
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'items must be a non-empty array' }, 400)
    }

    const validClasses = [...VALID_CLASSES]
    const capped = items.slice(0, 50)
    const assetList = capped.map((item, index) =>
      `${index + 1}. "${item.name}"${item.ticker ? ` (ticker: ${item.ticker})` : ''}${item.institution ? ` — ${item.institution}` : ''}`,
    ).join('\n')

    const prompt = `You are classifying Brazilian financial assets for a portfolio app.
For each numbered asset below, return its most likely category.
Categories: ${validClasses.join(', ')}
Rules:
- Stocks and BDRs → ACAO
- Real estate funds (FII, XPML, HGLG, MXRF, etc.) → FII
- Investment funds (FI, FIC, FIA, multimercado) → FUNDO
- Fixed income (CDB, LCI, LCA, debenture) → RF
- Tesouro Direto (Selic, IPCA, Prefixado) → TESOURO
- Pension/retirement (PGBL, VGBL, previdência) → PREVIDENCIA
- Savings account (poupança) → POUPANCA
- Cofrinhos / reserva de emergência → COFRINHO

Assets:
${assetList}

Return ONLY a JSON array of objects: [{"index":1,"class":"ACAO","confidence":0.95}, {"index":2,"class":"FII","confidence":0.93}]
Do not include any explanation.`

    try {
      const aiRunner = c.env.AI as unknown as {
        run: (model: string, opts: { messages: { role: string; content: string }[] }) => Promise<{ response?: string }>
      }
      const result = await aiRunner.run('@cf/meta/llama-3.2-3b-instruct', {
        messages: [{ role: 'user', content: prompt }],
      })

      const raw = (result.response ?? '').trim()
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return c.json({ suggestions: [] } satisfies ImportAnalyzeResponse)
      }

      const parsed = JSON.parse(jsonMatch[0]) as Array<{ index: number; class: string; confidence: number }>
      const suggestions: ImportAnalyzeSuggestion[] = parsed
        .filter((item) => item.index >= 1 && item.index <= capped.length && validClasses.includes(item.class as AssetClass))
        .map((item) => ({
          index: item.index - 1,
          class: item.class as ImportAnalyzeSuggestion['class'],
          confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
        }))

      return c.json({ suggestions } satisfies ImportAnalyzeResponse)
    } catch (err) {
      console.error('POST /api/import/analyze', err)
      return c.json({ suggestions: [] } satisfies ImportAnalyzeResponse)
    }
  })

  app.post('/api/import', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB

    let body: ImportAssetsInput
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    const items = body.items
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Invalid request body', details: ["field 'items' must be a non-empty array"] }, 400)
    }

    const errors: string[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const purchaseDate = item.purchase_date ?? undefined

      if (!item.institution || !VALID_INSTITUTIONS.includes(item.institution as Institution)) {
        errors.push(`items[${i}]: invalid institution`)
      }
      if (item.institution === 'OUTROS' && !item.institution_name) {
        errors.push(`items[${i}]: institution_name required when institution is OUTROS`)
      }
      if (!item.class || !VALID_CLASSES.includes(item.class as AssetClass)) {
        errors.push(`items[${i}]: invalid class`)
      }
      if (!item.name) {
        errors.push(`items[${i}]: name is required`)
      }
      if (item.status !== undefined && !IMPORTABLE_STATUSES.includes(item.status as ImportableAssetStatus)) {
        errors.push(`items[${i}]: invalid status`)
      }
      if (purchaseDate) {
        const parsedPurchaseDate = new Date(purchaseDate)
        if (Number.isNaN(parsedPurchaseDate.getTime()) || parsedPurchaseDate.getTime() > Date.now()) {
          errors.push(`items[${i}]: invalid purchase_date`)
        }
      }
      if (item.ticker && item.qty === undefined) {
        errors.push(`items[${i}]: qty required when ticker is provided`)
      }
      if (!item.ticker && item.manual_balance === undefined) {
        errors.push(`items[${i}]: manual_balance required when ticker is not provided`)
      }
    }

    if (errors.length > 0) {
      return c.json({ error: 'Invalid request body', details: errors }, 400)
    }

    try {
      const stmts = items.map((item) => {
        const input = item
        const isManual = !input.ticker
        const quoteSource = input.ticker ? 'BRAPI' : null
        const status = IMPORTABLE_STATUSES.includes(input.status as ImportableAssetStatus)
          ? input.status as ImportableAssetStatus
          : 'active'

        return db.prepare(
          `INSERT INTO assets
             (user_id, institution, institution_name, class, name, ticker, qty, invested, manual_balance, balance_updated_at, status, quote_source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${isManual ? "datetime('now')" : 'NULL'}, ?, ?)
           RETURNING *`,
        ).bind(
          userId,
          input.institution,
          input.institution_name ?? null,
          input.class,
          input.name,
          input.ticker ?? null,
          input.qty ?? null,
          input.invested ?? null,
          isManual ? (input.manual_balance ?? 0) : null,
          status,
          quoteSource,
        )
      })

      const batchResults = await db.batch<Record<string, unknown>>(stmts)

      const contributionClasses = ['ACAO', 'FII', 'FUNDO', 'RF', 'TESOURO']
      const contributionStatements = []
      for (let index = 0; index < batchResults.length; index++) {
        const asset = batchResults[index].results[0]
        const item = items[index]
        const itemInvested = item.invested ?? undefined
        const itemPurchaseDate = item.purchase_date ?? undefined
        const itemQty = item.qty ?? undefined

        if (asset && itemInvested && itemInvested > 0 && contributionClasses.includes(item.class)) {
          contributionStatements.push(
            db.prepare(
              `INSERT INTO asset_contributions (asset_id, user_id, amount, contributed_at, qty, note)
               VALUES (?, ?, ?, ?, ?, NULL)`,
            ).bind((asset as Record<string, unknown>).id, userId, itemInvested, itemPurchaseDate ?? new Date().toISOString(), itemQty ?? null),
          )
        }
      }

      if (contributionStatements.length > 0) {
        try {
          await db.batch(contributionStatements)
        } catch {
          // Non-fatal.
        }
      }

      const importTickers = [...new Set(items
        .map((item) => item.ticker)
        .filter((ticker): ticker is string => typeof ticker === 'string' && ticker.length > 0))]

      if (importTickers.length > 0) {
        await Promise.all(importTickers.map((ticker) => refreshBrapiTicker(db, c.env, ticker)))
      }

      const createdAssets = batchResults.map((result) => result.results[0]).filter(Boolean)
      await recordOperationLog(db, {
        operationType: 'import_batch',
        status: 'completed',
        triggerSource: 'http',
        userId,
        summary: {
          itemsReceived: items.length,
          assetsCreated: createdAssets.length,
          tickersRefreshed: importTickers.length,
          contributionRowsCreated: contributionStatements.length,
          classes: [...new Set(items.map((item) => item.class).filter(Boolean))],
        },
      })
      const response: ImportAssetsResponse = {
        created: createdAssets.length,
        assets: createdAssets as ImportAssetsResponse['assets'],
      }
      return c.json(response, 201)
    } catch (err) {
      console.error('POST /api/import', err)
      await recordOperationLog(db, {
        operationType: 'import_batch',
        status: 'failed',
        triggerSource: 'http',
        userId,
        summary: { itemsReceived: items.length },
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      return c.json({ error: 'Internal server error' }, 500)
    }
  })
}
