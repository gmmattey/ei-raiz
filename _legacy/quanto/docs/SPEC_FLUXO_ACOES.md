# SPEC — Fluxo de Ações ponta a ponta

> Status: **done** — spec criada e pronta para implementação  
> Aprovado em: 2026-06-17  
> Depende de: FEAT-001 (CRUD de ativos), FEAT-002 (Portfolio), FEAT-003 (BRAPI), FEAT-017 (Detalhe), FEAT-018 (Aportes)  
> Tasks relacionadas: SPEC-012, BUG-010, BUG-011, BUG-012, INFRA-005, FEAT-027, FEAT-028, FEAT-029, QA-004  
> Relacionada a: SPEC_ASSET_DETAIL.md, SPEC_APORTES.md, TEST_PLAN.md

---

## 1. Visão Geral

### Motivação

Hoje o Quanto já cobre partes importantes do fluxo de ações:

- cadastro manual com ticker e quantidade
- import XLSX
- atualização de cotação via BRAPI
- tela de detalhe com gráfico e rendimento
- aportes adicionais
- estado intermediário `redeeming`

Mas esse fluxo ainda não fecha ponta a ponta. Existem três problemas estruturais:

1. **Contrato de classe inconsistente**: o produto fala em "Ação/FII", as specs de detalhe/aportes tratam `FII` como classe própria, mas o schema e o backend base ainda só aceitam `ACAO`.
2. **Import e hidratação divergentes**: cadastro manual e importação em lote não seguem o mesmo contrato para `quote_source`, status/lifecycle e atualização inicial de cotação.
3. **Venda ainda não existe como evento de negócio**: hoje "saída" está reduzida a `redeeming` ou `archived`, sem trilha própria de venda concluída.

### Objetivo desta spec

Fechar o fluxo de ações/FIIs do Quanto do começo ao fim:

1. entrada manual
2. entrada por planilha
3. visualização e acompanhamento com cotação real na Home e na Carteira
4. detalhe, referência de compra e aportes
5. saída/venda com histórico preservado

### Princípio central

O Quanto **não é um home broker** nem um sistema fiscal. O app consolida patrimônio. Portanto, o fluxo de ações precisa ser:

- simples para o usuário
- coerente entre entrada manual e import
- correto do ponto de vista patrimonial
- honesto quando a cotação estiver indisponível
- sem inventar preço médio fiscal, IR ou dividendos

---

## 2. Diagnóstico do Estado Atual

### O que já existe e funciona

- `POST /api/assets` cria ativo automático com `ticker` + `qty`
- cadastro com `invested` já cria o **aporte inicial**
- `GET /api/portfolio` calcula saldo de ativos automáticos com `qty * price`
- `GET /api/assets/:id/detail` refresca BRAPI e exibe detalhe com ganho
- `GET /api/assets/:id/history` busca histórico BRAPI
- `POST /api/import` importa ativos em lote
- `POST/GET/DELETE /api/assets/:id/contributions` já sustentam aportes
- frontend já exibe grupo `redeeming` separado e nota "não contabilizado"

### O que está inconsistente

#### 2.1 Classe `FII`

- UI colapsa `ACAO` e `FII` em "Ação/FII"
- specs antigas falam em `FII` como classe separada
- regras de aportes aceitam `FII`
- `VALID_CLASSES` e `schema.sql` não aceitam `FII`

Resultado: o produto mistura dois conceitos ao mesmo tempo:

- **visualmente** FII parece classe própria
- **tecnicamente** FII é tratado como `ACAO`

#### 2.2 Import XLSX

- a aba `Acoes-FIIs` é mapeada integralmente para `ACAO`
- o wizard não preserva status/lifecycle da posição
- o backend de import grava tudo com `status = 'active'`
- o import não seta `quote_source`
- o import não faz eager fetch de BRAPI por lote

Resultado: um ativo de ação criado manualmente e o mesmo ativo importado podem ter comportamento diferente logo após a entrada.

#### 2.3 Venda / saída

Hoje há apenas estes estados:

- `active`
- `redeeming`
- `archived`

Problema:

- `redeeming` representa uma saída em andamento, não uma venda concluída
- `archived` é soft delete operacional, não evento de negócio
- não existe evento persistido de venda
- não existe data de venda
- não existe valor de saída
- não existe trilha explícita de "entrei em saída", "voltei", "vendi"

Resultado: o usuário consegue "tirar da carteira", mas não consegue **registrar a venda** de forma semântica.

#### 2.4 Home e visualização principal ainda não explicam a posição

Hoje, mesmo quando a ação existe na carteira, o app não garante de forma confiável para o usuário:

- valor atual da posição
- valor aplicado
- lucro/perda em R$
- lucro/perda em %
- data de referência da compra
- explicação clara quando a cotação não veio

Resultado: o usuário vê que existe uma ação, mas não consegue entender rapidamente se está ganhando ou perdendo, nem qual referência de compra está sendo usada.

---

## 3. Escopo

### Esta spec faz

- separa `ACAO` e `FII` no contrato de dados e na UI
- unifica cadastro manual e import de ações/FIIs
- padroniza hidratação de BRAPI em entrada, listagem e detalhe
- define a informação mínima obrigatória da Home, Carteira e Detalhe para ações/FIIs
- define lifecycle de posição aberta, em saída e vendida
- define fluxo de venda concluída com histórico preservado
- protege `archived` para remoção operacional, não para venda
- atualiza critérios de QA ponta a ponta

### Esta spec não faz

- não implementa venda parcial
- não implementa preço médio fiscal
- não implementa IR, DARF, dividendos, JCP, proventos
- não implementa recomendações de compra, venda ou rebalanceamento
- não detalha ainda o modelo completo de compras por lote/data da mesma ação; isso fica em uma spec complementar
- não importa posições já vendidas via XLSX no MVP

---

## 4. Modelo de Domínio Alvo

### 4.1 Classes

As classes passam a ser:

- `ACAO`
- `FII`
- `FUNDO`
- `RF`
- `TESOURO`
- `PREVIDENCIA`
- `POUPANCA`
- `COFRINHO`

### 4.2 Regras de mercado

| Classe | Fonte | Modo | Observação |
|---|---|---|---|
| ACAO | BRAPI/B3 | automático | usa `ticker`, `qty`, `quote_source='BRAPI'` |
| FII | BRAPI/B3 | automático | mesmo modelo técnico de ação, classe distinta para agrupamento e regras |
| FUNDO | CVM | automático | usa CNPJ/CVM |
| RF/TESOURO/PREVIDENCIA/POUPANCA/COFRINHO | manual | manual | saldo informado pelo usuário |

### 4.3 Lifecycle da posição

Estados alvo:

- `active` — posição aberta e contabilizada no patrimônio
- `redeeming` — saída iniciada / liquidação pendente; visível separadamente e fora do total
- `sold` — venda concluída; fora do total e fora da carteira padrão
- `archived` — remoção operacional; não é evento de negócio

### 4.4 Transições válidas

```text
active -> redeeming
redeeming -> active
active -> sold
redeeming -> sold
active -> archived
redeeming -> archived
sold -> archived
```

### 4.5 Regra obrigatória

`archived` **nunca** pode ser usado como sinônimo de venda concluída.

Se houve venda, o sistema deve registrar um evento explícito e mover o ativo para `sold`.

---

## 5. Regras de Negócio

### RN-A01 — Cadastro é o primeiro aporte

Quando o usuário criar uma posição de `ACAO` ou `FII` com `invested > 0`, esse valor deve gerar automaticamente o primeiro registro em `asset_contributions`.

### RN-A02 — Import segue a mesma regra do cadastro

Quando o usuário importar uma ação/FII com `invested > 0`, o import deve gerar o aporte inicial da mesma forma que o cadastro manual.

### RN-A03 — `ACAO` e `FII` são classes distintas

Ambas usam BRAPI, ticker e quantidade, mas devem permanecer distintas para:

- filtro por classe
- agrupamento
- badge/meta
- evolução futura de regras específicas

### RN-A04 — Ausência de cotação não pode virar zero falso

Se um ativo automático não tiver cotação disponível:

- `balance` deve ser `null`
- `gain` deve ser `null`
- a UI deve dizer "cotação indisponível"
- o patrimônio não pode sugerir perda falsa gerada por `COALESCE(price, 0)`

### RN-A05 — `redeeming` continua existindo

`redeeming` é útil para representar uma posição em processo de saída, mas **não substitui** a venda concluída.

### RN-A06 — Venda do MVP é venda total

No MVP, a venda encerrará **100% da posição atual**.

Não haverá:

- venda parcial
- redução proporcional de `qty`
- reapuração de `invested` por remanescente

### RN-A07 — Venda precisa de data e valor

A conclusão da venda exige:

- `soldAt`
- `grossAmount`

Ambos serão persistidos no evento de lifecycle.

### RN-A08 — Posição vendida não entra no patrimônio

Ativo com status `sold`:

- não entra em `GET /api/portfolio.assets`
- não entra em `GET /api/portfolio.redeeming`
- não entra no total patrimonial
- não entra em alocação por classe ou instituição

### RN-A09 — Detalhe de ativo vendido pode continuar existindo

`GET /api/assets/:id/detail` deve aceitar `sold` para preservar leitura histórica do ativo, desde que não esteja `archived`.

### RN-A10 — `PUT /api/assets/:id` não conclui venda

Venda concluída não pode ser feita por `PUT` genérico alterando `status`.

Transições de negócio devem usar endpoints dedicados.

### RN-A11 — Import do MVP aceita posições abertas e em saída

O XLSX do MVP pode criar posições com:

- `active`
- `redeeming`

Não cria `sold` por importação.

### RN-A12 — FII usa o mesmo pipeline de cotação da ação

`FII`:

- usa `quote_source = 'BRAPI'`
- usa `ticker`
- usa `qty`
- tem `balance = qty * price`

### RN-A13 — Home precisa mostrar informação mínima útil

Para carteira com ações/FIIs e `invested > 0`, a experiência principal deve permitir ao usuário enxergar sem abrir fluxo de edição:

- patrimônio atual total
- ganho/perda total em R$
- ganho/perda total em %
- frescor das cotações

### RN-A14 — Carteira e detalhe precisam mostrar referência de compra

Na ausência de modelo por lote, a referência de compra atual deve vir de:

1. menor `contributedAt` em `asset_contributions`, quando existir
2. `assets.created_at`, quando não existir aporte

### RN-A15 — Compras em datas diferentes da mesma ação viram requisito formal

O feedback de produto mostrou que múltiplas compras da mesma ação com datas e quantidades diferentes não são mais stretch goal. Esse requisito passa a existir formalmente, mas será detalhado em uma spec complementar própria porque muda a modelagem de dados.

---

## 6. Fluxo 1 — Cadastro Manual de Ação/FII

### 6.1 UI

O Sheet C deve separar claramente as opções:

- `Ação`
- `FII`

Não usar rótulo único "Ação/FII" como classe selecionável.

### 6.2 Campos obrigatórios

Para `ACAO` e `FII`:

- instituição
- classe
- nome
- ticker
- quantidade

Campos opcionais:

- valor aplicado (`invested`)

### 6.3 Persistência

`POST /api/assets` deve:

1. aceitar `class = 'ACAO' | 'FII'`
2. gravar `quote_source = 'BRAPI'`
3. gravar `status = 'active'`
4. gerar aporte inicial se `invested > 0`
5. tentar eager fetch da cotação

### 6.4 Se a BRAPI falhar

O ativo ainda é criado, mas:

- `quotes_cache` pode permanecer sem linha
- a carteira deve mostrar "cotação indisponível"
- o detalhe deve tentar novo refresh quando aberto

---

## 7. Fluxo 2 — Import XLSX de Ações/FIIs

### 7.1 Objetivo

O import deve produzir o mesmo contrato final do cadastro manual.

### 7.2 Template

A aba pode continuar se chamando `Acoes-FIIs`, mas cada linha precisa carregar a classe real.

Colunas mínimas do fluxo:

| Coluna | Obrigatória? | Observação |
|---|---|---|
| `Nome` | ✓ | nome do ativo |
| `Classe` | ✓ | `ACAO` ou `FII` |
| `Ticker` | ✓ | BRAPI/B3 |
| `Quantidade` | ✓ | posição atual |
| `Valor Aplicado` | opcional | gera aporte inicial |
| `Instituicao` | ✓ | XP/ITAU/ONZE/OUTROS |
| `Situacao` | opcional | `active` ou `redeeming`; default `active` |

### 7.3 Regras do wizard

- validar linha a linha
- mostrar badge por severidade
- permitir remover linhas inválidas
- mostrar claramente qual status será persistido
- não colapsar tudo em `ACAO`

### 7.4 Regras do backend

`POST /api/import` deve:

1. aceitar `class = 'ACAO' | 'FII'`
2. aceitar `status = 'active' | 'redeeming'`
3. setar `quote_source = 'BRAPI'` para ações/FIIs
4. gerar aporte inicial quando `invested > 0`
5. disparar eager fetch em lote para tickers únicos importados

### 7.5 Fora de escopo do import MVP

- importar posição já vendida
- importar múltiplas compras/vendas históricas
- importar lote a lote

---

## 8. Fluxo 3 — Acompanhamento com Atualizações Reais

### 8.1 Portfolio

`GET /api/portfolio` deve seguir estas regras:

- `active` entra no total
- `redeeming` sai do total e aparece em grupo separado
- `sold` não entra no retorno principal
- `archived` é invisível

### 8.2 Refresh de BRAPI

O contrato alvo fica:

| Momento | Comportamento |
|---|---|
| cadastro manual | eager fetch da cotação |
| import em lote | eager fetch por ticker único |
| load do portfolio | refresh se stale > 15 min |
| load do detalhe | refresh se stale > 15 min ou ausente |

### 8.3 UI quando preço estiver indisponível

Na Carteira:

- meta deve dizer `X cotas/ações · cotação indisponível`
- saldo não deve parecer zero

No Detalhe:

- hero deve exibir mensagem de indisponibilidade
- seção de rendimento deve explicar que depende da próxima atualização

### 8.4 Frescor e referência

Para BRAPI:

- mostrar timestamp de referência quando houver cotação
- preservar fonte "BRAPI / B3"

### 8.5 Home e Carteira — informação mínima da posição

Para ativos `ACAO` e `FII`, a UI principal deve entregar:

| Superfície | Informação mínima |
|---|---|
| Home | ganho/perda consolidado, % consolidado e frescor das cotações |
| Carteira | nome, ticker, quantidade, valor atual quando disponível e ganho/perda % por linha |
| Detalhe | valor aplicado, valor atual, preço médio simples, referência de compra e rendimento em R$/% |

Se a cotação estiver indisponível:

- a Carteira continua mostrando a linha do ativo
- o usuário precisa ver que o problema é falta de cotação, não saldo zero
- o Detalhe precisa informar isso explicitamente

---

## 9. Fluxo 4 — Detalhe e Aportes

### 9.1 Detalhe de `ACAO` e `FII`

A tela de detalhe continua exibindo:

- nome / ticker / instituição / classe
- valor atual
- gráfico BRAPI
- quantidade
- cotação atual
- valor aplicado
- preço médio simples (`invested / qty`)
- ganho em R$ e %
- aportes

### 9.2 Extensão necessária

O detalhe precisa passar a exibir também:

- chip de lifecycle (`Ativo`, `Em saída`, `Vendido`)
- CTA explícito de saída/venda
- histórico de lifecycle resumido

### 9.3 Aportes continuam válidos

Venda não apaga:

- `asset_contributions`
- `invested`
- gráfico histórico BRAPI

Esses dados continuam relevantes para leitura histórica da posição.

---

## 10. Fluxo 5 — Saída / Venda

### 10.1 Objetivo

Registrar que a posição deixou de existir como patrimônio aberto, sem perder a trilha do ativo.

### 10.2 MVP

O MVP de venda cobre:

- iniciar saída (`redeeming`)
- cancelar saída e voltar para `active`
- concluir venda total (`sold`)

### 10.3 Não cobre

- venda parcial
- múltiplas vendas da mesma posição
- recompra ligada à posição antiga
- cálculo de ganho realizado fiscal

### 10.4 Jornada do usuário

```text
Carteira / Detalhe
  -> Iniciar saída
  -> posição vai para "Em saída"
  -> usuário pode:
       a) voltar para ativo
       b) concluir venda
  -> ao concluir:
       - informa data
       - informa valor bruto de saída
       - posição vira sold
       - deixa de aparecer na carteira padrão
```

### 10.5 Endpoint de iniciar saída

`POST /api/assets/:id/exit/start`

Request:

```ts
{
  startedAt?: string
  note?: string
}
```

Efeito:

- valida ativo do usuário
- aceita apenas `status = 'active'`
- cria evento `redeeming_started`
- atualiza `assets.status = 'redeeming'`

### 10.6 Endpoint de cancelar saída

`POST /api/assets/:id/exit/cancel`

Request:

```ts
{
  canceledAt?: string
  note?: string
}
```

Efeito:

- aceita apenas `status = 'redeeming'`
- cria evento `redeeming_canceled`
- volta `assets.status = 'active'`

### 10.7 Endpoint de concluir venda

`POST /api/assets/:id/sale`

Request:

```ts
{
  soldAt: string
  grossAmount: number
  note?: string
}
```

Resposta:

```ts
{
  sold: true
  assetId: number
  status: 'sold'
  soldAt: string
  grossAmount: number
}
```

Efeito:

- aceita `active` ou `redeeming`
- cria evento `sale_completed`
- move o ativo para `status = 'sold'`
- preserva aportes, invested, qty, ticker e histórico BRAPI

### 10.8 UX de confirmação

Ao concluir venda, a UI deve:

- pedir data da venda
- pedir valor bruto de saída
- confirmar que a posição sairá da carteira ativa

Texto base:

`Concluir venda desta posição? Ela sairá do patrimônio atual, mas o histórico será preservado.`

---

## 11. Modelagem de Dados

### 11.1 Alteração em `assets`

`status` passa a aceitar:

- `active`
- `redeeming`
- `sold`
- `archived`

### 11.2 Nova tabela

`asset_lifecycle_events`

```sql
CREATE TABLE IF NOT EXISTS asset_lifecycle_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id      INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  event_type    TEXT NOT NULL CHECK (
    event_type IN ('redeeming_started', 'redeeming_canceled', 'sale_completed')
  ),
  event_at      TEXT NOT NULL,
  gross_amount  REAL,
  qty_snapshot  REAL,
  note          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_asset_lifecycle_asset
  ON asset_lifecycle_events(asset_id, event_at DESC);

CREATE INDEX IF NOT EXISTS idx_asset_lifecycle_user
  ON asset_lifecycle_events(user_id, event_at DESC);
```

### 11.3 Snapshot da posição no evento de venda

Na venda concluída, registrar:

- `gross_amount`
- `qty_snapshot = assets.qty`

Isso evita perder referência da posição vendida no momento do encerramento.

---

## 12. Contratos de API Impactados

### 12.1 `POST /api/assets`

Mudanças:

- aceitar `FII`
- tratar `FII` como BRAPI

### 12.2 `PUT /api/assets/:id`

Mudanças:

- continua servindo para editar metadados
- não deve concluir venda
- tentativa de `status = 'sold'` via `PUT` deve retornar `422`

### 12.3 `POST /api/import`

Mudanças:

- aceitar `class = 'FII'`
- aceitar `status = 'redeeming'`
- preencher `quote_source = 'BRAPI'`

### 12.4 `GET /api/portfolio`

Mudanças:

- excluir `sold`
- manter `redeeming` separado

### 12.5 `GET /api/assets/:id/detail`

Mudanças:

- aceitar ativos `sold`
- incluir lifecycle resumido
- incluir último evento de venda quando houver

---

## 13. Impacto em Frontend

### Arquivos principais

- `public/index.html`
- `public/app.js`
- `public/style.css`
- `public/template-quanto.xlsx`

### Mudanças obrigatórias

1. separar chip `Ação` de chip `FII`
2. exibir classe correta na Carteira e no Detalhe
3. revisar wizard XLSX para classe e situação
4. adicionar CTA de saída/venda no detalhe
5. adicionar sheet de conclusão de venda
6. revisar textos de `redeeming` para ficar claro que não é venda concluída

---

## 14. Impacto em Backend

### Arquivos principais

- `src/index.ts`
- `schema.sql`
- `migrations/`
- `docs/api-spec.yaml`

### Mudanças obrigatórias

1. adicionar `FII` ao enum e ao schema
2. adicionar `sold` ao lifecycle
3. criar migration de `asset_lifecycle_events`
4. separar endpoints de lifecycle/venda do `PUT` genérico
5. unificar hidratação BRAPI entre cadastro e import
6. ajustar queries de portfolio/alocação para excluir `sold`

---

## 15. Regras de QA

### Casos P0

- cadastrar `ACAO` manualmente com aporte inicial
- cadastrar `FII` manualmente com aporte inicial
- importar XLSX com linhas `ACAO` e `FII`
- importar ativo `redeeming`
- abrir detalhe com cotação disponível
- abrir detalhe com cotação indisponível sem zero falso
- iniciar saída
- cancelar saída
- concluir venda total
- garantir que `sold` some do patrimônio aberto
- garantir que `archived` continue sendo remoção operacional

### Casos P1

- tentar concluir venda via `PUT /api/assets/:id`
- importar linha com classe inválida
- importar linha com situação inválida
- concluir venda com data futura
- concluir venda com valor zero ou negativo

---

## 16. Checklist de Implementação

### Especificação / contrato

- [ ] revisar `docs/api-spec.yaml`
- [ ] alinhar `TEST_PLAN.md`

### Backend

- [ ] adicionar `FII` em enums e validações
- [ ] adicionar `sold` em enums e validações
- [ ] criar migration `asset_lifecycle_events`
- [ ] impedir `status='sold'` por `PUT` genérico
- [ ] implementar `POST /api/assets/:id/exit/start`
- [ ] implementar `POST /api/assets/:id/exit/cancel`
- [ ] implementar `POST /api/assets/:id/sale`
- [ ] ajustar `GET /api/portfolio`
- [ ] ajustar `GET /api/assets/:id/detail`
- [ ] unificar eager fetch BRAPI no import

### Frontend

- [ ] separar classe `Ação` e `FII`
- [ ] revisar labels, badges e agrupamentos
- [ ] revisar wizard XLSX para classe/situação
- [ ] criar sheet de venda
- [ ] ajustar detalhe para lifecycle e venda
- [ ] ajustar mensagens de indisponibilidade de cotação

### QA

- [ ] testes de API
- [ ] testes E2E cadastro manual
- [ ] testes E2E import
- [ ] testes E2E lifecycle e venda

---

## 17. Decisões de Produto

### Decisão 1 — `FII` volta a ser classe própria

Justificativa:

- já existe mentalmente no produto
- já aparece assim em specs passadas
- evita continuar escondendo inconsistência estrutural

### Decisão 2 — venda total primeiro, parcial depois

Justificativa:

- fecha a jornada do usuário com custo controlado
- evita explodir complexidade de qty remanescente e invested residual

### Decisão 3 — `sold` explícito, `archived` preservado para remoção

Justificativa:

- separa evento de negócio de housekeeping técnico
- protege histórico e semântica

### Decisão 4 — import do MVP não cria histórico vendido

Justificativa:

- mantém o Quanto focado em patrimônio atual
- reduz ambiguidade na planilha

### Decisão 5 — compras por lote/data viram trilha própria

Justificativa:

- o usuário explicitou a necessidade de diferenciar compras da mesma ação em datas diferentes
- aportes agregados resolvem o valor aplicado total, mas não resolvem a leitura por compra
- esse requisito muda a modelagem e merece uma spec dedicada, em vez de ficar escondido dentro do pacote atual

---

## 18. Resultado Esperado

Ao final deste pacote, o usuário deve conseguir:

1. cadastrar uma ação ou FII manualmente
2. importar ações/FIIs por planilha com contrato consistente
3. acompanhar a posição com cotação real sem falsos zeros
4. ver detalhe, aportes e rendimento
5. iniciar saída
6. concluir venda sem apagar a trilha do ativo

Esse é o menor recorte que fecha o fluxo de ações ponta a ponta no Quanto sem abrir escopo fiscal ou de recomendação.
