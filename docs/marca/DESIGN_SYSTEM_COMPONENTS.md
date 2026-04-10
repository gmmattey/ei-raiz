# Design System - Especificação de Componentes

## ÍNDICE

1. [Design Tokens](#design-tokens)
2. [Componentes Base](#componentes-base)
3. [Componentes Compostos](#componentes-compostos)
4. [Telas por Feature](#telas-por-feature)
5. [Variações Responsivas](#variações-responsivas)

---

## DESIGN TOKENS

### 1.1 Cores

#### Palette Primária
```
--c-ink: #0B1218 (Navy - texto principal, backgrounds escuros)
--c-accent: #F56A2A (Orange - CTAs, highlights)
```

#### Palette Neutra (Grayscale)
```
--c-paper: #FFFFFF (Branco - backgrounds de cards)
--c-sand-0: #F5F0EB (Bege muito claro - backgrounds de página)
--c-sand-1: #E2DDD8 (Bege claro - borders, dividers)
--c-slate: #4A5A6A (Cinza médio - texto secundário)
--c-muted: #8A9AB0 (Cinza claro - texto desabilitado)
```

#### Palette de Status
```
--c-danger: #E85C5C (Vermelho coral - erros)
--c-success: #6FCF97 (Verde - sucesso)
--c-warn: #F2B544 (Amarelo - avisos)
--c-info: #43C7CF (Ciano - informações)
```

### 1.2 Tipografia

#### Font Families
```
--font-sans: "Trebuchet MS", Trebuchet, "Segoe UI", system-ui, -apple-system, Arial, sans-serif
--font-serif: Georgia, "Times New Roman", Times, serif (não usado atualmente)
```

#### Text Styles (por tamanho)
```
Display 1: 32px, 700 weight, line-height 1.2
Display 2: 24px, 900 weight (títulos)
Headline: 18px, 900 weight
Body Large: 15px, 400 weight
Body Regular: 15px, 400 weight
Label: 13px, 600 weight, uppercase, letter-spacing 0.05em
Button: 15px, 700 weight
Small: 12px, 400 weight (captions)
```

### 1.3 Spacing Scale (Base 4px)

```
--spacing-1: 4px
--spacing-2: 8px
--spacing-3: 12px
--spacing-4: 16px
--spacing-6: 24px
--spacing-8: 32px
--spacing-12: 48px
--spacing-16: 64px
```

**Aplicações**:
- Gap entre elementos: 8px, 12px, 16px, 24px
- Padding de cards: 16px (padrão), 14px (compact), 20px (generous)
- Padding de buttons: 12px vertical × 16px horizontal
- Padding de inputs: 12px vertical × 16px horizontal

### 1.4 Border Radius

```
--radius-1: 4px (inputs, small components)
--radius-2: 6px (inputs em LoginScreen)
--radius-3: 10px (cards pequenas)
--radius-4: 16px (cards médias/grandes)
--radius-pill: 999px (buttons, pills, badges)
```

### 1.5 Shadows

```
--shadow-1: 0 10px 28px rgba(11, 18, 24, 0.10) (cards, buttons)
--shadow-2: 0 18px 44px rgba(11, 18, 24, 0.14) (elevated components)
--shadow-inset: 0 1px 2px rgba(0, 0, 0, 0.05) (inputs)
```

### 1.6 Backdrop & Opacity

```
--bg-card: rgba(255, 255, 255, 0.78)
--bg-button-ghost: rgba(255, 255, 255, 0.72)
--bg-pill: rgba(245, 240, 235, 0.9)
--border-default: rgba(11, 18, 24, 0.08)
--border-medium: rgba(11, 18, 24, 0.14)
--border-strong: rgba(11, 18, 24, 0.28)
```

---

## COMPONENTES BASE

### 2.1 Button

#### Button/Primary
```
Property         | Value
─────────────────|────────────────────────────────
Background      | #0B1218 (Navy)
Text Color      | #FFFFFF (White)
Padding         | 12px 16px
Border Radius   | 999px (fully rounded)
Font Weight     | 700 (bold)
Font Size       | 15px
Shadow          | --shadow-1
Border          | none
Cursor          | pointer
Hover           | brightness(1.05) filter
Disabled        | opacity(0.6), cursor(not-allowed)
Transition      | all 0.2s ease
```

**Dimensions**:
- Altura mínima: 44px (touch target)
- Width: auto (content) ou full (em formulários)

**States**:
- Default: como acima
- Hover: brightness(1.05)
- Disabled: opacity 0.6
- Loading: mostrar spinner (ou desabilitar)
- Focus: outline 2px solid #F56A2A (offset 2px)

#### Button/Ghost
```
Property         | Value
─────────────────|────────────────────────────────
Background      | rgba(255, 255, 255, 0.72)
Text Color      | #0B1218 (Navy)
Padding         | 12px 16px
Border Radius   | 999px
Font Weight     | 700
Font Size       | 15px
Border          | 1px solid rgba(11, 18, 24, 0.14)
Shadow          | none
Cursor          | pointer
Hover           | brightness(1.02) filter
Focus           | outline 2px solid #F56A2A
```

**Usage**:
- Ações secundárias
- Navegação (voltar, etc)
- Cancellation

### 2.2 Input

#### Input/Text
```
Property         | Value
─────────────────|────────────────────────────────
Border          | 1px solid rgba(0, 0, 0, 0.14)
Border Radius   | 6px
Background      | #FFFFFF
Padding         | 12px 16px
Font Size       | 15px
Color           | #0B1218
Shadow          | 0 1px 2px rgba(0, 0, 0, 0.05)
Transition      | all 0.2s
Width           | 100% (em containers)
Height          | 40px (min)
```

**States**:
- Default: como acima
- Focus: border-color → rgba(11, 18, 24, 0.28), shadow enhanced
- Disabled: background-color → rgba(0, 0, 0, 0.06), color-text faded
- Error: border-color → #E85C5C, shadow com tint vermelho
- Success: border-color → #6FCF97

**Validations**:
- CPF: máscara automática (###.###.###-##)
- Email: validação padrão HTML5
- Senha: validação em tempo real (comprimento mínimo)

#### Input/Label
```
Font Size       | 13px
Font Weight     | 700
Text Transform  | uppercase
Letter Spacing  | 0.05em
Color           | #0B1218
Margin Bottom   | 8px
```

#### Input/Helper Text
```
Font Size       | 12px
Color           | #8A9AB0 (muted)
Margin Top      | 4px
```

#### Input/Error Message
```
Font Size       | 12px
Color           | #E85C5C (danger)
Margin Top      | 4px
```

### 2.3 Card

```
Property         | Value
─────────────────|────────────────────────────────
Background      | rgba(255, 255, 255, 0.78)
Border          | 1px solid rgba(11, 18, 24, 0.08)
Border Radius   | 16px
Shadow          | --shadow-1
Padding         | 16px (padrão)
─────────────────|────────────────────────────────
```

**Variants**:
- **Compact**: padding 12px
- **Large**: padding 24px
- **No Shadow**: shadow none (para layouts específicos)

**States**:
- Default: como acima
- Hover: shadow → --shadow-2, transform translateY(-2px)
- Active/Selected: border → 2px solid #F56A2A, padding-adjusted

**Composição típica**:
```
Card {
  + Heading (16px, 700 weight)
  + Content (15px, 400 weight)
  + Actions (buttons)
}
```

### 2.4 Pill / Badge

```
Property         | Value
─────────────────|────────────────────────────────
Display         | inline-flex
Align Items     | center
Gap             | 10px
Padding         | 8px 12px
Border Radius   | 999px
Background      | rgba(245, 240, 235, 0.9)
Border          | 1px solid rgba(11, 18, 24, 0.08)
Font Size       | 12px
Color           | #4A5A6A (slate)
─────────────────|────────────────────────────────
```

**Dot Indicator (pillDot)**:
```
Width           | 10px
Height          | 10px
Border Radius   | 999px
Background      | #F56A2A (accent)
```

**Variants**:
- **Status Pill**: background/border mudadas conforme status
  - Success: bg-light-green, border-green
  - Danger: bg-light-red, border-red
  - Warning: bg-light-yellow, border-yellow
  - Info: bg-light-cyan, border-cyan

### 2.5 Divider

```
Height          | 1px
Background      | rgba(11, 18, 24, 0.08)
Margin Y        | 12px ou 16px
```

### 2.6 Checkbox

```
Size            | 18px × 18px
Border          | 2px solid rgba(11, 18, 24, 0.28)
Border Radius   | 4px
Background      | white (unchecked), #0B1218 (checked)
Checkmark Color | white
Cursor          | pointer
Focus           | outline 2px solid #F56A2A
Transition      | all 0.2s
```

### 2.7 RadioButton

```
Size            | 18px × 18px
Border          | 2px solid rgba(11, 18, 24, 0.28)
Border Radius   | 999px
Background      | white
Dot Color       | #F56A2A (quando selecionado)
Cursor          | pointer
Focus           | outline 2px solid #F56A2A
Transition      | all 0.2s
```

---

## COMPONENTES COMPOSTOS

### 3.1 Form Group

```
Structure:
├─ Label
├─ Input / Select / Textarea
├─ Helper Text (optional)
└─ Error Message (conditional)

Gap between elements: 8px
```

### 3.2 Shell Header

```
Layout: flex, justify-content space-between, align-items center
Gap: 12px

Left Side:
├─ Logo (34×34px, rounded 12px, bg white, shadow-1)
├─ Title (fontWeight 900)
└─ Subtitle (12px, opacity 0.75)

Right Side:
└─ Right Slot (button, opcional)
```

### 3.3 Shell Navigation

```
Margin Top: 12px
Display: flex (wrap)
Gap: 8px

Shell Nav Item:
├─ Border: 1px solid rgba(11, 18, 24, 0.14)
├─ Background: rgba(255, 255, 255, 0.72)
├─ Padding: 8px 12px
├─ Border Radius: 999px
├─ Font Weight: 900
└─ Cursor: pointer

Active State:
├─ Border Color: rgba(11, 18, 24, 0.28)
└─ Background: rgba(11, 18, 24, 0.06)

Hover:
└─ Filter: brightness(1.02)
```

### 3.4 State Cards (Loading, Error, Empty)

#### Loading Card
```
Card {
  Padding: 16px
  Content:
    ├─ "Carregando..."
    └─ Spinner (opcional)
}
```

#### Error Card
```
Card {
  Padding: 16px
  Content:
    ├─ Heading: "Não foi possível carregar"
    ├─ Message: {error.message}
    └─ Button: "Tentar novamente"
}
```

#### Empty Card
```
Card {
  Padding: 16px
  Content:
    ├─ Heading: {emptyState.title}
    ├─ Body: {emptyState.body}
    └─ Button Primary: {emptyState.ctaLabel}
}
```

### 3.5 Portfolio Holding Card

```
Card {
  Padding: 14px
  Display: grid / flex

  Left Side:
  ├─ Ticker (13px, uppercase, bold)
  ├─ Company Name (15px, bold)
  └─ Quantity (12px, muted)

  Right Side:
  ├─ Current Price (15px, bold)
  ├─ Variation % (12px, colored)
  └─ Total Value (15px, bold)

  Action: clickable → navigate to detail
}
```

### 3.6 Insight Card

```
Card {
  Padding: 16px
  Gap: 12px

  Header:
  ├─ Kind Badge (pill)
  └─ Title (16px, bold)

  Body: (15px, 400 weight)

  Footer:
  └─ Priority Badge (numeric, colored)
}
```

### 3.7 Timeline Item

#### Snapshot
```
Timeline Item {
  Card {
    Header:
    ├─ Date (13px, bold)
    └─ Reference Date

    Body:
    ├─ Total Equity
    ├─ Total Invested
    ├─ Total P&L (colored)
    └─ Total P&L % (colored)

    Badge: Analysis (score, status)
  }
}
```

#### Event
```
Timeline Item {
  Container (simples)
  ├─ Timestamp
  ├─ Type Badge
  ├─ Status
  └─ Message
}
```

---

## TELAS POR FEATURE

### 4.1 Auth - LoginScreen

#### Layout Principal
```
┌─────────────────────────────────────────┐
│ App Bar (64px)                          │
│ [Logo/Back]  ......  [Empty]            │
├─────────────────────────────────────────┤
│                                         │
│  Max Width: 384px, centered             │
│                                         │
│  [Header]                               │
│  ├─ Title: "Acesso ao Cofre" (32px)     │
│  ├─ Subtitle com border-bottom          │
│  └─ "Acesse sua conta..."               │
│                                         │
│  [Form] gap 24px                        │
│  ├─ CPF/Email Input                     │
│  ├─ Password Input (toggle show)        │
│  ├─ Remember Device Checkbox            │
│  ├─ Button Primary: "Acessar"           │
│  └─ Link: "Esqueci minha senha"         │
│                                         │
│  Padding Bottom: 80px (mobile safe)     │
│                                         │
└─────────────────────────────────────────┘
```

#### Estados
1. **Ready**: Formulário preenchível
2. **Loading**: Button desabilitado, spinner dentro
3. **Error**: Mensagem de erro acima do form (color: danger)

#### Validações Live
- CPF: máscara automática conforme digita
- Email: validação simples (tem @)
- Senha: não vazia
- Submit: habilitado quando válido

---

### 4.2 Onboarding - OnboardingScreen

#### Layout
```
┌─────────────────────────────────────────┐
│ Header (semelhante a home)              │
├─────────────────────────────────────────┤
│ Progress Bar (% based)                  │
├─────────────────────────────────────────┤
│                                         │
│ Card Container gap 24px                 │
│                                         │
│ [Step Card]                             │
│ ├─ Step Counter (e.g., "1 de 5")        │
│ ├─ Title (18px, bold)                   │
│ ├─ Hint (15px, muted)                   │
│ └─ Form Controls (flex, gap 16px)       │
│    └─ Specific to step                  │
│                                         │
│ [Actions] gap 12px                      │
│ ├─ Button Ghost: "Voltar" (se not 1)    │
│ ├─ Button Primary: "Próximo" (se not 5) │
│ ├─ Button Primary: "Concluir" (se 5)    │
│ └─ Link: "Pular" (optional)              │
│                                         │
└─────────────────────────────────────────┘
```

#### Steps (5 total)

**Step 1: Objetivo**
- Title: "Seu objetivo"
- Hint: "Uma escolha simples para calibrar a leitura."
- Control: Select ou Radio buttons
  - Opções: Aposentadoria, Renda Extra, Crescimento, Preservação, etc
- State: financialGoal

**Step 2: Renda e Horizonte**
- Title: "Renda e horizonte"
- Hint: "Só o suficiente para evitar recomendação errada."
- Controls (grid 2 colunas em desktop):
  - Select: Faixa de renda mensal
    - < 2k, 2k-5k, 5k-10k, 10k-20k, > 20k
  - Select: Horizonte de investimento
    - < 1 ano, 1-3 anos, 3-5 anos, > 5 anos
  - Input: Meta mensal de investimento (opcional)
- State: monthlyIncomeRange, investmentHorizon, monthlyInvestmentTarget

**Step 3: Risco**
- Title: "Risco"
- Hint: "Sem quiz pesado agora. Só um norte."
- Control: Radio buttons (3-4 opções)
  - Conservador, Moderado, Agressivo, Muito Agressivo
- State: riskProfileSelfDeclared

**Step 4: Plataformas**
- Title: "Plataformas"
- Hint: "Para sugerir o melhor caminho de importação."
- Control: Checkbox list
  - Nubank, XP Investimentos, BTG Pactual, Banco do Brasil, Caixa, etc
  - (baseado no contrato platformsUsed)
- State: platformsUsed

**Step 5: Revisão**
- Title: "Revisão"
- Hint: "Confirme o contexto antes de seguir."
- Display (readonly):
  - Goal (com label)
  - Income & Horizon
  - Risk Profile
  - Platforms
- Controls:
  - Button Primary: "Confirmar e ir para home"
  - Button Ghost: "Voltar para editar"

#### Estados de Tela
- Loading: "Carregando contexto..."
- Error: Mensagem de erro com retry
- Ready: Step atual exibido

---

### 4.3 Home - HomeScreen

#### Layout (Shell + Container)
```
┌─────────────────────────────────────────┐
│ Shell Header                            │
│ [Logo + "Home"]  .... ["Editar contexto"]│
├─────────────────────────────────────────┤
│ Shell Navigation                        │
│ [Home] [Carteira] [Radar] ...           │
├─────────────────────────────────────────┤
│ Main Content (gap 12px)                 │
│                                         │
│ {IF redirect_onboarding}                │
│ └─ Card "Completar contexto"            │
│                                         │
│ {IF empty}                              │
│ └─ Card "Nenhuma carteira..."           │
│                                         │
│ {IF ready}                              │
│ ├─ Card: Distribution                   │
│ ├─ Card: Problem + Action (destaque)    │
│ ├─ Grid: Insights (responsive)          │
│ └─ Card: Summary                        │
│                                         │
└─────────────────────────────────────────┘
```

#### Ready State Components

**Distribution Card**
```
Card {
  Title: "Distribuição da carteira"
  Content: Grid de ativos
  ├─ Asset Name + Percentage
  ├─ Percentage bar (colored)
  └─ Value (R$)
}
```

**Problem + Action Card (Destaque)**
```
Card {
  Style: bg-light-orange ou border-orange

  Problem Section:
  ├─ Label: "Problema"
  ├─ Title: {primaryProblem.title}
  ├─ Body: {primaryProblem.body}
  └─ Severity badge

  Divider

  Action Section:
  ├─ Label: "Ação"
  ├─ Title: {primaryAction.title}
  ├─ Body: {primaryAction.body}
  └─ Button Primary: {primaryAction.ctaLabel}
}
```

**Insights Grid**
```
Grid: auto-fit, minmax(280px, 1fr)
Gap: 12px

Insight Card (for each insight):
├─ Kind Badge (pill)
├─ Title (16px, bold)
├─ Body (14px)
└─ Priority badge (numeric, colored)
```

**Summary Card**
```
Card {
  Title: "Resumo"
  Content:
  ├─ Total investido (R$)
  ├─ Total de ativos
  ├─ Performance geral (%)
  └─ Recomendação de ação
}
```

#### Estados
1. **Loading**: Card "Carregando..."
2. **Error**: Card "Não foi possível carregar"
3. **redirect_onboarding**: Card "Completar contexto"
4. **empty**: Card "Nenhuma carteira. Importe primeira!"
5. **ready**: Layout completo

---

### 4.4 Portfolio - PortfolioScreen

#### Layout
```
┌─────────────────────────────────────────┐
│ Shell Header + Navigation               │
├─────────────────────────────────────────┤
│ Main Content (gap 12px)                 │
│                                         │
│ {IF loading}                            │
│ └─ Card "Carregando..."                 │
│                                         │
│ {IF error}                              │
│ └─ Card "Erro ao carregar"              │
│                                         │
│ {IF ready}                              │
│ ├─ Filter Bar Card                      │
│ │  ├─ Performance Filter Buttons        │
│ │  │  ├─ "Todos" [selected]            │
│ │  │  ├─ "Melhores"                     │
│ │  │  └─ "Piores"                       │
│ │  └─ Search Input "Buscar ativo..."    │
│ │                                       │
│ └─ Holdings List (gap 12px)             │
│    ├─ Group Header (category)           │
│    ├─ Holding Card (clickable)          │
│    ├─ Holding Card                      │
│    └─ ...                               │
│                                         │
└─────────────────────────────────────────┘
```

#### Holding Card Structure
```
Card {
  Padding: 14px
  Display: flex, justify-content space-between
  Cursor: pointer
  Hover: shadow → shadow-2

  Left:
  ├─ Ticker (13px, uppercase, bold, color accent)
  ├─ Company Name (15px, bold)
  └─ Qty: {quantity} cotas (12px, muted)

  Right (text-align right):
  ├─ Current Price (15px, bold)
  ├─ Variation {variation}% (12px, colored)
  └─ Total Value R$ {value} (15px, bold, color accent)
}
```

**Variation Color**:
- Positive: #6FCF97 (green)
- Negative: #E85C5C (red)
- Neutral: #4A5A6A (slate)

#### Filter Bar Logic
```
Perf Filter State: 'all' | 'best' | 'worst'
Query State: string (search text)

Holdings displayed = filtered by perf + search query (case-insensitive)

Groups shown only if has filtered holdings
```

---

### 4.5 Holding Detail - HoldingDetailScreen

#### Layout (Full Page)
```
┌─────────────────────────────────────────┐
│ App Bar (simple)                        │
│ [Back Button]  ......  [Open Link]      │
├─────────────────────────────────────────┤
│                                         │
│ Main Content Card (gap 16px)            │
│                                         │
│ [Header]                                │
│ ├─ Ticker (18px, bold, accent color)    │
│ ├─ Company Full Name (15px)             │
│ └─ Last Update Timestamp (12px, muted)  │
│                                         │
│ [Price Section] gap 8px                 │
│ ├─ Current Price (24px, bold)           │
│ ├─ Variation (16px, colored)            │
│ └─ Date (12px, muted)                   │
│                                         │
│ Divider                                 │
│                                         │
│ [Details Grid] 2 colunas                │
│ ├─ Quantity                             │
│ ├─ Entry Price (preço médio)            │
│ ├─ Current Price                        │
│ ├─ Total Invested                       │
│ ├─ Current Value                        │
│ ├─ Gain/Loss (R$ + %)                   │
│ ├─ Dividend Yield (se houver)           │
│ └─ ...                                  │
│                                         │
│ [Actions]                               │
│ ├─ Button Ghost: "Abrir no site"        │
│ └─ Button Ghost: "Voltar"               │
│                                         │
└─────────────────────────────────────────┘
```

#### Detail Grid Item
```
Container {
  Display: grid, gap 4px

  Label: (12px, bold, uppercase)
  Value: (15px, bold)
  [Optional: subtext in 12px muted]
}
```

#### States
- Loading: Skeleton ou "Carregando..."
- Ready: Layout completo acima

---

### 4.6 Radar - RadarScreen

#### Layout (Full Page or Shell)
```
┌─────────────────────────────────────────┐
│ App Bar / Header                        │
│ [Logo + "Radar"]  ....  [Back/Close]    │
├─────────────────────────────────────────┤
│                                         │
│ Main Content (gap 16px)                 │
│                                         │
│ {IF redirect_onboarding}                │
│ └─ Card "Completar contexto"            │
│                                         │
│ {IF pending}                            │
│ └─ Card {pendingState}                  │
│                                         │
│ {IF ready}                              │
│ ├─ Score Card (destaque, grande)        │
│ ├─ Problem Card                         │
│ ├─ Action Card                          │
│ ├─ Action Plan List                     │
│ ├─ Insights Grid                        │
│ └─ Summary Card                         │
│                                         │
└─────────────────────────────────────────┘
```

#### Score Card (Destaque)
```
Card {
  Style: bg-accent + dark text (inverse)
  Padding: 24px
  Text Align: center

  Score Display:
  ├─ Number (48px, bold)
  ├─ Status Badge (e.g., "Bom", "Precisa Atenção")
  └─ Explanation (15px, line-height 1.5)
}
```

#### Problem Card
```
Card {
  Padding: 16px
  Border Left: 4px solid #E85C5C

  Code: (12px, uppercase, muted)
  Title: (16px, bold)
  Body: (15px)
  Severity Badge: (pill)
}
```

#### Action Card
```
Card {
  Padding: 16px
  Border Left: 4px solid #F56A2A

  Code: (12px, uppercase, muted)
  Title: (16px, bold)
  Body: (15px)
  Button: {ctaLabel} → {target}
}
```

#### Action Plan List
```
Card {
  Title: "Plano de ação"
  List:
  ├─ Item 1 (checkbox na esquerda)
  ├─ Item 2
  └─ ...
}
```

#### Insights Grid
```
Grid: auto-fit, minmax(280px, 1fr)
Gap: 12px

[Insight Card] × N
├─ Kind Badge
├─ Title
├─ Body
└─ Priority (numeric)
```

#### Summary Card
```
Card {
  Title: "Resumo da análise"
  Content: Markdown-like text
  └─ Análise completa (multi-line)
}
```

#### Estados
1. **Loading**: "Carregando análise..."
2. **Error**: Mensagem de erro
3. **redirect_onboarding**: "Completar contexto"
4. **pending**: {pendingState card}
5. **ready**: Layout completo acima

---

### 4.7 History - HistoryScreen

#### Layout
```
┌─────────────────────────────────────────┐
│ Shell Header + Navigation               │
├─────────────────────────────────────────┤
│ Main Content (gap 12px)                 │
│                                         │
│ {IF redirect_onboarding}                │
│ └─ Card "Completar contexto"            │
│                                         │
│ {IF empty}                              │
│ └─ Card {emptyState}                    │
│                                         │
│ {IF ready}                              │
│ ├─ Summary Card                         │
│ │  ├─ Total Snapshots: {N}              │
│ │  └─ Latest Date: {date}               │
│ │                                       │
│ └─ Timeline (vertical list)             │
│    ├─ Timeline Item (Snapshot)          │
│    ├─ Timeline Item (Event)             │
│    ├─ Timeline Item (Snapshot)          │
│    └─ ...                               │
│                                         │
└─────────────────────────────────────────┘
```

#### Timeline Item - Snapshot
```
Card {
  Padding: 16px
  Border Left: 3px solid #F56A2A

  Header:
  ├─ Reference Date (13px, bold)
  ├─ Created At (12px, muted)
  └─ Analysis Badge (if present)

  Body (grid 2×2):
  ├─ Total Equity: {value} (13px, label + 15px value)
  ├─ Total Invested: {value}
  ├─ Total P&L: {value} (colored)
  └─ Total P&L %: {value}% (colored)

  Analysis Badge (if present):
  ├─ Score {value}
  ├─ Status {status}
  ├─ Primary Problem
  └─ Primary Action
}
```

#### Timeline Item - Event
```
Container (simples, sem card style)
├─ Vertical line (left border)
├─ Occurred At (12px, muted)
├─ Type Badge (pill)
├─ Status (12px)
└─ Message (14px)
```

#### Timeline Visual Structure
```
─────────────────────────────────────────
│ ● Item 1 (Snapshot)
│
│ ● Item 2 (Event)
│
│ ● Item 3 (Snapshot)
│
└─ ... (continues)
```

#### Estados
1. **Loading**: "Carregando histórico..."
2. **Error**: Mensagem de erro
3. **redirect_onboarding**: "Completar contexto"
4. **empty**: {emptyState card}
5. **ready**: Timeline completa acima

---

### 4.8 Imports - Wizard (3 Steps)

#### Step 1: Center (Overview)

**File**: `ImportsCenterScreen.tsx`

```
┌─────────────────────────────────────────┐
│ Shell Header + Navigation               │
├─────────────────────────────────────────┤
│ Main Content (gap 16px)                 │
│                                         │
│ [Hero Card]                             │
│ ├─ Title: "Centro de importações"       │
│ ├─ Description                          │
│ └─ Button Primary: "Iniciar"            │
│                                         │
│ [Recent Imports Card]                   │
│ ├─ Title: "Últimas importações"         │
│ ├─ List:                                │
│ │  ├─ Import 1 (status badge)           │
│ │  ├─ Import 2                          │
│ │  └─ ...                               │
│ └─ (empty state if nenhuma)             │
│                                         │
└─────────────────────────────────────────┘
```

#### Step 2: Entry (Upload)

**File**: `ImportsEntryScreen.tsx`

```
┌─────────────────────────────────────────┐
│ App Bar                                 │
│ [Back]  "Passo 1: Selecionar arquivo"   │
├─────────────────────────────────────────┤
│                                         │
│ Main Content (gap 24px)                 │
│                                         │
│ [Progress Bar] Step 1/3                 │
│                                         │
│ [Upload Card]                           │
│ ├─ Icon: Upload / Document              │
│ ├─ Title: "Selecione um arquivo"        │
│ ├─ Subtitle: ".csv ou .xlsx"            │
│ ├─ Drag & Drop Area (dashed border)     │
│ │  └─ "Arraste ou clique para selecionar"│
│ └─ Hidden file input                    │
│                                         │
│ [File Info Card] (if selected)          │
│ ├─ Filename                             │
│ ├─ Size                                 │
│ └─ Button: "Remover"                    │
│                                         │
│ [Actions]                               │
│ ├─ Button Ghost: "Voltar"               │
│ └─ Button Primary: "Próximo" (disabled) │
│                                         │
└─────────────────────────────────────────┘
```

#### Step 3: Preview (Validation)

**File**: `ImportsPreviewScreen.tsx`

```
┌─────────────────────────────────────────┐
│ App Bar                                 │
│ [Back]  "Passo 2: Validar dados"        │
├─────────────────────────────────────────┤
│                                         │
│ Main Content (gap 16px)                 │
│                                         │
│ [Progress Bar] Step 2/3                 │
│                                         │
│ [Summary Card]                          │
│ ├─ Total Rows: {N}                      │
│ ├─ Valid Rows: {N} (green)              │
│ ├─ Invalid Rows: {N} (red)              │
│ └─ Duplicate Rows: {N} (yellow)         │
│                                         │
│ [Data Table Card]                       │
│ ├─ Table:                               │
│ │  ├─ Row Number                        │
│ │  ├─ Status (badge)                    │
│ │  ├─ Data (normalized)                 │
│ │  ├─ Error Message (if invalid)        │
│ │  └─ ...                               │
│ └─ Scrollable (horizontal + vertical)   │
│                                         │
│ [Actions]                               │
│ ├─ Button Ghost: "Voltar"               │
│ └─ Button Primary: "Confirmar" (if ok)  │
│                                         │
└─────────────────────────────────────────┘
```

#### Step 4: Commit (Success)

```
┌─────────────────────────────────────────┐
│ App Bar                                 │
│ [Close]  "Importação concluída"         │
├─────────────────────────────────────────┤
│                                         │
│ Main Content (center)                   │
│                                         │
│ [Success Card]                          │
│ ├─ Icon: Checkmark (large, green)       │
│ ├─ Title: "Importação concluída!"       │
│ ├─ Message: {commitData.affectedPositions} posições atualizadas │
│ ├─ Created Snapshot: {snapshotId}       │
│ └─ Button Primary: "Ir para histórico"  │
│                                         │
└─────────────────────────────────────────┘
```

#### Estados por Screen
- **Entry**: Loading, Error, Ready (file selected), Ready (no file)
- **Preview**: Loading, Error, Ready (has rows), Ready (invalid data)

---

### 4.9 Profile - ProfileScreen

#### Layout
```
┌─────────────────────────────────────────┐
│ Shell Header + Navigation               │
├─────────────────────────────────────────┤
│ Main Content (gap 16px)                 │
│                                         │
│ {IF loading}                            │
│ └─ Card "Carregando..."                 │
│                                         │
│ {IF error}                              │
│ └─ Card "Erro ao carregar"              │
│                                         │
│ {IF ready}                              │
│ ├─ [Financial Context Card] (readonly)  │
│ │  ├─ Goal                              │
│ │  ├─ Monthly Income Range              │
│ │  ├─ Investment Horizon                │
│ │  ├─ Risk Profile                      │
│ │  └─ Platforms Used                    │
│ │                                       │
│ ├─ [Preferences Card] (editable)        │
│ │  ├─ Currency Display                  │
│ │  ├─ Notifications Toggle              │
│ │  └─ Theme (se aplicável)              │
│ │                                       │
│ ├─ [Account Card]                       │
│ │  ├─ Email (with edit)                 │
│ │  ├─ Password (change button)          │
│ │  └─ Button: "Sair"                    │
│ │                                       │
│ └─ [Actions]                            │
│    ├─ Button Primary: "Salvar Mudanças" │
│    └─ Button Ghost: "Voltar"            │
│                                         │
└─────────────────────────────────────────┘
```

#### Financial Context Card (Readonly)
```
Card {
  Title: "Contexto Financeiro"

  Grid 2 colunas:
  ├─ Goal: {context.financialGoal}
  ├─ Income: {context.monthlyIncomeRange}
  ├─ Horizon: {context.investmentHorizon}
  ├─ Risk: {context.riskProfileEffective}
  ├─ Platforms: {context.platformsUsed.join(", ")}
  └─ Available to Invest: R$ {context.availableToInvest}

  Footer:
  └─ Button Ghost: "Editar"
}
```

#### Preferences Card
```
Card {
  Title: "Preferências"

  Form Group (gap 16px):
  ├─ Select: Moeda de exibição
  │  └─ Opções: BRL, USD
  │
  ├─ Checkbox: Notificações
  │  └─ Label: "Receber alertas de oportunidades"
  │
  └─ (optional) Toggle: Dark mode
     └─ Label: "Modo escuro"
}
```

#### Account Card
```
Card {
  Title: "Conta"

  Form Group (gap 16px):
  ├─ Input: Email (disabled, com edit button)
  │
  ├─ Button Ghost: "Alterar senha"
  │
  └─ Button Danger: "Sair"
}
```

#### Estados
- Loading: "Carregando perfil..."
- Error: Mensagem de erro
- Ready: Todos os cards acima

---

### 4.10 Splash - SplashScreen

#### Layout
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Grid: 1.2fr / 0.8fr (desktop), 1fr (mobile)   │
│  Gap: 18px                                       │
│  Margin Top: 28px                                │
│                                                  │
│  ┌─────────────────┬──────────────┐             │
│  │   Hero Section  │  Aside Cards │             │
│  │                 │              │             │
│  │ ┌─────────────┐ │ ┌──────────┐ │             │
│  │ │ Logo        │ │ │ Feature1 │ │             │
│  │ │ Tagline     │ │ └──────────┘ │             │
│  │ │ "Consoli... │ │ ┌──────────┐ │             │
│  │ │             │ │ │ Feature2 │ │             │
│  │ │ Button CTA  │ │ └──────────┘ │             │
│  │ │ "Começar"   │ │ ┌──────────┐ │             │
│  │ │             │ │ │ Feature3 │ │             │
│  │ │ Link        │ │ └──────────┘ │             │
│  │ │ "Como func" │ │              │             │
│  │ └─────────────┘ │              │             │
│  │                 │              │             │
│  └─────────────────┴──────────────┘             │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Mobile** (≤ 860px):
```
┌──────────────────────────────┐
│ Hero Section (full width)    │
│ ┌──────────────────────────┐ │
│ │ Logo                     │ │
│ │ Tagline                  │ │
│ │ Button "Começar"         │ │
│ └──────────────────────────┘ │
│                              │
│ Aside Cards (stacked)        │
│ ┌──────────────────────────┐ │
│ │ Feature 1                │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Feature 2                │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Feature 3                │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

#### Hero Section
```
Container {
  Padding: 20px
  Position: relative
  Overflow: hidden (para background gradiente)

  Logo: {Logo image}

  Tagline:
  ├─ Main: "Consolidar. Traduzir. Orientar."
  └─ Sub: Descriptive text

  Actions (gap 12px):
  ├─ Button Primary: "Começar" (onClick: onStart)
  └─ Link: "Como funciona?" (onClick: onSeeHowItWorks)
}
```

#### Feature Card (Aside)
```
Card {
  Padding: 16px

  Icon: (32×32px)

  Title: (16px, bold)

  Description: (14px, muted)
}
```

---

## VARIAÇÕES RESPONSIVAS

### Desktop (> 1280px)
- Container: min(1040px, calc(100% - 32px))
- Grid: max-width respected
- Splash: 1.2fr / 0.8fr
- Portfolio: 3-4 colunas de holdings

### Tablet (768px - 1280px)
- Container: full width com padding
- Grid: auto-fit, minmax(240px, 1fr)
- Splash: 1fr (stacked em algum ponto)
- Portfolio: 2 colunas de holdings

### Mobile (< 768px)
- Container: full width com padding 16px
- Grid: 1 coluna
- Splash: 1 coluna (stacked)
- Portfolio: 1 coluna, cards em vertical
- Navigation: wrap se necessário
- Inputs/Buttons: full width

### Extra Small (< 375px)
- Padding reduzido (12px)
- Font sizes ligeiramente menores (mobile) em alguns lugares
- Buttons/Inputs: full width, height 44px+

---

## TOKENS FINAIS (CSS Variables)

```css
:root {
  /* Colors */
  --c-ink: #0B1218;
  --c-accent: #F56A2A;
  --c-paper: #FFFFFF;
  --c-sand-0: #F5F0EB;
  --c-sand-1: #E2DDD8;
  --c-slate: #4A5A6A;
  --c-muted: #8A9AB0;
  --c-danger: #E85C5C;
  --c-success: #6FCF97;
  --c-warn: #F2B544;
  --c-info: #43C7CF;

  /* Typography */
  --font-sans: "Trebuchet MS", Trebuchet, "Segoe UI", system-ui;
  --font-serif: Georgia, "Times New Roman", Times, serif;

  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-12: 48px;
  --spacing-16: 64px;

  /* Radius */
  --radius-1: 4px;
  --radius-2: 6px;
  --radius-3: 10px;
  --radius-4: 16px;
  --radius-pill: 999px;

  /* Shadows */
  --shadow-1: 0 10px 28px rgba(11, 18, 24, 0.10);
  --shadow-2: 0 18px 44px rgba(11, 18, 24, 0.14);
  --shadow-inset: 0 1px 2px rgba(0, 0, 0, 0.05);

  /* Backdrops */
  --bg-card: rgba(255, 255, 255, 0.78);
  --bg-button-ghost: rgba(255, 255, 255, 0.72);
  --bg-pill: rgba(245, 240, 235, 0.9);
  --border-default: rgba(11, 18, 24, 0.08);
  --border-medium: rgba(11, 18, 24, 0.14);
  --border-strong: rgba(11, 18, 24, 0.28);
}
```

---

**Documento gerado**: 2026-04-05
**Pronto para criação de Figma Design System**
