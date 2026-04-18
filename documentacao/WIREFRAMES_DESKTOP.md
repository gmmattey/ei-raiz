# 🖥️ Wireframes Desktop — Esquilo Invest

**Especificação de telas desktop (1280px+) para implementação**

---

## 📐 Viewport Reference

- **Desktop:** 1280px width (padrão)
- **Desktop Grande:** 1920px width
- **Responsividade:** Flex/Grid adaptável

---

## 🎨 Design System (Mantido do Mobile)

### Cores

**Light Mode:**
- Primary: `#0A7E3D` (verde Esquilo)
- Secondary: `#F5A623` (laranja)
- Background: `#FFFFFF`
- Surface: `#F8F9FA`
- Text: `#1A1A1A`
- Border: `#E5E7EB`

**Dark Mode:**
- Primary: `#11D456` (verde claro)
- Secondary: `#F5A623`
- Background: `#0F1419`
- Surface: `#1A1F2E`
- Text: `#F5F5F5`
- Border: `#2D3748`

### Typography

- **Headlines:** Sora Bold (32px, 24px, 20px)
- **Body:** Inter Regular (16px, 14px, 12px)
- **Buttons:** Inter Medium (14px, 16px)

### Espaçamento

- Grid: 4px base
- Padding padrão: 24px, 32px
- Gap componentes: 16px, 24px
- Margin seções: 32px, 48px

---

## 📄 Telas Desktop

### 1. LOGIN

```
┌──────────────────────────────────────────────────────────┐
│  [Logo] Esquilo Invest                     [Light|Dark]  │
├──────────────────────────────────────────────────────────┤
│                                                            │
│                    Seção 1 (50%)          Seção 2 (50%)  │
│                  ┌─────────────┐        ┌──────────────┐ │
│                  │             │        │              │ │
│                  │  Ilustração │        │   Formulário │ │
│                  │   Investor  │        │              │ │
│                  │   (animated)│        │ Email        │ │
│                  │             │        │ [_________]  │ │
│                  │             │        │              │ │
│                  │             │        │ Senha        │ │
│                  │             │        │ [_________]  │ │
│                  │             │        │              │ │
│                  │             │        │ [ Entrar ]   │ │
│                  │             │        │              │ │
│                  │             │        │ Sem conta?   │ │
│                  │             │        │ [Registre]   │ │
│                  │             │        │              │ │
│                  └─────────────┘        └──────────────┘ │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Especificação:**
- Sidebar esquerda (50%): Ilustração grande, animações suaves
- Formulário direita (50%): Bem espaçado, campos grandes
- Input fields: 100% da width do container (44px height)
- Botão: 100% width, 48px height
- Links: Secondary color, hover underline

---

### 2. ONBOARDING (Step 1-3 combinadas)

```
┌──────────────────────────────────────────────────────────┐
│  [Logo]                                  [Saltar]        │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Esquerda (40%)       │      Direita (60%)                │
│  ┌─────────────────┐  │  ┌─────────────────────────────┐ │
│  │                 │  │  │ Step 1/3: Bem-vindo         │ │
│  │  Ilustração     │  │  │                             │ │
│  │                 │  │  │ Você está em boas mãos.     │ │
│  │  (Large SVG)    │  │  │ O Esquilo ajuda a investir  │ │
│  │                 │  │  │ com segurança e inteligência│ │
│  │  Progress:      │  │  │                             │ │
│  │  ███░░░░░░      │  │  │         [Começar]           │ │
│  │                 │  │  │                             │ │
│  │  Dots: 1 2 3    │  │  │ Outras features em Step 2/3 │ │
│  │                 │  │  │                             │ │
│  └─────────────────┘  │  └─────────────────────────────┘ │
│                       │                                   │
└──────────────────────────────────────────────────────────┘
```

**Especificação:**
- Layout: 40/60 split
- Esquerda: Ilustrações grandes, progressbar vertical
- Direita: Conteúdo e ação (botão 100% width)
- Typography: Heading 32px, body 16px
- Padding: 48px em cada lado

---

### 3. HOME (Dashboard Principal)

```
┌──────────────────────────────────────────────────────────┐
│ ☰ [Logo] Esquilo    Pesquisa...    Notif  Perfil [Dark] │
├──────────────────────────────────────────────────────────┤
│  ┌─ Navegação ─┐                                         │
│  │             │  ┌────────────────────────────────────┐ │
│  │ • Home      │  │ Olá, Luiz! 👋                       │ │
│  │ • Carteira  │  │ Saldo em caixa                      │ │
│  │ • Insights  │  │ R$ 125.432,00                       │ │
│  │ • Decisões  │  │                                     │ │
│  │ • Histórico │  │ ┌──────────┐ ┌──────────┐ ┌──────┐ │ │
│  │ • Perfil    │  │ │ Lucro 30d│ │ Rentab.  │ │ ROI  │ │ │
│  │             │  │ │ +12.5%   │ │ 8.3% aa  │ │ 22%  │ │ │
│  │             │  │ └──────────┘ └──────────┘ └──────┘ │ │
│  │             │  │                                     │ │
│  │             │  │ Carteira em Números                 │ │
│  │             │  │ ┌─────────────────────────────────┐ │ │
│  │             │  │ │ Ações      │ 45%   │ R$ 56.4K   │ │ │
│  │             │  │ │ Fundos     │ 30%   │ R$ 37.6K   │ │ │
│  │             │  │ │ Cripto     │ 15%   │ R$ 18.8K   │ │ │
│  │             │  │ │ Renda Fixa │ 10%   │ R$ 12.5K   │ │ │
│  │             │  │ └─────────────────────────────────┘ │ │
│  │             │  │                                     │ │
│  │             │  │ Gráfico de Evolução (24h|7d|30d)    │ │
│  │             │  │ ┌─────────────────────────────────┐ │ │
│  │             │  │ │                  ╱╲              │ │ │
│  │             │  │ │              ╱╲╱  ╲            │ │ │
│  │             │  │ │          ╱╲╱      ╲           │ │ │
│  │             │  │ │      ╱╲╱          ╲╲         │ │ │
│  │             │  │ │  ╱╲╱              ╲╲╲      │ │ │
│  │             │  │ │╱                    ╲╲╲    │ │ │
│  │             │  │ └─────────────────────────────────┘ │ │
│  │             │  │                                     │ │
│  │             │  │ Últimas Transações                  │ │
│  │             │  │ ├─ Compra ELET3     R$ 2.150      │ │ │
│  │             │  │ ├─ Aporte         R$ 5.000        │ │ │
│  │             │  │ └─ Venda Crypto   R$ 1.800        │ │ │
│  │             │  │                                     │ │
│  └─────────────┘  └────────────────────────────────────┘ │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Especificação:**
- Header sticky com logo, search, notificações, perfil
- Sidebar left (200px fixed): Navegação principal
- Main content (1080px): Cards de resumo em grid 3 colunas
- Cards: 24px border-radius, shadow subtle, hover elevation
- Gráfico: Chart.js ou Recharts (responsivo)
- Tabela transações: Scrollable, sticky header
- Spacing: 32px entre seções

---

### 4. CARTEIRA (Portfolio)

```
┌──────────────────────────────────────────────────────────┐
│ ☰ [Logo] Esquilo                          Perfil [Dark]  │
├──────────────────────────────────────────────────────────┤
│  ┌─ Nav ─┐                                                │
│  │Carteira│ ┌─────────────────────────────────────────┐ │
│  │        │ │ Carteira                                │ │
│  │        │ │ [Todas] [Ações] [Fundos] [Cripto] [RF] │ │
│  │        │ │                                          │ │
│  │        │ │ Total: R$ 125.432,00  │ Variação: +8.3% │ │
│  │        │ │                                          │ │
│  │        │ │ ┌─────────────────────────────────────┐ │ │
│  │        │ │ │ TICKER │ QTD  │ ATUAL │ TOTAL │ VAR │ │
│  │        │ │ ├─────────────────────────────────────┤ │ │
│  │        │ │ │ ELET3  │ 100  │ 21.50 │ 2.150 │+5.2%│ │
│  │        │ │ │ PETR4  │ 50   │ 38.25 │ 1.912 │-2.1%│ │
│  │        │ │ │ VALE3  │ 75   │ 66.80 │ 5.010 │+8.9%│ │
│  │        │ │ │ BBAS3  │ 25   │ 45.30 │ 1.132 │+1.3%│ │
│  │        │ │ │ ITUB4  │ 40   │ 33.50 │ 1.340 │+3.2%│ │
│  │        │ │ │ FXBI11 │ 500  │ 75.50 │37.750 │+6.1%│ │
│  │        │ │ │ HASHDOGE│200  │ 50.25 │10.050 │-12%│ │
│  │        │ │ └─────────────────────────────────────┘ │ │
│  │        │ │                                          │ │
│  │        │ │ [+ Novo Ativo]  [Exportar CSV]  [+Aporte]│ │
│  │        │ │                                          │ │
│  │        │ │ Gráfico Pizza (Alocação)                │ │
│  │        │ │ ┌──────────────────────────────────────┐ │ │
│  │        │ │ │ Ações    45%                         │ │ │
│  │        │ │ │ ████████░░░░░░░░░ Fundos  30%       │ │ │
│  │        │ │ │ ████████░░░░░░░░░ Cripto  15%       │ │ │
│  │        │ │ │ ███░░░░░░░░░░░░░░ RF      10%       │ │ │
│  │        │ │ └──────────────────────────────────────┘ │ │
│  │        │ │                                          │ │
│  └────────┘ └─────────────────────────────────────────┘ │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Especificação:**
- Sidebar: Navegação (Carteira ativo)
- Filtros: Tabs (Todas, Ações, Fundos, Cripto, RF) sticky
- Tabela: Dados principais, hover row, sortable columns
  - Coluna TICKER com link para detail page
  - Variação com cor (verde/vermelho)
- Cards resumo: Total em destaque, variação percentual
- Gráfico pizza: Lado direito, cores por categoria
- Botões ação: Novo, Exportar, Aporte (floating action button alternativa)

---

### 5. INSIGHTS (Análises)

```
┌──────────────────────────────────────────────────────────┐
│ ☰ [Logo] Esquilo                          Perfil [Dark]  │
├──────────────────────────────────────────────────────────┤
│  ┌─ Nav ─┐                                                │
│  │Insights│ ┌─────────────────────────────────────────┐ │
│  │        │ │ Insights Inteligentes                   │ │
│  │        │ │                                          │ │
│  │        │ │ ┌───────────────────┐ ┌────────────────┐│ │
│  │        │ │ │ 💡 Ação Alert      │ │ 📊 Divergência││ │
│  │        │ │ │ BBDC3 encontra     │ │ PETR4 + Alta   ││ │
│  │        │ │ │ suporte em R$ 33.20│ │ vs Tendência   ││ │
│  │        │ │ │ Compra             │ │ Vender?        ││ │
│  │        │ │ │ [Detalhe]          │ │ [Ver mais]     ││ │
│  │        │ │ └───────────────────┘ └────────────────┘│ │
│  │        │ │ ┌───────────────────┐ ┌────────────────┐│ │
│  │        │ │ │ 🎯 Realocação      │ │ 🚀 Oportunidade││ │
│  │        │ │ │ Carteira desbalanc │ │ Cripto pump!   ││ │
│  │        │ │ │ Aumentar RF        │ │ Entrar agora?  ││ │
│  │        │ │ │ [Simular]          │ │ [Análise]      ││ │
│  │        │ │ └───────────────────┘ └────────────────┘│ │
│  │        │ │                                          │ │
│  │        │ │ Métricas Principais                     │ │
│  │        │ │ ┌──────────────────────────────────────┐│ │
│  │        │ │ │ Volatilidade: 8.3%  │ Sharpe: 1.45  ││ │
│  │        │ │ │ Beta: 0.92           │ Alpha: 3.2%   ││ │
│  │        │ │ │ Correlação: -0.15    │ VaR: 5.2%     ││ │
│  │        │ │ └──────────────────────────────────────┘│ │
│  │        │ │                                          │ │
│  │        │ │ Histórico de Recomendações              │ │
│  │        │ │ ┌──────────────────────────────────────┐│ │
│  │        │ │ │ Data     │ Tipo    │ Status │ Retorno││ │
│  │        │ │ │ 15/04    │ Compra  │ ✅   │ +4.2% ││ │
│  │        │ │ │ 12/04    │ Venda   │ ✅   │ +2.8% ││ │
│  │        │ │ │ 10/04    │ Hold    │ ⏳   │ -1.5% ││ │
│  │        │ │ └──────────────────────────────────────┘│ │
│  │        │ │                                          │ │
│  └────────┘ └─────────────────────────────────────────┘ │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Especificação:**
- Cards insights: 2x2 grid, cada card tem ícone emoji + title + descrição + CTA
- Cores cards: Verde (compra), Vermelho (venda), Azul (hold), Laranja (oportunidade)
- Métricas: 3x2 grid, valores grandes, unidades discretas
- Tabela recomendações: Status com ícone visual, retorno em cor
- Spacing: 24px entre cards, 16px interno

---

### 6. DECISÕES (Simuladores)

```
┌──────────────────────────────────────────────────────────┐
│ ☰ [Logo] Esquilo                          Perfil [Dark]  │
├──────────────────────────────────────────────────────────┤
│  ┌─ Nav ─┐                                                │
│  │Decisões│ ┌─────────────────────────────────────────┐ │
│  │        │ │ Simuladores de Decisão                  │ │
│  │        │ │                                          │ │
│  │        │ │ ┌───────────────────┐ ┌────────────────┐│ │
│  │        │ │ │ Simulador Aporte  │ │ Simulador Saída││ │
│  │        │ │ │                   │ │                ││ │
│  │        │ │ │ Valor:            │ │ Valor:         ││ │
│  │        │ │ │ [________] R$ 1000│ │ [________] R$ 5K││ │
│  │        │ │ │                   │ │                ││ │
│  │        │ │ │ Periodicidade:    │ │ Estimativa:    ││ │
│  │        │ │ │ [Mensal ▼]        │ │ R$ 4.875       ││ │
│  │        │ │ │ (Impostos: R$ 125)│ │ (Impostos: 245)││ │
│  │        │ │ │                   │ │                ││ │
│  │        │ │ │ [Simular] [Usar]  │ │ [Simular] [Usar]││ │
│  │        │ │ └───────────────────┘ └────────────────┘│ │
│  │        │ │                                          │ │
│  │        │ │ ┌───────────────────────────────────────┐│ │
│  │        │ │ │ Calculadora Rebalance                 ││ │
│  │        │ │ │                                       ││ │
│  │        │ │ │ Alocação Desejada:                    ││ │
│  │        │ │ │ Ações    ███░░░░░ 60% (vs 45% atual)││ │
│  │        │ │ │ Fundos   ███░░░░░ 30% (vs 30% atual)││ │
│  │        │ │ │ Cripto   █░░░░░░░  5% (vs 15% atual)││ │
│  │        │ │ │ RF       ██░░░░░░  5% (vs 10% atual)││ │
│  │        │ │ │                                       ││ │
│  │        │ │ │ Movimentação Necessária:              ││ │
│  │        │ │ │ • Comprar Ações: R$ 18.900 (+18.7%)  ││ │
│  │        │ │ │ • Vender Cripto: R$ 18.800 (-18.7%)  ││ │
│  │        │ │ │                                       ││ │
│  │        │ │ │ [Calcular Imposto] [Executar]         ││ │
│  │        │ │ └───────────────────────────────────────┘│ │
│  │        │ │                                          │ │
│  └────────┘ └─────────────────────────────────────────┘ │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Especificação:**
- Cards simuladores: 2 por linha, 400px width
- Inputs: números com máscara, clear buttons
- Sliders: Para ajustar percentuais (drag responsivo)
- Cálculos em tempo real: Mostrar imposto, custos inline
- Tabela rebalance: Cores indicando movimento (compra/venda)
- Botões: CTA primário (Usar/Executar) em destaque

---

### 7. PERFIL (Settings)

```
┌──────────────────────────────────────────────────────────┐
│ ☰ [Logo] Esquilo                          Perfil [Dark]  │
├──────────────────────────────────────────────────────────┤
│  ┌─ Nav ─┐                                                │
│  │Perfil │ ┌─────────────────────────────────────────┐ │
│  │        │ │ Perfil                                  │ │
│  │        │ │                                          │ │
│  │        │ │ ┌────────────┐                          │ │
│  │        │ │ │            │ Nome: Luiz Mattey       │ │
│  │        │ │ │   Foto     │ Email: luiz@exemplo.com │ │
│  │        │ │ │   200x200  │ CPF: ***.***.***-50      │ │
│  │        │ │ │            │ Desde: 2024             │ │
│  │        │ │ │ [Mudar]    │                          │ │
│  │        │ │ └────────────┘ [Editar Perfil]         │ │
│  │        │ │                                          │ │
│  │        │ │ ─────────────────────────────────────── │ │
│  │        │ │ Preferências de Risco                   │ │
│  │        │ │                                          │ │
│  │        │ │ Perfil: [Conservador] [Moderado] [Agres│ │
│  │        │ │ Atualmente: ◉ Moderado                 │ │
│  │        │ │                                          │ │
│  │        │ │ ─────────────────────────────────────── │ │
│  │        │ │ Configurações                           │ │
│  │        │ │                                          │ │
│  │        │ │ ☑ Notificações push                      │ │
│  │        │ │ ☑ Email diário de resumo                │ │
│  │        │ ☐ Alertas de preço (atualmente OFF)      │ │
│  │        │ │ ☑ Dark mode                             │ │
│  │        │ │                                          │ │
│  │        │ │ ─────────────────────────────────────── │ │
│  │        │ │ Segurança                               │ │
│  │        │ │                                          │ │
│  │        │ │ Senha [Alterar]                         │ │
│  │        │ │ 2FA [Ativar] ← Recomendado             │ │
│  │        │ │ Sessões Ativas: 2 [Gerenciar]          │ │
│  │        │ │                                          │ │
│  │        │ │ ─────────────────────────────────────── │ │
│  │        │ │ Dados                                   │ │
│  │        │ │                                          │ │
│  │        │ │ [Exportar Dados] [Deletar Conta]        │ │
│  │        │ │                                          │ │
│  │        │ │ ─────────────────────────────────────── │ │
│  │        │ │ Versão 1.0 | Ajuda | Termos | Logout   │ │
│  │        │ │                                          │ │
│  └────────┘ └─────────────────────────────────────────┘ │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Especificação:**
- Layout: Foto + info lado a lado (400px lado esquerdo)
- Seções: Separadas por linha divisória (border-bottom)
- Foto: 200x200px, border-radius circular, upload com hover
- Toggles: Estilo iOS (switch animado)
- Botões secundários: [Alterar], [Gerenciar], [Editar] em link color
- Botões danger: [Deletar Conta] em red, com confirmação modal

---

### 8. HISTÓRICO (Transações)

```
┌──────────────────────────────────────────────────────────┐
│ ☰ [Logo] Esquilo       [Filtros] [Exportar]  Perfil [D]  │
├──────────────────────────────────────────────────────────┤
│  ┌─ Nav ─┐                                                │
│  │Histórico│ ┌─────────────────────────────────────────┐ │
│  │        │ │ Histórico de Transações                 │ │
│  │        │ │                                          │ │
│  │        │ │ Período: [15/04] até [hoje] [30d] [90d]│ │
│  │        │ │ Tipo: [Todas ▼]  Ativo: [Todos ▼]      │ │
│  │        │ │                                          │ │
│  │        │ │ ┌──────────────────────────────────────┐│ │
│  │        │ │ │ Total Movimentado: R$ 125.450       ││ │
│  │        │ │ │ Entradas: +R$ 68.900  Saídas: -47K  ││ │
│  │        │ │ └──────────────────────────────────────┘│ │
│  │        │ │                                          │ │
│  │        │ │ Data      │ Tipo     │ Ativo   │ Qtd   │ │ │
│  │        │ │ Preço     │ Total   │ Status  │       │ │ │
│  │        │ ├──────────────────────────────────────────┤│ │
│  │        │ │ 15/04     │ Compra   │ ELET3   │ 50    ││ │
│  │        │ │ R$ 21.50  │ R$1.075  │ ✅ Done │       ││ │
│  │        │ │                                         ││ │
│  │        │ │ 14/04     │ Venda    │ PETR4   │ 30    ││ │
│  │        │ │ R$ 38.80  │ R$1.164  │ ✅ Done │       ││ │
│  │        │ │                                         ││ │
│  │        │ │ 13/04     │ Aporte   │ Caixa   │ -     ││ │
│  │        │ │ -         │ R$5.000  │ ✅ Done │       ││ │
│  │        │ │                                         ││ │
│  │        │ │ 12/04     │ Dividendo│ BBAS3   │ -     ││ │
│  │        │ │ -         │ R$ 45    │ ✅ Done │       ││ │
│  │        │ │                                         ││ │
│  │        │ │ 10/04     │ Swap     │ Cripto  │ -     ││ │
│  │        │ │ -         │ R$ 250   │ ⏳ Pend │       ││ │
│  │        │ │                                         ││ │
│  │        │ │ [← Anterior] Pág 1 de 8 [Próximo →]    ││ │
│  │        │ │                                          │ │
│  └────────┘ └─────────────────────────────────────────┘ │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Especificação:**
- Filtros sticky no top (período, tipo, ativo)
- Card resumo: Totais em destaque
- Tabela: Expandível para mais detalhes (click row)
- Status: ✅ Done (verde), ⏳ Pending (amarelo), ❌ Failed (vermelho)
- Paginação: 20 itens por página, buttons prev/next
- Exportar: CSV com todos os dados filtrados

---

### 9. DETALHES DO ATIVO (Detail Page)

```
┌──────────────────────────────────────────────────────────┐
│ ☰ [Logo] Esquilo      [← Voltar] ELET3    Perfil [Dark]  │
├──────────────────────────────────────────────────────────┤
│  ┌─ Nav ─┐                                                │
│  │Carteira│ ┌─────────────────────────────────────────┐ │
│  │        │ │ ELETROBRAS - ELET3                      │ │
│  │        │ │                                          │ │
│  │        │ │ Preço Atual:  R$ 21,50      │ +2.50%   │ │
│  │        │ │ Seu Custo:    R$ 20,15      │          │ │
│  │        │ │ Lucro/Prejuízo: +R$ 67,50   │ +6.7%    │ │
│  │        │ │                                          │ │
│  │        │ │ Sua Posição: 100 ações                  │ │
│  │        │ │ Total Investido: R$ 2.015,00            │ │
│  │        │ │ Valor Atual: R$ 2.150,00                │ │
│  │        │ │                                          │ │
│  │        │ │ ┌──────────────────────────────────────┐│ │
│  │        │ │ │ Gráfico 1D/1W/1M/3M/1Y/YTD/ALL        ││ │
│  │        │ │ │ ┌────────────────────────────────────┐││ │
│  │        │ │ │ │                                    │││ │
│  │        │ │ │ │       ╱╲    ╱╲                    │││ │
│  │        │ │ │ │     ╱  ╲╱╲╱  ╲╱╲                 │││ │
│  │        │ │ │ │   ╱              ╲                │││ │
│  │        │ │ │ │                                    │││ │
│  │        │ │ │ └────────────────────────────────────┘││ │
│  │        │ │ │ Max: R$ 24.90 | Min: R$ 18.30 (1M)   ││ │
│  │        │ │ └──────────────────────────────────────┘│ │
│  │        │ │                                          │ │
│  │        │ │ Ações Rápidas:                          │ │
│  │        │ │ [Comprar Mais] [Vender] [Transferir]    │ │
│  │        │ │                                          │ │
│  │        │ │ ─────────────────────────────────────── │ │
│  │        │ │ Informações da Empresa                  │ │
│  │        │ │                                          │ │
│  │        │ │ Setor: Energia          P/L: 8.5        │ │
│  │        │ │ Dividend Yield: 4.2%    ROE: 12.3%      │ │
│  │        │ │ Cotação Atual: 24 meses em alta         │ │
│  │        │ │                                          │ │
│  │        │ │ ─────────────────────────────────────── │ │
│  │        │ │ Seu Histórico (últimas 10 operações)    │ │
│  │        │ │ ├─ 15/04 Compra 50 un @ R$ 21,00       │ │
│  │        │ │ ├─ 10/04 Compra 30 un @ R$ 20,80       │ │
│  │        │ │ ├─ 05/04 Dividendo R$ 45               │ │
│  │        │ │ └─ 01/04 Compra 20 un @ R$ 19,50       │ │
│  │        │ │                                          │ │
│  └────────┘ └─────────────────────────────────────────┘ │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Especificação:**
- Header: Breadcrumb [← Voltar]
- Title: Nome do ativo com ticker
- Preço grande: em destaque (24px), cor verde/vermelho conforme variação
- Posição: Card com dados de custódia
- Gráfico: Responsivo, com timeline tabs (1D, 1W, 1M, etc)
- Ações: 3 buttons principais em grid
- Info empresa: 2x2 grid de métricas importantes
- Histórico: Timeline simples com últimas operações

---

## 🎨 Componentes Desktop Específicos

### Header

```
┌─────────────────────────────────────────────────────────┐
│ [≡] [Logo] Esquilo    [Pesquisa...]  [🔔] [👤] [🌙/☀] │
└─────────────────────────────────────────────────────────┘
```

- Logo com link para home
- Pesquisa global (debounce, suggestions)
- Ícones: Notificações, Perfil, Theme toggle
- Sticky no top

### Sidebar Navigation

```
┌─────────┐
│ • Home  │
│ • Cart  │
│ • Insi  │
│ • Deci  │
│ • Hist  │
│ • Prof  │
│         │
│ Logout  │
└─────────┘
```

- Fixed left (200px)
- Navegação principal
- Current page destaque
- Collapsible (mobile/responsivo)

### Cards

- 24px border-radius
- 1px solid border
- Box-shadow: 0 1px 3px rgba(0,0,0,0.1)
- Hover: elevation (+2px shadow, bg lighter)
- Padding: 24px interno

### Tabelas

- Sticky headers
- Zebra striping (alternating rows)
- Hover row highlight
- Sortable columns (indicators ↑↓)
- 16px line-height

### Buttons

**Primary:**
- BG: Primary color (#0A7E3D)
- Text: White
- Height: 44px (desktop), 48px (important)
- Padding: 12px 24px
- Border-radius: 8px

**Secondary:**
- Border: 1px solid Primary
- Text: Primary color
- BG: Transparent (hover: bg light)

**Danger:**
- BG: Red (#EF4444)
- Text: White
- Confirm modal on click

---

## 📱 Responsividade Breakpoints

```
Desktop:  1280px+ (padrão aqui)
Tablet:   768px - 1279px
Mobile:   < 768px (usar mobile-wireframes.md)
```

**Adaptações Desktop:**
- Sidebar → esconde em tablet/mobile
- Tabelas → scroll horizontal em tablet
- Grid cards → ajusta colunas por breakpoint

---

## 🎬 Animações Desktop

- **Page transitions:** Fade 200ms
- **Hover effects:** 150ms ease-in-out
- **Toggle switches:** 250ms
- **Charts:** Animate in 400ms
- **Modals:** Slide up + fade 250ms

---

## 🌚 Dark Mode

Todas as cores já estão definidas no Design System acima. Implementar:

1. CSS Variables por tema
2. `prefers-color-scheme` media query
3. Toggle em header
4. Persistir em localStorage

```css
:root {
  --color-primary: #0A7E3D;
  --color-bg: #FFFFFF;
  --color-text: #1A1A1A;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #11D456;
    --color-bg: #0F1419;
    --color-text: #F5F5F5;
  }
}
```

---

## 📋 Próximas Etapas

- [ ] Criar protótipo em Figma (componentes desktop)
- [ ] Implementar em React com Tailwind
- [ ] Testar responsividade em diferentes breakpoints
- [ ] Validar contraste de cores (WCAG AA)
- [ ] Performance: lazy loading, code splitting
- [ ] Testes e2e: Playwright desktop scenarios

---

**Versão:** 1.0  
**Data:** 2026-04-17  
**Status:** Proposta para desenvolvimento
