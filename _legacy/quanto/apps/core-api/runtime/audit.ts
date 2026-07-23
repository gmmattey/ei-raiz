import type {
  OperationLogStatus,
  OperationLogTrigger,
  OperationLogType,
} from '../../../packages/contracts/operations'
import { hasTable } from './db'

type OperationLogInput = {
  operationType: OperationLogType
  status: OperationLogStatus
  triggerSource: OperationLogTrigger
  userId?: number | null
  summary?: Record<string, unknown> | null
  errorMessage?: string | null
}

export async function recordOperationLog(db: D1Database, input: OperationLogInput): Promise<void> {
  const available = await hasTable(db, 'operation_logs')
  if (!available) return

  try {
    await db.prepare(
      `INSERT INTO operation_logs
         (operation_type, status, trigger_source, user_id, summary_json, error_message)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(
      input.operationType,
      input.status,
      input.triggerSource,
      input.userId ?? null,
      input.summary ? JSON.stringify(input.summary) : null,
      input.errorMessage ?? null,
    ).run()
  } catch {
    // Audit trail must not break the live runtime.
  }
}
