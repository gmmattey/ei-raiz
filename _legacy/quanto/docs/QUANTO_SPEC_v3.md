# QUANTO — Spec v3

> PWA de consolidação de patrimônio. Multi-user ready (auth via Cloudflare Access). Responde uma pergunta: **"quanto eu tenho, de fato?"** Nada a mais.

---

## 1. Escopo

**Faz:**
- Consolida ativos reais (XP, Itaú/ION, Onze) em um número.
- Cotação automática de ações/FIIs da B3 via BRAPI (CPLE3, ITSA4, RANI3, BRST3).
- Saldo manual para fundos, previdência, cofrinhos e poupança.
- CRUD completo de ativos: adicionar, editar cadastro, atualizar saldo, remover (soft delete).
- Indicador de **frescor** por instituição: há quanto tempo cada grupo de manuais foi atualizado.
- Foto mensal automática do patrimônio (Cron, dia 1º) → histórico.
- **Import XLSX** — upload de planilha com ativos, parser client-side (SheetJS), revisão antes de confirmar.
- **Ocultar valores** — toggle global que mascara todos os números monetários em todas as telas.
- **Dark mode** — segue preferência do sistema (`prefers-color-scheme`) com CSS vars swap.
- **Multi-user** — Cloudflare Access fornece auth; Worker extrai email do JWT e filtra tudo por `user_id`.

**NÃO faz (anti-escopo — recusar feature creep):**
- Login próprio, registro, recuperação de senha (Cloudflare Access cuida).
- Proventos, dividendos, IR, come-cotas, preço médio por trade.
- Metas, rebalanceamento, recomendações.
- Importação Open Finance / B3 / CEI.
- Notificações push.
- Simuladores, IA, chatbot.
- Perfil editável, configurações avançadas.

---

## 2. Stack (Cloudflare — custo R$ 0)

| Camada | Escolha |
|---|---|
| Backend | Cloudflare **Workers** + **Hono** |
| Banco | **D1** (SQLite) — 4 tabelas |
| Frontend | Estático via **Workers Assets** (mesmo deploy). Vanilla JS + CSS. Sem framework. Sem build step. |
| Cotações | **BRAPI** (brapi.dev, token free) — `GET /api/quote/CPLE3,ITSA4,...` — cache D1 15 min |
| Import | **SheetJS** (cdn.sheetjs.com) — lazy loaded via CDN apenas na tela Importar |
| Agendamento | **Cron Triggers**: `0 12 * * *` (cotações diárias) + `0 12 1 * *` (snapshot mensal) |
| Auth | **Cloudflare Access** (Zero Trust, free ≤50 users) — OTP por e-mail. Zero código de auth no app. |
| Deploy | `wrangler deploy` — Worker único com assets |
| Domínio | `quanto.<dominio>.com.br` ou `*.workers.dev` atrás do Access |

---

## 3. Schema D1

```sql
CREATE TABLE users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),

  -- identificação
  institution TEXT NOT NULL
    CHECK (institution IN ('XP','ITAU','ONZE','OUTROS')),
  class TEXT NOT NULL
    CHECK (class IN (
      'ACAO','FUNDO','RF','TESOURO',
      'PREVIDENCIA','POUPANCA','COFRINHO'
    )),
  name TEXT NOT NULL,

  -- modo auto (ticker B3)
  ticker TEXT,           -- não-nulo → cotação automática via BRAPI
  qty    REAL,           -- obrigatório se ticker

  -- valor de custo
  invested REAL,         -- total aportado; nullable (usuário pode não saber)

  -- modo manual
  manual_balance   REAL,    -- saldo atual digitado; obrigatório se ticker IS NULL
  balance_updated_at TEXT,  -- ISO; base do cálculo de frescor

  -- ciclo de vida
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','redeeming','archived')),

  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE quotes_cache (
  ticker     TEXT PRIMARY KEY,
  price      REAL NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE TABLE snapshots (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  month      TEXT NOT NULL,      -- '2026-06'
  total      REAL NOT NULL,
  invested   REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, month)
);
```

**Regra de saldo por ativo:**
- `ticker IS NOT NULL` → `saldo = qty * price(cache)`, fallback `invested` se cotação indisponível.
- `ticker IS NULL` → `saldo = manual_balance`.

**Frescor:** ativo manual com `balance_updated_at` > 30 dias → stale.
Agrupamento no card de frescor: por instituição ("Onze: 2 de 3 em dia"), não por ativo individual.

**Multi-user:** `assets` e `snapshots` têm `user_id`. Todas as queries filtram por `user_id`. `quotes_cache` é global (cotações são públicas).

---

## 4. Auth (Cloudflare Access)

O app não tem nenhum código de autenticação próprio.

**Fluxo:**
1. Cloudflare Access intercepta toda request ao hostname.
2. Usuário recebe OTP por email (zero senha).
3. Access injeta header `Cf-Access-Jwt-Assertion` em toda request.
4. Middleware Hono extrai email do JWT, faz upsert em `users`, injeta `user_id` no context.
5. Todas as rotas `/api/*` usam `c.get('userId')` para filtrar dados.

```typescript
// Middleware simplificado
app.use('/api/*', async (c, next) => {
  const jwt = c.req.header('Cf-Access-Jwt-Assertion');
  const email = decodeJwt(jwt).email;
  const user = await upsertUser(c.env.DB, email);
  c.set('userId', user.id);
  await next();
});
```

**Dev local:** `wrangler dev` não tem Access. Usar header mock `X-Dev-Email` em dev.

---

## 5. API (Hono)

```
GET  /api/portfolio
     → {
         total,
         invested,
         gain, gainPct,
         quotesFetchedAt,
         freshness: {
           ok, total,
           byInstitution: [{ institution, ok, total, staleAssets: [{id,name,daysAgo}] }]
         },
         byInstitution: [...],
         byClass: [...],
         assets: [{
           id, institution, class, name,
           ticker, qty, price,
           invested, balance, gain, gainPct,
           mode: 'auto'|'manual',
           status,
           balanceUpdatedAt, staleDays
         }],
         redeeming: [...]
       }
     Lógica: lê assets WHERE user_id = ? AND status != 'archived';
     p/ tickers, usa quotes_cache; se cache > 15 min,
     refetch BRAPI em lote e atualiza cache.

POST /api/assets
     body: { institution, class, name, ticker?, qty?, invested?, manual_balance? }
     → 201 { id, ...asset }

PUT  /api/assets/:id
     body: campos parciais (dynamic SET builder)
     Se manual_balance presente → set balance_updated_at = now()
     Se status = 'archived' → soft delete (não apaga do banco)
     → 200 { ...asset }

DELETE /api/assets/:id
     → soft delete: UPDATE status='archived' WHERE id = ? AND user_id = ?
     → 200 { archived: true }

GET  /api/history
     → snapshots WHERE user_id = ? ORDER BY month DESC

POST /api/snapshot
     → upsert snapshot do mês corrente para user_id (idempotente)

POST /api/import
     body: { items: [{ institution, class, name, ticker?, qty?, invested?, manual_balance? }] }
     → cria ativos em lote (com user_id); retorna { created: count, assets: [...] }
```

**Segurança:** toda query inclui `AND user_id = ?`. Nunca expor dados de outro user.

**Cron handlers:**
- Cotações: busca BRAPI para todos os tickers distintos em `assets`, UPSERT em `quotes_cache`.
- Snapshot: para cada user com ativos ativos, calcula total/invested e UPSERT em `snapshots`.

**BRAPI:** `https://brapi.dev/api/quote/CPLE3,ITSA4,...?token=$BRAPI_TOKEN`
Token em secret (`wrangler secret put BRAPI_TOKEN`).
Se ticker não encontrado → mantém último cache, marca `priceUnavailable: true`.

---

## 6. PWA

- `manifest.json`: name "Quanto", short_name "Quanto", display `standalone`, theme `#16242F`, background `#FBFCFD`.
- Service worker: **cache-first** para shell (html/css/js/fonts), **network-first com fallback** para `/api/portfolio` e `/api/history` (offline mostra último estado + nota "dados de <data>").
- Instalável no Android (`beforeinstallprompt`).

---

## 7. Design

### Tokens

```
--ink:    #16242F   texto principal, tabbar ativa, botões primários
--paper:  #FBFCFD   fundo
--mist:   #E8EDF1   hairlines, trilhas de barra
--slate:  #5E6B76   texto secundário
--petro:  #2A5A66   marca, barras de alocação, gráfico, badge auto
--verde:  #1F7A4D   ganhos
--vinho:  #C2335B   perdas
--amber:  #B7791F   frescor vencido (stale)
--red:    #D63031   remoção, badge em resgate
```

### Dark mode

Ativado por `prefers-color-scheme: dark`. Swap via CSS custom properties:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --ink: #E8EDF1;
    --paper: #0F1A24;
    --mist: #1E2D3A;
    --slate: #9CA3AF;
    --card: #162230;
    --border: #1E2D3A;
    --bg: #0B1420;
  }
}
```

Cores semânticas (petro, verde, vinho, amber) NÃO mudam no dark mode — são universais.

### Tipografia

**Archivo** 700/800 (wordmark, títulos, número-tese) + **Inter** 400–700 (corpo, dados; sempre `font-variant-numeric: tabular-nums` em valores). Self-host as fontes (woff2) — offline não pode depender do Google Fonts.

### Mobile-first

- Base: 360px (Android default)
- Touch targets: mínimo 44x44px
- Transições: 200ms ease-out (nunca animações pesadas)
- Haptics: `navigator.vibrate(8)` em ações de salvar/deletar

---

## 8. Telas (4 + 4 sheets)

### Tela 1 — Hoje

Número-tese gigante (total de `status='active'`), ganho R$/% sobre aplicado, card de frescor por instituição ("Onze: 2 de 3 em dia" + alerta do mais velho), alocação por instituição (barras) e por classe (lista). Header mostra "cotações há X min".

Ativos `redeeming` **não entram** no número principal. Se houver algum, aparece nota discreta "+ R$ X em resgate (não contabilizado)".

Saudação por horário no topo ("Bom dia", "Boa tarde", "Boa noite").

### Tela 2 — Carteira

Lista agrupada por instituição. Cada ativo: nome, badge `AUTO`/`MANUAL`/`EM RESGATE`, meta (cotas·preço ou "atualizado há N dias"), saldo, ganho %. Botão `···` à direita de cada ativo.

- **Toque no ativo manual** → Sheet A (atualização rápida de saldo).
- **Toque em `···`** → Sheet B (edição completa + remover).
- **FAB `+`** → Sheet C (cadastro).

Ativos `redeeming` aparecem em grupo separado "Em resgate", fora da contagem do total do grupo.

### Tela 3 — Histórico

Gráfico de linha SVG (sem lib) + lista mensal (mês, total, rendimento). Nota "foto automática todo dia 1º".

### Tela 4 — Importar

Wizard de 3 etapas:
1. **Upload** — dropzone para .xlsx/.xls + link para baixar template.
2. **Revisão** — tabela com os ativos parseados, badges de status (ok / conflito / erro), edição inline de campos problemáticos.
3. **Confirmação** — resumo ("12 ativos serão criados, 2 ignorados") + botão confirmar.

Parser client-side via SheetJS (lazy loaded do CDN). 6 parsers por tipo de ativo (ação, fundo, previdência, RF, poupança, cofrinho). O backend recebe os itens confirmados via `POST /api/import`.

---

## 9. Sheets (4 modos)

### Sheet A — Saldo (atualização rápida)
Acesso: toque no ativo manual.
Conteúdo: título do ativo, "atualizado há N dias", input grande `inputmode=decimal`, último valor salvo + data, botão "Salvar saldo", botão "Cancelar".
Resultado: PUT /api/assets/:id com manual_balance → toast "Saldo salvo · frescor renovado".

### Sheet B — Edição completa
Acesso: botão `···` em qualquer ativo.
Conteúdo:
- Campos editáveis: nome, instituição (chips), classe (chips), valor aplicado.
- Se modo auto: ticker + quantidade.
- Se modo manual: nada extra (saldo se edita pela Sheet A).
- Se status `redeeming`: mostra campo de status (chips: Ativo / Em resgate).
- Divisor + botão "Remover ativo" (vermelho, discreto).
- Ao tocar "Remover": inline confirmation "Remover? Histórico não é afetado." + botões "Cancelar" / "Remover" → DELETE /api/assets/:id → toast "Ativo removido" → fecha.

Resultado: PUT /api/assets/:id com campos editados → toast "Alterações salvas".

### Sheet C — Cadastro (novo ativo)
Acesso: FAB `+`.
Conteúdo:
1. Chips de instituição (XP / Itaú / Onze / Outros).
2. Chips de classe (Ação/FII / Fundo / Previdência / RF / Cofrinhos / Poupança).
3. Toggle "Automático (ticker B3)" / "Manual (saldo no app)".
4. Campos condicionais:
   - Auto: nome, ticker, quantidade, valor aplicado.
   - Manual: nome, saldo atual, valor aplicado.
5. Botão "Adicionar ativo".

Resultado: POST /api/assets → toast "Ativo adicionado" → lista atualiza.

### Sheet D — Upload XLSX
Acesso: tela Importar, etapa 1.
Conteúdo: dropzone com drag & drop + botão "Selecionar arquivo". Aceita `.xlsx` e `.xls`. Mostra nome do arquivo selecionado + tamanho. Botão "Processar" → avança para etapa 2.

---

## 10. Cross-cutting Features

### Ocultar valores

Toggle global no header (ícone de olho). Estado persistido em `localStorage`.

Quando ativo:
- Todos os valores monetários (R$) → `•••••`
- Todos os percentuais de ganho/perda → `••%`
- Gráficos SVG → barras/linhas ficam com opacidade reduzida (não somem)
- O número-tese na Hoje → `R$ •••••,••`

Implementação: função `maskValue(value, type)` aplicada em todos os pontos de renderização.

### Saudação por horário

```javascript
function getSaudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
```

---

## 11. Fluxos

**F1 · Setup (uma vez, ~10 min):** instalar PWA → Carteira vazia mostra "Adicione seu primeiro ativo" → FAB + → cadastra 4 ações auto (CPLE3/ITSA4/RANI3/BRST3) + 15 manuais com saldos reais → Hoje já mostra o número.

**F2 · Rotina mensal (~4 min):** abre app → card de frescor por instituição aponta quem está vencido → Carteira → toca nos ativos âmbar por instituição → digita saldo do app → salva. Pronto até o mês que vem.

**F3 · Consulta (10 s — o uso real):** abre app → vê o número → fecha.

**F4 · Zero-touch:** cotações renovam a cada acesso (cache 15 min); snapshot mensal roda no servidor.

**F5 · Adicionar ativo:** FAB + → Sheet C → preenche campos → "Adicionar ativo" → lista atualiza imediatamente.

**F6 · Editar ativo:** `···` → Sheet B → altera campos → "Salvar alterações". Para ticker/qtd de ação: corrige aqui. Para saldo manual: usa Sheet A (mais rápido).

**F7 · Remover ativo:** `···` → Sheet B → "Remover ativo" → confirmação inline → "Remover" → soft delete (status=archived) → some da lista; histórico preservado.

**F8 · Fundos em resgate:** muda status para `redeeming` via Sheet B → saem do total principal → aparecem em grupo "Em resgate" → quando liquidarem, `···` → "Remover" → archived.

**F9 · Import XLSX:** tela Importar → upload planilha → parser identifica tipos → revisão com badges → confirma → ativos criados em lote → toast "12 ativos importados".

**F10 · Ocultar valores:** toque no ícone de olho no header → todos os valores em todas as telas ficam mascarados → toque de novo para revelar.

---

## 12. Estrutura do repositório

```
quanto/
├─ wrangler.toml          # d1 binding DB, assets, cron, vars
├─ schema.sql
├─ seed.sql               # 19 ativos reais (ver seção 14)
├─ src/
│  └─ index.ts            # Hono: middleware auth + rotas CRUD + cron handler
├─ public/
│  ├─ index.html
│  ├─ app.js
│  ├─ app.css
│  ├─ manifest.json
│  ├─ sw.js
│  ├─ fonts/              # Archivo + Inter woff2 (self-hosted)
│  ├─ icons/              # 192px + 512px
│  └─ nucleo-q/           # Board do time (não faz parte do app)
│     ├─ index.html
│     └─ board-data.json
```

---

## 13. Template XLSX

Planilha modelo com abas por tipo de ativo:

| Aba | Colunas |
|-----|---------|
| Ações/FIIs | Ticker, Nome, Quantidade, Valor Aplicado, Instituição |
| Fundos | Nome, Saldo Atual, Valor Aplicado, Instituição |
| Previdência | Nome, Saldo Atual, Valor Aplicado, Instituição |
| Renda Fixa | Nome, Saldo Atual, Valor Aplicado, Instituição |
| Poupança | Nome, Saldo Atual, Instituição |
| Cofrinhos | Nome, Saldo Atual, Instituição |

Validação via dropdown nas colunas Instituição (`XP`, `ITAU`, `ONZE`, `OUTROS`).

---

## 14. Seed real (19 ativos)

```sql
-- Seed usa user_id = 1 (Luiz, primeiro login)

-- XP · Ações (auto)
INSERT INTO assets (user_id,institution,class,name,ticker,qty,invested,status)
VALUES
  (1,'XP','ACAO','CPLE3 · Copel','CPLE3',28,373.52,'active'),
  (1,'XP','ACAO','ITSA4 · Itausa','ITSA4',27,373.68,'active'),
  (1,'XP','ACAO','RANI3 · Irani','RANI3',41,373.10,'active');

-- XP · Ativos manuais
INSERT INTO assets (user_id,institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  (1,'XP','PREVIDENCIA','AZ Quest Luce Icatu Prev PGBL',10000.00,12362.16,'2026-06-12','active'),
  (1,'XP','FUNDO','Western Asset US Index 500 FIF',4150.21,4562.77,'2026-06-12','active'),
  (1,'XP','FUNDO','ACE Capital Multicenários FC FIF',1447.64,1478.02,'2026-06-12','active'),
  (1,'XP','FUNDO','Trend Ouro FIF Multi RL',952.87,1261.60,'2026-06-12','active');

-- XP · Em resgate
INSERT INTO assets (user_id,institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  (1,'XP','FUNDO','Selection RF Light FIC FIRF CP LP',984.64,1099.50,'2026-06-12','redeeming'),
  (1,'XP','FUNDO','Legacy Capital Compound Advisory',1900.00,1999.63,'2026-06-12','redeeming'),
  (1,'XP','FUNDO','Trend Valor Brasil FIA RL',750.00,877.10,'2026-06-12','redeeming'),
  (1,'XP','FUNDO','Trend Fixed Income US Target Duration',124.33,135.09,'2026-06-12','redeeming');

-- Itaú/ION · Ação (auto)
INSERT INTO assets (user_id,institution,class,name,ticker,qty,invested,status)
VALUES (1,'ITAU','ACAO','BRST3 · BrasilAgro','BRST3',200,586.15,'active');

-- Itaú/ION · Manuais
INSERT INTO assets (user_id,institution,class,name,manual_balance,balance_updated_at,status)
VALUES
  (1,'ITAU','PREVIDENCIA','Itaú Kinea Andes Prev RF CP PGBL',30566.46,'2026-06-12','active'),
  (1,'ITAU','COFRINHO','Cofrinhos ION',21867.67,'2026-06-12','active'),
  (1,'ITAU','FUNDO','Itaú Kinea Andes RF CP LP',2568.37,'2026-06-12','active'),
  (1,'ITAU','POUPANCA','Poupança MULTIDATA',302.01,'2026-06-12','active');

-- Onze · Previdência
INSERT INTO assets (user_id,institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  (1,'ONZE','PREVIDENCIA','Schroder Icatu Prev Low Vol Multimercado',23968.24,23968.24,'2026-06-12','active'),
  (1,'ONZE','PREVIDENCIA','Icatu Seg FIC Empresarial Renda Fixa',8432.36,8432.36,'2026-06-12','active'),
  (1,'ONZE','PREVIDENCIA','Icatu Vanguarda Pós Fixado RF Prev',50160.95,50160.95,'2026-05-09','active');
-- Nota: Icatu Vanguarda tem balance_updated_at antiga → stale no frescor
```

---

## 15. Ordem de implementação

1. `wrangler.toml` + D1 + `schema.sql` + `wrangler d1 execute --file=schema.sql`.
2. `seed.sql` com os 19 ativos (+ user Luiz).
3. Middleware auth (JWT parsing, upsert user).
4. API Hono: GET /api/portfolio + GET /api/history + cron handler.
5. API Hono: POST + PUT + DELETE /api/assets (CRUD completo).
6. API Hono: POST /api/import.
7. Integração BRAPI + cache (`wrangler secret put BRAPI_TOKEN`).
8. Frontend: shell PWA + navegação entre 4 telas.
9. Tela Hoje (número-tese, frescor, alocação).
10. Tela Carteira (lista agrupada, badges, FAB).
11. Tela Histórico (gráfico SVG, lista mensal).
12. Tela Importar (wizard 3 etapas + parser SheetJS).
13. Sheets A (saldo), B (edição + soft delete), C (cadastro), D (upload).
14. Cross-cutting: ocultar valores, dark mode, formatadores.
15. PWA (manifest + sw + fontes self-hosted + ícones).
16. Cloudflare Access na frente do hostname.
17. Smoke test dos 10 fluxos da seção 11.

**Critério de pronto:** F3 leva <10 s do toque no ícone ao número na tela, offline incluso (último estado em cache). CRUD completo funcional sem reload. Soft delete preserva snapshots. Ocultar valores não vaza nenhum número. Dark mode legível em todas as telas.

---

## 16. Identidade visual e marca

### Conceito do símbolo

A marca Quanto usa um **Q customizado** onde a cauda tradicional da letra é substituída por três barras ascendentes. Leitura dupla intencional: **Q de Quanto** (quanto você tem) + **gráfico de barras em alta** (o patrimônio crescendo). A barra mais alta usa verde (#1F7A4D), a mesma cor dos rendimentos positivos na UI — conexão visual deliberada.

### Arquivos entregues

```
public/icons/
├─ quanto-icon-512.png      → manifest.json (icon 512x512, primary)
├─ quanto-icon-192.png      → manifest.json (icon 192x192, secondary)
├─ quanto-icon-light-512.png → uso em fundo claro (splash screen, etc.)
├─ quanto-icon-dark.svg     → vetor mestre, variante escura
├─ quanto-icon-light.svg    → vetor mestre, variante clara
├─ quanto-wordmark-dark.svg → lockup horizontal com tagline, fundo escuro
└─ quanto-wordmark-light.svg → lockup horizontal com tagline, fundo claro
```

### Uso no código

**manifest.json:**
```json
{
  "name": "Quanto",
  "short_name": "Quanto",
  "description": "Quanto você tem, de fato.",
  "display": "standalone",
  "background_color": "#FBFCFD",
  "theme_color": "#16242F",
  "icons": [
    { "src": "/icons/quanto-icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/quanto-icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**SVG inline no HTML** (status bar, headers de tela, sheets):
```html
<svg viewBox="0 0 100 100" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="24" fill="#16242F"/>
  <path d="M 50.80,63.92 A 22,22 0 1,1 66.00,43.00"
        fill="none" stroke="#FBFCFD" stroke-width="9" stroke-linecap="round"/>
  <rect x="66.5" y="56" width="6.5" height="11" rx="2" fill="#2A5A66"/>
  <rect x="74.5" y="48" width="6.5" height="19" rx="2" fill="#2A5A66"/>
  <rect x="82.5" y="40" width="6.5" height="27" rx="2" fill="#1F7A4D"/>
</svg>
```

Ajuste `width` e `height` conforme o contexto:
- Status bar: 20x20
- Header de tela: 28x28
- Header Hoje: 40x40
- Sheet strip: 32x32
- App icon: 192x192 / 512x512 (use os PNGs, não SVG inline)

### Wordmark

```
"Quanto" + "." — onde o ponto final é sempre em #2A5A66 (Petróleo)
```

Fonte: **Archivo 800** (display/wordmark). **Inter 400–700** (corpo e dados).
Não usar outra fonte para o wordmark. Fallback aceitável só nos SVGs exportados: `'Arial Black', Arial, sans-serif`.

### Regras de uso

- **Não distorcer** o símbolo — ele é sempre quadrado (1:1).
- **Não trocar as cores** das barras: petróleo + verde são semânticos (petróleo = ativo, verde = crescimento).
- **Fundo mínimo**: o ícone dark funciona sobre qualquer fundo escuro; o light sobre qualquer fundo claro. Não usar dark sobre branco puro sem borda.
- **Tamanho mínimo**: 20x20px — abaixo disso as barras desaparecem; usar só o texto "Quanto." sem ícone.
- **Tagline**: "Quanto você tem, de fato." — usa em caixa baixa nos textos, maiúsculo no lockup SVG.

---

## Changelog

| Versão | Data | Mudanças |
|--------|------|----------|
| v1 | 2026-06-12 | Spec inicial |
| v2 | 2026-06-12 | Branding, seed real, PWA, identidade visual |
| v3 | 2026-06-13 | Multi-user (Cloudflare Access + users table), Import XLSX (4ª tela + SheetJS), Ocultar valores, Dark mode, 4 tabelas/7 endpoints/4 telas/4 sheets |
