CREATE TABLE IF NOT EXISTS operation_logs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_type TEXT NOT NULL CHECK (
    operation_type IN (
      'import_batch',
      'cron_brapi_quotes',
      'cron_macro',
      'cron_snapshot',
      'cron_cvm_quotes',
      'cron_cvm_catalog'
    )
  ),
  status         TEXT NOT NULL CHECK (status IN ('completed', 'skipped', 'failed')),
  trigger_source TEXT NOT NULL CHECK (trigger_source IN ('http', 'scheduled', 'manual', 'system')),
  user_id        INTEGER REFERENCES users(id),
  summary_json   TEXT,
  error_message  TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_operation_logs_type_created_at
  ON operation_logs(operation_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operation_logs_user_created_at
  ON operation_logs(user_id, created_at DESC);
