# Esquilo Invest — Guia do Ambiente

Plataforma de consolidação e diagnóstico financeiro para investidores brasileiros.
Monorepo TypeScript rodando em **Cloudflare Workers + D1 (SQLite) + Pages**.

---

## Estrutura do Monorepo

```
ei-raiz/
├── apresentacao/          # Frontend React + Vite → Cloudflare Pages
├── servidores/
│   └── porta-entrada/     # Backend Cloudflare Worker (API Gateway)
├── bibliotecas/
│   ├── contratos/         # Tipos TypeScript compartilhados (DTOs)
│   ├── utilitarios/       # Funções utilitárias internas
│   └── validacao/         # Schemas de validação
├── infra/
│   └── banco/
│       ├── migrations/    # SQL migrations (canônicas a partir de 100_rebuild_canonical.sql)
│       └── seed.sql       # Seed de desenvolvimento
├── utilitarios/
│   └── scripts/           # Scripts Node.js de operação (CVM, backfill, reset)
├── testes/                # Testes e2e + massa de importação
├── documentacao/          # Arquitetura, produto, marca
└── midia/                 # Assets visuais (logos, ícones, fontes)
```

---

## Regras de Nomenclatura (invioláveis)

### Banco de Dados
- Tabelas: `snake_case` **plural** (`patrimonio_itens`, `usuarios`)
- Colunas: `snake_case` com sufixos obrigatórios:
  - `_id` → chave estrangeira
  - `_em` → timestamp (`criado_em`, `atualizado_em`)
  - `_pct` → percentual
  - `_brl` → valor monetário em reais
  - `_json` → coluna JSON (uso restrito e justificado)
  - `_hash` → hash
- Booleans: prefixo `eh_` / `esta_` ou sufixo `_ativo`
- FK obrigatória em toda coluna `usuario_id` com `ON DELETE CASCADE`
- ON DELETE explícito em todas as FKs

### TypeScript
- DTOs em `camelCase`; tipos em `PascalCase`
- Sufixos: `Entrada`, `Saida`, `Filtro`, `Resumo`, `Dto`
- Mapeamento `snake_case ↔ camelCase` **somente no repositório**
- 1 arquivo por domínio em `bibliotecas/contratos/`

### Rotas HTTP
- `kebab-case` em URLs
- Prefixo `/api/<dominio>/…`
- Verbos HTTP puros — **sem** `/criar`, `/atualizar` no path
- PT-BR sempre

### Palavras banidas no código
| Banido | Substituto |
|--------|-----------|
| `portfolio` | `patrimonio` |
| `financial`, `financial-core`, `core` | `patrimonio` ou `perfil` |
| `insights`, `analytics` | `patrimonio/score` ou `patrimonio/resumo` |
| `carteira` (domínio) | `patrimonio` |
| `assets` | `ativos` |
| `posicoes` | `patrimonio/itens` |
| `snapshot` (tabela operacional) | view ou `historico_mensal` |
| `unified`, `_v2` | removido |

### Eventos de Telemetria
- Formato: `dominio.recurso.acao` (`patrimonio.item.criado`, `auth.sessao.iniciada`)

---

## Camadas do Backend (regras invioláveis)

| Camada | Pode fazer | Não pode |
|--------|-----------|---------|
| `*.rotas.ts` | Validar input (Zod), chamar serviço, formatar resposta | SQL, regra de negócio, HTTP externo |
| `*.servico.ts` | Orquestrar regras, chamar repos/provedores/cálculos | SQL direto |
| `*.repositorio.ts` | SQL cru, mapear linha → DTO | Regra, HTTP externo |
| `calculos/*.ts` | Funções puras de domínio | I/O de qualquer tipo |
| `provedores/*.ts` | HTTP externo (BRAPI, CVM, FIPE) | Banco de dados |
| `jobs/*.ts` | Orquestrar serviços em cron | Regra própria |

---

## Arquitetura do Backend

**Worker:** `ei-api-gateway` → `servidores/porta-entrada/src/`

```
src/
├── index.ts                  # Entry point do Worker
├── aplicacao.ts              # Router principal + auth middleware
├── infra/
│   ├── bd.ts                 # Binding D1
│   ├── cache.ts              # KV cache
│   ├── http.ts               # Helpers de resposta
│   ├── cripto.ts             # JWT
│   └── sessao.ts             # Tipo ContextoSessao
├── dominios/
│   ├── auth/                 # Autenticação e sessão
│   ├── usuario/              # Conta e preferências
│   ├── perfil/               # Perfil financeiro
│   ├── patrimonio/           # Itens, aportes, histórico, score, importação
│   │   └── calculos/         # score.ts, rentabilidade.ts, alocacao.ts
│   ├── mercado/              # Catálogo de ativos, cotações, CVM, FIPE
│   │   └── provedores/       # brapi.ts, cvm.ts, fipe.ts
│   ├── decisoes/             # Simulações e Vera (IA)
│   │   └── vera/
│   ├── admin/                # Painel operacional interno
│   └── telemetria/           # Eventos de produto
└── jobs/
    ├── mercado-atualizar.job.ts       # Atualiza cotações (cron */5 min)
    ├── historico-mensal.job.ts        # Consolida histórico mensal (cron 3h diária)
    └── patrimonio-reconstruir.job.ts  # Processa fila de reconstrução (cron */30 min)
```

---

## API Pública — 36 Endpoints

### auth (7)
```
POST   /api/auth/registrar
POST   /api/auth/entrar
POST   /api/auth/sair
GET    /api/auth/sessao
POST   /api/auth/recuperar/iniciar
POST   /api/auth/recuperar/confirmar
POST   /api/auth/recuperar/redefinir
```

### usuario (4)
```
GET    /api/usuario
PATCH  /api/usuario
GET    /api/usuario/preferencias
PATCH  /api/usuario/preferencias
```

### perfil (2)
```
GET    /api/perfil
PUT    /api/perfil
```

### patrimonio (13)
```
GET    /api/patrimonio/resumo          ← Home consolidado (1 chamada)
GET    /api/patrimonio/itens
POST   /api/patrimonio/itens
GET    /api/patrimonio/itens/:id
PATCH  /api/patrimonio/itens/:id
DELETE /api/patrimonio/itens/:id
GET    /api/patrimonio/aportes
POST   /api/patrimonio/aportes
DELETE /api/patrimonio/aportes/:id
GET    /api/patrimonio/historico
GET    /api/patrimonio/score
POST   /api/patrimonio/importacoes
GET    /api/patrimonio/importacoes/:id
```

### mercado (4) — parcialmente público (sem auth)
```
GET    /api/mercado/ativos             ← busca por ?q=
GET    /api/mercado/ativos/:ticker
GET    /api/mercado/ativos/:ticker/historico
GET    /api/mercado/fundos-cvm/:cnpj
```

### decisoes (4)
```
GET    /api/decisoes/simulacoes
POST   /api/decisoes/simulacoes
GET    /api/decisoes/simulacoes/:id
POST   /api/decisoes/vera/mensagens
```

### telemetria (1) — público
```
POST   /api/telemetria/eventos
```

### admin (1 público + sub-recursos internos)
```
POST   /api/admin/entrar
GET    /api/admin/usuarios
GET    /api/admin/auditoria
GET    /api/admin/cvm
```

---

## Banco de Dados — 26 Tabelas + 9 Views

**D1 prod:** `esquilo-invest` (ID `2a4849fa-e980-4540-bd60-514b740287d3`)
**D1 dev:** `esquilo-invest-dev` (ID `e2a0b0a8-484d-4507-b21c-facf090481dd`)
**Migration canônica:** `infra/banco/migrations/100_rebuild_canonical.sql`

### Tabelas
| Domínio | Tabelas |
|---------|---------|
| Usuário | `usuarios`, `usuario_preferencias`, `usuario_plataformas`, `recuperacoes_acesso` |
| Perfil | `perfis_financeiros` |
| Patrimônio | `patrimonio_itens`, `patrimonio_aportes`, `patrimonio_historico_mensal`, `patrimonio_scores`, `patrimonio_fila_reconstrucao` |
| Importação | `importacoes`, `importacao_itens` |
| Mercado | `ativos`, `ativos_cotacoes_cache`, `fundos_cvm`, `fundos_cvm_cotas`, `corretoras` |
| Decisões | `decisoes_simulacoes` |
| Telemetria | `telemetria_eventos` |
| Admin | `admin_usuarios`, `admin_auditoria` |
| Config | `configuracoes_produto`, `feature_flags`, `configuracoes_menu`, `conteudo_blocos`, `cvm_execucoes` |

### Views (leitura — zero SQL de agregação em serviços)
| View | Consumida por |
|------|--------------|
| `vw_patrimonio_resumo` | Home, topo da Carteira |
| `vw_patrimonio_posicoes` | Carteira lista, Detalhe Ativo |
| `vw_patrimonio_alocacao` | Carteira donut |
| `vw_patrimonio_evolucao_mensal` | Home gráfico, Histórico |
| `vw_patrimonio_aportes_mes` | Aportes |
| `vw_patrimonio_score_atual` | Home, Insights |
| `vw_patrimonio_score_historico` | Insights |
| `vw_mercado_ativo_detalhe` | Detalhe Ativo |
| `vw_admin_ingestao_cvm` | Admin CVM |

---

## Frontend

**Pages:** `ei-raiz-web` → `apresentacao/`

```
src/
├── cliente-api/          # 11 clientes HTTP (1 por domínio)
│   ├── auth.ts           authApi
│   ├── usuario.ts        usuarioApi
│   ├── perfil.ts         perfilApi
│   ├── patrimonio.ts     patrimonioApi
│   ├── mercado.ts        mercadoApi
│   ├── decisoes.ts       decisoesApi
│   ├── admin.ts          adminApi
│   ├── telemetria.ts     telemetriaApi
│   ├── fipe.ts           fipeApi
│   ├── http.ts           base fetch + ApiError
│   └── authStorage.ts    token localStorage
├── features/             # Telas por domínio
├── components/           # Componentes reutilizáveis
├── hooks/                # Hooks de dados
└── utils/                # Helpers + cache
```

### Mapa Tela → Endpoints
| Tela | Endpoints | # |
|------|-----------|---|
| Home | `GET /patrimonio/resumo` | 1 |
| Carteira | `GET /patrimonio/resumo`, `GET /patrimonio/itens` | 2 |
| Detalhe Ativo | `GET /patrimonio/itens/:id`, `GET /mercado/ativos/:ticker/historico` | 2 |
| Insights | `GET /patrimonio/score`, `GET /patrimonio/historico` | 2 |
| Aportes | `GET /patrimonio/aportes`, `POST /patrimonio/aportes` | 2 |
| Perfil | `GET /perfil`, `PUT /perfil` | 2 |
| Decisões | `GET /decisoes/simulacoes`, `POST /decisoes/simulacoes` | 2 |
| Importar | `POST /patrimonio/importacoes`, `GET /patrimonio/importacoes/:id` | 2 |
| Histórico | `GET /patrimonio/historico` | 1 |
| Admin | `GET /admin/usuarios`, `GET /admin/cvm`, `GET /admin/auditoria` | 3 |

---

## Serviços Externos

| Serviço | Uso | Configuração |
|---------|-----|-------------|
| **Cloudflare D1** | Banco de dados SQLite gerenciado | Binding `DB` no Worker |
| **BRAPI** (`brapi.dev`) | Cotações de ações e FIIs em tempo real | Variável `BRAPI_TOKEN` |
| **CVM / dados.cvm.gov.br** | Cadastro e cotas de fundos de investimento | Público, sem auth |
| **FIPE** (`parallelum.com.br`) | Tabela FIPE para veículos | Público, sem auth |
| **Google Apps Script** | Webhook de e-mail para recuperação de senha | `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` em `wrangler.toml` |
| **Cloudflare AI** | Vera (assistente IA financeiro) | Binding `AI` no Worker |

---

## Deploy

### Produção (automático via GitHub Actions)
Push para `master` dispara `.github/workflows/deploy.yml`:
1. `npm run typecheck` — zero erros obrigatório
2. `npm run build -w @ei/web` + deploy para **Cloudflare Pages**
3. `wrangler deploy --env production` → **Cloudflare Workers**

URLs de produção:
- **Frontend:** https://ei-raiz-web.pages.dev (ou domínio customizado)
- **API:** https://ei-api-gateway.giammattey-luiz.workers.dev

### D1 — Aplicar migration manualmente
```bash
npx wrangler d1 execute esquilo-invest --remote \
  --file=infra/banco/migrations/100_rebuild_canonical.sql
```

---

## Scripts Disponíveis (raiz do monorepo)

```bash
npm run dev          # Frontend em http://localhost:3000
npm run dev:api      # Backend Worker em http://localhost:8787
npm run dev:all      # Frontend + Backend simultâneos
npm run build        # Build de todos os workspaces
npm run typecheck    # Typecheck de todos os workspaces
npm run deploy:api   # Deploy somente do Worker
npm run deploy:web   # Build + deploy somente do Frontend
npm run test:api     # Testes do backend
npm run ingest:cvm   # Ingestão de fundos CVM
npm run backfill:cvm-monthly  # Backfill histórico mensal CVM
```

**Scripts de ambiente local:**
```bash
./dev-iniciar.sh     # Inicia frontend + backend localmente
./dev-parar.sh       # Para todos os processos de desenvolvimento
```

---

## Variáveis de Ambiente

### Worker (`servidores/porta-entrada/`)
| Variável | Dev | Prod |
|----------|-----|------|
| `JWT_SECRET` | `.dev.vars` | Cloudflare secret |
| `BRAPI_TOKEN` | `.dev.vars` | Cloudflare secret |
| `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` | `wrangler.toml [vars]` | `wrangler.toml [env.production.vars]` |
| `WEB_BASE_URL` | `http://localhost:3000` | `https://esquilo.wallet` |

### Frontend (`apresentacao/`)
| Variável | Valor |
|----------|-------|
| `VITE_API_BASE_URL` | URL do Worker (em `apresentacao/wrangler.toml`) |

---

## Contratos Compartilhados

`bibliotecas/contratos/` — importados como `@ei/contratos`:
```
auth.ts        AuthEntradaDto, AuthSaidaDto, SessaoSaida
usuario.ts     UsuarioSaida, PreferenciasSaida
perfil.ts      PerfilFinanceiroEntrada, PerfilFinanceiroSaida
patrimonio.ts  PatrimonioResumoSaida, PatrimonioItemSaida, PatrimonioScoreSaida, ...
mercado.ts     AtivoSaida, CotacaoSaida, FundoCvmSaida
decisoes.ts    SimulacaoEntrada, SimulacaoSaida, VeraMensagemEntrada
admin.ts       AdminUsuarioSaida, AdminAuditoriaSaida
telemetria.ts  TelemetriaEventoEntrada
```

---

## Jobs (Cron)

| Job | Arquivo | Gatilho |
|-----|---------|---------|
| Atualizar cotações de mercado | `jobs/mercado-atualizar.job.ts` | `*/5 * * * *` |
| Ingestão CVM diária | `jobs/mercado-atualizar.job.ts` | `0 3 * * *` |
| Reconstruir patrimônio (fila) | `jobs/patrimonio-reconstruir.job.ts` | `*/30 * * * *` |
| Consolidar histórico mensal | `jobs/historico-mensal.job.ts` | `0 3 * * *` |
