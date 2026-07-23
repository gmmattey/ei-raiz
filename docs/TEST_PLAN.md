# Quanto — Plano de Testes v1.0

**Data:** 2026-06-13
**Autor:** Pedro (QA Engineer)
**Versao testada:** Spec Funcional v1.3 / Spec Tecnica v4
**Revisado contra:** 98 regras de negocio (RN-01 a RN-98)

> Atualizacao operacional: os exemplos historicos com `X-Dev-Email` pertencem ao fluxo antigo de dev. O runtime atual usa `Authorization: Bearer <jwt>` emitido por `/api/auth/register` ou `/api/auth/login`.
>
> Regra de manutencao: toda implementacao nova ou bug corrigido deve refletir tambem na base/planilha de testes e, quando aplicavel, no XLSX de referencia do projeto.

---

## 1. Resumo

### 1.1 Objetivo

Garantir que o Quanto responde corretamente a pergunta "quanto eu tenho?" para o usuario Luiz, com 19 ativos reais distribuidos em XP, Itau/ION e Onze — a partir do zero, via import XLSX.

### 1.2 Escopo

| Area | Itens | Prioridade |
|------|-------|-----------|
| API (7 endpoints) | API-T01 a API-T28 | P0 |
| Views SQL (4 views) | SQL-T01 a SQL-T04 | P1 |
| Telas (4 telas) | UI-T01 a UI-T16 | P0/P1 |
| Sheets (4 sheets) | SH-T01 a SH-T12 | P0/P1 |
| Import XLSX | IMP-T01 a IMP-T08 | P0 (critico) |
| Cross-cutting | CC-T01 a CC-T08 | P1 |
| PWA | PWA-T01 a PWA-T04 | P2 |

### 1.3 Estrategia

O teste segue a ordem do fluxo real do usuario:

1. Subir ambiente local (`wrangler dev`)
2. Aplicar schema e seed via D1 local
3. Validar todos os 7 endpoints via `curl`
4. Validar views SQL via query direta no banco
5. Executar fluxo de import XLSX no browser (caminho critico — este e o onboarding)
6. Verificar as 4 telas manualmente
7. Verificar as 4 sheets manualmente
8. Executar testes cross-cutting (dark mode, ocultar, localStorage)
9. Verificar comportamento PWA

### 1.4 Ferramentas necessarias

| Ferramenta | Uso | Instalacao |
|-----------|-----|-----------|
| `wrangler dev` | Servidor local na porta 8787 | `npm install -g wrangler` |
| `curl` | Testes de API | Pre-instalado (Linux/Mac) ou Git Bash (Windows) |
| D1 local (wrangler) | Banco SQLite local | Via `wrangler dev --local` |
| Chrome DevTools | Inspecao de rede, localStorage, Service Worker | Embutido no Chrome |
| Chrome (viewport 375px) | Testes mobile | DevTools > Toggle Device Toolbar |
| Planilha XLSX de teste | Import XLSX | Criada conforme secao 2.2 deste plano |

### 1.5 Ambiente local

```bash
# Iniciar wrangler dev com banco local
wrangler dev --local

# Aplicar schema
wrangler d1 execute quanto-db --local --file=schema.sql

# Carregar seed (19 ativos reais)
wrangler d1 execute quanto-db --local --file=seed.sql
```

Header de autenticacao em dev:

```
Authorization: Bearer <jwt>
```

Para obter o JWT rapidamente:

```bash
curl -s -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"giammattey.luiz@gmail.com","password":"SUA_SENHA"}' | jq -r .token
```

---

## 2. Dados de Teste

### 2.1 Os 19 ativos do seed

O arquivo `seed.sql` representa o portfolio real do usuario Luiz e e o conjunto de dados canonico para todos os testes.

**Distribuicao dos ativos:**

| # | Instituicao | Classe | Nome | Modo | Saldo/Qty | Invested | Status |
|---|------------|--------|------|------|-----------|----------|--------|
| 1 | XP | ACAO | CPLE3 · Copel | Auto | 28 cotas | R$ 373,52 | active |
| 2 | XP | ACAO | ITSA4 · Itausa | Auto | 27 cotas | R$ 373,68 | active |
| 3 | XP | ACAO | RANI3 · Irani | Auto | 41 cotas | R$ 373,10 | active |
| 4 | XP | PREVIDENCIA | AZ Quest Luce Icatu Prev PGBL | Manual | R$ 12.362,16 | R$ 10.000,00 | active |
| 5 | XP | FUNDO | Western Asset US Index 500 FIF | Manual | R$ 4.562,77 | R$ 4.150,21 | active |
| 6 | XP | FUNDO | ACE Capital Multicenarios FC FIF | Manual | R$ 1.478,02 | R$ 1.447,64 | active |
| 7 | XP | FUNDO | Trend Ouro FIF Multi RL | Manual | R$ 1.261,60 | R$ 952,87 | active |
| 8 | XP | FUNDO | Selection RF Light FIC FIRF CP LP | Manual | R$ 1.099,50 | R$ 984,64 | **redeeming** |
| 9 | XP | FUNDO | Legacy Capital Compound Advisory | Manual | R$ 1.999,63 | R$ 1.900,00 | **redeeming** |
| 10 | XP | FUNDO | Trend Valor Brasil FIA RL | Manual | R$ 877,10 | R$ 750,00 | **redeeming** |
| 11 | XP | FUNDO | Trend Fixed Income US Target Duration | Manual | R$ 135,09 | R$ 124,33 | **redeeming** |
| 12 | ITAU | ACAO | BRST3 · BrasilAgro | Auto | 200 cotas | R$ 586,15 | active |
| 13 | ITAU | PREVIDENCIA | Itau Kinea Andes Prev RF CP PGBL | Manual | R$ 30.566,46 | — | active |
| 14 | ITAU | COFRINHO | Cofrinhos ION | Manual | R$ 21.867,67 | — | active |
| 15 | ITAU | FUNDO | Itau Kinea Andes RF CP LP | Manual | R$ 2.568,37 | — | active |
| 16 | ITAU | POUPANCA | Poupanca MULTIDATA | Manual | R$ 302,01 | — | active |
| 17 | ONZE | PREVIDENCIA | Schroder Icatu Prev Low Vol Multimercado | Manual | R$ 23.968,24 | R$ 23.968,24 | active |
| 18 | ONZE | PREVIDENCIA | Icatu Seg FIC Empresarial Renda Fixa | Manual | R$ 8.432,36 | R$ 8.432,36 | active |
| 19 | ONZE | PREVIDENCIA | Icatu Vanguarda Pos Fixado RF Prev | Manual | R$ 50.160,95 | R$ 50.160,95 | active |

**Nota especial:** O ativo #19 (Icatu Vanguarda) tem `balance_updated_at = '2026-05-09'`, mais de 30 dias antes de 2026-06-13. Este ativo aparece como **stale** no card de frescor.

### 2.2 Totais esperados (seed carregado)

#### Ativos active manuais (saldo fixo, independe de cotacao)

| Grupo | Saldo Manual |
|-------|-------------|
| XP Previdencia (AZ Quest) | R$ 12.362,16 |
| XP Fundos (Western) | R$ 4.562,77 |
| XP Fundos (ACE) | R$ 1.478,02 |
| XP Fundos (Trend Ouro) | R$ 1.261,60 |
| ITAU Previdencia | R$ 30.566,46 |
| ITAU Cofrinho | R$ 21.867,67 |
| ITAU Fundo | R$ 2.568,37 |
| ITAU Poupanca | R$ 302,01 |
| ONZE Prev (Schroder) | R$ 23.968,24 |
| ONZE Prev (Icatu Seg) | R$ 8.432,36 |
| ONZE Prev (Icatu Vanguarda) | R$ 50.160,95 |
| **Soma manuais ativos** | **R$ 157.530,61** |

#### Ativos auto (dependem de cotacao BRAPI em tempo real)

| Ativo | Ticker | Qtd | Saldo (variavel) |
|-------|--------|-----|-----------------|
| Copel | CPLE3 | 28 | `28 * preco_CPLE3` |
| Itausa | ITSA4 | 27 | `27 * preco_ITSA4` |
| Irani | RANI3 | 41 | `41 * preco_RANI3` |
| BrasilAgro | BRST3 | 200 | `200 * preco_BRST3` |

O total com ativos auto e: **R$ 157.530,61 + (28 x CPLE3) + (27 x ITSA4) + (41 x RANI3) + (200 x BRST3)**

Usando os preco de referencia da spec (CPLE3=14,61, ITSA4=12,88, RANI3=7,95, BRST3=2,93 — apenas para validacao do calculo, nao para comparacao exata em producao):
- CPLE3: 28 x 14,61 = R$ 409,08
- ITSA4: 27 x 12,88 = R$ 347,76
- RANI3: 41 x 7,95 = R$ 325,95
- BRST3: 200 x 2,93 = R$ 586,00
- Soma auto (referencia): R$ 1.668,79

Total de referencia: R$ 157.530,61 + R$ 1.668,79 = **~R$ 159.199,40** (varia conforme cotacao do dia)

#### Ativos redeeming (nao entram no total)

| Ativo | Saldo |
|-------|-------|
| Selection RF Light | R$ 1.099,50 |
| Legacy Capital | R$ 1.999,63 |
| Trend Valor Brasil | R$ 877,10 |
| Trend Fixed Income US | R$ 135,09 |
| **Total redeeming** | **R$ 4.111,32** |

#### Invested (ativos active com invested preenchido)

| Ativo | Invested |
|-------|---------|
| CPLE3 | R$ 373,52 |
| ITSA4 | R$ 373,68 |
| RANI3 | R$ 373,10 |
| AZ Quest | R$ 10.000,00 |
| Western Asset | R$ 4.150,21 |
| ACE Capital | R$ 1.447,64 |
| Trend Ouro | R$ 952,87 |
| BRST3 | R$ 586,15 |
| Schroder | R$ 23.968,24 |
| Icatu Seg | R$ 8.432,36 |
| Icatu Vanguarda | R$ 50.160,95 |
| **Soma invested** | **R$ 100.818,72** |

Ativos ITAU manuais (Kinea, Cofrinhos, Fundo, Poupanca) nao tem invested — contribuem para total mas nao para ganho.

#### Frescor esperado com seed

- Total manuais ativos: 11 (excluindo 4 auto)
- Frescos: 10 (atualizados em 2026-06-12, dentro de 30 dias a partir de 2026-06-13)
- Stale: 1 (Icatu Vanguarda, atualizado em 2026-05-09 = 35 dias atras)
- Instituicao stale: ONZE (2 de 3 em dia)

### 2.3 Planilha XLSX de teste

A planilha de teste deve seguir o template de `/template-quanto.xlsx` com as seguintes abas:

| Aba | Ativos a incluir |
|-----|-----------------|
| Acoes/FIIs | CPLE3 (28 cotas, XP), ITSA4 (27 cotas, XP), RANI3 (41 cotas, XP), BRST3 (200 cotas, ITAU) |
| Fundos | Western Asset (R$ 4.562,77, XP), ACE Capital (R$ 1.478,02, XP), Trend Ouro (R$ 1.261,60, XP), Itau Kinea RF (R$ 2.568,37, ITAU) |
| Previdencia | AZ Quest (R$ 12.362,16, XP), Itau Kinea Andes Prev (R$ 30.566,46, ITAU), Schroder (R$ 23.968,24, ONZE), Icatu Seg (R$ 8.432,36, ONZE), Icatu Vanguarda (R$ 50.160,95, ONZE) |
| Cofrinhos | Cofrinhos ION (R$ 21.867,67, ITAU) |
| Poupanca | Poupanca MULTIDATA (R$ 302,01, ITAU) |

Os 4 ativos em resgate (Selection RF Light, Legacy Capital, Trend Valor Brasil, Trend Fixed Income US) sao incluidos como Fundos e marcados como redeeming apos o import.

---

## 3. Testes de API (P0)

### Convencao dos testes

Todos os testes usam:
- Base URL: `http://localhost:8787`
- Header de autenticacao: `-H "Authorization: Bearer <jwt>"`
- Seed carregado antes de qualquer teste

Observacao operacional:
- Alguns exemplos historicos abaixo ainda mostram `X-Dev-Email`; para o runtime atual, traduza esses exemplos para `Authorization: Bearer <jwt>` obtido via `/api/auth/register` ou `/api/auth/login`.

---

### API-T01 — GET /api/portfolio (sucesso basico)

| Campo | Valor |
|-------|-------|
| **ID** | API-T01 |
| **Descricao** | Portfolio consolidado retorna com estrutura correta apos seed carregado |
| **Prioridade** | P0 |
| **RNs validadas** | RN-01, RN-02, RN-04, RN-05, RN-07, RN-08 |

**Comando:**
```bash
curl -s -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/portfolio | jq .
```

**Resultado esperado:**
- Status HTTP: 200
- `total`: proximo de R$ 159.199,40 (variavel conforme cotacao do dia)
- `invested`: R$ 100.818,72
- `gain`: `total - 100818.72` (nao nulo)
- `gainPct`: `((total / 100818.72) - 1) * 100`
- `freshness.total`: 11 (11 ativos manuais ativos)
- `freshness.ok`: 10
- `freshness.byInstitution` contem entrada para ONZE com `staleAssets` listando Icatu Vanguarda
- `assets` contem 15 itens (status=active)
- `redeeming` contem 4 itens com soma de saldos = R$ 4.111,32
- `byInstitution` tem 3 entradas: XP, ITAU, ONZE
- `byClass` tem entradas para ACAO, FUNDO, PREVIDENCIA, COFRINHO, POUPANCA

---

### API-T02 — GET /api/portfolio (sem autenticacao)

| Campo | Valor |
|-------|-------|
| **ID** | API-T02 |
| **Descricao** | Requisicao sem header de autenticacao retorna 401 |
| **Prioridade** | P0 |
| **RNs validadas** | RN-66, RN-72 |

**Comando:**
```bash
curl -s -w "\n%{http_code}" http://localhost:8787/api/portfolio
```

**Resultado esperado:**
- Status HTTP: 401
- Body: `{"error": "Missing auth header"}` (ou similar)

---

### API-T03 — GET /api/portfolio (usuario sem ativos)

| Campo | Valor |
|-------|-------|
| **ID** | API-T03 |
| **Descricao** | Portfolio vazio retorna zeros e listas vazias |
| **Prioridade** | P1 |
| **RNs validadas** | RN-01, RN-07 |

**Comando:**
```bash
curl -s -H "X-Dev-Email: usuario-novo@exemplo.com" \
  http://localhost:8787/api/portfolio | jq .
```

**Resultado esperado:**
- Status HTTP: 200
- `total`: 0
- `invested`: 0
- `gain`: null ou 0
- `gainPct`: null
- `assets`: `[]`
- `redeeming`: `[]`
- `byInstitution`: `[]`
- `byClass`: `[]`
- `freshness.total`: 0
- `freshness.ok`: 0

---

### API-T04 — POST /api/assets (ativo automatico)

| Campo | Valor |
|-------|-------|
| **ID** | API-T04 |
| **Descricao** | Criar ativo automatico com ticker valido |
| **Prioridade** | P0 |
| **RNs validadas** | RN-23, RN-24, RN-25, RN-26, RN-27 |

**Comando:**
```bash
curl -s -X POST \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"institution":"XP","class":"ACAO","name":"PETR4 · Petrobras","ticker":"PETR4","qty":100,"invested":3500.00}' \
  http://localhost:8787/api/assets | jq .
```

**Resultado esperado:**
- Status HTTP: 201
- Body contem: `id` (inteiro), `institution: "XP"`, `class: "ACAO"`, `ticker: "PETR4"`, `qty: 100`, `status: "active"`, `created_at` (timestamp)
- `balance_updated_at`: null (ativo auto nao tem)
- `manual_balance`: null

---

### API-T05 — POST /api/assets (ativo manual)

| Campo | Valor |
|-------|-------|
| **ID** | API-T05 |
| **Descricao** | Criar ativo manual com saldo inicial |
| **Prioridade** | P0 |
| **RNs validadas** | RN-05, RN-23, RN-26 |

**Comando:**
```bash
curl -s -X POST \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"institution":"ITAU","class":"POUPANCA","name":"Poupanca Teste","manual_balance":1500.00,"invested":1500.00}' \
  http://localhost:8787/api/assets | jq .
```

**Resultado esperado:**
- Status HTTP: 201
- `manual_balance`: 1500.00
- `ticker`: null
- `qty`: null
- `status`: "active"
- `balance_updated_at`: timestamp recente (preenchido automaticamente — RN-23)

---

### API-T06 — POST /api/assets (instituicao OUTROS)

| Campo | Valor |
|-------|-------|
| **ID** | API-T06 |
| **Descricao** | Criar ativo com instituicao OUTROS e institution_name |
| **Prioridade** | P1 |
| **RNs validadas** | RN-79 |

**Comando:**
```bash
curl -s -X POST \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"institution":"OUTROS","institution_name":"Nubank","class":"POUPANCA","name":"Poupanca Nubank","manual_balance":2000.00}' \
  http://localhost:8787/api/assets | jq .
```

**Resultado esperado:**
- Status HTTP: 201
- `institution`: "OUTROS"
- `institution_name`: "Nubank"

---

### API-T07 — POST /api/assets (campos obrigatorios ausentes)

| Campo | Valor |
|-------|-------|
| **ID** | API-T07 |
| **Descricao** | Criar ativo sem institution retorna 400 |
| **Prioridade** | P0 |
| **RNs validadas** | Validacao de schema |

**Comando:**
```bash
curl -s -X POST \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"class":"ACAO","name":"Sem Instituicao","ticker":"TEST4","qty":10}' \
  http://localhost:8787/api/assets | jq .
```

**Resultado esperado:**
- Status HTTP: 400
- Body contem campo `error`
- Body menciona `institution` como campo invalido ou ausente

---

### API-T08 — POST /api/assets (institution fora do enum)

| Campo | Valor |
|-------|-------|
| **ID** | API-T08 |
| **Descricao** | Institution com valor invalido retorna 400 |
| **Prioridade** | P0 |
| **RNs validadas** | Schema de banco (CHECK constraint) |

**Comando:**
```bash
curl -s -X POST \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"institution":"NUBANK","class":"POUPANCA","name":"Teste","manual_balance":100}' \
  http://localhost:8787/api/assets | jq .
```

**Resultado esperado:**
- Status HTTP: 400
- Body contem `error`

---

### API-T09 — POST /api/assets (ticker sem qty)

| Campo | Valor |
|-------|-------|
| **ID** | API-T09 |
| **Descricao** | Ticker presente sem qty retorna 400 |
| **Prioridade** | P0 |
| **RNs validadas** | RN-24 |

**Comando:**
```bash
curl -s -X POST \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"institution":"XP","class":"ACAO","name":"Sem Qtd","ticker":"VALE3"}' \
  http://localhost:8787/api/assets | jq .
```

**Resultado esperado:**
- Status HTTP: 400
- Body menciona que `qty` e obrigatorio quando `ticker` esta presente

---

### API-T10 — PUT /api/assets/:id (atualizar saldo manual)

| Campo | Valor |
|-------|-------|
| **ID** | API-T10 |
| **Descricao** | Atualizar saldo manual de ativo existente (Sheet A) |
| **Prioridade** | P0 |
| **RNs validadas** | RN-33, RN-34 |

**Pre-condicao:** Seed carregado. Ativo ID 4 = AZ Quest (manual_balance: 12362.16).

**Comando:**
```bash
curl -s -X PUT \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"manual_balance": 13000.00}' \
  http://localhost:8787/api/assets/4 | jq .
```

**Resultado esperado:**
- Status HTTP: 200
- `manual_balance`: 13000.00
- `balance_updated_at`: timestamp atualizado para now() (RN-33)
- Demais campos inalterados

---

### API-T11 — PUT /api/assets/:id (editar campos completos)

| Campo | Valor |
|-------|-------|
| **ID** | API-T11 |
| **Descricao** | Editar multiplos campos de um ativo (Sheet B) |
| **Prioridade** | P0 |
| **RNs validadas** | RN-28, RN-30 |

**Comando:**
```bash
curl -s -X PUT \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"name":"AZ Quest Atualizado","invested":11000.00,"status":"redeeming"}' \
  http://localhost:8787/api/assets/4 | jq .
```

**Resultado esperado:**
- Status HTTP: 200
- `name`: "AZ Quest Atualizado"
- `invested`: 11000.00
- `status`: "redeeming"
- Campos nao enviados permanecem inalterados (dynamic SET builder)

---

### API-T12 — PUT /api/assets/:id (ID inexistente)

| Campo | Valor |
|-------|-------|
| **ID** | API-T12 |
| **Descricao** | Atualizar ativo com ID que nao existe retorna 404 |
| **Prioridade** | P0 |
| **RNs validadas** | Isolamento por user_id |

**Comando:**
```bash
curl -s -X PUT \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"manual_balance": 1000}' \
  http://localhost:8787/api/assets/99999 | jq .
```

**Resultado esperado:**
- Status HTTP: 404
- Body: `{"error": "Asset not found"}`

---

### API-T13 — PUT /api/assets/:id (isolamento multi-user)

| Campo | Valor |
|-------|-------|
| **ID** | API-T13 |
| **Descricao** | Usuario B nao consegue editar ativo do Usuario A |
| **Prioridade** | P0 |
| **RNs validadas** | RN-70 |

**Pre-condicao:** Seed carregado com user_id=1. O ID do ativo 4 pertence a giammattey.luiz@gmail.com.

**Comando:**
```bash
curl -s -X PUT \
  -H "X-Dev-Email: outro.usuario@exemplo.com" \
  -H "Content-Type: application/json" \
  -d '{"manual_balance": 0}' \
  http://localhost:8787/api/assets/4 | jq .
```

**Resultado esperado:**
- Status HTTP: 404 (ou 403)
- O ativo de outro usuario nao e visivel — resposta de "nao encontrado" protege privacidade

---

### API-T14 — DELETE /api/assets/:id (soft delete)

| Campo | Valor |
|-------|-------|
| **ID** | API-T14 |
| **Descricao** | Remover ativo muda status para archived (soft delete) |
| **Prioridade** | P0 |
| **RNs validadas** | RN-36, RN-37, RN-38 |

**Comando:**
```bash
# Deletar ativo (ex: id=7, Trend Ouro)
curl -s -X DELETE \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/assets/7 | jq .

# Verificar que nao aparece mais no portfolio
curl -s -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/portfolio | jq '.assets | map(.name)'
```

**Resultado esperado:**
- DELETE retorna: `{"archived": true}` com status 200
- GET /api/portfolio: "Trend Ouro FIF Multi RL" nao aparece em `assets` nem em `redeeming`
- Banco D1: registro existe com `status = 'archived'` (verificar via wrangler d1 execute)

---

### API-T15 — DELETE /api/assets/:id (ID inexistente)

| Campo | Valor |
|-------|-------|
| **ID** | API-T15 |
| **Descricao** | Deletar ativo inexistente retorna 404 |
| **Prioridade** | P0 |
| **RNs validadas** | RN-36 |

**Comando:**
```bash
curl -s -X DELETE \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/assets/99999 | jq .
```

**Resultado esperado:**
- Status HTTP: 404
- Body: `{"error": "Asset not found"}`

---

### API-T16 — GET /api/history (sem snapshots)

| Campo | Valor |
|-------|-------|
| **ID** | API-T16 |
| **Descricao** | Historico retorna lista vazia antes do primeiro snapshot |
| **Prioridade** | P1 |
| **RNs validadas** | RN-44 |

**Comando:**
```bash
curl -s -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/history | jq .
```

**Resultado esperado (antes de POST /api/snapshot):**
- Status HTTP: 200
- Body: `[]`

---

### API-T17 — POST /api/snapshot (criar snapshot)

| Campo | Valor |
|-------|-------|
| **ID** | API-T17 |
| **Descricao** | Criar snapshot do mes corrente com seed carregado |
| **Prioridade** | P1 |
| **RNs validadas** | RN-41, RN-42, RN-43, RN-45, RN-82 |

**Comando:**
```bash
curl -s -X POST \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/snapshot | jq .
```

**Resultado esperado:**
- Status HTTP: 200
- `month`: "2026-06" (mes corrente)
- `total`: valor proximo ao total do portfolio (soma ativos active)
- `invested`: R$ 100.818,72
- `created`: true (primeira vez neste mes)

---

### API-T18 — POST /api/snapshot (idempotencia)

| Campo | Valor |
|-------|-------|
| **ID** | API-T18 |
| **Descricao** | Segundo POST /snapshot no mesmo mes faz update, nao duplica |
| **Prioridade** | P1 |
| **RNs validadas** | RN-43 |

**Comando:**
```bash
# Segundo snapshot no mesmo mes
curl -s -X POST \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/snapshot | jq .
```

**Resultado esperado:**
- Status HTTP: 200
- `created`: false (ja existia, fez update)
- `month`: "2026-06"

---

### API-T19 — GET /api/history (apos snapshot)

| Campo | Valor |
|-------|-------|
| **ID** | API-T19 |
| **Descricao** | Historico retorna snapshot criado com campos corretos |
| **Prioridade** | P1 |
| **RNs validadas** | RN-44, RN-45 |

**Comando:**
```bash
curl -s -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/history | jq .
```

**Resultado esperado:**
- Status HTTP: 200
- Array com 1 item
- Item tem: `month: "2026-06"`, `total` (positivo), `invested: 100818.72`, `gain` = total - invested, `gainPct` calculado corretamente

---

### API-T20 — POST /api/import (importacao em lote)

| Campo | Valor |
|-------|-------|
| **ID** | API-T20 |
| **Descricao** | Importar lote de 3 ativos via JSON retorna 201 com contagem correta |
| **Prioridade** | P0 |
| **RNs validadas** | RN-47, RN-51, RN-52 |

**Comando:**
```bash
curl -s -X POST \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"institution":"XP","class":"ACAO","name":"CPLE3 · Copel","ticker":"CPLE3","qty":28,"invested":373.52},
      {"institution":"ONZE","class":"PREVIDENCIA","name":"Schroder Icatu Prev Low Vol","manual_balance":23968.24,"invested":23968.24},
      {"institution":"ITAU","class":"POUPANCA","name":"Poupanca MULTIDATA","manual_balance":302.01}
    ]
  }' \
  http://localhost:8787/api/import | jq .
```

**Resultado esperado:**
- Status HTTP: 201
- `created`: 3
- `assets`: array com 3 itens, cada um com `id` atribuido
- Ativos manuais tem `balance_updated_at` preenchido automaticamente (RN-51)
- `status`: "active" em todos (RN-51)

---

### API-T21 — POST /api/import (lista vazia)

| Campo | Valor |
|-------|-------|
| **ID** | API-T21 |
| **Descricao** | Import com items vazio retorna 400 |
| **Prioridade** | P0 |
| **RNs validadas** | Schema ImportRequest (minItems: 1) |

**Comando:**
```bash
curl -s -X POST \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"items": []}' \
  http://localhost:8787/api/import | jq .
```

**Resultado esperado:**
- Status HTTP: 400
- Body contem `error`

---

### API-T22 — POST /api/import (ativo invalido na lista)

| Campo | Valor |
|-------|-------|
| **ID** | API-T22 |
| **Descricao** | Import com ativo sem class retorna 400 |
| **Prioridade** | P0 |
| **RNs validadas** | Validacao de schema |

**Comando:**
```bash
curl -s -X POST \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"institution":"XP","name":"Sem Classe","manual_balance":100}]}' \
  http://localhost:8787/api/import | jq .
```

**Resultado esperado:**
- Status HTTP: 400

---

### API-T23 — GET /api/portfolio (cache de cotacoes)

| Campo | Valor |
|-------|-------|
| **ID** | API-T23 |
| **Descricao** | Campo quotesFetchedAt reflete o timestamp mais recente do cache |
| **Prioridade** | P1 |
| **RNs validadas** | RN-09, RN-14 |

**Comando:**
```bash
# Primeira chamada — dispara refresh BRAPI
curl -s -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/portfolio | jq '.quotesFetchedAt'

# Segunda chamada imediata — usa cache (deve ser mesmo timestamp)
curl -s -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/portfolio | jq '.quotesFetchedAt'
```

**Resultado esperado:**
- Primeiro retorno: timestamp ISO recente
- Segundo retorno dentro de 15 min: mesmo timestamp (cache hit, nao chama BRAPI novamente)

---

### API-T24 — GET /api/portfolio (isolamento de dados multi-user)

| Campo | Valor |
|-------|-------|
| **ID** | API-T24 |
| **Descricao** | Usuario B nao ve ativos do Usuario A |
| **Prioridade** | P0 |
| **RNs validadas** | RN-70, RN-71 |

**Comando:**
```bash
# Usuario A com dados (seed)
curl -s -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/portfolio | jq '.total'

# Usuario B sem dados
curl -s -H "X-Dev-Email: outro.usuario@exemplo.com" \
  http://localhost:8787/api/portfolio | jq '.total'
```

**Resultado esperado:**
- Usuario A: total > 0, assets nao vazio
- Usuario B: total = 0, assets = []

---

### API-T25 — GET /api/portfolio (frescor stale)

| Campo | Valor |
|-------|-------|
| **ID** | API-T25 |
| **Descricao** | Ativo com balance_updated_at > 30 dias aparece em staleAssets |
| **Prioridade** | P0 |
| **RNs validadas** | RN-15, RN-17, RN-18, RN-20 |

**Pre-condicao:** Seed carregado. Ativo #19 (Icatu Vanguarda) tem `balance_updated_at = '2026-05-09'`.

**Comando:**
```bash
curl -s -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  http://localhost:8787/api/portfolio | jq '.freshness'
```

**Resultado esperado:**
- `freshness.total`: 11
- `freshness.ok`: 10
- `freshness.byInstitution` contem ONZE com `staleAssets[0].name`: "Icatu Vanguarda Pos Fixado RF Prev"
- `staleAssets[0].daysAgo`: >= 31 (calculado como dias desde 2026-05-09)

---

### API-T26 — PUT /api/assets/:id (mudar auto para manual)

| Campo | Valor |
|-------|-------|
| **ID** | API-T26 |
| **Descricao** | Remover ticker de ativo auto converte para manual |
| **Prioridade** | P1 |
| **RNs validadas** | RN-28, RN-29 |

**Comando:**
```bash
curl -s -X PUT \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"ticker": null, "manual_balance": 500.00}' \
  http://localhost:8787/api/assets/1 | jq .
```

**Resultado esperado:**
- Status HTTP: 200
- `ticker`: null
- `qty`: null (ou mantido, dependendo da implementacao)
- `manual_balance`: 500.00
- `balance_updated_at`: preenchido automaticamente

---

### API-T27 — DELETE (verificar historico intacto)

| Campo | Valor |
|-------|-------|
| **ID** | API-T27 |
| **Descricao** | Apos soft delete, snapshot anterior nao e alterado |
| **Prioridade** | P1 |
| **RNs validadas** | RN-38 |

**Passos:**
1. Criar snapshot: `POST /api/snapshot`
2. Anotar o `total` retornado
3. Deletar ativo ativo: `DELETE /api/assets/4`
4. Criar novo snapshot: `POST /api/snapshot`
5. Verificar historico: `GET /api/history`

**Resultado esperado:**
- `GET /api/history` retorna 2 snapshots com `month = "2026-06"` (apenas 1, pois upsert) OU confirma que o total anterior foi preservado

**Nota:** Como a tabela tem `UNIQUE(user_id, month)`, o segundo snapshot sobreescreve. Testar em meses diferentes ou verificar via wrangler d1 execute que o soft delete nao afeta snapshots passados de outros meses.

---

### API-T28 — PUT /api/assets/:id (status redeeming para active)

| Campo | Valor |
|-------|-------|
| **ID** | API-T28 |
| **Descricao** | Ativo em resgate pode voltar para active |
| **Prioridade** | P1 |
| **RNs validadas** | RN-31 |

**Comando:**
```bash
# ID 8 = Selection RF Light (status: redeeming no seed)
curl -s -X PUT \
  -H "X-Dev-Email: giammattey.luiz@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}' \
  http://localhost:8787/api/assets/8 | jq .
```

**Resultado esperado:**
- Status HTTP: 200
- `status`: "active"
- GET /api/portfolio: ativo aparece em `assets` (nao em `redeeming`), total aumenta

---

## 4. Testes de Views SQL (P1)

### Pre-condicao

Seed carregado. Executar queries diretamente no banco D1 local:

```bash
wrangler d1 execute quanto-db --local --command="SELECT * FROM vw_portfolio_summary WHERE user_id = 1"
```

---

### SQL-T01 — vw_portfolio_summary

| Campo | Valor |
|-------|-------|
| **ID** | SQL-T01 |
| **Descricao** | View retorna totais corretos para user_id=1 com seed |
| **Prioridade** | P1 |
| **RNs validadas** | RN-01, RN-04, RN-05, RN-07, RN-08 |

**Query:**
```sql
SELECT * FROM vw_portfolio_summary WHERE user_id = 1;
```

**Resultado esperado:**
- `asset_count`: 15 (apenas active, excluindo 4 redeeming)
- `total_invested`: 100818.72 (soma dos invested dos active)
- `total_balance`: aproximadamente 159.199,40 (manuais: 157530.61 + auto dependem de cotacao)
- `gain`: `total_balance - 100818.72`

**Verificacao manual parcial (apenas manuais):**
```sql
SELECT SUM(manual_balance) FROM assets
WHERE user_id = 1 AND status = 'active' AND ticker IS NULL;
-- Esperado: 157530.61
```

---

### SQL-T02 — vw_allocation_by_institution

| Campo | Valor |
|-------|-------|
| **ID** | SQL-T02 |
| **Descricao** | Alocacao por instituicao agrupa corretamente ativos ativos |
| **Prioridade** | P1 |
| **RNs validadas** | RN-79, RN-94 |

**Query:**
```sql
SELECT institution, institution_name, display_name, asset_count, total_balance
FROM vw_allocation_by_institution
WHERE user_id = 1
ORDER BY total_balance DESC;
```

**Resultado esperado:**
- 3 linhas: ONZE (maior), ITAU (segundo), XP (terceiro)
- ONZE: `total_balance` = R$ 82.561,55 (23968.24 + 8432.36 + 50160.95)
- ITAU: `total_balance` = R$ 55.304,51 (30566.46 + 21867.67 + 2568.37 + 302.01 + auto BRST3)
- XP: varia conforme cotacoes CPLE3, ITSA4, RANI3

**Verificacao ONZE (fixo):**
```sql
SELECT SUM(manual_balance) FROM assets
WHERE user_id = 1 AND institution = 'ONZE' AND status = 'active';
-- Esperado: 82561.55
```

---

### SQL-T03 — vw_allocation_by_class

| Campo | Valor |
|-------|-------|
| **ID** | SQL-T03 |
| **Descricao** | Alocacao por classe lista todas as classes presentes |
| **Prioridade** | P1 |
| **RNs validadas** | RN-94 |

**Query:**
```sql
SELECT class, asset_count, total_balance
FROM vw_allocation_by_class
WHERE user_id = 1
ORDER BY total_balance DESC;
```

**Resultado esperado:**
- Classes presentes: PREVIDENCIA, COFRINHO, FUNDO, ACAO, POUPANCA
- PREVIDENCIA: R$ 127.290,13 (12362.16 + 30566.46 + 23968.24 + 8432.36 + 50160.95 + ... AZ Quest)

**Verificacao PREVIDENCIA (fixo):**
```sql
SELECT SUM(manual_balance) FROM assets
WHERE user_id = 1 AND class = 'PREVIDENCIA' AND status = 'active' AND ticker IS NULL;
-- Esperado: 12362.16 + 30566.46 + 23968.24 + 8432.36 + 50160.95 = 125490.17
```

---

### SQL-T04 — vw_freshness

| Campo | Valor |
|-------|-------|
| **ID** | SQL-T04 |
| **Descricao** | View de frescor identifica corretamente o ativo stale do ONZE |
| **Prioridade** | P0 |
| **RNs validadas** | RN-15, RN-16, RN-17, RN-18, RN-20, RN-22 |

**Query:**
```sql
SELECT institution, display_name, total_manual, fresh_count, stale_count,
       oldest_stale_name, oldest_stale_days
FROM vw_freshness
WHERE user_id = 1;
```

**Resultado esperado:**

| institution | total_manual | fresh_count | stale_count | oldest_stale_name | oldest_stale_days |
|------------|-------------|-------------|------------|-------------------|------------------|
| XP | 4 | 4 | 0 | null | null |
| ITAU | 4 | 4 | 0 | null | null |
| ONZE | 3 | 2 | 1 | Icatu Vanguarda Pos Fixado RF Prev | >= 35 |

**Verificacao:**
```sql
SELECT julianday('now') - julianday('2026-05-09') AS dias_stale;
-- Deve ser >= 35 em 2026-06-13
```

---

## 5. Testes de Frontend — Telas (P0/P1)

### Pre-condicao

Seed carregado. `wrangler dev --local` rodando. Acessar `http://localhost:8787` no Chrome com DevTools abertos (viewport 375px para simular mobile).

---

### UI-T01 — Tela Hoje: numero-tese visivel e correto

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T01 | Total do patrimonio exibe valor correto com hierarquia tipografica | 1. Abrir app na tela Hoje. 2. Verificar numero principal. | Total maior que R$ 157.530 (parte fixa dos manuais). Parte inteira em fonte grande (44px Archivo 700). Centavos visivelmente menores. Prefixo "R$" presente. | P0 |

---

### UI-T02 — Tela Hoje: ganho e percentual

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T02 | Ganho absoluto e percentual exibidos corretamente | 1. Verificar linha abaixo do numero-tese. | Ganho em verde com sinal "+". Percentual entre parenteses na mesma linha. Formato: "+ R$ XX.XXX,XX (XX,X%) sobre o aplicado". | P0 |

---

### UI-T03 — Tela Hoje: nota de resgate

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T03 | Ativos em resgate exibidos com nota "nao contabilizado" | 1. Verificar area abaixo do ganho na tela Hoje. | Texto "+ R$ 4.111,32 em resgate (nao contabilizado)" visivel. Valor nao integra o numero-tese. | P0 |

---

### UI-T04 — Tela Hoje: card de frescor

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T04 | Card de frescor mostra 10 de 11 manuais em dia e alerta ONZE | 1. Verificar card "Saldos manuais" na tela Hoje. | "10 de 11 em dia". Barra de progresso proporcional. Alerta ambar para ONZE: "Icatu Vanguarda ha 35 dias" (ou numero de dias desde 2026-05-09). | P0 |

---

### UI-T05 — Tela Hoje: donut chart

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T05 | Donut chart SVG renderiza com fatias proporcionais e total no centro | 1. Verificar grafico donut na tela Hoje. 2. Tocar em fatia ONZE. 3. Alternar toggle "Por classe". | Toggle "Por instituicao/Por classe" visivel. Donut SVG com 3 fatias (XP, ITAU, ONZE) no modo instituicao. Centro exibe total do patrimonio. Toque exibe tooltip com nome, valor e %. Alternando para "Por classe" muda fatias. Legenda abaixo com bolinha + nome + valor. | P1 |

---

### UI-T06 — Tela Hoje: info de cotacoes

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T06 | Timestamp de cotacoes exibido corretamente | 1. Verificar rodape ou area inferior da tela Hoje. | Texto "cotacoes ha X min" visivel. Ausente se BRAPI nao retornou (modo local sem internet). | P1 |

---

### UI-T07 — Tela Carteira: agrupamento por instituicao com sub-classes

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T07 | Carteira agrupa por instituicao com sub-grupos de classe | 1. Navegar para aba Carteira. 2. Confirmar modo padrao "Por instituicao". | 3 grupos: XP, ITAU, ONZE. Dentro de XP: sub-grupos "Acoes" e "Previdencia" e "Fundos". Ativos com badge AUTO (azul petro) ou MANUAL. Saldo a direita em cada linha. Total do grupo no header. | P0 |

---

### UI-T08 — Tela Carteira: alternancia para modo "Por classe"

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T08 | Toggle alterna agrupamento e persiste em localStorage | 1. Tocar toggle "Por classe" na Carteira. 2. Recarregar pagina (F5). 3. Verificar agrupamento. | Apos toggle: ativos agrupados por classe (Acoes, Fundos, Previdencia, Cofrinho, Poupanca). Cada ativo mostra instituicao como badge. Apos reload: modo "Por classe" persiste (localStorage). | P1 |

---

### UI-T09 — Tela Carteira: filtros por chip

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T09 | Chips de filtro filtram lista e recalculam totais | 1. Tocar chip "ONZE". 2. Verificar lista e total do header. 3. Tocar "Todos". | Apos "ONZE": apenas 3 ativos visiveis, total do header = R$ 82.561,55. Grupo "Em resgate" ainda visivel (sempre visivel — RN-92). Apos "Todos": lista completa restaurada. | P0 |

---

### UI-T10 — Tela Carteira: grupo "Em resgate" sempre visivel

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T10 | Ativos em resgate aparecem ao final, independente do filtro | 1. Tocar chip "XP". 2. Rolar ate o final da lista. | Grupo "Em resgate" exibido ao final com 4 ativos (todos da XP, mas aparecem mesmo com filtro ativo). Badge "EM RESGATE" vermelho em cada linha. | P0 |

---

### UI-T11 — Tela Carteira: barra de distribuicao

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T11 | Barra horizontal empilhada exibida acima da lista | 1. Verificar barra compacta entre filtros e lista de ativos. | Barra de 8px de altura com 3 segmentos (XP, ITAU, ONZE) em modo instituicao. Proporcional ao saldo de cada grupo. Sem labels — apenas cores. | P1 |

---

### UI-T12 — Tela Historico: estado com 1 snapshot

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T12 | Historico exibe ponto unico apos primeiro snapshot | 1. Executar `POST /api/snapshot`. 2. Navegar para tela Historico. | Grafico SVG com 1 ponto (sem linha). Lista com 1 linha sem rendimento (primeiro mes sem referencia anterior). Nota "Foto automatica todo dia 1" visivel. | P1 |

---

### UI-T13 — Tela Historico: estado vazio

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T13 | Historico vazio exibe mensagem contextual | 1. Antes de criar snapshot, navegar para Historico. | Mensagem "O historico comeca apos o primeiro mes. Foto automatica todo dia 1." Grafico oculto. Lista oculta. | P1 |

---

### UI-T14 — Tela Importar: wizard etapa 1

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T14 | Tela Importar exibe dropzone funcional e link do template | 1. Navegar para aba Importar. | Indicador de progresso com 3 etapas. Dropzone com icone de upload, texto e hint ".xlsx e .xls". Link "Baixar template modelo" funcional. Botao "Processar" oculto ate arquivo ser selecionado. | P0 |

---

### UI-T15 — Tela Hoje: estado vazio (usuario novo)

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T15 | Tela Hoje sem ativos mostra R$ 0,00 e instrucao | 1. Acessar app com email novo sem ativos. | Numero-tese: "R$ 0,00". Sem card de ganho. Sem card de frescor. Sem donut. Mensagem "Adicione ativos na aba Carteira para comecar". | P1 |

---

### UI-T16 — Tela Carteira: estado vazio

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| UI-T16 | Carteira sem ativos exibe ilustracao e botao de adicionar | 1. Acessar Carteira com email novo sem ativos. | "Adicione seu primeiro ativo" + botao "Adicionar" que abre Sheet C. | P1 |

---

## 6. Testes de Frontend — Sheets (P0/P1)

### SH-T01 — Sheet A: abertura via toque em ativo manual

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T01 | Tocar em ativo manual abre Sheet A | 1. Na Carteira, tocar em "AZ Quest Luce Icatu Prev PGBL" (manual). | Sheet A desliza de baixo. Exibe nome do ativo, ultimo saldo (R$ 12.362,16), data da ultima atualizacao (12/06/2026), input numerico vazio com prefixo "R$". Botao "Salvar saldo" desabilitado ate digitar. | P0 |

---

### SH-T02 — Sheet A: atualizar saldo e verificar frescor

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T02 | Salvar novo saldo na Sheet A atualiza frescor | 1. Abrir Sheet A de ativo manual. 2. Digitar 13000. 3. Tocar "Salvar saldo". | Toast "Saldo salvo" aparece. Sheet fecha. Carteira: ativo mostra R$ 13.000,00. Frescor do ativo: "ha 0 dias" (atualizado agora). API: GET /api/portfolio retorna balance_updated_at recente para o ativo. | P0 |

---

### SH-T03 — Sheet A: nao abre para ativo automatico

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T03 | Tocar em ativo AUTO nao abre Sheet A | 1. Na Carteira, tocar em "CPLE3 · Copel" (badge AUTO). | Nenhuma sheet abre. Ativo auto nao tem saldo editavel. (RN-32: Sheet A disponivel apenas para manuais) | P0 |

---

### SH-T04 — Sheet B: abertura via botao tres pontos

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T04 | Tocar "..." abre Sheet B com campos pre-preenchidos | 1. Na Carteira, tocar "..." em "CPLE3 · Copel". | Sheet B abre. Nome pre-preenchido. Chips de instituicao com XP selecionado. Chips de classe com ACAO selecionado. Campos Ticker e Quantidade visiveis com valores pre-preenchidos. Campo Saldo Atual oculto (ativo auto). | P0 |

---

### SH-T05 — Sheet B: editar campos e salvar

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T05 | Editar nome e valor aplicado via Sheet B | 1. Abrir Sheet B de CPLE3. 2. Alterar nome para "CPLE3 · Copel (editado)". 3. Alterar Valor Aplicado para 400. 4. Tocar "Salvar alteracoes". | Toast "Alteracoes salvas". Sheet fecha. Carteira mostra nome atualizado. API: PUT /api/assets/:id retorna nome e invested atualizados. | P0 |

---

### SH-T06 — Sheet B: marcar como em resgate

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T06 | Alterar status para em resgate via Sheet B | 1. Abrir Sheet B de ativo active (ex: AZ Quest). 2. Alterar status para "Em resgate". 3. Salvar. | Ativo move para grupo "Em resgate" na Carteira imediatamente. Total da Hoje diminui. Nota de resgate atualiza na tela Hoje. | P0 |

---

### SH-T07 — Sheet B: remover ativo com confirmacao

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T07 | Remocao exige confirmacao inline e executa soft delete | 1. Abrir Sheet B. 2. Tocar "Remover ativo". 3. Verificar confirmacao. 4. Tocar "Remover" na confirmacao. | Confirmacao inline: "Remover? Historico nao e afetado." com botoes "Cancelar" e "Remover". Apos confirmar: toast "Ativo removido". Sheet fecha. Ativo some da Carteira. GET /api/portfolio nao retorna o ativo. | P0 |

---

### SH-T08 — Sheet C: cadastro de ativo manual

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T08 | FAB abre Sheet C e cria ativo manual corretamente | 1. Tocar FAB (+) na Carteira. 2. Selecionar instituicao XP. 3. Selecionar classe FUNDO. 4. Toggle Manual (pre-selecionado). 5. Preencher nome, saldo R$ 2.000, aplicado R$ 1.800. 6. Tocar "Adicionar ativo". | Toast "Ativo adicionado". Sheet fecha. Ativo aparece na Carteira em XP > Fundos. API: POST /api/assets retornou 201 com id. | P0 |

---

### SH-T09 — Sheet C: cadastro de ativo automatico

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T09 | Sheet C cria ativo auto com ticker e quantidade | 1. FAB (+). 2. ITAU, ACAO. 3. Toggle "Automatico". 4. Preencher nome "BBAS3 · Banco do Brasil", ticker BBAS3, qtd 50, aplicado 2000. 5. Adicionar. | Ativo criado. Badge AUTO visivel. Cotacao buscada assincrona. Saldo calculado como qty * preco apos retorno da BRAPI. | P0 |

---

### SH-T10 — Sheet C: validacao de campos obrigatorios

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T10 | Tentar salvar sem preencher campos obrigatorios exibe erros | 1. FAB (+). 2. Tocar "Adicionar ativo" sem preencher nada. | Campos obrigatorios destacados em vermelho. Form nao submetido. Mensagens de erro contextual por campo. | P0 |

---

### SH-T11 — Sheet C: instituicao OUTROS exibe campo nome

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T11 | Selecionar "Outros" exibe campo de nome da instituicao | 1. FAB (+). 2. Tocar chip "Outros" na selecao de instituicao. | Campo de texto "Nome da instituicao" aparece abaixo dos chips. Obrigatorio ao salvar. | P1 |

---

### SH-T12 — Sheet B: fluxo de saida e venda de acoes/FIIs

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| SH-T12 | Sheet B para ACAO/FII em saida permite cancelar ou concluir venda | 1. Abrir Sheet B de ACAO/FII com status=`redeeming`. 2. Verificar CTA de saida. 3. Tocar "Concluir venda". 4. Preencher data e valor bruto. 5. Salvar. | Pergunta "O que voce quer fazer com essa saida?" visivel. A opcao "Voltou para ativo" retorna o status para `active`. A opcao "Concluir venda" abre o sheet de venda, exige data e valor bruto, finaliza o ativo como `sold`, remove a posicao da carteira aberta e preserva o detalhe historico com a venda registrada. | P1 |

---

## 7. Testes de Import XLSX (P0)

O import XLSX e o caminho critico do onboarding. Todos os testes nesta secao sao P0.

### IMP-T01 — Upload de planilha valida com 19 ativos

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| IMP-T01 | Upload de planilha com 15 ativos ativos e 4 em resgate completa Etapa 1 | 1. Navegar para tela Importar. 2. Arrastar ou selecionar a planilha de teste (secao 2.3 deste plano). 3. Verificar exibicao do nome e tamanho do arquivo. 4. Tocar "Processar". | Nome e tamanho do arquivo exibidos. Loading "Processando planilha..." aparece. Apos parse, avanca para Etapa 2. | P0 |

---

### IMP-T02 — Revisao mostra ativos parseados com badges corretos

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| IMP-T02 | Etapa 2 exibe tabela com badges OK, Alerta e campos editaveis | 1. Apos IMP-T01, verificar Etapa 2. | Tabela com N linhas (uma por ativo da planilha). Linhas com todos os campos OK exibem badge verde "OK". Linhas com campo opcional vazio (ex: Valor Aplicado ausente) exibem badge ambar "Alerta". Nenhuma linha com badge "Erro" (planilha valida). Contadores: "X prontos / Y alertas / 0 erros". Botao "Continuar" habilitado. | P0 |

---

### IMP-T03 — Confirmar cria todos os ativos no banco

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| IMP-T03 | Confirmacao da importacao envia para API e cria ativos | 1. Apos IMP-T02, tocar "Continuar". 2. Verificar Etapa 3: resumo. 3. Tocar "Confirmar importacao". | Etapa 3 exibe "N ativos serao criados" com breakdown por instituicao e classe. Apos confirmar: toast "N ativos importados". Navega para Carteira. Carteira mostra ativos importados agrupados. POST /api/import retornou 201 com `created: N`. | P0 |

---

### IMP-T04 — Tela Hoje apos import mostra total correto

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| IMP-T04 | Apos import completo, Hoje exibe o numero-tese correto | 1. Apos IMP-T03, navegar para tela Hoje. | Total do patrimonio exibe valor acima de R$ 157.530 (parte fixa dos manuais). Ganho positivo exibido. Card de frescor mostra ativos manuais. Donut com 3 instituicoes (XP, ITAU, ONZE). | P0 |

---

### IMP-T05 — Remocao de linha na revisao

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| IMP-T05 | Remover linha na Etapa 2 reduz contador e ignora ativo | 1. Na Etapa 2, tocar "X" em uma linha. 2. Verificar contagem. 3. Confirmar importacao. | Linha removida imediatamente. Contador "prontos" diminui 1. Ativo nao e criado. Etapa 3 reflete a contagem reduzida. POST /api/import nao contem o ativo removido. | P0 |

---

### IMP-T06 — Planilha vazia retorna mensagem de erro na Etapa 1

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| IMP-T06 | Upload de planilha vazia (sem dados) exibe alerta | 1. Criar .xlsx com abas vazias (sem dados, apenas cabecalhos). 2. Selecionar e processar. | Permanece na Etapa 1. Alerta: "Nenhum ativo encontrado na planilha. Verifique o formato ou baixe o template modelo." | P0 |

---

### IMP-T07 — Arquivo de formato errado

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| IMP-T07 | Upload de arquivo .pdf ou .csv retorna erro de formato | 1. Selecionar arquivo .pdf na dropzone. | Arquivo rejeitado. Mensagem de erro: formato nao suportado. Aceita apenas .xlsx e .xls. | P0 |

---

### IMP-T08 — Importar mesma planilha duas vezes cria duplicatas (comportamento documentado)

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| IMP-T08 | Segunda importacao da mesma planilha nao detecta duplicatas | 1. Importar planilha (IMP-T03). 2. Importar mesma planilha novamente. | Sistema aceita segunda importacao sem bloqueio. Carteira exibe ativos duplicados. Comportamento correto — documentado no RN-52. Nao e um bug. | P1 |

---

## 8. Testes Cross-cutting (P1)

### CC-T01 — Dark mode: todas as telas legiveis

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| CC-T01 | Dark mode renderiza todas as telas sem elementos ilegíveis | 1. Ativar dark mode no SO (Windows: Configuracoes > Personalizar > Cor > Escuro). 2. Navegar por todas as 4 telas e abrir as 4 sheets. | Fundo escuro, texto claro. Cores semanticas (verde, vinho, ambar) inalteradas (RN-63). Nenhum texto branco sobre fundo branco ou preto sobre preto. Grafico SVG legivel. Donut legivel. | P1 |

---

### CC-T02 — Ocultar valores: mascara global

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| CC-T02 | Toggle ocultar valores mascara todos os numeros em todas as telas | 1. Tocar icone de olho no header. 2. Navegar por Hoje, Carteira, Historico. | Todos os valores monetarios substituidos por "R$ *****,**". Todos os percentuais por "**%". Nomes de ativos, labels e datas permanecem visiveis. Donut mantem proporcoes mas oculta valores. | P0 |

---

### CC-T03 — Ocultar valores: persistencia apos reload

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| CC-T03 | Estado "oculto" persiste apos recarregar a pagina | 1. Ativar ocultar valores. 2. Recarregar pagina (F5). | App abre com valores ainda ocultos. Icone do olho mostra "fechado". localStorage key `quanto-hide` = "true" (verificar via DevTools > Application > Local Storage). | P0 |

---

### CC-T04 — localStorage: 4 chaves persistem corretamente

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| CC-T04 | As 4 chaves de localStorage persistem apos reload | 1. Ativar ocultar valores. 2. Alterar agrupamento da Carteira para "Por classe". 3. Selecionar filtro "ONZE". 4. Alternar donut para "Por classe". 5. Recarregar pagina. | Verificar em DevTools > Application > Local Storage: `quanto-hide` = true, `quanto-group-mode` = "class", `quanto-filter` = "ONZE", `quanto-donut-mode` = "class". Todos os 4 estados restaurados corretamente apos reload. | P1 |

---

### CC-T05 — Responsividade: viewport 375px (iPhone SE / Android basico)

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| CC-T05 | App funciona completamente em viewport 375px | 1. DevTools > Toggle Device Toolbar > 375 x 667. 2. Navegar todas as telas. 3. Abrir todas as sheets. 4. Executar import XLSX. | Nenhum elemento cortado horizontalmente. Sheets ocupam largura completa. Chips de filtro horizontais scrollaveis. Numero-tese legivel. Tab bar fixa no rodape. FAB visivel. | P0 |

---

### CC-T06 — Ocultar valores: sheets tambem mascaradas

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| CC-T06 | Sheets exibem valores mascarados quando ocultar ativo | 1. Ativar ocultar valores. 2. Abrir Sheet A de ativo manual. | "Ultimo: R$ *****,**" no campo de referencia. Input de saldo permite digitacao (usuario precisa saber o valor). Mascara so em valores exibidos, nao no input. | P1 |

---

### CC-T07 — Saudacao horaria na tela Hoje

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| CC-T07 | Saudacao muda conforme horario do sistema | 1. Verificar header da tela Hoje em diferentes horarios. | Antes das 12h: "Bom dia". Entre 12h-17h59: "Boa tarde". A partir das 18h: "Boa noite". Data por extenso em pt-BR no header. | P1 |

---

### CC-T08 — Formatacao monetaria pt-BR

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| CC-T08 | Todos os valores usam separador de milhar ponto e decimal virgula | 1. Verificar valores na tela Hoje, Carteira e Historico. | "R$ 157.530,61" (nao "R$ 157530.61" nem "R$ 157,530.61"). Centavos sempre 2 casas. Sinal "+" para ganhos e "-" para perdas. | P0 |

---

## 9. Testes PWA (P2)

### PWA-T01 — Manifest carrega corretamente

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| PWA-T01 | Manifest.json e carregado e valido | 1. DevTools > Application > Manifest. | Manifest visivel com: name, short_name, icons (varios tamanhos), start_url, display: "standalone", background_color, theme_color. Sem erros listados. | P2 |

---

### PWA-T02 — Service Worker registrado

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| PWA-T02 | Service Worker registra e ativa sem erros | 1. DevTools > Application > Service Workers. | Service Worker listado com status "Activated and running". Sem erros no console. | P2 |

---

### PWA-T03 — Modo offline exibe ultimo estado

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| PWA-T03 | App exibe dados em cache quando offline | 1. Carregar app e aguardar dados. 2. DevTools > Network > Throttling > Offline. 3. Recarregar pagina. | Shell HTML/CSS/JS carrega do Service Worker (RN-74). Dados do portfolio exibidos do cache (RN-75). Nota discreta "dados de [data]" visivel (RN-76). Botoes de escrita exibem mensagem de sem conexao se tocados (RN-77). | P2 |

---

### PWA-T04 — Fontes auto-hospedadas funcionam offline

| ID | Descricao | Passos | Resultado Esperado | Prioridade |
|----|-----------|--------|--------------------|-----------|
| PWA-T04 | Archivo e Inter renderizam sem CDN | 1. Modo offline (PWA-T03). 2. Verificar tipografia. | Fontes Archivo e Inter renderizam normalmente. Nenhuma fallback de sistema visible. As fontes woff2 sao servidas pelo proprio Worker (RN-78). | P2 |

---

## 10. Smoke Test Checklist (P0)

Executar antes de qualquer release. Todos os 8 itens devem passar. Tempo estimado: 15 minutos.

**Pre-condicao:** `wrangler dev --local` rodando, seed carregado, browser em 375px.

| # | Fluxo | Passos Rapidos | Status |
|---|-------|---------------|--------|
| 1 | **Upload XLSX e ativos criados** | Acessar Importar > selecionar planilha > Processar > Revisar > Confirmar > verificar "N ativos importados" | [ ] Passou / [ ] Falhou |
| 2 | **Hoje: total exibido** | Navegar para Hoje > verificar numero-tese acima de R$ 0 | [ ] Passou / [ ] Falhou |
| 3 | **Donut: toggle inst/classe** | Na Hoje, tocar toggle "Por classe" > donut muda > tocar "Por instituicao" > volta | [ ] Passou / [ ] Falhou |
| 4 | **Carteira: sub-agrupamento e filtro** | Navegar para Carteira > verificar hierarquia Inst > Classe > Ativo > tocar chip "ONZE" > lista filtra | [ ] Passou / [ ] Falhou |
| 5 | **Saldo rapido: atualizar manual** | Tocar ativo manual na Carteira > Sheet A abre > digitar novo valor > Salvar > saldo atualizado na lista | [ ] Passou / [ ] Falhou |
| 6 | **Editar ativo: alterar campos** | Tocar "..." em ativo > Sheet B abre > alterar nome > Salvar > nome atualizado na Carteira | [ ] Passou / [ ] Falhou |
| 7 | **Historico: grafico e lista** | POST /api/snapshot > Navegar para Historico > grafico e lista mensais visiveis | [ ] Passou / [ ] Falhou |
| 8 | **Ocultar valores: toggle** | Tocar icone olho > todos os valores mascarados > tocar novamente > valores revelados > recarregar > estado mantido | [ ] Passou / [ ] Falhou |

**Resultado:** ___/8 itens passaram.

**Versao testada:** ____________  **Data:** ____________  **Testador:** ____________

---

## 11. Criterios de Aceitacao

### 11.1 Criterios obrigatorios (release bloqueada se qualquer um falhar)

| Criterio | Metrica | Como verificar |
|---------|---------|---------------|
| Tempo de carregamento | App abre e exibe dados em menos de 3 segundos em conexao normal | DevTools > Network > medir tempo de GET /api/portfolio ate render |
| Import XLSX funcional | Planilha com 15 ativos ativos cria todos os 15 corretamente | IMP-T03: verificar `created: 15` na resposta da API |
| Total correto apos import | Numero-tese em Hoje bate com soma dos saldos importados | IMP-T04: total >= R$ 157.530,61 (soma dos manuais) |
| Todos os testes P0 passam | 0 falhas em API-T01/02/04/05/07/08/09/10/12/13/14/15/20/21/22/25, UI-T01-T10, SH-T01-T10, IMP-T01-T07, CC-T02/T03/T05/T08 | Executar smoke test e todos os P0 deste plano |
| Isolamento multi-user | Usuario B nao ve dados do Usuario A | API-T13, API-T24 |
| Soft delete preserva historico | Remover ativo nao altera snapshots | API-T14 + API-T27 |

### 11.2 Criterios importantes (nao bloqueia release, mas deve corrigir antes de usar em producao)

| Criterio | Metrica | Como verificar |
|---------|---------|---------------|
| Dark mode legivel | Sem texto ilegivel em ambos os temas | CC-T01 |
| Ocultar valores: zero vazamentos | Nenhum numero visivel com toggle ativo | CC-T02 em todas as telas e sheets |
| localStorage persiste 4 chaves | Estado restaurado apos reload | CC-T04 |
| Offline funcional | Ultimo estado visivel sem conexao | PWA-T03 |

### 11.3 Classificacao de severidade de bugs

| Severidade | Criterio | Exemplo |
|-----------|---------|---------|
| Critico (bloqueia release) | Perda de dados, total errado, import falha, seguranca | Usuario A ve dados do Usuario B. Import cria 0 ativos. Total zerado com ativos validos. |
| Alto (deve corrigir) | Feature principal nao funciona, UI quebrada | Sheet A nao salva saldo. Carteira nao renderiza. Dark mode com texto invisivel. |
| Medio (corrigir no proximo ciclo) | Feature secundaria com problemas | localStorage nao persiste. Formatacao monetaria errada. Tooltip do donut nao aparece. |
| Baixo (backlog) | Cosmetico, edge case raro | Saudacao errada em determinados fusos. Barra empilhada com 1px de desalinhamento. |

---

## Apendice A — Verificacoes rapidas via curl (referencia)

```bash
# Alias util para testes locais
alias quanto='curl -s -H "X-Dev-Email: giammattey.luiz@gmail.com"'

# Ver total do portfolio
quanto http://localhost:8787/api/portfolio | jq '.total'

# Ver frescor
quanto http://localhost:8787/api/portfolio | jq '.freshness'

# Ver ativos em resgate
quanto http://localhost:8787/api/portfolio | jq '.redeeming | map(.name)'

# Ver historico
quanto http://localhost:8787/api/history | jq .

# Criar snapshot
curl -s -X POST -H "X-Dev-Email: giammattey.luiz@gmail.com" http://localhost:8787/api/snapshot | jq .
```

## Apendice B — Queries de verificacao no banco D1

```bash
# Verificar ativos por status
wrangler d1 execute quanto-db --local \
  --command="SELECT status, COUNT(*) as n FROM assets WHERE user_id=1 GROUP BY status"

# Verificar total manual (sem cotacao)
wrangler d1 execute quanto-db --local \
  --command="SELECT SUM(manual_balance) as total_manual FROM assets WHERE user_id=1 AND status='active' AND ticker IS NULL"

# Verificar ativo stale
wrangler d1 execute quanto-db --local \
  --command="SELECT name, balance_updated_at, CAST(julianday('now') - julianday(balance_updated_at) AS INTEGER) as dias FROM assets WHERE user_id=1 AND ticker IS NULL AND status='active' ORDER BY balance_updated_at ASC"

# Verificar snapshots
wrangler d1 execute quanto-db --local \
  --command="SELECT * FROM snapshots WHERE user_id=1 ORDER BY month DESC"

# Verificar view de frescor
wrangler d1 execute quanto-db --local \
  --command="SELECT * FROM vw_freshness WHERE user_id=1"
```

## Apendice C — Mapeamento RNs por secao de teste

| Secao | RNs cobertas |
|-------|-------------|
| API P0 | RN-01, RN-02, RN-04, RN-05, RN-07, RN-08, RN-09, RN-14, RN-15, RN-17, RN-18, RN-20, RN-23, RN-24, RN-25, RN-26, RN-27, RN-28, RN-29, RN-30, RN-31, RN-33, RN-34, RN-36, RN-37, RN-38, RN-43, RN-44, RN-45, RN-47, RN-51, RN-52, RN-66, RN-70, RN-71, RN-72, RN-79 |
| Views SQL | RN-01, RN-04, RN-05, RN-07, RN-08, RN-15, RN-16, RN-17, RN-22, RN-79, RN-94 |
| Telas | RN-01, RN-02, RN-07, RN-14, RN-18, RN-20, RN-21, RN-85, RN-86, RN-87, RN-88, RN-89, RN-90, RN-91, RN-92, RN-93, RN-94, RN-95, RN-96, RN-97 |
| Sheets | RN-23, RN-25, RN-26, RN-28, RN-29, RN-30, RN-31, RN-32, RN-33, RN-34, RN-35, RN-36, RN-39, RN-79, RN-80, RN-81 |
| Import XLSX | RN-47, RN-48, RN-49, RN-50, RN-51, RN-52, RN-53, RN-83, RN-84 |
| Cross-cutting | RN-54, RN-55, RN-56, RN-57, RN-58, RN-59, RN-60, RN-61, RN-62, RN-63, RN-64, RN-65, RN-82, RN-98 |
| PWA | RN-73, RN-74, RN-75, RN-76, RN-77, RN-78 |
| Validacao (validation.spec.ts) | RN-66, RN-70, RN-71, RN-72, RN-79 (+ caminhos negativos dos CRUD, bens, aportes e auth) |

**RNs nao cobertas por testes funcionais (fora do escopo ou comportamento implicito):**
- RN-03 (archived invisivel) — coberto indiretamente por API-T14
- RN-06 (fallback sem cotacao) — dificil de testar sem controle da BRAPI em dev
- RN-10/RN-11/RN-12/RN-13 — dependem de cron e comportamento da BRAPI
- RN-19 (verde quando tudo fresco) — coberto por inspecao visual na UI-T04
- RN-40 (sem desfazer remocao) — comportamento negativo, coberto por API-T14
- RN-41 (cron dia 1) — testado separadamente como cron trigger no wrangler.toml
- RN-82 (snapshot automatico no onboarding) — coberto por IMP-T04 (verificar se snapshot existe apos import)

---

## Apendice D — Testes de Validacao e Caminhos Negativos (v1.1, 2026-06-16)

Adicionados em `tests/validation.spec.ts`. Todos os 15 casos (30 testes: mobile + desktop) passam.

| ID | Descricao | Arquivo |
|----|-----------|---------|
| VAL-T01 | POST /api/assets — institution ausente, OUTROS sem institution_name, classe invalida, ticker sem qty, sem manual_balance, cvm_cnpj+ticker mutuamente exclusivos | validation.spec.ts |
| VAL-T02 | PUT /api/assets/:id — body vazio, status invalido, institution invalida | validation.spec.ts |
| VAL-T03 | POST /api/snapshot — idempotencia: segundo call no mesmo mes retorna created: false | validation.spec.ts |
| VAL-T04 | GET /api/funds/search — query ausente ou < 3 chars retorna results vazio | validation.spec.ts |
| VAL-T05 | GET /api/portfolio — sem autenticacao retorna 401 | validation.spec.ts |
| VAL-T06 | GET /api/portfolio — portfolio vazio retorna zeros e arrays vazios | validation.spec.ts |
| VAL-T07 | POST /api/goods — IMOVEL sem propertyType, IMOVEL com propertyType invalido, VEICULO sem vehicleType; IMOVEL e VEICULO validos criam bem; grossWealth inclui ambos | validation.spec.ts |
| VAL-T08 | POST /api/goods — tipo invalido, sem name, estimatedValue negativo | validation.spec.ts |
| VAL-T09 | PUT /api/goods/:id — body vazio retorna 400; DELETE /api/goods/99999 retorna 404 | validation.spec.ts |
| VAL-T10 | POST /api/assets/:id/contributions — POUPANCA e COFRINHO rejeitam (422); ACAO valida: amount=0, negativo, sem contributedAt, data futura, ativo inexistente | validation.spec.ts |
| VAL-T11 | GET /api/assets/:id/history — ativo manual retorna 422; id inexistente retorna 404 | validation.spec.ts |
| VAL-T12 | POST /api/auth/register — email duplicado retorna 409 | validation.spec.ts |
| VAL-T13 | POST /api/auth/recover — CPF errado, data errada, email inexistente, senha curta retornam 400 | validation.spec.ts |
| VAL-T14 | Isolamento multi-user bens: UserB nao lista, nao atualiza e nao deleta bens do UserA (404) | validation.spec.ts |
| VAL-T15 | PUT /api/assets/:id com invested ignorado quando contributions existem | validation.spec.ts |

---

## Apendice E - Fusao Piloto `apps/web` (2026-06-18)

Objetivo: validar a primeira trilha paralela da fusao sem trocar o ponteiro do Worker.

| ID | Descricao | Arquivo |
|----|-----------|---------|
| FUS-T01 | `apps/web/index.html` autentica via `POST /api/auth/login`, carrega `GET /api/portfolio` + `GET /api/history`, renderiza a tela `Hoje`, alterna tema, oculta valores e responde em mobile/desktop | `tests/web-pilot.spec.ts` |
| FUS-T02 | a `Carteira` da trilha nova navega, agrupa ativos, aplica busca local, mostra filtros e preserva a secao `Em resgate` em mobile/desktop | `tests/web-pilot.spec.ts` |
| FUS-T03 | a `Historico` da trilha nova abre a partir do shell, reaproveita snapshots vivos e lista a serie mensal em mobile/desktop | `tests/web-pilot.spec.ts` |
| FUS-T04 | a `Bens` da trilha nova abre a partir do shell, consome `GET /api/goods` e cruza o bruto com o portfolio em mobile/desktop | `tests/web-pilot.spec.ts` |
| FUS-T05 | o `Detalhe` da trilha nova abre a partir de `Carteira` e resolve o bloco de historico para grafico ou fallback degradado sem travar a tela | `tests/web-pilot.spec.ts` |
| FUS-T06 | o `Detalhe` da trilha nova atualiza saldo manual e registra aporte via runtime vivo, com validacao cruzada por API em mobile/desktop | `tests/web-pilot.spec.ts` |
| FUS-T07 | o `Detalhe` da trilha nova executa lifecycle basico de ativo elegivel: iniciar saida, cancelar saida e concluir venda, com validacao cruzada por API em mobile/desktop | `tests/web-pilot.spec.ts` |
| FUS-T08 | o `Detalhe` da trilha nova edita nome do ativo e remove aporte via runtime vivo, com validacao cruzada por API em mobile/desktop | `tests/web-pilot.spec.ts` |
| FUS-T09 | a `Importar` da trilha nova processa planilha, revisa itens, ignora linhas invalidas e persiste o lote valido no runtime vivo | `tests/web-pilot.spec.ts` |
| FUS-T10 | o `Detalhe` da trilha nova arquiva ativo via soft delete do runtime vivo e a `Carteira` reflete a mudanca sem cutover | `tests/web-pilot.spec.ts` |
| FUS-T11 | a `Carteira` da trilha nova cadastra ativo manual e automatico via `POST /api/assets`, incluindo `OUTROS`, ticker, quantidade, aplicado e validacao cruzada por API/detail | `tests/web-pilot.spec.ts` |
| FUS-T12 | a `Carteira` da trilha nova busca fundo em `GET /api/funds/search`, seleciona o cache CVM vivo e cria o ativo via `cvm_cnpj` + `initial_balance` | `tests/web-pilot.spec.ts` |
| FUS-T13 | a `Bens` da trilha nova cadastra FGTS, imovel e veiculo via `POST /api/goods`, atualiza a lista dedicada e preserva o bruto do portfolio em mobile/desktop | `tests/web-pilot.spec.ts` |
| FUS-T14 | a `Bens` da trilha nova edita imovel existente, reaproveita `areaM2` no contrato vivo e arquiva bem via `DELETE /api/goods/:id` em mobile/desktop | `tests/web-pilot.spec.ts` |
| FUS-T15 | `public/` e `apps/web` abrem contra o mesmo runtime vivo, leem o mesmo total em Hoje, atravessam Historico, Carteira e Detalhe, e provam smoke de cutover sem rewiring do Worker | `tests/cutover-smoke.spec.ts` |
| FUS-T16 | `apps/web` recarrega offline sob `sw.js` proprio e mostra o ultimo estado valido salvo para Hoje, Bens e Detalhe sem rewiring do runtime principal | `tests/web-pilot.spec.ts` |
| FUS-T17 | `public/sw.js` e `apps/web/sw.js` coexistem com caches separados, servindo assets sem colidir na PWA atual | `tests/cutover-smoke.spec.ts` |
| FUS-T18 | o scheduler do Worker dispara BRAPI, macro, snapshot, CVM quotes e CVM catalog nos cron strings oficiais, registrando auditoria minima e preservando cache | `tests/scheduler.spec.ts` |
| FUS-T19 | o ensaio local de cutover sobe temporariamente o Worker com assets em `apps/web`, valida shell e health, e depois volta para `public`, provando rollback de assets sem tocar no `wrangler.toml` versionado | `npm run test:rollback-rehearsal` |
| FUS-T20 | um Worker local temporario servindo `apps/web` na raiz expõe `manifest.json`, registra `sw.js` proprio e recarrega offline com o ultimo estado valido salvo sem rewiring do runtime principal | `tests/cutover-worker.spec.ts` |
| FUS-T21 | o preflight de cutover consolida sync, typecheck, dry-run do Worker atual e do candidato, scheduler, smoke, Worker temporario, vertical viva e rollback local em um gate unico repetivel | `npm run test:cutover-preflight` |
| FUS-T22 | o postflight de cutover valida a URL promovida sem harness local, checando health, shell na raiz, manifesto, service worker, icones e, quando houver JWT valido, o contrato autenticado de portfolio | `npm run test:cutover-postflight -- --base-url <url> [--token <jwt>]` |
