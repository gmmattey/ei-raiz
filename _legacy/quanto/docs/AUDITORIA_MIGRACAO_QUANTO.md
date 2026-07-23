# Quanto. — Auditoria de Migração

> **De:** Equipe de Consultoria Técnica
> **Para:** Luiz Giammattey — Fundador
> **Data:** 13 de junho de 2026
> **Classificação:** Confidencial — Uso Interno
> **Escopo:** Análise completa do Esquilo Invest (ei-raiz) para migração ao Quanto

---

## Sumário Executivo

O Esquilo Invest cresceu de forma desordenada em 24 dias de desenvolvimento intensivo (abr–mai 2026), acumulando 948 arquivos, 22 telas, 36 endpoints, 26 tabelas e 82 commits. O resultado é um produto com funcionalidades parcialmente implementadas, código morto significativo, e falhas críticas em auth, CI/CD e separação de ambientes.

O Quanto propõe uma redução radical: **3 telas, 6 endpoints, 3 tabelas, custo zero**. Esta auditoria conclui que **~800 linhas de lógica** são reaproveitáveis do total de ~52.000 — um reuso de ~1,5%. A recomendação é **criar um repositório novo** e copiar seletivamente.

---

## 1. Diagnóstico do Esquilo Invest

### 1.1 Números do Projeto

| Métrica | Valor |
|---------|-------|
| Arquivos rastreados pelo git | 948 |
| Linhas de TypeScript (fonte) | ~7.000 (backend) + ~9.000 (frontend) |
| Tamanho do .git | 36 MB (inflado por PNGs, PDFs, SQLite) |
| Commits | 82 (1 contribuidor principal) |
| Período de desenvolvimento | 10/abr a 04/mai 2026 (24 dias) |
| Último commit | 04/mai/2026 — há 40 dias sem atividade |

### 1.2 Arquitetura Atual

```
ei-raiz/ (monorepo npm workspaces)
├── apresentacao/         @ei/web — React 18 + Vite + Tailwind + Capacitor
│   └── src/
│       ├── features/     22 telas (cada uma duplicada: Desktop + Mobile)
│       ├── cliente-api/  12 módulos de API client
│       ├── hooks/        4 hooks customizados
│       └── utils/        8 utilitários
├── servidores/porta-entrada/   @ei/api — Cloudflare Worker + Hono
│   └── src/
│       ├── dominios/     7 domínios (auth, usuario, perfil, patrimonio, mercado, decisoes, admin, telemetria)
│       ├── infra/        4 módulos (bd, cripto, http, sessao)
│       └── jobs/         3 cron jobs
├── bibliotecas/          contratos + utilitarios + validacao
├── infra/banco/          migrations (35 legadas + 1 canônica)
├── documentacao/         specs, marca, PDFs
└── midia/brand/          518 SVGs de ícones (duplicados 3x: branco/laranja/preto)
```

### 1.3 Problemas Críticos Encontrados

#### Severidade CRÍTICA

| # | Problema | Impacto |
|---|----------|---------|
| C1 | **Recuperação de senha quebrada** — PIN é gerado e hasheado, mas nunca enviado ao usuário. Feature completamente não-funcional. | Usuário que esquece a senha não consegue recuperar acesso |
| C2 | **Dev e prod compartilham o mesmo database_id** no wrangler.toml. Desenvolvimento local com `--remote` altera o banco de produção. | Risco de corrupção de dados reais |
| C3 | **CI deploya com erros de typecheck** — `continue-on-error: true` no workflow. O gate de qualidade está desligado. | Código com erros de tipo vai para produção |

#### Severidade ALTA

| # | Problema | Impacto |
|---|----------|---------|
| A1 | **Auth do frontend baseada em localStorage** — `ProtectedRoute` verifica apenas `localStorage.isAuthenticated` sem validar o JWT. Qualquer pessoa pode forjar acesso. | Segurança nula no frontend |
| A2 | **Duplicação sistêmica Desktop/Mobile** — Cada tela existe 2x com 60-80% de lógica copiada. Funções como `fmt`, `fmtPct`, `TIPO_LABELS` aparecem em 4-6 arquivos. | Manutenção 2x, bugs duplicados |
| A3 | **Estado local commitado no git** — `.wrangler/` (cache, bundles, banco SQLite local), `infra/banco/banco.db`, `.claude/`, screenshots E2E (14 PNGs), PDFs de marca (~4MB) | Repo inflado, dados locais expostos |
| A4 | **tsconfig.json raiz quebrado** — Referencia 9 paths inexistentes (`apps/api`, `servicos/autenticacao`, etc.). Projeto foi reestruturado mas config não acompanhou. | `npm run typecheck` falha na raiz |

#### Severidade MÉDIA

| # | Problema | Impacto |
|---|----------|---------|
| M1 | Endpoint `GET /mercado/historico` retorna array vazio — nunca implementado | Feature fantasma |
| M2 | Home faz 5 chamadas API quando `GET /patrimonio/resumo` já consolida tudo | Performance desnecessariamente ruim |
| M3 | `fipe.ts` inteiro é código morto — 4 funções que retornam objetos vazios | Peso morto no bundle |
| M4 | `useConteudoApp.ts` é stub que sempre retorna fallback | Código morto |
| M5 | Dark mode hackeado com 50 linhas de `!important` targetando classes Tailwind hardcoded | Fragilidade visual |
| M6 | `registrarAuditoria()` definida no repositório admin mas nunca chamada | Dead code |
| M7 | Migrations legadas com numeração inconsistente (duplicatas: 0021, 028; lacuna: 031) | Confusão operacional |

---

## 2. O Que o Quanto Precisa

### 2.1 Escopo Definido

| Dimensão | Esquilo Invest | Quanto |
|----------|---------------|--------|
| Usuários | Multi-user com auth JWT | Single-user com Cloudflare Access |
| Telas | 22 (cada uma duplicada Desktop/Mobile) | 3 + 3 bottom sheets |
| Endpoints | 36 em 7 domínios | 6 em 1 arquivo |
| Tabelas | 26 + 9 views | 3 (sem views) |
| Frontend | React 18 + Vite + Tailwind + Capacitor | Vanilla JS + CSS (sem framework, sem build) |
| Auth | JWT custom + PBKDF2 + PIN recovery | Cloudflare Access (zero código) |
| Cotações | BRAPI + CVM + FIPE | BRAPI apenas |
| IA | Vera (Cloudflare AI / Llama 3.1 8B) | Nenhuma |
| Custo | Workers + Pages (paid) | Free tier Cloudflare |
| Deploy | CI/CD GitHub Actions | `wrangler deploy` manual |

### 2.2 Anti-Escopo (o que o Quanto NÃO faz)

- Multi-usuário, login social, compartilhamento
- Proventos, dividendos, IR, come-cotas, preço médio por trade
- Metas, rebalanceamento, recomendações
- Importação Open Finance / B3 / CEI
- Score financeiro, pilares, diagnóstico
- Simuladores de decisão
- Painel administrativo
- Telemetria / analytics
- Notificações push

---

## 3. Análise de Reuso por Camada

### 3.1 Backend (30 arquivos TypeScript)

#### COPIAR DIRETO (5 arquivos)

| Arquivo | O que faz | Ação |
|---------|-----------|------|
| `infra/bd.ts` | Wrapper D1 com `consultar`, `primeiro`, `executar`, `emLote` + helpers | Copiar. Reduzir tipo `Env`. |
| `infra/http.ts` | Pattern `ServiceResponse<T>` com `sucesso()`/`erro()` | Copiar intacto. |
| `mercado-atualizar.job.ts` | Job de cotações BRAPI → UPSERT em cache | Copiar. Simplificar para single-user. |
| `calculos/alocacao.ts` | Cálculo de peso % por classe (25 linhas, função pura) | Copiar intacto. |
| `calculos/rentabilidade.ts` | Rentabilidade % e variação mensal (19 linhas, função pura) | Copiar intacto. |

#### ADAPTAR (5 arquivos)

| Arquivo | O que extrair | O que descartar |
|---------|--------------|-----------------|
| `index.ts` | Esqueleto `fetch()` + `scheduled()`, CORS, error handling | Lógica de token/sessão |
| `patrimonio.repositorio.ts` | Pattern CRUD com construção dinâmica de SET clauses | Views complexas, `usuario_id` |
| `patrimonio.servico.ts` | `Promise.all` para queries paralelas | Score, importação, aportes |
| `mercado.repositorio.ts` | Queries de busca de ativo e cotação | CVM, busca full-text |
| `historico-mensal.job.ts` | UPSERT mensal idempotente | Loop multi-usuário |

#### DESCARTAR (20 arquivos)

Todos os domínios `auth/`, `usuario/`, `perfil/`, `decisoes/`, `admin/`, `telemetria/` — 18 arquivos.
Mais `infra/cripto.ts` (JWT/PBKDF2 — desnecessário com Cloudflare Access) e `infra/sessao.ts`.

### 3.2 Frontend (~9.500 linhas)

#### COPIAR DIRETO (~500 linhas de JS puro)

| Arquivo | Funções | LOC |
|---------|---------|-----|
| `utils/cache.ts` | Cache localStorage com TTL | 81 |
| `utils/formatarData.ts` | ISO → "Hoje às 14h32" | 44 |
| `utils/formatarPercentual.ts` | Número → "12,5%" | 17 |
| `utils/motivoRentabilidade.ts` | Códigos de erro → mensagens PT-BR | 36 |
| `cliente-api/authStorage.ts` | CRUD sessão em localStorage | 52 |
| `cliente-api/http.ts` | Wrapper fetch com envelope parsing | 100 |
| `cliente-api/patrimonio.ts` | 12 wrappers de API | 82 |
| `styles/index.css` (parcial) | CSS variables, skeleton, btn-tap, num-tabular | ~100 |

#### EXTRAIR E REESCREVER (~300 linhas de lógica)

| Origem | Lógica útil |
|--------|-------------|
| `useIsMobile.ts` | `detectMobile()` — detecção de dispositivo (JS puro) |
| `MobileAppLayout.jsx` | Swipe handler entre tabs (touch events) |
| `HomeMobile.jsx` | `getSaudacao()`, formatação de moeda |
| `Carteira*.jsx` | `consolidarAtivos()`, chain de filtros, mapeamento tipo→categoria |
| `Historico*.jsx` | Filtro de período, `formatarAnoMes()`, cálculo de evolução |
| `DetalheAtivo.jsx` | Gráfico SVG polyline (sem lib) |
| `main.tsx` | Micro-haptics `navigator.vibrate(8)` (3 linhas) |

#### DESCARTAR (~8.200 linhas)

- Todo o JSX React e roteamento
- Framer Motion (usar CSS transitions)
- Recharts (usar SVG manual)
- Lucide React (usar SVG inline)
- Tailwind (usar CSS variables)
- Todas as telas Desktop (Quanto é mobile-first, uma versão só)
- Telas de Insights, Importar, Decisões, Onboarding, Admin, Perfil
- `fipe.ts`, `useConteudoApp.ts`, `decisoes.ts` (código morto)
- `importacaoParser.ts` + `importacaoTemplate.ts` (1.100 linhas de importação XLSX)

### 3.3 Banco de Dados (26 tabelas + 9 views)

#### ADAPTAR (3 tabelas)

| Tabela Esquilo | → Tabela Quanto | Mudanças |
|----------------|-----------------|----------|
| `patrimonio_itens` | `assets` | Remover `usuario_id`, `ativo_id` (FK para catálogo), `origem`, `moeda`, `dados_json`. Adicionar `institution`, `manual_balance`, `balance_updated_at`. Unificar catálogo + posição. |
| `ativos_cotacoes_cache` | `quotes_cache` | Simplificar: chave por `ticker` (não `ativo_id`), remover `fonte`, `expira_em`, `dados_json`. Manter `price` + `fetched_at`. |
| `patrimonio_historico_mensal` | `snapshots` | Simplificar: manter `month`, `total`, `invested`. Remover `patrimonio_liquido`, `divida`, `rentabilidade`, `eh_confiavel`, `dados_json`. |

#### DESCARTAR (23 tabelas + 7 views)

Auth (3), Usuário (2), Perfil (1), Mercado-catálogo (3), Patrimônio-extra (3), Importação (2), Decisões (1), Telemetria (1), Admin (2), Config (4), CVM (1).

Views: 7 de 9 são DROP. 2 (`vw_patrimonio_posicoes`, `vw_patrimonio_alocacao`) têm lógica útil mas o Quanto resolve com queries simples.

### 3.4 Infraestrutura e Configuração

| Item | Veredicto | Ação |
|------|-----------|------|
| `wrangler.toml` | ADAPTAR | Usar como template. 1 D1 binding, 1 cron. **Corrigir**: separar database_id dev/prod. |
| `deploy.yml` (CI/CD) | DESCARTAR | Quanto deploya com `wrangler deploy`. Se CI for desejado, reescrever do zero. |
| `ingest-cvm.yml` | DESCARTAR | Quanto não faz ingestão CVM. |
| `package.json` raiz | ADAPTAR | Monorepo → single package. Remover workspaces. |
| `Makefile` | DESCARTAR | Completamente morto (referencia `apps/web` que não existe). |
| `tsconfig.json` raiz | DESCARTAR | Quebrado (9 paths inexistentes). Reescrever ou eliminar (Quanto não precisa de TS no frontend). |
| `README.md` | DESCARTAR | Desatualizado, referências quebradas. Reescrever. |

---

## 4. Análise da Planilha de Investimentos

A planilha `Quanto_v3_Completo.xlsx` contém os investimentos reais. Problemas reportados:

- **Rendimentos inflados** — valores duplicados gerando totais incorretos
- **Necessidade de reconciliação** — os dados do seed SQL na spec (`seed.sql` com 19 ativos) devem ser a fonte de verdade, não a planilha

**Recomendação:** Usar os dados do `seed.sql` da spec v2 como base. A planilha deve ser tratada como referência histórica, não como fonte de dados para o sistema.

---

## 5. Decisão de Repositório

### Recomendação: CRIAR REPOSITÓRIO NOVO

**Razões:**

1. **Histórico git poluído** — 36 MB em `.git/` por binários (PNGs, PDFs, SQLite, bundles JS). Limpar exigiria `git filter-repo` — esforço desproporcional para 800 linhas de reuso.

2. **Estado local commitado** — `.wrangler/` com cache e banco SQLite, `.claude/` com config local, `infra/banco/banco.db`. Mesmo removendo, o histórico mantém os dados.

3. **Referências quebradas** — `tsconfig.json`, `Makefile`, `README.md` apontam para estrutura que não existe mais. Corrigir tudo é mais trabalho que começar limpo.

4. **Reuso mínimo** — 800 linhas de ~52.000 (1,5%). Copiar arquivos individuais é mais rápido que podar o repo.

5. **Identidade diferente** — Quanto é um produto novo com marca, stack e filosofia diferentes. Merece um repo limpo.

### Plano de Execução

```
1. Criar repo novo: github.com/gmmattey/quanto
2. Inicializar com: wrangler.toml, schema.sql, seed.sql, src/index.ts, public/
3. Copiar seletivamente os 5 arquivos backend reaproveitáveis
4. Copiar os ~8 utilitários JS do frontend
5. Arquivar o repo ei-raiz (set to archive on GitHub)
6. Não deletar ei-raiz — manter como referência histórica
```

### Estrutura do Repo Quanto

```
quanto/
├── wrangler.toml           # 1 D1 binding, 1 cron, Cloudflare Access
├── schema.sql              # 3 tabelas
├── seed.sql                # 19 ativos reais
├── src/
│   └── index.ts            # Hono: 6 endpoints + cron handler (~200 linhas)
├── public/
│   ├── index.html           # SPA shell
│   ├── app.js               # Vanilla JS (~500 linhas)
│   ├── app.css              # CSS com custom properties (~200 linhas)
│   ├── manifest.json        # PWA
│   ├── sw.js                # Service Worker (offline)
│   ├── fonts/               # Archivo + Inter woff2
│   └── icons/               # quanto-icon-192.png, quanto-icon-512.png
├── package.json             # Apenas hono + wrangler
└── .gitignore               # .wrangler/, *.db, node_modules/
```

---

## 6. Inventário de Reuso — Checklist

### Backend (copiar para `src/`)

- [ ] `infra/bd.ts` → adaptar tipo `Env`, remover campos desnecessários
- [ ] `infra/http.ts` → copiar intacto
- [ ] `calculos/alocacao.ts` → copiar intacto
- [ ] `calculos/rentabilidade.ts` → copiar intacto
- [ ] `mercado-atualizar.job.ts` → simplificar para single-user, manter BRAPI + UPSERT
- [ ] `historico-mensal.job.ts` → adaptar para single-user snapshot

### Frontend (copiar para `public/`)

- [ ] `utils/cache.ts` → remover TypeScript, copiar lógica
- [ ] `utils/formatarData.ts` → copiar intacto (JS puro)
- [ ] `utils/formatarPercentual.ts` → copiar intacto
- [ ] `cliente-api/http.ts` → adaptar para Quanto API URL
- [ ] `styles/index.css` → extrair CSS variables, skeleton, motion tokens
- [ ] `MobileAppLayout.jsx` → extrair swipe handler (touch events)
- [ ] `useIsMobile.ts` → extrair `detectMobile()` como função standalone
- [ ] `HomeMobile.jsx` → extrair `getSaudacao()`, formatação de moeda

### Banco (novo schema)

- [ ] Criar `schema.sql` com 3 tabelas conforme spec v2
- [ ] Criar `seed.sql` com 19 ativos da spec v2 (não da planilha XLSX)
- [ ] Verificar valores do seed contra dados reais atuais

---

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Perda de dados ao arquivar ei-raiz | Baixa | Alto | Não deletar — apenas archive no GitHub |
| Planilha com dados incorretos usada como seed | Média | Alto | Usar seed da spec v2, reconciliar manualmente |
| Feature creep no Quanto ("só mais uma tela") | Alta | Crítico | Anti-escopo documentado no CLAUDE.md. Agente product-strategist como guardião. |
| Cloudflare Access não funcionar em Capacitor/PWA | Média | Alto | Testar OTP email no Android antes de codar o app |
| BRAPI free tier atingir rate limit | Baixa | Médio | Cache de 15 min no D1 limita chamadas |

---

## 8. Cronograma Sugerido

| Fase | Entregável | Esforço estimado |
|------|-----------|-----------------|
| **1. Setup** | Repo, wrangler, schema, seed, deploy vazio | 1 sessão |
| **2. Backend** | 6 endpoints + cron de cotações | 1-2 sessões |
| **3. Frontend** | 3 telas + 3 sheets em Vanilla JS | 2-3 sessões |
| **4. PWA** | manifest, service worker, offline | 1 sessão |
| **5. Cloudflare Access** | OTP email, testes em Android | 1 sessão |
| **6. Validação** | Smoke test dos 8 fluxos da spec | 1 sessão |

**Critério de pronto:** F3 (consulta rápida) leva <10s do toque no ícone ao número na tela, offline incluso.

---

## 9. Conclusão

O Esquilo Invest foi um MVP ambicioso que acumulou dívida técnica significativa em 24 dias. Das 22 telas construídas, várias têm funcionalidades quebradas ou incompletas. O padrão de duplicação Desktop/Mobile multiplicou a manutenção por 2 sem ganho real.

O Quanto é a decisão correta: reduzir 88% da complexidade para entregar 100% do valor. A pergunta "quanto eu tenho, de fato?" não precisa de 26 tabelas, 36 endpoints e uma IA financeira. Precisa de 3 telas limpas, dados atualizados, e 10 segundos para abrir o app.

**Reuso efetivo:** ~800 linhas de lógica pura (cache, formatação, BRAPI, cálculos, D1 wrapper). O resto é peso morto que o Quanto não deve carregar.

**Próximo passo:** Criar o repositório `quanto` e iniciar a Fase 1 (Setup).

---

*Documento gerado em 13/06/2026. Baseado em auditoria completa do repositório github.com/gmmattey/ei-raiz (82 commits, 948 arquivos).*
