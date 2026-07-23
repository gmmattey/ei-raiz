# Fusao Quanto + Esquilo — Operacao, Deploy, Cutover e Rollback

Atualizado em: 2026-06-19
Uso: playbook operacional da fase de cutover concluido, com `apps/web` ativo no Worker principal

## 1. Estado operacional atual

O runtime vivo agora e:

- `wrangler.toml` apontando para `src/index.ts`
- assets servidos por `apps/web`
- cron do Worker atual preservado no mesmo deploy

Configuracao observada em `wrangler.toml` nesta data:

| Item | Estado atual | Leitura operacional |
| --- | --- | --- |
| `main` | `src/index.ts` | correto para preservar o runtime vivo |
| `[assets].directory` | `apps/web` | cutover visual concluido |
| D1 binding | `DB -> quanto-db` | alinhado com o runtime atual |
| crons | BRAPI diario, snapshot mensal, CVM diario, cadastro CVM mensal | wiring atual mantido |
| `[ai].binding` | `AI` | alinhado com as rotas atuais |
| `[vars].BRAPI_BASE_URL` | presente | nao sensivel |
| `[vars].JWT_SECRET` | ausente | correto; secret sensivel saiu do arquivo versionado |

## 2. O que ja pode ser tratado como validado

- `apps/web` esta servindo o shell oficial do Worker principal
- `apps/web` deixou de depender de `/packages/ui` e de `public/fonts` no modo buildless: `runtime-ui/`, `runtime-fonts/` e `template-quanto.xlsx` agora sao sincronizados para dentro do proprio app
- `packages/ui` e `packages/contracts` ja alimentam a trilha nova
- `packages/domain` ja concentra parte dos calculos puros reaproveitados pelo backend extraido
- `npm run typecheck` cobre `src/`, `apps/` e `packages/`
- `operation_logs` passou a rastrear import batch e rotinas de cron sem quebrar o runtime
- `npm test` passou inteiro (`92/92`) em 2026-06-19
- `tests/cutover-smoke.spec.ts` compara `public/` e `apps/web` contra o mesmo runtime vivo
- `tests/scheduler.spec.ts` prova o wiring dos quatro crons do Worker com auditoria minima
- `npm run test:rollback-rehearsal` ensaiou o fluxo local de cutover para `apps/web` e rollback para `public` sem tocar no `wrangler.toml` versionado
- `npm run test:cutover-worker` sobe um Worker local temporario com `--assets apps/web`, valida `manifest.json`, `sw.js` e reload offline da trilha nova servida na raiz
- `npm run test:cutover-postflight -- --base-url <url>` ja foi validado localmente contra um Worker temporario com `apps/web` na raiz, checando health, shell, manifesto, service worker e icones sem harness de browser

## 3. Estado do cutover

O cutover visual foi concluido em 2026-06-19.

Estado observado:

- `wrangler.toml` agora aponta para `apps/web`
- o binding remoto de `JWT_SECRET` foi migrado com seguranca para `secret_text`, preservando o mesmo valor
- a versao remota de auth normalizada `d51f5d79-eb72-461e-b57d-73127d591ece` foi promovida antes do cutover visual
- o deploy de cutover publicou a versao `26e20fd8-ff20-44d0-ae0f-c795da1e3865`
- a URL validada em postflight foi `https://quanto.giammattey-luiz.workers.dev`

## 4. Procedimento seguro de deploy nesta fase

Para futuras promocoes, o deploy seguro continua sendo:

```powershell
npm run test:cutover-preflight
npm run typecheck
npm test
wrangler deploy
```

Regras:

- nao mover `main` para `apps/core-api`
- nao aplicar migracao irreversivel junto com primeira troca visual
- nao promover mudancas de runtime se `tests/web-pilot.spec.ts`, `tests/cutover-worker.spec.ts` ou `test:cutover-postflight` falharem

### Preflight recomendado antes de qualquer deploy serio

Use um gate curto e repetivel antes de qualquer promocao:

```powershell
npm run test:cutover-preflight
```

Esse comando:

- sincroniza `apps/web` com `packages/ui` e `public/`
- roda `npm run typecheck`
- executa `wrangler deploy --dry-run` para o runtime atual e para o combo `src/index.ts + apps/web`
- valida scheduler, smoke de coexistencia, Worker temporario com `apps/web` na raiz, vertical viva e rollback local

Quando houver autenticacao do Wrangler no ambiente alvo, complemente com:

```powershell
npm run test:cutover-preflight -- --check-remote-secret
```

Isso adiciona a checagem remota do binding atual de `JWT_SECRET` sem executar deploy.

## 5. Sequencia executada no cutover

1. `JWT_SECRET` remoto foi migrado para `secret_text`
2. `npm run test:cutover-preflight -- --check-remote-secret` passou
3. `[assets].directory` foi trocado para `apps/web`
4. `wrangler deploy --message "codex cutover assets to apps/web"` publicou a versao `26e20fd8-ff20-44d0-ae0f-c795da1e3865`
5. `npm run test:cutover-postflight -- --base-url https://quanto.giammattey-luiz.workers.dev` passou

Smoke recomendado logo apos a promocao:

```powershell
npm run test:cutover-postflight -- --base-url https://<worker-ou-dominio>
```

Se houver um JWT valido para o ambiente:

```powershell
npm run test:cutover-postflight -- --base-url https://<worker-ou-dominio> --token <jwt>
```

Esse smoke confirma:

- `/api/health`
- shell novo servido na raiz
- `manifest.json` da trilha nova
- `sw.js` com cache esperado de `apps/web`
- icones PWA acessiveis
- `GET /api/portfolio` quando um token valido for fornecido

## 6. Rollback minimo escrito

Se uma promocao futura do shell falhar:

1. restaurar o ponteiro de assets para a versao anterior ou rollbackar o deployment
2. restaurar `main = "src/index.ts"` se alguma composicao experimental tiver sido promovida
3. reexecutar deploy do Worker com a configuracao anterior
4. validar imediatamente:
   - `/api/health`
   - `npm run test:cutover-postflight -- --base-url <url>`
   - login
   - total da `Hoje`
   - `Carteira`
   - `Detalhe`
   - `Importar`
   - `Bens`
5. manter a versao anterior do shell como referencia de rollback ate novo ciclo de validacao

## 7. Checklist operacional minima antes de qualquer troca

- ultimo `npm test` verde
- ultimo `tests/web-pilot.spec.ts` verde
- ultimo `tests/cutover-worker.spec.ts` verde
- ultimo `npm run test:cutover-postflight` verde
- plano de rollback revisado
- docs de fusao atualizadas no mesmo ciclo da mudanca

## 8. Decisao desta sessao

Nesta sessao e no cutover final:

- `wrangler.toml` deixou de carregar `JWT_SECRET` em texto plano
- `operation_logs` entrou como trilha minima de auditoria para import e cron
- o wiring dos cron jobs foi coberto por teste dedicado
- o shell novo passou a carregar seus assets locais via `runtime-ui/`, `runtime-fonts/` e `template-quanto.xlsx`
- o rollback local de assets foi ensaiado com `npm run test:rollback-rehearsal`
- a trilha nova ganhou `manifest.json` proprio, icones locais e prova de offline sob Worker temporario com `npm run test:cutover-worker`
- o gate `npm run test:cutover-preflight -- --check-remote-secret` passou inteiro e confirmou `JWT_SECRET` como `secret_text` na versao remota ativa `d51f5d79-eb72-461e-b57d-73127d591ece`
- o smoke `npm run test:cutover-postflight` tambem foi validado localmente e ficou pronto para o dia da promocao real
- o cutover visual foi executado e validado contra `https://quanto.giammattey-luiz.workers.dev`

Isso conclui o recorte de cutover sem violar o guardrail de preservar `src/index.ts` como runtime de backend.
