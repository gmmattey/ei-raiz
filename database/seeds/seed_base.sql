-- Seeds base do Quebra_Nozes (MVP)
-- Alinhado ao schema oficial: `database/d1/schema.sql`

-- Credenciais seed (para login):
-- senha: `Senha123!`
-- tokens seed de sessao (para cookie `esquilo_session`):
-- - balanced: `seed_balanced_token_v1`
-- - concentrated: `seed_concentrated_token_v1`
-- - empty: `seed_empty_token_v1`
-- - import: `seed_import_token_v1`

-- Referencias (reutilizaveis)
INSERT INTO platforms (id, code, name) VALUES
('plt_xp', 'xp', 'XP Investimentos'),
('plt_ion', 'ion', 'Ion Itau');

INSERT INTO asset_types (id, code, name) VALUES
('aty_stock', 'STOCK', 'Acoes'),
('aty_fund', 'FUND', 'Fundos'),
('aty_pension', 'PENSION', 'Previdencia');

INSERT INTO assets (id, asset_type_id, code, name, normalized_name) VALUES
('ast_itsa4', 'aty_stock', 'ITSA4', 'Itausa', 'itausa'),
('ast_cmin3', 'aty_stock', 'CMIN3', 'CSN Mineracao', 'csn mineracao'),
('ast_fund_mm', 'aty_fund', NULL, 'Fundo Multimercado Demo', 'fundo multimercado demo'),
('ast_prev', 'aty_pension', NULL, 'Previdencia Demo', 'previdencia demo');

-- Cenario 1: carteira equilibrada (pronta)
INSERT INTO users (id, cpf, email, password_hash, display_name, status) VALUES
('usr_seed_balanced', '11122233344', 'balanced@example.com', 'pbkdf2_sha256$60000$GTeDS3h2djcs/EiqYWxOGg==$Q6RKrmtDOY/zfcKVM1Og9bB9aFoexCafEMR2FwOvUDg=', 'Usuario Balanced', 'ACTIVE');

INSERT INTO auth_sessions (id, user_id, session_token_hash, remember_device, expires_at, created_at, last_seen_at) VALUES
('ses_seed_balanced', 'usr_seed_balanced', '9fcb045ffe3cdb6c05a05d4d4d7be11d531a017bd5082d886096a9d8a1ec43aa', 1, '2099-01-01T00:00:00.000Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO portfolios (id, user_id, name, is_primary, status) VALUES
('pfl_seed_balanced', 'usr_seed_balanced', 'Carteira Principal', 1, 'active');

INSERT INTO user_financial_context (
  id, user_id, financial_goal, monthly_income_range, monthly_investment_target, available_to_invest,
  risk_profile, risk_profile_self_declared, risk_profile_quiz_result, risk_profile_effective,
  investment_horizon, platforms_used_json, display_preferences_json, onboarding_step, onboarding_completed_at
) VALUES (
  'ctx_seed_balanced',
  'usr_seed_balanced',
  'equilibrar e crescer',
  '10k-15k',
  1000,
  500,
  'moderado',
  'moderado',
  'moderado',
  'moderado',
  'longo_prazo',
  '{"platformIds":["xp","ion"],"otherPlatforms":[]}',
  '{"ghostMode":false}',
  'confirm',
  '2026-03-31T00:00:00.000Z'
);

INSERT INTO portfolio_positions (
  id, portfolio_id, asset_id, platform_id, source_kind, status,
  quantity, average_price, current_price, invested_amount, current_amount, category_label, notes
) VALUES
('pos_bal_1', 'pfl_seed_balanced', 'ast_itsa4', 'plt_xp', 'manual', 'active', 27, 13.84, 14.52, 373.68, 392.04, 'Acoes', 'Base de acoes para leitura'),
('pos_bal_2', 'pfl_seed_balanced', 'ast_cmin3', 'plt_xp', 'manual', 'active', 62, 5.95, 5.40, 368.90, 334.80, 'Acoes', 'Exemplo de queda para stress'),
('pos_bal_3', 'pfl_seed_balanced', 'ast_fund_mm', 'plt_xp', 'manual', 'active', 1, 5000.00, 5200.00, 5000.00, 5200.00, 'Fundos', 'Multimercado'),
('pos_bal_4', 'pfl_seed_balanced', 'ast_prev', 'plt_ion', 'manual', 'active', 1, 15000.00, 15350.00, 15000.00, 15350.00, 'Previdencia', 'Concentracao controlada');

INSERT INTO portfolio_snapshots (
  id, portfolio_id, import_id, reference_date, total_equity, total_invested, total_profit_loss, total_profit_loss_pct
) VALUES
('snp_bal_0', 'pfl_seed_balanced', NULL, '2026-02-28', 20350.00, 20100.00, 250.00, 1.24),
('snp_bal_1', 'pfl_seed_balanced', NULL, '2026-03-31', 21276.84, 20742.58, 534.26, 2.58);

INSERT INTO portfolio_snapshot_positions (id, snapshot_id, asset_id, quantity, unit_price, current_value) VALUES
('snp_bal_1_itsa4', 'snp_bal_1', 'ast_itsa4', 27, 14.52, 392.04),
('snp_bal_1_cmin3', 'snp_bal_1', 'ast_cmin3', 62, 5.40, 334.80),
('snp_bal_1_mm', 'snp_bal_1', 'ast_fund_mm', 1, 5200.00, 5200.00),
('snp_bal_1_prev', 'snp_bal_1', 'ast_prev', 1, 15350.00, 15350.00);

INSERT INTO portfolio_analyses (
  id, portfolio_id, snapshot_id, score_value, score_status, primary_problem, primary_action,
  portfolio_decision, action_plan_text, summary_text, messaging_json, generated_at
) VALUES (
  'anl_bal_1',
  'pfl_seed_balanced',
  'snp_bal_1',
  72,
  'atencao_moderada',
  'Concentracao relativamente alta em previdencia.',
  'Diluir concentracao aos poucos.',
  'Priorizar aportes fora da previdencia ate reduzir concentracao.',
  '1) Definir percentual alvo por classe\n2) Direcionar novos aportes para a classe sub-representada\n3) Reavaliar em 30 dias',
  'Carteira funcional, mas com concentracao relevante.',
  '{"tone":"direto","headline":"Concentracao em Previdencia"}',
  CURRENT_TIMESTAMP
);

INSERT INTO analysis_insights (id, analysis_id, insight_type, title, message, priority) VALUES
('ins_bal_1', 'anl_bal_1', 'concentration', 'Previdencia pesa demais', 'Sua previdencia virou o maior bloco da carteira.', 1),
('ins_bal_2', 'anl_bal_1', 'balance', 'Acoes ainda tem pouco peso', 'Ha espaco para crescimento ganhar mais relevancia aos poucos.', 2);

INSERT INTO operational_events (id, user_id, portfolio_id, event_type, event_status, message) VALUES
('evt_bal_1', 'usr_seed_balanced', 'pfl_seed_balanced', 'seed_created', 'ok', 'Cenario balanced criado.');

INSERT INTO operational_events (id, user_id, portfolio_id, event_type, event_status, message, occurred_at) VALUES
('evt_bal_2', 'usr_seed_balanced', 'pfl_seed_balanced', 'snapshot_created', 'ok', 'Snapshot inicial gerado.', '2026-03-01T00:00:00.000Z');

-- Cenario 2: carteira concentrada (edge case de concentracao)
INSERT INTO users (id, cpf, email, password_hash, display_name, status) VALUES
('usr_seed_concentrated', '55566677788', 'concentrated@example.com', 'pbkdf2_sha256$60000$4Lh1G9QMgFP6UfGAhbINmQ==$ICcHoMtavBfUpNghcHzr8fAAJs/d9xhrdnn1tpLa5U0=', 'Usuario Concentrated', 'ACTIVE');

INSERT INTO auth_sessions (id, user_id, session_token_hash, remember_device, expires_at, created_at, last_seen_at) VALUES
('ses_seed_concentrated', 'usr_seed_concentrated', '5ba0a14d6543bd8c93a5197b64b943ff76e016f0c2b6e77c3d3365e91338508a', 1, '2099-01-01T00:00:00.000Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO portfolios (id, user_id, name, is_primary, status) VALUES
('pfl_seed_concentrated', 'usr_seed_concentrated', 'Carteira Principal', 1, 'active');

INSERT INTO user_financial_context (
  id, user_id, financial_goal, monthly_income_range, monthly_investment_target, available_to_invest,
  risk_profile, risk_profile_self_declared, risk_profile_quiz_result, risk_profile_effective,
  investment_horizon, platforms_used_json, display_preferences_json, onboarding_step, onboarding_completed_at
) VALUES (
  'ctx_seed_concentrated',
  'usr_seed_concentrated',
  'crescer rapido',
  '15k-25k',
  3000,
  1500,
  'arrojado',
  'arrojado',
  'arrojado',
  'arrojado',
  'longo_prazo',
  '{"platformIds":["xp"],"otherPlatforms":[]}',
  '{"ghostMode":false}',
  'confirm',
  '2026-03-31T00:00:00.000Z'
);

INSERT INTO portfolio_positions (
  id, portfolio_id, asset_id, platform_id, source_kind, status,
  quantity, average_price, current_price, invested_amount, current_amount, category_label, stop_loss, target_price, profitability, notes
) VALUES
('pos_con_1', 'pfl_seed_concentrated', 'ast_prev', 'plt_ion', 'manual', 'active', 1, 50000.00, 51000.00, 50000.00, 51000.00, 'Previdencia', 45000.00, 60000.00, 2.00, 'Bloco dominante'),
('pos_con_2', 'pfl_seed_concentrated', 'ast_itsa4', 'plt_xp', 'manual', 'active', 10, 13.00, 14.50, 130.00, 145.00, 'Acoes', NULL, NULL, 11.54, 'Posicao pequena');

INSERT INTO portfolio_snapshots (
  id, portfolio_id, import_id, reference_date, total_equity, total_invested, total_profit_loss, total_profit_loss_pct
) VALUES
('snp_con_1', 'pfl_seed_concentrated', NULL, '2026-03-31', 51145.00, 50130.00, 1015.00, 2.02);

INSERT INTO portfolio_snapshot_positions (id, snapshot_id, asset_id, quantity, unit_price, current_value) VALUES
('snp_con_1_prev', 'snp_con_1', 'ast_prev', 1, 51000.00, 51000.00),
('snp_con_1_itsa4', 'snp_con_1', 'ast_itsa4', 10, 14.50, 145.00);

INSERT INTO portfolio_analyses (
  id, portfolio_id, snapshot_id, score_value, score_status, primary_problem, primary_action,
  portfolio_decision, action_plan_text, summary_text, messaging_json, generated_at
) VALUES (
  'anl_con_1',
  'pfl_seed_concentrated',
  'snp_con_1',
  48,
  'risco_alto',
  'Concentracao extrema em um unico bloco.',
  'Parar de reforcar o bloco dominante e diversificar.',
  'Conter novos aportes no bloco dominante.',
  '1) Definir teto por classe\n2) Redirecionar aportes\n3) Revisar risco',
  'Carteira com risco concentrado alto.',
  '{"tone":"alerta","headline":"Concentracao extrema"}',
  CURRENT_TIMESTAMP
);

INSERT INTO analysis_insights (id, analysis_id, insight_type, title, message, priority) VALUES
('ins_con_1', 'anl_con_1', 'concentration', 'Um bloco domina a carteira', 'A maior parte do patrimonio esta em Previdencia.', 1);

INSERT INTO operational_events (id, user_id, portfolio_id, event_type, event_status, message) VALUES
('evt_con_1', 'usr_seed_concentrated', 'pfl_seed_concentrated', 'seed_created', 'ok', 'Cenario concentrated criado.');

-- Cenario 3: carteira vazia (com contexto) para testar estados "empty"
INSERT INTO users (id, cpf, email, password_hash, display_name, status) VALUES
('usr_seed_empty', '99988877766', 'empty@example.com', 'pbkdf2_sha256$60000$7VxV33eIoNB07+/sLCXkAg==$KwzQwPqOkh0VdDtMdILtvAJTaOjgTnFK9czN+QybK44=', 'Usuario Empty', 'ACTIVE');

INSERT INTO auth_sessions (id, user_id, session_token_hash, remember_device, expires_at, created_at, last_seen_at) VALUES
('ses_seed_empty', 'usr_seed_empty', '575a474bedc88fcd8e64833f61af36d2587cf599698e308d89fb094fe0343c64', 1, '2099-01-01T00:00:00.000Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO portfolios (id, user_id, name, is_primary, status) VALUES
('pfl_seed_empty', 'usr_seed_empty', 'Carteira Principal', 1, 'active');

INSERT INTO user_financial_context (
  id, user_id, financial_goal, monthly_income_range, monthly_investment_target, available_to_invest,
  risk_profile, risk_profile_self_declared, risk_profile_quiz_result, risk_profile_effective,
  investment_horizon, platforms_used_json, display_preferences_json, onboarding_step, onboarding_completed_at
) VALUES (
  'ctx_seed_empty',
  'usr_seed_empty',
  'comecar a investir',
  '3k-5k',
  300,
  200,
  'conservador',
  'conservador',
  'conservador',
  'conservador',
  'medio_prazo',
  '{"platformIds":["xp"],"otherPlatforms":[]}',
  '{"ghostMode":false}',
  'confirm',
  '2026-03-31T00:00:00.000Z'
);

INSERT INTO operational_events (id, user_id, portfolio_id, event_type, event_status, message) VALUES
('evt_empty_1', 'usr_seed_empty', 'pfl_seed_empty', 'seed_created', 'ok', 'Cenario empty criado.');
