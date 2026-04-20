# Backend Rebuild Canônico — Plano Oficial

Branch: `refactor/backend-rebuild-canonical`
Tipo: greenfield (banco atual descartável, sem migração de dados).
Escopo: backend + banco + contratos + cliente-api do frontend. **Zero mudança visual** na UI.

---

## Contexto

O backend do Esquilo Invest chegou em estado de transição caótica após iterações sucessivas mal-acabadas. Auditoria dos três eixos confirmou:

- **126 rotas públicas** em 16 arquivos, com stacks concorrentes coexistindo sem deprecation: `/api/carteira/*` + `/api/financial-core/*` + `/api/financial/*`; `/api/insights/score` + `/api/score/*`; `/api/admin/fundos/cvm/*` + `/api/admin/cvm/*`.
- **33 tabelas, 0 views**, com 4 grupos claros de duplicação conceitual (posições, snapshots de patrimônio, scores, perfil).
- **11+ colunas JSON** guardando estrutura normalizável.
- **FKs ausentes** em 10+ tabelas.
- **Serviços duplicados**: `PortfolioViewService` + `FinancialCoreService`; `UnifiedScoreService` + `PortfolioAnalysisService`.
- **SQL cru em rotas** (`admin.routes.ts` 1167 linhas, `posicoes.routes.ts`, `telemetria.routes.ts`, `app.routes.ts`).
- **Nomenclatura mista EN/PT**: `portfolio`/`carteira`/`patrimonio` para o mesmo conceito.
- **Fragmentação de API**: Home dispara 7 chamadas paralelas, Carteira 6, Admin 16.
- **Compat cascata no frontend**: `obterResumoCarteiraComFallback` tenta financial-core → cai pra carteira legado.

Detalhe completo em `backend-inventory.md`.

---

## Decisões-chave

1. **Greenfield**: banco atual é descartável. Sem script de migração de dados. Schema novo do zero.
2. **6 domínios públicos finais**: `auth`, `usuario`, `perfil`, `patrimonio`, `mercado`, `decisoes`. Admin em escopo separado.
3. **Entrega em etapas incrementais** dentro da branch. Cada commit verde/reversível.
4. **Zero alteração visual** no frontend. Apenas clientes de API e imports são tocados.

---

## Metas numéricas

| Métrica | Atual | Alvo |
|---------|-------|------|
| Tabelas | 33 | ≤ 26 |
| Views | 0 | ≥ 9 |
| Rotas públicas | 126 | ≤ 40 (meta: 36) |
| Endpoints/tela | 6-16 | 1-3 |
| Clientes API frontend | 21 | ≤ 10 |
| Colunas JSON | 11+ | ≤ 9 |
| Services duplicados (score/patrimônio) | 4 | 1 por conceito |
| SQL cru em rotas | ~30 queries | 0 |
| Pasta `modulos-backend/` | existe | removida |

---

## Domínios finais

| # | Domínio | Responsabilidade | NÃO é |
|---|---------|-----------------|-------|
| 1 | `auth` | login, cadastro, sessão, recuperação | dados de conta |
| 2 | `usuario` | conta, preferências UI, plataformas | perfil financeiro |
| 3 | `perfil` | renda, aporte, horizonte, risco, objetivos | patrimônio |
| 4 | `patrimonio` | ações, FIIs, fundos, RF, caixa, imóveis, veículos, dívidas + aportes + histórico + score | catálogo de mercado |
| 5 | `mercado` | catálogo de ativos, cotações BRAPI, fundos CVM, FIPE | posição do usuário |
| 6 | `decisoes` | simulações + Vera (IA) | recomendação automática |
| * | `admin` | operação interna (não público) | — |

Domínios que **morrem**: `portfolio`, `financial`, `financial-core`, `insights`, `carteira` (como domínio), `score`, `posicoes`, `importacao` (vira sub-recurso), `app`.

---

## Modelo canônico de banco

### Tabelas finais (26)

| # | Tabela | Propósito |
|---|--------|-----------|
| 1 | `usuarios` | conta do usuário |
| 2 | `usuario_preferencias` | flags/tema/onboarding |
| 3 | `usuario_plataformas` | corretoras vinculadas |
| 4 | `recuperacoes_acesso` | PINs reset senha |
| 5 | `perfis_financeiros` | 1:1 com usuário |
| 6 | `patrimonio_itens` | colapsa `ativos`+`posicoes_financeiras`+contexto |
| 7 | `patrimonio_aportes` | colapsa `aportes`+`ativos_movimentacoes` |
| 8 | `patrimonio_historico_mensal` | série mensal consolidada |
| 9 | `patrimonio_scores` | série de scores |
| 10 | `patrimonio_fila_reconstrucao` | fila de reprocessamento |
| 11 | `importacoes` | lotes CSV |
| 12 | `importacao_itens` | linhas do lote |
| 13 | `ativos` | catálogo puro (sem `usuario_id`) |
| 14 | `ativos_cotacoes_cache` | cache cotações |
| 15 | `fundos_cvm` | cadastro CNPJ |
| 16 | `fundos_cvm_cotas` | série de cotas |
| 17 | `decisoes_simulacoes` | simulações salvas |
| 18 | `telemetria_eventos` | eventos produto |
| 19 | `corretoras` | catálogo |
| 20 | `admin_usuarios` | permissões admin |
| 21 | `admin_auditoria` | log admin |
| 22 | `configuracoes_produto` | config global |
| 23 | `feature_flags` | flags rollout |
| 24 | `configuracoes_menu` | menu UI |
| 25 | `conteudo_blocos` | strings editoriais |
| 26 | `cvm_execucoes` | funde ingestion+backfill runs |

### Views (9)

| View | Consumida por |
|------|---------------|
| `vw_patrimonio_resumo` | Home, Carteira topo |
| `vw_patrimonio_posicoes` | Carteira lista, DetalheAtivo |
| `vw_patrimonio_alocacao` | Carteira donut |
| `vw_patrimonio_evolucao_mensal` | Home gráfico, Historico |
| `vw_patrimonio_aportes_mes` | Aportes |
| `vw_patrimonio_score_atual` | Home, Insights |
| `vw_patrimonio_score_historico` | Insights |
| `vw_mercado_ativo_detalhe` | DetalheAtivo |
| `vw_admin_ingestao_cvm` | Admin CVM |

### Regras obrigatórias

- Toda coluna `usuario_id` tem FK → `usuarios` ON DELETE CASCADE.
- Toda FK tem ON DELETE explícito.
- Índices em todo `usuario_id` e pares `(usuario_id, data|ano_mes|criado_em)`.
- Colunas JSON permitidas apenas para payload opaco externo, cardinalidade alta sem leitura, ou log bruto.

---

## API pública consolidada — 36 endpoints

### Por domínio
- **auth** (7): registrar, entrar, sair, sessao, recuperar/iniciar, recuperar/confirmar, recuperar/redefinir.
- **usuario** (4): GET/PATCH `/usuario`, GET/PATCH `/usuario/preferencias`.
- **perfil** (2): GET/PUT `/perfil`.
- **patrimonio** (13): resumo, itens CRUD, aportes CRUD, historico, score, importacoes.
- **mercado** (4): ativos busca, ativo detalhe, histórico cotações, fundo CVM.
- **decisoes** (4): simulações CRUD + vera mensagens.
- **telemetria** (1): eventos.
- **admin** (1 público + 6 sub-recursos internos).

### Mapa tela → endpoints
| Tela | # endpoints |
|------|-------------|
| Home | 1 |
| Carteira | 2 |
| DetalheAtivo | 2 |
| Insights | 2 |
| Aportes | 2 |
| Perfil | 2 |
| Decisoes | 2 |
| Importar | 2 |
| Historico | 1 |
| Admin | 3 |

---

## Nomenclatura oficial

### Banco
- Tabelas: snake_case, plural.
- Colunas: snake_case com sufixos `_id`, `_em`, `_pct`, `_brl`, `_json`, `_hash`.
- Booleans: `eh_`/`esta_` ou `_ativo`.

### TypeScript
- DTOs: camelCase. Tipos: PascalCase. Sufixos `Dto`, `Entrada`, `Saida`, `Filtro`, `Resumo`.
- Contratos em `bibliotecas/contratos/`: 1 arquivo por domínio, shape 1:1 com API.
- Mapeamento snake↔camel apenas em repositórios.

### Rotas HTTP
- kebab-case, prefixo `/api/<dominio>/...`, verbos HTTP puros.

### Telemetria
- `dominio.recurso.acao` (`patrimonio.item.criado`).

### Jobs
- `<dominio>-<acao>.job.ts`.

### Palavras banidas → substitutas
| Banido | Substituto |
|--------|-----------|
| portfolio | patrimonio |
| financial, financial-core, core | patrimonio ou perfil |
| insights, analytics | patrimonio/score ou patrimonio/resumo |
| carteira (domínio) | patrimonio |
| assets | ativos |
| posicoes | patrimonio/itens |
| snapshot (tabela operacional) | view ou historico_mensal |
| unified, _v2 | removido |

---

## Organização do backend

```
servidores/porta-entrada/src/
  index.ts
  aplicacao.ts
  middleware/ { autenticacao, erro, telemetria }
  dominios/
    auth/      { auth.rotas.ts, auth.servico.ts, auth.repositorio.ts }
    usuario/
    perfil/
    patrimonio/ {...calculos/score.ts, rentabilidade.ts, alocacao.ts}
    mercado/    {...provedores/brapi, cvm, fipe}
    decisoes/   {...vera/}
    admin/
  infra/        { bd, cache, http, fila }
  jobs/         { mercado-atualizar, historico-mensal, patrimonio-reconstruir }
  views/        # SQL espelhando migrations de views
```

### Regras de camada (invioláveis)
- **rotas**: validam input, chamam serviço, formatam resposta. Sem SQL, sem regra, sem HTTP externo.
- **serviços**: orquestram regra. Sem SQL direto.
- **repositórios**: SQL cru + mapeamento linha→DTO. Sem regra, sem HTTP externo.
- **calculos**: funções puras. Sem I/O.
- **provedores**: HTTP externo. Sem banco.
- **jobs**: orquestram serviços em cron. Sem regra própria.

Pasta `servidores/modulos-backend/` **morre inteira** na Etapa 7.

---

## Sequência de etapas

| # | Etapa | Entregável |
|---|-------|-----------|
| 0 | Preparação | branch + 4 docs criados |
| 1 | Schema greenfield | migration `100_rebuild_canonical.sql` + banco dev recriado |
| 2 | Contratos PT-BR | `bibliotecas/contratos/` recriada |
| 3 | Backend `dominios/` | 7 domínios implementados (auth→admin) |
| 4 | Jobs canônicos | 3 jobs + wrangler.toml |
| 5 | Frontend cliente-api | 10 clientes + telas religadas |
| 6 | Corte rotas antigas | router limpo |
| 7 | Limpeza física | arquivos antigos deletados, `modulos-backend/` removida |
| 8 | Relatório final | `backend-rebuild-report.md` preenchido |

---

## Critérios de aceite

1. Tabelas ≤ 26.
2. Views ≥ 9.
3. Rotas públicas ≤ 40.
4. Endpoints por tela 1-3.
5. Zero SQL em `**/*.rotas.ts`.
6. Zero palavra banida em `src/**/*.ts`.
7. Clientes API ≤ 10.
8. `modulos-backend/` removida.
9. Zero fallback cascata (`*ComFallback`).
10. Contratos: 1 arquivo/domínio, camelCase, zero duplicação.
11. FKs: toda `usuario_id` com CASCADE; toda FK com ON DELETE explícito.
12. Colunas JSON ≤ 9, todas justificadas.
13. Jobs com nomes canônicos.
14. Build verde, testes verdes, lint sem warning.

---

## Verificação end-to-end

### Automatizada
- `npm test`, `npm run lint`, `npm run typecheck` verdes em todos os workspaces.
- Suítes por domínio cobrindo cada endpoint consolidado.
- Grep: `SELECT|INSERT|UPDATE|DELETE` em `**/*.rotas.ts` → 0.

### Visual (sem alterar UI)
- `preview_start` + navegar cada tela principal (desktop+mobile) → confirmar via `preview_snapshot` + `preview_network` que conteúdo renderizado continua igual e quantidade de requests caiu para 1-3 por tela.
- Fluxos: login → home → adicionar item → aporte → histórico → simulação.
- `preview_console_logs` sem erros.

### Manual
- Banco local recriado e operacional.
- Jobs disparam e produzem efeito esperado.
