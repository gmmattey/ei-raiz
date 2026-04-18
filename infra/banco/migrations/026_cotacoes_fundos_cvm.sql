-- Cotações diárias de fundos de investimento via CVM Dados Abertos.
--
-- Fonte: https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/
-- O arquivo mensal (inf_diario_fi_YYYYMM.csv) traz VL_QUOTA por CNPJ por dia.
-- A ingestão é feita via script Node local (scripts/ingerir-cvm-cotas.mjs)
-- que filtra pelos CNPJs presentes em ativos.cnpj_fundo e faz upsert em lote.
--
-- Esta tabela complementa — não substitui — o provedor BRAPI:
-- ations/ETFs/BDRs/FIIs listados seguem via BRAPI (ticker);
-- fundos tradicionais por CNPJ entram aqui.

CREATE TABLE IF NOT EXISTS cotas_fundos_cvm (
  cnpj          TEXT NOT NULL,        -- CNPJ do fundo (somente dígitos, 14 chars)
  data_ref      TEXT NOT NULL,        -- ISO date "YYYY-MM-DD" (DT_COMPTC da CVM)
  vl_quota      REAL NOT NULL,        -- valor da cota no fechamento do dia
  vl_patrim_liq REAL,                 -- patrimônio líquido (opcional, métrica auxiliar)
  nr_cotst      INTEGER,              -- número de cotistas (opcional)
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (cnpj, data_ref)
);

CREATE INDEX IF NOT EXISTS idx_cotas_fundos_cvm_cnpj_data
  ON cotas_fundos_cvm(cnpj, data_ref DESC);

-- Catálogo de fundos registrados na CVM (nome oficial <-> CNPJ).
-- Fonte: https://dados.cvm.gov.br/dados/FI/CAD/DADOS/cad_fi.csv
-- Usado para reconciliar ativos do usuário cadastrados pelo nome com o CNPJ
-- oficial, permitindo preencher ativos.cnpj_fundo em lote.

CREATE TABLE IF NOT EXISTS fundos_cvm_cadastro (
  cnpj               TEXT PRIMARY KEY,     -- somente dígitos
  denominacao_social TEXT NOT NULL,
  denominacao_norm   TEXT NOT NULL,        -- denominação em UPPER sem acentos, para busca
  classe             TEXT,                 -- ex: "Renda Fixa", "Multimercado"
  situacao           TEXT,                 -- ex: "EM FUNCIONAMENTO NORMAL"
  atualizado_em      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fundos_cvm_cadastro_denominacao_norm
  ON fundos_cvm_cadastro(denominacao_norm);
