-- Quanto Migration 011: sold lifecycle and asset exit events
PRAGMA foreign_keys=OFF;

DROP VIEW IF EXISTS vw_freshness;
DROP VIEW IF EXISTS vw_allocation_by_class;
DROP VIEW IF EXISTS vw_allocation_by_institution;
DROP VIEW IF EXISTS vw_portfolio_summary;
DROP TABLE IF EXISTS asset_lifecycle_events;

ALTER TABLE assets RENAME TO assets_old;
ALTER TABLE asset_contributions RENAME TO asset_contributions_old;

CREATE TABLE assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  institution TEXT NOT NULL CHECK (institution IN ('XP','ITAU','ONZE','OUTROS')),
  institution_name TEXT,
  class TEXT NOT NULL CHECK (
    class IN ('ACAO','FII','FUNDO','RF','TESOURO','PREVIDENCIA','POUPANCA','COFRINHO')
  ),
  name TEXT NOT NULL,
  display_name TEXT,
  ticker TEXT,
  qty REAL,
  quote_source TEXT CHECK (quote_source IS NULL OR quote_source IN ('BRAPI', 'CVM')),
  invested REAL,
  manual_balance REAL,
  balance_updated_at TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','redeeming','sold','archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE asset_contributions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id       INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL,
  amount         REAL    NOT NULL CHECK(amount > 0),
  contributed_at TEXT    NOT NULL,
  note           TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  qty            REAL CHECK (qty IS NULL OR qty > 0)
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

INSERT INTO assets (
  id, user_id, institution, institution_name, class, name, display_name,
  ticker, qty, quote_source, invested, manual_balance, balance_updated_at, status, created_at
)
SELECT
  id, user_id, institution, institution_name, class, name, display_name,
  ticker, qty, quote_source, invested, manual_balance, balance_updated_at, status, created_at
FROM assets_old;

INSERT INTO asset_contributions (
  id, asset_id, user_id, amount, contributed_at, note, created_at, qty
)
SELECT
  id, asset_id, user_id, amount, contributed_at, note, created_at, qty
FROM asset_contributions_old;

DROP TABLE asset_contributions_old;
DROP TABLE assets_old;

CREATE INDEX IF NOT EXISTS idx_assets_user        ON assets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_institution ON assets(user_id, institution, status);
CREATE INDEX IF NOT EXISTS idx_assets_class       ON assets(user_id, class, status);
CREATE INDEX IF NOT EXISTS idx_assets_freshness   ON assets(user_id, status, balance_updated_at)
  WHERE ticker IS NULL;
CREATE INDEX IF NOT EXISTS idx_contributions_asset ON asset_contributions(asset_id, contributed_at DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_user ON asset_contributions(user_id, contributed_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_lifecycle_asset ON asset_lifecycle_events(asset_id, event_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_lifecycle_user ON asset_lifecycle_events(user_id, event_at DESC);

CREATE VIEW vw_portfolio_summary AS
SELECT
  a.user_id,
  COUNT(*)                                                     AS asset_count,
  SUM(CASE WHEN a.invested IS NOT NULL THEN a.invested ELSE 0 END) AS total_invested,
  SUM(
    CASE
      WHEN a.ticker IS NOT NULL
        THEN a.qty * COALESCE(q.price, 0)
      ELSE COALESCE(a.manual_balance, 0)
    END
  )                                                            AS total_balance,
  SUM(
    CASE WHEN a.invested IS NOT NULL AND (a.ticker IS NULL OR q.price IS NOT NULL) THEN
      (CASE
        WHEN a.ticker IS NOT NULL THEN a.qty * q.price
        ELSE COALESCE(a.manual_balance, 0)
      END) - a.invested
    ELSE 0 END
  )                                                            AS gain,
  NULL                                                         AS _placeholder
FROM assets a
LEFT JOIN quotes_cache q ON q.ticker = a.ticker
WHERE a.status = 'active'
GROUP BY a.user_id;

CREATE VIEW vw_allocation_by_institution AS
SELECT
  a.user_id,
  a.institution,
  a.institution_name,
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
WHERE a.ticker IS NULL
  AND a.status = 'active'
GROUP BY a.user_id,
         a.institution,
         a.institution_name;

PRAGMA foreign_keys=ON;
