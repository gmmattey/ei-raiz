# Como configurar a migração AppsScript -> D1

## Objetivo

Explicar como configurar e executar o AppsScript que faz a carga inicial do BigQuery para o Cloudflare D1.

## Estratégia escolhida

A estratégia usada foi:

- AppsScript lendo os dados no BigQuery
- AppsScript chamando diretamente a REST API do D1
- envio em lotes de statements SQL
- uso de `INSERT OR IGNORE` para respeitar a decisão de inserir sem apagar

Isso significa:

- a carga não apaga dados existentes
- se um registro com a mesma chave já existir, ele será ignorado
- isso reduz risco de quebra em reexecução, mas não substitui um merge/upsert futuro

## Onde colar o código

1. abra o projeto AppsScript
2. crie um novo arquivo `.gs`
3. cole o conteúdo de `scripts/appscript/load-bigquery-to-d1.gs`
4. salve o arquivo

## Onde configurar as Script Properties

1. no AppsScript, abra as configurações do projeto
2. procure a área de **Script Properties**
3. crie as chaves listadas em `scripts/appscript/appscript-properties-template.md`
4. preencha os valores corretos

## Configuração mínima recomendada

Preencha pelo menos:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_API_TOKEN`
- `MIGRATION_USER_ID`
- `MIGRATION_PORTFOLIO_ID`
- `MIGRATION_PORTFOLIO_NAME`
- `MIGRATION_DRY_RUN`

## Ordem segura de execução

### 1. Confirmar que o banco D1 já existe

Antes de rodar a carga, o banco D1 já deve estar criado e com o schema principal já executado.

Ordem esperada antes da carga:

1. `01_schema.sql`
2. `02_indexes.sql`
3. `03_compatibility_views.sql`, se aplicável

### 2. Habilitar BigQuery no AppsScript

No projeto AppsScript:

- habilite o **BigQuery Advanced Service**
- confirme que o projeto tem permissão para consultar o BigQuery

### 3. Rodar primeiro em dry-run

Na Script Property:

```text
MIGRATION_DRY_RUN=true
```

Depois execute a função:

```javascript
runInitialBigQueryToD1Load()
```

Nesse modo, o script:

- lê BigQuery
- transforma os dados
- monta a carga
- mostra resumo nos logs
- não envia nada ao D1

### 4. Validar os logs

Confira se os logs mostram:

- quantidade lida de cada tabela de origem
- quantidade de plataformas encontradas
- quantidade de assets encontrados
- quantidade de posições, pré-ordens e aportes preparados
- confirmação de que o dry-run estava ativo

### 5. Executar de verdade

Se o dry-run estiver correto, troque a propriedade para:

```text
MIGRATION_DRY_RUN=false
```

Depois execute novamente:

```javascript
runInitialBigQueryToD1Load()
```

## Como validar se funcionou

### Validação no AppsScript

Veja os logs da execução.
Você deve encontrar:

- início da carga
- resumo das leituras do BigQuery
- resumo dos registros preparados
- confirmação dos lotes enviados ao D1
- mensagem de conclusão

### Validação no D1

Depois da execução, abra o console SQL do D1 e rode consultas simples.

Exemplos:

```sql
SELECT COUNT(*) AS total FROM platforms;
```

```sql
SELECT COUNT(*) AS total FROM assets;
```

```sql
SELECT COUNT(*) AS total FROM portfolio_positions;
```

```sql
SELECT COUNT(*) AS total FROM planned_orders;
```

```sql
SELECT COUNT(*) AS total FROM portfolio_contributions;
```

Se os totais fizerem sentido em relação ao que foi lido no BigQuery, a carga inicial funcionou.

## Erros comuns

### 1. Esquecer de rodar o schema antes

Problema:

o script tenta inserir em tabelas que ainda não existem.

Como evitar:

- execute antes o `01_schema.sql`
- depois o `02_indexes.sql`
- só depois rode a carga

### 2. Token do Cloudflare inválido ou sem permissão

Problema:

a API do D1 responde com erro de autenticação ou autorização.

Como evitar:

- confira o token
- confira se o token tem permissão para operar no D1
- confirme `account_id` e `database_id`

### 3. BigQuery não habilitado no AppsScript

Problema:

o script falha ao tentar consultar as tabelas.

Como evitar:

- habilite o BigQuery Advanced Service
- valide acesso ao projeto e dataset corretos

### 4. Executar com `MIGRATION_DRY_RUN=false` sem testar antes

Problema:

a carga real roda sem validação prévia.

Como evitar:

- faça primeiro uma execução em dry-run
- só depois rode a carga real

### 5. Rodar de novo esperando atualização automática

Problema:

a estratégia atual usa `INSERT OR IGNORE`
- isso evita duplicidade por chave estável
- mas não atualiza registros já existentes

Como evitar:

- trate esta carga como carga inicial
- se precisar atualização real depois, isso deve virar etapa própria com estratégia de merge/upsert

## Função principal para executar

Use esta função:

```javascript
runInitialBigQueryToD1Load()
```

## Resultado esperado

Ao final da execução correta:

- o D1 terá dados iniciais vindos do BigQuery
- as tabelas principais da carga inicial estarão populadas
- o AppsScript terá servido como ponte pragmática de migração
- o processo poderá ser repetido com cuidado, sabendo que a estratégia atual é de inserção sem apagar

