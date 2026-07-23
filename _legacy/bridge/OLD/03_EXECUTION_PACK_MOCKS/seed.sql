-- Seed mínimo para validar contratos e mocks do Esquilo Invest
PRAGMA foreign_keys = ON;

INSERT INTO users (id, auth_provider, auth_provider_user_id, display_name, email)
VALUES ('user_demo_01', 'local', 'demo', 'Luiz Demo', 'luiz.demo@example.com');

INSERT INTO portfolios (id, user_id, name, is_primary, status)
VALUES ('portfolio_demo_01', 'user_demo_01', 'Carteira Principal', 1, 'active');

INSERT INTO platforms (id, code, name, platform_kind)
VALUES
('platform_xp', 'XP', 'XP Investimentos', 'broker'),
('platform_ion', 'ION', 'ION Itaú', 'broker'),
('platform_tim_prev', 'TIM_PREV', 'Previdência TIM', 'pension');

INSERT INTO asset_types (id, code, name, sort_order)
VALUES
('asset_type_stock', 'STOCK', 'Ações', 1),
('asset_type_fund', 'FUND', 'Fundos', 2),
('asset_type_pension', 'PENSION', 'Previdência', 3),
('asset_type_bond', 'BOND', 'Renda Fixa', 4);

INSERT INTO assets (id, asset_type_id, platform_id, code, name, normalized_name, currency_code)
VALUES
('asset_itsa4', 'asset_type_stock', 'platform_xp', 'ITSA4', 'Itaúsa', 'itausa', 'BRL'),
('asset_cple3', 'asset_type_stock', 'platform_xp', 'CPLE3', 'Copel', 'copel', 'BRL'),
('asset_cmin3', 'asset_type_stock', 'platform_ion', 'CMIN3', 'CSN Mineração', 'csn mineracao', 'BRL'),
('asset_tesouro_ipca', 'asset_type_bond', 'platform_ion', 'TESOURO-IPCA', 'Tesouro IPCA 2035', 'tesouro ipca 2035', 'BRL'),
('asset_selection', 'asset_type_fund', 'platform_xp', 'SELECTION-MM', 'Selection Multimercado', 'selection multimercado', 'BRL'),
('asset_tim_prev', 'asset_type_pension', 'platform_tim_prev', 'TIM-PREV', 'Previdência TIM', 'previdencia tim', 'BRL');

INSERT INTO user_financial_context (
  id, user_id, financial_goal, monthly_income_range, monthly_investment_target,
  available_to_invest, risk_profile, investment_horizon, platforms_used_json, display_preferences_json
)
VALUES (
  'ufc_demo_01',
  'user_demo_01',
  'Construir patrimônio com equilíbrio entre crescimento e segurança',
  '8k_15k',
  1200,
  350,
  'moderado',
  'longo_prazo',
  '["XP","ION","TIM_PREV"]',
  '{"ghostMode": false}'
);

INSERT INTO imports (
  id, user_id, portfolio_id, origin, source_platform_id, file_name, mime_type, status,
  total_rows, valid_rows, invalid_rows, duplicate_rows
)
VALUES
('import_demo_01', 'user_demo_01', 'portfolio_demo_01', 'csv_xp', 'platform_xp', 'xp_carteira_fev.csv', 'text/csv', 'committed', 8, 6, 1, 1),
('import_demo_02', 'user_demo_01', 'portfolio_demo_01', 'csv_ion', 'platform_ion', 'ion_carteira_fev.csv', 'text/csv', 'preview_ready', 6, 4, 1, 1);

INSERT INTO import_rows (
  id, import_id, row_number, status, raw_row_json, normalized_row_json, dedup_key, validation_errors_json, conflict_summary_json
)
VALUES
('import_row_01', 'import_demo_02', 1, 'parsed', '{"ticker":"ITSA4","qty":"27"}', '{"assetCode":"ITSA4","quantity":27}', 'platform_xp|ITSA4|2026-02', '[]', '{}'),
('import_row_02', 'import_demo_02', 2, 'duplicate', '{"ticker":"ITSA4","qty":"27"}', '{"assetCode":"ITSA4","quantity":27}', 'platform_xp|ITSA4|2026-02', '[]', '{"reason":"duplicate_in_file"}'),
('import_row_03', 'import_demo_02', 3, 'invalid', '{"ticker":"","qty":"10"}', '{}', '', '["asset_code_missing"]', '{}');

INSERT INTO portfolio_positions (
  id, portfolio_id, asset_id, platform_id, source_import_id, status,
  quantity, average_price, current_price, invested_amount, current_value, target_price, stop_loss, observed_at, notes
)
VALUES
('position_01', 'portfolio_demo_01', 'asset_itsa4', 'platform_xp', 'import_demo_01', 'active', 27, 13.84, 14.52, 373.68, 392.04, 16.50, 12.90, '2026-03-30', 'posição de dividendos'),
('position_02', 'portfolio_demo_01', 'asset_cple3', 'platform_xp', 'import_demo_01', 'active', 28, 13.34, 12.95, 373.52, 362.60, 15.20, 12.20, '2026-03-30', 'empresa defensiva'),
('position_03', 'portfolio_demo_01', 'asset_cmin3', 'platform_ion', 'import_demo_01', 'active', 62, 5.95, 5.22, 368.90, 323.64, 6.80, 5.00, '2026-03-30', 'mais volátil'),
('position_04', 'portfolio_demo_01', 'asset_tesouro_ipca', 'platform_ion', 'import_demo_01', 'active', 1, 1500.00, 1568.00, 1500.00, 1568.00, 0, 0, '2026-03-30', 'proteção de longo prazo'),
('position_05', 'portfolio_demo_01', 'asset_tim_prev', 'platform_tim_prev', 'import_demo_01', 'active', 1, 8450.00, 8795.00, 8450.00, 8795.00, 0, 0, '2026-03-30', 'previdência corporativa');

INSERT INTO portfolio_snapshots (
  id, portfolio_id, import_id, reference_date, total_equity, total_invested, total_profit_loss, total_profit_loss_pct, source_kind, metadata_json
)
VALUES
('snapshot_2026_02', 'portfolio_demo_01', 'import_demo_01', '2026-02-28', 11110.00, 10880.00, 230.00, 2.11, 'system', '{"note":"fechamento fevereiro"}'),
('snapshot_2026_03', 'portfolio_demo_01', 'import_demo_01', '2026-03-30', 11441.28, 11066.10, 375.18, 3.39, 'system', '{"note":"fechamento março"}');

INSERT INTO portfolio_snapshot_positions (
  id, snapshot_id, asset_id, platform_id, quantity, average_price, current_price, invested_amount, current_value, allocation_pct, performance_pct
)
VALUES
('ssp_01', 'snapshot_2026_03', 'asset_itsa4', 'platform_xp', 27, 13.84, 14.52, 373.68, 392.04, 3.43, 4.91),
('ssp_02', 'snapshot_2026_03', 'asset_cple3', 'platform_xp', 28, 13.34, 12.95, 373.52, 362.60, 3.17, -2.93),
('ssp_03', 'snapshot_2026_03', 'asset_cmin3', 'platform_ion', 62, 5.95, 5.22, 368.90, 323.64, 2.83, -12.27),
('ssp_04', 'snapshot_2026_03', 'asset_tesouro_ipca', 'platform_ion', 1, 1500.00, 1568.00, 1500.00, 1568.00, 13.70, 4.53),
('ssp_05', 'snapshot_2026_03', 'asset_tim_prev', 'platform_tim_prev', 1, 8450.00, 8795.00, 8450.00, 8795.00, 76.87, 4.08);

INSERT INTO portfolio_analyses (
  id, portfolio_id, snapshot_id, status, score_value, score_status, primary_problem, primary_action, summary_text, ai_context_json, raw_ai_response, generated_by
)
VALUES
(
  'analysis_demo_01',
  'portfolio_demo_01',
  'snapshot_2026_03',
  'generated',
  67,
  'Atenção moderada',
  'Concentração excessiva em previdência e pouca assimetria na parte de crescimento.',
  'Aumentar gradualmente a fatia de ativos de crescimento com disciplina e sem desmontar a proteção.',
  'Carteira relativamente estável, mas ainda muito dependente de uma perna só.',
  '{"risk":"moderado","goal":"patrimonio"}',
  'Leitura inicial da carteira com foco em concentração e equilíbrio.',
  'system'
);

INSERT INTO analysis_insights (
  id, analysis_id, insight_kind, title, body, severity, sort_order, related_asset_id, related_category_code
)
VALUES
('insight_01', 'analysis_demo_01', 'concentration', 'Concentração excessiva', 'A previdência domina a carteira e reduz a flexibilidade tática.', 'warning', 1, 'asset_tim_prev', 'PENSION'),
('insight_02', 'analysis_demo_01', 'opportunity', 'Crescimento subalocado', 'A parte de ações ainda é pequena para o perfil e horizonte informados.', 'info', 2, NULL, 'STOCK'),
('insight_03', 'analysis_demo_01', 'alert', 'CMIN3 em atenção', 'O ativo está com perda relevante e pede revisão de tese, não reação emocional.', 'warning', 3, 'asset_cmin3', 'STOCK');

INSERT INTO external_data_sources (id, code, name, source_kind, status, config_json)
VALUES
('source_benchmark', 'BENCHMARK', 'Fonte de Benchmarks', 'benchmark', 'active', '{"mode":"mock"}'),
('source_quotes', 'QUOTES', 'Fonte de Cotações', 'quotes', 'active', '{"mode":"mock"}');

INSERT INTO external_market_references (
  id, source_id, reference_code, reference_name, asset_type_scope, reference_date, value, value_pct, currency_code, cache_status, raw_payload_json
)
VALUES
('ref_cdi_2026_03', 'source_benchmark', 'CDI_12M', 'CDI 12 meses', 'ALL', '2026-03-30', 0, 11.15, 'BRL', 'fresh', '{"mock":true}');

INSERT INTO operational_events (
  id, user_id, portfolio_id, event_type, event_status, entity_type, entity_id, import_id, snapshot_id, analysis_id, message, details_json
)
VALUES
('event_01', 'user_demo_01', 'portfolio_demo_01', 'import_committed', 'success', 'import', 'import_demo_01', 'import_demo_01', NULL, NULL, 'Importação confirmada com sucesso.', '{"origin":"csv_xp"}'),
('event_02', 'user_demo_01', 'portfolio_demo_01', 'snapshot_created', 'success', 'snapshot', 'snapshot_2026_03', NULL, 'snapshot_2026_03', NULL, 'Snapshot mensal criado.', '{"reference_date":"2026-03-30"}'),
('event_03', 'user_demo_01', 'portfolio_demo_01', 'analysis_generated', 'success', 'analysis', 'analysis_demo_01', NULL, 'snapshot_2026_03', 'analysis_demo_01', 'Análise principal da carteira gerada.', '{"score":67}');
