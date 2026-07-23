CREATE VIEW vw_legacy_acoes AS
SELECT
  pp.source_kind AS tipo,
  COALESCE(a.code, a.display_name) AS ativo,
  pl.name AS plataforma,
  pp.status AS status,
  pp.situacao AS situacao,
  pp.opened_at AS data_entrada,
  pp.quantity AS quantidade,
  pp.average_price AS preco_medio,
  pp.current_price AS cotacao_atual,
  pp.invested_amount AS valor_investido,
  pp.current_amount AS valor_atual,
  pp.stop_loss AS stop_loss,
  pp.target_price AS alvo,
  pp.profitability AS rentabilidade,
  pp.notes AS observacao,
  pp.updated_at AS atualizado_em,
  pp.opened_at AS entrada,
  pp.quantity AS qtd,
  pp.stop_loss AS stop
FROM portfolio_positions pp
JOIN assets a
  ON a.id = pp.asset_id
LEFT JOIN platforms pl
  ON pl.id = pp.platform_id
WHERE pp.source_kind = 'ACOES';

CREATE VIEW vw_legacy_fundos AS
SELECT
  a.display_name AS fundo,
  pl.name AS plataforma,
  pp.category_label AS categoria,
  pp.strategy AS estrategia,
  pp.status AS status,
  pp.situacao AS situacao,
  pp.opened_at AS data_inicio,
  pp.invested_amount AS valor_investido,
  pp.current_amount AS valor_atual,
  pp.profitability AS rentabilidade,
  pp.notes AS observacao,
  pp.updated_at AS atualizado_em,
  pp.opened_at AS inicio
FROM portfolio_positions pp
JOIN assets a
  ON a.id = pp.asset_id
LEFT JOIN platforms pl
  ON pl.id = pp.platform_id
WHERE pp.source_kind = 'FUNDOS';

CREATE VIEW vw_legacy_previdencia AS
SELECT
  a.display_name AS plano,
  pl.name AS plataforma,
  pp.source_kind AS tipo,
  pp.strategy AS estrategia,
  pp.status AS status,
  pp.situacao AS situacao,
  pp.opened_at AS data_inicio,
  pp.invested_amount AS valor_investido,
  pp.current_amount AS valor_atual,
  pp.profitability AS rentabilidade,
  pp.notes AS observacao,
  pp.updated_at AS atualizado_em,
  a.display_name AS plano_fundo,
  pp.opened_at AS inicio,
  pp.invested_amount AS total_aportado
FROM portfolio_positions pp
JOIN assets a
  ON a.id = pp.asset_id
LEFT JOIN platforms pl
  ON pl.id = pp.platform_id
WHERE pp.source_kind = 'PREVIDENCIA';

CREATE VIEW vw_legacy_pre_ordens AS
SELECT
  po.tipo AS tipo,
  COALESCE(a.code, po.raw_asset_name, a.display_name) AS ativo,
  pl.name AS plataforma,
  po.tipo_ordem AS tipo_ordem,
  po.quantity AS quantidade,
  po.target_price AS preco_alvo,
  po.validity_date AS validade,
  po.potential_value AS valor_potencial,
  po.current_price AS cotacao_atual,
  po.status AS status,
  po.notes AS observacao,
  po.quantity AS qtd
FROM planned_orders po
LEFT JOIN assets a
  ON a.id = po.asset_id
LEFT JOIN platforms pl
  ON pl.id = po.platform_id;

CREATE VIEW vw_legacy_aportes AS
SELECT
  pc.contribution_month AS mes_ano,
  pc.destination_label AS destino,
  pc.category_label AS categoria,
  pl.name AS plataforma,
  pc.amount AS valor,
  pc.accumulated_amount AS acumulado,
  pc.status AS status
FROM portfolio_contributions pc
LEFT JOIN platforms pl
  ON pl.id = pc.platform_id;

-- Nao e seguro gerar view de compatibilidade para app_config nesta versao.
-- O schema D1 atual nao possui uma estrutura equivalente direta e suficientemente
-- sustentada pela documentacao para reproduzir com fidelidade o contrato legado
-- de chave, valor, descricao e atualizado_em sem introduzir suposicoes.
