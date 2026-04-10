# Normalização de ativos (F3.7)

## Estratégia de identificação canônica

- `acao`: prioridade `ISIN` > `ticker` > `nome`.
- `fundo`: prioridade `CNPJ` > `ISIN` > `ticker` > `nome`.
- `previdencia` e `renda_fixa`: prioridade `ISIN` > `CNPJ` > `ticker` > `nome`.

## Campos persistidos

- `identificador_canonico`
- `ticker_canonico`
- `nome_canonico`
- `cnpj_fundo`
- `isin`
- `aliases_json`

## Regras de equivalência usadas na importação

- Um ativo é considerado conflito quando já existe para o usuário com:
- mesmo `identificador_canonico`; ou
- mesmo `ticker` legado; ou
- mesmo `ticker_canonico`; ou
- mesmo `cnpj_fundo`; ou
- mesmo `isin`.

## Impacto no produto

- Importação passa a deduplicar por identidade real e não apenas por ticker textual.
- Camada fica preparada para integração externa por `ticker`, `CNPJ` e `ISIN`.
