PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  cpf TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  email_verified_at TEXT,
  email_verification_sent_at TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  login_locked_until TEXT,
  telegram_chat_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED', 'DISABLED')),
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cpf),
  UNIQUE (email),
  CHECK (length(cpf) = 11)
);

CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_token_hash TEXT NOT NULL,
  device_fingerprint TEXT,
  user_agent TEXT,
  ip_address TEXT,
  remember_device INTEGER NOT NULL DEFAULT 0 CHECK (remember_device IN (0, 1)),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  revoke_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE auth_recovery_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'TELEGRAM')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SENT', 'USED', 'EXPIRED', 'FAILED')),
  token_hash TEXT NOT NULL,
  delivery_provider TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE portfolios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (normalized_name)
);

CREATE TABLE asset_types (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (code),
  UNIQUE (name)
);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  asset_type_id TEXT NOT NULL,
  code TEXT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  is_custom INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_type_id) REFERENCES asset_types(id)
);

CREATE TABLE user_financial_context (
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
  UNIQUE (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE imports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  portfolio_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('PROCESSING', 'PREVIEW_READY', 'COMMITTED', 'FAILED')),
  origin TEXT NOT NULL CHECK (origin IN ('B3_CSV', 'BROKER_EXTRACT', 'MANUAL_ENTRY')),
  file_storage_ref TEXT,
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  error_log TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  finished_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL
);

CREATE TABLE import_rows (
  id TEXT PRIMARY KEY,
  import_id TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  source_payload_json TEXT,
  normalized_payload_json TEXT,
  resolution_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (resolution_status IN ('PENDING', 'NORMALIZED', 'SKIPPED', 'FAILED')),
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE
);

CREATE TABLE portfolio_positions (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  platform_id TEXT,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('ACOES', 'FUNDOS', 'PREVIDENCIA')),
  status TEXT NOT NULL DEFAULT 'active',
  situacao TEXT,
  opened_at TEXT,
  quantity NUMERIC,
  average_price NUMERIC,
  current_price NUMERIC,
  invested_amount NUMERIC,
  current_amount NUMERIC,
  stop_loss NUMERIC,
  target_price NUMERIC,
  profitability NUMERIC,
  strategy TEXT,
  category_label TEXT,
  notes TEXT,
  source_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE TABLE planned_orders (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  asset_id TEXT,
  platform_id TEXT,
  tipo TEXT,
  raw_asset_name TEXT,
  tipo_ordem TEXT NOT NULL,
  quantity NUMERIC,
  target_price NUMERIC,
  validity_date TEXT,
  potential_value NUMERIC,
  current_price NUMERIC,
  status TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE TABLE portfolio_contributions (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  platform_id TEXT,
  contribution_month TEXT NOT NULL,
  destination_label TEXT,
  category_label TEXT,
  amount NUMERIC NOT NULL,
  accumulated_amount NUMERIC,
  status TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE TABLE portfolio_snapshots (
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

CREATE TABLE portfolio_snapshot_positions (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  platform_id TEXT,
  quantity NUMERIC,
  unit_price NUMERIC,
  current_value NUMERIC,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (snapshot_id) REFERENCES portfolio_snapshots(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE TABLE portfolio_analyses (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  snapshot_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'GENERATED', 'FAILED')),
  score_value NUMERIC,
  score_status TEXT,
  profile_label TEXT,
  primary_problem TEXT,
  primary_action TEXT,
  portfolio_decision TEXT,
  action_plan_text TEXT,
  summary_text TEXT,
  messaging_json TEXT,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (snapshot_id) REFERENCES portfolio_snapshots(id) ON DELETE CASCADE
);

CREATE TABLE analysis_insights (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  priority INTEGER,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES portfolio_analyses(id) ON DELETE CASCADE
);

CREATE TABLE external_data_sources (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (code),
  UNIQUE (name)
);

CREATE TABLE external_market_references (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  external_code TEXT,
  reference_date TEXT,
  price NUMERIC,
  currency_code TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES external_data_sources(id)
);

CREATE TABLE operational_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  portfolio_id TEXT,
  import_id TEXT,
  event_type TEXT NOT NULL,
  event_status TEXT,
  message TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL
);

INSERT INTO asset_types (id, code, name) VALUES
  ('asset_type_stock', 'STOCK', 'Acoes'),
  ('asset_type_fund', 'FUND', 'Fundos'),
  ('asset_type_pension', 'PENSION', 'Previdencia');

INSERT INTO external_data_sources (id, code, name) VALUES
  ('source_googlefinance', 'GOOGLEFINANCE', 'Google Finance');
