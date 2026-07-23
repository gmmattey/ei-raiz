-- Cenario extra: onboarding (sem contexto preenchido)
-- Objetivo: forcar `hasContext = 0` nas rotas que dependem de `user_financial_context`.

INSERT INTO users (id, cpf, email, password_hash, display_name, status) VALUES
('usr_seed_onboarding', '10101010101', 'onboarding@example.com', 'pbkdf2_sha256$210000$AQIDBAUGBwgJCgsMDQ4PEA$jbWPdVpAx7pu8ZCx0wY0j1VsKVnFfedYNCZR6r-R19Y', 'Usuario Onboarding', 'ACTIVE');

INSERT INTO auth_sessions (id, user_id, session_token_hash, remember_device, expires_at, created_at, last_seen_at) VALUES
('ses_seed_onboarding', 'usr_seed_onboarding', '82bdc0432ffefc6e289e08dbd56fb730bdd8c69a38f8d437d43e01dce3f2db97', 1, '2099-01-01T00:00:00.000Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO portfolios (id, user_id, name, is_primary, status) VALUES
('pfl_seed_onboarding', 'usr_seed_onboarding', 'Carteira Principal', 1, 'active');

INSERT INTO operational_events (id, user_id, portfolio_id, event_type, event_status, message) VALUES
('evt_onb_1', 'usr_seed_onboarding', 'pfl_seed_onboarding', 'seed_created', 'ok', 'Cenario onboarding criado (sem contexto).');
