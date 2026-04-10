# Esquilo Invest - Detalhamento de Telas

## 📋 Índice Rápido

| # | Tela | Status | Path | Arquivo |
|---|------|--------|------|---------|
| 1 | Splash | ✅ | `/splash` | Splash (auto) |
| 2 | Login | ✅ | `/login` | LoginScreen.tsx |
| 3 | Register | 🎯 | `/register` | RegisterScreen.tsx (novo) |
| 4 | Forgot Password | 🎯 | `/forgot-password` | ForgotPasswordScreen.tsx (novo) |
| 5 | Onboarding | ✅ | `/onboarding` | OnboardingScreen.tsx |
| 6 | Home/Dashboard | ✅ | `/home` | HomeScreen.tsx |
| 7 | Portfolio | ✅ | `/portfolio` | PortfolioScreen.tsx |
| 8 | Holding Detail | ✅ | `/portfolio/:ticker` | HoldingDetailScreen.tsx |
| 9 | Radar | ✅ | `/radar` | RadarScreen.tsx |
| 10 | History | ✅ | `/history` | HistoryScreen.tsx |
| 11 | Imports - Start | ✅ | `/imports` | ImportsScreen.tsx |
| 12 | Imports - Preview | ✅ | `/imports/preview` | ImportsPreviewScreen.tsx |
| 13 | Imports - Conflicts | 🎯 | `/imports/conflicts` | ImportsConflictsScreen.tsx (novo) |
| 14 | Imports - Commit | ✅ | `/imports/commit` | ImportsCommitScreen.tsx |
| 15 | Imports - Detail | 🎯 | `/imports/:id/detail` | ImportsDetailScreen.tsx (novo) |
| 16 | Imports - Engine Status | 🎯 | `/imports/engine-status` | ImportsEngineStatusScreen.tsx (novo) |
| 17 | Profile | ✅ | `/profile` | ProfileScreen.tsx |

---

## 📱 TELAS DETALHADAS

### 1. SPLASH (Auto-load)

**Descrição:** Tela de apresentação com branding. Aparece automaticamente ao abrir o app.

**Duração:** 2-3 segundos → redireciona para Login ou Home (se autenticado)

**Layout:**
```
┌──────────────────────────────┐
│                              │
│         Orange BG            │
│                              │
│          🐿️ (80px)           │
│                              │
│    Esquilo Invest            │
│    (Sora, 32px, bold)        │
│                              │
│ Seu assistente de investimentos
│ (Inter, 14px, white)         │
│                              │
└──────────────────────────────┘
```

**Estados:**
- Default (carregando)
- Fade-out → Login (se não autenticado)
- Fade-out → Home (se autenticado)

**Componentes:**
- Background color: Orange (#F56A2A)
- Logo: Emoji 🐿️ ou SVG (80x80px)
- Tipografia: Sora headers, Inter body
- Sem interação

**Backend:**
Nenhum (apenas verificar token localStorage)

**Próxima tela:**
- Sem token → `/login`
- Com token → `/home`

---

### 2. LOGIN (Autenticação)

**Descrição:** Formulário de login com email/username e password.

**Path:** `/login`
**Arquivo:** `LoginScreen.tsx` (já existe)
**Backend:** `auth.ts` → `POST /auth/login`

**Layout Mobile (375px):**
```
┌──────────────────────────────┐
│                              │
│  ← Back | Esquilo      Menu  │  (opcional header)
│                              │
│  Login                       │
│  (Sora, 28px, bold)          │
│                              │
│  Email ou usuário            │
│  (Inter, 12px, gray)         │
│  ┌──────────────────────┐   │
│  │ user@email.com       │   │ (input)
│  └──────────────────────┘   │
│                              │
│  Senha                       │
│  (Inter, 12px, gray)         │
│  ┌──────────────────────┐   │
│  │ ••••••••             │   │ (input password)
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │  ▶ Continuar         │   │ (Primary Button)
│  └──────────────────────┘   │
│                              │
│  Criar conta  ·  Esqueceu?   │ (links)
│                              │
└──────────────────────────────┘
```

**Componentes:**
- Input: Email/Username (validação)
- Input: Password (type=password)
- Button: Primary "Continuar" (48px height)
- Link: "Criar conta" (orange)
- Link: "Esqueceu a senha?" (gray)
- States: default, filled, loading, error

**Form Validação:**
```javascript
{
  email: { required: true, pattern: email|username },
  password: { required: true, minLength: 6 }
}
```

**Estados:**
1. **Default:** Campos vazios, button disabled
2. **Filled:** Button enabled
3. **Loading:** Spinner no button, campos disabled
4. **Error:** Border vermelho no campo, mensagem abaixo

**Submit Flow:**
```
1. Validar campos (client)
2. POST /auth/login { email, password }
3. Se sucesso:
   - localStorage.setItem('token', response.token)
   - Redirect → /home
4. Se erro:
   - Mostrar erro em vermelho
   - Shake animation no input
```

**Testes:**
- [ ] Email vazio → erro
- [ ] Password vazio → erro
- [ ] Email inválido → erro
- [ ] Password < 6 chars → erro
- [ ] Credenciais erradas → erro do backend
- [ ] Login sucesso → token saved + home redirect

---

### 3. REGISTER (Novo - 🎯)

**Descrição:** Formulário de criação de nova conta.

**Path:** `/register`
**Arquivo:** `RegisterScreen.tsx` (novo)
**Backend:** `auth.ts` → `POST /auth/register`

**Layout Mobile:**
```
┌──────────────────────────────┐
│                              │
│  ← Back | Criar Conta   Menu │
│                              │
│  Criar Conta                 │
│  (Sora, 28px)                │
│                              │
│  Nome Completo               │
│  ┌──────────────────────┐   │
│  │ João Silva           │   │
│  └──────────────────────┘   │
│                              │
│  Email                       │
│  ┌──────────────────────┐   │
│  │ joao@email.com       │   │
│  └──────────────────────┘   │
│                              │
│  Senha                       │
│  ┌──────────────────────┐   │
│  │ ••••••••             │   │
│  └──────────────────────┘   │
│                              │
│  Confirmar Senha             │
│  ┌──────────────────────┐   │
│  │ ••••••••             │   │
│  └──────────────────────┘   │
│                              │
│  ☐ Concordo com Termos       │ (checkbox)
│                              │
│  ┌──────────────────────┐   │
│  │  ▶ Criar Conta       │   │
│  └──────────────────────┘   │
│                              │
│  Já tem conta? Fazer login   │
│                              │
└──────────────────────────────┘
```

**Componentes:**
- Input: Nome Completo
- Input: Email
- Input: Senha (password)
- Input: Confirmar Senha (password)
- Checkbox: "Concordo com Termos"
- Button: Primary "Criar Conta"
- Link: "Fazer login"

**Form Validação:**
```javascript
{
  fullName: { required: true, minLength: 3 },
  email: { required: true, pattern: email },
  password: { required: true, minLength: 8, pattern: /(?=.*[A-Z])(?=.*[0-9])/ },
  confirmPassword: { required: true, equals: password },
  terms: { required: true, value: true }
}
```

**Estados:**
- Default: campos vazios, button disabled
- Filled: button enabled se tudo preenchido
- Loading: spinner, campos disabled
- Error: mensagens específicas por campo
- Success: redireciona para Home com auto-login

**Submit Flow:**
```
1. Validar campos (client)
2. POST /auth/register {
     fullName,
     email,
     password
   }
3. Se sucesso:
   - Auto-login (salvar token)
   - Redirect → /onboarding (primeira vez)
4. Se erro:
   - Email já existe → mensagem de erro
   - Outro erro → mostrar
```

---

### 4. FORGOT PASSWORD (Novo - 🎯)

**Descrição:** Fluxo de recuperação de senha via email.

**Path:** `/forgot-password`
**Arquivo:** `ForgotPasswordScreen.tsx` (novo)
**Backend:** `auth.ts` → `POST /auth/forgot-password`

**Layout:**
```
┌──────────────────────────────┐
│                              │
│  ← Back | Recuperar Senha    │
│                              │
│  Recuperar Senha             │
│  (Sora, 28px)                │
│                              │
│  Informe seu email para      │
│  recuperar acesso            │
│  (Inter, 13px, gray)         │
│                              │
│  Email                       │
│  ┌──────────────────────┐   │
│  │ joao@email.com       │   │
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │  ▶ Enviar Link       │   │
│  └──────────────────────┘   │
│                              │
│  ← Voltar para Login         │
│                              │
└──────────────────────────────┘
```

**Estados:**
1. **Default:** Email vazio, button enabled
2. **Loading:** Enviando, button loading
3. **Success:** "Email enviado com sucesso!" + countdown 5s → redirect login
4. **Error:** Email não encontrado → mensagem

**Submit Flow:**
```
1. POST /auth/forgot-password { email }
2. Se sucesso:
   - Mostrar "Email enviado!"
   - Link instructions
   - Auto-redirect login após 5s
3. Se erro:
   - Email não existe
   - Rate limit
```

---

### 5. ONBOARDING (5 Steps)

**Descrição:** Wizard de introdução para novos usuários. 5 telas sequenciais.

**Path:** `/onboarding`
**Arquivo:** `OnboardingScreen.tsx`

**Step 1: Bem-vindo**
```
┌──────────────────────────────┐
│                              │
│                    ████░░░░░ │ (progress)
│                              │
│  🎉                          │
│                              │
│  Bem-vindo ao Esquilo!       │
│  (Sora, 32px)                │
│                              │
│  Vamos começar sua jornada   │
│  de investimento             │
│  (Inter, 14px, gray)         │
│                              │
│  ┌──────────────────────┐   │
│  │ ▶ Próximo            │   │ (Primary)
│  └──────────────────────┘   │
│                              │
│  Pular onboarding            │ (Secondary)
│                              │
└──────────────────────────────┘
```

**Step 2: Meu Perfil**
- Nome
- Data de nascimento
- Profissão
- Renda

**Step 3: Preferências**
- Objetivo de investimento (growth, income, balance)
- Horizon temporal (curto, médio, longo)
- Tolerância ao risco

**Step 4: Documentação**
- Enviar comprovante residência
- Aceitar termos

**Step 5: Pronto para Começar**
- Resumo do perfil
- "Começar" button → `/home`

**Componentes:**
- Progress bar (visual e textual: "Passo 2 de 5")
- Form fields por step
- Button: "Próximo"
- Button: "Pular"
- Navegação: anterior/próximo

---

### 6. HOME / DASHBOARD (5 Estados)

**Descrição:** Tela principal com patrimônio, ações rápidas e preview de ativos.

**Path:** `/home`
**Arquivo:** `HomeScreen.tsx` (já existe)

**Layout Mobile:**
```
┌──────────────────────────────┐
│ ☰ Logo           Search ⚙️  │ (Header Navy)
├──────────────────────────────┤
│                              │
│ Bem-vindo, João!             │ (greeting)
│                              │
│ ┌──────────────────────────┐ │
│ │ Patrimônio Total         │ │ (Orange card)
│ │ R$ 25.000,00             │ │
│ │                          │ │
│ │ Variação: +5,2% (30d)    │ │
│ └──────────────────────────┘ │
│                              │
│ Ações Rápidas                │
│ ┌──────┐ ┌──────────────┐   │
│ │ 📊   │ │ 📈PortfolioX │   │
│ │Port  │ └──────────────┘   │
│ └──────┘ ┌──────────────┐   │
│ ┌──────┐ │ 📥ImportarX  │   │
│ │ 📥   │ └──────────────┘   │
│ │Import│ ┌──────────────┐   │
│ └──────┘ │ 📋HistóricoX │   │
│          └──────────────┘   │
│                              │
│ Meus Ativos                  │
│ ┌──────────────────────────┐ │
│ │ PETR4  | 10 ações        │ │ (card)
│ │ Energia                  │ │
│ │ R$ 5.200,00  ↑ +2,5%     │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ VALE3  | 5 ações         │ │
│ │ Mineração                │ │
│ │ R$ 2.100,00  ↓ -1,2%     │ │
│ └──────────────────────────┘ │
│                              │
├──────────────────────────────┤
│ 📊  📈  📥  👤              │ (Bottom Nav)
└──────────────────────────────┘
```

**Estados (5):**

1. **Empty:** Sem portfólio
   - Mostrar "Nenhum ativo importado ainda"
   - CTA: "Importar Dados"

2. **Loading:** Carregando dados
   - Skeleton cards (patrimônio, ativos)
   - Shimmer effect

3. **Error:** Erro na conexão
   - Mensagem: "Erro ao carregar dados"
   - Button: "Tentar Novamente"

4. **Ready:** Dados carregados (padrão)
   - Patrimônio, ações, ativos visíveis
   - Clicável em ativos → detalhe

5. **Redirect:** Sem autenticação
   - Redireciona para `/login`

**Componentes:**
- Header com menu
- Greeting personalizado (bom dia/tarde/noite)
- Wealth card (Orange, grande)
- Quick action buttons (4)
- Holdings preview cards (top 3)
- Bottom navigation (5 items)

**Dados do Backend:**
```
GET /portfolio/summary
{
  totalWorth: number,
  monthlyVariation: number,
  holdings: {
    ticker: string,
    quantity: number,
    price: number,
    variation: number,
    sector: string
  }[]
}
```

---

### 7. PORTFOLIO (3 Estados)

**Descrição:** Lista de todos os ativos do usuário com filtros.

**Path:** `/portfolio`
**Arquivo:** `PortfolioScreen.tsx` (já existe)

**Layout:**
```
┌──────────────────────────────┐
│ ← | Meus Ativos    Search   │
├──────────────────────────────┤
│                              │
│ Filtros:                     │
│ [Todos] [Ações] [FII] [Cripto] │ (pills)
│                              │
│ ┌──────────────────────────┐ │
│ │ PETR4 - Petrobras        │ │
│ │ Energia                  │ │
│ │ 10 ações • R$ 5.200      │ │
│ │ Variação: +2,5% ↑        │ │
│ │ Score Risco: 5/10        │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ VALE3 - Vale             │ │
│ │ Mineração                │ │
│ │ 5 ações • R$ 2.100       │ │
│ │ Variação: -1,2% ↓        │ │
│ │ Score Risco: 6/10        │ │
│ └──────────────────────────┘ │
│                              │
│ [Carregar mais...]           │
│                              │
└──────────────────────────────┘
```

**Estados (3):**
1. **Empty:** "Nenhum ativo importado"
2. **Loading:** Skeleton cards
3. **Ready:** Lista com cards

**Filtros (Pills):**
- Categoria: Ações, Fundos, Cripto, Todos
- Plataforma: B3, Cripto, FII, etc
- Status: Ativo, Arquivado

**Card de Ativo:**
- Ticker (grande, Sora)
- Nome empresa
- Setor
- Quantidade + Preço total
- Variação com indicador (↑/↓)
- Score de risco (1-10)
- Clicável → HoldingDetail

**Dados Backend:**
```
GET /portfolio?category=&platform=&status=
{
  holdings: {
    ticker: string,
    company: string,
    sector: string,
    quantity: number,
    totalPrice: number,
    variation: number,
    riskScore: number
  }[]
}
```

---

### 8. HOLDING DETAIL

**Descrição:** Tela de detalhe de um ativo específico.

**Path:** `/portfolio/:ticker`
**Arquivo:** `HoldingDetailScreen.tsx` (já existe)

**Layout:**
```
┌──────────────────────────────┐
│ Navy BG                      │
│ ← PETR4 - Petrobras          │
│ Energia                      │
│ Preço: R$ 520,00             │
├──────────────────────────────┤
│                              │
│ Resumo                       │
│ Quantidade:    10            │
│ Valor Total:   R$ 5.200      │
│ Data Compra:   16 mar 2025   │
│ Variação 24h:  +2,5% ↑       │
│ Variação 30d:  +8,2% ↑       │
│                              │
│ ┌──────────────────────────┐ │
│ │         (Gráfico)        │ │ (24h | 1M | 3M | 1Y)
│ │         (Line Chart)     │ │
│ │                          │ │
│ │     📈 Performance       │ │
│ └──────────────────────────┘ │
│                              │
│ Análise AI                   │
│ "PETR4 apresenta boa        │
│  oportunidade considerando   │
│  divisão de dividendos"      │
│                              │
│ Ações:                       │
│ [Vender] [Adicionar]         │
│                              │
└──────────────────────────────┘
```

**Seções:**
1. Header (Navy): Ticker, nome, setor, preço atual
2. Resumo: Qtd, valor total, data compra
3. Gráfico: Performance (múltiplos períodos)
4. Análise IA: Insights
5. Ações: Vender, Adicionar, Mais detalhes

**Componentes:**
- Header Navy com back button
- Stats cards
- Line chart (com biblioteca como Chart.js/Recharts)
- AI suggestion card
- Action buttons

**Dados Backend:**
```
GET /portfolio/:ticker
{
  ticker: string,
  company: string,
  sector: string,
  currentPrice: number,
  quantity: number,
  totalValue: number,
  purchaseDate: date,
  variation: { 24h: number, 30d: number, 1y: number },
  chart: { timestamp, price }[],
  aiInsight: string
}
```

---

### 9. RADAR / ANALYSIS

**Descrição:** Análise de risco com score e sugestões IA.

**Path:** `/radar`
**Arquivo:** `RadarScreen.tsx` (já existe)

**Layout:**
```
┌──────────────────────────────┐
│ ← | Análise de Risco   ⚙️   │
├──────────────────────────────┤
│                              │
│ Score Geral                  │
│                              │
│      ╭─────────╮             │
│      │    7.5  │             │ (circular)
│      │   /10   │             │ (Orange fill)
│      ╰─────────╯             │
│      Bom Risco               │
│                              │
│ Detalhamento:                │
│                              │
│ Diversificação       ████░░   │ (progress bar)
│ 6.5/10                       │
│                              │
│ Concentração         ███░░░░  │
│ 5.2/10                       │
│                              │
│ Setor Balance        ████░░   │
│ 7.0/10                       │
│                              │
│ Risco Regional       █████░   │
│ 8.1/10                       │
│                              │
│ ┌──────────────────────────┐ │
│ │ 💡 Sugestão IA           │ │ (Orange highlight)
│ │                          │ │
│ │ Sua carteira apresenta   │ │
│ │ concentração em Energia. │ │
│ │ Considere diversificar   │ │
│ │ para outros setores.     │ │
│ │                          │ │
│ │ [Considerar] [Descartar] │ │
│ └──────────────────────────┘ │
│                              │
│ Histórico de Análises        │
│ 16 mar 10:30  Score 7.5      │
│ 15 mar 10:30  Score 7.3      │
│                              │
└──────────────────────────────┘
```

**Componentes:**
- Header
- Score circular (0-10)
- Risk breakdown (4 métricas)
- AI suggestion card (Orange)
- History timeline

**Estados (5):**
1. **Loading:** Carregando análise
2. **Error:** Erro ao analisar
3. **Low Risk:** Score 8-10 (verde)
4. **Medium Risk:** Score 5-7 (amarelo)
5. **High Risk:** Score 0-4 (vermelho)

**Dados Backend:**
```
GET /portfolio/radar
{
  score: number,
  riskLevel: 'low' | 'medium' | 'high',
  breakdown: {
    diversification: number,
    concentration: number,
    sectorBalance: number,
    regionalRisk: number
  },
  aiSuggestion: string,
  history: { timestamp, score }[]
}
```

---

### 10. HISTORY / TIMELINE

**Descrição:** Timeline de eventos e transações do portfólio.

**Path:** `/history`
**Arquivo:** `HistoryScreen.tsx` (já existe)

**Layout:**
```
┌──────────────────────────────┐
│ ← | Histórico         Filter │
├──────────────────────────────┤
│                              │
│ 16 de março                  │
│                              │
│ ┌──────────────────────────┐ │
│ │ 💰 Compra                │ │
│ │ PETR4 - 10 ações         │ │
│ │ -R$ 5.200,00             │ │
│ │ 10:30                    │ │
│ │ ✅ Confirmado            │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 📥 Importação            │ │
│ │ 3 ativos importados      │ │
│ │ 08:15                    │ │
│ │ ✅ Sucesso               │ │
│ └──────────────────────────┘ │
│                              │
│ 15 de março                  │
│                              │
│ ┌──────────────────────────┐ │
│ │ 💵 Venda                 │ │
│ │ VALE3 - 5 ações          │ │
│ │ +R$ 2.100,00             │ │
│ │ 14:45                    │ │
│ │ ✅ Confirmado            │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

**Card de Evento:**
- Ícone (compra, venda, importação, etc)
- Tipo de evento (texto)
- Detalhes (ativo, qtd, valor)
- Hora
- Status badge (✅ confirmado, ⏳ pendente, ❌ erro)

**Estados (5):**
1. **Empty:** Nenhum evento
2. **Loading:** Carregando
3. **Ready:** Eventos listados
4. **Error:** Erro ao carregar
5. **Filtered:** Período filtrado

**Filtros:**
- Período: Últimos 7 dias, 30 dias, 3 meses, Custom
- Tipo: Todos, Compra, Venda, Importação

**Dados Backend:**
```
GET /portfolio/history?period=&type=
{
  events: {
    type: 'purchase' | 'sale' | 'import' | 'dividend',
    ticker: string,
    quantity: number,
    price: number,
    totalValue: number,
    timestamp: datetime,
    status: 'confirmed' | 'pending' | 'failed'
  }[]
}
```

---

### 11. IMPORTS - START (Upload)

**Descrição:** Primeira etapa do fluxo de importação. Upload de arquivo.

**Path:** `/imports`
**Arquivo:** `ImportsScreen.tsx` (já existe)

**Layout:**
```
┌──────────────────────────────┐
│ ← | Importar Dados    Help   │
├──────────────────────────────┤
│                              │
│ Passo 1 de 6                 │
│ ████░░░░░░░░░░░░░░░░         │ (progress)
│                              │
│ Importar Dados               │
│ (Sora, 28px)                 │
│                              │
│ Selecione arquivo CSV ou Excel │
│                              │
│ ┌──────────────────────────┐ │
│ │    Orange Dashed Border  │ │
│ │          📁              │ │
│ │   Arrastar ou clicar     │ │
│ │                          │ │
│ │     CSV • XLSX • XLS     │ │
│ │     Máximo 5MB           │ │
│ └──────────────────────────┘ │
│                              │
│ Últimas importações:         │
│                              │
│ 16 mar 10:30                 │
│ "Portfolio-Mar2025.xlsx"     │
│ 3 ativos ✅ Sucesso          │
│                              │
│ 10 mar 14:15                 │
│ "Compras-Fevereiro.csv"      │
│ 2 ativos ✅ Sucesso          │
│                              │
└──────────────────────────────┘
```

**Componentes:**
- Progress indicator (Passo 1 de 6)
- Drag & drop box
- File format info
- Recent imports list

**Upload Validação:**
- Extensão: .csv, .xlsx, .xls
- Tamanho máximo: 5MB
- Conteúdo: Deve ter colunas esperadas

**Submit Flow:**
```
1. User seleciona arquivo
2. Validar (tipo, tamanho)
3. Upload para backend
4. Backend processa → resposta com preview
5. Redireciona para /imports/preview
```

---

### 12. IMPORTS - PREVIEW

**Descrição:** Visualizar dados antes de confirmar.

**Path:** `/imports/preview`
**Arquivo:** `ImportsPreviewScreen.tsx` (já existe)

**Layout:**
```
┌──────────────────────────────┐
│ ← | Visualizar Dados  Help   │
├──────────────────────────────┤
│                              │
│ Passo 2 de 6                 │
│ ████████░░░░░░░░░░░░         │ (progress)
│                              │
│ Visualizar Dados             │
│                              │
│ Arquivo: Portfolio-Mar25.csv │
│                              │
│ Tabela:                      │
│ ┌──────────────────────────┐ │
│ │ Ativo  │ Qtd │ Preço     │ │ (header)
│ ├────────┼─────┼───────────┤ │
│ │ PETR4  │ 10  │ 520,00    │ │
│ │ VALE3  │  5  │ 420,00    │ │
│ │ ABEV3  │ 20  │ 8,50      │ │
│ └──────────────────────────┘ │
│                              │
│ Resumo:                      │
│ • 3 ativos serão importados  │
│ • 0 duplicados encontrados   │
│ • 0 conflitos                │
│                              │
│ [← Voltar]  [Próximo →]      │
│                              │
└──────────────────────────────┘
```

**Componentes:**
- Progress bar
- File name
- Data table (colunas detectadas)
- Summary stats
- Navigation buttons

**Validação na Preview:**
- Detectar colunas esperadas
- Validar tipos de dados
- Avisos (ex: duplicados)

---

### 13. IMPORTS - CONFLICTS (Novo - 🎯)

**Descrição:** Resolver conflitos encontrados na importação.

**Path:** `/imports/conflicts`
**Arquivo:** `ImportsConflictsScreen.tsx` (novo)
**Backend:** `import_conflicts_service.ts`

**Layout:**
```
┌──────────────────────────────┐
│ ← | Resolver Conflitos       │
├──────────────────────────────┤
│                              │
│ Passo 3 de 6                 │
│ ███████░░░░░░░░░░░░░░        │ (progress)
│                              │
│ Resolver Conflitos           │
│                              │
│ 2 conflitos encontrados      │
│ 0/2 resolvidos               │
│                              │
│ ⚠️  PETR4 - Preço conflitante│
│ ┌──────────────────────────┐ │
│ │ Ativo:         PETR4     │ │
│ │ Data:          16 mar    │ │
│ │                          │ │
│ │ Importado:     R$ 520,00 │ │
│ │ Sistema:       R$ 525,00 │ │
│ │ Diferença:     -R$ 5,00  │ │
│ │                          │ │
│ │ [Usar Importado] [Sistema]│ │
│ └──────────────────────────┘ │
│                              │
│ ⚠️  VALE3 - Ativo Duplicado  │
│ ┌──────────────────────────┐ │
│ │ Ativo:         VALE3     │ │
│ │                          │ │
│ │ Você já possui 5 ações   │ │
│ │ de VALE3 importadas em   │ │
│ │ 10 de março              │ │
│ │                          │ │
│ │ [Mesclar] [Importar Novo]│ │
│ └──────────────────────────┘ │
│                              │
│ [← Voltar]  [Próximo →]      │
│ (Próximo desabilitado até    │
│  resolver todos conflitos)   │
│                              │
└──────────────────────────────┘
```

**Tipos de Conflitos:**
1. **Preço diferente:** Mostrar ambos, usuário escolhe
2. **Data diferente:** Qual data usar
3. **Duplicado:** Mesclar com existente ou importar novo
4. **Coluna faltante:** Avisar e permitir continuar

**Resolução:**
- Usuário escolhe opção para cada conflito
- Salvar escolha
- Próximo botão habilitado após resolver todos

**Dados Backend:**
```
GET /imports/:id/conflicts
{
  conflicts: {
    type: 'price' | 'date' | 'duplicate' | 'missing',
    ticker: string,
    details: {
      importedValue: any,
      systemValue: any,
      resolution: 'use_imported' | 'use_system' | 'merge' | 'skip'
    }
  }[]
}

POST /imports/:id/resolve-conflicts
{
  resolutions: {
    conflictId: string,
    choice: string
  }[]
}
```

---

### 14. IMPORTS - COMMIT

**Descrição:** Confirmação final antes de importar.

**Path:** `/imports/commit`
**Arquivo:** `ImportsCommitScreen.tsx` (já existe)

**Layout:**
```
┌──────────────────────────────┐
│ ← | Confirmar Importação     │
├──────────────────────────────┤
│                              │
│ Passo 4 de 6                 │
│ ███████████░░░░░░░░░░        │ (progress)
│                              │
│ Confirmar Importação         │
│                              │
│ Resumo Final:                │
│ ┌──────────────────────────┐ │
│ │ • 3 ativos serão import. │ │
│ │ • 2 conflitos resolvidos │ │
│ │ • 0 duplicações removidas│ │
│ │ • 0 erros                │ │
│ └──────────────────────────┘ │
│                              │
│ ☐ Confirmo que os dados      │
│   estão corretos e completos │
│                              │
│ ┌──────────────────────────┐ │
│ │  ▶ Confirmar Importação  │ │
│ │  (disabled até checked)  │ │
│ └──────────────────────────┘ │
│                              │
│ [← Voltar]                   │
│                              │
└──────────────────────────────┘
```

**Componentes:**
- Progress bar
- Summary card com stats
- Checkbox (required para enable button)
- Primary button
- Back button

**Submit Flow:**
```
1. User marca checkbox
2. Button ativa
3. Click → POST /imports/:id/commit
4. Loading state com spinner
5. Sucesso → Redirect /imports/detail/:id
6. Erro → Mostrar mensagem + opção retry
```

---

### 15. IMPORTS - DETAIL (Novo - 🎯)

**Descrição:** Detalhes técnicos da importação com logs.

**Path:** `/imports/:id/detail`
**Arquivo:** `ImportsDetailScreen.tsx` (novo)
**Backend:** `import_detail_service.ts`

**Layout:**
```
┌──────────────────────────────┐
│ ← | Detalhes Técnicos        │
├──────────────────────────────┤
│                              │
│ Passo 5 de 6                 │
│ ████████████░░░░░░░░         │ (progress)
│                              │
│ Detalhes da Importação       │
│                              │
│ ID:     IMP-2025-03-001      │
│ Data:   16 de março, 10:30   │
│ Status: ✅ Concluído         │
│                              │
│ Progresso:                   │
│ 10 de 10 ativos processados  │
│ ████████████████████         │ (100%)
│                              │
│ Detalhes por Ativo:          │
│                              │
│ ✅ PETR4                     │
│    Importado: 10 ações       │
│    Valor: R$ 5.200,00        │
│                              │
│ ✅ VALE3                     │
│    Importado: 5 ações        │
│    Valor: R$ 2.100,00        │
│                              │
│ ✅ ABEV3                     │
│    Importado: 20 ações       │
│    Valor: R$ 170,00          │
│                              │
│ ⚠️  PETR3 (conflito resolvido)
│    Importado: 8 ações        │
│    Observação: Preço ajustado│
│                              │
│ Logs Técnicos:               │
│ [📋 Baixar Relatório CSV]    │
│ [📊 Visualizar Gráfico]      │
│                              │
│ [Próximo →]                  │
│                              │
└──────────────────────────────┘
```

**Seções:**
1. Metadados (ID, data, status)
2. Progress bar
3. Detalhes de cada ativo (status, qtd, valor)
4. Actions (download, visualizar)
5. Navigation

**Estados:**
- **Processing:** Spinner, % carregado
- **Success:** ✅ checkmarks, próximo habilitado
- **Error:** ❌ com mensagens de erro por ativo
- **Partial:** Mix de sucesso e erro

**Dados Backend:**
```
GET /imports/:id/detail
{
  id: string,
  createdAt: datetime,
  status: 'processing' | 'success' | 'error' | 'partial',
  progress: { processed: number, total: number },
  details: {
    ticker: string,
    quantity: number,
    price: number,
    status: 'success' | 'error' | 'warning',
    message: string
  }[],
  logs: string[] // logs técnicos
}
```

---

### 16. IMPORTS - ENGINE STATUS (Novo - 🎯)

**Descrição:** Monitoramento do motor de importação automática.

**Path:** `/imports/engine-status`
**Arquivo:** `ImportsEngineStatusScreen.tsx` (novo)
**Backend:** `import_engine_status_service.ts`

**Layout:**
```
┌──────────────────────────────┐
│ ← | Status do Motor          │
├──────────────────────────────┤
│                              │
│ Passo 6 de 6                 │
│ █████████████████████        │ (progress)
│                              │
│ Status do Motor              │
│                              │
│ ┌──────────────────────────┐ │
│ │ 🔄 Ativo                 │ │ (status badge)
│ │                          │ │
│ │ Motor de importação      │ │
│ │ automática funcionando   │ │
│ └──────────────────────────┘ │
│                              │
│ Informações:                 │
│ • Última sincronização:      │
│   16 mar 10:30               │
│ • Próxima sincronização:     │
│   16 mar 11:30               │
│ • Intervalo:                 │
│   1 hora                     │
│ • Importações pendentes:     │
│   0                          │
│                              │
│ Logs Recentes:               │
│ ┌──────────────────────────┐ │
│ │ 16 mar 10:30  ✅ Sync OK │ │
│ │ 16 mar 09:30  ✅ Sync OK │ │
│ │ 16 mar 08:30  ✅ Sync OK │ │
│ └──────────────────────────┘ │
│                              │
│ Controles:                   │
│ [⏸️  Pausar Motor]           │
│ [⚡ Executar Agora]          │
│ [🗑️  Limpar Logs]           │
│                              │
│ [Finalizar]                  │
│                              │
└──────────────────────────────┘
```

**Componentes:**
- Status badge (Ativo, Pausado, Erro)
- Info cards
- Logs timeline
- Control buttons
- Finish button

**Status Badges:**
- 🔄 **Ativo:** Motor funcionando
- ⏸️ **Pausado:** Motor parado (admin pausou)
- ❌ **Erro:** Motor com problema

**Logs:**
- Timestamp
- Status (✅ sucesso, ❌ erro, ⚠️ aviso)
- Mensagem

**Dados Backend:**
```
GET /imports/engine-status
{
  status: 'active' | 'paused' | 'error',
  lastSync: datetime,
  nextSync: datetime,
  interval: number (minutos),
  pendingImports: number,
  logs: {
    timestamp: datetime,
    status: 'success' | 'error' | 'warning',
    message: string
  }[]
}

POST /imports/engine-status/:action
// action: 'pause', 'resume', 'run_now', 'clear_logs'
```

---

### 17. PROFILE / SETTINGS

**Descrição:** Configurações de usuário e preferências.

**Path:** `/profile`
**Arquivo:** `ProfileScreen.tsx` (já existe)

**Layout:**
```
┌──────────────────────────────┐
│ Navy BG | Perfil      Menu   │
├──────────────────────────────┤
│                              │
│ Dados Pessoais               │
│                              │
│  ┌────────────────────┐     │
│  │ [👤 Avatar 80px]  │     │
│  └────────────────────┘     │
│                              │
│ João Silva                   │
│ (Sora, 18px, bold)           │
│                              │
│ Editar Perfil                │
│                              │
│ Email:                       │
│ joao@email.com               │
│ (read-only)                  │
│                              │
│ CPF:                         │
│ •••••••••••••92              │
│ (read-only, masked)          │
│                              │
│ Data de Nascimento:          │
│ 15 de janeiro, 1990          │
│ [Editar]                     │
│                              │
│ Preferências                 │
│                              │
│ Notificações      ☑️ (toggle)│
│ Tema               Light     │
│ Idioma             Português │
│                              │
│ Segurança                    │
│                              │
│ Alterar Senha                │
│ [Alterar →]                  │
│                              │
│ Autenticação 2FA             │
│ Desabilitado [Ativar →]      │
│                              │
│ Sessões Ativas               │
│ [Gerenciar →]                │
│                              │
│ Legal                        │
│                              │
│ Termos de Uso [→]            │
│ Política de Privacidade [→]  │
│                              │
│ [🔴 Sair da Conta]           │
│                              │
└──────────────────────────────┘
```

**Seções:**

1. **Dados Pessoais:**
   - Avatar (circular, 80px)
   - Nome (editável em modal)
   - Email (read-only)
   - CPF (masked, read-only)
   - Data nascimento (editável)

2. **Preferências:**
   - Notificações (toggle)
   - Tema (light/dark)
   - Idioma (pt-BR/en-US)

3. **Segurança:**
   - Alterar senha
   - 2FA (toggle)
   - Gerenciar sessões

4. **Legal:**
   - Termos
   - Privacidade

5. **Logout:**
   - Sair da conta (red button)

**Estados (3):**
1. **Viewing:** Padrão, read-only
2. **Editing:** Formulários habilitados
3. **Loading:** Salvando dados

---

## 📊 Tabela Resumida

| Tela | Path | Componentes | Estados | Backend |
|------|------|-------------|---------|---------|
| Splash | `/splash` | - | 1 | - |
| Login | `/login` | Form, 2x Input, Button | 4 | auth.ts |
| Register | `/register` | Form, 4x Input, Checkbox | 4 | auth.ts |
| ForgotPwd | `/forgot-password` | Form, Input, Button | 3 | auth.ts |
| Onboarding | `/onboarding` | Wizard (5 steps) | 5 | - |
| Home | `/home` | Cards, Quick Actions, Holdings | 5 | portfolio |
| Portfolio | `/portfolio` | List, Filters, Cards | 3 | portfolio |
| Holding | `/portfolio/:ticker` | Header, Stats, Chart, Actions | 2 | portfolio |
| Radar | `/radar` | Score, Breakdown, AI Card | 5 | radar, ai_suggestion |
| History | `/history` | Timeline, Filter | 5 | history |
| Imports-1 | `/imports` | Upload, Drag&Drop | 3 | imports |
| Imports-2 | `/imports/preview` | Table, Summary | 3 | imports |
| Imports-3 | `/imports/conflicts` | Conflict Cards, Resolution | 4 | import_conflicts |
| Imports-4 | `/imports/commit` | Summary, Checkbox, Confirm | 3 | imports |
| Imports-5 | `/imports/:id/detail` | Metadata, Details, Logs | 4 | import_detail |
| Imports-6 | `/imports/engine-status` | Badge, Info, Logs, Controls | 3 | import_engine_status |
| Profile | `/profile` | Sections, Edit Modals, Toggles | 3 | auth |

---

## 🎯 Desenvolvimento Priorizado

### FASE 1: Setup (1-2 dias)
- [ ] CSS variables (design tokens)
- [ ] Componentes base (Button, Input, Card, Pill, Header)
- [ ] Layout responsive (mobile/tablet/desktop)

### FASE 2: Telas Principais (3-4 dias)
- [ ] Login, Register, ForgotPassword ✅ Auth 3-screen flow
- [ ] Home/Dashboard
- [ ] Portfolio + Detail
- [ ] History

### FASE 3: Telas Complexas (2-3 dias)
- [ ] Radar com IA
- [ ] Imports completo (6 steps)

### FASE 4: Polish & QA (1-2 dias)
- [ ] Responsividade
- [ ] Acessibilidade
- [ ] Performance
- [ ] Cross-browser

---

**Documento:** SCREENS_BREAKDOWN.md
**Versão:** 1.0
**Data:** 2026-04-05
**Status:** Pronto para Implementação
