-- Campos para renda fixa contratada (CDB, LCI/LCA, Tesouro, Debêntures) e previdência.
--
-- Família C (renda_fixa) e Previdência precisam de valor marcado a mercado
-- a partir de:
--     valor_atual_mercado = valor_contratado × fator_correcao(indexador, taxa, data_inicio → hoje)
--
-- Sem esses campos, RF/Prev caíam em (preço × quantidade) — cálculo sem sentido
-- para contratos indexados. O campo `preco_medio` passa a guardar "valor
-- contratado" nesses casos e `quantidade` = 1.
--
-- indexador:  'CDI' | 'IPCA' | 'PRE' | 'SELIC' | 'IGPM' (nulo para outras famílias)
-- taxa:       número percentual — 110 para "110% CDI", 6.5 para "IPCA+6.5%",
--             12.5 para "12.5% a.a. prefixado". Escala: pontos percentuais.
-- data_inicio:data de contratação / início do rendimento (ISO 8601)
-- vencimento: data de resgate/maturidade (ISO 8601, nulo se sem prazo)

ALTER TABLE ativos ADD COLUMN indexador TEXT;
ALTER TABLE ativos ADD COLUMN taxa REAL;
ALTER TABLE ativos ADD COLUMN data_inicio TEXT;
ALTER TABLE ativos ADD COLUMN vencimento TEXT;
