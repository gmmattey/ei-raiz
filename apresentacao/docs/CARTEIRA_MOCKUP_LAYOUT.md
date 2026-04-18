# Carteira - Layout Visual (Antes/Depois)

---

## 📱 MOBILE - Antes vs Depois

### ANTES (Current: CarteiraMobile.jsx)
```
┌─────────────────────────┐
│ Carteira                │
│ Visão por categoria     │
└─────────────────────────┘
┌─────────────────────────┐
│ Patrimônio consolidado  │
│ R$ 150.000,00           │
└─────────────────────────┘
┌─────────────────────────┐
│ 📊 Ações                │
│ Toque para abrir        │  R$ 45.000
├─────────────────────────┤
│ 💰 Fundos               │
│ Toque para abrir        │  R$ 60.000
├─────────────────────────┤
│ 📈 Renda Fixa           │
│ Toque para abrir        │  R$ 30.000
├─────────────────────────┤
│ 🏠 Previdência          │
│ Toque para abrir        │  R$ 15.000
└─────────────────────────┘
┌──────────────┬──────────────┐
│ Registrar    │   Ver        │
│ aporte       │ histórico    │
└──────────────┴──────────────┘
```

### DEPOIS (Redesign)
```
┌─────────────────────────┐
│ Sua Carteira            │  (removido subtítulo)
└─────────────────────────┘
┌─────────────────────────┐
│ Patrimônio Consolidado  │
│ R$ 150.000,00           │
│ (Card tipo Home Mobile) │
└─────────────────────────┘

┌──────────────┬──────────────┐
│ Investimentos│ Score        │
│ R$ 105.000  │ 750/1000    │
│ +8.5% a.a.   │ Bom         │
└──────────────┴──────────────┘

┌─────────────────────────┐
│ Rentabilidade Histórica │
│ [Gráfico com filtro]    │  ← NOVO
│ Ações | Fundos | Renda  │
│ vs CDI (toggle)         │
└─────────────────────────┘

┌─────────────────────────┐
│ 📊 Ações                │
│ Toque para abrir        │  R$ 45.000
├─────────────────────────┤
│ 💰 Fundos               │
│ Toque para abrir        │  R$ 60.000
├─────────────────────────┤
│ 📈 Renda Fixa           │
│ Toque para abrir        │  R$ 30.000
└─────────────────────────┘
┌──────────────┬──────────────┐
│ Importar     │  (removido)  │
│              │              │
└──────────────┴──────────────┘
```

---

## 🖥️ DESKTOP - Antes vs Depois

### ANTES (Current: Carteira.jsx)
```
┌──────────────────────────────────────────────────────────┐
│ Sua Carteira                                             │
│ Acompanhe todos os seus ativos em um só lugar    [...]  │
│                                                          │
│ 🟢 Cotações atualizadas agora                            │
│                                                          │
│ ┌──────────────┬──────────────┬──────────────┬──────────┐
│ │ Patrimônio   │ Retorno      │ Score        │ Ativos   │
│ │ R$ 150.000  │ +8.5% a.a.   │ 750/1000     │ 45       │
│ └──────────────┴──────────────┴──────────────┴──────────┘
│
│ [Gráfico Alocação Donut]
│
│ FILTROS: [Ações] [Fundos] [Renda Fixa] ... [Busca] ...
│
│ ┌──────────────────────────────────────────────────────┐
│ │ 🔽 AÇÕES (expandido)                      │ Saldo    │
│ ├──────────────────────────────────────────┼──────────┤
│ │ Ticker │ Posição │ %Aloc │ Rent │ Pm │ Preço │ Qtd │ ✎
│ ├────────┼─────────┼───────┼──────┼────┼───────┼─────┤
│ │ PETR4  │ 40K    │ 27%   │ 12%  │...│ ...  │ 100 │ ✎
│ └──────────────────────────────────────────┴──────────┘
│ ┌──────────────────────────────────────────────────────┐
│ │ 🔽 FUNDOS (expandido)                     │ Saldo    │
│ ├──────────────────────────────────────────┼──────────┤
│ │ Nome     │ Posição │ %Aloc │ Rentab │ Valor Aplic │
│ └──────────────────────────────────────────┴──────────┘
```

### DEPOIS (Redesign)
```
┌──────────────────────────────────────────────────────────┐
│ Sua Carteira                                             │
│                                      [Atualizar] [...]   │
│                                                          │
│ ⏰ Atualizado em 18/04 às 14:30  (substituiu "agora")   │
│                                                          │
│ ┌──────────────┬──────────────┐                         │
│ │ Patrimônio   │ Retorno      │                         │
│ │ Investido    │              │                         │
│ │ R$ 105.000  │ +8.5% a.a.   │                         │
│ └──────────────┴──────────────┘                         │
│                                                          │
│ ┌──────────────┬──────────────┐                         │
│ │ Score da     │              │                         │
│ │ Carteira     │              │                         │
│ │ 750/1000     │ Bom          │                         │
│ └──────────────┴──────────────┘                         │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐
│ │ Rentabilidade Histórica                              │  ← NOVO
│ │ [Gráfico com 24M de histórico]                       │
│ │ Filtros: [Ações] [Fundos] [Renda] | vs CDI [toggle] │
│ └──────────────────────────────────────────────────────┘
│
│ FILTROS: [Ações] [Fundos] [Renda Fixa] ... [Busca] ...
│
│ ┌──────────────────────────────────────────────────────┐
│ │ 🔽 AÇÕES (expandido)                      │ Saldo    │
│ │ (sem encostado na borda — padding ajustado)          │
│ ├──────────────────────────────────────────┼──────────┤
│ │ Ticker │ Posição │ %Aloc │ Rent% │ Pm │ Preço │ Qtd  │ ✏️
│ ├────────┼─────────┼───────┼──────┼────┼───────┼──────┤
│ │ PETR4  │ 40K    │ 27%   │ 12%  │...│ ...   │ 100  │ ✏️
│ └──────────────────────────────────────────┴──────────┘
│ ┌──────────────────────────────────────────────────────┐
│ │ 🔽 FUNDOS (expandido)        (colunas diferentes)   │
│ │ (sem encostado na borda — padding ajustado)          │
│ ├──────────────────────────────────────────┼──────────┤
│ │ Nome     │ Posição │ %Aloc │ Rentab % │ Val.Aplic... │
│ └──────────────────────────────────────────┴──────────┘
```

---

## 🔄 Comparação de Cards

### Card "Patrimônio Investido"
```
HOME (Referência):              CARTEIRA (Implementar):
┌─────────────────────┐        ┌─────────────────────┐
│ Investimentos       │        │ Investimentos       │
│ R$ 105.000         │        │ R$ 105.000         │
│                     │        │                     │
│ +8.5% a.a.         │        │ +8.5% a.a.         │
│ Ações 45%          │        │ Ações 45%          │
│ Fundos 40%         │        │ Fundos 40%         │
│ Renda 15%          │        │ Renda 15%          │
└─────────────────────┘        └─────────────────────┘

(Home.jsx linhas 491-502)      (Carteira.jsx — novo seção)
```

### Card "Score da Carteira"
```
┌─────────────────────┐
│ Score da Carteira   │
│                     │
│ 750 / 1000         │
│                     │
│ Bom                 │
│ ✓ Sem alertas       │
└─────────────────────┘
```

---

## 📊 Gráfico de Rentabilidade (NOVO)

### Estrutura
```
Rentabilidade Histórica

[Jan][Fev][Mar][Abr][Mai][Jun] ... [Dez]
  5%  7%   8%   10%  9%  11%        12%
   |   |   |    |    |   |          |
   └───┴───┴────┴────┴───┴──────────┘  (Carteira)
                                       (Benchmark CDI)

Filtros: [Ações] [Fundos] [Renda] [Previdência] [Poupança]
         vs CDI [toggle] — Desabilitado para Ações

```

### Dados Esperados
- Eixo X: Mês/Ano (últimos 24 meses)
- Eixo Y: Rentabilidade percentual
- Linha 1: Carteira (laranja #F56A2A)
- Linha 2 (CDI): Verde #6FCF97 (quando ativado)
- CDI bloqueado se filtro = Ações

---

## 🗂️ Estrutura de Colunas Tipificadas

### AÇÕES
```
│ Ticker │ Posição │ %Aloc │ Rentabilidade% │ Preço Médio │ Preço Atual │ Qtd │ Ação │
```

### FUNDOS
```
│ Nome │ Posição │ %Aloc │ Rentabilidade% │ Valor Aplicado │ Valor Líquido │ Ação │
```

### RENDA FIXA
```
│ Nome │ Posição │ %Aloc │ Rentabilidade% │ Valor Aplicado │ Valor Líquido │ Ação │
```

### PREVIDÊNCIA
```
│ Nome │ Posição │ %Aloc │ Rendimento(R$) │ Rentabilidade% │ Valor Aplicado │ Ação │
```

---

## ✏️ Consolidação de Ativos

### Exemplo: Ações PETR4
```
ANTES (sem consolidação):
┌─────────────────────────────────────────────────┐
│ PETR4  │ R$ 30.000  │ 20%  │ +12% │ 50 ações   │
│ PETR4  │ R$ 10.000  │ 6.7% │ +12% │ 25 ações   │
└─────────────────────────────────────────────────┘

DEPOIS (consolidado):
┌─────────────────────────────────────────────────┐
│ PETR4  │ R$ 40.000  │ 26.7%│ +12% │ 75 ações   │
│        │            │      │      │ (preço mé) │
└─────────────────────────────────────────────────┘
```

---

## 📋 Checklist Visual

- [ ] Card "Investimentos" (sem bens) ao lado de "Score"
- [ ] Gráfico rentabilidade histórica com filtros
- [ ] CDI desabilitado para Ações
- [ ] Data/hora discreta em Desktop
- [ ] Colunas diferentes por tipo
- [ ] Ativos consolidados quando duplicados
- [ ] Botão "Importar" em destaque
- [ ] Padding ajustado em cards
- [ ] Responsividade mobile completa

