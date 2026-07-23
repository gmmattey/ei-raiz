import type { Hono } from 'hono'
import type { UpdateAssetInput, UpdateAssetResponse } from '../../../packages/contracts/asset'
import type {
  ArchiveAssetResponse,
  AssetContributionListResponse,
  CancelAssetExitInput,
  CancelAssetExitResponse,
  CompleteAssetSaleInput,
  CompleteAssetSaleResponse,
  CreateAssetContributionInput,
  CreateAssetContributionResponse,
  DeleteAssetContributionResponse,
  StartAssetExitInput,
  StartAssetExitResponse,
} from '../../../packages/contracts/detail'
import { VALID_CLASSES, VALID_INSTITUTIONS, VALID_STATUSES } from '../domain/assets'
import type { AssetClass, AssetLifecycleEventType, AssetStatus, Institution } from '../domain/assets'
import type { Bindings, Variables } from '../types'

type AssetMutationsApp = Hono<{ Bindings: Bindings; Variables: Variables }>

type RegisterAssetMutationRoutesDeps = {
  hasTable: (db: D1Database, tableName: string) => Promise<boolean>
  insertLifecycleEvent: (
    db: D1Database,
    payload: {
      assetId: number
      userId: number
      eventType: AssetLifecycleEventType
      eventAt: string
      grossAmount?: number | null
      qtySnapshot?: number | null
      note?: string | null
    },
  ) => Promise<void>
  generateDisplayName: (ai: unknown, db: D1Database, assetId: number, rawName: string) => Promise<void>
}

export function registerAssetMutationRoutes(app: AssetMutationsApp, deps: RegisterAssetMutationRoutesDeps) {
  const { hasTable, insertLifecycleEvent, generateDisplayName } = deps

  app.put('/api/assets/:id', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id < 1) {
      return c.json({ error: 'Invalid asset id' }, 400)
    }

    let body: UpdateAssetInput
    try {
      body = await c.req.json<UpdateAssetInput>()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    const existing = await db
      .prepare(`SELECT id, status FROM assets WHERE id = ? AND user_id = ? AND status != 'archived'`)
      .bind(id, userId)
      .first<{ id: number; status: AssetStatus }>()

    if (!existing) {
      return c.json({ error: 'Asset not found' }, 404)
    }

    const allowedFields: Array<keyof UpdateAssetInput> = [
      'institution', 'institution_name', 'class', 'name',
      'ticker', 'qty', 'invested', 'manual_balance', 'status', 'quote_source',
    ]

    const setClauses: string[] = []
    const bindings: unknown[] = []
    const errors: string[] = []
    let attemptedSoldViaPut = false

    for (const key of allowedFields) {
      if (!(key in body)) continue

      const value = body[key]

      if (key === 'institution' && value !== null) {
        if (!VALID_INSTITUTIONS.includes(value as Institution)) {
          errors.push(`field 'institution' must be one of: ${VALID_INSTITUTIONS.join(', ')}`)
          continue
        }
      }

      if (key === 'class' && value !== null) {
        if (!VALID_CLASSES.includes(value as AssetClass)) {
          errors.push(`field 'class' must be one of: ${VALID_CLASSES.join(', ')}`)
          continue
        }
      }

      if (key === 'status' && value !== null) {
        if (value === 'sold') {
          attemptedSoldViaPut = true
          continue
        }
        if (!VALID_STATUSES.includes(value as AssetStatus)) {
          errors.push(`field 'status' must be one of: ${VALID_STATUSES.join(', ')}`)
          continue
        }
      }

      setClauses.push(`${key} = ?`)
      bindings.push(value ?? null)

      if (key === 'manual_balance') {
        setClauses.push(`balance_updated_at = datetime('now')`)
      }
    }

    if (errors.length > 0) {
      return c.json({ error: 'Invalid request body', details: errors }, 400)
    }

    if (attemptedSoldViaPut) {
      return c.json({ error: 'sale must be completed through POST /api/assets/:id/sale' }, 422)
    }

    if (existing.status === 'sold') {
      const statusIdx = setClauses.findIndex((clause) => clause === 'status = ?')
      const nextStatus = statusIdx >= 0 ? bindings[statusIdx] : null
      if (setClauses.some((clause) => clause !== 'status = ?') || nextStatus !== 'archived') {
        return c.json({ error: 'Sold assets are read-only. Archive them if you want to hide the record.' }, 422)
      }
    }

    const investedIdx = setClauses.findIndex((clause) => clause === 'invested = ?')
    if (investedIdx !== -1) {
      try {
        const hasContribs = await db.prepare(
          `SELECT COUNT(*) AS n FROM asset_contributions WHERE asset_id = ? AND user_id = ?`,
        ).bind(id, userId).first<{ n: number }>()

        if ((hasContribs?.n ?? 0) > 0) {
          setClauses.splice(investedIdx, 1)
          bindings.splice(investedIdx, 1)
        }
      } catch {
        // Non-fatal: proceed with the update as-is.
      }
    }

    if (setClauses.length === 0) {
      return c.json({ error: 'No fields to update' }, 400)
    }

    bindings.push(id, userId)

    try {
      const updated = await db.prepare(
        `UPDATE assets SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ? RETURNING *`,
      ).bind(...bindings).first<Record<string, unknown>>()

      if (!updated) {
        return c.json({ error: 'Asset not found' }, 404)
      }

      if (c.env.AI && 'name' in body && body.name) {
        generateDisplayName(c.env.AI, db, id, body.name as string).catch(() => {})
      }

      return c.json(updated as unknown as UpdateAssetResponse, 200)
    } catch (err) {
      console.error('PUT /api/assets/:id', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.delete('/api/assets/:id', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id < 1) {
      return c.json({ error: 'Invalid asset id' }, 400)
    }

    try {
      const result = await db.prepare(
        `UPDATE assets SET status = 'archived' WHERE id = ? AND user_id = ? AND status != 'archived' RETURNING id`,
      ).bind(id, userId).first<{ id: number }>()

      if (!result) {
        return c.json({ error: 'Asset not found' }, 404)
      }

      const response: ArchiveAssetResponse = { archived: true }
      return c.json(response, 200)
    } catch (err) {
      console.error('DELETE /api/assets/:id', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.post('/api/assets/:id/exit/start', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id < 1) {
      return c.json({ error: 'Invalid asset id' }, 400)
    }

    let body: StartAssetExitInput
    try {
      body = await c.req.json<StartAssetExitInput>()
    } catch {
      body = {}
    }

    try {
      const asset = await db.prepare(
        `SELECT id, class, status FROM assets WHERE id = ? AND user_id = ? AND status != 'archived'`,
      ).bind(id, userId).first<{ id: number; class: AssetClass; status: AssetStatus }>()

      if (!asset) return c.json({ error: 'Asset not found' }, 404)
      if (!['ACAO', 'FII'].includes(asset.class)) {
        return c.json({ error: 'Exit flow is only available for ACAO and FII' }, 422)
      }
      if (asset.status !== 'active') {
        return c.json({ error: 'Only active assets can start exit flow' }, 422)
      }

      const startedAt = (body.startedAt as string | undefined) ?? new Date().toISOString()
      const note = body.note as string | undefined
      const ts = Date.parse(startedAt)
      if (Number.isNaN(ts) || ts > Date.now() + 60_000) {
        return c.json({ error: 'startedAt must be a valid past date' }, 400)
      }
      if (note && (typeof note !== 'string' || note.length > 200)) {
        return c.json({ error: 'note must be a string up to 200 chars' }, 400)
      }

      await db.prepare(`UPDATE assets SET status = 'redeeming' WHERE id = ? AND user_id = ?`)
        .bind(id, userId).run()

      await insertLifecycleEvent(db, {
        assetId: id,
        userId,
        eventType: 'redeeming_started',
        eventAt: startedAt,
        note: note ?? null,
      })

      const response: StartAssetExitResponse = { started: true, assetId: id, status: 'redeeming', startedAt }
      return c.json(response, 200)
    } catch (err) {
      console.error('POST /api/assets/:id/exit/start', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.post('/api/assets/:id/exit/cancel', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id < 1) {
      return c.json({ error: 'Invalid asset id' }, 400)
    }

    let body: CancelAssetExitInput
    try {
      body = await c.req.json<CancelAssetExitInput>()
    } catch {
      body = {}
    }

    try {
      const asset = await db.prepare(
        `SELECT id, class, status FROM assets WHERE id = ? AND user_id = ? AND status != 'archived'`,
      ).bind(id, userId).first<{ id: number; class: AssetClass; status: AssetStatus }>()

      if (!asset) return c.json({ error: 'Asset not found' }, 404)
      if (!['ACAO', 'FII'].includes(asset.class)) {
        return c.json({ error: 'Exit flow is only available for ACAO and FII' }, 422)
      }
      if (asset.status !== 'redeeming') {
        return c.json({ error: 'Only redeeming assets can cancel exit flow' }, 422)
      }

      const canceledAt = (body.canceledAt as string | undefined) ?? new Date().toISOString()
      const note = body.note as string | undefined
      const ts = Date.parse(canceledAt)
      if (Number.isNaN(ts) || ts > Date.now() + 60_000) {
        return c.json({ error: 'canceledAt must be a valid past date' }, 400)
      }
      if (note && (typeof note !== 'string' || note.length > 200)) {
        return c.json({ error: 'note must be a string up to 200 chars' }, 400)
      }

      await db.prepare(`UPDATE assets SET status = 'active' WHERE id = ? AND user_id = ?`)
        .bind(id, userId).run()

      await insertLifecycleEvent(db, {
        assetId: id,
        userId,
        eventType: 'redeeming_canceled',
        eventAt: canceledAt,
        note: note ?? null,
      })

      const response: CancelAssetExitResponse = { canceled: true, assetId: id, status: 'active', canceledAt }
      return c.json(response, 200)
    } catch (err) {
      console.error('POST /api/assets/:id/exit/cancel', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.post('/api/assets/:id/sale', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id < 1) {
      return c.json({ error: 'Invalid asset id' }, 400)
    }

    let body: CompleteAssetSaleInput
    try {
      body = await c.req.json<CompleteAssetSaleInput>()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    try {
      const asset = await db.prepare(
        `SELECT id, class, status, qty FROM assets WHERE id = ? AND user_id = ? AND status != 'archived'`,
      ).bind(id, userId).first<{ id: number; class: AssetClass; status: AssetStatus; qty: number | null }>()

      if (!asset) return c.json({ error: 'Asset not found' }, 404)
      if (!['ACAO', 'FII'].includes(asset.class)) {
        return c.json({ error: 'Sale flow is only available for ACAO and FII' }, 422)
      }
      if (!['active', 'redeeming'].includes(asset.status)) {
        return c.json({ error: 'Only active or redeeming assets can be sold' }, 422)
      }

      const soldAt = body.soldAt as string | undefined
      const grossAmount = body.grossAmount
      const note = body.note as string | undefined

      if (!soldAt || typeof soldAt !== 'string') {
        return c.json({ error: 'soldAt is required' }, 400)
      }
      const ts = Date.parse(soldAt)
      if (Number.isNaN(ts) || ts > Date.now() + 60_000) {
        return c.json({ error: 'soldAt must be a valid past date' }, 400)
      }
      if (typeof grossAmount !== 'number' || grossAmount <= 0) {
        return c.json({ error: 'grossAmount must be a positive number' }, 400)
      }
      if (note && (typeof note !== 'string' || note.length > 200)) {
        return c.json({ error: 'note must be a string up to 200 chars' }, 400)
      }

      await db.prepare(`UPDATE assets SET status = 'sold' WHERE id = ? AND user_id = ?`)
        .bind(id, userId).run()

      await insertLifecycleEvent(db, {
        assetId: id,
        userId,
        eventType: 'sale_completed',
        eventAt: soldAt,
        grossAmount,
        qtySnapshot: asset.qty ?? null,
        note: note ?? null,
      })

      const response: CompleteAssetSaleResponse = { sold: true, assetId: id, status: 'sold', soldAt, grossAmount }
      return c.json(response, 200)
    } catch (err) {
      console.error('POST /api/assets/:id/sale', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.post('/api/assets/:id/contributions', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const assetId = Number(c.req.param('id'))

    if (!Number.isInteger(assetId) || assetId < 1) {
      return c.json({ error: 'Invalid asset id' }, 400)
    }

    if (!(await hasTable(db, 'asset_contributions'))) {
      return c.json({ error: 'Contributions not available yet' }, 503)
    }

    let body: CreateAssetContributionInput
    try {
      body = await c.req.json<CreateAssetContributionInput>()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    try {
      const asset = await db.prepare(
        `SELECT id, class, ticker, quote_source, qty, status FROM assets WHERE id = ? AND user_id = ? AND status != 'archived'`,
      ).bind(assetId, userId).first<{
        id: number
        class: string
        ticker: string | null
        quote_source: string | null
        qty: number | null
        status: AssetStatus
      }>()

      if (!asset) return c.json({ error: 'Asset not found' }, 404)
      if (asset.status === 'sold') return c.json({ error: 'Sold assets do not accept new contributions' }, 422)

      const acceptsContributions = ['ACAO', 'FII', 'FUNDO', 'RF', 'TESOURO']
      if (!acceptsContributions.includes(asset.class)) {
        return c.json({ error: 'This asset class does not accept contributions' }, 422)
      }

      const amount = body.amount
      const contributedAt = body.contributedAt as string | undefined
      const qty = body.qty as number | undefined
      const note = body.note as string | undefined

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return c.json({ error: 'amount must be a positive number' }, 400)
      }
      if (!contributedAt || typeof contributedAt !== 'string') {
        return c.json({ error: 'contributedAt is required' }, 400)
      }
      const ts = Date.parse(contributedAt)
      if (Number.isNaN(ts) || ts > Date.now() + 60_000) {
        return c.json({ error: 'contributedAt must be a valid past date' }, 400)
      }
      if (note && (typeof note !== 'string' || note.length > 200)) {
        return c.json({ error: 'note must be a string up to 200 chars' }, 400)
      }

      const requiresQty = !!asset.ticker && (!asset.quote_source || asset.quote_source === 'BRAPI')
      if (requiresQty && (!qty || typeof qty !== 'number' || qty <= 0)) {
        return c.json({ error: 'qty must be a positive number for this asset' }, 400)
      }
      if (!requiresQty && qty !== undefined && (typeof qty !== 'number' || qty <= 0)) {
        return c.json({ error: 'qty must be a positive number when provided' }, 400)
      }

      const inserted = await db.prepare(
        `INSERT INTO asset_contributions (asset_id, user_id, amount, contributed_at, qty, note)
         VALUES (?, ?, ?, ?, ?, ?)
         RETURNING id`,
      ).bind(assetId, userId, amount, contributedAt, qty ?? null, note ?? null).first<{ id: number }>()

      const totals = await db.prepare(
        `SELECT SUM(amount) AS total FROM asset_contributions WHERE asset_id = ? AND user_id = ?`,
      ).bind(assetId, userId).first<{ total: number }>()

      const invested = totals?.total ?? amount
      const nextQty = requiresQty ? Math.max(0, Number(asset.qty ?? 0) + Number(qty ?? 0)) : asset.qty ?? null

      await db.prepare(`UPDATE assets SET invested = ?, qty = COALESCE(?, qty) WHERE id = ?`)
        .bind(invested, requiresQty ? nextQty : null, assetId).run()

      const response: CreateAssetContributionResponse = {
        id: inserted!.id,
        assetId,
        amount,
        contributedAt,
        qty: qty ?? null,
        note: note ?? null,
        invested,
        assetQty: nextQty,
      }

      return c.json(response, 201)
    } catch (err) {
      console.error('POST /api/assets/:id/contributions', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.get('/api/assets/:id/contributions', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const assetId = Number(c.req.param('id'))

    if (!Number.isInteger(assetId) || assetId < 1) {
      return c.json({ error: 'Invalid asset id' }, 400)
    }

    if (!(await hasTable(db, 'asset_contributions'))) {
      const response: AssetContributionListResponse = { assetId, total: 0, count: 0, contributions: [] }
      return c.json(response)
    }

    try {
      const asset = await db.prepare(
        `SELECT id FROM assets WHERE id = ? AND user_id = ? AND status != 'archived'`,
      ).bind(assetId, userId).first()

      if (!asset) return c.json({ error: 'Asset not found' }, 404)

      const result = await db.prepare(
        `SELECT id, amount, qty, contributed_at, note, created_at
         FROM asset_contributions
         WHERE asset_id = ? AND user_id = ?
         ORDER BY contributed_at DESC`,
      ).bind(assetId, userId).all<{
        id: number
        amount: number
        qty: number | null
        contributed_at: string
        note: string | null
        created_at: string
      }>()

      const contributions = result.results ?? []
      const total = contributions.reduce((acc, contribution) => acc + contribution.amount, 0)

      const response: AssetContributionListResponse = {
        assetId,
        total,
        count: contributions.length,
        contributions: contributions.map((contribution) => ({
          id: contribution.id,
          amount: contribution.amount,
          qty: contribution.qty ?? null,
          unitPrice: contribution.qty && contribution.qty > 0 ? contribution.amount / contribution.qty : null,
          contributedAt: contribution.contributed_at,
          note: contribution.note ?? null,
          createdAt: contribution.created_at,
        })),
      }

      return c.json(response)
    } catch (err) {
      console.error('GET /api/assets/:id/contributions', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.delete('/api/assets/:id/contributions/:cid', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const assetId = Number(c.req.param('id'))
    const cid = Number(c.req.param('cid'))

    if (!Number.isInteger(assetId) || !Number.isInteger(cid) || assetId < 1 || cid < 1) {
      return c.json({ error: 'Invalid id' }, 400)
    }

    if (!(await hasTable(db, 'asset_contributions'))) {
      return c.json({ error: 'Contributions not available yet' }, 503)
    }

    try {
      const contrib = await db.prepare(
        `SELECT id, qty FROM asset_contributions WHERE id = ? AND asset_id = ? AND user_id = ?`,
      ).bind(cid, assetId, userId).first<{ id: number; qty: number | null }>()

      if (!contrib) return c.json({ error: 'Contribution not found' }, 404)

      const asset = await db.prepare(
        `SELECT qty, ticker, quote_source, status FROM assets WHERE id = ? AND user_id = ? AND status != 'archived'`,
      ).bind(assetId, userId).first<{
        qty: number | null
        ticker: string | null
        quote_source: string | null
        status: AssetStatus
      }>()

      if (asset?.status === 'sold') {
        return c.json({ error: 'Sold assets keep contribution history read-only' }, 422)
      }

      await db.prepare(`DELETE FROM asset_contributions WHERE id = ?`).bind(cid).run()

      const totals = await db.prepare(
        `SELECT SUM(amount) AS total FROM asset_contributions WHERE asset_id = ? AND user_id = ?`,
      ).bind(assetId, userId).first<{ total: number | null }>()

      const invested = totals?.total ?? null
      const isAutoQty = !!asset?.ticker && (!asset?.quote_source || asset?.quote_source === 'BRAPI')
      const nextQty = isAutoQty ? Math.max(0, Number(asset?.qty ?? 0) - Number(contrib.qty ?? 0)) : null

      await db.prepare(`UPDATE assets SET invested = ?, qty = COALESCE(?, qty) WHERE id = ?`)
        .bind(invested, isAutoQty ? nextQty : null, assetId).run()

      const response: DeleteAssetContributionResponse = { deleted: true, invested, assetQty: nextQty }
      return c.json(response)
    } catch (err) {
      console.error('DELETE /api/assets/:id/contributions/:cid', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })
}
