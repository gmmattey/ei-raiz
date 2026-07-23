# packages/domain

Camada para regras puras e calculos compartilhados.

Arquivos vivos nesta etapa:

- `portfolio-import.ts` - modelo canonico de portfolio/import e adapters puros para o runtime atual
- `portfolio-metrics.ts` - calculos puros de ganho, bens por tipo e patrimonio bruto reutilizados pelo backend extraido

Entram aqui, em ondas seguintes:

- consolidacao mais profunda de portfolio
- regras de status/lifecycle
- calculos de alocacao
- frescor
- helpers de reconciliacao

Regra:

- `packages/domain` descreve o modelo alvo e a logica pura de transicao
- ele pode ser mais canonico que o runtime atual, desde que tenha adapters explicitos de coexistencia
