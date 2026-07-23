PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  cpf TEXT,
  email TEXT,
  password_hash TEXT,
  display_name TEXT,
  email_verification_sent_at TEXT,
  email_verified_at TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  login_locked_until TEXT,
  last_login_at TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_token_hash TEXT NOT NULL,
  device_fingerprint TEXT,
  user_agent TEXT,
  ip_address TEXT,
  remember_device INTEGER NOT NULL DEFAULT 0 CHECK (remember_device IN (0,1)),
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  revoke_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS auth_recovery_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  delivery_provider TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_recovery_token_hash ON auth_recovery_requests(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_recovery_user_id ON auth_recovery_requests(user_id);

CREATE TABLE IF NOT EXISTS user_financial_context (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  financial_goal TEXT,
  monthly_income_range TEXT,
  monthly_investment_target NUMERIC,
  available_to_invest NUMERIC,
  risk_profile TEXT,
  risk_profile_self_declared TEXT,
  risk_profile_quiz_result TEXT,
  risk_profile_effective TEXT,
  investment_horizon TEXT,
  platforms_used_json TEXT,
  display_preferences_json TEXT,
  onboarding_step TEXT,
  onboarding_completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_financial_context_user_id ON user_financial_context(user_id);

CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_platforms_code ON platforms(code);

CREATE TABLE IF NOT EXISTS asset_types (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_types_code ON asset_types(code);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  asset_type_id TEXT NOT NULL,
  code TEXT,
  name TEXT NOT NULL,
  normalized_name TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_type_id) REFERENCES asset_types(id)
);

CREATE INDEX IF NOT EXISTS idx_assets_asset_type_id ON assets(asset_type_id);
CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(code);
CREATE INDEX IF NOT EXISTS idx_assets_normalized_name ON assets(normalized_name);

CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  base_currency TEXT NOT NULL DEFAULT 'BRL',
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_is_primary ON portfolios(is_primary);

CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  portfolio_id TEXT,
  origin TEXT NOT NULL,
  status TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  finished_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_imports_user_id ON imports(user_id);
CREATE INDEX IF NOT EXISTS idx_imports_portfolio_id ON imports(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_imports_status ON imports(status);

CREATE TABLE IF NOT EXISTS import_rows (
  id TEXT PRIMARY KEY,
  import_id TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  source_payload_json TEXT,
  normalized_payload_json TEXT,
  resolution_status TEXT NOT NULL DEFAULT 'NORMALIZED',
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_import_rows_import_id ON import_rows(import_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_import_rows_import_row_number ON import_rows(import_id, row_number);

CREATE TABLE IF NOT EXISTS portfolio_positions (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  platform_id TEXT,
  source_kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  quantity NUMERIC,
  average_price NUMERIC,
  current_price NUMERIC,
  invested_amount NUMERIC,
  current_amount NUMERIC,
  category_label TEXT,
  notes TEXT,
  stop_loss NUMERIC,
  target_price NUMERIC,
  profitability NUMERIC,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_positions_portfolio_id ON portfolio_positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_asset_id ON portfolio_positions(asset_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_platform_id ON portfolio_positions(platform_id);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  import_id TEXT,
  reference_date TEXT NOT NULL,
  total_equity NUMERIC,
  total_invested NUMERIC,
  total_profit_loss NUMERIC,
  total_profit_loss_pct NUMERIC,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio_id ON portfolio_snapshots(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_reference_date ON portfolio_snapshots(reference_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_import_id ON portfolio_snapshots(import_id);

CREATE TABLE IF NOT EXISTS portfolio_snapshot_positions (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  quantity NUMERIC,
  unit_price NUMERIC,
  current_value NUMERIC,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (snapshot_id) REFERENCES portfolio_snapshots(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_positions_snapshot_id ON portfolio_snapshot_positions(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_positions_asset_id ON portfolio_snapshot_positions(asset_id);

CREATE TABLE IF NOT EXISTS portfolio_analyses (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  snapshot_id TEXT NOT NULL,
  score_value NUMERIC,
  score_status TEXT,
  primary_problem TEXT,
  primary_action TEXT,
  portfolio_decision TEXT,
  action_plan_text TEXT,
  summary_text TEXT,
  messaging_json TEXT,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (snapshot_id) REFERENCES portfolio_snapshots(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_analyses_portfolio_id ON portfolio_analyses(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_analyses_snapshot_id ON portfolio_analyses(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_analyses_generated_at ON portfolio_analyses(generated_at);

CREATE TABLE IF NOT EXISTS analysis_insights (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  priority INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES portfolio_analyses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analysis_insights_analysis_id ON analysis_insights(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_insights_priority ON analysis_insights(priority);

CREATE TABLE IF NOT EXISTS operational_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  portfolio_id TEXT,
  event_type TEXT NOT NULL,
  event_status TEXT NOT NULL,
  message TEXT,
  details_json TEXT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_operational_events_user_id ON operational_events(user_id);
CREATE INDEX IF NOT EXISTS idx_operational_events_portfolio_id ON operational_events(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_operational_events_occurred_at ON operational_events(occurred_at);

-- Complementary external references (must never be required for core flows).
-- Cache keys are stable strings (e.g. "quote:stock:ITSA4:BVMF").
CREATE TABLE IF NOT EXISTS external_reference_cache (
  cache_key TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  source TEXT NOT NULL,
  value_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok',
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_external_reference_cache_kind ON external_reference_cache(kind);
CREATE INDEX IF NOT EXISTS idx_external_reference_cache_expires_at ON external_reference_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_external_reference_cache_status ON external_reference_cache(status);
