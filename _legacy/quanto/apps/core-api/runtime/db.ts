export async function hasTable(db: D1Database, tableName: string): Promise<boolean> {
  try {
    const row = await db
      .prepare(`SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?`)
      .bind(tableName)
      .first<{ ok: number }>()
    return !!row?.ok
  } catch {
    return false
  }
}
