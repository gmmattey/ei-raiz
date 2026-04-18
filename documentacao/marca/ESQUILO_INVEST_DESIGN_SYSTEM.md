# Esquilo Invest - Design System v1 - Completo

**Figma Link:** https://www.figma.com/design/EpWH8v7RipihZnPlAJKt3d

---

## ESTRUTURA DO ARQUIVO FIGMA

O arquivo foi criado com 3 páginas (limite do plano Starter):
- **Page 1:** Design Tokens & Components
- **Page 2:** All_Screens (17 telas wireframe)
- **Page 3:** Documentation

---

## 1. DESIGN TOKENS

### Paleta de Cores

**PRIMÁRIAS:**
- Orange: `#F56A2A` (CTA, destaque, ações)
- Navy: `#0B1218` (backgrounds, headers, texto principal)

**NEUTROS (Grayscale):**
- White: `#FFFFFF`
- Gray-50: `#F9FAFB`
- Gray-100: `#F3F4F6`
- Gray-200: `#E5E7EB`
- Gray-300: `#D1D5DB`
- Gray-400: `#9CA3AF`
- Gray-500: `#6B7280`
- Gray-600: `#4B5563`
- Black: `#000000`

### Tipografia

**HEADERS - Sora:**
- H1: Bold (700) 32px
- H2: SemiBold (600) 28px
- H3: SemiBold (600) 24px

**BODY - Inter:**
- Body Large: Regular (400) 16px
- Body: Regular (400) 14px
- Caption: Regular (400) 12px

### Spacing (4px base grid)

```
xs:   4px
sm:   8px
md:   12px
lg:   16px
xl:   24px
2xl:  32px
3xl:  48px
4xl:  64px
```

### Border Radius

- Default components: `4px`
- Cards: `12px`
- Pills/badges: `999px`

### Shadows

- **Card:** `0 2px 8px rgba(0,0,0,0.08)`
- **Elevated:** `0 4px 16px rgba(0,0,0,0.12)`

---

## 2. COMPONENTES BASE

### Buttons

**Button/Primary**
- Background: Orange (#F56A2A)
- Text: White, Inter 600 14px
- Height: 48px
- Padding: 0 24px
- Border Radius: 8px

**Button/Secondary**
- Background: Gray-100 (#F3F4F6)
- Text: Navy, Inter 600 14px
- Border: 1px Gray-200
- Height: 48px

**Button/Disabled**
- Background: Gray-200
- Text: Gray-500
- Cursor: not-allowed

### Input Fields

**Input/Default**
- Background: White
- Border: 1px Gray-300
- Padding: 12px 16px
- Height: 44px
- Border Radius: 8px
- Font: Inter 400 14px

**Input/Focus**
- Border: 2px Orange

**Input/Error**
- Border: 2px Red (#EF4444)

### Cards

**Card/Default**
- Background: White
- Border Radius: 12px
- Shadow: Card
- Padding: 20px

**Card/Clickable**
- Hover: Background Gray-50
- Cursor: pointer

### Pills / Badges

**Pill/Active** (Orange)
- Background: Orange
- Text: White, Inter 600 12px
- Border Radius: 999px
- Padding: 6px 12px

**Pill/Inactive** (Gray)
- Background: Gray-200
- Text: Navy, Inter 600 12px

---

## 3. TELAS IMPLEMENTADAS (renderizando)

### 3.1 SPLASH
**Path:** `/splash`

Layout:
- Full-screen orange background
- Logo/mascote (🐿️ emoji ou ícone) 80px
- Título "Esquilo Invest" Sora 32px bold branco
- Subtítulo "Seu assistente de investimentos" Inter 14px branco
- Sem interação (apenas loading)

### 3.2 AUTH LOGIN
**Path:** `/login`
**Código:** `LoginScreen.tsx` (já existe)

Layout:
- Header: "Login" Sora 28px
- Email/Username input
- Password input (masked)
- "Continuar" button (Primary)
- "Criar conta" link (Orange)
- "Esqueceu a senha?" link (Gray)

States:
- Default (vazio)
- Filled
- Loading (spinner no botão)
- Error (border vermelho, mensagem de erro)

### 3.3 AUTH REGISTER
**Path:** `/register`
**Backend:** `auth.ts` (pronto)

Layout:
- Header: "Criar Conta" Sora 28px
- Nome Completo input
- Email input
- Senha input
- Confirmar Senha input
- Checkbox "Concordo com Termos"
- "Criar Conta" button (Primary)
- "Já tem conta?" link

States:
- Default
- Filled
- Loading
- Error

### 3.4 AUTH FORGOT PASSWORD
**Path:** `/forgot-password`
**Backend:** `auth.ts` (pronto)

Layout:
- Header: "Recuperar Senha" Sora 28px
- Descrição: "Informe seu email para recuperar acesso"
- Email input
- "Enviar Link" button (Primary)
- "Voltar para Login" link

States:
- Default
- Loading
- Success (mensagem "Email enviado!")
- Error

### 3.5 ONBOARDING
**Path:** `/onboarding`

5 Steps:
1. Bem-vindo
2. Meu Perfil
3. Preferências de Investimento
4. Documentação
5. Pronto para Começar

Layout por step:
- Header: "Passo X de 5" Sora 20px
- Conteúdo específico
- Progress bar (X/5)
- "Próximo" button (Primary)
- "Pular" button (Secondary)

### 3.6 HOME / DASHBOARD
**Path:** `/home`
**Código:** `HomeScreen.tsx` (já existe)

Layout (Desktop + Mobile):

**Mobile (375px):**
- Header Navy (60px): Logo + username
- Welcome card com patrimônio total (Orange)
- Quick Actions: Portfolio, Histórico, Importar
- Holdings preview (top 3)
- Bottom nav (5 items)

**Desktop (1040px+):**
- Sidebar (280px) Navy: Nav + perfil
- Main content: 3 colunas
  - Esquerda: Performance chart
  - Centro: Holdings list
  - Direita: Market news / Radar insights

States (5):
1. Empty (sem dados)
2. Loading (skeletons)
3. Error (mensagem + retry)
4. Ready (dados carregados)
5. Redirect (autenticação necessária)

### 3.7 PORTFOLIO
**Path:** `/portfolio`
**Código:** `PortfolioScreen.tsx` (já existe)

Layout:
- Header: "Meus Ativos" Sora 28px
- Filters: Categoria, Plataforma, Status (Pills)
- Holdings list:
  - Card por ativo (PETR4, VALE3, etc)
  - Ticker, valor, quantidade, variação (%)
  - Indicador de tendência (↑/↓)

States (3):
1. Empty (nenhum ativo)
2. Loading (skeletons)
3. Ready (dados carregados)

### 3.8 HOLDING DETAIL
**Path:** `/portfolio/:ticker`

Layout:
- Header Navy: Ticker, nome empresa
- Categoria / Setor
- Preço atual, quantidade, data de compra
- Performance (gráfico)
- Análise de risco (score)
- Ações: Vender, Adicionar, Detalhes

States (2):
1. Loading
2. Ready

### 3.9 RADAR / SCORE
**Path:** `/radar`
**Código:** Controller existe
**Backend:** `ai_suggestion_service.ts`

Layout:
- Header: "Análise de Risco" Sora 28px
- Score Card (circular): 0-10
- Breakdown:
  - Diversificação
  - Concentração
  - Setor balance
  - Risco regional
- AI Suggestion Card (destaque Orange):
  - Ícone 💡
  - "Sugestão IA"
  - Recomendação textual
  - "Considerar" button

States (5):
1. Loading
2. Error
3. Low Risk (verde)
4. Medium Risk (amarelo)
5. High Risk (vermelho)

### 3.10 HISTORY / TIMELINE
**Path:** `/history`
**Código:** `HistoryScreen.tsx` (já existe)

Layout:
- Header: "Histórico" Sora 28px
- Timeline vertical:
  - Data (16 de março)
  - Tipo de evento (Compra/Venda/Importação)
  - Ativo, quantidade, valor
  - Horário
  - Status badge

States (5):
1. Empty
2. Loading
3. Ready
4. Error
5. Filtered (por período)

### 3.11 IMPORTS - START
**Path:** `/imports`
**Código:** `ImportScreen.tsx` (já existe)

Layout:
- Header: "Importar Dados" Sora 28px
- Descrição: "Selecione arquivo CSV ou Excel"
- Upload box:
  - Dashed border Orange
  - Ícone 📁
  - "Arrastar ou clicar"
- Últimas importações (se houver)

### 3.12 IMPORTS - PREVIEW
**Path:** `/imports/preview`

Layout:
- Header: "Visualizar Dados" Sora 28px
- Tabela com colunas:
  - Ativo (ticker)
  - Quantidade
  - Preço
  - Data
- Resumo: "3 ativos serão importados"
- Botões:
  - "Voltar" (Secondary)
  - "Próximo" (Primary)

### 3.13 IMPORTS - CONFLICTS (NOVO)
**Path:** `/imports/conflicts`
**Backend:** `import_conflicts_service.ts`

Layout:
- Header: "Resolver Conflitos" Sora 28px
- Contador: "2 conflitos encontrados"
- Conflict cards:
  - Ícone ⚠️
  - Tipo de conflito (Preço, Data, Duplicado)
  - Dados importados vs sistema
  - Botões: "Usar importado" / "Usar sistema"
- Progresso: 1/2 resolvido
- "Próximo" button (ativo após resolver todos)

### 3.14 IMPORTS - COMMIT
**Path:** `/imports/commit`

Layout:
- Header: "Confirmar Importação" Sora 28px
- Resumo:
  - "3 ativos serão importados"
  - "0 conflitos resolvidos"
  - "Nenhuma duplicação"
- Checkbox: "Confirmo que os dados estão corretos"
- Botões:
  - "Cancelar" (Secondary)
  - "Confirmar Importação" (Primary, ativo após confirmar checkbox)

### 3.15 IMPORTS - DETAIL (NOVO)
**Path:** `/imports/:id/detail`
**Backend:** `import_detail_service.ts`

Layout:
- Header: "Detalhes Técnicos" Sora 28px
- Informações técnicas:
  - ID: IMP-2025-03-001
  - Data: 16 de março, 10:30
  - Status: Processando ✅
  - Total: 10 ativos
  - Processados: 7
  - Progress bar visual (70%)
- Detalhes de cada ativo:
  - Ticker, status (✅ / ⏳ / ❌)
  - Erros (se houver)
- "Baixar Relatório" button
- "Voltar" button

### 3.16 IMPORTS - ENGINE STATUS (NOVO)
**Path:** `/imports/engine-status`
**Backend:** `import_engine_status_service.ts`

Layout:
- Header: "Status do Motor" Sora 28px
- Status badge:
  - 🔄 Ativo (Orange)
  - ⏸️ Pausado (Gray)
  - ❌ Erro (Red)
- Informações:
  - Última sincronização: 16 mar 10:30
  - Próxima sincronização: 16 mar 11:30
  - Intervalo: 1 hora
  - Importações pendentes: 0
- Logs recentes:
  - Timestamp, mensagem, status
- Controles (admin):
  - "Pausar" / "Retomar" button
  - "Executar Agora" button
  - "Limpar Logs" button

### 3.17 PROFILE / SETTINGS
**Path:** `/profile`

Layout:
- Header Navy (60px): "Perfil"
- Seção Dados Pessoais:
  - Avatar (circular 80px)
  - Nome (editável)
  - Email (não-editável)
  - CPF (masked)
- Seção Preferências:
  - Notificações (toggle)
  - Tema (light/dark)
  - Idioma (pt-BR / en-US)
- Seção Segurança:
  - "Alterar Senha" button
  - "2FA" toggle
- Seção Legal:
  - "Termos de Uso" link
  - "Política de Privacidade" link
- "Sair" button (Secondary, Red text)

States (3):
1. Viewing (padrão)
2. Editing (campos editáveis)
3. Loading (salvando alterações)

---

## 4. LAYOUT RESPONSIVO

### Mobile (375px width)
- Full-width content
- Bottom navigation (80px)
- No sidebar
- Cards stacked vertically

### Tablet (768px width)
- 2-column layout onde aplicável
- Sidebar colapsável (96px)
- Touch-friendly buttons (48px min)

### Desktop (1040px+ width)
- 3-column layout
- Sidebar permanent (280px)
- Main content max-width: 800px
- Right sidebar: insights/charts

---

## 5. COMPONENTES DE ESTADO

### Loading State
- Skeleton screens com shimmer effect
- Placeholder boxes (Gray-100)
- Progress indicators

### Error State
- Ícone ⚠️ ou ❌
- Mensagem de erro clara
- "Retry" button

### Empty State
- Ícone ilustrativo
- Mensagem "Nenhum dado encontrado"
- CTA para ação (ex: "Importar dados")

### Success State
- Ícone ✅
- Mensagem confirmação
- Auto-dismiss em 3 segundos ou manual

---

## 6. GUIAS DE IMPLEMENTAÇÃO

### Colors - CSS Variables
```css
--color-primary: #F56A2A;
--color-secondary: #0B1218;
--color-white: #FFFFFF;
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-black: #000000;
```

### Typography - CSS Classes
```css
.h1 { font-family: 'Sora'; font-size: 32px; font-weight: 700; }
.h2 { font-family: 'Sora'; font-size: 28px; font-weight: 600; }
.h3 { font-family: 'Sora'; font-size: 24px; font-weight: 600; }
.body-lg { font-family: 'Inter'; font-size: 16px; font-weight: 400; }
.body { font-family: 'Inter'; font-size: 14px; font-weight: 400; }
.caption { font-family: 'Inter'; font-size: 12px; font-weight: 400; }
```

### Spacing - CSS Classes
```css
.p-xs { padding: 4px; }
.p-sm { padding: 8px; }
.p-md { padding: 12px; }
.p-lg { padding: 16px; }
.p-xl { padding: 24px; }
.p-2xl { padding: 32px; }
.p-3xl { padding: 48px; }
.p-4xl { padding: 64px; }
```

### Button Examples

**Primary Button:**
```jsx
<button className="btn btn-primary">
  Continue
</button>
```

**Secondary Button:**
```jsx
<button className="btn btn-secondary">
  Cancel
</button>
```

---

## 7. CHECKLIST DE IMPLEMENTAÇÃO

### Telas Concluídas ✅
- [x] Splash
- [x] Auth Login
- [x] Onboarding
- [x] Home/Dashboard
- [x] Portfolio
- [x] Holding Detail
- [x] Radar (controller existe)
- [x] History
- [x] Imports Start

### Telas Planejadas (Faltam Componentes) 🎯
- [ ] Auth Register
- [ ] Auth Forgot Password
- [ ] Imports Conflicts
- [ ] Imports Detail
- [ ] Imports Engine Status
- [ ] Analysis Details (expandido com AI)
- [ ] Profile

### Dev Tasks 📋
- [ ] Converter componentes para React/Vue conforme arquitetura
- [ ] Integrar com endpoints backend (auth, portfolio, imports, etc)
- [ ] Implementar states (loading, error, empty, success)
- [ ] Testes de responsividade (mobile/tablet/desktop)
- [ ] Acessibilidade (WCAG 2.1)
- [ ] Integração com design tokens (CSS variables)

---

## 8. PRÓXIMOS PASSOS

1. **Manual Setup no Figma:** Como o plano Starter tem limite de MCP calls, você pode:
   - Entrar em https://www.figma.com/design/EpWH8v7RipihZnPlAJKt3d
   - Criar frames manualmente para cada tela
   - Aplicar estilos conforme especificação acima
   - Usar componentes reutilizáveis para botões, cards, inputs

2. **Upgrade para Professional:** Se precisar de mais automação, considere upgrade do plano para:
   - Ilimitadas páginas
   - Ilimitadas MCP calls
   - Variantes de componentes

3. **Código Frontend:** Baseado neste design system:
   - Implementar componentes React (Button, Card, Input, etc)
   - Criar páginas das 17 telas
   - Conectar com APIs backend
   - Testes E2E

---

**Última atualização:** 2026-04-05
**Versão:** 1.0 - Design System Completo
**Status:** Especificação pronta para desenvolvimento
