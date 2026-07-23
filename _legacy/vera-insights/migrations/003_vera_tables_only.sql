-- Vera v3: Data Integration Layer Schema (Standalone)

-- Cache table for external data with TTL
CREATE TABLE IF NOT EXISTS vera_cache (
  key TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Index for efficient cache lookups by type and expiration
CREATE INDEX IF NOT EXISTS idx_vera_cache_type_expires
ON vera_cache(type, expiresAt);

-- User analysis snapshots
CREATE TABLE IF NOT EXISTS vera_snapshots (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  debtPressure REAL NOT NULL,
  liquidityAdequacy REAL NOT NULL,
  globalConfidence REAL NOT NULL,
  behavioralConsistency REAL NOT NULL,
  stage TEXT NOT NULL,
  simplifiedScore REAL NOT NULL,
  primaryProblem TEXT,
  primaryAction TEXT,
  problemsJson TEXT,
  opportunitiesJson TEXT,
  provider TEXT NOT NULL,
  confidenceLevel REAL NOT NULL
);

-- Index for efficient user snapshot lookup
CREATE INDEX IF NOT EXISTS idx_vera_snapshots_user_time
ON vera_snapshots(userId, timestamp DESC);

-- Portfolio snapshots with enriched data
CREATE TABLE IF NOT EXISTS vera_portfolio_snapshots (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  positions TEXT NOT NULL,
  summary TEXT NOT NULL,
  dataSourceFlags TEXT,
  nextRefreshAt TEXT
);

-- Index for efficient user portfolio lookup
CREATE INDEX IF NOT EXISTS idx_vera_portfolio_user_time
ON vera_portfolio_snapshots(userId, timestamp DESC);

-- Behavioral action tracking
CREATE TABLE IF NOT EXISTS vera_behavioral (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  actionDate TEXT NOT NULL,
  actionType TEXT NOT NULL,
  recommendationType TEXT NOT NULL,
  recommendationId TEXT,
  completed BOOLEAN DEFAULT 0,
  completedDate TEXT
);

-- Monthly trend summary (aggregated snapshots)
CREATE TABLE IF NOT EXISTS vera_monthly_trend (
  userId TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  avgScore REAL,
  avgDebtPressure REAL,
  avgLiquidityAdequacy REAL,
  snapshotCount INTEGER DEFAULT 0,
  stageDistributionJson TEXT,
  problemsFixedJson TEXT,
  newProblemsJson TEXT,
  PRIMARY KEY (userId, year, month)
);

-- Index for efficient monthly trend lookup
CREATE INDEX IF NOT EXISTS idx_vera_monthly_trend_user_date
ON vera_monthly_trend(userId, year DESC, month DESC);

-- Audit log for data freshness tracking
CREATE TABLE IF NOT EXISTS vera_data_audit (
  id TEXT PRIMARY KEY,
  type TEXT,
  identifier TEXT,
  fetchedAt TEXT,
  status TEXT,
  errorMessage TEXT,
  durationMs INTEGER
);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_vera_audit_type_time
ON vera_data_audit(type, fetchedAt DESC);
