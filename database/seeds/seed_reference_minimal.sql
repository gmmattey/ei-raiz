-- Seeds mínimos para Release 0.1 (produção controlada)
-- Objetivo: evitar falhas no fluxo real (ex: import precisa de asset_types).
-- Nao cria usuarios/sessoes/cenarios.

INSERT OR IGNORE INTO platforms (id, code, name) VALUES
('plt_xp', 'xp', 'XP Investimentos'),
('plt_ion', 'ion', 'Ion Itau');

INSERT OR IGNORE INTO asset_types (id, code, name) VALUES
('aty_stock', 'STOCK', 'Acoes'),
('aty_fund', 'FUND', 'Fundos'),
('aty_pension', 'PENSION', 'Previdencia');

