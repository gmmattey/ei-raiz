-- Quanto Migration 006: macro_cache (CDI, SELIC, IPCA)
CREATE TABLE IF NOT EXISTS macro_cache (
  slug           TEXT PRIMARY KEY,
  value          REAL NOT NULL,
  reference_date TEXT,
  fetched_at     TEXT NOT NULL
);
