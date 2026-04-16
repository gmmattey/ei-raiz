# 🎯 Integração Score Unificado - Guia de Integração

> **Nota:** A arquitetura de inteligência foi movida para o backend para garantir consistência e segurança. O antigo "Rules Engine" local foi substituído pelo **`UnifiedScoreService`** na API.

## ✅ Estado Atual da Integração

### 1. **Coleta de Dados (Frontend)**
Os dados que alimentam o motor de score são coletados em:
- **Onboarding**: Dados básicos, renda e perfil inicial.
- **Perfil do Usuário (`/perfil`)**: Edição de dados cadastrais.
- **Contexto Financeiro**: Dados de patrimônio externo (imóveis, veículos, dívidas).

### 2. **Consumo da API (`apps/api`)**
O frontend consome a análise através dos endpoints da API:
- `GET /score`: Retorna o score unificado calculado para o usuário.
- `POST /score/preview`: Permite simular um score enviando dados parciais (útil para simuladores).

---

## 🔄 Fluxo de Dados Unificado

```
Frontend (React)
    ↓
API Gateway (Cloudflare Worker)
    ↓
UnifiedScoreService (Logic)
    ├─ Carrega Perfil (D1)
    ├─ Carrega Ativos (D1)
    ├─ Calcula Pilares (Liquidez, Saúde, etc)
    └─ Gera Insights
    ↓
Resposta JSON (Score + Insights + Breakdown)
    ↓
Dashboard (Frontend)
```

---

## 🔧 Como Integrar na UI

### 1. Hook de Consumo
Use o `cliente-api` para buscar o score:

```typescript
import { scoreApi } from '@/cliente-api';

const [scoreResult, setScoreResult] = useState(null);

useEffect(() => {
  scoreApi.getScore().then(setScoreResult);
}, []);
```

### 2. Exibição dos Pilares
O resultado contém um array de `pillars`, ideal para exibir em gráficos de radar ou barras de progresso:

```typescript
{scoreResult.pillars.map(pilar => (
  <div key={pilar.id}>
    <span>{pilar.name}: {pilar.score}/1000</span>
  </div>
))}
```

---

## 📋 Diferenças da Versão Anterior

| Recurso | Antigo (Rules Engine) | Novo (Unified Score Service) |
|---------|-----------------------|------------------------------|
| **Localização** | `apps/web/src/engine/` | `apps/api/src/server/services/` |
| **Persistência** | `localStorage` | `Banco D1 (Snapshots)` |
| **Cálculo** | Client-side (JS) | Server-side (TS/Worker) |
| **Segurança** | Exposto | Protegido no Backend |

---

## 🎯 Próximos Passos

### 1. **Objetivos Dinâmicos**
Integrar o `FEATURE_OBJETIVOS_US.md` ao cálculo de `efficiency_evolution` no backend.

### 2. **Histórico Real**
A API já salva snapshots. O próximo passo é criar o gráfico de evolução do score na UI do Dashboard.

---

**Versão:** 1.2.0 (Integração API)  
**Data:** 2026-04-11  
**Status:** 🟢 Produção (API-Driven)
