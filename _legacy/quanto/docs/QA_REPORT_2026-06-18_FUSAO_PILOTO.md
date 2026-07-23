# Quanto - QA da Fusao Piloto

**Data:** 2026-06-18 (com complemento de evidencia em 2026-06-19)  
**Escopo:** contratos canonicos iniciais, base visual em `packages/ui`, `Hoje`, `Carteira`, `Historico`, `Bens` com mutacoes minimas, cadastro minimo de ativo, primeira fatia de `Importar`, a primeira versao mutavel de `Detalhe` em `apps/web` e as primeiras extracoes backend seguras para `apps/core-api`, consumindo o runtime vivo.

## Resumo executivo

- `npm run typecheck` - aprovado
- `npm test` - aprovado (`90/90`)
- `npm run test:auth` - aprovado (`4/4`)
- `npm run test:api` - aprovado (`18/18`)
- `npx playwright test tests/web-pilot.spec.ts` - aprovado (`10/10`)
- `npx playwright test tests/cutover-smoke.spec.ts` - aprovado (`2/2`)
- `npx playwright test tests/scheduler.spec.ts` - aprovado (`2/2`)
- `npm run test:rollback-rehearsal` - aprovado
- O runtime atual permaneceu intacto: a regressao de API passou inteira sem religar `wrangler.toml`

## O que foi validado

### Runtime vivo

- `GET /api/portfolio` continua consolidando total, gain, frescor, benchmarks, quote health e patrimonio bruto
- login, cadastro e recover continuam validados por API e por interface no runtime vivo, sem rewiring do frontend principal
- CRUD, aportes, importacao, bens, lifecycle e cron mensal continuaram verdes na suite `tests/api.spec.ts`
- O contrato vivo usado pela trilha nova segue coerente com `src/index.ts` e com as migrations atuais
- `src/index.ts` segue como entrypoint real, mas auth, `portfolio`, `goods`, `detail/history`, o bloco mutavel de `assets/detail` e os primeiros helpers compartilhados de runtime/market/AI ja foram extraidos para `apps/core-api/*` sem regressao observada
- `src/cvm.ts` virou adapter fino sobre `apps/ingestion-plane/cvm.ts`, preservando o pipeline vivo de CVM sem rewiring de deploy
- o scheduler vivo agora chama implementacoes extraidas de `apps/ingestion-plane` para BRAPI, macro e snapshots, sem regressao observada
- `operation_logs` agora rastreia `import_batch`, `cron_brapi_quotes`, `cron_macro`, `cron_snapshot`, `cron_cvm_quotes` e `cron_cvm_catalog` sem acoplar o usuario final a uma superficie nova
- o repo deixou de versionar `JWT_SECRET` em `wrangler.toml`; o harness local injeta secret via `.dev.vars` temporario e o ambiente alvo passa a exigir secret real fora do repo
- o modelo canonico de `portfolio/import` foi formalizado em `packages/domain/portfolio-import.ts` com adapters puros e teste dedicado de compatibilidade do runtime atual
- `src/index.ts` perdeu os endpoints vivos restantes para `apps/core-api/*` e passou a operar majoritariamente como casca de composicao e wiring do scheduler, sem regressao observada
- `packages/contracts` agora tambem alimenta diretamente o backend extraido: enums e DTOs canonicos de `portfolio`, `goods`, `detail` e `import` passaram a ser consumidos em `apps/core-api`
- o `npm run typecheck` oficial deixou de ignorar a extracao: `apps/**/*.ts` agora entram no gate de tipos junto com `src/` e `packages/`
- `packages/domain/portfolio-metrics.ts` passou a concentrar calculos puros de ganho, bens por tipo e patrimonio bruto, reaproveitados pelas rotas extraidas de `portfolio`, `goods` e `detail`
- `apps/core-api` ja atua como concentrador real dos dominios extraidos do backend vivo, com `src/index.ts` reduzido principalmente a composicao, auth deps e wiring do scheduler
- `apps/ingestion-plane` ja deixou de ser scaffold: BRAPI, CVM, macro e snapshots vivem em modulos dedicados e typechecked, mesmo antes de qualquer split de deploy

### Trilha nova paralela

- `apps/web/index.html` sobe como preview estatico em paralelo
- o login minimo da trilha nova autentica via `POST /api/auth/login`
- a `Hoje` nova consome `GET /api/portfolio` e `GET /api/history`
- a `Carteira` nova consome o mesmo `GET /api/portfolio` e ja cobre agrupamento, busca, chips e secao `Em resgate`
- a `Carteira` nova ja cria ativo manual, automatico e fundo CVM via `POST /api/assets`, incluindo instituicao `OUTROS`, data de compra para automatico e busca em `GET /api/funds/search`
- a `Historico` nova consome `GET /api/history` em tela dedicada
- a `Importar` nova processa `.xlsx/.xls`, revisa itens, expõe alertas nao bloqueantes, remove linhas invalidas e persiste o lote valido via `POST /api/import`
- a `Bens` nova consome `GET /api/goods`, cruza o bruto com `GET /api/portfolio`, cria FGTS/imovel/veiculo via `POST /api/goods`, edita via `PUT /api/goods/:id` e arquiva via `DELETE /api/goods/:id`
- a suite piloto de `Bens` agora tambem comprova no UI os metadados ricos que vieram do runtime vivo: empregador no FGTS, area/cidade-UF/financiamento em imovel e marca-modelo/ano em veiculo
- o `Detalhe` novo abre a partir de `Carteira` e consome `GET /api/assets/:id/detail`
- o `Detalhe` novo ja permite atualizar saldo manual, registrar aporte, remover aporte, editar nome do ativo, arquivar ativo e executar lifecycle basico direto na trilha nova
- o `Detalhe` novo agora tambem consome `POST /api/ai/analyze` com fallback amigavel quando a AI nao estiver disponivel no runtime do teste
- `apps/web` agora registra `sw.js` proprio, usa cache local para portfolio/history/goods/detail e recarrega offline mostrando o ultimo estado valido salvo
- o shell novo renderiza em `mobile` e `desktop`
- o toggle de ocultar valores mascara o total renderizado
- o bloco de historico de cotacao no detalhe resolve para grafico ou fallback degradado, sem travar a tela
- `public/` e `apps/web` agora possuem smoke automatizado de cutover seguro, comparando leitura de Hoje, Historico, Carteira e Detalhe contra o mesmo runtime vivo
- a coexistencia entre a PWA atual (`public/sw.js`) e o shell novo (`apps/web/sw.js`) agora tem smoke explicito, provando caches separados e assets sem colisao
- o `cutover-smoke` continua confirmando que `public/` e `apps/web` leem o mesmo total na `Hoje` antes de atravessar Historico, Carteira e Detalhe
- a suite `tests/web-pilot.spec.ts` agora tambem cobre `dark mode` e mascara de valores em `Hoje`, `Carteira`, `Historico`, `Bens` e `Detalhe`, rodando em `mobile` e `desktop`
- `tests/scheduler.spec.ts` agora prova o wiring dos quatro crons do Worker e a preservacao minima de cache para BRAPI, macro e CVM sem depender de deploy real
- `npm run test:rollback-rehearsal` ensaia localmente a troca temporaria de assets para `apps/web` e o retorno para `public`, sem alterar o `wrangler.toml` versionado

## Observacao operacional

Durante a primeira tentativa, rodar duas suites Playwright em paralelo gerou interferencia no mesmo `wrangler dev` local e no mesmo D1 local. O resultado valido desta sessao veio de execucao sequencial:

```text
npm run typecheck
npx playwright test tests/web-pilot.spec.ts
npm run test:api
```

Se o D1 local entrar em estado residual entre tentativas, a limpeza segura usada nesta sessao foi:

```text
Remove-Item -LiteralPath .wrangler\state\v3\d1 -Recurse -Force
Remove-Item -LiteralPath .wrangler\test-state\v3\d1 -Recurse -Force
```

## Risco residual

| Risco | Status | Acao |
|-------|--------|------|
| `apps/web` ainda nao esta servido pelo Worker real | esperado nesta fase | manter preview paralelo ate haver paridade funcional maior |
| `Bens` ainda pode receber polimento visual e limpeza de fluxos secundarios | aceitavel | manter a area fora da lista de bloqueios funcionais centrais; o contrato vivo e a superficie principal de cadastro/edicao/arquivamento ja estao cobertos |
| `Historico` de cotacao do detalhe pode degradar no provider/mock atual | conhecido | manter fallback amigavel no shell novo e validar provider antes de exigir grafico como gate |
| smoke da trilha nova depende de servidor estatico auxiliar | aceitavel para piloto | trocar por wiring oficial apenas no cutover |
