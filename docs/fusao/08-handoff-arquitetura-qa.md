# Fusao Quanto + Esquilo — Handoff de Arquitetura e QA

Atualizado em: 2026-06-19
Uso: fechamento explicito do estado atual para a proxima sessao pos-cutover

## 1. Handoff de arquitetura

Estado aceito nesta sessao:

- `src/index.ts` continua como entrypoint vivo do Worker
- `apps/core-api` concentra as rotas e dominios extraidos sem trocar o runtime principal
- `apps/ingestion-plane` concentra BRAPI, CVM, macro e snapshots, mantendo o scheduler preso ao mesmo Worker
- `apps/web` assumiu o ponteiro de assets do deploy real
- `packages/contracts`, `packages/domain` e `packages/ui` sustentam a trilha nova ativa

Decisao operacional:

- o proximo salto estrutural deve focar design evolution, estabilizacao e extracao backend incremental
- qualquer novo rewiring de runtime continua exigindo rollback ensaiado

## 2. Handoff de QA

Evidencia aceita nesta sessao:

- `npm run typecheck` verde
- `npm test` verde (`92/92`) antes do cutover
- `tests/cutover-smoke.spec.ts` verde no recorte pre-cutover
- `tests/scheduler.spec.ts` verde, cobrindo os cron strings oficiais do Worker
- `npm run test:cutover-preflight -- --check-remote-secret` verde
- `npm run test:cutover-postflight -- --base-url https://quanto.giammattey-luiz.workers.dev` verde

Cobertura nova relevante:

- `JWT_SECRET` remoto migrado para `secret_text`
- rastreabilidade minima de import e cron em `operation_logs`
- smoke de PWA atual e shell novo sem colisao de service worker
- ensaio local de rollback de assets entre `apps/web` e `public`

## 3. Trilhas remanescentes

Os pontos abaixo ja nao bloqueiam producao, mas seguem abertos:

1. design system e direcao visual final do app pos-cutover
2. smoke autenticado em producao para confirmar contrato vivo com JWT real
3. observabilidade pos-cutover e telemetria minima
4. reducao gradual do legado em `public/`
5. extracao incremental adicional de `src/index.ts`

## 4. Leitura obrigatoria da proxima sessao

- `docs/fusao/06-operacao-cutover.md`
- `docs/fusao/07-inventario-schema-real.md`
- `docs/fusao/09-trilhas-remanescentes.md`
- este arquivo
