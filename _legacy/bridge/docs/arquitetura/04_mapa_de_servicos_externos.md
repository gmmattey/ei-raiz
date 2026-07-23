# Mapa de servicos externos

## Objetivo

Mapear integracoes externas e responsabilidades tecnicas sem misturar isso com regra de negocio.

## Servicos observados

### Telegram

- finalidade: envio de alertas
- modulo: `backend/modules/notifications`

### Apps Script Email

- finalidade: envio legado de e-mail
- modulo esperado: notificacoes
- observacao: nao ha integracao oficial consolidada na base atual

### Provedores de IA

- finalidade: traducao ou enriquecimento textual
- modulo esperado: camada de traducao por IA
- observacao: a fronteira ainda nao esta consolidada em runtime oficial

### Cloudflare D1

- finalidade: persistencia principal do backend novo
- modulo: backend como um todo

## Regras

- cada servico externo deve ter uma fronteira tecnica clara
- integracao externa nao deve ficar duplicada em modulos diferentes
- regra de negocio nao deve ficar embutida no adaptador externo

## Servicos futuros

- APIs de corretora
- feeds de preco

## Regra final

Servico externo entrega infraestrutura ou dado.
Decisao de produto continua no dominio.
