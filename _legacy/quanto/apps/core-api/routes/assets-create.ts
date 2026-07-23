import type { Hono } from 'hono'
import type { CreateAssetInput, CreateAssetResponse } from '../../../packages/contracts/asset'
import { VALID_CLASSES, VALID_INSTITUTIONS } from '../domain/assets'
import type { AssetClass, Institution } from '../domain/assets'
import type { Bindings, Variables } from '../types'

type AssetCreateApp = Hono<{ Bindings: Bindings; Variables: Variables }>

type RegisterAssetCreateRoutesDeps = {
  generateDisplayName: (ai: unknown, db: D1Database, assetId: number, rawName: string) => Promise<void>
  refreshBrapiTicker: (db: D1Database, env: Bindings, ticker: string) => Promise<number | null>
}

export function registerAssetCreateRoutes(app: AssetCreateApp, deps: RegisterAssetCreateRoutesDeps) {
  const { generateDisplayName, refreshBrapiTicker } = deps

  app.post('/api/assets', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB

    let body: CreateAssetInput
    try {
      body = await c.req.json<CreateAssetInput>()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    const errors: string[] = []
    const institution = body.institution as string | undefined
    const assetClass = body.class as string | undefined
    const name = body.name as string | undefined
    const institutionName = body.institution_name as string | undefined
    const ticker = body.ticker as string | undefined
    const cvmCnpj = body.cvm_cnpj as string | undefined
    const qty = body.qty as number | undefined
    const initialBalance = body.initial_balance as number | undefined
    const invested = body.invested as number | undefined
    const manualBalance = body.manual_balance as number | undefined
    const purchaseDate = body.purchase_date as string | undefined

    if (!institution) {
      errors.push("field 'institution' is required")
    } else if (!VALID_INSTITUTIONS.includes(institution as Institution)) {
      errors.push(`field 'institution' must be one of: ${VALID_INSTITUTIONS.join(', ')}`)
    }

    if (institution === 'OUTROS' && !institutionName) {
      errors.push("field 'institution_name' is required when institution is OUTROS")
    }

    if (!assetClass) {
      errors.push("field 'class' is required")
    } else if (!VALID_CLASSES.includes(assetClass as AssetClass)) {
      errors.push(`field 'class' must be one of: ${VALID_CLASSES.join(', ')}`)
    }

    if (!name) errors.push("field 'name' is required")
    if (cvmCnpj && ticker) errors.push("fields 'cvm_cnpj' and 'ticker' are mutually exclusive")
    if (cvmCnpj && qty === undefined && initialBalance === undefined) {
      errors.push("field 'qty' or 'initial_balance' is required when 'cvm_cnpj' is provided")
    }
    if (ticker && qty === undefined) {
      errors.push("field 'qty' is required when 'ticker' is provided")
    }
    if (!ticker && !cvmCnpj && manualBalance === undefined) {
      errors.push("field 'manual_balance' is required when 'ticker' is not provided")
    }
    if (purchaseDate !== undefined) {
      const ts = Date.parse(purchaseDate)
      if (typeof purchaseDate !== 'string' || Number.isNaN(ts) || ts > Date.now() + 60_000) {
        errors.push("field 'purchase_date' must be a valid past date")
      }
    }

    if (errors.length > 0) {
      return c.json({ error: 'Invalid request body', details: errors }, 400)
    }

    try {
      let resolvedQty = qty ?? null
      let cvmFallbackToManual = false

      if (cvmCnpj && initialBalance !== undefined && qty === undefined) {
        const cached = await db.prepare(`SELECT price FROM quotes_cache WHERE ticker = ?`)
          .bind(cvmCnpj)
          .first<{ price: number }>()

        if (cached && cached.price > 0) {
          resolvedQty = initialBalance / cached.price
        } else {
          cvmFallbackToManual = true
        }
      }

      const effectiveTicker = cvmFallbackToManual ? null : (cvmCnpj ?? ticker ?? null)
      const quoteSource = cvmFallbackToManual ? null : (cvmCnpj ? 'CVM' : (ticker ? 'BRAPI' : null))
      const isManual = !effectiveTicker
      const storedManualBalance = isManual ? (cvmFallbackToManual ? (initialBalance ?? 0) : (manualBalance ?? 0)) : null

      const asset = await db.prepare(
        `INSERT INTO assets
           (user_id, institution, institution_name, class, name, ticker, qty, invested, manual_balance, balance_updated_at, status, quote_source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${isManual ? "datetime('now')" : 'NULL'}, 'active', ?)
         RETURNING *`,
      ).bind(
        userId,
        institution,
        institutionName ?? null,
        assetClass,
        name,
        effectiveTicker,
        resolvedQty,
        invested ?? null,
        storedManualBalance,
        quoteSource,
      ).first<Record<string, unknown>>()

      if (!asset) throw new Error('Insert returned no row')

      if (c.env.AI && name) {
        generateDisplayName(c.env.AI, db, asset.id as number, name).catch(() => {})
      }

      const contributionClasses = ['ACAO', 'FII', 'FUNDO', 'RF', 'TESOURO']
      if (invested && invested > 0 && contributionClasses.includes(assetClass as string)) {
        try {
          await db.prepare(
            `INSERT INTO asset_contributions (asset_id, user_id, amount, contributed_at, qty, note)
             VALUES (?, ?, ?, ?, ?, NULL)`,
          ).bind(
            asset.id as number,
            userId,
            invested,
            purchaseDate ?? new Date().toISOString(),
            effectiveTicker ? (resolvedQty ?? null) : null,
          ).run()
        } catch {
          // Non-fatal: contribution can still be added manually.
        }
      }

      if (ticker && !cvmCnpj) {
        await refreshBrapiTicker(db, c.env, ticker)
      }

      return c.json(asset as unknown as CreateAssetResponse, 201)
    } catch (err) {
      console.error('POST /api/assets', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })
}
