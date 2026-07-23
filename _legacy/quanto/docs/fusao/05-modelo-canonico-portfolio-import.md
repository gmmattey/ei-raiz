# Fusao Quanto + Esquilo — Modelo Canonico de Portfolio e Import

Atualizado em: 2026-06-18  
Escopo: fechar `FUS-009` sem migracao destrutiva

## 1. Objetivo

Definir o modelo canonico que a fusao vai usar para:

- representar uma posicao patrimonial financeira de forma estavel
- separar leitura de portfolio de entrada de importacao
- explicitar onde o runtime atual ja e compativel
- explicitar onde ainda existe gap de paridade

Este modelo nasce em:

- `packages/contracts/` para o contrato vivo
- `packages/domain/portfolio-import.ts` para o modelo alvo e adapters puros

Nao ha mudanca de schema nesta etapa.

## 2. Decisao central

O runtime atual continua persistindo em `assets`, `asset_contributions`, `quotes_cache` e `snapshots`.

O modelo canonico, porem, passa a separar claramente:

1. **identidade do ativo**
2. **modo de avaliacao**
3. **status de lifecycle**
4. **entrada de importacao**
5. **compatibilidade com o runtime atual**

Essa separacao corrige um problema real do estado atual: hoje o runtime mistura, no mesmo shape, coisas que pertencem a camadas diferentes.

## 3. Entidades canonicas

### `CanonicalPortfolioPosition`

Representa a posicao lida da carteira.

Campos conceituais:

- `identity`
- `valuation`
- `performance`
- `timeline`
- `contributionCount`

### `CanonicalImportItem`

Representa uma linha normalizada de importacao antes de decidir por qual endpoint ela sera persistida.

Campos conceituais:

- `identity`
- `status`
- `valuation`

### `CanonicalAssetIdentity`

Separa:

- instituicao
- nome
- classe Quanto
- tipo canonico de portfolio
- provider de mercado
- codigo de mercado

## 4. Tipos canonicos de portfolio

Mapeamento oficial desta fase:

| Classe atual | Tipo canonico |
| --- | --- |
| `ACAO` | `listed_equity` |
| `FII` | `listed_reit` |
| `FUNDO` | `fund` |
| `RF` | `fixed_income` |
| `TESOURO` | `treasury` |
| `PREVIDENCIA` | `private_pension` |
| `POUPANCA` | `cash_reserve` |
| `COFRINHO` | `cash_reserve` |

## 5. Modos canonicos de avaliacao

### `manual_balance`

Usado quando a posicao depende de saldo manual.

Exemplos:

- poupanca
- cofrinho
- fallback manual temporario de fundo CVM

### `market_quote`

Usado quando a posicao depende de cotacao de mercado.

Providers desta fase:

- `BRAPI`
- `CVM`

## 6. Regra oficial de importacao

Nem toda linha canonica cabe no endpoint vivo `POST /api/import`.

### Compativel com batch import vivo

- ativo manual com `manual_balance`
- ativo automatico BRAPI com `ticker + qty`

### Nao compativel com batch import vivo

- fundo CVM com `cnpj` e `initial_balance` ou `qty`

Esses itens **nao sao descartados**. Eles passam a seguir a trilha:

- `CanonicalImportItem`
- adapter para `CreateAssetInput`
- persistencia por `POST /api/assets`

## 7. Gap oficial assumido

O gap reconhecido desta fase e:

- `POST /api/assets` suporta `cvm_cnpj` e `initial_balance`
- `POST /api/import` ainda nao suporta essa mesma capacidade

Por isso o modelo canonico precisa carregar a diferenca de compatibilidade, em vez de esconder essa assimetria.

## 8. Compatibilidade com o runtime atual

`packages/domain/portfolio-import.ts` passa a oferecer:

- `fromPortfolioAssetSummary(...)`
- `toRuntimeCreateAssetInput(...)`
- `toRuntimeImportAssetInput(...)`
- `splitCanonicalImportItemsForRuntime(...)`
- `getRuntimeImportCompatibility(...)`

Esses adapters existem para permitir que:

- `apps/web` evolua antes do cutover
- o import wizard novo trate CVM sem gambiarra local
- a fusao avance sem migrar schema agora

## 9. Regra de coexistencia

Nesta fase:

- o **schema atual nao muda**
- o **runtime atual nao muda de endpoint**
- o **modelo canonico fica acima do runtime**, em `packages/domain`
- os adapters explicam como descer do modelo canonico para o runtime vivo

## 10. O que fica decidido para a proxima fase

Quando a trilha nova de import evoluir:

1. ela deve trabalhar primeiro com `CanonicalImportItem`
2. depois dividir entre:
   - lote compativel com `POST /api/import`
   - itens CVM que exigem `POST /api/assets`
3. so depois vale discutir ampliar o endpoint de importacao vivo

## 11. O que este modelo evita

- sobrecarregar o campo `ticker` como conceito de dominio
- misturar linha de importacao com posicao consolidada
- tratar CVM como excecao informal espalhada pelo frontend
- forcar migracao destrutiva de schema antes da hora
