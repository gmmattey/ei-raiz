# Integração Vera - Página de Insights

## Overview

A página de INSIGHTS agora está totalmente integrada com o Vera para análise de contexto financeiro e recomendações personalizadas.

## Fluxo de Dados

```
1. InsightsPage carrega resumo via insightsApi.obterResumo()
   └── Contém: contextoFinanceiro, patrimonioConsolidado, perfil de risco, etc.

2. Após carregar resumo, dispara avaliarComVera(resumo)
   └── Hook: useVeraEvaluation()
   └── Transforma dados locais em VeraAvaliacaoRequest

3. Frontend envia POST /api/vera/avaliar
   └── Backend: veraBridge.avaliar()
   └── Chama vera.evaluate() (motor local + cascade de providers)
   └── Retorna: VeraAvaliacaoResponse com frontend_payload

4. Frontend renderiza VeraCard com recomendações
   └── Posicionado no topo da análise
   └── Dispara telemetria ao clicar em CTA
```

## Arquivos Principais

### Frontend
- **Insights.jsx** - Desktop, integração Vera via hook
- **InsightsMobile.jsx** - Mobile, integração Vera via hook
- **hooks/useVeraEvaluation.js** - Hook customizado para chamadas Vera
- **../vera/VeraCard.jsx** - Renderização do card de recomendação

### Backend
- **veraBridge.ts** - Mapeamento de dados + orquestração Vera
- **vera.routes.ts** - Endpoint POST /api/vera/avaliar
- **vera/service.ts** - Motor de regras interno (vera.evaluate)

## VeraAvaliacaoRequest

```typescript
{
  profile: {
    monthly_income?: { value: number, state: 'HAS_VALUE' }
    monthly_expenses?: { value: number, state: 'HAS_VALUE' }
    current_reserve?: { value: number, state: 'HAS_VALUE' }
    debt_total?: { value: number, state: 'HAS_VALUE' }
    age?: { value: number, state: 'HAS_VALUE' }
    investor_profile_declared?: { value: string, state: 'HAS_VALUE' }
  },
  history: {
    recommendations_completed: number
    recommendations_ignored: number
    recommendations_postponed: number
    promised_vs_actual_contribution_ratio: number (0-1)
  }
}
```

## VeraFrontendPayload

```typescript
{
  kind: 'insight_card' | 'recommendation_card' | 'warning_card' | 'goal_card'
  id: string
  decision_type: string
  severity: 'low' | 'medium' | 'high'
  tone: 'neutral' | 'warning' | 'positive' | 'critical'
  title: string
  body: string
  cta?: { label: string, action: string }
  metadata: {
    template_key: string
    confidence?: number
    trace_id?: string
    authorized_capabilities?: string[]
  }
}
```

## Ações Suportadas (CTA)

- `OPEN_RESERVE_FLOW` → Navega para /decisoes (gestão de reserva)
- `OPEN_GOAL_REVIEW` → Navega para /decisoes (revisão de metas)
- `OPEN_DEBT_FLOW` → Navega para /decisoes (gestão de dívida)

## Cascade de Providers (Backend)

Quando o Vera avalia financeiramente:

1. **Cloudflare AI** (@cf/meta/llama-3-8b-instruct) - PRIMARY
   - Config: Variáveis de ambiente CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
   - Status: Aguardando credenciais reais

2. **OpenAI** (gpt-4o) - FALLBACK 1
   - Config: OPENAI_API_KEY
   - Status: Aguardando credenciais reais

3. **Google Gemini** (gemini-1.5-pro) - FALLBACK 2
   - Config: GOOGLE_API_KEY
   - Status: Endpoint reachable, auth pending

4. **Anthropic Claude** (claude-3-5-sonnet) - FALLBACK 3
   - Config: ANTHROPIC_API_KEY
   - Status: Aguardando credenciais reais

5. **Fallback Interno** (scenarios.json) - ALWAYS AVAILABLE
   - Engine: Motor de regras puro
   - Status: ✅ Ativo

## Tratamento de Erros

- **Vera falha**: Não bloqueia UI, log silencioso em console
- **Vera sucesso**: Renderiza VeraCard com recomendações
- **Sem payload**: Card não é renderizado, análise prossegue normalmente

## Localização (i18n)

- ✅ **PT-BR** completo em Insights.jsx e InsightsMobile.jsx
- Rótulos: "O que encontramos na sua carteira", "Ação prioritária", "Diagnóstico final"
- Telemetria: registra eventos em português

## Testing

Para testar a integração:

```bash
# 1. Verificar console para logs de [Vera]
# 2. Ativar Network tab para ver POST /api/vera/avaliar
# 3. Verificar VeraCard renderizado com título + recomendação
# 4. Clicar em CTA e validar navegação + telemetria
```

## Próximas Etapas

1. ✅ Localização PT-BR completa
2. ✅ Integração com hook customizado
3. ⏳ Ativar credenciais reais no .env (vera-worker.giammattey-luiz.workers.dev)
4. ⏳ Teste A/B de diferentes recomendações Vera
5. ⏳ Histórico de recomendações aceitas/ignoradas para melhorar algoritmo
