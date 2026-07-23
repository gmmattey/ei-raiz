# Fusao Quanto + Esquilo — Arquitetura Alvo

Atualizado em: 2026-06-19
Escopo: arquitetura alvo incremental, apos o cutover visual para `apps/web`

## 1. Veredito arquitetural

O alvo oficial e um **monolito modular Cloudflare-native**.

Separacao desejada:

- `apps/web` para experiencia do usuario
- `apps/core-api` para API transacional e leituras por tela
- `apps/ingestion-plane` para cron, ingestao, reconciliacao e processamento assincrono

Esta separacao e **pragmatica**, nao ideologica.
O sistema continua podendo ser implantado como um Worker unico durante a transicao.

## 2. Principios de arquitetura

1. Preservar o runtime atual ate haver paridade.
2. Extrair por dominio e por contrato, nunca por hype de stack.
3. Views SQL continuam sendo o ponto preferencial de leitura agregada.
4. `apps/` e `packages/` nascem em paralelo ao runtime atual, nao por substituicao abrupta.
5. O frontend final e unico e responsivo; nao repetir desktop/mobile por tela.
6. O `ingestion-plane` so ganha deploy separado quando isso reduzir risco operacional de fato.

## 3. Estrutura alvo do repo

```text
Quanto/
  apps/
    web/
    core-api/
    ingestion-plane/
  packages/
    contracts/
    domain/
    ui/
    tooling/
  infra/
    d1/
      migrations/
      views/
  docs/
    fusao/
  legacy/
    ei-raiz-reference/
```

## 4. Papel de cada unidade

### `apps/web`

Destino do frontend final da fusao.

Responsabilidades:

- app shell
- navegacao principal
- telas portadas
- integracao com contratos canonicos
- PWA, dark mode, masking e offline

Estado atual:

- `apps/web` ja assumiu o ponteiro de assets do Worker principal
- `public/` permanece como legado recuperavel e referencia historica de comportamento

### `apps/core-api`

Destino da extracao modular de `src/index.ts`.

Responsabilidades:

- auth
- portfolio
- assets
- goods
- history
- import
- lifecycle
- AI explicativa
- endpoints publicos e protegidos

Regra desta fase:

- `src/index.ts` continua sendo a entrypoint real
- `apps/core-api` nasce como casa futura dos modulos, nao como wiring ativo ainda

### `apps/ingestion-plane`

Destino de toda logica de processamento nao interativa.

Responsabilidades:

- refresh BRAPI
- refresh CVM
- snapshots
- benchmarks
- reconciliacao/importacoes futuras

Regra desta fase:

- o cron continua acionando funcoes a partir do runtime atual
- a extracao acontece depois da estabilizacao do core-api

### `packages/contracts`

Primeira camada a nascer.

Responsabilidades:

- DTOs canonicos
- envelopes de API
- shape das leituras por tela
- enums de dominio

Primeira composicao concreta desta sessao:

- `auth.ts`
- `portfolio.ts`
- `history.ts`
- `funds.ts`

### `packages/domain`

Segunda camada a nascer.

Responsabilidades:

- tipos de dominio
- calculos puros
- regras de status/lifecycle
- regras de alocacao, frescor e consolidacao

### `packages/ui`

Destino do design system e dos componentes reutilizaveis.

Responsabilidades:

- tokens do Quanto final
- shell e componentes base
- padroes de page header, metric cards, chips, list rows, sheets
- traducao visual do que for reaproveitado do Esquilo para a marca Quanto

### `packages/tooling`

Camada de suporte para:

- helpers compartilhados
- adapters de teste
- formatadores
- utilitarios operacionais

## 5. Dominios canonicos iniciais

Os primeiros dominios canonicos da fusao serao:

| Ordem | Dominio | Motivo |
| --- | --- | --- |
| 1 | `auth` | o runtime atual depende dele para tudo |
| 2 | `portfolio` | alimenta Hoje e Carteira |
| 3 | `market` | BRAPI, CVM e macro sustentam dados automaticos |
| 4 | `goods` | patrimonio bruto ja aparece em Hoje |
| 5 | `history` | snapshots e historico sao base de paridade |
| 6 | `lifecycle` | saida, venda e eventos do ativo ja existem no runtime |
| 7 | `import` | fluxo central do produto, mas pode entrar apos contratos-base |

## 6. Contratos canonicos que devem nascer primeiro

Esses contratos destravam a primeira entrega:

- `AuthSession`
- `PortfolioSummary`
- `PortfolioAsset`
- `RedeemingAsset`
- `AllocationSlice`
- `FreshnessSummary`
- `QuoteHealth`
- `GrossWealthSummary`
- `HistoryPoint`
- `FundSearchResult`

## 7. Caminho tecnico de migracao do backend

### Etapa 1 — preservar

- `src/index.ts` continua entrypoint do Worker
- `src/auth.ts` continua autenticao real
- `wrangler.toml` continua apontando para `src/index.ts` e agora serve assets de `apps/web`

### Etapa 2 — extrair sem mudar comportamento

- mover tipos e enums para `packages/contracts`
- mover calculos puros para `packages/domain`
- mover funcoes de CVM/BRAPI/snapshot para `apps/ingestion-plane`
- mover handlers por dominio para `apps/core-api`
- manter `src/index.ts` como casca fina que so compoe/importa os modulos novos

### Etapa 3 — so depois discutir split de deploy

- avaliar se `core-api` e `ingestion-plane` viram deploys distintos
- nao fazer isso antes de existir regressao confiavel

## 8. Caminho tecnico de migracao do frontend

### O que continua vivo agora

- `apps/web/index.html`
- `apps/web/app.js`
- `apps/web/sw.js`
- `public/` como fallback e referencia de legado

### O que sera reaproveitado do Esquilo

- estrutura de app shell
- hierarquia visual de tela
- metric cards e page headers
- layouts de carteira, detalhe e historico
- componentes de importacao e estados vazios

### O que nao sera reaproveitado intacto

- React/Vite/Tailwind como imposicao arquitetural
- duplicacao de tela desktop/mobile
- auth e navegacao antigas do Esquilo

### Sequencia de migracao da UI

1. `apps/web` recebe app shell minimo
2. portar `Hoje`
3. portar `Carteira`
4. portar `Detalhe do ativo`
5. portar `Historico`
6. portar `Importar`
7. revisar `Bens`

## 9. Guardrails de runtime

- Nao mover `migrations/` ativas para `infra/d1/migrations` nesta fase.
- Nao introduzir dependencia nova de build no caminho critico sem decisao explicita.
- Nao quebrar os testes existentes so para satisfazer a estrutura nova.

## 10. Estrategia pos-cutover

Para futuras promocoes sem risco:

- `apps/web` continua buildless
- a API continua sendo a do runtime vivo em `src/index.ts`
- preflight e postflight passam a ser os gates oficiais de deploy

## 11. Implicacoes praticas desta decisao

O repo passa a ter duas camadas ao mesmo tempo:

- camada viva atual: `src/`, `apps/web`, `migrations/`, `tests/`
- camada alvo de fusao: `apps/`, `packages/`, `infra/d1/`, `docs/fusao/`

A fusao correta e fazer a camada alvo absorver a camada viva aos poucos, e nao o contrario.
