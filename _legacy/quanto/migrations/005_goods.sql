-- Quanto Migration 005: goods (Bens e Garantias)
CREATE TABLE IF NOT EXISTS goods (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL,
  type              TEXT    NOT NULL CHECK(type IN ('FGTS','IMOVEL','VEICULO')),
  name              TEXT    NOT NULL,
  estimated_value   REAL    NOT NULL CHECK(estimated_value >= 0),
  balance_updated_at TEXT,
  property_type     TEXT    CHECK(property_type IN ('APARTAMENTO','CASA','TERRENO','SALA_COMERCIAL')),
  area_m2           REAL,
  city              TEXT,
  state             TEXT,
  vehicle_type      TEXT    CHECK(vehicle_type IN ('CARRO','MOTO','UTILITARIO')),
  year              INTEGER CHECK(year BETWEEN 1900 AND 2100),
  brand             TEXT,
  model_name        TEXT,
  employer          TEXT,
  is_financed       INTEGER DEFAULT 0 CHECK(is_financed IN (0,1)),
  notes             TEXT,
  status            TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_goods_user ON goods(user_id, status);
