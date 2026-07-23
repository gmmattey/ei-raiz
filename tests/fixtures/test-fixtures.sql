-- Deterministic fixtures for Playwright QA

INSERT OR REPLACE INTO quotes_cache (ticker, price, fetched_at) VALUES
  ('CPLE3', 14.61, datetime('now')),
  ('ITSA4', 12.88, datetime('now')),
  ('RANI3', 7.95, datetime('now')),
  ('BRST3', 2.93, datetime('now')),
  ('PETR4', 38.12, datetime('now')),
  ('VALE3', 62.25, datetime('now')),
  ('BBAS3', 28.70, datetime('now'));

INSERT OR REPLACE INTO macro_cache (slug, value, reference_date, fetched_at) VALUES
  ('cdi', 10.65, date('now'), datetime('now')),
  ('selic', 10.50, date('now'), datetime('now')),
  ('ipca12m', 4.20, date('now'), datetime('now'));

INSERT OR REPLACE INTO cvm_funds_cache
  (cnpj, denom_social, classe, classe_anbima, gestor, admin, fundo_cotas, rentab_fundo, vl_patrim_liq, fetched_at)
VALUES
  ('12345678000190', 'Icatu Vanguarda Pos Fixado RF Prev', 'Renda Fixa', 'Previdenciario', 'Icatu', 'Icatu', 'N', 'CDI', 500000000, datetime('now')),
  ('11111111000111', 'Western Asset US Index 500 FIF', 'Multimercado', 'Macro', 'Western Asset', 'BNY', 'N', 'S&P 500', 1200000000, datetime('now')),
  ('22222222000122', 'Trend Ouro FIF Multi RL', 'Multimercado', 'Macro', 'Trend', 'Banco X', 'N', 'Ouro', 250000000, datetime('now'));
