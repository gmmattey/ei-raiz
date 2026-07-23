# Fusao Quanto + Esquilo — Visao Geral

Atualizado em: 2026-06-19
Status: oficial para o workflow padrao do Codex

Base documental desta fase:

- `00-visao-geral.md`
- `01-arquitetura-alvo.md`
- `02-mapa-de-migracao.md`
- `03-backlog-de-fusao.md`
- `04-cutover-checklist.md`
- `05-modelo-canonico-portfolio-import.md`
- `06-operacao-cutover.md`
- `07-inventario-schema-real.md`
- `08-handoff-arquitetura-qa.md`

## 1. Tese da fusao

O repositorio que sobrevive e `C:\Projetos\Quanto`.
A marca final continua sendo `Quanto`.
O `ei-raiz-master` passa a ser referencia primaria de extracao funcional, arquitetural e de UX.

O alvo da fusao nao e reanimar o Esquilo inteiro nem manter o Quanto atual como forma final.
O alvo e construir um **monolito modular Cloudflare-native**, com separacao pragmatica entre:

- `web-app`
- `core-api`
- `ingestion-plane`

Isso **nao** significa microservicos agora.
Significa preparar fronteiras tecnicas para o crescimento sem quebrar o runtime atual.

## 2. Decisoes maes

| Tema | Decisao oficial |
| --- | --- |
| Repo principal | `C:\Projetos\Quanto` |
| Marca | `Quanto` |
| Fonte de UX madura | `C:\Projetos\ei-raiz-master\apresentacao\src\` |
| Fonte de backend modular | `C:\Projetos\ei-raiz-master\servidores\porta-entrada\src\` |
| Fonte de contratos/modelagem | `C:\Projetos\ei-raiz-master\bibliotecas\` |
| Fonte de coordenacao | esta thread + `docs/fusao/` |
| Papel do `fleet.json` | legado consultivo, nao operacional |
| Regra de runtime | preservar `src/index.ts` como base ativa de backend e manter `public/` como legado recuperavel apos o cutover |

## 3. Estado atual observado no repo Quanto

### Runtime ativo

- Backend unico em `src/index.ts` com Hono + D1 + cron.
- Assets servidos diretamente de `apps/web`.
- Worker atual faz auth JWT, portfolio, import, CVM, aportes, bens, analise IA e lifecycle de saida/venda.
- `schema.sql` sozinho nao descreve o runtime real; a foto canonica desta fase e:
  - `schema.sql`
  - `migrations/004` a `migrations/011`
  - `src/index.ts`
  - `tests/api.spec.ts`

### Superficies de produto ja vivas

- Login, cadastro e recuperacao por email/senha.
- Hoje, Carteira, Bens, Historico e Importar.
- Tela de detalhe por ativo.
- Aportes por ativo.
- Bens e garantias.
- CVM + BRAPI + benchmarks.
- Dark mode, ocultar valores, PWA/offline.

### Estrutura tecnica atual

| Camada | Estado atual |
| --- | --- |
| Frontend | `apps/web` ativo em producao; `public/` preservado como legado recuperavel |
| Backend | `src/index.ts` monolitico com varios dominios misturados |
| Auth | `src/auth.ts`, JWT HS256 8h, PBKDF2 |
| Dados | `schema.sql` + migrations + views SQL |
| QA | `tests/` com Playwright, mock BRAPI e reset de D1 local |

## 4. O que o Quanto preserva como base

Estas partes continuam sendo a referencia viva do produto apos o cutover:

- identidade de marca Quanto
- fluxo de auth atual
- runtime Cloudflare Workers + D1
- pipeline CVM/BRAPI ja operacional
- comportamento central de Hoje, Carteira, Historico, Importar e Bens
- PWA, dark mode, ocultar valores, offline
- suite de testes existente em `tests/`

## 5. O que o Esquilo entra para melhorar

O Esquilo nao entra como repo sobrevivente. Entra como fonte de maturidade para:

- composicao de app shell e layout responsivo
- componentes de pagina e metric cards
- modelagem patrimonial mais rica
- contratos compartilhados por dominio
- separacao `rotas -> servicos -> repositorios -> calculos`
- visoes SQL por tela
- trilha futura de admin, auditoria e operacao

## 6. Sobrevivencia por area

| Area | Base que fica viva agora | Herdanca principal do Esquilo | Resultado desejado |
| --- | --- | --- | --- |
| Produto | Quanto | cobertura funcional mais rica | produto Quanto mais robusto, sem feature creep |
| Frontend | `apps/web` | maturidade herdada + shell buildless | UX forte e marca Quanto em producao |
| Backend | `src/index.ts` | modularidade por dominio | `apps/core-api` + `apps/ingestion-plane` |
| Dados | `schema.sql` + migrations | contratos e dominio patrimonial | modelo canonico mais forte, sem perder pragmatismo |
| QA | `tests/` atual | paridade e cobertura por tela | regressao orientada por migracao |

## 7. Anti-escopo mantido

Mesmo na fusao, continuam fora:

- login social, OAuth, 2FA via app
- proventos, dividendos, IR, come-cotas, preco medio
- metas, rebalanceamento, recomendacoes de portfolio
- Open Finance / B3 / CEI via API
- notificacoes push
- simuladores de decisao como prioridade desta fusao

O Esquilo serve como alerta de excesso: a fusao nao pode reintroduzir a inflacao de superficie que o Quanto nasceu para corrigir.

## 8. Estado atual da fusao

O recorte de fusao foi concluido ate o cutover:

1. contratos canonicos nasceram e sustentam a borda HTTP extraida
2. `packages/ui` e `apps/web` sustentam o shell ativo
3. `apps/core-api` e `apps/ingestion-plane` concentram a maior parte da extracao modular
4. o Worker principal ja serve `apps/web` em producao

## 9. Primeira entrega funcional consolidada

A primeira entrega funcional da fusao ja esta concreta nesta trilha:

- `packages/contracts` descreve o contrato vivo de `auth`, `portfolio`, `history`, `funds`, `goods`, `detail`, `import`, `ai` e `public`
- `packages/ui` concentra tokens, shell e componentes/padroes minimos da nova trilha
- `apps/web` ja tem shell, login minimo e a vertical inicial puxando a jornada por **Hoje**
- `apps/core-api` consome estes contratos na borda HTTP sem trocar o ponteiro do runtime principal
- tudo consome o runtime atual por API e o ponteiro de assets ja foi trocado em `wrangler.toml`

Essa escolha foi feita porque a tela Hoje:

- representa a tese central do Quanto
- usa o contrato mais importante do sistema (`/api/portfolio`)
- permite validar branding, performance, alocacao, frescor e patrimonio bruto
- exige menos acoplamento inicial do que importar todo o fluxo de Carteira ou Importacao

## 10. Regra operacional daqui para frente

- `docs/fusao/` vira a fonte leve de verdade para migracao.
- O runtime de backend continua em `src/index.ts` ate nova extracao controlada.
- Nada de mover arquivos ativos para `apps/` ou `packages/` antes de existir fallback seguro ou importacao explicita.
- `docs/fusao/09-trilhas-remanescentes.md` passa a registrar o trabalho pos-cutover.
