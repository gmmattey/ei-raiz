-- Vera v3: Data Integration Layer Schema

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

-- Add columns to existing vera_snapshots table (if not already present)
ALTER TABLE vera_snapshots ADD COLUMN dataSourceFlags TEXT;
ALTER TABLE vera_snapshots ADD COLUMN portfolioEnrichmentVersion TEXT;

-- Add columns to vera_monthly_trend (if not already present)
ALTER TABLE vera_monthly_trend ADD COLUMN portfolioMetrics TEXT;
