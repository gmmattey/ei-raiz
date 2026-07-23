import type { AssetLifecycleEventType } from '../domain/assets'
import { hasTable } from './db'

export async function insertLifecycleEvent(
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
): Promise<void> {
  if (!(await hasTable(db, 'asset_lifecycle_events'))) return

  await db.prepare(
    `INSERT INTO asset_lifecycle_events
       (asset_id, user_id, event_type, event_at, gross_amount, qty_snapshot, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    payload.assetId,
    payload.userId,
    payload.eventType,
    payload.eventAt,
    payload.grossAmount ?? null,
    payload.qtySnapshot ?? null,
    payload.note ?? null,
  ).run()
}
