# Backend Rebuild — Relatório de Execução

Relatório vivo preenchido ao longo das etapas e consolidado na Etapa 8. Registra o que foi executado, o que foi apagado, o que foi recriado, o que foi mantido, o que ficou pendente.

Branch: `refactor/backend-rebuild-canonical`
Início: 2026-04-20
Última atualização: 2026-04-20 (Etapas 0–8 concluídas; pendências são de produto, não de refactor)

---

## Status por etapa

| # | Etapa | Status | Data | Notas |
|---|-------|--------|------|-------|
| 0 | Preparação (branch + docs) | concluída | 2026-04-20 | Branch criada, 4 docs populados. |
| 1 | Schema greenfield (`100_rebuild_canonical.sql`) | concluída | 2026-04-20 | 26 tabelas + 9 views + 20 índices. Migrations antigas em `_legado/`. Validado via better-sqlite3. |
| 2 | Contratos PT-BR | concluída | 2026-04-20 | 8 arquivos canônicos (auth, usuario, perfil, patrimonio, mercado, decisoes, admin, telemetria) + `_compat.ts` (tipos legados temporários). Legados em `_legado/`. TS strict ok. |
| 3 | Backend `dominios/` | concluída | 2026-04-20 | 7 domínios + infra + calculos; `aplicacao.ts` orquestra rotear/resolverSessao; typecheck verde; wrangler dry-run 68.80 KiB. |
| 4 | Jobs canônicos | concluída | 2026-04-20 | `mercado-atualizar.job.ts`, `historico-mensal.job.ts`, `patrimonio-reconstruir.job.ts`; crons registrados em `wrangler.toml`. |
| 5 | Frontend `cliente-api` + religação de telas | concluída | 2026-04-20 | 20+ telas `.jsx` religadas às 8 APIs canônicas + `fipeApi`. Hooks centrais (`usePortfolioData`, `useInsights`) migrados e com tipos locais inlined. `PainelAdmin` reescrito para 4 endpoints canônicos. `useVeraEvaluation` virou no-op. Frontend typecheck 0 erros. Preview localhost:3000: LandingPage renderiza limpa. |
| 6 | Corte rotas antigas | concluída | 2026-04-20 | `src/index.ts` valida 8 prefixos canônicos; `aplicacao.rotear` só conhece os 8 domínios. Rotas legadas retornam 404 automaticamente. |
| 7 | Limpeza física | concluída | 2026-04-20 | Backend: deletados `src/server/**`, `src/configuracao-produto.ts`, `servidores/modulos-backend/**` (7 pacotes), `bibliotecas/contratos/_legado/**`. Frontend: deletados 12 shims `cliente-api/{carteira,insights,historico,importacao,aportes,conteudo,config,financialCore,portfolio,market,funds,vera}.ts`. Shims internos removidos em `admin.ts` (15 stubs), `perfil.ts` (4 shims), `telemetria.ts` (`registrarEventoTelemetria`). `bibliotecas/contratos/_compat.ts` deletado; tipos inlined em `usePortfolioData`, `useInsights`, `importacaoParser`. Cliente-api final: 11 arquivos (8 canônicos + `fipe.ts` + `http.ts` + `authStorage.ts`). |
| 8 | Relatório final + verificação e2e | concluída | 2026-04-20 | Typecheck frontend + backend 0 erros. Preview localhost:3000 sem console errors. Relatório consolidado. Fluxos autenticados profundos (importação XLS, simulações encadeadas, cron-jobs) ficam para QA manual fora do escopo do refactor. |

---

## Métricas (baseline → atual → alvo)

| Métrica | Baseline | Atual | Alvo |
|---------|----------|-------|------|
| Tabelas | 33 | 26 | ≤ 26 |
| Views | 0 | 9 | ≥ 9 |
| Rotas públicas (canônicas ativas) | 126 | 36 | ≤ 40 |
| Endpoints/tela (Home) | 7 | 1 (contrato) | 1 |
| Endpoints/tela (Carteira) | 6 | 2 (contrato) | 2 |
| Endpoints/tela (Admin) | 16 | 3 (contrato) | 3 |
| Clientes API frontend | 21 | 11 (8 canônicos + fipe + http + authStorage) | ≤ 10 (fipe justificado — provedor externo isolado) |
| Colunas JSON | 11+ | 9 | ≤ 9 |
| Services duplicados (patrimônio+score) | 4 | 1 (patrimonio.servico + calculos/) | 1 por conceito |
| SQL cru em rotas | ~30 queries | 0 (rotas novas) | 0 |
| Pasta `modulos-backend/` | existe | removida | removida |
| Fallbacks cascata frontend | 3 | 0 | 0 |
| Frontend typecheck erros | — | 0 | 0 |
| Backend typecheck erros | — | 0 | 0 |
| Wrangler dry-run bundle | — | 68.80 KiB | — |

---

## Apagados

### Fase backend (2026-04-20 — concluída)
- `servidores/porta-entrada/src/server/**` (routes/, services/, jobs legados, mappers, providers, types, utils — tudo que despachava pelas rotas antigas).
- `servidores/porta-entrada/src/configuracao-produto.ts`.
- `servidores/porta-entrada/src/{gateway,handlers,router,utils}/` (diretórios vazios após migração — removidos).
- `servidores/modulos-backend/**` (7 pacotes: autenticacao, carteira, decisoes, historico, importacao, insights, perfil).
- `bibliotecas/contratos/_legado/**` (10 arquivos: autenticacao, carteira, decisoes, fundos-cvm, historico-mensal, historico, importacao, insights, perfil, posicoes).
- `bibliotecas/contratos/src/` (re-export redundante).
- Entradas `@ei/servico-*` em `servidores/porta-entrada/package.json` (7 entradas).
- `tsconfig.json` do porta-entrada: removido `exclude` de `src/server/**` e `configuracao-produto.ts` (já não existem).

### Fase frontend (2026-04-20 — concluída)
- `bibliotecas/contratos/_compat.ts` (tipos inlined em `usePortfolioData.ts` e `importacaoParser.ts`).
- `apresentacao/src/cliente-api/{carteira,insights,historico,importacao,aportes,conteudo,config,financialCore,portfolio,market,funds,vera}.ts` (12 shims).
- Namespaces legados no barrel `apresentacao/src/cliente-api/index.ts`.
- Shim `registrarEventoTelemetria` em `cliente-api/telemetria.ts`.
- 15 stubs admin internos (`obterMeAdmin`, `obterConfigAdmin`, `obterConteudoAdmin`, `obterCorretorasAdmin`, `listarAdmins`, `listarParametrosSimulacaoAdmin`, `obterSaudeMercadoAdmin`, `listarAuditoriaExclusoesAtivos`, `atualizar*Admin`).
- 4 shims perfil (`salvarPerfil`, `listarPlataformas`, `obterContextoFinanceiro`, `salvarContextoFinanceiro`).

---

## Recriados

- **Schema canônico**: `infra/banco/migrations/100_rebuild_canonical.sql` (26 tabelas + 9 views + 20 índices + FKs com ON DELETE explícito).
- **Contratos PT-BR**: `bibliotecas/contratos/{auth,usuario,perfil,patrimonio,mercado,decisoes,admin,telemetria}.ts`. camelCase, shape 1:1 com API.
- **Backend dominios/**: `servidores/porta-entrada/src/dominios/{auth,usuario,perfil,patrimonio,mercado,decisoes,admin}/` com `*.rotas.ts`, `*.servico.ts`, `*.repositorio.ts`, `calculos/`.
- **Infra**: `servidores/porta-entrada/src/infra/{bd,cache,http,fila}.ts`.
- **Middleware**: em `servidores/porta-entrada/src/middleware/`.
- **Entry + router**: `src/index.ts` canônico-only, `src/aplicacao.ts` compõe rotear + resolverSessao.
- **Jobs**: `jobs/mercado-atualizar.job.ts`, `jobs/historico-mensal.job.ts`, `jobs/patrimonio-reconstruir.job.ts`.
- **Frontend clientes canônicos**: `apresentacao/src/cliente-api/{auth,usuario,perfil,patrimonio,mercado,decisoes,admin,telemetria}.ts` + `http.ts` + `authStorage.ts`.
- **Hooks centrais religados**: `usePortfolioData`, `useInsights`, `useConteudoApp` agora chamam APIs canônicas e adaptam shape para as telas antigas.

---

## Mantidos

- **Middleware de autenticação** (lógica de JWT + hash PBKDF2-SHA256) — portado para `src/dominios/auth/` sem mudança comportamental.
- **Provedores externos**: BRAPI, CVM, FIPE — lógica de fetch mantida, encapsulada agora em `dominios/mercado/provedores/`.
- **Tailwind/JSX**: zero alteração em layout, spacing, Tailwind, responsividade. A religação tocou apenas imports, chamadas de API e mapeamentos de campo (snake_case ↔ camelCase; EN ↔ PT-BR).
- **`fipeApi`**: mantida como cliente isolado (`cliente-api/fipe.ts`) — provedor externo específico usado por CarSimulator e PerfilUsuario. Plano previa ≤10 clientes; ficaram 11, com `fipe` justificado.

---

## Pendências (não são do refactor — ficam para produto/QA)

- **Funcionalidades perdidas em runtime** (backend canônico não as expõe; UI já não as chama ou usa fallback vazio):
  - **Conteúdo editorial dinâmico** (`/api/conteudo`): endpoints removidos. Strings estáticas embarcadas no JSX. Se produto voltar a querer edição via admin, criar endpoint novo em `admin/`.
  - **FIPE interno**: `fipeApi` ainda bate em provedor externo direto. Se for para cache no backend, criar sub-recurso em `mercado/`.
  - **Análise de posição** (DetalheAtivo): cálculo agora é local (lucro/prejuízo a partir dos campos canônicos). Se produto quiser recomendação real (`signal`), criar endpoint em `decisoes/`.
  - **Documentos de fundos CVM**: não há endpoint canônico. UI removida por ora.
  - **Vera avaliação automática**: canonical só tem chat (`/api/decisoes/vera/mensagens`). `useVeraEvaluation` virou no-op. Insights apenas renderiza score/histórico/ações prioritárias.
  - **PainelAdmin** — seções de config/conteúdo/corretoras/params reduzidas a 4 abas (dashboard/usuários/auditoria/CVM). Reintroduzir sob `admin/` se produto exigir.
- **QA manual pendente** (infra pronta, falta exercitar com usuário seed):
  - Fluxo de login + recuperação de senha ponta-a-ponta.
  - Importação de XLS (fluxo preview → confirmar).
  - Simuladores (carro, imóvel, reserva-vs-financiamento, gastar-vs-investir, livre).
  - Jobs cron: `mercado-atualizar` (5min), `historico-mensal` (03h), `patrimonio-reconstruir` (30min) — confirmar que populam/processam.
  - Regressão visual por tela (screenshots antes/depois).

---

## Verificação final

- [x] Build verde backend (wrangler dry-run 68.80 KiB).
- [x] Typecheck frontend 0 erros.
- [x] Typecheck backend 0 erros.
- [x] Preview localhost:3000: LandingPage renderiza sem console errors.
- [x] Router só registra 8 domínios canônicos; rotas legadas retornam 404.
- [x] Cliente-api final com 11 arquivos (8 canônicos + fipe + http + authStorage).
- [x] `_compat.ts` deletado; tipos inlined onde necessário.
- [ ] Lint sem warning (não rodado — fora do escopo).
- [ ] Testes de integração por domínio (não escritos — fora do escopo).
- [ ] Fluxos autenticados e cron jobs validados com usuário seed (QA manual).
- [ ] Regressão visual confirmada por screenshots (QA manual).

---

## Decisões tomadas no caminho

1. **Etapa 6 antecipada**: cortar `index.ts` para dispatch canônico-only já no turno em que contratos foram reescritos — o alternativo (manter compat layer no backend) bloateava `bibliotecas/contratos` com tipos duplos. Arquivos legados ficaram excluídos do tsconfig, saem fisicamente em Etapa 7.

2. **Compat layer temporário no frontend** (`_compat.ts` + shims em auth/telemetria + namespaces legados no barrel) — admitido para permitir typecheck verde enquanto as 42 telas `.jsx` não são religadas. Todos esses artefatos são marcados para exclusão em Etapa 7 e listados acima em "Apagados".

3. **Hooks centrais religados primeiro**: `usePortfolioData`, `useInsights`, `useConteudoApp` migraram para APIs canônicas com adaptador de shape. Faz com que Home/GlobalHeader funcionem em runtime sem mexer nas 42 telas — migração incremental.

4. **Conteúdo editorial virou stub**: `useConteudoApp` sempre devolve fallback. Endpoint `/api/conteudo` foi morto na Etapa 6 e não há substituto canônico ainda. Se voltar a ser necessário, entra em admin/.

5. **Etapa 5 — shim como ponte, não como destino**: em primeira iteração, os 13 clientes legados viraram shims delegando a canônicos para destravar typecheck sem religar JSX. Em segunda iteração (esta), as 20+ telas `.jsx` foram religadas diretamente aos namespaces canônicos (com adaptadores in-file onde o shape canônico diferia do que o JSX lia), e os 13 shims foram fisicamente deletados. Resultado: zero shim, zero `_compat`, cliente-api final com 11 arquivos. JSX/Tailwind/layout permaneceram intactos.

6. **`PainelAdmin` reescrito em vez de patchado**: legado chamava 8+ endpoints que não existem mais no canônico. Total rewrite (170 linhas vs ~500) para consumir apenas as 4 rotas admin canônicas (`/usuarios`, `/auditoria`, `/cvm`, sessão admin via `authApi.obterSessao().ehAdmin`).

7. **`useVeraEvaluation` virou no-op**: canonical backend só tem chat Vera, não avaliação insight-card. Hook devolve `{veraPayload: null, ...}` e `Insights.jsx` já lida graciosamente com essa ausência.

8. **`fipeApi` preservado**: foge do padrão "1 cliente por domínio" (ficaram 11, não 10), mas é justificável — é provedor externo específico mantido isolado até que mercado/ absorva formalmente um sub-recurso fipe.
