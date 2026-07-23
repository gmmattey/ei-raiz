-- Quanto Migration 004: asset_contributions
CREATE TABLE IF NOT EXISTS asset_contributions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id       INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL,
  amount         REAL    NOT NULL CHECK(amount > 0),
  contributed_at TEXT    NOT NULL,
  note           TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_contributions_asset ON asset_contributions(asset_id, contributed_at DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_user ON asset_contributions(user_id, contributed_at DESC);
