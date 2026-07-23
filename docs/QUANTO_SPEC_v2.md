# QUANTO — Spec v2

> PWA pessoal de consolidação de patrimônio. Single-user (Luiz). Responde uma pergunta: **"quanto eu tenho, de fato?"** Nada a mais.

---

## 1. Escopo

**Faz:**
- Consolida 19 ativos reais (XP, Itaú/ION, Onze) em um número.
- Cotação automática de ações/FIIs da B3 via BRAPI (CPLE3, ITSA4, RANI3, BRST3).
- Saldo manual para fundos, previdência, cofrinhos e poupança.
- CRUD completo de ativos: adicionar, editar cadastro, atualizar saldo, remover (soft delete).
- Indicador de **frescor** por instituição: há quanto tempo cada grupo de manuais foi atualizado.
- Foto mensal automática do patrimônio (Cron, dia 1º) → histórico.

**NÃO faz (anti-escopo — recusar feature creep):**
- Multi-usuário, login social, compartilhamento.
- Proventos, dividendos, IR, come-cotas, preço médio por trade.
- Metas, rebalanceamento, recomendações.
- Importação Open Finance / B3 / CEI.
- Notificações push.

---

## 2. Stack (Cloudflare — custo R$ 0)

| Camada | Escolha |
|---|---|
| Backend | Cloudflare **Workers** + **Hono** |
| Banco | **D1** (SQLite) |
| Frontend | Estático via **Workers Assets** (mesmo deploy). Vanilla JS + CSS. Sem framework. |
| Cotações | **BRAPI** (brapi.dev, token free) — `GET /api/quote/CPLE3,ITSA4,RANI3,BRST3` — cache D1 15 min |
| Agendamento | **Cron Triggers**: `0 12 1 * *` (snapshot mensal, meio-dia UTC = 9h BRT) |
| Auth | **Cloudflare Access** (Zero Trust, free ≤50 users) — OTP por e-mail. Zero código de auth no app. |
| Deploy | `wrangler deploy` — Worker único com assets |
| Domínio | `quanto.<dominio>.com.br` ou `*.workers.dev` atrás do Access |

---

## 3. Schema D1

```sql
CREATE TABLE assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

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
  -- active    → visível, entra no total
  -- redeeming → visível com badge "em resgate", FORA do total principal
  -- archived  → invisível (soft delete, preserva histórico de snapshots)

  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE quotes_cache (
  ticker     TEXT PRIMARY KEY,
  price      REAL NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE TABLE snapshots (
  month      TEXT PRIMARY KEY,   -- '2026-06'
  total      REAL NOT NULL,      -- soma apenas status='active'
  invested   REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Regra de saldo por ativo:**
- `ticker IS NOT NULL` → `saldo = qty * price(cache)`, fallback `invested` se cotação indisponível.
- `ticker IS NULL` → `saldo = manual_balance`.

**Frescor:** ativo manual com `balance_updated_at` > 30 dias → stale.
Agrupamento no card de frescor: por instituição ("Onze: 2 de 3 em dia"), não por ativo individual.

---

## 4. API (Hono)

```
GET  /api/portfolio
     → {
         total,          -- soma de 'active' apenas
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
           status,             -- 'active'|'redeeming'|'archived'
           balanceUpdatedAt, staleDays
         }],
         redeeming: [...]    -- ativos com status='redeeming', separados
       }
     Lógica: lê assets WHERE status != 'archived';
     p/ tickers, usa quotes_cache; se cache > 15 min,
     refetch BRAPI em lote e atualiza cache.

POST /api/assets
     body: { institution, class, name, ticker?, qty?, invested?, manual_balance? }
     → 201 { id, ...asset }

PUT  /api/assets/:id
     body: campos parciais
     Se manual_balance presente → set balance_updated_at = now()
     Se status = 'archived' → soft delete (não apaga do banco)
     → 200 { ...asset }

DELETE /api/assets/:id
     → soft delete: UPDATE status='archived'
     → 200 { archived: true }

GET  /api/history
     → snapshots ORDER BY month DESC

POST /api/snapshot
     → upsert snapshot do mês corrente (idempotente) — botão debug/admin
```

**Cron handler:** calcula total/invested WHERE status='active' e faz upsert em `snapshots`.

**BRAPI:** `https://brapi.dev/api/quote/CPLE3,ITSA4,RANI3,BRST3?token=$BRAPI_TOKEN`
Token em secret (`wrangler secret put BRAPI_TOKEN`).
Se ticker não encontrado → mantém último cache, marca `priceUnavailable: true`.

---

## 5. PWA

- `manifest.json`: name "Quanto", short_name "Quanto", display `standalone`, theme `#16242F`, background `#FBFCFD`.
- Service worker: **cache-first** para shell (html/css/js/fonts), **network-first com fallback** para `/api/portfolio` e `/api/history` (offline mostra último estado + nota "dados de <data>").
- Instalável no Android (`beforeinstallprompt`).

---

## 6. Design

Tokens:
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

Tipografia: **Archivo** 700/800 (wordmark, títulos, número-tese) + **Inter** 400–700 (corpo, dados; sempre `font-variant-numeric: tabular-nums` em valores). Self-host as fontes (woff2) — offline não pode depender do Google Fonts.

---

## 7. Telas (3 + 3 sheets)

### Tela 1 — Hoje
Número-tese gigante (total de `status='active'`), ganho R$/% sobre aplicado, card de frescor por instituição ("Onze: 2 de 3 em dia" + alerta do mais velho), alocação por instituição (barras) e por classe (lista). Header mostra "cotações há X min".

Ativos `redeeming` **não entram** no número principal. Se houver algum, aparece nota discreta "+ R$ X em resgate (não contabilizado)".

### Tela 2 — Carteira
Lista agrupada por instituição. Cada ativo: nome, badge `AUTO`/`MANUAL`/`EM RESGATE`, meta (cotas·preço ou "atualizado há N dias"), saldo, ganho %. Botão `···` à direita de cada ativo.

- **Toque no ativo manual** → Sheet de Saldo (atualização rápida).
- **Toque em `···`** → Sheet de Edição (cadastro completo + remover).
- **FAB `+`** → Sheet de Cadastro.

Ativos `redeeming` aparecem em grupo separado "Em resgate", fora da contagem do total do grupo.

### Tela 3 — Histórico
Gráfico de linha SVG (sem lib) + lista mensal (mês, total, rendimento). Nota "foto automática todo dia 1º".

---

## 8. Sheets (3 modos)

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

---

## 9. Fluxos

**F1 · Setup (uma vez, ~10 min):** instalar PWA → Carteira vazia mostra "Adicione seu primeiro ativo" → FAB + → cadastra 4 ações auto (CPLE3/ITSA4/RANI3/BRST3) + 15 manuais com saldos reais → Hoje já mostra o número.

**F2 · Rotina mensal (~4 min):** abre app → card de frescor por instituição aponta quem está vencido → Carteira → toca nos ativos âmbar por instituição → digita saldo do app → salva. Pronto até o mês que vem.

**F3 · Consulta (10 s — o uso real):** abre app → vê o número → fecha.

**F4 · Zero-touch:** cotações renovam a cada acesso (cache 15 min); snapshot mensal roda no servidor.

**F5 · Adicionar ativo:** FAB + → Sheet C → preenche campos → "Adicionar ativo" → lista atualiza imediatamente.

**F6 · Editar ativo:** `···` → Sheet B → altera campos → "Salvar alterações". Para ticker/qtd de ação: corrige aqui. Para saldo manual: usa Sheet A (mais rápido).

**F7 · Remover ativo:** `···` → Sheet B → "Remover ativo" → confirmação inline → "Remover" → soft delete (status=archived) → some da lista; histórico preservado.

**F8 · Fundos em resgate (entrada casa nova):** muda status para `redeeming` via Sheet B → saem do total principal → aparecem em grupo "Em resgate" → quando liquidarem, `···` → "Remover" → archived.

---

## 10. Estrutura do repositório

```
quanto/
├─ wrangler.toml          # d1 binding DB, assets, cron, vars
├─ schema.sql
├─ seed.sql               # 19 ativos reais (ver seção 11)
├─ src/
│  └─ index.ts            # Hono: rotas CRUD + cron handler
├─ public/
│  ├─ index.html
│  ├─ app.js
│  ├─ app.css
│  ├─ manifest.json
│  ├─ sw.js
│  ├─ fonts/              # Archivo + Inter woff2 (self-hosted)
│  └─ icons/              # 192px + 512px
```

---

## 11. Seed real (19 ativos)

```sql
-- XP · Ações (auto)
INSERT INTO assets (institution,class,name,ticker,qty,invested,status)
VALUES
  ('XP','ACAO','CPLE3 · Copel','CPLE3',28,373.52,'active'),
  ('XP','ACAO','ITSA4 · Itausa','ITSA4',27,373.68,'active'),
  ('XP','ACAO','RANI3 · Irani','RANI3',41,373.10,'active');

-- XP · Ativos manuais
INSERT INTO assets (institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  ('XP','PREVIDENCIA','AZ Quest Luce Icatu Prev PGBL',10000.00,12362.16,'2026-06-12','active'),
  ('XP','FUNDO','Western Asset US Index 500 FIF',4150.21,4562.77,'2026-06-12','active'),
  ('XP','FUNDO','ACE Capital Multicenários FC FIF',1447.64,1478.02,'2026-06-12','active'),
  ('XP','FUNDO','Trend Ouro FIF Multi RL',952.87,1261.60,'2026-06-12','active');

-- XP · Em resgate
INSERT INTO assets (institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  ('XP','FUNDO','Selection RF Light FIC FIRF CP LP',984.64,1099.50,'2026-06-12','redeeming'),
  ('XP','FUNDO','Legacy Capital Compound Advisory',1900.00,1999.63,'2026-06-12','redeeming'),
  ('XP','FUNDO','Trend Valor Brasil FIA RL',750.00,877.10,'2026-06-12','redeeming'),
  ('XP','FUNDO','Trend Fixed Income US Target Duration',124.33,135.09,'2026-06-12','redeeming');

-- Itaú/ION · Ação (auto)
INSERT INTO assets (institution,class,name,ticker,qty,invested,status)
VALUES ('ITAU','ACAO','BRST3 · BrasilAgro','BRST3',200,586.15,'active');

-- Itaú/ION · Manuais
INSERT INTO assets (institution,class,name,manual_balance,balance_updated_at,status)
VALUES
  ('ITAU','PREVIDENCIA','Itaú Kinea Andes Prev RF CP PGBL',30566.46,'2026-06-12','active'),
  ('ITAU','COFRINHO','Cofrinhos ION',21867.67,'2026-06-12','active'),
  ('ITAU','FUNDO','Itaú Kinea Andes RF CP LP',2568.37,'2026-06-12','active'),
  ('ITAU','POUPANCA','Poupança MULTIDATA',302.01,'2026-06-12','active');

-- Onze · Previdência
INSERT INTO assets (institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  ('ONZE','PREVIDENCIA','Schroder Icatu Prev Low Vol Multimercado',23968.24,23968.24,'2026-06-12','active'),
  ('ONZE','PREVIDENCIA','Icatu Seg FIC Empresarial Renda Fixa',8432.36,8432.36,'2026-06-12','active'),
  ('ONZE','PREVIDENCIA','Icatu Vanguarda Pós Fixado RF Prev',50160.95,50160.95,'2026-05-09','active');
-- Nota: Icatu Vanguarda tem balance_updated_at antiga → stale no frescor
```

---

## 12. Ordem de implementação (para Claude Code)

1. `wrangler.toml` + D1 + `schema.sql` + `wrangler d1 execute --file=schema.sql`.
2. `seed.sql` com os 19 ativos reais acima.
3. API Hono: GET /api/portfolio + GET /api/history + cron handler.
4. API Hono: POST + PUT + DELETE /api/assets (CRUD completo).
5. Integração BRAPI + cache (`wrangler secret put BRAPI_TOKEN`).
6. Frontend: telas conforme tokens da seção 6 + mockup `quanto-mockup-v2.html`.
7. Sheets A (saldo), B (edição + soft delete), C (cadastro) com lógica de chips/toggle.
8. PWA (manifest + sw + ícones self-hosted).
9. Cloudflare Access na frente do hostname.
10. Smoke test dos 8 fluxos da seção 9.

**Critério de pronto:** F3 leva <10 s do toque no ícone ao número na tela, offline incluso (último estado em cache). CRUD completo funcional sem reload. Soft delete preserva snapshots.

---

## 13. Identidade visual e marca

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
