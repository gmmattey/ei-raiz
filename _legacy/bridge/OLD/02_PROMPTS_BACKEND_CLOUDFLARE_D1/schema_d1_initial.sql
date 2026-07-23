-- Esquilo Invest
-- Schema inicial para Cloudflare D1 / SQLite
-- Objetivo: sustentar produto novo em Cloudflare Workers + D1
-- Apps Script tratado como legado congelado

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  auth_provider TEXT,
  auth_provider_user_id TEXT,
  display_name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_provider
  ON users(auth_provider, auth_provider_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id
  ON portfolios(user_id);

CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  platform_kind TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_platforms_code
  ON platforms(code);

CREATE TABLE IF NOT EXISTS asset_types (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_types_code
  ON asset_types(code);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  asset_type_id TEXT NOT NULL,
  platform_id TEXT,
  code TEXT,
  external_code TEXT,
  cnpj TEXT,
  isin TEXT,
  name TEXT NOT NULL,
  normalized_name TEXT,
  custom_name TEXT,
  is_custom INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0,1)),
  currency_code TEXT NOT NULL DEFAULT 'BRL',
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_type_id) REFERENCES asset_types(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE INDEX IF NOT EXISTS idx_assets_asset_type_id
  ON assets(asset_type_id);

CREATE INDEX IF NOT EXISTS idx_assets_platform_id
  ON assets(platform_id);

CREATE INDEX IF NOT EXISTS idx_assets_code
  ON assets(code);

CREATE INDEX IF NOT EXISTS idx_assets_normalized_name
  ON assets(normalized_name);

CREATE TABLE IF NOT EXISTS user_financial_context (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  financial_goal TEXT,
  monthly_income_range TEXT,
  monthly_investment_target NUMERIC,
  available_to_invest NUMERIC,
  risk_profile TEXT,
  investment_horizon TEXT,
  platforms_used_json TEXT,
  display_preferences_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_financial_context_user_id
  ON user_financial_context(user_id);

CREATE TABLE IF NOT EXISTS portfolio_positions (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  platform_id TEXT,
  source_import_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  quantity NUMERIC NOT NULL DEFAULT 0,
  average_price NUMERIC,
  current_price NUMERIC,
  invested_amount NUMERIC,
  current_value NUMERIC,
  target_price NUMERIC,
  stop_loss NUMERIC,
  started_at TEXT,
  observed_at TEXT,
  notes TEXT,
  raw_payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_positions_portfolio_id
  ON portfolio_positions(portfolio_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_positions_asset_id
  ON portfolio_positions(asset_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_positions_platform_id
  ON portfolio_positions(platform_id);

CREATE TABLE IF NOT EXISTS planned_orders (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  asset_id TEXT,
  platform_id TEXT,
  order_kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  suggested_amount NUMERIC,
  suggested_quantity NUMERIC,
  suggested_price NUMERIC,
  reason TEXT,
  priority TEXT,
  reference_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE INDEX IF NOT EXISTS idx_planned_orders_portfolio_id
  ON planned_orders(portfolio_id);

CREATE TABLE IF NOT EXISTS portfolio_contributions (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  contribution_date TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  contribution_kind TEXT NOT NULL DEFAULT 'manual',
  source_platform_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (source_platform_id) REFERENCES platforms(id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_contributions_portfolio_id
  ON portfolio_contributions(portfolio_id);

CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  portfolio_id TEXT,
  origin TEXT NOT NULL,
  source_platform_id TEXT,
  file_name TEXT,
  file_storage_key TEXT,
  mime_type TEXT,
  checksum_sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  error_log TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL,
  FOREIGN KEY (source_platform_id) REFERENCES platforms(id)
);

CREATE INDEX IF NOT EXISTS idx_imports_user_id
  ON imports(user_id);

CREATE INDEX IF NOT EXISTS idx_imports_portfolio_id
  ON imports(portfolio_id);

CREATE INDEX IF NOT EXISTS idx_imports_status
  ON imports(status);

CREATE TABLE IF NOT EXISTS import_rows (
  id TEXT PRIMARY KEY,
  import_id TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'parsed',
  raw_row_json TEXT NOT NULL,
  normalized_row_json TEXT,
  resolved_asset_id TEXT,
  dedup_key TEXT,
  validation_errors_json TEXT,
  conflict_summary_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_asset_id) REFERENCES assets(id)
);

CREATE INDEX IF NOT EXISTS idx_import_rows_import_id
  ON import_rows(import_id);

CREATE INDEX IF NOT EXISTS idx_import_rows_dedup_key
  ON import_rows(dedup_key);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  import_id TEXT,
  reference_date TEXT NOT NULL,
  total_equity NUMERIC,
  total_invested NUMERIC,
  total_profit_loss NUMERIC,
  total_profit_loss_pct NUMERIC,
  source_kind TEXT NOT NULL DEFAULT 'system',
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio_id
  ON portfolio_snapshots(portfolio_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_reference_date
  ON portfolio_snapshots(reference_date);

CREATE TABLE IF NOT EXISTS portfolio_snapshot_positions (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  platform_id TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  average_price NUMERIC,
  current_price NUMERIC,
  invested_amount NUMERIC,
  current_value NUMERIC,
  allocation_pct NUMERIC,
  performance_pct NUMERIC,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (snapshot_id) REFERENCES portfolio_snapshots(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_positions_snapshot_id
  ON portfolio_snapshot_positions(snapshot_id);

CREATE INDEX IF NOT EXISTS idx_snapshot_positions_asset_id
  ON portfolio_snapshot_positions(asset_id);

CREATE TABLE IF NOT EXISTS portfolio_analyses (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  snapshot_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated',
  score_value NUMERIC,
  score_status TEXT,
  primary_problem TEXT,
  primary_action TEXT,
  summary_text TEXT,
  ai_context_json TEXT,
  raw_ai_response TEXT,
  generated_by TEXT NOT NULL DEFAULT 'system',
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (snapshot_id) REFERENCES portfolio_snapshots(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_analyses_portfolio_id
  ON portfolio_analyses(portfolio_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_analyses_snapshot_id
  ON portfolio_analyses(snapshot_id);

CREATE TABLE IF NOT EXISTS analysis_insights (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  insight_kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  related_asset_id TEXT,
  related_category_code TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES portfolio_analyses(id) ON DELETE CASCADE,
  FOREIGN KEY (related_asset_id) REFERENCES assets(id)
);

CREATE INDEX IF NOT EXISTS idx_analysis_insights_analysis_id
  ON analysis_insights(analysis_id);

CREATE TABLE IF NOT EXISTS external_data_sources (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  config_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_external_data_sources_code
  ON external_data_sources(code);

CREATE TABLE IF NOT EXISTS external_market_references (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  reference_code TEXT NOT NULL,
  reference_name TEXT NOT NULL,
  asset_type_scope TEXT,
  reference_date TEXT NOT NULL,
  value NUMERIC,
  value_pct NUMERIC,
  currency_code TEXT NOT NULL DEFAULT 'BRL',
  cache_status TEXT,
  raw_payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES external_data_sources(id)
);

CREATE INDEX IF NOT EXISTS idx_external_market_references_source_id
  ON external_market_references(source_id);

CREATE INDEX IF NOT EXISTS idx_external_market_references_ref_date
  ON external_market_references(reference_date);

CREATE INDEX IF NOT EXISTS idx_external_market_references_code
  ON external_market_references(reference_code);

CREATE TABLE IF NOT EXISTS operational_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  portfolio_id TEXT,
  event_type TEXT NOT NULL,
  event_status TEXT NOT NULL DEFAULT 'info',
  entity_type TEXT,
  entity_id TEXT,
  import_id TEXT,
  snapshot_id TEXT,
  analysis_id TEXT,
  message TEXT,
  details_json TEXT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL,
  FOREIGN KEY (snapshot_id) REFERENCES portfolio_snapshots(id) ON DELETE SET NULL,
  FOREIGN KEY (analysis_id) REFERENCES portfolio_analyses(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_operational_events_user_id
  ON operational_events(user_id);

CREATE INDEX IF NOT EXISTS idx_operational_events_portfolio_id
  ON operational_events(portfolio_id);

CREATE INDEX IF NOT EXISTS idx_operational_events_occurred_at
  ON operational_events(occurred_at);

CREATE INDEX IF NOT EXISTS idx_operational_events_event_type
  ON operational_events(event_type);
