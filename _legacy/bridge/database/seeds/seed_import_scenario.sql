-- Cenario extra: importacao com conflitos / erros / baixa confianca
-- Alinhado ao schema oficial: `database/d1/schema.sql`

INSERT INTO users (id, cpf, email, password_hash, display_name, status) VALUES
('usr_seed_import', '12345678901', 'import@example.com', 'pbkdf2_sha256$210000$CxglMj9MWWZzgI2ap7TBzg$MUW8bazRDO-EHwo7MZykt7Uyp5P7vLffjUwWuOOEqX8', 'Usuario Import', 'ACTIVE');

INSERT INTO auth_sessions (id, user_id, session_token_hash, remember_device, expires_at, created_at, last_seen_at) VALUES
('ses_seed_import', 'usr_seed_import', '2dfb2778ddf7a737890cd1be489f6a6be42f7a62aff456763e2a1982726a0542', 1, '2099-01-01T00:00:00.000Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO portfolios (id, user_id, name, is_primary, status) VALUES
('pfl_seed_import', 'usr_seed_import', 'Carteira Principal', 1, 'active');

INSERT INTO user_financial_context (
  id, user_id, financial_goal, monthly_income_range, monthly_investment_target, available_to_invest,
  risk_profile, risk_profile_self_declared, risk_profile_quiz_result, risk_profile_effective,
  investment_horizon, platforms_used_json, display_preferences_json, onboarding_step, onboarding_completed_at
) VALUES (
  'ctx_seed_import',
  'usr_seed_import',
  'organizar carteira',
  '5k-10k',
  800,
  400,
  'moderado',
  'moderado',
  'moderado',
  'moderado',
  'medio_prazo',
  '{"platformIds":["xp"],"otherPlatforms":[]}',
  '{"ghostMode":false}',
  'confirm',
  '2026-03-31T00:00:00.000Z'
);

-- Base de carteira (para deduplicacao)
INSERT INTO portfolio_positions (
  id, portfolio_id, asset_id, platform_id, source_kind, status,
  quantity, average_price, current_price, invested_amount, current_amount, category_label, notes
) VALUES
('pos_imp_1', 'pfl_seed_import', 'ast_itsa4', 'plt_xp', 'manual', 'active', 15, 13.50, 14.50, 202.50, 217.50, 'Acoes', 'Posicao previa para testar duplicidade');

-- Import 1: pendente / pronto para revisao
INSERT INTO imports (
  id, user_id, portfolio_id, origin, status, file_name, mime_type,
  total_rows, valid_rows, invalid_rows, duplicate_rows,
  created_at, started_at, updated_at
) VALUES (
  'imp_seed_pending',
  'usr_seed_import',
  'pfl_seed_import',
  'manual',
  'PREVIEW_READY',
  'import_manual_demo.json',
  'application/json',
  5, 1, 3, 1,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO import_rows (id, import_id, row_number, source_payload_json, normalized_payload_json, resolution_status, error_message) VALUES
(
  'row_imp_1',
  'imp_seed_pending',
  1,
  '{"sourceKind":"manual","name":"Itausa","code":"ITSA4","quantity":5,"investedAmount":67.50,"currentAmount":72.50}',
  '{"sourceKind":"manual","code":"ITSA4","name":"Itausa","normalizedName":"itausa","quantity":5,"investedAmount":67.50,"currentAmount":72.50,"averagePrice":13.50,"currentPrice":14.50,"categoryLabel":"Acoes","notes":"","fieldSources":{},"fieldConfidences":{},"warnings":[],"reviewMeta":{},"documentMeta":null,"duplicateCandidates":[],"importable":true}',
  'NORMALIZED',
  NULL
),
(
  'row_imp_2',
  'imp_seed_pending',
  2,
  '{"sourceKind":"manual","name":"Itausa","code":"ITSA4","quantity":10,"investedAmount":135.00,"currentAmount":145.00}',
  '{"sourceKind":"manual","code":"ITSA4","name":"Itausa","normalizedName":"itausa","quantity":10,"investedAmount":135.00,"currentAmount":145.00,"averagePrice":13.50,"currentPrice":14.50,"categoryLabel":"Acoes","notes":"","fieldSources":{},"fieldConfidences":{},"warnings":["Possivel duplicidade com posicao existente"],"reviewMeta":{},"documentMeta":null,"duplicateCandidates":[{"assetId":"ast_itsa4","assetCode":"ITSA4","assetName":"Itausa","quantity":15,"investedAmount":202.50,"currentAmount":217.50}],"importable":true}',
  'PENDING',
  'Possivel duplicidade com ativo ja existente na carteira.'
),
(
  'row_imp_3',
  'imp_seed_pending',
  3,
  '{"sourceKind":"manual","name":"","code":"","quantity":0}',
  '{"sourceKind":"manual","code":"","name":"","normalizedName":"","quantity":0,"investedAmount":0,"currentAmount":0,"averagePrice":null,"currentPrice":null,"categoryLabel":"Acoes","notes":"","fieldSources":{},"fieldConfidences":{},"warnings":["Linha invalida"],"reviewMeta":{},"documentMeta":null,"duplicateCandidates":[],"importable":true}',
  'FAILED',
  'Linha invalida: faltam campos obrigatorios.'
),
(
  'row_imp_4',
  'imp_seed_pending',
  4,
  '{"sourceKind":"manual","name":"Previdencia Demo","code":"","quantity":1,"investedAmount":10000,"currentAmount":10100}',
  '{"sourceKind":"manual","code":"","name":"Previdencia Demo","normalizedName":"previdencia demo","quantity":1,"investedAmount":10000,"currentAmount":10100,"averagePrice":10000,"currentPrice":10100,"categoryLabel":"Previdencia","notes":"","fieldSources":{"name":"ia"},"fieldConfidences":{"name":0.45},"warnings":["Baixa confianca em campo critico"],"reviewMeta":{},"documentMeta":{"parserMode":"seed","confidence":0.45},"duplicateCandidates":[],"importable":true}',
  'PENDING_CRITICAL',
  'Ha campos criticos com baixa confianca.'
),
(
  'row_imp_5',
  'imp_seed_pending',
  5,
  '{"sourceKind":"manual","name":"Documento nao importavel","code":"","quantity":1}',
  '{"sourceKind":"manual","code":"","name":"Documento nao importavel","normalizedName":"documento nao importavel","quantity":1,"investedAmount":0,"currentAmount":0,"averagePrice":null,"currentPrice":null,"categoryLabel":"Outros","notes":"","fieldSources":{},"fieldConfidences":{},"warnings":["Documento identificado como nao importavel"],"reviewMeta":{},"documentMeta":{"importable":false},"duplicateCandidates":[],"importable":false}',
  'BLOCKED_NON_IMPORTABLE',
  'Documento identificado como nao importavel para posicao de carteira.'
);

-- Import 2: concluida com snapshot (para testar Imports Center com snapshot_id)
INSERT INTO imports (
  id, user_id, portfolio_id, origin, status, file_name, mime_type,
  total_rows, valid_rows, invalid_rows, duplicate_rows,
  created_at, started_at, updated_at, finished_at
) VALUES (
  'imp_seed_done',
  'usr_seed_import',
  'pfl_seed_import',
  'manual',
  'COMMITTED',
  'import_done_demo.json',
  'application/json',
  1, 1, 0, 0,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO portfolio_snapshots (
  id, portfolio_id, import_id, reference_date, total_equity, total_invested, total_profit_loss, total_profit_loss_pct
) VALUES
('snp_imp_1', 'pfl_seed_import', 'imp_seed_done', '2026-03-31', 217.50, 202.50, 15.00, 7.41);

INSERT INTO portfolio_snapshot_positions (id, snapshot_id, asset_id, quantity, unit_price, current_value) VALUES
('snp_imp_1_itsa4', 'snp_imp_1', 'ast_itsa4', 15, 14.50, 217.50);

INSERT INTO operational_events (id, user_id, portfolio_id, event_type, event_status, message) VALUES
('evt_imp_1', 'usr_seed_import', 'pfl_seed_import', 'seed_created', 'ok', 'Cenario import criado (pendente e concluido).');
