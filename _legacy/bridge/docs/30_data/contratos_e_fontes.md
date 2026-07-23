# Contratos e fontes

## Fonte principal do produto novo
- dados persistidos no D1
- contexto do usuário
- snapshots da carteira
- análises persistidas

## Fontes auxiliares
- importação de arquivo
- input manual
- CVM para fundos quando fizer sentido
- Banco Central para séries de referência
- fonte pública auxiliar apenas como contingência

## Regra
O dado do usuário é a base da posição.
Fonte externa complementa.
Fonte externa não deve sobrescrever silenciosamente a origem do usuário.

## Contratos centrais
- health
- home
- portfolio
- holding detail
- profile/context
- history/snapshots
- imports start/preview/commit
- analysis
