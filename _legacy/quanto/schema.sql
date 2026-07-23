-- Quanto · Schema v4
-- 5 tabelas + 4 views
-- Atualizado para spec funcional v1.3 (98 RNs)

-- ============================================================
-- DROP (reverse dependency order)
-- ============================================================

DROP VIEW  IF EXISTS vw_freshness;
DROP VIEW  IF EXISTS vw_allocation_by_class;
DROP VIEW  IF EXISTS vw_allocation_by_institution;
DROP VIEW  IF EXISTS vw_portfolio_summary;
DROP TABLE IF EXISTS operation_logs;
DROP TABLE IF EXISTS asset_lifecycle_events;
DROP TABLE IF EXISTS snapshots;
DROP TABLE IF EXISTS cvm_funds_cache;
DROP TABLE IF EXISTS quotes_cache;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS users;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name          TEXT,
  cpf           TEXT,          -- digits only (11 chars), for recovery
  birth_date    TEXT,          -- YYYY-MM-DD, for recovery
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE assets (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),

  -- Institution: fixed set with 'OUTROS' as escape hatch (RN-79).
  -- When institution = 'OUTROS', institution_name carries the actual
  -- name (e.g. "Nubank", "BTG") for display and grouping.
  institution TEXT NOT NULL
    CHECK (institution IN ('XP','ITAU','ONZE','OUTROS')),
  institution_name TEXT,  -- custom name when institution = 'OUTROS'

  -- Asset class (8 values, matching spec section 4.10)
  class TEXT NOT NULL
    CHECK (class IN (
      'ACAO','FII','FUNDO','RF','TESOURO',
      'PREVIDENCIA','POUPANCA','COFRINHO'
    )),

  name TEXT NOT NULL,

  -- AI-generated short label for UI display (Smart Labels, FEAT-013).
  -- NULL until Workers AI generates it; frontend falls back to name.
  display_name TEXT,

  -- Auto-mode fields: ticker + qty. Both NULL for manual assets.
  -- RN-24: ticker and qty must both be present for auto assets.
  -- RN-28: mode is derived from presence of ticker, not stored.
  ticker TEXT,
  qty    REAL,

  -- Quote source: NULL/BRAPI = B3 via BRAPI, CVM = fundo via CVM informe diario
  quote_source TEXT CHECK (quote_source IS NULL OR quote_source IN ('BRAPI', 'CVM')),

  -- Amount originally invested. Optional (RN-08: if NULL, asset
  -- contributes to total but not to gain calculation).
  invested REAL,

  -- Manual-mode balance. Required when ticker is NULL (RN-05).
  -- For auto assets this stays NULL — balance = qty * price.
  manual_balance     REAL,
  -- Tracks freshness (RN-15..22). Updated to now() on every
  -- manual balance save (RN-23, RN-33). Stale if > 30 days (RN-17).
  balance_updated_at TEXT,

  -- Lifecycle: active -> redeeming -> sold -> archived (or active -> archived).
  -- RN-01: only 'active' counts in totals.
  -- RN-02: 'redeeming' shown separately.
  -- RN-03b: 'sold' preserves history but stays out of the open portfolio.
  -- RN-03: 'archived' invisible everywhere (soft delete, RN-36).
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','redeeming','sold','archived')),

  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE quotes_cache (
  ticker     TEXT PRIMARY KEY,
  price      REAL NOT NULL,
  fetched_at TEXT NOT NULL  -- RN-09: cache valid for 15 min
);

CREATE TABLE cvm_funds_cache (
  cnpj           TEXT PRIMARY KEY,
  denom_social   TEXT NOT NULL,
  classe         TEXT,
  classe_anbima  TEXT,
  gestor         TEXT,
  admin          TEXT,
  fundo_cotas    TEXT,
  rentab_fundo   TEXT,
  vl_patrim_liq  REAL,
  fetched_at     TEXT NOT NULL
);

CREATE INDEX idx_cvm_funds_nome ON cvm_funds_cache(denom_social COLLATE NOCASE);

CREATE TABLE snapshots (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  month      TEXT NOT NULL,     -- 'YYYY-MM' format (RN-45)
  total      REAL NOT NULL,
  invested   REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, month)        -- RN-43: idempotent upsert per user+month
);

CREATE TABLE asset_lifecycle_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id      INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  event_type    TEXT NOT NULL CHECK (
    event_type IN ('redeeming_started', 'redeeming_canceled', 'sale_completed')
  ),
  event_at      TEXT NOT NULL,
  gross_amount  REAL,
  qty_snapshot  REAL,
  note          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE operation_logs (
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

-- ============================================================
-- INDEXES
-- ============================================================

-- Core query path: assets by user filtered by status
CREATE INDEX idx_assets_user        ON assets(user_id, status);
-- Views group by institution and class frequently
CREATE INDEX idx_assets_institution ON assets(user_id, institution, status);
CREATE INDEX idx_assets_class       ON assets(user_id, class, status);
-- Freshness queries filter on balance_updated_at for manual assets
CREATE INDEX idx_assets_freshness   ON assets(user_id, status, balance_updated_at)
  WHERE ticker IS NULL;
-- Snapshot history lookup
CREATE INDEX idx_snapshots_user     ON snapshots(user_id, month);
CREATE INDEX idx_asset_lifecycle_asset ON asset_lifecycle_events(asset_id, event_at DESC);
CREATE INDEX idx_asset_lifecycle_user  ON asset_lifecycle_events(user_id, event_at DESC);
CREATE INDEX idx_operation_logs_type_created_at ON operation_logs(operation_type, created_at DESC);
CREATE INDEX idx_operation_logs_user_created_at ON operation_logs(user_id, created_at DESC);

-- ============================================================
-- VIEWS
-- ============================================================

-- vw_portfolio_summary
-- Total balance per user (active assets only). Computes invested,
-- total, gain, and gain %. Auto assets use quotes_cache price;
-- manual assets use manual_balance. (RN-01, RN-04, RN-05, RN-07, RN-08)
CREATE VIEW vw_portfolio_summary AS
SELECT
  a.user_id,
  COUNT(*)                                                     AS asset_count,
  SUM(CASE WHEN a.invested IS NOT NULL THEN a.invested ELSE 0 END) AS total_invested,
  SUM(
    CASE
      WHEN a.ticker IS NOT NULL
        THEN a.qty * COALESCE(q.price, 0)     -- auto: qty * price (RN-04)
      ELSE COALESCE(a.manual_balance, 0)       -- manual (RN-05)
    END
  )                                                            AS total_balance,
  -- Gain = balance - invested, only for assets with invested filled and price available (RN-08).
  -- Auto assets without a cached price are excluded to avoid false losses.
  SUM(
    CASE WHEN a.invested IS NOT NULL AND (a.ticker IS NULL OR q.price IS NOT NULL) THEN
      (CASE
        WHEN a.ticker IS NOT NULL THEN a.qty * q.price
        ELSE COALESCE(a.manual_balance, 0)
      END) - a.invested
    ELSE 0 END
  )                                                            AS gain,
  -- Redeeming total (shown separately per RN-02)
  -- Not included here — queried via a WHERE status='redeeming' variant
  NULL                                                         AS _placeholder
FROM assets a
LEFT JOIN quotes_cache q ON q.ticker = a.ticker
WHERE a.status = 'active'
GROUP BY a.user_id;

-- vw_allocation_by_institution
-- Balance grouped by institution for donut chart (RN-94).
-- Uses institution_name for 'OUTROS' display (RN-79).
CREATE VIEW vw_allocation_by_institution AS
SELECT
  a.user_id,
  a.institution,
  a.institution_name,
  -- Display label: use institution_name when OUTROS, else institution code
  CASE
    WHEN a.institution = 'OUTROS' AND a.institution_name IS NOT NULL
      THEN a.institution_name
    ELSE a.institution
  END                                                          AS display_name,
  COUNT(*)                                                     AS asset_count,
  SUM(
    CASE
      WHEN a.ticker IS NOT NULL
        THEN a.qty * COALESCE(q.price, 0)
      ELSE COALESCE(a.manual_balance, 0)
    END
  )                                                            AS total_balance
FROM assets a
LEFT JOIN quotes_cache q ON q.ticker = a.ticker
WHERE a.status = 'active'
GROUP BY a.user_id,
         a.institution,
         a.institution_name;

-- vw_allocation_by_class
-- Balance grouped by class for donut chart (RN-94).
CREATE VIEW vw_allocation_by_class AS
SELECT
  a.user_id,
  a.class,
  COUNT(*)                                                     AS asset_count,
  SUM(
    CASE
      WHEN a.ticker IS NOT NULL
        THEN a.qty * COALESCE(q.price, 0)
      ELSE COALESCE(a.manual_balance, 0)
    END
  )                                                            AS total_balance
FROM assets a
LEFT JOIN quotes_cache q ON q.ticker = a.ticker
WHERE a.status = 'active'
GROUP BY a.user_id, a.class;

-- vw_freshness
-- Per-institution freshness report for the frescor card (RN-15..22).
-- Only considers manual assets (ticker IS NULL) with status = 'active'.
-- An asset is "stale" if balance_updated_at is > 30 days ago (RN-17).
CREATE VIEW vw_freshness AS
SELECT
  a.user_id,
  a.institution,
  a.institution_name,
  CASE
    WHEN a.institution = 'OUTROS' AND a.institution_name IS NOT NULL
      THEN a.institution_name
    ELSE a.institution
  END                                                          AS display_name,
  COUNT(*)                                                     AS total_manual,
  SUM(
    CASE
      WHEN julianday('now') - julianday(a.balance_updated_at) <= 30
        THEN 1 ELSE 0
    END
  )                                                            AS fresh_count,
  SUM(
    CASE
      WHEN julianday('now') - julianday(a.balance_updated_at) > 30
        THEN 1 ELSE 0
    END
  )                                                            AS stale_count,
  -- Oldest stale asset name and age in days (for the amber alert, RN-20)
  (
    SELECT s.name FROM assets s
    WHERE s.user_id    = a.user_id
      AND s.institution = a.institution
      AND (a.institution != 'OUTROS'
           OR s.institution_name IS a.institution_name)
      AND s.ticker IS NULL
      AND s.status = 'active'
      AND julianday('now') - julianday(s.balance_updated_at) > 30
    ORDER BY s.balance_updated_at ASC
    LIMIT 1
  )                                                            AS oldest_stale_name,
  (
    SELECT CAST(julianday('now') - julianday(s.balance_updated_at) AS INTEGER)
    FROM assets s
    WHERE s.user_id    = a.user_id
      AND s.institution = a.institution
      AND (a.institution != 'OUTROS'
           OR s.institution_name IS a.institution_name)
      AND s.ticker IS NULL
      AND s.status = 'active'
      AND julianday('now') - julianday(s.balance_updated_at) > 30
    ORDER BY s.balance_updated_at ASC
    LIMIT 1
  )                                                            AS oldest_stale_days
FROM assets a
WHERE a.ticker IS NULL        -- manual only (RN-15, RN-22)
  AND a.status = 'active'     -- active only (RN-15)
GROUP BY a.user_id,
         a.institution,
         a.institution_name;
