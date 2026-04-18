# Esquilo Invest — Mobile Design Specification
**Versão:** 1.0 | **Data:** 2026-04-17 | **Target:** Codex / Dev implementação mobile

> **Como usar este documento:**
> Cada tela é autossuficiente. Leia o "Design System" primeiro (Seção 0), ele define todos os tokens reutilizáveis.
> Os wireframes usam grade de 375 × 812 px (iPhone 14 padrão). Todos os espaçamentos em `px`.
> Cada tela lista: Layout, Componentes, Tipografia, Comportamento e Estados (vazio/loading/erro).

---

## 0. Design System

### 0.1 Paleta de Cores

| Token | Light Mode | Dark Mode | Uso |
|---|---|---|---|
| `--brand-orange` | `#F56A2A` | `#F56A2A` | Ação primária, CTA, badge ativo, highlight |
| `--bg-primary` | `#FDFCFB` | `#0B1218` | Fundo de tela |
| `--bg-card` | `#FFFFFF` | `#161E26` | Cards, painéis, bottom sheets |
| `--bg-card-alt` | `#FAFAFA` | `#1A2330` | Cards secundários, linhas alternadas |
| `--bg-input` | `#F5F0EB` | `#1F2937` | Campos de input, chips |
| `--text-primary` | `#0B1218` | `#FDFCFB` | Texto principal, títulos |
| `--text-secondary` | `#6B7280` | `#A0AEC0` | Labels, subtítulos, metadados |
| `--text-muted` | `#9CA3AF` | `#4B5563` | Placeholder, dica, desabilitado |
| `--border` | `#EFE7DC` | `#2D3748` | Bordas de card, dividers, separadores |
| `--success` | `#6FCF97` | `#6FCF97` | Ganho, positivo, verde |
| `--danger` | `#E85C5C` | `#E85C5C` | Perda, alerta crítico, vermelho |
| `--warning` | `#F2C94C` | `#F2C94C` | Atenção, oportunidade, amarelo |
| `--overlay` | `rgba(11,18,24,0.5)` | `rgba(0,0,0,0.7)` | Overlay de modal/bottom sheet |
| `--nav-bg` | `#FFFFFF` | `#111820` | Fundo da bottom navigation bar |
| `--nav-border` | `#EFE7DC` | `#1F2D3D` | Borda superior da nav bar |

### 0.2 Tipografia

| Uso | Família | Peso | Tamanho | Line-height |
|---|---|---|---|---|
| Headline Large | Sora | 700 | 28px | 34px |
| Headline Medium | Sora | 700 | 22px | 28px |
| Headline Small | Sora | 600 | 18px | 24px |
| Title | Sora | 600 | 16px | 22px |
| Body Large | Inter | 400 | 16px | 24px |
| Body Medium | Inter | 400 | 14px | 20px |
| Body Small | Inter | 400 | 12px | 16px |
| Label | Inter | 600 | 12px | 16px |
| Label Small | Inter | 500 | 11px | 14px |
| Number Large | Sora | 700 | 32px | 38px |
| Number Medium | Sora | 600 | 20px | 26px |
| Caption | Inter | 400 | 11px | 14px |

### 0.3 Espaçamento (Sistema 4px)

| Token | Valor | Uso |
|---|---|---|
| `space-xs` | 4px | Gaps internos mínimos |
| `space-sm` | 8px | Padding interno de chip/badge |
| `space-md` | 12px | Gap entre elementos de card |
| `space-lg` | 16px | Padding lateral da tela |
| `space-xl` | 20px | Gap entre seções |
| `space-2xl` | 24px | Padding de card |
| `space-3xl` | 32px | Margem entre blocos |
| `space-4xl` | 48px | Espaçamento de seção maior |

### 0.4 Bordas e Sombras

| Token | Valor |
|---|---|
| `radius-sm` | 8px |
| `radius-md` | 12px |
| `radius-lg` | 16px |
| `radius-xl` | 20px |
| `radius-full` | 9999px |
| `shadow-card` | `0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)` |
| `shadow-card-dark` | `0 1px 4px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)` |
| `shadow-nav` | `0 -1px 0 var(--nav-border)` |
| `shadow-modal` | `0 -4px 24px rgba(0,0,0,0.12)` |

### 0.5 Ícones

Biblioteca: **Lucide React** (tamanho padrão 20px, stroke-width: 1.5).
- Bottom nav icons: 22px
- Action icons em botões: 18px
- Inline icons: 16px

### 0.6 Componentes Atômicos Reutilizáveis

#### Badge de Categoria
```
╔══════════════╗
║  • Ações     ║   bg: var(--bg-input), radius: radius-full
╚══════════════╝   padding: 4px 10px, Label Small, cor: var(--text-secondary)
```

#### Badge de Status (ganho/perda)
```
╔═══════════╗
║ +12,4%    ║   bg: success/10% opacity  |  text: --success
╚═══════════╝   bg: danger/10% opacity   |  text: --danger
               padding: 3px 8px, radius: radius-full, Label Small
```

#### Chip Ativo/Inativo (filtro)
```
ATIVO:   ╔══════════╗  bg: --brand-orange, text: white
         ║ Todos    ║  padding: 6px 14px, radius: radius-full
         ╚══════════╝  Label
         
INATIVO: ╔══════════╗  bg: --bg-input, text: --text-secondary
         ║ Ações    ║  padding: 6px 14px, radius: radius-full
         ╚══════════╝  Label
```

#### Botão Primário
```
╔══════════════════════════════╗
║         CONTINUAR            ║  bg: --brand-orange, text: white
╚══════════════════════════════╝  height: 52px, radius: radius-lg, Title
                                   width: 100%, shadow-card
```

#### Botão Secundário
```
╔══════════════════════════════╗
║         VER DETALHES         ║  bg: transparent, border: 1.5px --border
╚══════════════════════════════╝  text: --text-primary, height: 44px, radius: radius-lg
```

#### Botão Ghost (texto)
```
║  Esqueci minha senha  ║  text: --brand-orange, no bg, no border
                           Label, touch target mínimo 44px
```

#### Card Base
```
╔══════════════════════════════════╗
║                                  ║  bg: --bg-card, radius: radius-lg
║    conteúdo                      ║  padding: 20px, shadow: shadow-card
║                                  ║  border: 1px solid --border (light apenas)
╚══════════════════════════════════╝
```

#### Input Field
```
 Label de campo
╔══════════════════════════════════╗
║  Placeholder texto...            ║  bg: --bg-input, radius: radius-md
╚══════════════════════════════════╝  height: 52px, padding: 0 16px
                                       Body Large, border: 1.5px solid --border
                                       FOCUS: border: 1.5px solid --brand-orange
```

#### Divider
```
──────────────────────────────────  altura: 1px, cor: --border
```

---

## 1. Navegação Global — Bottom Navigation Bar

**Posição:** Fixed bottom, z-index: 100
**Dimensões:** largura 100%, altura 64px (+ safe area iOS: adicionar padding-bottom = env(safe-area-inset-bottom))
**Background:** `--nav-bg`
**Borda superior:** 1px solid `--nav-border`

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │  ← tela acima
├─────────────────────────────────────────────────────────────┤
│  [🏠]    [💼]    [💡]    [🎯]    [👤]                      │  64px
│ Início  Carteira Insights Decisões Perfil                   │
└─────────────────────────────────────────────────────────────┘
 ←─────────────── safe-area-inset-bottom ──────────────────→
```

**Cada item de navegação:**
- Área clicável: flex 1, flex-col, align-center, justify-center, min-height 64px
- Ícone: 22px, stroke-width 1.5
- Label: Label Small (11px, Inter 500), margin-top: 4px
- **Ativo:** ícone `--brand-orange` (filled/solid quando aplicável), label `--brand-orange`, dot indicator opcional 2px sob ícone
- **Inativo:** ícone `--text-muted`, label `--text-muted`
- Transição: cor e opacidade em 150ms ease

**Rotas por tab:**
| Tab | Ícone Lucide | Rota principal | Rotas filhas |
|---|---|---|---|
| Início | `Home` | `/home` | — |
| Carteira | `Briefcase` | `/carteira` | `/carteira/:cat`, `/ativo/:ticker`, `/aportes`, `/historico`, `/importar` |
| Insights | `Lightbulb` | `/insights` | — |
| Decisões | `Target` | `/decisoes` | `/decisoes/*` |
| Perfil | `User` | `/perfil` | `/perfil-de-risco`, `/configuracoes` |

**Regra:** Tab fica "ativo" se a rota atual começa com a rota principal do tab.

---

## 2. Fluxo de Autenticação

### TELA 2.1 — Login / Landing

**Rota:** `/`
**Sem bottom nav** (tela pública)
**Dimensões:** 375 × 812px (full screen, sem bottom nav)

```
┌─────────────────────────────────┐ 0
│                                 │
│                                 │
│          ┌──────────┐           │ 
│          │  🐿️ logo │           │ 140px from top
│          │  ESQUILO │           │ logo: 80×80px, radius-xl
│          │  INVEST  │           │ Label: Sora 700 20px --text-primary
│          └──────────┘           │
│                                 │
│  Gerencie seu patrimônio        │ Headline Medium (22px Sora 700) center
│  com clareza e inteligência     │ --text-primary, margin-top: 24px
│                                 │
│  Sua plataforma de gestão       │ Body Medium (14px Inter) center
│  patrimonial completa           │ --text-secondary, margin-top: 8px
│                                 │
│                                 │ margin-top: 48px
│  ╔═══════════════════════════╗  │
│  ║  📧  E-mail               ║  │ Input Field (height 52px)
│  ╚═══════════════════════════╝  │ margin-bottom: 12px
│                                 │
│  ╔═══════════════════════════╗  │
│  ║  🔒  Senha            👁  ║  │ Input Field + toggle visibilidade
│  ╚═══════════════════════════╝  │
│                                 │
│              Esqueci minha senha│ Ghost btn, align: right, margin-top: 8px
│                                 │
│  ╔═══════════════════════════╗  │ margin-top: 24px
│  ║         ENTRAR            ║  │ Botão Primário (52px)
│  ╚═══════════════════════════╝  │
│                                 │
│      ─────────── ou ──────────  │ Body Small --text-muted, margin-top: 20px
│                                 │
│  ╔═══════════════════════════╗  │ margin-top: 16px
│  ║  [G]  Entrar com Google   ║  │ Botão Secundário (48px)
│  ╚═══════════════════════════╝  │ ícone Google 20px à esquerda
│                                 │
│     Ainda não tem conta?        │ Body Small --text-secondary, center
│     Criar conta                 │ "Criar conta" em --brand-orange
│                                 │ margin-top: 24px
│                                 │
└─────────────────────────────────┘ 812

Safe areas: padding-top: env(safe-area-inset-top) + 24px
            padding-horizontal: 24px
```

**Estados de erro:**
```
┌─────────────────────────────────┐
│  ╔═══════════════════════════╗  │
│  ║  📧  email inválido       ║  │ border: 1.5px --danger
│  ╚═══════════════════════════╝  │
│  ⚠ E-mail ou senha incorretos  │ Body Small, --danger, margin-top: 6px
└─────────────────────────────────┘
```

**Loading state:** Botão ENTRAR desabilitado + spinner branco dentro do botão (16px)

---

### TELA 2.2 — Onboarding (3 passos)

**Rota:** fluxo interno após primeiro login
**Sem bottom nav**

**Componente de progresso (topo):**
```
┌─────────────────────────────────┐
│ ←          Passo 1 de 3         │ ← ícone ArrowLeft 20px, Title center
├─────────────────────────────────┤
│  ●──────────○──────────○        │ 3 dots: ativo=--brand-orange filled (10px)
│                                  │ inativo=--border (8px), linha: 1px --border
└─────────────────────────────────┘ margin-bottom: 32px
```

**Passo 1 — Estilo de visualização:**
```
┌─────────────────────────────────┐
│                                 │ padding: 24px
│  Como prefere ver seus          │ Headline Small (18px Sora 600)
│  investimentos?                 │ --text-primary
│                                 │
│  Escolha seu estilo de exibição │ Body Medium --text-secondary, margin-top: 8px
│  padrão.                        │
│                                 │ margin-top: 32px
│  ╔═══════════════════════════╗  │
│  ║  [👁] Valores visíveis    ║  │ Card selecionável (radius-lg, padding: 16px)
│  ║  Vejo tudo por padrão     ║  │ SELECIONADO: border 2px --brand-orange
│  ╚═══════════════════════════╝  │                bg: orange/5% opacity
│                                 │ margin-top: 12px
│  ╔═══════════════════════════╗  │
│  ║  [🙈] Valores ocultos     ║  │ Card selecionável
│  ║  Prefiro privacidade       ║  │ NORMAL: border 1.5px --border, bg: --bg-card
│  ╚═══════════════════════════╝  │
│                                 │
│  ╔═══════════════════════════╗  │ position: absolute, bottom: 32px
│  ║       CONTINUAR           ║  │ + safe-area-inset-bottom
│  ╚═══════════════════════════╝  │ Botão Primário
└─────────────────────────────────┘
```

**Passo 2 — Dados financeiros:**
```
┌─────────────────────────────────┐
│                                 │ padding: 24px
│  Nos conte sobre sua situação   │ Headline Small
│  financeira                     │
│                                 │
│  Renda mensal bruta             │ Label, margin-top: 24px
│  ╔═══════════════════════════╗  │
│  ║  R$ ___.___.___,__        ║  │ Input mascarado (máscara BRL)
│  ╚═══════════════════════════╝  │
│                                 │
│  Reserva de emergência          │ Label, margin-top: 16px
│  ╔═══════════════════════════╗  │
│  ║  R$ ___.___.___,__        ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  Aporte mensal planejado        │ Label, margin-top: 16px
│  ╔═══════════════════════════╗  │
│  ║  R$ ___.___.___,__        ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  Horizonte de investimento      │ Label, margin-top: 16px
│  ┌───────┐ ┌───────┐ ┌───────┐ │ 3 chips de seleção (radius-full)
│  │ Curto │ │Médio  │ │ Longo │ │ Label Small, padding: 8px 16px
│  └───────┘ └───────┘ └───────┘ │ SELECIONADO: bg --brand-orange, text white
│                                 │
│  ╔═══════════════════════════╗  │
│  ║       CONTINUAR           ║  │
│  ╚═══════════════════════════╝  │
└─────────────────────────────────┘
```

**Passo 3 — Importar ativos:**
```
┌─────────────────────────────────┐
│                                 │ padding: 24px
│  Adicione seus investimentos    │ Headline Small
│                                 │
│  Você pode importar do banco    │ Body Medium --text-secondary, margin-top: 8px
│  ou adicionar manualmente.      │
│                                 │ margin-top: 32px
│  ╔═══════════════════════════╗  │ Card grande (padding: 20px)
│  ║  [⬆] Importar planilha   ║  │ ícone: 32px --brand-orange
│  ║       Excel/CSV           ║  │ Title bold, Body Small --text-secondary
│  ║  Arraste ou toque aqui    ║  │
│  ╚═══════════════════════════╝  │ border: 2px dashed --border
│                                 │
│  ────────── ou ──────────       │ margin: 20px 0
│                                 │
│  ╔═══════════════════════════╗  │ Botão Secundário
│  ║  [+] Adicionar manualmente║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  ╔═══════════════════════════╗  │ margin-top: 12px
│  ║  Fazer isso depois →      ║  │ Botão Ghost
│  ╚═══════════════════════════╝  │
└─────────────────────────────────┘
```

---

## 3. INÍCIO — Tab 1

**Rota:** `/home`
**Com bottom nav** (64px fixo)

```
┌─────────────────────────────────┐ 0
│  [safe-area-top]                │
├─────────────────────────────────┤
│  Bom dia, Luiz 🐿              │ Headline Small (18px Sora 600) --text-primary
│                  [👁] [🔔]     │ ícones à direita: 20px --text-secondary
│                                 │ padding: 20px 16px 12px
├─────────────────────────────────┤
│                                 │ ← scroll vertical livre
│  ┌─────────────────────────────┐│ CARD PATRIMÔNIO (padding: 20px)
│  │ Patrimônio total            ││ Label --text-secondary
│  │                             ││
│  │ R$ 1.234.567,89             ││ Number Large (32px Sora 700) --text-primary
│  │                             ││ margin-top: 4px
│  │  +12,4%  ━━━━━━━━━━━━━━━━━ ││ Badge ganho + sparkline
│  │  nos últimos 12 meses       ││ Body Small --text-secondary
│  │                             ││ margin-top: 8px
│  │ ─────────────────────────── ││ divider
│  │                             ││
│  │ SCORE  ██████░░░░  742/1000 ││ gauge linear simplificado (no mobile)
│  │ [🟢 Estável]               ││ Badge status: cor dinâmica
│  └─────────────────────────────┘│ bg: --bg-card, radius-xl, shadow-card
│                                 │ margin: 0 16px
│                                 │ margin-top: 16px
│  ┌─────────────────────────────┐│ CARD DISTRIBUIÇÃO (padding: 16px)
│  │ Distribuição                ││ Label --text-secondary
│  │                             ││ margin-bottom: 8px
│  │  [🥧 Donut Chart 120px]    ││ Recharts PieChart, center
│  │  Invest. 68%                ││ Legenda em coluna à direita do donut
│  │  Bens    22%                ││ Body Small, cor por categoria
│  │  Poupança 10%               ││
│  └─────────────────────────────┘│ bg: --bg-card, radius-xl, shadow-card
│                                 │ margin: 0 16px
│                                 │ margin-top: 12px
│  ─ Acesso rápido ───────────── │ Label --text-secondary, padding: 0 16px
│                                 │ margin: 16px 0 8px
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │ GRID de ações rápidas: 4 colunas
│  │ ⬆ │ │ 📊 │ │ 💡 │ │ 📄 │  │ cada item: ícone 24px + label 10px embaixo
│  │Imp │ │Gráf│ │ AI │ │Ext │  │ bg: --bg-card, radius-lg, shadow-card
│  └────┘ └────┘ └────┘ └────┘  │ tamanho: 78px × 72px
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │ 2 linhas × 4 = 8 ações
│  │ 🎯 │ │ 💳 │ │ ⚙ │ │ + │  │ gap: 8px
│  │Dec │ │Hist│ │Conf│ │Add │  │
│  └────┘ └────┘ └────┘ └────┘  │ padding: 0 16px
│                                 │ margin-top: 12px
│  ─ Insights recentes ───────── │ Label + "Ver todos →" --brand-orange
│                                 │ padding: 0 16px, margin: 16px 0 8px
│  ┌─────────────────────────────┐│ CARD INSIGHT PREVIEW (compact)
│  │ [🟡] Oportunidade           ││ Badge tipo: amarelo, Label Small
│  │ Sua renda fixa está         ││ Body Medium --text-primary (2 linhas)
│  │ rendendo abaixo do CDI      ││ 
│  │                    → Ver   ││ link: --brand-orange Label Small
│  └─────────────────────────────┘│ padding: 14px 16px, bg: --bg-card
│                                 │ radius-lg, margin: 0 16px
│                                 │
│                                 │ ← padding-bottom: 80px (nav bar)
└─────────────────────────────────┘
│  [BOTTOM NAV — fixo]            │ 64px + safe-area
└─────────────────────────────────┘ 812
```

**Gauge do Score (simplificado para mobile):**
```
SCORE         742 / 1000
████████████████░░░░░░░░  ← barra linear 100% largura, height: 8px, radius-full
                           preenchida: --brand-orange até score/1000 * 100%
[🟢 ESTÁVEL]               badge colorido por banda
```

Bandas de score:
- 0–299: Crítico `--danger`
- 300–499: Frágil `#F59E0B`
- 500–699: Estável `--warning`
- 700–849: Bom `--success`
- 850–1000: Excelente `#3B82F6`

**Ações rápidas (grid 4×2):**
| # | Ícone | Label | Ação |
|---|---|---|---|
| 1 | `Upload` | Importar | Abre bottom sheet importação |
| 2 | `BarChart2` | Carteira | Navega para /carteira |
| 3 | `Lightbulb` | Insights | Navega para /insights |
| 4 | `FileText` | Extrato | Navega para /historico |
| 5 | `Target` | Decisões | Navega para /decisoes |
| 6 | `CreditCard` | Aportes | Abre bottom sheet aportes |
| 7 | `Settings` | Config | Navega para /configuracoes |
| 8 | `PlusCircle` | Adicionar | Abre bottom sheet add ativo |

**Estado vazio (sem patrimônio):**
```
│  ┌─────────────────────────────┐│
│  │                             ││
│  │    [🐿️ ilustração vazia]   ││ ícone 64px --text-muted center
│  │   Sem ativos cadastrados    ││ Title center --text-primary
│  │   Comece adicionando seus   ││ Body Medium center --text-secondary
│  │   primeiros investimentos   ││
│  │                             ││
│  │  ╔═══════════════════════╗  ││ Botão Primário
│  │  ║ + Adicionar ativo     ║  ││
│  │  ╚═══════════════════════╝  ││
│  └─────────────────────────────┘│
```

**Loading Skeleton:**
```
│  ┌─────────────────────────────┐│ shimmer animation (skeleton)
│  │ ████████████████████ 60%    ││ bg: --border, animate-pulse
│  │ ████████████████████ 45%    ││ radius-md, opacidade 0.5
│  │ ████████████ 35%            ││
│  └─────────────────────────────┘│
```

---

## 4. CARTEIRA — Tab 2

### TELA 4.1 — Visão Geral da Carteira

**Rota:** `/carteira`

```
┌─────────────────────────────────┐ 0
│  [safe-area-top]                │
├─────────────────────────────────┤
│  Carteira           [⟳] [👁]   │ Headline Small (18px Sora 600)
│                                 │ ⟳ = RefreshCw 20px, 👁 = Eye 20px
│                                 │ padding: 20px 16px 12px
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│ CARD RESUMO (compact)
│  │ Total investido             ││ Body Small --text-secondary
│  │ R$ 987.654,00   +8,3% a.a. ││ Number Medium (20px) + Badge ganho
│  └─────────────────────────────┘│ padding: 16px, margin: 0 16px
│                                 │
│  ─────────── Categorias ─────── │ scroll horizontal (setas)
│  ┌──────┐ ┌──────┐ ┌──────┐   │ chips de filtro, scroll horizontal
│  │ Todos│ │Ações │ │Fundos│ ...│ padding: 0 16px, gap: 8px
│  └──────┘ └──────┘ └──────┘   │ overflow-x: scroll, scrollbar: hidden
│                                 │
│  ─ Resumo por categoria ─────── │ Label --text-secondary, padding: 0 16px
│                                 │ margin: 16px 0 8px
│  ┌─────────────────────────────┐│ CARD CATEGORIA (repetido)
│  │ [📈] Ações              →  ││ ícone categoria 20px + ChevronRight
│  │      R$ 432.100,00          ││ Number Medium --text-primary
│  │      ████████░░░░░ 43,7%   ││ barra proporcional: --brand-orange
│  │      +15,2%  em 12 meses   ││ Badge ganho/perda + Label
│  └─────────────────────────────┘│ padding: 14px 16px, bg: --bg-card
│                                 │ margin: 4px 16px, radius-lg, shadow-card
│  ┌─────────────────────────────┐│ repete para cada categoria com saldo
│  │ [📊] Renda Fixa         →  ││
│  │      R$ 321.000,00          ││
│  │      ████████░░░░░ 32,5%   ││
│  │      +11,8%  em 12 meses   ││
│  └─────────────────────────────┘│
│                                 │ [... demais categorias ...]
│                                 │
│  ─ Todos os ativos ──────────── │ Label + "Filtrar ↓" --brand-orange
│                                 │ padding: 0 16px, margin: 16px 0 8px
│  ┌─────────────────────────────┐│ LISTA DE ATIVOS (repetida)
│  │ PETR4          R$ 21.430    ││ Title (14px Sora 600) + Number Medium
│  │ 200 cotas · R$ 107,15 médio ││ Body Small --text-secondary
│  │                   +3,2% 📈  ││ Badge ganho alinhado à direita
│  └─────────────────────────────┘│ height: 64px, padding: 0 16px
│  ┌─────────────────────────────┐│ divider 1px --border entre itens
│  │ MXRF11         R$ 43.200    ││
│  │ 360 cotas · R$ 120,00 médio ││
│  │                   +1,8% 📈  ││
│  └─────────────────────────────┘│
│                                 │
│                [+ Adicionar]    │ FAB: position absolute bottom 80px right 16px
│                                 │ círculo 52px, bg: --brand-orange, shadow
│                                 │ ícone Plus 24px white
│                                 │ padding-bottom: 80px (nav)
└─────────────────────────────────┘
│  [BOTTOM NAV]                   │
└─────────────────────────────────┘
```

**Ícones de categoria:**
| Categoria | Ícone Lucide | Cor |
|---|---|---|
| Ações | `TrendingUp` | `#F56A2A` |
| Fundos | `PieChart` | `#6FCF97` |
| Renda Fixa | `Shield` | `#3B82F6` |
| Previdência | `Umbrella` | `#8B5CF6` |
| Poupança | `Landmark` | `#F2C94C` |
| Bens | `Home` | `#A7B0BC` |

---

### TELA 4.2 — Categoria de Ativos

**Rota:** `/carteira/:categoria`

```
┌─────────────────────────────────┐
│  ← Ações              [⟳] [👁] │ ← = ArrowLeft, título dinâmico
│                                 │ padding: 16px (back button topo)
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│ CARD RESUMO CATEGORIA
│  │ Total em Ações              ││
│  │ R$ 432.100,00    +15,2%    ││ Number Medium + Badge
│  │ 8 ativos · Risco: Moderado  ││ Body Small --text-secondary
│  └─────────────────────────────┘│ margin: 0 16px, padding: 16px, bg: --bg-card
│                                 │
│  ─ Ativos ───────────────────── │ Label + filtro (sort dropdown)
│                                 │ margin: 16px 0 8px, padding: 0 16px
│  ┌─────────────────────────────┐│ ITEM DE ATIVO EXPANDÍVEL
│  │ PETR4       [🛢️] Petrobras ││ ticker: Title (14px) + nome: Body Small
│  │ Atual: R$ 35,70             ││ Label + valor: Body Medium --text-primary
│  │ Preço médio: R$ 30,15       ││
│  │ Quant: 600 cotas            ││
│  │ ─────────────────────────── ││ divider
│  │ Valor total:   R$ 21.420    ││
│  │ Ganho total:  +R$ 3.330     ││ verde --success
│  │ Rentab.:        +18,5%      ││ Badge ganho
│  └─────────────────────────────┘│ padding: 16px, bg: --bg-card
│                                 │ margin: 4px 16px, radius-lg
│  [... demais ativos ...]        │
│                                 │
│                [+ Adicionar]    │ FAB igual à tela 4.1
└─────────────────────────────────┘
│  [BOTTOM NAV]                   │
└─────────────────────────────────┘
```

---

### TELA 4.3 — Detalhe do Ativo

**Rota:** `/ativo/:ticker`

```
┌─────────────────────────────────┐
│  ← PETR4 — Petrobras PN        │ ← back, título: ticker + nome empresa
│                        [⋯]     │ ⋯ = MoreVertical (ações: editar/excluir)
│                                 │ padding: 16px
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│ CARD PREÇO ATUAL
│  │                             ││ padding: 20px
│  │ R$ 35,70                    ││ Number Large (28px Sora 700)
│  │ +0,87 (+2,5%) hoje 📈       ││ Body Small --success + ícone TrendingUp
│  │                             ││
│  │ [Gráfico de linha 280×120px]││ Recharts LineChart
│  │                             ││ strokeColor: --brand-orange
│  │                             ││ no axes labels no mobile (só valor hover)
│  │ [1S] [1M] [3M] [6M] [1A]   ││ chips período: scroll horizontal
│  └─────────────────────────────┘│ bg: --bg-card, margin: 0 16px, radius-xl
│                                 │
│  ─ Minha posição ─────────────  │ Label, padding: 0 16px, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│ CARD POSIÇÃO
│  │  Qtd:     600 cotas         ││ grid 2 colunas
│  │  Médio:   R$ 30,15          ││ Label + Body Medium bold
│  │  Invest:  R$ 18.090,00      ││
│  │  Atual:   R$ 21.420,00      ││
│  │  ─────────────────────────  ││
│  │  Ganho:   +R$ 3.330 (+18,5%)││ --success
│  └─────────────────────────────┘│ margin: 0 16px, bg: --bg-card, radius-lg
│                                 │
│  ─ Histórico de compras ─────── │ Label, padding: 0 16px, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│ LISTA DE TRANSAÇÕES (compact)
│  │ 15/03/2025 · Compra         ││ Body Small --text-secondary
│  │ 100 cotas @ R$ 28,50        ││ Body Medium --text-primary
│  │                    R$ 2.850 ││ alinhado à direita
│  └─────────────────────────────┘│ divider
│  ┌─────────────────────────────┐│
│  │ 10/01/2025 · Compra         ││
│  │ 500 cotas @ R$ 30,72        ││
│  │                   R$ 15.360 ││
│  └─────────────────────────────┘│
│                                 │
│  ╔══════════╗  ╔══════════════╗ │ BOTÕES AÇÃO (2 colunas)
│  ║ Vender ▼ ║  ║ + Comprar   ║ │ Secundário + Primário
│  ╚══════════╝  ╚══════════════╝ │ margin: 0 16px 80px, gap: 8px
└─────────────────────────────────┘
│  [BOTTOM NAV]                   │
└─────────────────────────────────┘
```

---

## 5. INSIGHTS — Tab 3

**Rota:** `/insights`

```
┌─────────────────────────────────┐
│  [safe-area-top]                │
├─────────────────────────────────┤
│  Insights              [🔔]     │ Headline Small
│                                 │ 🔔 = Bell com badge número se houver
│                                 │ padding: 20px 16px 8px
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│ CARD VERA (IA)
│  │ [🐿️] Vera — sua analista   ││ ícone assistente 32px, Label bold
│  │                             ││ separador 1px
│  │ "Seu patrimônio cresceu     ││ Body Medium --text-primary (italic)
│  │  12% este ano. Veja o que   ││ máx 3 linhas + "... ler mais"
│  │  pode ser melhorado."       ││ --brand-orange
│  │                     Analisar│ ││ Link --brand-orange Label à direita
│  └─────────────────────────────┘│ bg: linear-gradient(135deg, #FFF6F0, #FDFCFB)
│                                 │ dark: bg: linear-gradient(135deg, #1A1206, #161E26)
│                                 │ margin: 0 16px, radius-xl, shadow-card
│                                 │
│  ─ Ação necessária (2) ──────── │ Label --danger + contador, padding: 0 16px
│                                 │ margin: 16px 0 8px
│  ┌─────────────────────────────┐│ CARD INSIGHT — AÇÃO CRÍTICA
│  │ [🔴] Ação necessária        ││ badge vermelho (Label Small, bg: danger/10%)
│  │                             ││
│  │ Concentração excessiva       ││ Title (16px Sora 600) --text-primary
│  │ em um único ativo            ││ max 2 linhas
│  │                             ││
│  │ PETR4 representa 43% da sua ││ Body Small --text-secondary, max 3 linhas
│  │ carteira. Diversificação     ││
│  │ melhora resiliência.         ││
│  │                             ││
│  │ Impacto: 🔴 Alto            ││ Body Small + ícone colorido
│  │                    → Agir   ││ Label --brand-orange à direita
│  └─────────────────────────────┘│ padding: 16px, bg: --bg-card
│                                 │ margin: 4px 16px, radius-lg
│                                 │ border-left: 3px solid --danger
│                                 │
│  ─ Oportunidade (3) ──────────  │ Label --warning, margin: 16px 0 8px, padding: 0 16px
│                                 │
│  ┌─────────────────────────────┐│ CARD INSIGHT — OPORTUNIDADE
│  │ [🟡] Oportunidade           ││ badge amarelo
│  │                             ││
│  │ LCI isenta pode render      ││ Title --text-primary
│  │ mais que Tesouro IPCA+      ││
│  │                             ││
│  │ Com o cenário atual de      ││ Body Small --text-secondary
│  │ juros, LCI isenta de IR...  ││
│  │                             ││
│  │ Impacto: 🟡 Médio           ││
│  │                  → Explorar ││ Label --brand-orange
│  └─────────────────────────────┘│ border-left: 3px solid --warning
│                                 │
│  ─ Indo bem (4) ───────────────  │ Label --success, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│ CARD INSIGHT — POSITIVO
│  │ [🟢] Isso está indo bem     ││ badge verde
│  │                             ││
│  │ Reserva de emergência       ││ Title --text-primary
│  │ adequada                    ││
│  │                             ││
│  │ Você tem 6 meses de         ││ Body Small --text-secondary
│  │ despesas em reserva. 👏     ││
│  └─────────────────────────────┘│ border-left: 3px solid --success
│                                 │ padding-bottom: 80px
└─────────────────────────────────┘
│  [BOTTOM NAV]                   │
└─────────────────────────────────┘
```

**Border-left colorida por tipo:**
- Ação necessária: `3px solid --danger`
- Oportunidade: `3px solid --warning`
- Indo bem: `3px solid --success`
- Informativo: `3px solid #3B82F6`

**Estado vazio:**
```
│              [💡 48px vazio]    │ ícone muted
│         Sem insights no momento │ Title center
│    Seus insights aparecerão aqui│ Body Medium center --text-secondary
│    quando tivermos dados         │
│    suficientes para analisar.    │
│                                 │
│  ╔═════════════════════════╗    │
│  ║  Atualizar dados        ║    │ Botão Secundário
│  ╚═════════════════════════╝    │
```

---

## 6. DECISÕES — Tab 4

### TELA 6.1 — Hub de Decisões

**Rota:** `/decisoes`

```
┌─────────────────────────────────┐
│  [safe-area-top]                │
├─────────────────────────────────┤
│  Simuladores               [?] │ Headline Small
│                                 │ ? = HelpCircle 20px --text-muted
│                                 │ padding: 20px 16px 12px
├─────────────────────────────────┤
│                                 │
│  ─ Patrimônio ─────────────────  │ Label Section --text-secondary
│                                 │ padding: 0 16px, margin: 8px 0
│  ┌───────────┐ ┌───────────┐   │ GRID 2 COLUNAS
│  │  [🏠]    │ │  [🚗]    │   │ cada card: padding: 16px, bg: --bg-card
│  │ Imóvel ou │ │ Carro ou  │   │ radius-lg, shadow-card, height: 100px
│  │  Aluguel  │ │ Investir  │   │ ícone: 28px --brand-orange
│  └───────────┘ └───────────┘   │ Title (14px Sora 600) --text-primary
│                                 │ Body Small --text-secondary (1 linha)
│  ─ Liquidez ────────────────── │ margin: 16px 0 8px
│                                 │
│  ┌───────────┐ ┌───────────┐   │
│  │  [🛡️]   │ │  [🛒]    │   │
│  │ Reserva ou│ │ Gastar ou │   │
│  │ Financiar │ │ Investir  │   │
│  └───────────┘ └───────────┘   │
│                                 │
│  ─ Exploração ─────────────────  │ margin: 16px 0 8px
│                                 │
│  ┌───────────┐ ┌───────────┐   │
│  │  [⚙️]   │ │  [📋]    │   │
│  │  Simular  │ │ Histórico │   │
│  │  livre    │ │           │   │
│  └───────────┘ └───────────┘   │
│                                 │ margin: 16px 0 8px
│  ─ Recentes ────────────────── │ Label + "Ver todos →" --brand-orange
│                                 │ padding: 0 16px
│  ┌─────────────────────────────┐│ ITEM DE SIMULAÇÃO RECENTE
│  │ Comprar apt. Jardins        ││ Body Medium --text-primary
│  │ Imovel · 12/04/2025        ││ Body Small --text-secondary
│  │                    → Ver   ││ Label --brand-orange à direita
│  └─────────────────────────────┘│ height: 56px, padding: 0 16px
│                                 │ divider entre itens
│                                 │ padding-bottom: 80px
└─────────────────────────────────┘
│  [BOTTOM NAV]                   │
└─────────────────────────────────┘
```

---

### TELA 6.2 — Simulador (padrão genérico)

**Rota:** `/decisoes/imovel` (ou qualquer outro)

```
┌─────────────────────────────────┐
│  ← Imóvel ou Aluguel            │ ← back, título dinâmico
│                                 │ padding: 16px
├─────────────────────────────────┤
│                                 │
│  Simule se vale mais comprar    │ Body Medium --text-secondary
│  um imóvel ou continuar         │ padding: 0 16px 16px
│  alugando e investindo.         │
│                                 │
│  ─ Dados do imóvel ────────────  │ Label Section, padding: 0 16px, margin: 8px 0
│                                 │
│  Valor do imóvel                │ Label, padding: 0 16px
│  ╔═══════════════════════════╗  │
│  ║  R$ _____________         ║  │ Input mascarado BRL, margin: 0 16px
│  ╚═══════════════════════════╝  │
│                                 │
│  Entrada (% ou R$)              │ Label, padding: 0 16px, margin-top: 12px
│  ╔═══════════════════════════╗  │
│  ║  R$ _____________         ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  Prazo do financiamento         │ Label, padding: 0 16px, margin-top: 12px
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐     │ chips: 10a, 15a, 20a, 30a
│  │10a│ │15a│ │20a│ │30a│     │ scroll horizontal se necessário
│  └───┘ └───┘ └───┘ └───┘     │
│                                 │
│  Taxa de juros (% a.a.)         │ Label, padding: 0 16px, margin-top: 12px
│  ╔═══════════════════════════╗  │
│  ║  12,5%                    ║  │
│  ╚═══════════════════════════╝  │
│                                 │ [demais campos do simulador...]
│                                 │
│  ╔═══════════════════════════╗  │ position sticky bottom (acima nav)
│  ║       SIMULAR             ║  │ Botão Primário, margin: 16px
│  ╚═══════════════════════════╝  │ + padding-bottom: 80px
└─────────────────────────────────┘
│  [BOTTOM NAV]                   │
└─────────────────────────────────┘
```

---

### TELA 6.3 — Resultado de Simulação

**Rota:** `/decisoes/resultado/:id`

```
┌─────────────────────────────────┐
│  ← Resultado                    │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│ CARD VEREDITO
│  │     📊 ANÁLISE COMPLETA     ││ Label center
│  │                             ││
│  │  Comprar é melhor se você   ││ Body Large --text-primary center
│  │  ficar mais de 8 anos       ││ Sora 600
│  │                             ││
│  │  ┌──────────┐ ┌──────────┐  ││ 2 opções comparadas
│  │  │ COMPRAR  │ │ ALUGAR   │  ││ vencedor: bg --brand-orange, text white
│  │  │ R$ 1,2M  │ │ R$ 980K  │  ││ perdedor: bg --bg-input, text --text-secondary
│  │  │ em 20 anos│ │ em 20 anos││ radius-lg, padding: 12px
│  │  └──────────┘ └──────────┘  ││
│  └─────────────────────────────┘│ bg: --bg-card, margin: 0 16px, radius-xl
│                                 │
│  ─ Evolução patrimonial ─────── │ Label, margin: 16px 0 8px, padding: 0 16px
│                                 │
│  ┌─────────────────────────────┐│ GRÁFICO DE LINHA COMPARATIVO
│  │ [LineChart 343×160px]       ││ Linha 1: Comprar (--brand-orange)
│  │                             ││ Linha 2: Alugar+Investir (--success)
│  │ ─ Comprar  ─ Alugar        ││ Legenda simples embaixo
│  └─────────────────────────────┘│ margin: 0 16px, bg: --bg-card, radius-lg
│                                 │
│  ─ Detalhamento ───────────────  │ Label, margin: 16px 0 8px, padding: 0 16px
│                                 │
│  ┌─────────────────────────────┐│ TABELA SIMPLIFICADA
│  │              Comprar Alugar ││
│  │ Custo total  1,2M   980K    ││ Body Small --text-primary
│  │ Patrimônio   1,8M   1,4M    ││ 
│  │ Break-even   8 anos ─       ││
│  └─────────────────────────────┘│ margin: 0 16px, bg: --bg-card, radius-lg
│                                 │
│  ╔══════════╗  ╔══════════════╗ │ BOTÕES
│  ║Refazer ↩ ║  ║   💾 Salvar ║ │ Secundário + Primário
│  ╚══════════╝  ╚══════════════╝ │ margin: 16px, gap: 8px
│                                 │ padding-bottom: 80px
└─────────────────────────────────┘
│  [BOTTOM NAV]                   │
└─────────────────────────────────┘
```

---

## 7. PERFIL — Tab 5

### TELA 7.1 — Perfil do Usuário

**Rota:** `/perfil`

```
┌─────────────────────────────────┐
│  [safe-area-top]                │
├─────────────────────────────────┤
│  Perfil                   [⚙]  │ Headline Small, ⚙ = Settings link
│                                 │ padding: 20px 16px 12px
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│ CARD AVATAR + INFO
│  │  ┌───────┐                  ││ avatar: 64×64px, radius-full
│  │  │  LG   │ Luiz Gomes      ││ bg: --brand-orange, text: white, Sora 700 20px
│  │  │       │ luiz@email.com  ││ nome: Title --text-primary
│  │  └───────┘ Membro desde    ││ email: Body Small --text-secondary
│  │            Jan 2024        ││ membro desde: Body Small --text-muted
│  └─────────────────────────────┘│ padding: 20px, bg: --bg-card, margin: 0 16px
│                                 │
│  ─ Informações pessoais ─────── │ Label, padding: 0 16px, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│ LISTA DE CAMPOS (editável)
│  │ Nome completo               ││ Label Small --text-secondary
│  │ Luiz Gomes Mattey           ││ Body Medium --text-primary
│  │                          →  ││ ChevronRight, divider
│  ├─────────────────────────────┤│
│  │ Telefone                    ││
│  │ (11) 99999-9999             ││
│  │                          →  ││
│  └─────────────────────────────┘│ bg: --bg-card, margin: 0 16px, radius-lg
│                                 │
│  ─ Dados financeiros ──────────  │ Label, padding: 0 16px, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│
│  │ Renda mensal bruta          ││
│  │ R$ 25.000,00                ││ (valor oculto se --ocultarValores)
│  │                          →  ││
│  ├─────────────────────────────┤│
│  │ Aporte mensal               ││
│  │ R$ 5.000,00                 ││
│  │                          →  ││
│  ├─────────────────────────────┤│
│  │ Reserva de emergência       ││
│  │ R$ 50.000,00                ││
│  │                          →  ││
│  └─────────────────────────────┘│
│                                 │
│  ─ Menu ───────────────────────  │ Label, padding: 0 16px, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│ MENU LIST
│  │ [🎯] Perfil de risco     →  ││ ícone + Label + ChevronRight
│  ├─────────────────────────────┤│ height: 52px, padding: 0 16px
│  │ [📥] Importar dados      →  ││
│  ├─────────────────────────────┤│
│  │ [📋] Histórico           →  ││
│  ├─────────────────────────────┤│
│  │ [⚙] Configurações        →  ││
│  └─────────────────────────────┘│ bg: --bg-card, margin: 0 16px, radius-lg
│                                 │
│  ╔═══════════════════════════╗  │
│  ║  Sair da conta            ║  │ Botão Secundário (--danger border)
│  ╚═══════════════════════════╝  │ text: --danger, margin: 16px
│                                 │ padding-bottom: 80px
└─────────────────────────────────┘
│  [BOTTOM NAV]                   │
└─────────────────────────────────┘
```

---

### TELA 7.2 — Perfil de Risco

**Rota:** `/perfil-de-risco`

```
┌─────────────────────────────────┐
│  ← Perfil de Risco              │ ← back, sem bottom nav "ativo" diferente
│                                 │ padding: 16px
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│ CARD PERFIL ATUAL
│  │ [🎯] Seu perfil:            ││ Body Small --text-secondary
│  │ Esquilo Moderado            ││ Headline Medium (22px Sora 700) --text-primary
│  │                             ││
│  │ Busca equilíbrio entre      ││ Body Medium --text-secondary (3 linhas max)
│  │ crescimento e proteção do   ││
│  │ patrimônio.                 ││
│  │                             ││
│  │ ╔═══════════════════════╗   ││ Botão Secundário
│  │ ║ Refazer questionário  ║   ││
│  │ ╚═══════════════════════╝   ││
│  └─────────────────────────────┘│ bg: --bg-card, margin: 0 16px, radius-xl
│                                 │ padding: 20px
│                                 │
│  ─ Alocação recomendada ─────── │ Label, padding: 0 16px, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│ BARRAS DE ALOCAÇÃO
│  │ Ações                       ││ Label --text-primary
│  │ Atual ██████░░░░░░ 35%      ││ barra atual: --brand-orange
│  │ Meta  █████████░░ 40%       ││ barra meta: --text-muted
│  │                    ▲ +5%    ││ delta: Body Small --warning (fora do alvo)
│  ├─────────────────────────────┤│ divider
│  │ Renda Fixa                  ││
│  │ Atual ██████████░ 45%       ││
│  │ Meta  ████████░░░ 40%       ││
│  │                    ▼ -5%    ││ delta: Body Small (dentro de tolerância → cinza)
│  ├─────────────────────────────┤│
│  │ Fundos                      ││
│  │ Atual ████░░░░░░░ 20%       ││
│  │ Meta  ████████░░ 20%        ││
│  │                    = OK     ││ --success
│  └─────────────────────────────┘│ bg: --bg-card, margin: 0 16px, radius-lg
│                                 │ padding: 16px (cada linha 16px vertical)
│                                 │ padding-bottom: 80px
└─────────────────────────────────┘
│  [BOTTOM NAV]                   │
└─────────────────────────────────┘
```

**Barras de progresso:**
- height: 6px, radius-full, bg: --border
- preenchimento: `--brand-orange` (atual) ou `--text-muted` (meta)
- largura: `{valor}% da largura disponível`

---

### TELA 7.3 — Configurações

**Rota:** `/configuracoes`

```
┌─────────────────────────────────┐
│  ← Configurações                │ padding: 16px
├─────────────────────────────────┤
│                                 │
│  ─ Aparência ──────────────────  │ Label, padding: 0 16px, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│
│  │ Tema                        ││
│  │          [☀️] Claro ●[🌙] Dark│ toggle switch direita: --brand-orange active
│  ├─────────────────────────────┤│ height: 52px, padding: 0 16px
│  │ Ocultar valores            ││
│  │          [OFF  ●      ON]   ││ toggle switch
│  └─────────────────────────────┘│ bg: --bg-card, margin: 0 16px, radius-lg
│                                 │
│  ─ Conta ──────────────────────  │ Label, padding: 0 16px, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│
│  │ [🔔] Notificações        →  ││
│  ├─────────────────────────────┤│
│  │ [🔒] Alterar senha        → ││
│  ├─────────────────────────────┤│
│  │ [📧] E-mail de recuperação→  ││
│  └─────────────────────────────┘│ bg: --bg-card, margin: 0 16px, radius-lg
│                                 │
│  ─ Dados ──────────────────────  │ Label, padding: 0 16px, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│
│  │ [📥] Exportar dados       → ││
│  ├─────────────────────────────┤│
│  │ [🗑️] Excluir conta        → ││ text: --danger
│  └─────────────────────────────┘│ bg: --bg-card, margin: 0 16px, radius-lg
│                                 │
│  ─ Sobre ──────────────────────  │ Label, padding: 0 16px, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│
│  │ [📄] Termos de uso        → ││
│  ├─────────────────────────────┤│
│  │ [🔏] Política de privacidade│ ││
│  ├─────────────────────────────┤│
│  │ Versão 1.0.0                ││ Body Small --text-muted, sem chevron
│  └─────────────────────────────┘│ bg: --bg-card, margin: 0 16px, radius-lg
│                                 │ padding-bottom: 80px
└─────────────────────────────────┘
│  [BOTTOM NAV]                   │
└─────────────────────────────────┘
```

**Toggle Switch:**
- width: 44px, height: 24px, radius-full
- LIGADO: bg: --brand-orange, bolinha branca 20px right: 2px
- DESLIGADO: bg: --border, bolinha branca 20px left: 2px
- transição: 200ms ease

---

## 8. TELAS TRANSVERSAIS (Bottom Sheets e Modais)

> Bottom sheets sobem de baixo, background overlay ativa, fecham com swipe down ou tap overlay.

### BOTTOM SHEET 8.1 — Aportes

**Ativação:** Via ação rápida em Home ou FAB em Carteira

```
[OVERLAY --overlay]
┌─────────────────────────────────┐ ← aparece de baixo (translateY animation)
│  ─────  (handle bar 36px)       │ handle: 4×36px, bg: --border, radius-full, center
│                                 │
│  Registrar aporte        [✕]   │ Title (16px Sora 600) + X para fechar
│                                 │ padding: 0 20px, margin-bottom: 20px
│  Ativo                          │ Label, margin-bottom: 8px
│  ╔═══════════════════════════╗  │
│  ║  Pesquisar ativo...   [↓] ║  │ Input + ChevronDown (dropdown)
│  ╚═══════════════════════════╝  │
│                                 │
│  Data                           │ Label, margin: 12px 0 8px
│  ╔═══════════════════════════╗  │
│  ║  17/04/2025           📅  ║  │ Input date + Calendar ícone
│  ╚═══════════════════════════╝  │
│                                 │
│  Tipo de operação               │ Label, margin: 12px 0 8px
│  ┌──────────┐ ┌──────────┐     │ 2 chips
│  │ Compra   │ │  Venda   │     │ selecionado: bg --brand-orange, text white
│  └──────────┘ └──────────┘     │
│                                 │
│  Quantidade                     │ Label, margin: 12px 0 8px
│  ╔═══════════════════════════╗  │
│  ║  0                        ║  │ Input numérico
│  ╚═══════════════════════════╝  │
│                                 │
│  Preço unitário                 │ Label, margin: 12px 0 8px
│  ╔═══════════════════════════╗  │
│  ║  R$ _____________         ║  │ Input mascarado BRL
│  ╚═══════════════════════════╝  │
│                                 │
│  Total                          │ Label, margin: 12px 0 4px
│  R$ 21.350,00                   │ Number Medium (20px) --text-primary bold
│                                 │ calculado automaticamente
│  ╔═══════════════════════════╗  │
│  ║       SALVAR APORTE       ║  │ Botão Primário, margin: 20px 0
│  ╚═══════════════════════════╝  │ + padding-bottom: env(safe-area-inset-bottom)
└─────────────────────────────────┘
   radius-top: 20px
   bg: --bg-card
   max-height: 90% da tela
   scroll interno se conteúdo exceder
```

---

### BOTTOM SHEET 8.2 — Importar Dados

**Rota:** `/importar` (também pode ser bottom sheet)

```
[OVERLAY]
┌─────────────────────────────────┐
│  ─────  (handle bar)            │
│  Importar dados          [✕]   │
│                                 │
│  ┌─────────────────────────────┐│ CARD DROP ZONE
│  │                             ││ border: 2px dashed --border
│  │    [⬆ 48px --brand-orange] ││ bg: --bg-input, radius-xl
│  │   Toque para selecionar     ││ padding: 40px 20px
│  │   seu arquivo               ││ Title center
│  │   Excel (.xlsx) ou CSV      ││ Body Small --text-secondary center
│  └─────────────────────────────┘│
│                                 │
│  ─ Ou escolha um modelo ─────── │ Label, margin: 16px 0 8px
│                                 │
│  ┌─────────────────────────────┐│
│  │ [📄] Modelo de planilha →  ││ download de template
│  └─────────────────────────────┘│ bg: --bg-card, radius-lg
│                                 │
│  Instruções:                    │ Label, margin: 16px 0 8px
│  • Cada linha = 1 transação     │ Body Small --text-secondary
│  • Colunas: ticker, data,       │
│    tipo, qtd, preço             │
│  • Datas no formato DD/MM/AAAA  │
│                                 │
│  ╔═══════════════════════════╗  │
│  ║       IMPORTAR            ║  │ desabilitado até arquivo selecionado
│  ╚═══════════════════════════╝  │
└─────────────────────────────────┘
```

---

### TELA 8.3 — Histórico de Transações

**Rota:** `/historico`

```
┌─────────────────────────────────┐
│  ← Histórico                    │
│                     [🔍] [⚙]   │ busca e filtros
│                                 │ padding: 16px
├─────────────────────────────────┤
│                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐   │ CHIPS DE FILTRO (scroll horizontal)
│  │ Todos│ │Compra│ │Venda │...  │ padding: 0 16px, margin-bottom: 8px
│  └──────┘ └──────┘ └──────┘   │
│                                 │
│  Abril 2025                     │ Label Section --text-secondary
│                                 │ padding: 0 16px, margin: 8px 0 4px
│  ┌─────────────────────────────┐│ ITEM TRANSAÇÃO
│  │ PETR4            ↑ Compra   ││ ticker: Label bold  |  tipo: Body Small
│  │ 15/04/2025                  ││ data: Body Small --text-secondary
│  │ 100 cotas @ R$ 35,70        ││ detalhes: Body Small --text-secondary
│  │                   R$ 3.570  ││ valor: Number Medium --text-primary, right
│  └─────────────────────────────┘│ padding: 12px 16px, height: ~68px
│                                 │ divider 1px --border
│  ┌─────────────────────────────┐│
│  │ MXRF11           ↑ Compra   ││ ↑ = verde (compra), ↓ = vermelho (venda)
│  │ 10/04/2025                  ││ ícone: ArrowUp (green) / ArrowDown (red)
│  │ 60 cotas @ R$ 120,00        ││
│  │                   R$ 7.200  ││
│  └─────────────────────────────┘│
│                                 │
│  Março 2025                     │ Label Section agrupamento por mês
│                                 │
│  [... mais itens ...]           │
│                                 │ padding-bottom: 80px
└─────────────────────────────────┘
│  [BOTTOM NAV]                   │
└─────────────────────────────────┘
```

---

## 9. FLUXO DE NAVEGAÇÃO COMPLETO

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO MOBILE — ESQUILO INVEST                          │
└─────────────────────────────────────────────────────────────────────────────────┘

[PÚBLICO — sem bottom nav]
         ┌────────────┐
         │   LOGIN    │ ─── erro → mensagem inline
         │    2.1     │ ─── sucesso → ONBOARDING (1ª vez) ou HOME
         └────────────┘
               ↓ (1ª vez)
    ┌──────────────────────────┐
    │  ONBOARDING  2.2         │
    │  Passo 1 → 2 → 3         │ ── pular → HOME
    └──────────────────────────┘
               ↓
════════════════════════════════════════════════════ BOTTOM NAV ════════
    [INÍCIO]      [CARTEIRA]     [INSIGHTS]    [DECISÕES]    [PERFIL]
       ↓              ↓              ↓              ↓             ↓
   HOME 3.1      CARTEIRA 4.1   INSIGHTS 5    DECISÕES 6.1  PERFIL 7.1
       │              │                            │             │
       ├──→ FAB       ├──→ Categoria 4.2           ├──→ Sim. 6.2 ├──→ Risco 7.2
       │   APORTES    │       │                    │   Resultado ├──→ Config 7.3
       │   BS 8.1     │       └──→ Detalhe 4.3     │   6.3       └──→ Import BS 8.2
       │              │                            └──→ Histórico
       └──→ Histórico └──→ FAB APORTES BS 8.1          Sim. (lista)
           BS/tela         │
           8.3             └──→ Histórico 8.3
═══════════════════════════════════════════════════════════════════════

GESTOS MOBILE:
  - Swipe right: volta para tela anterior (equivale ao ← back)
  - Swipe down: fecha bottom sheets
  - Pull to refresh: atualiza dados da tela (onde aplicável)
  - Long press em ativo: menu contextual (editar / excluir)
  - Tap overlay: fecha modal/bottom sheet
```

---

## 10. ESPECIFICAÇÕES DE ANIMAÇÃO

| Elemento | Animação | Duração | Easing |
|---|---|---|---|
| Troca de tab (bottom nav) | Fade + slide vertical (8px) | 200ms | ease-out |
| Bottom sheet abre | Slide up (translateY 100% → 0) | 300ms | spring(stiffness:300, damping:30) |
| Bottom sheet fecha | Slide down | 200ms | ease-in |
| Page transition (push) | Slide left 20px + fade | 250ms | ease-out |
| Page transition (pop/back) | Slide right 20px + fade | 200ms | ease-out |
| Cards (mount) | Fade in + translateY 12px | 300ms | ease-out (staggered 50ms) |
| Skeleton shimmer | gradient left→right sweep | 1200ms | linear, infinite |
| Toggle switch | translateX | 150ms | ease |
| Badge de ganho/perda | scale 0.8 → 1 | 150ms | ease-out |
| Score bar fill | width 0% → valor | 600ms | ease-out (delayed) |

---

## 11. COMPORTAMENTO DO MODO ESCURO

- Toggle disponível em Configurações (tela 7.3) e em Home (ícone no header)
- Preferência salva em localStorage
- Transição suave de todas as cores: `transition: background-color 300ms, color 300ms, border-color 300ms`
- Imagens e ícones de marca ficam inalterados (laranja #F56A2A funciona em ambos modos)
- Gráficos (Recharts): trocar background de tooltip para --bg-card, texto para --text-primary
- Bottom nav usa `--nav-bg` e `--nav-border` já diferenciados por modo

**Checklist de contraste (WCAG AA):**
- Texto primário sobre bg-primary: ✅ (ambos modos)
- Brand orange sobre branco/dark card: ✅
- Success/Danger sobre bg: ✅
- Text-secondary sobre bg-card: ✅ (mínimo 4.5:1)

---

## 12. ESPECIFICAÇÃO DE VALORES OCULTOS

Quando `ocultarValores = true`:
- Todos os valores monetários mostram: `••••••`
- Percentuais mostram: `••,•%`
- Gráficos (sparkline, donut): ficam com opacidade 0.15 + blur(2px)
- Badge de ganho/perda: oculto (invisible, mas espaço preservado)
- Ícone 👁 no header fica com stroke diferente (eye-off) indicando modo oculto

---

## 13. ESTADOS DE ERRO E CONEXÃO

### Banner de erro de conexão (global)
```
┌─────────────────────────────────┐
│ [⚠] Sem conexão. Dados podem   │ bg: --warning/20%, padding: 8px 16px
│ estar desatualizados.    Tentar │ Body Small --text-primary | "Tentar": --brand-orange
└─────────────────────────────────┘
position: sticky top (abaixo do header), z-index: 50
```

### Estado de erro em card
```
┌─────────────────────────────────┐
│ Não foi possível carregar       │ Body Small --text-secondary center
│ os dados.                       │
│      [Tentar novamente]         │ Botão Ghost --brand-orange
└─────────────────────────────────┘
```

---

## 14. RESUMO DE TELAS E ROTAS

| # | Tela | Rota | Tab ativo | Bottom Nav |
|---|---|---|---|---|
| 2.1 | Login | `/` | — | Não |
| 2.2 | Onboarding | (interno) | — | Não |
| 3 | Início | `/home` | Início | Sim |
| 4.1 | Carteira | `/carteira` | Carteira | Sim |
| 4.2 | Categoria | `/carteira/:cat` | Carteira | Sim |
| 4.3 | Detalhe Ativo | `/ativo/:ticker` | Carteira | Sim |
| 5 | Insights | `/insights` | Insights | Sim |
| 6.1 | Decisões Hub | `/decisoes` | Decisões | Sim |
| 6.2 | Simulador | `/decisoes/:tipo` | Decisões | Sim |
| 6.3 | Resultado | `/decisoes/resultado/:id` | Decisões | Sim |
| 7.1 | Perfil | `/perfil` | Perfil | Sim |
| 7.2 | Perfil de Risco | `/perfil-de-risco` | Perfil | Sim |
| 7.3 | Configurações | `/configuracoes` | Perfil | Sim |
| BS 8.1 | Aportes | bottom sheet | — | Sim (por baixo) |
| BS 8.2 | Importar | bottom sheet | — | Sim (por baixo) |
| 8.3 | Histórico | `/historico` | Carteira | Sim |

---

*Documento gerado em 2026-04-17 para implementação mobile nativa/PWA do Esquilo Invest.*
*Implementar com: React Native / Expo, ou React + Capacitor, ou PWA com Tailwind.*
*Referência de branding: `apps/web/tailwind.config.ts` e `apps/web/src/index.css`.*
