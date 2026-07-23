import type { Hono } from 'hono'
import {
  type ArchiveGoodResponse,
  type CreateGoodInput,
  type CreateGoodResponse,
  GOOD_TYPES,
  type GoodsResponse,
  PROPERTY_TYPES,
  type UpdateGoodInput,
  type UpdateGoodResponse,
  VEHICLE_TYPES,
  type GoodType,
  type PropertyType,
  type VehicleType,
} from '../../../packages/contracts/goods'
import { summarizeGoods } from '../../../packages/domain'
import type { Bindings, Variables } from '../types'

type GoodsApp = Hono<{ Bindings: Bindings; Variables: Variables }>

type GoodRow = {
  id: number
  type: GoodType
  name: string
  estimated_value: number
  balance_updated_at: string | null
  stale_days: number | null
  property_type: PropertyType | null
  area_m2: number | null
  vehicle_type: VehicleType | null
  year: number | null
  brand: string | null
  model_name: string | null
  employer: string | null
  city: string | null
  state: string | null
  is_financed: number
  notes: string | null
  status: 'active' | 'archived'
}

export function registerGoodsRoutes(app: GoodsApp) {
  app.get('/api/goods', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB

    try {
      const result = await db.prepare(`
        SELECT *,
          CASE WHEN balance_updated_at IS NOT NULL
            THEN CAST(julianday('now') - julianday(balance_updated_at) AS INTEGER)
            ELSE NULL
          END AS stale_days
        FROM goods
        WHERE user_id = ? AND status = 'active'
        ORDER BY type, name
      `).bind(userId).all<GoodRow>()

      const goods = result.results ?? []
      const goodsSummary = summarizeGoods(goods.map((g) => ({
        type: g.type,
        estimatedValue: g.estimated_value,
      })))

      const response: GoodsResponse = {
        total: goodsSummary.total,
        byType: goodsSummary.byType,
        goods: goods.map((g) => ({
          id: g.id,
          type: g.type,
          name: g.name,
          estimatedValue: g.estimated_value,
          balanceUpdatedAt: g.balance_updated_at ?? null,
          staleDays: g.stale_days ?? null,
          propertyType: g.property_type ?? null,
          areaM2: g.area_m2 ?? null,
          vehicleType: g.vehicle_type ?? null,
          year: g.year ?? null,
          brand: g.brand ?? null,
          modelName: g.model_name ?? null,
          employer: g.employer ?? null,
          city: g.city ?? null,
          state: g.state ?? null,
          isFinanced: Boolean(g.is_financed),
          notes: g.notes ?? null,
          status: g.status,
        })),
      }

      return c.json(response)
    } catch (err) {
      console.error('GET /api/goods', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.post('/api/goods', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB

    let body: CreateGoodInput
    try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON body' }, 400) }

    const type = body.type as string | undefined
    const name = (body.name as string | undefined)?.trim()
    const estimatedValue = body.estimatedValue as number | undefined
    const propertyType = body.propertyType as string | undefined
    const vehicleType = body.vehicleType as string | undefined
    const areaM2 = body.areaM2 as number | undefined
    const city = body.city as string | undefined
    const state = body.state as string | undefined
    const year = body.year as number | undefined
    const brand = body.brand as string | undefined
    const modelName = body.modelName as string | undefined
    const employer = body.employer as string | undefined
    const isFinanced = body.isFinanced ? 1 : 0
    const notes = body.notes as string | undefined

    const errors: string[] = []

    if (!type || !GOOD_TYPES.includes(type as GoodType)) {
      errors.push(`field 'type' must be one of: ${GOOD_TYPES.join(', ')}`)
    }
    if (!name) errors.push("field 'name' is required")
    if (estimatedValue === undefined || typeof estimatedValue !== 'number' || estimatedValue < 0) {
      errors.push("field 'estimatedValue' must be a number >= 0")
    }
    if (type === 'IMOVEL' && !propertyType) {
      errors.push("field 'propertyType' is required for IMOVEL")
    }
    if (type === 'IMOVEL' && propertyType && !PROPERTY_TYPES.includes(propertyType as PropertyType)) {
      errors.push(`field 'propertyType' must be one of: ${PROPERTY_TYPES.join(', ')}`)
    }
    if (type === 'VEICULO' && !vehicleType) {
      errors.push("field 'vehicleType' is required for VEICULO")
    }
    if (type === 'VEICULO' && vehicleType && !VEHICLE_TYPES.includes(vehicleType as VehicleType)) {
      errors.push(`field 'vehicleType' must be one of: ${VEHICLE_TYPES.join(', ')}`)
    }
    if (state && !/^[A-Z]{2}$/.test(state)) {
      errors.push("field 'state' must be 2 uppercase letters (UF)")
    }

    if (errors.length > 0) return c.json({ error: 'Invalid request body', details: errors }, 400)

    try {
      const good = await db.prepare(
        `INSERT INTO goods
           (user_id, type, name, estimated_value, balance_updated_at,
            property_type, area_m2, city, state,
            vehicle_type, year, brand, model_name,
            employer, is_financed, notes)
         VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`
      ).bind(
        userId, type, name, estimatedValue,
        propertyType ?? null, areaM2 ?? null, city ?? null, state ?? null,
        vehicleType ?? null, year ?? null, brand ?? null, modelName ?? null,
        employer ?? null, isFinanced, notes ?? null,
      ).first<Record<string, unknown>>()

      if (!good) throw new Error('Insert returned no row')
      return c.json(good as unknown as CreateGoodResponse, 201)
    } catch (err) {
      console.error('POST /api/goods', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.put('/api/goods/:id', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid good id' }, 400)

    let body: UpdateGoodInput
    try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON body' }, 400) }

    const existing = await db.prepare(
      `SELECT id FROM goods WHERE id = ? AND user_id = ? AND status != 'archived'`
    ).bind(id, userId).first<{ id: number }>()

    if (!existing) return c.json({ error: 'Good not found' }, 404)

    const fieldMap: Record<keyof UpdateGoodInput, string> = {
      name: 'name', estimatedValue: 'estimated_value',
      propertyType: 'property_type', areaM2: 'area_m2',
      city: 'city', state: 'state',
      vehicleType: 'vehicle_type', year: 'year',
      brand: 'brand', modelName: 'model_name',
      employer: 'employer', isFinanced: 'is_financed',
      notes: 'notes',
    }

    const setClauses: string[] = []
    const bindings: unknown[] = []
    let updatesValue = false

    for (const [jsKey, dbCol] of Object.entries(fieldMap) as Array<[keyof UpdateGoodInput, string]>) {
      if (!(jsKey in body)) continue
      let val = body[jsKey]
      if (jsKey === 'isFinanced') val = val ? 1 : 0
      setClauses.push(`${dbCol} = ?`)
      bindings.push(val ?? null)
      if (jsKey === 'estimatedValue') updatesValue = true
    }

    if (setClauses.length === 0) return c.json({ error: 'No fields to update' }, 400)

    if (updatesValue) {
      setClauses.push(`balance_updated_at = datetime('now')`)
    }

    bindings.push(id, userId)

    try {
      const updated = await db.prepare(
        `UPDATE goods SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ? RETURNING *`
      ).bind(...bindings).first<Record<string, unknown>>()

      if (!updated) return c.json({ error: 'Good not found' }, 404)
      return c.json(updated as unknown as UpdateGoodResponse, 200)
    } catch (err) {
      console.error('PUT /api/goods/:id', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.delete('/api/goods/:id', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid good id' }, 400)

    try {
      const result = await db.prepare(
        `UPDATE goods SET status = 'archived' WHERE id = ? AND user_id = ? AND status != 'archived' RETURNING id`
      ).bind(id, userId).first<{ id: number }>()

      if (!result) return c.json({ error: 'Good not found' }, 404)
      return c.json({ archived: true } satisfies ArchiveGoodResponse, 200)
    } catch (err) {
      console.error('DELETE /api/goods/:id', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })
}
