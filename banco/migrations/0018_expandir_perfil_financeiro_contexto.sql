ALTER TABLE perfil_financeiro ADD COLUMN gasto_mensal REAL DEFAULT 0;
ALTER TABLE perfil_financeiro ADD COLUMN reserva_caixa REAL DEFAULT 0;
ALTER TABLE perfil_financeiro ADD COLUMN frequencia_aporte TEXT DEFAULT '';
ALTER TABLE perfil_financeiro ADD COLUMN experiencia_investimentos TEXT DEFAULT '';
ALTER TABLE perfil_financeiro ADD COLUMN tolerancia_risco_real TEXT DEFAULT '';

