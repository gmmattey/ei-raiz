# Vera AI - LLM Integration Guide

## 🚀 Overview

A Vera AI agora pode gerar narrativas enriquecidas usando múltiplos LLMs:

- **Claude (Anthropic)** - Análises sofisticadas com reasoning
- **GPT-4 (OpenAI)** - Narrativas estruturadas em JSON
- **Gemini (Google)** - Respostas criativas e detalhadas  
- **Cloudflare Workers AI** - Modelo Llama 3 8B (mais rápido)

## 📋 Setup

### 1. Obtenha suas API Keys

#### Claude (Anthropic)
```bash
# https://console.anthropic.com/account/keys
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

#### GPT-4 (OpenAI)
```bash
# https://platform.openai.com/account/api-keys
export OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
```

#### Gemini (Google)
```bash
# https://aistudio.google.com/app/apikey
export GEMINI_API_KEY=xxxxxxxxxxxx
```

#### Cloudflare Workers AI
```bash
# https://dash.cloudflare.com/profile/api-tokens
export CLOUDFLARE_API_TOKEN=xxxxxxxxxxxx
export CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxx
```

### 2. Configure seu .env.local

```bash
cp .env.local.example .env.local

# Edite e preencha com suas chaves:
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
GEMINI_API_KEY=your-key
CLOUDFLARE_API_TOKEN=your-key
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

## 🧪 Testing

### Test com Claude
```bash
curl -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "profile": { ... },
    "llmProvider": "claude"
  }'
```

### Test com GPT-4
```bash
curl -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "profile": { ... },
    "llmProvider": "gpt"
  }'
```

### Test com Gemini
```bash
curl -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "profile": { ... },
    "llmProvider": "gemini"
  }'
```

### Test com Cloudflare
```bash
curl -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "profile": { ... },
    "llmProvider": "cloudflare"
  }'
```

## 📊 Response Structure

```json
{
  "decision": {
    "user_stage": "CRITICAL",
    "main_problem": "ALTA_PRESSAO_DE_DIVIDA",
    "problems": [...],
    "opportunities": [...]
  },
  "dashboard": {
    "hero": { "score": 24, "band": "Crítico" },
    "cards": { "problems": [...], "opportunities": [...] }
  },
  "llmNarrative": {
    "analise_geral": { "analise": "...", "acao": "..." },
    "acoes": { "analise": "...", "recomendacoes": [...] }
  },
  "llmMetadata": {
    "provider": "claude",
    "model": "claude-opus-4-7",
    "tokens": { "prompt": 450, "completion": 320, "total": 770 },
    "latency": 1250,
    "timestamp": "2026-04-18T23:54:52.565Z"
  }
}
```

## 🎯 LLM System Prompt

Todos os LLMs recebem este prompt:

```
Você é o motor de decisão financeira "Vera". Sua tarefa é analisar o perfil 
e a carteira de investimentos de um cliente e fornecer recomendações estruturadas.

Você deve responder APENAS em formato JSON, seguindo a estrutura:
{
  "analise_geral": { "analise": "string", "acao": "string" },
  "acoes": { "analise": "string", "acao": "string", "recomendacoes": [...] },
  "fundos": { "analise": "string", "acao": "string", "recomendacoes": [...] },
  "previdencia": { "analise": "string", "acao": "string" },
  "poupanca": { "analise": "string", "acao": "string" }
}
```

## ⚡ Performance Comparison

| Provider | Model | Latency | Cost | Quality |
|----------|-------|---------|------|---------|
| Claude | Opus 4.7 | ~1-2s | $$ | ⭐⭐⭐⭐⭐ |
| OpenAI | GPT-4o | ~1-2s | $$$ | ⭐⭐⭐⭐ |
| Google | Gemini 2.0 | ~1s | $ | ⭐⭐⭐⭐ |
| Cloudflare | Llama 3 8B | ~0.5s | $ | ⭐⭐⭐ |

## 🔄 Fallback Strategy

Se nenhum LLM está disponível, Vera retorna:
- ✅ Análise estruturada baseada em regras (sempre funciona)
- ✅ Dashboard com cards de problemas e oportunidades
- ❌ Narrativa enriquecida (pulada)

## 📝 Next Steps

1. Configure suas API keys no `.env.local`
2. Reinicie o servidor: `npm run dev`
3. Rode os testes de integração
4. Compare as narrativas geradas por cada LLM
