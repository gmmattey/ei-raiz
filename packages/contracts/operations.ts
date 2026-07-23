export const OPERATION_LOG_TYPES = [
  'import_batch',
  'cron_brapi_quotes',
  'cron_macro',
  'cron_snapshot',
  'cron_cvm_quotes',
  'cron_cvm_catalog',
] as const

export const OPERATION_LOG_STATUSES = ['completed', 'skipped', 'failed'] as const

export const OPERATION_LOG_TRIGGERS = ['http', 'scheduled', 'manual', 'system'] as const

export type OperationLogType = typeof OPERATION_LOG_TYPES[number]
export type OperationLogStatus = typeof OPERATION_LOG_STATUSES[number]
export type OperationLogTrigger = typeof OPERATION_LOG_TRIGGERS[number]

export interface OperationLogRecord {
  id: number
  operation_type: OperationLogType
  status: OperationLogStatus
  trigger_source: OperationLogTrigger
  user_id: number | null
  summary_json: string | null
  error_message: string | null
  created_at: string
}
