import { recordOperationLog } from '../core-api/runtime/audit'

export async function upsertSnapshot(
  db: D1Database,
  userId: number,
): Promise<{ month: string; total: number; invested: number; created: boolean }> {
  const month = new Date().toISOString().slice(0, 7)

  const summary = await db.prepare(
    `SELECT total_balance, total_invested FROM vw_portfolio_summary WHERE user_id = ?`,
  ).bind(userId).first<{ total_balance: number; total_invested: number }>()

  const total = summary?.total_balance ?? 0
  const invested = summary?.total_invested ?? 0

  const existing = await db.prepare(
    `SELECT id FROM snapshots WHERE user_id = ? AND month = ?`,
  ).bind(userId, month).first<{ id: number }>()

  await db.prepare(
    `INSERT INTO snapshots (user_id, month, total, invested) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, month) DO UPDATE SET total = excluded.total, invested = excluded.invested`,
  ).bind(userId, month, total, invested).run()

  return { month, total, invested, created: !existing }
}

export async function runMonthlySnapshot(db: D1Database): Promise<void> {
  try {
    const users = await db.prepare(
      `SELECT DISTINCT user_id FROM assets WHERE status = 'active'`,
    ).all<{ user_id: number }>()

    if (users.results.length === 0) {
      await recordOperationLog(db, {
        operationType: 'cron_snapshot',
        status: 'skipped',
        triggerSource: 'scheduled',
        summary: { usersWithActiveAssets: 0, snapshotsUpserted: 0 },
      })
      return
    }

    await Promise.all(users.results.map((row) => upsertSnapshot(db, row.user_id)))
    await recordOperationLog(db, {
      operationType: 'cron_snapshot',
      status: 'completed',
      triggerSource: 'scheduled',
      summary: {
        usersWithActiveAssets: users.results.length,
        snapshotsUpserted: users.results.length,
      },
    })
  } catch (err) {
    await recordOperationLog(db, {
      operationType: 'cron_snapshot',
      status: 'failed',
      triggerSource: 'scheduled',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}
