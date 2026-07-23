# API

> ⚠️ **Esta pasta é documental e contratual — não é o runtime executável.**
> O backend em execução está em `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter`.
> Esta pasta define o contrato HTTP oficial e serve como destino estrutural da absorção do starter.

Esta pasta é a casa final oficial do backend novo.

Nesta fase, o runtime executável ainda está em:

- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter`

Papel desta pasta agora:

- definir contrato HTTP oficial
- registrar rotas e fronteiras por domínio
- servir como destino estrutural da absorção do starter

Regra:

- não abrir API nova fora desta trilha
- não tratar esta pasta como "documentação opcional"
- toda mudança relevante de rota deve ficar coerente com o runtime oficial de transição

## Envelope HTTP (oficial)

O backend responde sempre em JSON no formato:

- sucesso: `{ ok: true, meta: { requestId, timestamp, version }, data }`
- erro: `{ ok: false, meta: { requestId, timestamp, version }, error: { code, message, details? } }`

Headers de correlação:

- `x-request-id` (sempre)
- `x-error-code` (apenas em erro)

Erros padrão do roteamento:

- `route_not_found` (404)
- `method_not_allowed` (405) com header `Allow`

Responsabilidades esperadas:
- health
- profile/context
- dashboard/home
- portfolio
- holding detail
- imports
- history
- analysis

