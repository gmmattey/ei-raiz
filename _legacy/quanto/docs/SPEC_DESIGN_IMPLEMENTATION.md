# SPEC — Implementação do Design (Wireframes v1)

> Status: **done** — implementado em FEAT-021 (2026-06-15)  
> Aprovado em: 2026-06-14  
> Fonte: `docs/wireframes/Quanto Wireframes.dc.html`  
> Tasks: SPEC-010, FEAT-021 (redesign visual)  
> Depende de: FEAT-005, FEAT-006, FEAT-007, FEAT-008 (telas base)  
> Problemas pendentes: ver `docs/SPEC_PRODUCT_POLISH.md`

---

## 1. Contexto

Este documento traduz o handoff de design (`docs/wireframes/`) em requisitos funcionais implementáveis para o frontend vanilla JS + CSS do Quanto. O design define:

- **Direção visual:** "Calmo, confiante, quase nada de UI" — um número manda, hierarquia agressiva, respiro generoso, mono-cor petróleo
- **Shell fixo:** header + tabbar travados via `position:fixed`; só o miolo rola com `overscroll-behavior:contain`
- **Telas redesenhadas:** 4 telas + 4 sheets + 3 estados especiais
- **Correções críticas de UX:** hero lotado → hero respira; tabbar 52px → 64px; sem "samba" no Safari

As features em backlog (SPEC-007 Detalhe, SPEC-008 Aportes, SPEC-009 Bens) **não aparecem** no wireframe atual — são extensões futuras; este spec cobre apenas o que está no design.

---

## 2. Design Tokens

### 2.1 Cores

```css
:root {
  --petro:       #1B4D57;   /* primary — petróleo */
  --petro-light: #E0F2F1;   /* background badge AUTO, ícone ativo */
  --ink:         #16242F;   /* texto principal */
  --paper:       #F8FAFC;   /* background de tela */
  --border:      #EEF2F6;   /* hairlines */
  --muted:       #94A3B8;   /* labels secundários */
  --body-2:      #64748B;   /* texto terciário */
  --verde:       #16A34A;   /* gain positivo, badge MANUAL ativo */
  --verde-light: #E7F6EC;   /* background badge MANUAL */
  --vinho:       #DC2626;   /* gain negativo, remoção */
  --amber:       #D97706;   /* frescor vencido, offline */
  --amber-light: #FEF6EC;   /* background alerta amber */

  /* Cores de instituição (donut + avatar) */
  --color-xp:   #7C3AED;
  --color-itau: #F97316;
  --color-onze: #14B8A6;
}
```

### 2.2 Tipografia

```css
/* Títulos: Archivo 700/800 */
/* Corpo: Inter 400/500/600/700 */

.hero-value {
  font-family: 'Archivo', sans-serif;
  font-weight: 800;
  font-size: 48px;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.screen-title {
  font-family: 'Archivo', sans-serif;
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.02em;
}

.label-uppercase {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}
```

### 2.3 Animações

```css
@keyframes qFade {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}

@keyframes qDonut {
  from { opacity: 0; transform: rotate(-90deg) scale(.82); }
  to   { opacity: 1; transform: rotate(-90deg) scale(1); }
}

@keyframes qDraw {
  to { stroke-dashoffset: 0; }
}

@keyframes qPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .3; }
}

@keyframes qFill {
  from { width: 0; }
}
```

---

## 3. Shell — Estrutura Fixa

### 3.1 Layout base (position:fixed)

```html
<div id="shell">
  <!-- Header fixo por tela (varia entre petróleo e branco) -->
  <div id="header" role="banner"></div>

  <!-- Miolo rolável — único elemento com overflow -->
  <main id="pane" role="main"
    style="overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch;">
  </main>

  <!-- Tab bar fixa -->
  <nav id="tabbar" role="navigation"></nav>
</div>
```

```css
#shell {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  max-width: 390px;
  margin: 0 auto;
}

#pane {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* Scrollbar oculta */
#pane::-webkit-scrollbar { display: none; }
#pane { scrollbar-width: none; }
```

### 3.2 Tab bar — 64px + safe-area

```css
#tabbar {
  flex: none;
  background: #fff;
  box-shadow: 0 -1px 0 #EDF1F5, 0 -10px 28px -18px rgba(16,32,44,.2);
  padding: 9px 12px;
  padding-bottom: max(24px, env(safe-area-inset-bottom, 0px));
  display: flex;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 7px 0;
  cursor: pointer;
  font-size: 11px;
  color: var(--muted);
}

.tab-item.active { color: var(--petro); }
.tab-item.active svg { fill: var(--petro); stroke: var(--petro); }
```

**Ícones da tab bar (SVG inline 24×24):**

| Aba | Ícone inativo | Ícone ativo |
|---|---|---|
| Hoje | outline casa, stroke #94A3B8 | fill #1B4D57 |
| Carteira | outline cartão, stroke #94A3B8 | fill #E0F2F1, stroke #1B4D57 |
| Histórico | outline gráfico, stroke #94A3B8 | stroke #1B4D57, stroke-width 2.2 |
| Importar | outline upload, stroke #94A3B8 | fill #E0F2F1, stroke #1B4D57 |

---

## 4. Tela Hoje

### 4.1 Header imersivo em petróleo

```
┌──────────────────────────────────────────┐
│ STATUS BAR — petróleo (#1B4D57) · 46px  │
├──────────────────────────────────────────┤
│ Quanto.          [ícone olho]            │  ← 38px round button borda translúcida
│ ─── padding: 6px 22px ──────────────────  │
├──────────────────────────────────────────┤
│  Boa noite, Luiz                         │  ← font-size 14px, opacity .72
│                                          │
│  PATRIMÔNIO TOTAL                        │  ← label uppercase 11px, opacity .5
│  R$ 159.153,53                           │  ← Archivo 800, 48px
│                                          │
│  ▲ 57,9% · +R$ 58.335                   │  ← chip translúcido
│  ● cotações atualizadas há 4 min         │  ← dot verde pulsante
│  ─── border-radius 0 0 30px 30px ──────  │
```

**Chip de ganho:**
```css
.gain-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,.14);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}
```

**Dot de frescor de cotações:**
```css
.freshness-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7FE3B0;
  animation: qPulse 2s ease-in-out infinite;
}
```

### 4.2 Cards abaixo do hero

**Card 1 — Resgate (se existir):**
```
background: #fff
border: 1px solid #EAEFF3
border-radius: 13px
padding: 11px 14px
display: flex, gap 10px
→ ponto amber, texto "R$ X em resgate", label "não contabilizado", chevron
```

**Card 2 — Frescor de saldos manuais:**
```
background: #fff
border-radius: 16px
shadow: 0 2px 8px rgba(...).05

Conteúdo:
- Header: "Saldos manuais" + "X de Y em dia"
- Barra de progresso: height 7px, background #E8EEF2, fill #1B4D57, animated qFill
- Se há vencido: card amber inline (FEF6EC, border-radius 11px):
    ⚠ ícone + "Nome · Instituição" + "sem atualizar há X dias" + "atualizar →"
```

**Card 3 — Alocação:**
```
background: #fff
border-radius: 16px
shadow: igual

Header: "Alocação" + toggle "Instituição" / "Classe" (pill switcher)

Conteúdo:
- Donut SVG (138×138): 3 arcos coloridos + label central "TOTAL / R$ Xk"
  Animação: qDonut .7s cubic-bezier(.2,.7,.3,1) both .25s
- Lista lateral: cor (9×9 border-radius 3px) + nome + valor
```

**Donut SVG:**
```html
<svg viewBox="0 0 160 160" width="138" height="138"
  style="transform-origin:80px 80px;animation:qDonut .7s cubic-bezier(.2,.7,.3,1) both .25s">
  <!-- arcos com stroke-dasharray calculados via JS -->
  <circle cx="80" cy="80" r="54" fill="none" stroke="var(--color-onze)"
    stroke-width="17" stroke-dasharray="X 339" stroke-dashoffset="0"/>
  <!-- ... -->
</svg>
<!-- label central via position:absolute inset:0 flex center -->
```

### 4.3 Pull-to-refresh

Ao puxar o miolo > 60px, acionar `PUT /api/portfolio` (refresh manual de cotações). Indicador: spinner petróleo aparece no topo do miolo durante o fetch.

---

## 5. Tela Carteira

### 5.1 Header branco

```
background: #fff
padding: 6px 20px 14px
border-bottom: 1px solid #EEF2F6

Left: "Carteira" (Archivo 700, 22px) + "15 ativos · R$ X" (12.5px, #64748B)
Right: botão olho (38px round, borda #E2E8F0)
```

### 5.2 Controles acima da lista

**Toggle Instituição / Classe:**
```css
.view-toggle {
  display: flex;
  background: #EEF2F6;
  border-radius: 999px;
  padding: 3px;
  margin-bottom: 12px;
}
.view-toggle span {
  flex: 1;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  padding: 7px;
  border-radius: 999px;
}
.view-toggle span.active {
  background: #fff;
  color: var(--ink);
  box-shadow: 0 1px 2px rgba(16,32,44,.08);
}
.view-toggle span:not(.active) { color: var(--muted); }
```

**Chips de filtro (scroll horizontal):**
```css
.filter-chips {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  scrollbar-width: none;
  margin: 0 -20px;
  padding: 0 20px 12px;
}
.chip {
  flex: none;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
}
.chip.active { color: #fff; background: var(--petro); }
.chip:not(.active) {
  color: #475569;
  background: #fff;
  border: 1px solid #E2E8F0;
  font-weight: 500;
}
```

**Barra empilhada de alocação:**
```css
.allocation-bar {
  display: flex;
  height: 8px;
  border-radius: 5px;
  overflow: hidden;
  background: #E8EEF2;
}
.allocation-bar div { animation: qFill 1s ease both; }
```

### 5.3 Grupos e itens da lista

**Cabeçalho de grupo (instituição):**
```html
<div class="group-header">
  <span class="institution-avatar">X</span>  <!-- 22px round, cor da inst. -->
  <span class="institution-name">XP</span>
  <span class="institution-total">R$ 20.748</span>
</div>
```

**Sub-cabeçalho de classe:**
```css
.class-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .07em;
  color: var(--muted);
  padding: 10px 0 2px;
  text-transform: uppercase;
}
```

**Item de ativo:**
```html
<div class="asset-row">
  <div class="asset-info">
    <div class="asset-name-row">
      <span class="name">CPLE3 · Copel</span>
      <span class="badge badge-auto">AUTO</span>
      <!-- ou badge-manual, badge-stale -->
    </div>
    <div class="asset-meta">28 cotas · R$ 14,61</div>
    <!-- ou: "atualizado há 2 dias" para manual -->
  </div>
  <div class="asset-values">
    <span class="value">R$ 409</span>
    <span class="gain positive">+9,5%</span>
    <!-- ou class="gain negative" para vermelho -->
  </div>
  <button class="asset-menu">⋯</button>
</div>
```

```css
.asset-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid #F1F4F7;
}

/* Ativo com saldo vencido (> threshold) */
.asset-row.stale {
  background: #FEFBF5;
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 8px;
}
.asset-row.stale .asset-meta { color: var(--amber); font-weight: 600; }

.badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .04em;
  padding: 2px 5px;
  border-radius: 4px;
}
.badge-auto   { color: var(--petro); background: var(--petro-light); }
.badge-manual { color: var(--verde); background: var(--verde-light); }
.badge-stale  { color: #D97706;      background: #FBEBD7; }

.gain.positive { color: var(--verde); font-size: 11.5px; font-weight: 600; }
.gain.negative { color: var(--vinho); font-size: 11.5px; font-weight: 600; }
```

**Menu de 3 pontos por ativo:**
Toque nos `⋯` abre um action sheet (Sheet B) ou um menu inline. No design, abre Sheet B diretamente — mas com a chegada de SPEC-007 (Tela Detalhe), o comportamento muda: toque na linha → Detalhe, `⋯` → Sheet B.

### 5.4 Seção "Em Resgate"

Separada do resto por linha tracejada:
```css
.redeeming-header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 14px 0 4px;
  border-top: 1.5px dashed #D7DEE5;
  margin-top: 18px;
}
/* ícone circular com seta, vermelho, label "EM RESGATE", total */
```

Itens de resgate: nome + badge instituição + valor em cinza (#64748B) — sem gain (resgate em andamento).

### 5.5 FAB (+)

```css
.fab {
  position: absolute;
  right: 18px;
  bottom: 104px;     /* 64px tabbar + 24px safe-area + 16px margem */
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: var(--petro);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px -4px rgba(27,77,87,.55);
  z-index: 6;
  cursor: pointer;
  border: none;
}
```

---

## 6. Tela Histórico

### 6.1 Header branco

Mesmo padrão da Carteira: título "Histórico" + subtítulo "foto automática todo dia 1" + botão olho.

### 6.2 Card hero petróleo com gráfico

```html
<div class="history-hero">
  <div>
    <div class="label-uppercase" style="color:rgba(255,255,255,.55)">EVOLUÇÃO · 6 MESES</div>
    <div style="display:flex;align-items:baseline;gap:8px;margin-top:6px;">
      <span style="color:#7FE3B0;font-weight:700;font-size:15px;">+15,3%</span>
      <span style="color:rgba(255,255,255,.75);font-size:13px;">+R$ 21.153</span>
    </div>
  </div>

  <!-- SVG: linha se desenha com qDraw, área gradiente, pontos brancos -->
  <svg viewBox="0 0 300 130" width="100%" height="128">
    <defs>
      <linearGradient id="histArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#7FE3B0" stop-opacity=".35"/>
        <stop offset="100%" stop-color="#7FE3B0" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- path preenchido + polyline animada + circles nos pontos -->
  </svg>

  <!-- Labels de meses: Jan Fev Mar Abr Mai Jun -->
  <div class="month-labels">...</div>
</div>
```

```css
.history-hero {
  background: var(--petro);
  border-radius: 18px;
  padding: 18px 18px 14px;
  color: #fff;
  animation: qFade .5s ease both;
}
```

**Animação da linha SVG:**
```html
<polyline points="..."
  stroke-dasharray="320"
  stroke-dashoffset="320"
  style="animation:qDraw 1.2s ease both .2s"/>
```

### 6.3 Lista mensal

```html
<div class="month-row">
  <div>
    <div class="month-name">Junho 2026</div>
    <div class="month-label">atual</div>  <!-- ou "primeira foto" -->
  </div>
  <div class="month-values">
    <div class="month-total">R$ 159.153</div>
    <div class="month-var positive">+2,5% · +R$ 3.853</div>
    <!-- negative → color: var(--vinho) -->
  </div>
</div>
```

```css
.month-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 4px;
  border-bottom: 1px solid #EEF2F6;
}
.month-total { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
.month-var.positive { color: var(--verde); font-size: 11.5px; font-weight: 600; }
.month-var.negative { color: var(--vinho); font-size: 11.5px; font-weight: 600; }
```

---

## 7. Tela Importar

### 7.1 Header branco + Stepper

```css
.stepper {
  display: flex;
  align-items: center;
  padding: 6px 20px 16px;
  border-bottom: 1px solid #EEF2F6;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-circle.active   { background: var(--petro); color: #fff; }
.step-circle.inactive { background: #EEF2F6;      color: var(--muted); }
.step-circle.done     { background: var(--verde-light); color: var(--verde); }

.step-connector {
  flex: 1;
  height: 2px;
  background: #E2E8F0;
  margin: 0 6px;
  position: relative;
  top: -9px;   /* alinha com centro dos círculos */
}
```

### 7.2 Dropzone (Step 1)

```html
<div class="dropzone">
  <!-- ícone 64px teal -->
  <h3>Arraste sua planilha</h3>
  <p>ou toque para selecionar do dispositivo</p>
  <button class="btn-primary">Selecionar arquivo</button>
  <span class="hint">aceita .xlsx e .xls · até 5 MB</span>
</div>
```

```css
.dropzone {
  border: 2px dashed #C7D2DC;
  border-radius: 20px;
  background: #fff;
  padding: 40px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: qFade .5s ease both;
}
```

### 7.3 Card template logo abaixo

```html
<div class="template-card">
  <div class="icon-green">↓</div>
  <div>
    <div>Baixar template</div>
    <div class="hint">modelo com 7 abas pré-formatadas</div>
  </div>
  <svg><!-- download arrow --></svg>
</div>
```

### 7.4 Chips "O template traz"

```html
<div class="template-features">
  <div class="features-label">O TEMPLATE TRAZ</div>
  <div class="chip-grid">
    <span>Ações/FIIs</span>
    <span>Fundos</span>
    <span>Previdência</span>
    <span>Tesouro</span>
    <span>Renda Fixa</span>
    <span>Poupança</span>
    <span>Cofrinhos</span>
  </div>
</div>
```

---

## 8. Sheets (Bottom Sheets)

### 8.1 Estrutura base de sheet

```html
<!-- Backdrop -->
<div class="sheet-backdrop" style="position:fixed;inset:0;background:rgba(13,28,38,.5);backdrop-filter:blur(2px);z-index:10;"></div>

<!-- Sheet -->
<div class="sheet" style="position:fixed;left:0;right:0;bottom:0;background:#fff;border-radius:26px 26px 0 0;z-index:11;animation:qFade .4s ease both;">
  <div class="sheet-drag-handle"></div>
  <!-- conteúdo -->
</div>
```

```css
.sheet-drag-handle {
  width: 38px;
  height: 4px;
  border-radius: 99px;
  background: #D7DEE5;
  margin: 14px auto 18px;
}

.sheet-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.sheet-footer {
  padding: 14px 22px;
  padding-bottom: max(30px, env(safe-area-inset-bottom, 30px));
  border-top: 1px solid #EEF2F6;
}
```

---

### 8.2 Sheet A — Saldo Rápido

Acessado via: alerta de frescor na Tela Hoje → "atualizar" OU swipe no ativo manual na Carteira.

```
[drag handle]
Nome do Ativo                           [✕]
● Instituição · Classe

[⚠ sem atualizar há X dias]            ← card amber, se vencido

NOVO SALDO
┌──────────────────────────────────────┐
│  R$  50.840,00  |                    │  ← Archivo 700, 28px, cursor pulsante
└──────────────────────────────────────┘
último: R$ 50.160,95 · há 35 dias      ← 12px #94A3B8

[✓ Salvar saldo]                        ← full width, petróleo
o frescor renova automaticamente ao salvar
[home indicator]
```

```css
.balance-input-display {
  border: 1.5px solid var(--petro);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.balance-prefix {
  font-family: 'Archivo', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: #64748B;
}
.balance-value {
  font-family: 'Archivo', sans-serif;
  font-weight: 700;
  font-size: 28px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.balance-cursor {
  width: 2px;
  height: 30px;
  background: var(--petro);
  animation: qPulse 1.1s steps(1) infinite;
}
```

**Comportamento:** input `inputmode="decimal"`, foco automático ao abrir. Máscara BRL (já implementada via `maskCurrency`).

---

### 8.3 Sheet C — Novo Ativo

Acessado via FAB (+) na Carteira.

```
[drag handle]
Novo ativo                              [✕]

INSTITUIÇÃO
[● XP]  [Itaú]  [Onze]  [Outros]       ← chips de seleção

CLASSE
[Ações/FII]  [Fundo]  [Previdência]    ← chips (mais chips abaixo se necessário)
[Tesouro]    [Renda Fixa]  [Poupança]
[Cofrinho]

[Automático · ticker B3] / [Manual]    ← toggle se classe suporta auto

— campos condicionais —
Auto: Nome + Ticker + Quantidade + Valor aplicado (opcional)
Manual: Nome + Saldo atual
Fundo CVM: Nome do fundo ou CNPJ (busca)

[⚠ Este nome lembra "VALE3" já cadastrado]  ← aviso não-bloqueante, se duplicata

─── rodapé fixo ───
[Adicionar ativo]
```

**Campos condicionais por classe:**

| Classe | Modo disponível | Campos |
|---|---|---|
| ACAO / FII | Auto | Ticker + Quantidade + Valor aplicado |
| FUNDO | CVM | Busca por nome ou CNPJ |
| RF / TESOURO | Manual | Saldo atual |
| PREVIDENCIA / POUPANCA / COFRINHO | Manual | Saldo atual |

---

### 8.4 Sheet B — Editar Ativo

Acessado via: `⋯` no ativo da Carteira (ou "Editar" na Tela Detalhe, SPEC-007).

Sheet full-height (top: 78px = altura status bar + header Carteira):

```
[drag handle]
Editar ativo                            [✕]

──── campos rolam ────────────────────────

Nome
[AZ Quest Luce Icatu Prev              ]

Instituição
[● XP]  [Itaú]  [Onze]

Classe
[● Previdência]  [Fundo]

Valor aplicado
[R$ 10.000,00                          ]

──── zona de perigo ──────────────────────
┌─────────────────────────────────────────┐
│  Remover este ativo?                    │
│  O histórico de patrimônio não é afet. │
│  [Cancelar]  [Remover]  ← btn vermelho │
└─────────────────────────────────────────┘

─── rodapé fixo ───
[Salvar alterações]
```

**Zona de perigo:** card `#FEF2F2`, borda `#FBD9D9`, confirmação inline (não `window.confirm()`).

**Resgate:** se `status = 'redeeming'`, mostrar section com 3 opções:
- "Resgate chegou → remover ativo"
- "Resgate cancelado → voltar para ativo"
- "Ainda em andamento → manter"

---

### 8.5 Sheet D — Upload / Processando

```
[drag handle]
Importar planilha                       [✕]

┌──────────────────────────────────────┐
│ 📄 Quanto_ativos.xlsx    ✓           │
│    24 KB · 7 abas                    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│           [spinner animado]          │
│    Processando planilha…             │
│  identificando tipos e instituições  │
└──────────────────────────────────────┘

[Processando…]  ← btn desabilitado, cinza
[home indicator]
```

**Spinner SVG animado:**
```html
<svg width="30" height="30" viewBox="0 0 50 50">
  <circle cx="25" cy="25" r="20" fill="none" stroke="#DCE3EA" stroke-width="5"/>
  <circle cx="25" cy="25" r="20" fill="none" stroke="#1B4D57" stroke-width="5"
    stroke-linecap="round" stroke-dasharray="40 126"
    transform="rotate(-90 25 25)">
    <animateTransform attributeName="transform" type="rotate"
      from="-90 25 25" to="270 25 25" dur="0.9s" repeatCount="indefinite"/>
  </circle>
</svg>
```

---

## 9. Estados Especiais

### 9.1 Vazio / Onboarding (Carteira sem ativos)

```
[header Carteira: "nenhum ativo ainda"]

[ícone cartão 104px, gradient E0F2F1→F0F8F7]
  [badge + petróleo right-top]

Vamos montar sua carteira
"Adicione um ativo de cada vez ou traga
tudo de uma planilha. Em minutos você
vê o seu número."

[+ Adicionar primeiro ativo]   ← petróleo, full width
[↑ Importar planilha]          ← outline petróleo, full width
```

Exibido quando `assets.length === 0`. Ocultados: filtros, lista, FAB (o botão de CTA substitui o FAB).

Regra RN-BUG-006 (já implementada): quando vazio, ocultar `display:none` todos os elementos de dados.

### 9.2 Offline / Sem conexão (Tela Hoje)

Header mantém petróleo mas com chip "offline" no lugar do botão olho:

```css
.offline-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,.14);
  padding: 6px 11px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  color: #fff;
}
```

Dot de frescor muda: `#B7791F` (amber) em vez de `#7FE3B0` (verde), texto "valores salvos · não atualizados agora".

Card de aviso amber (logo abaixo do hero):
```
⚠ Você está sem conexão
"Mostrando o último estado salvo de [data].
Cotações da B3 voltam assim que reconectar."
[↺ Tentar novamente]
```

Card de alocação com label "cache de [data]" e opacidade reduzida nas barras.

### 9.3 Ocultar Valores

Toggle via botão olho no header de cada tela. Estado persistido em `localStorage` (`quanto_hidden_values`).

Quando ativado: todos os valores monetários substituídos por `••••••`. Aplica a:
- Número-tese hero
- Chip de ganho
- Valores na lista de ativos
- Totais de grupos e instituições
- Valores no histórico
- Campos de saldo nas sheets

```js
function toggleHideValues() {
  const hidden = !JSON.parse(localStorage.getItem('quanto_hidden_values') || 'false')
  localStorage.setItem('quanto_hidden_values', JSON.stringify(hidden))
  document.querySelectorAll('[data-value]').forEach(el => {
    el.textContent = hidden ? '••••••' : el.dataset.value
  })
  // atualiza ícone olho (aberto/fechado)
}
```

---

## 10. Regras de Negócio do Design

| ID | Regra |
|---|---|
| RN-UI-01 | Shell position:fixed; NUNCA usar overflow:auto no body ou html |
| RN-UI-02 | Tab bar: mínimo 64px + env(safe-area-inset-bottom) — nunca height fixo |
| RN-UI-03 | Status bar imersiva em petróleo na Tela Hoje; branca nas demais |
| RN-UI-04 | Ícone de tab ativo: fill petróleo; inativo: stroke #94A3B8 |
| RN-UI-05 | Números monetários com font-variant-numeric:tabular-nums |
| RN-UI-06 | Centavos em Arquivo 700 24px (60% opacidade branca) no hero |
| RN-UI-07 | Gain positivo: triângulo verde + %; negativo: vinho; ambos no mesmo chip |
| RN-UI-08 | Dot de cotação: verde pulsante se atualizado; amber se offline |
| RN-UI-09 | Ativo vencido: highlight amber inline na linha (não só card de frescor) |
| RN-UI-10 | Badge AUTO: teal claro / petróleo; MANUAL: verde claro / verde |
| RN-UI-11 | Badge de vencimento (>threshold): amber sobre fundo #FBEBD7 |
| RN-UI-12 | FAB: 56px, border-radius 18px, shadow petróleo, bottom = tabbar + safe-area + 16px |
| RN-UI-13 | Animação de entrada dos cards: qFade staggered (0.05s, .12s, .19s…) |
| RN-UI-14 | Donut: animação qDonut ao entrar na viewport |
| RN-UI-15 | Gráfico do Histórico: linha se desenha com qDraw 1.2s |
| RN-UI-16 | Sheets: backdrop blur(2px), shadow 0 -16px 48px -12px rgba |
| RN-UI-17 | Remoção de ativo: confirmação inline no Sheet B (não `window.confirm`) |
| RN-UI-18 | Dropzone: border 2px dashed, arredondado, nada mais |
| RN-UI-19 | Estado offline: último número salvo com data explícita + amber badge |
| RN-UI-20 | Ocultar valores: persistido em localStorage, aplica a todos os valores |
| RN-UI-21 | XP = roxo #7C3AED; Itaú = laranja #F97316; Onze = teal #14B8A6 — consistente no donut, avatar e barra |
| RN-UI-22 | Seção "Em Resgate" separada por linha dashed; valores em cinza |
| RN-UI-23 | Aviso de duplicata no Sheet C: não-bloqueante, inline abaixo do campo |
| RN-UI-24 | Home indicator (iPhone): 5px × 120px, #16242F, nos sheets |
| RN-UI-25 | Pull-to-refresh na Tela Hoje: aciona refresh de cotações |

---

## 11. O que o Design NÃO Cobre (features de backlog)

| Feature | Spec | Nota de integração |
|---|---|---|
| Tela de Detalhe do Ativo | SPEC-007 | Tap na linha da Carteira: atualmente → Sheet B. Com SPEC-007: → Tela Detalhe. `⋯` → Sheet B |
| Aportes Adicionais | SPEC-008 | Sheet E (novo) acessado via Detalhe |
| Bens e Garantias | SPEC-009 | 5a aba na tabbar; não afeta as 4 telas atuais |
| Benchmarks Macro | SPEC-006 | Adição ao card de Alocação (linha CDI/SELIC embaixo) |
| Análise IA | SPEC-005 | Botão "✦ Analisar" na Tela Hoje, Carteira e Detalhe |
| Smart Labels | SPEC-005 | Usa `display_name` em vez de `name` nos itens da Carteira |

---

## 12. Checklist de Implementação

### FEAT-021 — Redesign Visual (DONE — 2026-06-15)

**Shell e navegacao:**
- [x] Converter shell para position:fixed com miolo rolavel
- [x] Tab bar: 64px + env(safe-area-inset-bottom), icones 24px
- [x] Icones SVG por aba: outline inativo, fill/petroleo ativo
- [ ] Animacao de transicao entre abas → movido para SPEC_PRODUCT_POLISH.md #5.4

**Tokens e fundacao:**
- [x] Atualizar CSS variables com as cores do design
- [x] Aplicar font-variant-numeric:tabular-nums em todos os valores monetarios
- [x] Definir animacoes globais (qFade, qDonut, qDraw, qPulse, qFill)

**Tela Hoje:**
- [x] Hero petroleo com status bar imersiva
- [x] Numero-tese 48px + centavos 24px separados
- [x] Chip de ganho (translucido sobre petroleo)
- [x] Dot verde pulsante de frescor (amber offline)
- [x] border-radius 0 0 30px 30px no hero
- [x] Card de resgate (condicional)
- [x] Card de frescor com barra animada + alerta inline
- [x] Card de alocacao com donut SVG animado + toggle Instituicao/Classe
- [x] Cores de instituicao consistentes (XP roxo, Itau laranja, Onze teal)
- [x] Pull-to-refresh (RN-UI-25)

**Tela Carteira:**
- [x] Header branco com toggle + chips de filtro horizontal
- [x] Barra empilhada de alocacao (8px, animada)
- [x] Avatar de instituicao 22px redondo com cor
- [x] Itens com badge AUTO/MANUAL/stale, gain colorido
- [x] Destaque amber inline para ativos vencidos
- [x] Secao "Em Resgate" com separador dashed
- [x] FAB 56px border-radius 18px
- [x] Menu ... por ativo

**Tela Historico:**
- [x] Card hero petroleo com grafico SVG animado
- [x] Linha desenhada com qDraw
- [x] Area com gradiente translucido
- [x] Pontos nos meses (circle branco/verde)
- [x] Labels de meses embaixo
- [x] Lista mensal com gain em vinho para negativos

**Tela Importar:**
- [x] Stepper sempre visivel (1/2/3)
- [x] Dropzone com dashed border
- [x] Card de template imediato abaixo
- [x] Chips do template
- [x] Sheet D: arquivo confirmado + spinner SVG animado + CTA desabilitado

**Sheets:**
- [x] Sheet A: input gigante, alerta de frescor amber condicional
- [x] Sheet B: campos com chips de selecao, zona de perigo inline
- [x] Sheet C: selecao de instituicao + classe + campos condicionais por tipo
- [x] Sheet D: estado de loading com spinner animado
- [ ] Sheet drag-to-dismiss → movido para SPEC_PRODUCT_POLISH.md #3

**Estados:**
- [x] Vazio/Onboarding: dois CTA, icone, copy motivacional
- [x] Offline: banner amber, botao "Tentar novamente"
- [x] Ocultar valores: botao olho, localStorage, classe `.masked`

**Problemas pendentes identificados pos-implementacao:**
- [ ] CSS faltante: Tela Bens (~5 classes) → SPEC_PRODUCT_POLISH.md #2.1
- [ ] CSS faltante: Tela Detalhe (~20 classes) → SPEC_PRODUCT_POLISH.md #2.2
- [ ] Sheets nao recolhem por gesto (drag-to-dismiss) → SPEC_PRODUCT_POLISH.md #3
- [ ] Botoes sem loading state → SPEC_PRODUCT_POLISH.md #4
- [ ] Sem transicao entre tabs → SPEC_PRODUCT_POLISH.md #5.4
- [ ] Sem skeleton loading → SPEC_PRODUCT_POLISH.md #5.5

---

## 13. Referência de arquivos

```
docs/wireframes/
├── Quanto Wireframes.dc.html   ← arquivo de design principal (abrir no browser)
├── support.js                  ← runtime do design tool
├── fonts/                      ← Archivo + Inter woff2 (same as production)
└── _ref/
    ├── check-hoje.png          ← screenshot de validação Tela Hoje
    ├── check-telas.png         ← screenshot das 4 telas juntas
    ├── 01-check2.png           ← validação das sheets
    ├── 02-check2.png
    └── 03-check2.png
```

Para visualizar o design em alta fidelidade: abrir `docs/wireframes/Quanto Wireframes.dc.html` no browser.
