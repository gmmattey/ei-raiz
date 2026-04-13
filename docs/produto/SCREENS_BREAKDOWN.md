# Esquilo Invest - Detalhamento de Telas

## 📋 Índice Rápido

| # | Tela | Status | Path | Implementação |
|---|------|--------|------|---------------|
| 1 | Splash | ✅ | `/splash` | Splash (auto) |
| 2 | Login | ✅ | `/` | LoginModal (LandingPage) |
| 3 | Register | ✅ | `/onboarding` | Onboarding Step 1/5 |
| 4 | Forgot Password | ✅ | `/` | LoginModal Step (LandingPage) |
| 5 | Onboarding | ✅ | `/onboarding` | OnboardingScreen.jsx (5 Steps) |
| 6 | Home/Dashboard | ✅ | `/home` | Home.jsx |
| 7 | Portfolio | ✅ | `/carteira` | Carteira.tsx |
| 8 | Holding Detail | ✅ | `/ativo/:ticker` | DetalheAtivo.tsx |
| 9 | Radar / Insights | ✅ | `/insights` | Insights.tsx |
| 10 | History | ✅ | `/historico` | Historico.tsx |
| 11 | Imports - Start | ✅ | `/importar` | Importar.tsx |
| 12 | Imports - Preview | ✅ | `/importar/preview` | (Interno ao Importar.tsx) |
| 13 | Imports - Conflicts | 🎯 | `/importar/conflitos` | Pendente |
| 14 | Imports - Commit | ✅ | `/importar/commit` | (Interno ao Importar.tsx) |
| 15 | Profile | ✅ | `/perfil` | PerfilUsuario.jsx |
| 16 | Settings | ✅ | `/configuracoes` | Configuracoes.tsx |
| 17 | Decision Hub | ✅ | `/decisoes` | DecisionHub.tsx |
| 18 | Admin Panel | ✅ | `/admin` | PainelAdmin.tsx |

---

## 📱 TELAS DETALHADAS (ESTADO ATUAL)

### 1. LANDING PAGE & LOGIN MODAL

**Path:** `/`  
**Implementação:** `LandingPage.tsx`

A Landing Page serve como o portal principal. O login não possui uma tela separada, mas sim um **Modal** robusto que gerencia:
- Login tradicional (E-mail/Senha)
- Recuperação de e-mail (via CPF)
- Recuperação de senha (via Token e Redefinição)

---

### 2. ONBOARDING & REGISTRO

**Path:** `/onboarding`  
**Implementação:** `onboarding.jsx`

O registro de novos usuários é o **primeiro passo** do Onboarding.
1. **Step 1 (Seus dados)**: Nome, CPF, Data Nasc, E-mail, Celular. (Aqui ocorre o `registrar` no backend).
2. **Step 2 (Estilo)**: Perfil de investimento.
3. **Step 3 (Financeiro)**: Renda, Gastos, Aportes.
4. **Step 4 (Template)**: Download do modelo de importação.
5. **Step 5 (Segurança)**: Criação da Senha.

Ao finalizar, o usuário é redirecionado para `/importar`.

---

### 3. HOME / DASHBOARD

**Path:** `/home`  
**Implementação:** `Home.jsx`

Exibe o patrimônio total, variação da carteira e resumo dos ativos principais.

---

### 4. CARTEIRA (PORTFOLIO)

**Path:** `/carteira`  
**Implementação:** `Carteira.tsx`

Lista detalhada de todos os ativos, com filtros por categoria e status.

---

### 5. INSIGHTS (RADAR)

**Path:** `/insights`  
**Implementação:** `Insights.tsx`

Análise de risco, score de saúde e recomendações da IA baseadas no `UnifiedScoreService` do backend.

---

### 6. DECISION HUB

**Path:** `/decisoes`  
**Implementação:** `DecisionHub.tsx`

Módulo especializado em simuladores de decisões financeiras:
- Comprar Imóvel vs Alugar
- Trocar de Carro
- Quitar Dívida vs Investir
- Gastar Luxo vs Investir Diferença

---

## 🎯 Desenvolvimento Priorizado (Backlog)

### FASE 1: Melhorias de Importação (Backlog)
- [ ] Refinar tela de **Conflitos** de importação.
- [ ] Implementar detalhamento histórico de importações individuais.

### FASE 2: Objetivos Financeiros (🎯 Spec em FEATURE_OBJETIVOS_US.md)
- [ ] Implementar CRUD de objetivos.
- [ ] Criar tela de visão geral de metas vinculadas.

---

**Documento:** SCREENS_BREAKDOWN.md  
**Versão:** 1.1 (Atualizado)  
**Data:** 2026-04-11  
**Status:** Reflete o estado atual do repositório ✅
