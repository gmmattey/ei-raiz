# 🎯 Integração Rules Engine - Guia Completo

## ✅ O que foi implementado

### 1. **PerfilCompleto.jsx** - Coleta de dados completa
- Tela com 5 passos para coletar dados financeiros
- Salva dados no localStorage quando finalizado
- Rota: `/perfil-completo`

### 2. **useUserProfile Hook** - Gerenciamento de dados
```typescript
// Carrega dados do localStorage ou retorna mock padrão
const userProfile = useUserProfile();

// Salvar dados
saveUserProfile(profileData);

// Limpar dados
clearUserProfile();
```

### 3. **Componentes de Análise**
- **HealthScoreCard**: Exibe score de saúde (0-100) com componentes
- **RecommendationCard**: Exibe recomendação individual com impacto
- **ProjectionCard**: Exibe cenários de projeção financeira

### 4. **Integração no Dashboard**
O Dashboard agora:
- Carrega perfil do usuário usando `useUserProfile`
- Executa `SchilloRulesEngine` automaticamente
- Exibe análise completa com:
  - Score de saúde
  - Top 3 recomendações
  - Projeção de metas

---

## 🔄 Fluxo de Dados

```
LandingPage
    ↓
Onboarding
    ↓
Login (isAuthenticated = true)
    ↓
PreInsight (primeiro acesso)
    ↓
Dashboard
    ↓ (Opcional - para perfil completo)
    ↓
PerfilCompleto ← Salva em localStorage
    ↓ (Volta para)
Dashboard ← Carrega perfil e exibe análise
```

---

## 📋 Como usar

### 1. Acessar PerfilCompleto
```bash
# Navegue para
/perfil-completo

# Ou adicione um botão no Dashboard
<button onClick={() => navigate('/perfil-completo')}>
  Completar Perfil
</button>
```

### 2. Dados coletados (PerfilCompleto)
- **Step 1** - Seu dinheiro: renda, gastos, fundo emergência, dívida
- **Step 2** - Seu patrimônio: valor atual, meta, taxa saque
- **Step 3** - Sua vida: estado civil, dependentes, estabilidade profissional
- **Step 4** - Liquidez e fiscal: necessidades de caixa, situação fiscal
- **Step 5** - Preferências: setores, ativos evitar, ESG, impacto social

### 3. Análise no Dashboard
Quando `useUserProfile` carrega dados, o Rules Engine automaticamente:
1. Calcula métricas financeiras (retorno, volatilidade, Sharpe, etc)
2. Gera recomendações (rebalanceamento, diversificação, liquidez, etc)
3. Projeta cenários (conservador, esperado, otimista)
4. Calcula score de saúde financeira

---

## 🔧 Estrutura de Arquivos

```
apps/web/src/
├── engine/
│   ├── types.ts              ← Tipos (UserProfile, Portfolio, etc)
│   ├── constants.ts          ← Dados de mercado
│   ├── metrics.ts            ← Cálculos financeiros
│   ├── recommendations.ts    ← Gerador de recomendações
│   ├── rulesEngine.ts        ← Orquestrador principal
│   ├── mockData.ts           ← Dados de teste
│   └── index.ts              ← Exports
│
├── hooks/
│   └── useUserProfile.ts     ← Hook de perfil
│
├── components/
│   └── engine/
│       ├── HealthScoreCard.jsx
│       ├── RecommendationCard.jsx
│       ├── ProjectionCard.jsx
│       └── index.js
│
└── features/
    └── perfil/
        ├── PerfilCompleto.jsx
        ├── dashboard.jsx     ← Integrado com Rules Engine
        └── ...
```

---

## 📊 Exemplo de Análise

```javascript
import { useUserProfile } from '@/hooks/useUserProfile';
import { SchilloRulesEngine } from '@/engine/rulesEngine';
import { mockPortfolio1 } from '@/engine/mockData';

// No componente
const userProfile = useUserProfile();

const analysis = useMemo(() => {
  if (!userProfile) return null;
  const engine = new SchilloRulesEngine(userProfile, mockPortfolio1);
  return engine.analyze();
}, [userProfile]);

// Usar análise
if (analysis) {
  console.log(analysis.health);           // Score e status
  console.log(analysis.recommendations);  // Array de recomendações
  console.log(analysis.projection);       // Cenários futuros
  console.log(analysis.metrics);          // Métricas calculadas
}
```

---

## 🎯 Próximos Passos

### 1. **Conectar Portfolio Real**
```javascript
// Atualmente usa mockPortfolio1
// Implementar API para buscar portfolio real do usuário
const portfolio = await api.getPortfolio(userProfile.id);
```

### 2. **Histórico de Análises**
```javascript
// Salvar análises no banco de dados para comparação
const analysisHistory = [
  { date: '2026-04-07', analysis: {...} },
  { date: '2026-04-08', analysis: {...} },
];
```

### 3. **Alertas em Tempo Real**
```javascript
// Monitorar mudanças no portfólio
if (analysis.health.status === 'critico') {
  sendNotification('Ação urgente recomendada!');
}
```

### 4. **Comparação com Benchmark**
```javascript
// Comparar performance com índices
const vs = {
  ibovespa: +8.2,
  sp500: +22.5,
  selic: +10.5,
};
```

---

## 🚀 Testes

### Teste Completo do Fluxo
```bash
1. Acessar http://localhost:3000/
2. Login (Onboarding)
3. Ver PreInsight
4. Entrar no Dashboard
5. Navegar para /perfil-completo
6. Preencher os 5 passos
7. Voltar ao Dashboard
8. Ver análise com dados preenchidos
```

### Verificar localStorage
```javascript
// No console do browser
JSON.parse(localStorage.getItem('userProfileData'))
localStorage.getItem('hasCompletedProfile')
```

---

## 📝 Notas Importantes

- **Dados Mock**: Por enquanto usa `mockPortfolio1` como portfolio padrão
- **localStorage**: Dados persistem no navegador (apenas teste local)
- **Performance**: Análise roda apenas quando `userProfile` muda (useMemo)
- **Idioma**: Tudo em português conforme padrão do projeto

---

## 🔗 Referências

- [RULES_ENGINE_GUIA.md](./RULES_ENGINE_GUIA.md) - Documentação detalhada do engine
- [engine/types.ts](./apps/web/src/engine/types.ts) - Tipos TypeScript
- [engine/rulesEngine.ts](./apps/web/src/engine/rulesEngine.ts) - Implementação principal

---

**Status**: 🟢 Pronto para uso
**Última atualização**: 2026-04-08
**Versão**: 1.0 - Integração Completa
