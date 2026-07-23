# QUANTO — Spec v4

> PWA de consolidacao de patrimonio. Multi-user ready (auth via Cloudflare Access). Responde uma pergunta: **"quanto eu tenho, de fato?"** Nada a mais.

---

## 1. Escopo

**Faz:**
- Consolida ativos reais (XP, Itau/ION, Onze, e instituicoes customizadas) em um numero.
- Cotacao automatica de acoes/FIIs da B3 via BRAPI (CPLE3, ITSA4, RANI3, BRST3).
- Saldo manual para fundos, previdencia, cofrinhos e poupanca.
- CRUD completo de ativos: adicionar, editar cadastro, atualizar saldo, remover (soft delete).
- Indicador de **frescor** por instituicao: ha quanto tempo cada grupo de manuais foi atualizado.
- Foto mensal automatica do patrimonio (Cron, dia 1) → historico.
- **Import XLSX** — upload de planilha com ativos, parser client-side (SheetJS), revisao antes de confirmar.
- **Ocultar valores** — toggle global que mascara todos os numeros monetarios em todas as telas.
- **Dark mode** — segue preferencia do sistema (`prefers-color-scheme`) com CSS vars swap.
- **Multi-user** — Cloudflare Access fornece auth; Worker extrai email do JWT e filtra tudo por `user_id`.
- **Donut chart de alocacao** — grafico SVG interativo na Hoje com toggle instituicao/classe.
- **Sub-agrupamento na Carteira** — hierarquia Instituicao > Classe > Ativo, filtros por chips, barra empilhada.

**NAO faz (anti-escopo — recusar feature creep):**
- Login proprio, registro, recuperacao de senha (Cloudflare Access cuida).
- Proventos, dividendos, IR, come-cotas, preco medio por trade.
- Metas, rebalanceamento, recomendacoes.
- Importacao Open Finance / B3 / CEI.
- Notificacoes push.
- Simuladores, IA, chatbot.
- Perfil editavel, configuracoes avancadas.

---

## 2. Stack (Cloudflare — custo R$ 0)

| Camada | Escolha |
|---|---|
| Backend | Cloudflare **Workers** + **Hono** |
| Banco | **D1** (SQLite) — 4 tabelas |
| Frontend | Estatico via **Workers Assets** (mesmo deploy). Vanilla JS + CSS. Sem framework. Sem build step. |
| Cotacoes | **BRAPI** (brapi.dev, token free) — `GET /api/quote/CPLE3,ITSA4,...` — cache D1 15 min |
| Import | **SheetJS** (cdn.sheetjs.com) — lazy loaded via CDN apenas na tela Importar |
| Agendamento | **Cron Triggers**: `0 12 * * *` (cotacoes diarias) + `0 12 1 * *` (snapshot mensal) |
| Auth | **Cloudflare Access** (Zero Trust, free <=50 users) — OTP por e-mail. Zero codigo de auth no app. |
| Deploy | `wrangler deploy` — Worker unico com assets |
| Dominio | `quanto.<dominio>.com.br` ou `*.workers.dev` atras do Access |

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

  -- identificacao
  institution TEXT NOT NULL
    CHECK (institution IN ('XP','ITAU','ONZE','OUTROS')),
  institution_name TEXT,   -- nome customizado quando institution = 'OUTROS'
                           -- nullable; obrigatorio se institution = 'OUTROS'
                           -- usado no agrupamento da Carteira e no donut de alocacao
                           -- ex: 'Nubank', 'BTG', 'Rico', 'Inter'
  class TEXT NOT NULL
    CHECK (class IN (
      'ACAO','FUNDO','RF','TESOURO',
      'PREVIDENCIA','POUPANCA','COFRINHO'
    )),
  name TEXT NOT NULL,

  -- modo auto (ticker B3)
  ticker TEXT,           -- nao-nulo → cotacao automatica via BRAPI
  qty    REAL,           -- obrigatorio se ticker

  -- valor de custo
  invested REAL,         -- total aportado; nullable (usuario pode nao saber)

  -- modo manual
  manual_balance   REAL,    -- saldo atual digitado; obrigatorio se ticker IS NULL
  balance_updated_at TEXT,  -- ISO; base do calculo de frescor

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
- `ticker IS NOT NULL` → `saldo = qty * price(cache)`, fallback `invested` se cotacao indisponivel.
- `ticker IS NULL` → `saldo = manual_balance`.

**Frescor:** ativo manual com `balance_updated_at` > 30 dias → stale.
Agrupamento no card de frescor: por instituicao ("Onze: 2 de 3 em dia"), nao por ativo individual.

**Multi-user:** `assets` e `snapshots` tem `user_id`. Todas as queries filtram por `user_id`. `quotes_cache` e global (cotacoes sao publicas).

**Campo `institution_name`:** quando `institution = 'OUTROS'`, o campo `institution_name` armazena o nome customizado (ex: "Nubank", "BTG"). Na UI, esse nome substitui "Outros" no agrupamento da Carteira, no donut chart e na legenda. O campo e nullable — obrigatorio apenas quando `institution = 'OUTROS'`.

---

## 4. Auth (Cloudflare Access)

O app nao tem nenhum codigo de autenticacao proprio.

**Fluxo:**
1. Cloudflare Access intercepta toda request ao hostname.
2. Usuario recebe OTP por email (zero senha).
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

**Dev local:** `wrangler dev` nao tem Access. Usar header mock `X-Dev-Email` em dev.

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
           byInstitution: [{ institution, institutionName, ok, total, staleAssets: [{id,name,daysAgo}] }]
         },
         byInstitution: [{ institution, institutionName, total, pct, color }],
         byClass: [{ class, label, total, pct, color }],
         assets: [{
           id, institution, institutionName, class, name,
           ticker, qty, price,
           invested, balance, gain, gainPct,
           mode: 'auto'|'manual',
           status,
           balanceUpdatedAt, staleDays
         }],
         redeeming: [...]
       }
     Logica: le assets WHERE user_id = ? AND status != 'archived';
     p/ tickers, usa quotes_cache; se cache > 15 min,
     refetch BRAPI em lote e atualiza cache.

     Notas v4:
     - `byInstitution` e `byClass` incluem `color` (hex) para donut/barra.
     - `institutionName` presente em cada ativo e em `byInstitution`
       para suportar agrupamento com nomes customizados de "Outros".
     - Segmentos com `pct` < limiar sao candidatos a agrupamento
       em "Outros" no frontend (> 5 segmentos).

POST /api/assets
     body: { institution, institutionName?, class, name, ticker?, qty?, invested?, manual_balance? }
     → 201 { id, ...asset }

PUT  /api/assets/:id
     body: campos parciais (dynamic SET builder)
     Se manual_balance presente → set balance_updated_at = now()
     Se status = 'archived' → soft delete (nao apaga do banco)
     → 200 { ...asset }

DELETE /api/assets/:id
     → soft delete: UPDATE status='archived' WHERE id = ? AND user_id = ?
     → 200 { archived: true }

GET  /api/history
     → snapshots WHERE user_id = ? ORDER BY month DESC

POST /api/snapshot
     → upsert snapshot do mes corrente para user_id (idempotente)

POST /api/import
     body: { items: [{ institution, institutionName?, class, name, ticker?, qty?, invested?, manual_balance? }] }
     → cria ativos em lote (com user_id); retorna { created: count, assets: [...] }
```

**Seguranca:** toda query inclui `AND user_id = ?`. Nunca expor dados de outro user.

**Cron handlers:**
- Cotacoes: busca BRAPI para todos os tickers distintos em `assets`, UPSERT em `quotes_cache`.
- Snapshot: para cada user com ativos ativos, calcula total/invested e UPSERT em `snapshots`.

**BRAPI:** `https://brapi.dev/api/quote/CPLE3,ITSA4,...?token=$BRAPI_TOKEN`
Token em secret (`wrangler secret put BRAPI_TOKEN`).
Se ticker nao encontrado → mantem ultimo cache, marca `priceUnavailable: true`.

---

## 6. PWA

- `manifest.json`: name "Quanto", short_name "Quanto", display `standalone`, theme `#16242F`, background `#FBFCFD`.
- Service worker: **cache-first** para shell (html/css/js/fonts), **network-first com fallback** para `/api/portfolio` e `/api/history` (offline mostra ultimo estado + nota "dados de <data>").
- Instalavel no Android (`beforeinstallprompt`).

---

## 7. Design

### Tokens

```
--ink:    #16242F   texto principal, tabbar ativa, botoes primarios
--paper:  #FBFCFD   fundo
--mist:   #E8EDF1   hairlines, trilhas de barra
--slate:  #5E6B76   texto secundario
--petro:  #2A5A66   marca, donut/barra de alocacao, grafico, badge auto
--verde:  #1F7A4D   ganhos
--vinho:  #C2335B   perdas
--amber:  #B7791F   frescor vencido (stale)
--red:    #D63031   remocao, badge em resgate
```

### Paleta de cores para donut chart e barra empilhada

Cores fixas atribuidas por grupo (nao mudam entre renders). Palette sequencial de 3-7 cores:

```
Cores de segmento (uso no donut e na barra empilhada):
--seg-1:  #2A5A66   (petro — grupo primario)
--seg-2:  #1F7A4D   (verde)
--seg-3:  #B7791F   (amber)
--seg-4:  #C2335B   (vinho)
--seg-5:  #5E6B76   (slate)
--seg-outros: #CCD3D9  (cinza claro — agrupamento "Outros" quando > 5 segmentos)
```

A atribuicao de cor e deterministica: o mesmo grupo recebe sempre a mesma cor, independente da ordem de renderizacao.

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

Cores semanticas (petro, verde, vinho, amber) e cores de segmento NAO mudam no dark mode — sao universais.

### Tipografia

**Archivo** 700/800 (wordmark, titulos, numero-tese) + **Inter** 400-700 (corpo, dados; sempre `font-variant-numeric: tabular-nums` em valores). Self-host as fontes (woff2) — offline nao pode depender do Google Fonts.

**Hierarquia tipografica do numero-tese (v4):** parte inteira em Archivo 700 44px cor ink; centavos em 22px cor slate, separados visualmente. O numero inteiro e legivel a distancia — centavos sao secundarios.

### Mobile-first

- Base: 360px (Android default)
- Touch targets: minimo 44x44px
- Transicoes: 200ms ease-out (nunca animacoes pesadas)
- Haptics: `navigator.vibrate(8)` em acoes de salvar/deletar

---

## 8. Telas (4 + 4 sheets)

### Tela 1 — Hoje

**Proposito:** Responder a pergunta "quanto eu tenho?" em 10 segundos.

**Fonte de dados:** `GET /api/portfolio`

**Layout:** O header (logo + data) tem padding generoso (>=16px abaixo) antes da saudacao, criando respiro visual entre branding e conteudo. A saudacao e uma linha propria, separada do label "Patrimonio total" por 4px.

#### Secao: Numero-tese

Saudacao por horario no topo ("Bom dia", "Boa tarde", "Boa noite"), data por extenso no header. Label "Patrimonio total" em caixa alta 11px slate, separado da saudacao por 4px.

**Numero-tese:** Archivo 700, 44px. Parte inteira em destaque (cor ink), centavos em tamanho menor (22px, cor slate). Separados visualmente: "R$ 159.153" grande + ",53" menor. Numero inteiro legivel a distancia — centavos sao secundarios.

Ganho absoluto ("+ R$ 58.335") e percentual ("(57,9%) sobre o aplicado") em 13.5px, cor verde/vinho conforme sinal.

Ativos `redeeming` **nao entram** no numero principal. Se houver algum, aparece nota discreta "+ R$ X em resgate (nao contabilizado)".

#### Secao: Card de frescor

Card com titulo "Saldos manuais", contagem ("14 de 15 em dia"), barra de progresso (petro), e alerta ambar por instituicao com nome do ativo mais antigo e dias.

#### Secao: Alocacao — Donut chart (v4)

Toggle "Por instituicao" (padrao) / "Por classe" — pill compacto 12px, persistido em `localStorage('quanto-donut-mode')`. (RN-94)

**Donut chart SVG interativo** (~160x160px):
- Fatias proporcionais ao saldo de cada grupo (`byInstitution` ou `byClass` conforme toggle).
- **Centro do donut:** valor total do patrimonio (Archivo 700, 20px) — reforca o numero-tese.
- **Cores fixas** por grupo (palette sequencial de 3-7 cores; nao mudam entre renders).
- **Interacao:** toque na fatia destaca-a e exibe tooltip com nome + valor R$ + percentual.
- Se > 5 segmentos, os menores sao agrupados em "Outros" (cor cinza). (RN-97)

**Legenda** abaixo do donut (substitui as barras de alocacao da v3): (RN-95)
- Cada item: bolinha de cor + nome do grupo + valor R$ (alinhado a direita).
- Ordenada decrescente por valor.
- Sem barras de progresso — o donut ja e a visualizacao primaria, a legenda e o detalhe.

**Estado mascarado (ocultar valores):** donut mantem proporcoes/fatias, valores no centro e na legenda sao mascarados. (RN-98)

**Estado vazio:** donut e legenda ocultos; mensagem "Adicione ativos na aba Carteira para comecar".

#### Info cotacoes

"cotacoes ha X min" baseado em `max(fetched_at)` da `quotes_cache`. Se nenhum ticker existe: nao exibe.

#### Interacoes

- Toque no icone de olho → alterna ocultar valores
- Toque no card de frescor → navega para Carteira (ativos vencidos ficam destacados)
- Toque na fatia do donut → destaca e exibe tooltip
- Toggle donut → alterna entre instituicao/classe
- Pull to refresh → recarrega portfolio (e renova cotacoes se cache > 15 min)

---

### Tela 2 — Carteira

**Proposito:** Listar e gerenciar todos os ativos com hierarquia visual clara — agrupados, sub-agrupados e filtraveis.

**Fonte de dados:** `GET /api/portfolio` (mesma chamada da Hoje, cacheada no client)

#### Header

- Titulo "Carteira" (Archivo 800, 20px, padding generoso >=12px abaixo).
- Contagem de ativos: total de ativos `active` visiveis no filtro atual. Se filtro ativo, mostra contagem filtrada ("7 ativos").
- Total do header: se filtro ativo, mostra soma dos ativos filtrados (RN-93). Se nenhum filtro, mesmo calculo do numero-tese.

#### Controles de visualizacao (abaixo do header)

**Toggle de agrupamento** (RN-85): selecao binaria "Por instituicao" (padrao) / "Por classe". Toggle pill compacto, 12px, cor ink quando selecionado. Persistido em `localStorage('quanto-group-mode')`. (RN-90)

**Chips de filtro** (RN-88, RN-89): scroll horizontal abaixo do toggle. `Todos` (default) seguido de chips por instituicao (XP, Itau, Onze, etc.) e por classe (Acao, Fundo, Prev, etc.). Selecao unica — toque ativa/desativa. Chips 12px, borda mist, fundo ink quando selecionado. Persistido em `localStorage('quanto-filter')`. (RN-90)

Filtros sao mutuamente exclusivos — selecionar "XP" filtra apenas ativos XP; selecionar "Todos" remove o filtro. (RN-89)

#### Barra de distribuicao (RN-96)

Barra horizontal empilhada de **8px altura** abaixo dos filtros e acima da lista. SVG/HTML, segmentos proporcionais ao saldo de cada grupo. Cores seguem o modo de agrupamento ativo (por instituicao ou por classe). Borda-radius 4px. Se filtro ativo, mostra apenas o subset filtrado. Se > 5 segmentos, os menores sao agrupados em "Outros" cinza. (RN-97) Sem labels — funciona como mapa visual compacto.

#### Modo "Por instituicao" (padrao) — com sub-agrupamento por classe (RN-86)

**Hierarquia visual:** Instituicao > Classe > Ativo

| Nivel | Elemento | Formato |
|-------|----------|---------|
| **Grupo (instituicao)** | Label em caixa alta 11px peso 700 cor slate. Se `institution = 'OUTROS'` e `institution_name` preenchido, exibe o nome customizado (ex: "NUBANK"). Total do grupo alinhado a direita peso 600. Separador visual forte (linha + padding 16px acima). | |
| **Sub-grupo (classe)** | Label amigavel (ex: "Acoes", "Fundos", "Previdencia") em 10px peso 600 cor slate, letra-spacing 0.06em. Sub-total da classe 11px alinhado a direita cor slate. Sem separador extra se sub-grupo tem 1 ativo; padding 8px acima se > 1 ativo. (RN-86) | |
| **Ativo** | Campos: nome, badge modo, meta, saldo, ganho %, botao `...`. Mesmo layout descrito na secao de campos por ativo abaixo. | |

**Exemplo visual:**
```
XP                                R$ 20.748
  Acoes
    CPLE3 . Copel      [AUTO]    R$ 409  +9,5%
    ITSA4 . Itausa      [AUTO]    R$ 348  -6,8%
    RANI3 . Irani       [AUTO]    R$ 326  -12,6%
  Previdencia
    AZ Quest Luce Prev  [MANUAL]  R$ 12.362  +23,6%
  Fundos
    Western Asset US    [MANUAL]  R$ 4.563  +9,9%
    ACE Capital         [MANUAL]  R$ 1.478  +2,1%
    Trend Ouro FIF      [MANUAL]  R$ 1.262  +32,4%
```

#### Modo "Por classe" (RN-87)

**Hierarquia visual:** Classe > Ativo (com instituicao como metadado)

| Nivel | Elemento | Formato |
|-------|----------|---------|
| **Grupo (classe)** | Label em caixa alta 11px peso 700, mesmo estilo dos grupos de instituicao. Total do grupo alinhado a direita. | |
| **Ativo** | Mesmos campos + badge secundario com nome da instituicao ao lado do badge auto/manual. | |

#### Campos de cada ativo na lista (ambos os modos)

| Campo | Tipo | Calculo | Formato | Mascara |
|-------|------|---------|---------|---------|
| Nome | Texto | `asset.name` | 14px, peso 600, cor ink | Nao mascara |
| Badge modo | Tag | `ticker != null` → "AUTO" (petro) / `ticker == null` → "MANUAL" (verde se fresco, ambar se stale) | Tag 9.5px caixa alta | Nao mascara |
| Badge resgate | Tag | `status == redeeming` → "EM RESGATE" (vermelho). Substitui badge modo | Tag vermelha | Nao mascara |
| Meta (auto) | Texto | "28 cotas . R$ 14,61" | 11.5px | Valores mascarados |
| Meta (manual) | Texto | "ha 1 dia". Se > 30 dias: ambar + "— atualize" | 11.5px | Nao mascara |
| Saldo | Monetario | Auto: `qty * price`. Manual: `manual_balance` | 14px peso 600, alinhado a direita | R$ *****,** |
| Ganho % | Percentual | `((balance / invested) - 1) * 100`. Se `invested` null/0 → nao exibe | "+12,3%" verde ou "-5,2%" vinho, 11.5px | **% |
| Botao ... | Acao | Abre Sheet B para este ativo | Tres pontos, 28x28 | — |

#### Grupo "Em resgate" (RN-92)

Sempre no **final** da lista, independente do modo de agrupamento e independente de filtros de instituicao/classe — sempre visivel quando existem ativos redeeming. Separado por borda tracejada (dashed). Cada ativo mostra instituicao como badge secundario.

Total do grupo "Em resgate" alinhado a direita. Ativos com `status = redeeming`, mesmos campos da lista acima.

#### Sub-totais (RN-93)

Recalculados conforme o filtro ativo. Ex: ao filtrar por "XP", o total do header mostra apenas a soma dos ativos XP. Contagem de ativos tambem reflete o filtro.

#### Interacoes

- Toggle agrupamento → alterna modo e re-renderiza lista imediatamente
- Chip de filtro → filtra lista, recalcula totais e barra empilhada
- Toque no ativo manual → abre Sheet A (saldo rapido)
- Toque no ativo auto → sem acao (cotacao e automatica)
- Toque em `...` → abre Sheet B (edicao completa)
- Toque no FAB → abre Sheet C (cadastro)
- Pull to refresh → recarrega portfolio

#### Estado vazio

- Sem ativos: ilustracao simples + "Adicione seu primeiro ativo" + botao "Adicionar" que abre Sheet C.
- Com filtro sem resultados: "Nenhum ativo encontrado com esse filtro" + botao "Limpar filtro". (RN-91)

---

### Tela 3 — Historico

Grafico de linha SVG (sem lib) + lista mensal (mes, total, rendimento). Nota "foto automatica todo dia 1".

**Estados por quantidade de snapshots:**
- **0:** Mensagem "O historico comeca apos o primeiro mes." Grafico e lista ocultos.
- **1:** Ponto unico (sem linha). 1 linha sem rendimento.
- **2:** Linha entre 2 pontos com area preenchida. 2 linhas, segunda com rendimento.
- **3+:** Comportamento normal — linha, pontos, area, lista completa.

**Tooltip:** toque em ponto exibe "Jun 2026: R$ 175.432,10". Persiste ate toque em outro ponto ou fora. Em mobile, scroll vertical nao dismiss o tooltip.

**Snapshot no onboarding:** no primeiro acesso com ativos, o sistema cria automaticamente um snapshot do mes corrente (RN-82). Garante que o historico comece imediatamente.

---

### Tela 4 — Importar

Wizard de 3 etapas:
1. **Upload** — dropzone para .xlsx/.xls + link para baixar template (`/template-quanto.xlsx`, asset estatico). Loading state com spinner e "Processando planilha..." durante parse (RN-84).
2. **Revisao** — tabela com os ativos parseados, badges de status (ok / conflito / erro), edicao inline de campos problematicos. Contadores: "X prontos / Y alertas / Z erros".
3. **Confirmacao** — resumo ("12 ativos serao criados, 2 ignorados") + detalhamento por instituicao e classe + botao confirmar.

Parser client-side via SheetJS (lazy loaded do CDN). 7 abas no template (Acoes/FIIs, Fundos, Previdencia, Tesouro, Renda Fixa, Poupanca, Cofrinhos). O backend recebe os itens confirmados via `POST /api/import`.

---

## 9. Sheets (4 modos)

### Sheet A — Saldo (atualizacao rapida)
Acesso: toque no ativo manual.
Conteudo: titulo do ativo, "atualizado ha N dias", input grande `inputmode=decimal`, ultimo valor salvo + data, botao "Salvar saldo", botao "Cancelar".
Resultado: PUT /api/assets/:id com manual_balance → toast "Saldo salvo . frescor renovado".

### Sheet B — Edicao completa
Acesso: botao `...` em qualquer ativo.
Conteudo:
- Campos editaveis: nome, instituicao (chips), classe (chips), valor aplicado.
- Se instituicao = "Outros": campo de texto para nome customizado (`institution_name`). (RN-79)
- Se modo auto: ticker + quantidade.
- Se modo manual: nada extra (saldo se edita pela Sheet A).
- Se status `redeeming`: texto "O resgate foi concluido?" + opcoes "Sim, remover" / "Voltou para ativo" / "Ainda em andamento". (RN-81)
- Divisor + botao "Remover ativo" (vermelho, discreto).
- Ao tocar "Remover": inline confirmation "Remover? Historico nao e afetado." + botoes "Cancelar" / "Remover" → DELETE /api/assets/:id → toast "Ativo removido" → fecha.

Resultado: PUT /api/assets/:id com campos editados → toast "Alteracoes salvas".

### Sheet C — Cadastro (novo ativo)
Acesso: FAB `+`.
Conteudo:
1. Chips de instituicao (XP / Itau / Onze / Outros). Se "Outros" selecionado, aparece campo de texto para nome da instituicao (RN-79).
2. Chips de classe (Acao/FII / Fundo / Previdencia / Tesouro / RF / Cofrinhos / Poupanca).
3. Toggle "Automatico (ticker B3)" / "Manual (saldo no app)".
4. Campos condicionais:
   - Auto: nome, ticker, quantidade, valor aplicado.
   - Manual: nome, saldo atual, valor aplicado.
5. Warning se nome similar a ativo existente na mesma instituicao (Levenshtein <= 3). Aviso nao-bloqueante. (RN-80)
6. Botao "Adicionar ativo".

Resultado: POST /api/assets → toast "Ativo adicionado" → lista atualiza.

### Sheet D — Upload XLSX
Acesso: tela Importar, etapa 1.
Conteudo: dropzone com drag & drop + botao "Selecionar arquivo". Aceita `.xlsx` e `.xls`. Mostra nome do arquivo selecionado + tamanho. Botao "Processar" → avanca para etapa 2.

Nota: na implementacao, o upload pode ser inline na tela Importar (dropzone direto) sem sheet separada — decisao de UX.

---

## 10. Cross-cutting Features

### Ocultar valores

Toggle global no header (icone de olho). Estado persistido em `localStorage('quanto-hide')`.

Quando ativo:
- Todos os valores monetarios (R$) → `R$ *****,**`
- Todos os percentuais de ganho/perda → `**%`
- Donut chart SVG → mantem proporcoes/fatias, valores no centro e na legenda mascarados. (RN-98)
- Barra empilhada → mantem cores e proporcoes normalmente (proporcoes nao revelam valores absolutos). (RN-98)
- Graficos SVG (historico) → barras/linhas ficam com opacidade reduzida (nao somem).
- O numero-tese na Hoje → `R$ *****,**`

Implementacao: funcao `maskValue(value, type)` aplicada em todos os pontos de renderizacao.

### Saudacao por horario

```javascript
function getSaudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
```

### Persistencia de estado da UI em localStorage (v4)

Estados da UI persistidos entre sessoes e reloads:

| Chave localStorage | Valor | Onde se aplica | Default |
|---------------------|-------|----------------|---------|
| `quanto-hide` | `'hidden'` \| `'visible'` | Todas as telas — ocultar valores | `'visible'` |
| `quanto-group-mode` | `'institution'` \| `'class'` | Carteira — toggle de agrupamento (RN-90) | `'institution'` |
| `quanto-filter` | `'todos'` \| `'XP'` \| `'ITAU'` \| ... | Carteira — chip de filtro ativo (RN-90) | `'todos'` |
| `quanto-donut-mode` | `'institution'` \| `'class'` | Hoje — toggle do donut chart (RN-94) | `'institution'` |

Ao carregar cada tela, ler o valor de localStorage e aplicar antes do primeiro render para evitar flash de estado default.

### Mapeamento chips → banco

| Chip (UI) | Valor no banco (`class`) |
|-----------|-------------------------|
| Acao/FII | `ACAO` |
| Fundo | `FUNDO` |
| Previdencia | `PREVIDENCIA` |
| Tesouro | `TESOURO` |
| Renda Fixa | `RF` |
| Poupanca | `POUPANCA` |
| Cofrinho | `COFRINHO` |

| Chip (UI) | Valor no banco (`institution`) |
|-----------|-------------------------------|
| XP | `XP` |
| Itau | `ITAU` |
| Onze | `ONZE` |
| Outros | `OUTROS` (+ `institution_name` com nome customizado) |

**Ordem visual dos chips (mesma em todas as sheets e telas):**
- Instituicao: XP → Itau → Onze → Outros
- Classe: Acao/FII → Fundo → Previdencia → Tesouro → RF → Poupanca → Cofrinho

### Refresh apos acoes nas sheets

| Acao | Comportamento pos-sheet |
|------|------------------------|
| Sheet A: salvar saldo | Carteira atualiza otimisticamente. Hoje recalcula no proximo acesso ou pull to refresh |
| Sheet B: salvar edicao | Carteira atualiza otimisticamente. Se mudou instituicao/classe, ativo se move de grupo/sub-grupo |
| Sheet B: remover ativo | Ativo desaparece da lista imediatamente |
| Sheet B: mudar status resgate | Ativo se move para/de grupo "Em resgate" imediatamente |
| Sheet C: adicionar ativo | Ativo aparece na lista imediatamente. Se auto, busca cotacao assincrona |
| Import: confirmar | Navega para Carteira. Refresh completo (GET /api/portfolio) |

---

## 11. Fluxos

**F1 . Setup (uma vez, ~10 min):** instalar PWA → Carteira vazia mostra "Adicione seu primeiro ativo" → FAB + → cadastra 4 acoes auto (CPLE3/ITSA4/RANI3/BRST3) + 15 manuais com saldos reais → Hoje ja mostra o numero + donut de alocacao. Sistema cria snapshot do mes corrente automaticamente (RN-82).

**F2 . Rotina mensal (~4 min):** abre app → card de frescor por instituicao aponta quem esta vencido → Carteira → toca nos ativos ambar por instituicao → digita saldo do app → salva. Pronto ate o mes que vem.

**F3 . Consulta (10 s — o uso real):** abre app → ve o numero + donut de alocacao → fecha.

**F4 . Zero-touch:** cotacoes renovam a cada acesso (cache 15 min); snapshot mensal roda no servidor.

**F5 . Adicionar ativo:** FAB + → Sheet C → preenche campos → "Adicionar ativo" → lista atualiza imediatamente.

**F6 . Editar ativo:** `...` → Sheet B → altera campos → "Salvar alteracoes". Para ticker/qtd de acao: corrige aqui. Para saldo manual: usa Sheet A (mais rapido).

**F7 . Remover ativo:** `...` → Sheet B → "Remover ativo" → confirmacao inline → "Remover" → soft delete (status=archived) → some da lista; historico preservado.

**F8 . Fundos em resgate:** muda status para `redeeming` via Sheet B → saem do total principal → aparecem em grupo "Em resgate" (sempre no final, independente de filtros) → quando concluir: 3 desfechos possiveis (RN-81).

**F9 . Import XLSX:** tela Importar → upload planilha → parser identifica tipos → revisao com badges → confirma → ativos criados em lote → toast "12 ativos importados".

**F10 . Ocultar valores:** toque no icone de olho no header → todos os valores em todas as telas ficam mascarados → toque de novo para revelar. Donut mantem proporcoes.

**F11 . Filtrar carteira (v4):** Carteira → toque em chip "XP" → lista filtra para ativos XP, total recalcula para soma XP, barra empilhada mostra apenas distribuicao XP, contagem mostra "7 ativos". Toque em "Todos" para voltar.

**F12 . Alternar agrupamento (v4):** Carteira → toggle "Por classe" → ativos reagrupados por classe (Acoes, Fundos, Previdencia...), cada ativo com badge de instituicao. Toggle "Por instituicao" volta ao sub-agrupamento hierarquico.

---

## 12. Estrutura do repositorio

```
quanto/
├─ wrangler.toml          # d1 binding DB, assets, cron, vars
├─ schema.sql
├─ seed.sql               # 19 ativos reais (ver secao 14)
├─ src/
│  └─ index.ts            # Hono: middleware auth + rotas CRUD + cron handler
├─ public/
│  ├─ index.html
│  ├─ app.js
│  ├─ app.css
│  ├─ manifest.json
│  ├─ sw.js
│  ├─ template-quanto.xlsx # template modelo para import (RN-83)
│  ├─ fonts/              # Archivo + Inter woff2 (self-hosted)
│  ├─ icons/              # 192px + 512px
│  └─ nucleo-q/           # Board do time (nao faz parte do app)
│     ├─ index.html
│     └─ board-data.json
```

---

## 13. Template XLSX

Planilha modelo com abas por tipo de ativo (servida como asset estatico em `/template-quanto.xlsx`):

| Aba | Colunas obrigatorias | Colunas opcionais |
|-----|---------------------|-------------------|
| Acoes/FIIs | Ticker, Nome, Quantidade, Instituicao | Valor Aplicado |
| Fundos | Nome, Saldo Atual, Instituicao | Valor Aplicado |
| Previdencia | Nome, Saldo Atual, Instituicao | Valor Aplicado |
| Tesouro | Nome, Saldo Atual, Instituicao | Valor Aplicado |
| Renda Fixa | Nome, Saldo Atual, Instituicao | Valor Aplicado |
| Poupanca | Nome, Saldo Atual, Instituicao | — |
| Cofrinhos | Nome, Saldo Atual, Instituicao | — |

Validacao via dropdown nas colunas Instituicao (`XP`, `ITAU`, `ONZE`, `OUTROS`).

---

## 14. Seed real (19 ativos)

```sql
-- Seed usa user_id = 1 (Luiz, primeiro login)

-- XP . Acoes (auto)
INSERT INTO assets (user_id,institution,class,name,ticker,qty,invested,status)
VALUES
  (1,'XP','ACAO','CPLE3 . Copel','CPLE3',28,373.52,'active'),
  (1,'XP','ACAO','ITSA4 . Itausa','ITSA4',27,373.68,'active'),
  (1,'XP','ACAO','RANI3 . Irani','RANI3',41,373.10,'active');

-- XP . Ativos manuais
INSERT INTO assets (user_id,institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  (1,'XP','PREVIDENCIA','AZ Quest Luce Icatu Prev PGBL',10000.00,12362.16,'2026-06-12','active'),
  (1,'XP','FUNDO','Western Asset US Index 500 FIF',4150.21,4562.77,'2026-06-12','active'),
  (1,'XP','FUNDO','ACE Capital Multicenarios FC FIF',1447.64,1478.02,'2026-06-12','active'),
  (1,'XP','FUNDO','Trend Ouro FIF Multi RL',952.87,1261.60,'2026-06-12','active');

-- XP . Em resgate
INSERT INTO assets (user_id,institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  (1,'XP','FUNDO','Selection RF Light FIC FIRF CP LP',984.64,1099.50,'2026-06-12','redeeming'),
  (1,'XP','FUNDO','Legacy Capital Compound Advisory',1900.00,1999.63,'2026-06-12','redeeming'),
  (1,'XP','FUNDO','Trend Valor Brasil FIA RL',750.00,877.10,'2026-06-12','redeeming'),
  (1,'XP','FUNDO','Trend Fixed Income US Target Duration',124.33,135.09,'2026-06-12','redeeming');

-- Itau/ION . Acao (auto)
INSERT INTO assets (user_id,institution,class,name,ticker,qty,invested,status)
VALUES (1,'ITAU','ACAO','BRST3 . BrasilAgro','BRST3',200,586.15,'active');

-- Itau/ION . Manuais
INSERT INTO assets (user_id,institution,class,name,manual_balance,balance_updated_at,status)
VALUES
  (1,'ITAU','PREVIDENCIA','Itau Kinea Andes Prev RF CP PGBL',30566.46,'2026-06-12','active'),
  (1,'ITAU','COFRINHO','Cofrinhos ION',21867.67,'2026-06-12','active'),
  (1,'ITAU','FUNDO','Itau Kinea Andes RF CP LP',2568.37,'2026-06-12','active'),
  (1,'ITAU','POUPANCA','Poupanca MULTIDATA',302.01,'2026-06-12','active');

-- Onze . Previdencia
INSERT INTO assets (user_id,institution,class,name,invested,manual_balance,balance_updated_at,status)
VALUES
  (1,'ONZE','PREVIDENCIA','Schroder Icatu Prev Low Vol Multimercado',23968.24,23968.24,'2026-06-12','active'),
  (1,'ONZE','PREVIDENCIA','Icatu Seg FIC Empresarial Renda Fixa',8432.36,8432.36,'2026-06-12','active'),
  (1,'ONZE','PREVIDENCIA','Icatu Vanguarda Pos Fixado RF Prev',50160.95,50160.95,'2026-05-09','active');
-- Nota: Icatu Vanguarda tem balance_updated_at antiga → stale no frescor
```

---

## 15. Ordem de implementacao

1. `wrangler.toml` + D1 + `schema.sql` (com campo `institution_name`) + `wrangler d1 execute --file=schema.sql`.
2. `seed.sql` com os 19 ativos (+ user Luiz).
3. Middleware auth (JWT parsing, upsert user).
4. API Hono: GET /api/portfolio (com `byInstitution`, `byClass`, `institutionName`, cores) + GET /api/history + cron handler.
5. API Hono: POST + PUT + DELETE /api/assets (CRUD completo, suporte a `institution_name`).
6. API Hono: POST /api/import (com `institutionName`).
7. Integracao BRAPI + cache (`wrangler secret put BRAPI_TOKEN`).
8. Frontend: shell PWA + navegacao entre 4 telas.
9. Tela Hoje (numero-tese com hierarquia tipografica, frescor, **donut chart SVG + legenda + toggle**).
10. Tela Carteira (**toggle agrupamento, chips filtro, barra empilhada**, lista com sub-agrupamento, grupo "Em resgate" no final).
11. Tela Historico (grafico SVG, lista mensal, tooltip).
12. Tela Importar (wizard 3 etapas + parser SheetJS + loading state).
13. Sheets A (saldo), B (edicao + resgate 3 desfechos + soft delete), C (cadastro com warning duplicata + instituicao customizada), D (upload).
14. Cross-cutting: ocultar valores (donut+barra respeitam mascara), dark mode, formatadores, **persistencia localStorage de estado UI**.
15. PWA (manifest + sw + fontes self-hosted + icones + template XLSX).
16. Cloudflare Access na frente do hostname.
17. Smoke test dos 12 fluxos da secao 11.

**Criterio de pronto:** F3 leva <10 s do toque no icone ao numero na tela, offline incluso (ultimo estado em cache). CRUD completo funcional sem reload. Soft delete preserva snapshots. Ocultar valores nao vaza nenhum numero (donut mantem proporcoes). Dark mode legivel em todas as telas. Sub-agrupamento e filtros funcionam sem lag perceptivel. Estado UI (agrupamento, filtro, donut mode) sobrevive a reloads.

---

## 16. Identidade visual e marca

### Conceito do simbolo

A marca Quanto usa um **Q customizado** onde a cauda tradicional da letra e substituida por tres barras ascendentes. Leitura dupla intencional: **Q de Quanto** (quanto voce tem) + **grafico de barras em alta** (o patrimonio crescendo). A barra mais alta usa verde (#1F7A4D), a mesma cor dos rendimentos positivos na UI — conexao visual deliberada.

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

### Uso no codigo

**manifest.json:**
```json
{
  "name": "Quanto",
  "short_name": "Quanto",
  "description": "Quanto voce tem, de fato.",
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
- App icon: 192x192 / 512x512 (use os PNGs, nao SVG inline)

### Wordmark

```
"Quanto" + "." — onde o ponto final e sempre em #2A5A66 (Petroleo)
```

Fonte: **Archivo 800** (display/wordmark). **Inter 400-700** (corpo e dados).
Nao usar outra fonte para o wordmark. Fallback aceitavel so nos SVGs exportados: `'Arial Black', Arial, sans-serif`.

### Regras de uso

- **Nao distorcer** o simbolo — ele e sempre quadrado (1:1).
- **Nao trocar as cores** das barras: petroleo + verde sao semanticos (petroleo = ativo, verde = crescimento).
- **Fundo minimo**: o icone dark funciona sobre qualquer fundo escuro; o light sobre qualquer fundo claro. Nao usar dark sobre branco puro sem borda.
- **Tamanho minimo**: 20x20px — abaixo disso as barras desaparecem; usar so o texto "Quanto." sem icone.
- **Tagline**: "Quanto voce tem, de fato." — usa em caixa baixa nos textos, maiusculo no lockup SVG.

---

## 17. Referencia: Regras de Negocio (98 RNs)

Esta spec tecnica implementa as **98 regras de negocio** definidas na Especificacao Funcional v1.3 (`docs/SPEC_FUNCIONAL_v1.md`). Abaixo, o mapeamento por feature:

| Feature | RNs | Resumo |
|---------|-----|--------|
| F-CORE (consolidacao) | RN-01 a RN-08 | Total so inclui active; redeeming separado; calculo auto vs manual; ganho |
| F-QUOTE (cotacoes) | RN-09 a RN-14 | Cache 15min; lote BRAPI; fallback; cron diario; "ha X min" |
| F-FRESH (frescor) | RN-15 a RN-22 | 30 dias; agrupado por instituicao; barra; alerta ambar |
| F-CRUD (CRUD) | RN-23 a RN-40 | Criar, editar, saldo rapido, soft delete |
| F-VIEW (visualizacao v4) | **RN-85 a RN-98** | Sub-agrupamento, toggle, filtros, barra empilhada, donut chart, legenda, ocultar |
| F-SNAP (snapshot) | RN-41 a RN-46, RN-82 | Cron mensal; idempotente; snapshot no onboarding |
| F-IMPORT (import XLSX) | RN-47 a RN-53, RN-83, RN-84 | Client-side parse; 7 abas; template estatico; loading state |
| F-HIDE (ocultar valores) | RN-54 a RN-60 | Toggle olho; mascara R$ e %; localStorage |
| F-DARK (dark mode) | RN-61 a RN-65 | prefers-color-scheme; cores semanticas invariantes |
| F-AUTH (multi-user) | RN-66 a RN-72 | Cloudflare Access; JWT; upsert user; isolamento por user_id |
| F-PWA (offline) | RN-73 a RN-78 | Cache-first shell; network-first dados; fontes self-hosted |
| Instituicoes extensiveis | RN-79 | "Outros" + institution_name |
| Warning duplicata | RN-80 | Levenshtein <= 3, aviso nao-bloqueante |
| Fluxo resgate completo | RN-81 | 3 desfechos: remover, voltar para ativo, ainda em andamento |

---

## Changelog

| Versao | Data | Mudancas |
|--------|------|----------|
| v1 | 2026-06-12 | Spec inicial |
| v2 | 2026-06-12 | Branding, seed real, PWA, identidade visual |
| v3 | 2026-06-13 | Multi-user (Cloudflare Access + users table), Import XLSX (4a tela + SheetJS), Ocultar valores, Dark mode, 4 tabelas/7 endpoints/4 telas/4 sheets |
| v4 | 2026-06-13 | Incorpora spec funcional v1.3 (98 RNs). **Hoje:** alocacao substituida por donut chart SVG interativo com toggle instituicao/classe, legenda com cor+nome+valor, total no centro. **Carteira:** sub-agrupamento por classe dentro de instituicoes (hierarquia Inst > Classe > Ativo), toggle "por instituicao"/"por classe", chips de filtro horizontais scrollaveis, barra empilhada 8px, sub-totais recalculados por filtro, grupo "Em resgate" sempre no final independente de filtros. **Schema:** campo `institution_name` na tabela assets para instituicoes customizadas (RN-79). **API:** `byInstitution`/`byClass` com cor hex e `institutionName`; `POST /api/assets` e `POST /api/import` aceitam `institutionName`. **Cross-cutting:** persistencia localStorage de grupo, filtro e donut mode; paleta de cores para segmentos; hierarquia tipografica do numero-tese (inteiro 44px + centavos 22px); ocultar valores respeita donut e barra empilhada. **Fluxos:** F11 (filtrar carteira) e F12 (alternar agrupamento) adicionados. Template XLSX com 7 abas (Tesouro incluso). Warning de duplicata (RN-80). Resgate com 3 desfechos (RN-81). Snapshot no onboarding (RN-82). |
