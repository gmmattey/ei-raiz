# SPEC — Compras por lote/data para ações e FIIs

> Status: **done**  
> Aprovado em: 2026-06-17  
> Tasks relacionadas: SPEC-013, INFRA-006, FEAT-030, QA-005  
> Âncoras de implementação: `src/index.ts`, `public/app.js`, `public/index.html`, `migrations/010_asset_contributions_qty.sql`, `tests/api.spec.ts`, `tests/e2e.spec.ts`, `tests/validation.spec.ts`

---

## 1. Objetivo

Fechar a primeira versão útil do fluxo de compras por lote para `ACAO` e `FII` sem introduzir uma nova tabela de posição ainda nesta etapa.

O problema de produto era simples:

- o cadastro manual não guardava `data da compra`
- compras adicionais da mesma ação não carregavam `quantidade`
- o detalhe não explicava cada entrada por data, valor e preço unitário
- o import XLSX não preservava referência temporal da compra

---

## 2. Decisão de modelagem

### 2.1 Ledger de compras

Nesta etapa, o ledger de compras passa a ser o próprio `asset_contributions` para ativos automáticos (`ACAO` e `FII`).

Cada linha de compra passa a carregar:

- `amount`
- `contributed_at`
- `qty`
- `note`

### 2.2 Agregado da posição

A tabela `assets` continua sendo o agregado operacional da posição:

- `qty` = quantidade total atual da posição
- `invested` = capital total aplicado na posição

Ou seja:

- `asset_contributions` representa o histórico de entradas
- `assets` representa o consolidado atual

### 2.3 Escopo desta etapa

Fica explicitamente fora desta entrega:

- venda parcial
- FIFO/LIFO
- preço médio fiscal
- IR
- dividendos/proventos
- eventos corporativos

---

## 3. Contrato funcional

### 3.1 Cadastro manual de ação/FII

O cadastro manual passa a aceitar:

- nome
- ticker
- quantidade inicial
- valor aplicado total
- `data da compra`

Se o usuário informar `invested > 0`, o backend cria automaticamente a primeira linha em `asset_contributions` com:

- `amount = invested`
- `qty = qty`
- `contributed_at = purchase_date || now`

### 3.2 Compra adicional da mesma posição

`POST /api/assets/:id/contributions` passa a exigir `qty` para ativos automáticos BRAPI.

Efeito esperado:

- cria uma nova compra no histórico
- soma `amount` em `assets.invested`
- soma `qty` em `assets.qty`

### 3.3 Import XLSX

O wizard de import passa a aceitar coluna opcional de compra:

- `Data Compra`
- `Data da Compra`
- `Data Aquisição`
- `Data Aquisicao`
- `Compra em`

O import normaliza datas em formato:

- `dd/mm/yyyy`
- `yyyy-mm-dd`
- serial Excel

Datas futuras ou inválidas são rejeitadas.

---

## 4. Regras de visualização

### 4.1 Home e Carteira

Para `ACAO` e `FII`, a carteira passa a exibir:

- quantidade total
- valor aplicado
- referência da compra
- timestamp da cotação BRAPI
- quantidade de compras registradas
- ganho/perda em valor
- ganho/perda em percentual

### 4.2 Detalhe

O detalhe passa a exibir por compra:

- data
- valor
- quantidade
- preço unitário
- observação

Além disso:

- `Compra registrada` quando existe uma única compra
- `Primeira compra` quando existem múltiplas compras

---

## 5. Mudanças técnicas

### 5.1 Banco

Migration aplicada:

- `migrations/010_asset_contributions_qty.sql`

Mudança:

- adiciona `qty REAL` em `asset_contributions`

### 5.2 Backend

Endpoints impactados:

- `POST /api/assets`
- `POST /api/import`
- `POST /api/assets/:id/contributions`
- `GET /api/assets/:id/contributions`
- `DELETE /api/assets/:id/contributions/:cid`
- `GET /api/assets/:id/detail`

### 5.3 Frontend

Superfícies impactadas:

- sheet de adicionar ativo
- wizard de import
- sheet de aporte
- detalhe do ativo

---

## 6. Resultado esperado

Depois desta entrega, o Quanto passa a explicar uma posição de ação/FII com nível mínimo aceitável de rastreabilidade patrimonial:

- quando a posição começou
- quanto foi comprado em cada entrada
- por qual valor cada compra entrou
- qual é a quantidade total atual
- quanto está aplicado
- qual é o preço médio patrimonial da posição

Sem entrar ainda em venda e sem transformar o app em sistema fiscal.
