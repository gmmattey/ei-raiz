-- =====================================================================
-- Esquilo Invest — Schema canônico
-- Branch: refactor/backend-rebuild-canonical
-- Greenfield: DROP completo + CREATE das 26 tabelas + 9 views
-- =====================================================================
-- Convenções:
--   - snake_case, plural
--   - sufixos: _id (FK), _em (timestamp), _pct, _brl, _json, _hash
--   - toda FK com ON DELETE explícito
--   - todo usuario_id com FK CASCADE
-- =====================================================================

PRAGMA foreign_keys = ON;

-- =====================================================================
-- DROP das tabelas antigas (greenfield)
-- =====================================================================
DROP VIEW IF EXISTS vw_admin_ingestao_cvm;
DROP VIEW IF EXISTS vw_mercado_ativo_detalhe;
DROP VIEW IF EXISTS vw_patrimonio_score_historico;
DROP VIEW IF EXISTS vw_patrimonio_score_atual;
DROP VIEW IF EXISTS vw_patrimonio_aportes_mes;
DROP VIEW IF EXISTS vw_patrimonio_evolucao_mensal;
DROP VIEW IF EXISTS vw_patrimonio_alocacao;
DROP VIEW IF EXISTS vw_patrimonio_posicoes;
DROP VIEW IF EXISTS vw_patrimonio_resumo;

DROP TABLE IF EXISTS telemetria_eventos;
DROP TABLE IF EXISTS admin_auditoria;
DROP TABLE IF EXISTS admin_usuarios;
DROP TABLE IF EXISTS conteudo_blocos;
DROP TABLE IF EXISTS configuracoes_menu;
DROP TABLE IF EXISTS feature_flags;
DROP TABLE IF EXISTS configuracoes_produto;
DROP TABLE IF EXISTS cvm_execucoes;
DROP TABLE IF EXISTS decisoes_simulacoes;
DROP TABLE IF EXISTS importacao_itens;
DROP TABLE IF EXISTS importacoes;
DROP TABLE IF EXISTS patrimonio_fila_reconstrucao;
DROP TABLE IF EXISTS patrimonio_scores;
DROP TABLE IF EXISTS patrimonio_historico_mensal;
DROP TABLE IF EXISTS patrimonio_aportes;
DROP TABLE IF EXISTS patrimonio_itens;
DROP TABLE IF EXISTS perfis_financeiros;
DROP TABLE IF EXISTS recuperacoes_acesso;
DROP TABLE IF EXISTS usuario_plataformas;
DROP TABLE IF EXISTS usuario_preferencias;
DROP TABLE IF EXISTS ativos_cotacoes_cache;
DROP TABLE IF EXISTS fundos_cvm_cotas;
DROP TABLE IF EXISTS fundos_cvm;
DROP TABLE IF EXISTS ativos;
DROP TABLE IF EXISTS corretoras;
DROP TABLE IF EXISTS usuarios;

-- Tabelas legadas (podem existir em bancos antigos)
DROP TABLE IF EXISTS plataformas_vinculadas;
DROP TABLE IF EXISTS perfil_financeiro;
DROP TABLE IF EXISTS perfil_contexto_financeiro;
DROP TABLE IF EXISTS itens_importacao;
DROP TABLE IF EXISTS posicoes_financeiras;
DROP TABLE IF EXISTS ativos_movimentacoes;
DROP TABLE IF EXISTS aportes;
DROP TABLE IF EXISTS snapshots_patrimonio;
DROP TABLE IF EXISTS snapshots_score;
DROP TABLE IF EXISTS snapshots_score_unificado;
DROP TABLE IF EXISTS portfolio_snapshots;
DROP TABLE IF EXISTS portfolio_analytics;
DROP TABLE IF EXISTS historico_carteira_mensal;
DROP TABLE IF EXISTS fila_reconstrucao_carteira;
DROP TABLE IF EXISTS cotacoes_ativos_cache;
DROP TABLE IF EXISTS cotacoes_fundos_cvm;
DROP TABLE IF EXISTS fundos_cvm_cadastro;
DROP TABLE IF EXISTS cvm_ingestion_runs;
DROP TABLE IF EXISTS cvm_backfill_runs;
DROP TABLE IF EXISTS preferencias_usuario;
DROP TABLE IF EXISTS recuperacao_senhas_pins;
DROP TABLE IF EXISTS simulacoes;
DROP TABLE IF EXISTS simulacoes_historico;
DROP TABLE IF EXISTS simulacoes_parametros;
DROP TABLE IF EXISTS content_blocks;
DROP TABLE IF EXISTS corretoras_suportadas;

-- =====================================================================
-- DOMÍNIO: usuario
-- =====================================================================

CREATE TABLE usuarios (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  cpf        TEXT UNIQUE,
  senha_hash TEXT NOT NULL,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE corretoras (
  id      TEXT PRIMARY KEY,
  nome    TEXT NOT NULL,
  codigo  TEXT NOT NULL UNIQUE,
  esta_ativa INTEGER NOT NULL DEFAULT 1,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE usuario_preferencias (
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  chave      TEXT NOT NULL,
  valor_json TEXT NOT NULL DEFAULT '{}',
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (usuario_id, chave)
);

CREATE TABLE usuario_plataformas (
  id             TEXT PRIMARY KEY,
  usuario_id     TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  corretora_id   TEXT NOT NULL REFERENCES corretoras(id) ON DELETE RESTRICT,
  status         TEXT NOT NULL DEFAULT 'ativa' CHECK(status IN ('ativa','desconectada','erro')),
  vinculado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE recuperacoes_acesso (
  id          TEXT PRIMARY KEY,
  usuario_id  TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pin_hash    TEXT NOT NULL,
  expira_em   TEXT NOT NULL,
  usado_em    TEXT,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================================
-- DOMÍNIO: perfil
-- =====================================================================

CREATE TABLE perfis_financeiros (
  usuario_id         TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  renda_mensal_brl   REAL,
  aporte_mensal_brl  REAL,
  horizonte_meses    INTEGER,
  tolerancia_risco   TEXT CHECK(tolerancia_risco IN ('conservador','moderado','arrojado')),
  objetivos_json     TEXT NOT NULL DEFAULT '[]',
  atualizado_em      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================================
-- DOMÍNIO: mercado (catálogos)
-- =====================================================================

CREATE TABLE ativos (
  id           TEXT PRIMARY KEY,
  ticker       TEXT UNIQUE,
  cnpj         TEXT UNIQUE,
  isin         TEXT,
  nome         TEXT NOT NULL,
  tipo         TEXT NOT NULL CHECK(tipo IN ('acao','fii','etf','fundo','renda_fixa','previdencia','cripto','outro')),
  classe       TEXT,
  subclasse    TEXT,
  moeda        TEXT NOT NULL DEFAULT 'BRL',
  indexador    TEXT,
  taxa_pct     REAL,
  data_inicio  TEXT,
  data_vencimento TEXT,
  aliases_json TEXT NOT NULL DEFAULT '[]',
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE ativos_cotacoes_cache (
  ativo_id    TEXT NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
  fonte       TEXT NOT NULL,
  cotado_em   TEXT NOT NULL,
  preco_brl   REAL NOT NULL,
  expira_em   TEXT NOT NULL,
  dados_json  TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (ativo_id, fonte)
);

CREATE TABLE fundos_cvm (
  cnpj        TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  classe      TEXT,
  situacao    TEXT,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE fundos_cvm_cotas (
  cnpj             TEXT NOT NULL REFERENCES fundos_cvm(cnpj) ON DELETE CASCADE,
  data             TEXT NOT NULL,
  valor_cota       REAL NOT NULL,
  patrimonio_liquido_brl REAL,
  captacao_brl     REAL,
  resgate_brl      REAL,
  PRIMARY KEY (cnpj, data)
);

-- =====================================================================
-- DOMÍNIO: patrimonio
-- =====================================================================

CREATE TABLE patrimonio_itens (
  id               TEXT PRIMARY KEY,
  usuario_id       TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ativo_id         TEXT REFERENCES ativos(id) ON DELETE SET NULL,
  tipo             TEXT NOT NULL CHECK(tipo IN ('acao','fii','etf','fundo','renda_fixa','previdencia','cripto','caixa','poupanca','imovel','veiculo','divida','outro')),
  origem           TEXT NOT NULL DEFAULT 'manual' CHECK(origem IN ('manual','importacao','vinculo_corretora','sincronizado')),
  nome             TEXT NOT NULL,
  quantidade       REAL,
  preco_medio_brl  REAL,
  valor_atual_brl  REAL,
  moeda            TEXT NOT NULL DEFAULT 'BRL',
  esta_ativo       INTEGER NOT NULL DEFAULT 1,
  dados_json       TEXT NOT NULL DEFAULT '{}',
  criado_em        TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE patrimonio_aportes (
  id           TEXT PRIMARY KEY,
  usuario_id   TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  item_id      TEXT REFERENCES patrimonio_itens(id) ON DELETE SET NULL,
  tipo         TEXT NOT NULL CHECK(tipo IN ('aporte','retirada','transferencia','ajuste')),
  valor_brl    REAL NOT NULL,
  data         TEXT NOT NULL,
  descricao    TEXT,
  origem       TEXT NOT NULL DEFAULT 'manual',
  criado_em    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE patrimonio_historico_mensal (
  usuario_id               TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ano_mes                  TEXT NOT NULL,
  patrimonio_bruto_brl     REAL NOT NULL DEFAULT 0,
  patrimonio_liquido_brl   REAL NOT NULL DEFAULT 0,
  divida_brl               REAL NOT NULL DEFAULT 0,
  aporte_mes_brl           REAL NOT NULL DEFAULT 0,
  rentabilidade_mes_pct    REAL,
  eh_confiavel             INTEGER NOT NULL DEFAULT 1,
  dados_json               TEXT NOT NULL DEFAULT '{}',
  atualizado_em            TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (usuario_id, ano_mes)
);

CREATE TABLE patrimonio_scores (
  id                 TEXT PRIMARY KEY,
  usuario_id         TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  calculado_em       TEXT NOT NULL DEFAULT (datetime('now')),
  score_total        REAL NOT NULL,
  faixa              TEXT NOT NULL CHECK(faixa IN ('critico','baixo','medio','bom','excelente')),
  confianca_pct      REAL,
  patrimonio_bruto_brl REAL,
  patrimonio_liquido_brl REAL,
  divida_brl         REAL,
  pilares_json       TEXT NOT NULL DEFAULT '{}',
  inputs_resumo_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE patrimonio_fila_reconstrucao (
  id            TEXT PRIMARY KEY,
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  motivo        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','processando','concluido','falhou')),
  agendado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  iniciado_em   TEXT,
  processado_em TEXT,
  erro          TEXT
);

CREATE TABLE importacoes (
  id           TEXT PRIMARY KEY,
  usuario_id   TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  origem       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','validado','confirmado','falhou')),
  iniciado_em  TEXT NOT NULL DEFAULT (datetime('now')),
  concluido_em TEXT
);

CREATE TABLE importacao_itens (
  id             TEXT PRIMARY KEY,
  importacao_id  TEXT NOT NULL REFERENCES importacoes(id) ON DELETE CASCADE,
  linha          INTEGER NOT NULL,
  tipo           TEXT NOT NULL,
  resultado      TEXT NOT NULL DEFAULT 'pendente' CHECK(resultado IN ('pendente','aceito','rejeitado','duplicado')),
  dados_json     TEXT NOT NULL DEFAULT '{}'
);

-- =====================================================================
-- DOMÍNIO: decisoes
-- =====================================================================

CREATE TABLE decisoes_simulacoes (
  id              TEXT PRIMARY KEY,
  usuario_id      TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK(tipo IN ('aporte','imovel','veiculo','aposentadoria','outro')),
  premissas_json  TEXT NOT NULL DEFAULT '{}',
  resultado_json  TEXT NOT NULL DEFAULT '{}',
  criado_em       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================================
-- DOMÍNIO: telemetria
-- =====================================================================

CREATE TABLE telemetria_eventos (
  id          TEXT PRIMARY KEY,
  usuario_id  TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  evento      TEXT NOT NULL,
  ocorrido_em TEXT NOT NULL DEFAULT (datetime('now')),
  dados_json  TEXT NOT NULL DEFAULT '{}'
);

-- =====================================================================
-- DOMÍNIO: admin
-- =====================================================================

CREATE TABLE admin_usuarios (
  email       TEXT PRIMARY KEY,
  papel       TEXT NOT NULL DEFAULT 'operador' CHECK(papel IN ('operador','editor','dono')),
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE admin_auditoria (
  id          TEXT PRIMARY KEY,
  autor_email TEXT NOT NULL,
  acao        TEXT NOT NULL,
  recurso     TEXT,
  dados_json  TEXT NOT NULL DEFAULT '{}',
  ocorrido_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE configuracoes_produto (
  chave        TEXT PRIMARY KEY,
  valor_json   TEXT NOT NULL DEFAULT '{}',
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE feature_flags (
  chave        TEXT PRIMARY KEY,
  esta_ativa   INTEGER NOT NULL DEFAULT 0,
  descricao    TEXT,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE configuracoes_menu (
  id          TEXT PRIMARY KEY,
  titulo      TEXT NOT NULL,
  icone       TEXT,
  rota        TEXT NOT NULL,
  ordem       INTEGER NOT NULL DEFAULT 0,
  esta_ativo  INTEGER NOT NULL DEFAULT 1,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE conteudo_blocos (
  chave        TEXT PRIMARY KEY,
  titulo       TEXT,
  corpo        TEXT NOT NULL,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE cvm_execucoes (
  id            TEXT PRIMARY KEY,
  modo          TEXT NOT NULL CHECK(modo IN ('ingestao','backfill')),
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','executando','concluido','falhou')),
  iniciado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  concluido_em  TEXT,
  parametros_json TEXT NOT NULL DEFAULT '{}',
  resultado_json  TEXT NOT NULL DEFAULT '{}',
  erro          TEXT
);

-- =====================================================================
-- ÍNDICES
-- =====================================================================

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuario_plataformas_usuario ON usuario_plataformas(usuario_id);
CREATE INDEX idx_recuperacoes_acesso_usuario ON recuperacoes_acesso(usuario_id);

CREATE INDEX idx_patrimonio_itens_usuario ON patrimonio_itens(usuario_id);
CREATE INDEX idx_patrimonio_itens_usuario_tipo ON patrimonio_itens(usuario_id, tipo);
CREATE INDEX idx_patrimonio_itens_ativo ON patrimonio_itens(ativo_id);

CREATE INDEX idx_patrimonio_aportes_usuario ON patrimonio_aportes(usuario_id);
CREATE INDEX idx_patrimonio_aportes_usuario_data ON patrimonio_aportes(usuario_id, data);
CREATE INDEX idx_patrimonio_aportes_item ON patrimonio_aportes(item_id);

CREATE INDEX idx_patrimonio_scores_usuario_calculado ON patrimonio_scores(usuario_id, calculado_em);

CREATE INDEX idx_patrimonio_fila_status ON patrimonio_fila_reconstrucao(status, agendado_em);

CREATE INDEX idx_importacoes_usuario ON importacoes(usuario_id);
CREATE INDEX idx_importacao_itens_importacao ON importacao_itens(importacao_id);

CREATE INDEX idx_ativos_ticker ON ativos(ticker);
CREATE INDEX idx_ativos_cnpj ON ativos(cnpj);

CREATE INDEX idx_fundos_cvm_cotas_cnpj_data ON fundos_cvm_cotas(cnpj, data);

CREATE INDEX idx_decisoes_simulacoes_usuario ON decisoes_simulacoes(usuario_id, criado_em);

CREATE INDEX idx_telemetria_eventos_usuario_em ON telemetria_eventos(usuario_id, ocorrido_em);
CREATE INDEX idx_telemetria_eventos_evento ON telemetria_eventos(evento, ocorrido_em);

CREATE INDEX idx_cvm_execucoes_modo_status ON cvm_execucoes(modo, status, iniciado_em);

-- =====================================================================
-- VIEWS
-- =====================================================================

-- Resumo consolidado para Home (1 row por usuário)
CREATE VIEW vw_patrimonio_resumo AS
SELECT
  u.id AS usuario_id,
  COALESCE(totais.bruto_brl, 0)   AS patrimonio_bruto_brl,
  COALESCE(totais.divida_brl, 0)  AS divida_brl,
  COALESCE(totais.bruto_brl, 0) - COALESCE(totais.divida_brl, 0) AS patrimonio_liquido_brl,
  COALESCE(totais.quantidade_itens, 0) AS quantidade_itens,
  ultimo_score.score_total        AS score_total,
  ultimo_score.faixa              AS score_faixa,
  ultimo_score.calculado_em       AS score_calculado_em,
  aportes_mes.valor_brl           AS aporte_mes_brl,
  ultimo_mes.rentabilidade_mes_pct AS rentabilidade_mes_pct
FROM usuarios u
LEFT JOIN (
  SELECT
    usuario_id,
    SUM(CASE WHEN tipo <> 'divida' THEN COALESCE(valor_atual_brl, 0) ELSE 0 END) AS bruto_brl,
    SUM(CASE WHEN tipo = 'divida'  THEN COALESCE(valor_atual_brl, 0) ELSE 0 END) AS divida_brl,
    COUNT(*) AS quantidade_itens
  FROM patrimonio_itens
  WHERE esta_ativo = 1
  GROUP BY usuario_id
) totais ON totais.usuario_id = u.id
LEFT JOIN (
  SELECT s.usuario_id, s.score_total, s.faixa, s.calculado_em
  FROM patrimonio_scores s
  WHERE s.calculado_em = (
    SELECT MAX(s2.calculado_em) FROM patrimonio_scores s2 WHERE s2.usuario_id = s.usuario_id
  )
) ultimo_score ON ultimo_score.usuario_id = u.id
LEFT JOIN (
  SELECT usuario_id, SUM(valor_brl) AS valor_brl
  FROM patrimonio_aportes
  WHERE tipo = 'aporte' AND substr(data, 1, 7) = substr(datetime('now'), 1, 7)
  GROUP BY usuario_id
) aportes_mes ON aportes_mes.usuario_id = u.id
LEFT JOIN (
  SELECT h.usuario_id, h.rentabilidade_mes_pct
  FROM patrimonio_historico_mensal h
  WHERE h.ano_mes = (
    SELECT MAX(h2.ano_mes) FROM patrimonio_historico_mensal h2 WHERE h2.usuario_id = h.usuario_id
  )
) ultimo_mes ON ultimo_mes.usuario_id = u.id;

-- Lista de posições para Carteira/DetalheAtivo
CREATE VIEW vw_patrimonio_posicoes AS
SELECT
  i.id AS item_id,
  i.usuario_id,
  i.tipo,
  i.origem,
  i.nome,
  i.ativo_id,
  a.ticker,
  a.cnpj,
  a.classe,
  a.subclasse,
  i.quantidade,
  i.preco_medio_brl,
  i.valor_atual_brl,
  c.preco_brl      AS preco_atual_brl,
  c.cotado_em      AS preco_atualizado_em,
  c.fonte          AS preco_fonte,
  CASE
    WHEN i.preco_medio_brl IS NULL OR i.preco_medio_brl = 0 THEN NULL
    WHEN c.preco_brl IS NOT NULL THEN ((c.preco_brl - i.preco_medio_brl) / i.preco_medio_brl) * 100
    WHEN i.valor_atual_brl IS NOT NULL AND i.quantidade IS NOT NULL AND i.quantidade <> 0
      THEN (((i.valor_atual_brl / i.quantidade) - i.preco_medio_brl) / i.preco_medio_brl) * 100
    ELSE NULL
  END AS rentabilidade_pct,
  i.criado_em,
  i.atualizado_em
FROM patrimonio_itens i
LEFT JOIN ativos a ON a.id = i.ativo_id
LEFT JOIN ativos_cotacoes_cache c ON c.ativo_id = i.ativo_id AND c.fonte = 'brapi'
WHERE i.esta_ativo = 1;

-- Alocação agregada por classe/subclasse
CREATE VIEW vw_patrimonio_alocacao AS
SELECT
  i.usuario_id,
  i.tipo,
  a.classe,
  a.subclasse,
  COUNT(*) AS quantidade_itens,
  SUM(COALESCE(i.valor_atual_brl, 0)) AS valor_total_brl
FROM patrimonio_itens i
LEFT JOIN ativos a ON a.id = i.ativo_id
WHERE i.esta_ativo = 1 AND i.tipo <> 'divida'
GROUP BY i.usuario_id, i.tipo, a.classe, a.subclasse;

-- Série mensal para Home/Historico
CREATE VIEW vw_patrimonio_evolucao_mensal AS
SELECT
  usuario_id,
  ano_mes,
  patrimonio_bruto_brl,
  patrimonio_liquido_brl,
  divida_brl,
  aporte_mes_brl,
  rentabilidade_mes_pct,
  eh_confiavel
FROM patrimonio_historico_mensal
ORDER BY usuario_id, ano_mes;

-- Aportes agregados por mês
CREATE VIEW vw_patrimonio_aportes_mes AS
SELECT
  usuario_id,
  substr(data, 1, 7) AS ano_mes,
  SUM(CASE WHEN tipo = 'aporte'     THEN valor_brl ELSE 0 END) AS aportes_brl,
  SUM(CASE WHEN tipo = 'retirada'   THEN valor_brl ELSE 0 END) AS retiradas_brl,
  COUNT(*) AS quantidade_movimentos
FROM patrimonio_aportes
GROUP BY usuario_id, substr(data, 1, 7);

-- Score atual (último por usuário)
CREATE VIEW vw_patrimonio_score_atual AS
SELECT s.*
FROM patrimonio_scores s
WHERE s.calculado_em = (
  SELECT MAX(s2.calculado_em) FROM patrimonio_scores s2 WHERE s2.usuario_id = s.usuario_id
);

-- Histórico de scores (1 por mês — pega o último do mês)
CREATE VIEW vw_patrimonio_score_historico AS
SELECT
  usuario_id,
  substr(calculado_em, 1, 7) AS ano_mes,
  MAX(calculado_em)          AS calculado_em,
  MAX(score_total)           AS score_total,
  MAX(faixa)                 AS faixa
FROM patrimonio_scores
GROUP BY usuario_id, substr(calculado_em, 1, 7);

-- Detalhe de ativo + cotação + metadados CVM
CREATE VIEW vw_mercado_ativo_detalhe AS
SELECT
  a.id,
  a.ticker,
  a.cnpj,
  a.nome,
  a.tipo,
  a.classe,
  a.subclasse,
  a.moeda,
  a.indexador,
  a.taxa_pct,
  a.data_inicio,
  a.data_vencimento,
  c.preco_brl       AS preco_atual_brl,
  c.cotado_em       AS preco_atualizado_em,
  c.fonte           AS preco_fonte,
  f.classe          AS fundo_cvm_classe,
  f.situacao        AS fundo_cvm_situacao
FROM ativos a
LEFT JOIN ativos_cotacoes_cache c ON c.ativo_id = a.id AND c.fonte = 'brapi'
LEFT JOIN fundos_cvm f ON f.cnpj = a.cnpj;

-- Últimas execuções CVM para painel admin
CREATE VIEW vw_admin_ingestao_cvm AS
SELECT
  modo,
  status,
  iniciado_em,
  concluido_em,
  CAST((julianday(COALESCE(concluido_em, datetime('now'))) - julianday(iniciado_em)) * 86400 AS INTEGER) AS duracao_segundos,
  parametros_json,
  resultado_json,
  erro
FROM cvm_execucoes
ORDER BY iniciado_em DESC;
