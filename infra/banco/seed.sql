DELETE FROM snapshots_patrimonio;
DELETE FROM recuperacoes_acesso;
DELETE FROM itens_importacao;
DELETE FROM importacoes;
DELETE FROM ativos;
DELETE FROM plataformas_vinculadas;
DELETE FROM perfil_financeiro;
DELETE FROM usuarios;

INSERT INTO usuarios (id, cpf, email, senha_hash, nome)
VALUES ('usr_luiz_mendonca', '12345678901', 'luiz@esquiloinvest.com', '120000:CxYhLDdCTVhjChQeKDI8Rg==:gfsZUs7zOKy6pRorlQQx/xB5qUzdPAIXsm8m0CoCX+Q=', 'Luiz Mendonça');

INSERT INTO usuarios (id, cpf, email, senha_hash, nome)
VALUES ('usr_admin_padrao', '39053344705', 'admin123456@admin.com.br', '120000:ZCWAYaGnmQqwipRuKJ0e3g==:fPzr3As4EHMKLEFK6tZO8ZIYFzv0Mm4WZiyqeQ9UH3A=', 'Administrador');

INSERT INTO perfil_financeiro (id, usuario_id, renda_mensal, aporte_mensal, horizonte, perfil_risco, objetivo, maturidade)
VALUES (
  'perf_luiz',
  'usr_luiz_mendonca',
  32000.00,
  9000.00,
  'longo_prazo',
  'moderado',
  'independencia_financeira',
  4
);

INSERT INTO plataformas_vinculadas (id, usuario_id, nome, ultimo_import, status) VALUES
  ('plat_xp', 'usr_luiz_mendonca', 'XP Investimentos', '2026-03-30', 'ativo'),
  ('plat_nubank', 'usr_luiz_mendonca', 'NuInvest', '2026-03-25', 'ativo'),
  ('plat_inter', 'usr_luiz_mendonca', 'Inter Invest', '2026-03-18', 'ativo');

INSERT INTO ativos (id, usuario_id, ticker, nome, categoria, plataforma, quantidade, preco_medio, valor_atual, participacao, rentabilidade_desde_aquisicao_pct) VALUES
  ('ativo_1', 'usr_luiz_mendonca', 'ITSA4', 'Itausa PN', 'acao', 'XP Investimentos', 320.00, 9.12, 3264.00, 5.8, 13.1),
  ('ativo_2', 'usr_luiz_mendonca', 'BOVA11', 'iShares Ibovespa', 'fundo', 'XP Investimentos', 90.00, 106.42, 10143.00, 18.0, 11.5),
  ('ativo_3', 'usr_luiz_mendonca', 'MXRF11', 'Maxi Renda FII', 'fundo', 'NuInvest', 680.00, 10.07, 7208.00, 12.8, 9.7),
  ('ativo_4', 'usr_luiz_mendonca', 'TESOURO-IPCA-2035', 'Tesouro IPCA+ 2035', 'renda_fixa', 'Inter Invest', 12.00, 2885.00, 35280.00, 31.4, 8.2),
  ('ativo_5', 'usr_luiz_mendonca', 'PREV-ALFA', 'Previdencia Alfa', 'previdencia', 'XP Investimentos', 1.00, 11020.00, 12450.00, 11.1, 7.1),
  ('ativo_6', 'usr_luiz_mendonca', 'KNCR11', 'Kinea Rendimentos', 'fundo', 'NuInvest', 170.00, 99.20, 17765.00, 15.8, 10.4),
  ('ativo_7', 'usr_luiz_mendonca', 'IVVB11', 'iShares S&P 500', 'fundo', 'Inter Invest', 56.00, 283.00, 16240.00, 14.4, 21.8);

INSERT INTO snapshots_patrimonio (id, usuario_id, data, valor_total, variacao_percentual) VALUES
  ('snap_2025_04', 'usr_luiz_mendonca', '2025-04-01', 86200.00, -1.4),
  ('snap_2025_05', 'usr_luiz_mendonca', '2025-05-01', 87490.00, 1.5),
  ('snap_2025_06', 'usr_luiz_mendonca', '2025-06-01', 88920.00, 1.6),
  ('snap_2025_07', 'usr_luiz_mendonca', '2025-07-01', 90510.00, 1.8),
  ('snap_2025_08', 'usr_luiz_mendonca', '2025-08-01', 91840.00, 1.5),
  ('snap_2025_09', 'usr_luiz_mendonca', '2025-09-01', 93570.00, 1.9),
  ('snap_2025_10', 'usr_luiz_mendonca', '2025-10-01', 94920.00, 1.4),
  ('snap_2025_11', 'usr_luiz_mendonca', '2025-11-01', 96310.00, 1.5),
  ('snap_2025_12', 'usr_luiz_mendonca', '2025-12-01', 97880.00, 1.6),
  ('snap_2026_01', 'usr_luiz_mendonca', '2026-01-01', 99490.00, 1.6),
  ('snap_2026_02', 'usr_luiz_mendonca', '2026-02-01', 100920.00, 1.4),
  ('snap_2026_03', 'usr_luiz_mendonca', '2026-03-01', 102350.00, 1.4);
