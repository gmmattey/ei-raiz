-- Vera v2 D1 Schema: Snapshots, Behavioral History, Monthly Trends

-- Table 1: Snapshots (one per analysis call)
CREATE TABLE IF NOT EXISTS vera_snapshots (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  -- Scores snapshot
  debtPressure REAL NOT NULL,
  liquidityAdequacy REAL NOT NULL,
  globalConfidence REAL NOT NULL,
  behavioralConsistency REAL NOT NULL,
  -- Aggregated result
  stage TEXT NOT NULL,
  simplifiedScore INTEGER NOT NULL,
  -- Recommendations
  primaryProblem TEXT NOT NULL,
  primaryAction TEXT NOT NULL,
  problemsJson TEXT NOT NULL,          -- JSON array of problems
  opportunitiesJson TEXT NOT NULL,     -- JSON array of opportunities
  -- Metadata
  provider TEXT NOT NULL,              -- cloudflare | openai | gemini | claude | fallback
  confidenceLevel REAL NOT NULL
);

-- Table 2: Behavioral History (user actions on recommendations)
CREATE TABLE IF NOT EXISTS vera_behavioral (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  actionDate TEXT NOT NULL,
  actionType TEXT NOT NULL,           -- accepted | ignored | postponed | completed
  recommendationType TEXT NOT NULL,    -- which problem/opportunity type
  recommendationId TEXT,               -- reference to specific recommendation
  completed BOOLEAN DEFAULT 0,
  completedDate TEXT
);

-- Table 3: Monthly Summary (aggregated trending)
CREATE TABLE IF NOT EXISTS vera_monthly_trend (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  -- Aggregates
  avgScore REAL NOT NULL,
  avgDebtPressure REAL NOT NULL,
  avgLiquidityAdequacy REAL NOT NULL,
  snapshotCount INTEGER NOT NULL,
  -- Stage distribution
  stageDistributionJson TEXT NOT NULL, -- { CRITICAL: 0, UNSTABLE: 2, ... }
  -- Problem trends
  problemsFixedJson TEXT NOT NULL,     -- which problems disappeared
  newProblemsJson TEXT NOT NULL        -- which problems appeared
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vera_snapshots_userId ON vera_snapshots(userId);
CREATE INDEX IF NOT EXISTS idx_vera_snapshots_timestamp ON vera_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_vera_behavioral_userId ON vera_behavioral(userId);
CREATE INDEX IF NOT EXISTS idx_vera_behavioral_actionDate ON vera_behavioral(actionDate);
CREATE INDEX IF NOT EXISTS idx_vera_monthly_trend_userId ON vera_monthly_trend(userId, year, month);
