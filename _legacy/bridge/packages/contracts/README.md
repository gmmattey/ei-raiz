# Contracts

Esta pasta e a casa oficial dos contratos compartilhados entre front e back.

Regra:

- payload compartilhado novo nasce aqui
- envelope HTTP e estruturas comuns tambem pertencem aqui
- tipos dentro do starter sao adaptadores temporarios e nao substituem esta pasta como fonte oficial

Exemplos:
- schemas de payload
- tipos compartilhados
- mapeamento de tags da IA
- envelopes de erro e meta

## Regra desta fase

Enquanto `apps/web` e `apps/mobile` ainda nao sao projetos Node, estes contratos sao mantidos como **documentacao executavel** (markdown) e devem bater com o payload real do runtime atual (`04_STARTER_BACKEND/esquilo_cloudflare_d1_starter`).

Envelope HTTP oficial:

- sucesso: `{ ok: true, meta, data }`
- erro: `{ ok: false, meta, error }`

Headers de correlacao:

- `x-request-id` (sempre)
- `x-error-code` (apenas em erro)
