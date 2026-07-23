# Vera AI - LLM Narrative Examples

## 📝 Sample Profile

```json
{
  "income": 5000,
  "expenses": 3500,
  "liquidAssets": 8000,
  "totalDebt": 25000,
  "highInterestDebt": 5000,
  "age": 35,
  "investorProfile": "moderate"
}
```

**Vera's Analysis (Rule-Based):**
- Stage: CRITICAL
- Score: 24/100
- Main Problem: HIGH_DEBT_RATIO (500% of annual income)
- Liquidity: 2.3 months (need: 6 months)

---

## 🤖 LLM Narrative Examples

### 1. Claude (Anthropic) - Opus 4.7

**Strengths:** Análise profunda, considerações nuançadas, reasoning

```json
{
  "analise_geral": {
    "analise": "Seu perfil financeiro apresenta pressão significativa de endividamento. Com dívidas totalizando R$ 25.000 (500% da renda anual) contra reserva de apenas 2,3 meses, você está vulnerável a choques financeiros. A proporção de dívida de alto juros (R$ 5.000) é particularmente preocupante, consumindo capital que poderia ser investido.",
    "acao": "Prioridade absoluta: reduzir dívida antes de qualquer investimento. Seu foco deveria ser liquidar a dívida de alto juros em 6 meses e estabelecer fundo de emergência de 6 meses em paralelo."
  },
  "acoes": {
    "analise": "Sua situação não permite investimentos em ações neste momento. O retorno esperado (7-10%) é menor que o custo da dívida (15-25% em cartão). Aplicar capital em dívida gera melhor ROI.",
    "acao": "Aguarde consolidação financeira antes de considerar ações",
    "recomendacoes": []
  },
  "fundos": {
    "analise": "Fundos de renda fixa podem fazer sentido APÓS resolver a dívida, como alternativa de baixo risco.",
    "acao": "Implementar apenas após atingir razão dívida/renda < 200%",
    "recomendacoes": []
  },
  "previdencia": {
    "analise": "Contribuições a previdência privada estão prematura. Priorize estabilidade de curto prazo.",
    "acao": "Revisite em 12 meses, após estruturação"
  },
  "poupanca": {
    "analise": "Poupança está extremamente baixa (0.4 meses de cobertura). Isso é risco sistêmico.",
    "acao": "Dedique R$ 1.083/mês por 12 meses para atingir 6 meses de cobertura"
  }
}
```

**Latency:** ~1.2s | **Tokens:** 450 prompt, 380 completion

---

### 2. GPT-4o (OpenAI)

**Strengths:** Estruturado, prático, foco em CTAs

```json
{
  "analise_geral": {
    "analise": "Diagnóstico: Endividamento crítico com reserva insuficiente. Suas dívidas (R$ 25k) representam 500% da renda mensal. Contas de alto juros (R$ 5k) drenam R$ 625/mês. Com apenas 2,3 meses de reserva, um imprevisto causa crise.",
    "acao": "Fase 1 (Imediato): Congelar gastos variáveis. Fase 2 (1-6 meses): Pagar dívida de alto juros. Fase 3 (6-12 meses): Construir fundo de emergência a 6 meses."
  },
  "acoes": {
    "analise": "Ações estão fora do escopo de sua situação atual. O spread entre retorno esperado e custo da dívida não justifica.",
    "acao": "Suspender qualquer novo aporte em ações até dívida < 200% da renda",
    "recomendacoes": []
  },
  "fundos": {
    "analise": "Fundos só fazem sentido como depósito de emergência (fundo de renda fixa ou CDI).",
    "acao": "Alocar R$ 1.083/mês em fundo CDI/renda fixa até atingir 6 meses",
    "recomendacoes": []
  },
  "previdencia": {
    "analise": "Previdência complementar não é prioridade com dívida acima de 300%.",
    "acao": "Adie por 12-18 meses"
  },
  "poupanca": {
    "analise": "Poupança tradicional rende pouco (5-7% aa), mas é melhor que estar sem reserva. Alterar para CDI/RDB quando tiver R$ 5k+ de reserva.",
    "acao": "Começar com R$ 1.500/mês em poupança, depois migrar para instrumentos melhores"
  }
}
```

**Latency:** ~1.5s | **Tokens:** 320 prompt, 410 completion

---

### 3. Gemini (Google)

**Strengths:** Criativo, empático, narrativa envolvente

```json
{
  "analise_geral": {
    "analise": "Você está em um momento crítico, mas não é uma situação sem saída! O desafio imediato é o custo das dívidas (particularmente os R$ 5 mil em alto juros) que consomem capital que você poderia usar para crescer. Sua margem de R$ 1.500/mês é sua maior força - é suficiente para resolver isso em 17 meses se bem alocada.",
    "acao": "Transforme esse superávit em força: 70% para dívida de alto juros, 30% para fundo de emergência. Em 6 meses você respira melhor."
  },
  "acoes": {
    "analise": "Investir em ações agora seria como tentar correr com pesos nos pés. A volatilidade das ações vs. certeza do juros da dívida não é um bom trade.",
    "acao": "Foco total em dívida por 6 meses, depois revisaremos juntos",
    "recomendacoes": []
  },
  "fundos": {
    "analise": "Fundos de renda fixa podem ser seu 'amigo' durante a transição - rendem mais que poupança (10-12% aa) e são seguros.",
    "acao": "Considere fundo de renda fixa CDI como parte da estratégia de fundo de emergência",
    "recomendacoes": []
  },
  "previdencia": {
    "analise": "Pensar em aposentadoria agora quando você está em emergência é desproporcionado. Mas não ignore - você tem 30 anos para recuperar tempo se agir daqui a 12 meses.",
    "acao": "Procrastine com propósito: volte aqui em 12 meses quando estiver estruturado"
  },
  "poupanca": {
    "analise": "Sua poupança é sua rede de segurança. R$ 8k para 3.5k/mês = você está seguro por 2 meses, precisa de 4 meses a mais.",
    "acao": "Meta: R$ 21k em 12 meses. Isto é R$ 1.083/mês em poupança. É exequível com disciplina."
  }
}
```

**Latency:** ~1.1s | **Tokens:** 380 prompt, 420 completion

---

### 4. Cloudflare Workers AI (Llama 3 8B)

**Strengths:** Rápido, direto, eficiente em tokens

```json
{
  "analise_geral": {
    "analise": "Crítico: Dívida de R$ 25k vs Renda R$ 5k/mês. Alto juros: R$ 5k. Reserva: 2,3 meses. Ação necessária agora.",
    "acao": "Quitação agressiva: R$ 1.500/mês em dívida por 17 meses + R$ 1.083/mês em reserva por 12 meses"
  },
  "acoes": {
    "analise": "Ações: Alto risco para situação de alto endividamento.",
    "acao": "Não investir em ações. Após 6 meses, reavalia.",
    "recomendacoes": []
  },
  "fundos": {
    "analise": "Fundos de renda fixa: 10-12% aa vs 15-25% de juros da dívida.",
    "acao": "Investir em fundo CDI após 6 meses",
    "recomendacoes": []
  },
  "previdencia": {
    "analise": "Previdência aguarda estruturação.",
    "acao": "Retomar em 12 meses"
  },
  "poupanca": {
    "analise": "Reserva crítica: 2,3 meses. Precisa 6 meses.",
    "acao": "Aplicar R$ 1.083/mês em poupança"
  }
}
```

**Latency:** ~0.6s | **Tokens:** 200 prompt, 190 completion

---

## 📊 Comparison Matrix

| Aspecto | Claude | GPT-4o | Gemini | Llama 3 |
|---------|--------|--------|--------|---------|
| **Profundidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Clareza** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Empatia** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Velocidade** | 1-2s | 1-2s | 0.8-1s | 0.5-0.8s |
| **Custo/mês** | ~$5 | ~$8 | ~$3 | ~$1 |
| **Consistência** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎯 Recommendations by Use Case

### Para Análise Profissional
→ Use **Claude** (melhor reasoning e consistência)

### Para Performance/Custo
→ Use **Cloudflare** (rápido e barato)

### Para Melhor Equilíbrio
→ Use **Gemini** (criativo + rápido)

### Para Clientes Empresariais
→ Use **GPT-4o** (estruturado + confiável)

---

## 🔧 How to Test

```bash
# Test com cada provider
export ANTHROPIC_API_KEY=sk-ant-xxxx
npm run dev

# Terminal 1: Server
curl -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d '{"profile": {...}, "llmProvider": "claude"}'

# Compare os tempos e qualidades
# Observe os tokens gastos de cada um
```
