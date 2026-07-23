CREATE TABLE users (
  id TEXT PRIMARY KEY,
  income_range TEXT,
  monthly_investment REAL,
  maturity_score INTEGER
);

CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT,
  severity TEXT,
  created_at TEXT
);

CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  target REAL,
  months INTEGER
);
