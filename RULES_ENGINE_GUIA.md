# 🧠 Esquilo Invest - Unified Score Service (Motor de Inteligência)

> **Nota Histórica:** Este documento evoluiu do antigo conceito de "Rules Engine". A implementação atual está consolidada no `UnifiedScoreService` dentro da API.

## 📋 Visão Geral

O **Unified Score Service** é o cérebro do Esquilo Invest. Ele realiza uma análise multidimensional da vida financeira do usuário, cruzando dados de patrimônio, liquidez, endividamento e investimentos.

✅ **Cálculo de Score (0-1000)**: Uma nota unificada de saúde financeira.  
✅ **Análise de Pilares**: Liquidez, Saúde, Estrutura, Comportamento e Evolução.  
✅ **Geração de Insights**: Recomendações automáticas baseadas em regras de negócio.  
✅ **Snapshot Histórico**: Armazenamento da evolução do score no D1.  

---

## 📁 Localização do Código

A inteligência está desacoplada e localizada no Gateway de API:

- **Serviço Principal**: `apps/api/src/server/services/unified-score.service.ts`
- **Análise de Portfólio**: `apps/api/src/server/services/portfolio-analysis.service.ts`
- **Configurações Dinâmicas**: Armazenadas na tabela `configuracoes_produto` (D1).

---

## 📊 Pilares do Score Unificado

O score é composto pela média ponderada de 5 pilares fundamentais:

| Pilar | Peso | O que avalia |
|-------|------|--------------|
| **Liquidez** | 25% | Reserva de emergência e caixa disponível. |
| **Saúde Financeira** | 25% | Relação dívida/renda e serviço da dívida. |
| **Estrutura Patrimonial** | 20% | Concentração por classe e balanço físico/financeiro. |
| **Comportamento** | 15% | Diversificação de ativos e disciplina de aporte. |
| **Eficiência** | 15% | Progresso em direção aos objetivos. |

---

## 💡 Como Funciona (Lógica Interna)

### 1. Coleta de Inputs (`UserInputs`)
O serviço carrega dados de três fontes:
1. `perfil_financeiro`: Renda e gastos declarados.
2. `perfil_contexto_financeiro`: Dados externos (imóveis, dívidas, veículos).
3. `ativos`: Carteira consolidada de investimentos.

### 2. Cálculo de Métricas
- **Emergency Reserve Months**: `liquidAssets / monthlyEssentialCost`.
- **Debt Service Ratio**: `monthlyDebtPayment / monthlyIncome`.
- **Liquidity Ratio**: `liquidAssets / patrimonyGross`.

### 3. Faixas (Bands)
Com base no score final, o usuário é classificado em:
- **Critical** (0-299)
- **Fragile** (300-499)
- **Stable** (500-699)
- **Good** (700-849)
- **Strong** (850-1000)

---

## 📈 Insights Automáticos

O motor gera mensagens baseadas em gatilhos (triggers):

- ⚠️ **Risco**: "Reserva de emergência insuficiente" (se < 3 meses).
- 🚨 **Aviso**: "Comprometimento alto da renda" (se dívida > 35% da renda).
- ✨ **Positivo**: "Boa diversificação" (se distribuído em > 1 classe).

---

## 🛠️ Integração Técnica

Para disparar um cálculo de score na API:

```typescript
// Exemplo interno na API
const scoreService = new UnifiedScoreService(env.DB);
const result = await scoreService.calculateForUser(userId);
```

Para simular um score (Preview) sem salvar no banco:

```typescript
const preview = await scoreService.preview({
  profile: { monthlyIncome: 5000, ... },
  patrimony: { totalDebt: 0, ... }
});
```

---

## ✅ Checklist de Implementação Atual

- ✅ Engine de métricas unificadas (D1 + Service).
- ✅ Snapshot de histórico persistente.
- ✅ Sistema de insights baseados em regras.
- ✅ Pesos configuráveis via banco de dados.
- ⏳ Integração com objetivos financeiros dinâmicos (Fase 2).

---

**Versão:** 1.2.0 (Unified Score)  
**Data:** 2026-04-11  
**Serviço:** UnifiedScoreService  
**Status:** 🟢 Operacional
