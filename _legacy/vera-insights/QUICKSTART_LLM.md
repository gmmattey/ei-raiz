# 🚀 Quick Start - Vera AI com LLMs

## 📋 5 Passos para Começar

### Passo 1: Obtenha suas chaves API

Escolha qual(is) LLM(s) deseja testar:

#### Option A: Claude (Recomendado para análise profunda)
1. Acesse: https://console.anthropic.com/account/keys
2. Clique "Create Key"
3. Copie a chave: `sk-ant-xxxxxxx...`

#### Option B: OpenAI GPT-4o
1. Acesse: https://platform.openai.com/account/api-keys
2. Clique "Create new secret key"
3. Copie a chave: `sk-proj-xxxxxxx...`

#### Option C: Google Gemini
1. Acesse: https://aistudio.google.com/app/apikey
2. Clique "Get API Key"
3. Copie a chave

#### Option D: Cloudflare Workers AI
1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Crie um token com permissão Workers AI
3. Copie o token e seu Account ID

---

### Passo 2: Configure seu .env.local

```bash
cd "D:\Programação\Projetos\Projeto Vera"
cp .env.local.example .env.local
```

Edite o arquivo `.env.local` e preencha com suas chaves:

```bash
# Use apenas as que você configurou:

# Se escolheu Claude:
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxx

# Se escolheu GPT-4:
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxx

# Se escolheu Gemini:
GEMINI_API_KEY=xxxxxxxxxxxxxxx

# Se escolheu Cloudflare:
CLOUDFLARE_API_TOKEN=xxxxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxxxx
```

**Importante:** Não commit este arquivo! (já está no .gitignore)

---

### Passo 3: Certifique-se que o servidor está rodando

```bash
# Terminal 1: Inicie o servidor
cd "D:\Programação\Projetos\Projeto Vera"
npm run dev

# Você deve ver:
# ✓ Server running on http://localhost:3002
```

---

### Passo 4: Faça uma requisição de teste

**Opção A: Teste com Claude**

```bash
# Terminal 2:
curl -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "claude-test-001",
    "profile": {
      "income": { "value": 5000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.95, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "expenses": { "value": 3500, "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.95, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "liquidAssets": { "value": 15000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.9, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "totalDebt": { "value": 8000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.85, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "highInterestDebt": { "value": 2000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.85, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "age": { "value": 35, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "investorProfile": { "value": "moderate", "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.8, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "goals": []
    },
    "llmProvider": "claude"
  }' | python -m json.tool > /tmp/vera-response.json

cat /tmp/vera-response.json | head -100
```

**Opção B: Teste com GPT-4o**

```bash
curl -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "gpt-test-001",
    "profile": { ... },
    "llmProvider": "gpt"
  }' | python -m json.tool > /tmp/vera-response-gpt.json

cat /tmp/vera-response-gpt.json | head -100
```

**Opção C: Teste com Gemini**

```bash
curl -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "gemini-test-001",
    "profile": { ... },
    "llmProvider": "gemini"
  }' | python -m json.tool > /tmp/vera-response-gemini.json

cat /tmp/vera-response-gemini.json | head -100
```

---

### Passo 5: Analise os resultados

Depois de executar a requisição, você verá uma resposta JSON com:

```json
{
  "decision": {
    "user_stage": "STRUCTURING",
    "main_problem": "...",
    "simplified_score": 68,
    "simplified_band": "Moderado"
  },
  
  "dashboard": {
    "hero": {
      "score": 68,
      "band": "Moderado",
      "message": "Sua situação é estável, mas há espaço para melhorar..."
    },
    "cards": {
      "problems": [ ... ],
      "opportunities": [ ... ]
    }
  },
  
  "llmNarrative": {
    "analise_geral": {
      "analise": "Seu perfil financeiro está mais saudável...",
      "acao": "Agora você pode focar em otimização e crescimento..."
    },
    "acoes": { ... },
    "fundos": { ... }
  },
  
  "llmMetadata": {
    "provider": "claude",
    "model": "claude-opus-4-7",
    "tokens": {
      "prompt": 450,
      "completion": 320,
      "total": 770
    },
    "latency": 1250,
    "timestamp": "2026-04-18T23:54:52.565Z"
  }
}
```

---

## 🎯 Próximos Passos

### Testar Diferentes Perfis

Experimente variando os dados do perfil:

**Perfil Crítico (teste 1 - já fez):**
```json
"income": 5000, "expenses": 3500, "liquidAssets": 8000,
"totalDebt": 25000, "highInterestDebt": 5000
```

**Perfil Estável:**
```json
"income": 6000, "expenses": 3500, "liquidAssets": 20000,
"totalDebt": 8000, "highInterestDebt": 2000
```

**Perfil Crescente:**
```json
"income": 8000, "expenses": 3500, "liquidAssets": 50000,
"totalDebt": 5000, "highInterestDebt": 1000
```

---

## 🔄 Comparar Resultados entre LLMs

Para comparar como cada LLM responde:

```bash
#!/bin/bash

PROFILE='{"userId":"comp-test","profile":{...}}'

echo "🤖 Claude:"
curl -s -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d "{$PROFILE,\"llmProvider\":\"claude\"}" | \
  python -m json.tool | grep -A 20 '"llmNarrative"'

echo "\n🤖 GPT-4o:"
curl -s -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d "{$PROFILE,\"llmProvider\":\"gpt\"}" | \
  python -m json.tool | grep -A 20 '"llmNarrative"'

echo "\n🤖 Gemini:"
curl -s -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d "{$PROFILE,\"llmProvider\":\"gemini\"}" | \
  python -m json.tool | grep -A 20 '"llmNarrative"'

echo "\n⚡ Cloudflare:"
curl -s -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d "{$PROFILE,\"llmProvider\":\"cloudflare\"}" | \
  python -m json.tool | grep -A 20 '"llmNarrative"'
```

---

## 🚨 Troubleshooting

### "API Key not configured"
```
✅ Solução: Verifique se a chave está em .env.local e reinicie o servidor
```

### "Connection refused on localhost:3002"
```
✅ Solução: Certifique-se que `npm run dev` está rodando em outro terminal
```

### "Unexpected token in JSON"
```
✅ Solução: Valide seu JSON em https://jsonlint.com/
```

### "Rate limit exceeded"
```
✅ Solução: Aguarde 60 segundos ou use Cloudflare Workers (mais barato)
```

---

## 💡 Tips & Tricks

### 1. Salve suas requisições
```bash
# Crie um arquivo test-request.json com sua requisição
cat > test-request.json << 'EOF'
{
  "userId": "my-test",
  "profile": { ... },
  "llmProvider": "claude"
}
EOF

# Use com curl:
curl -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d @test-request.json
```

### 2. Use jq para filtrar respostas
```bash
# Mostrar apenas a narrativa LLM:
curl ... | jq '.llmNarrative'

# Mostrar apenas metadata:
curl ... | jq '.llmMetadata'

# Mostrar apenas score e banda:
curl ... | jq '.decision | {score: .simplified_score, band: .simplified_band}'
```

### 3. Monitore custos
```bash
# Veja tokens gastos por provider:
curl ... | jq '.llmMetadata.tokens'

# Estime custo:
# Claude: $3/1M input, $15/1M output
# GPT-4o: $2.50/1M input, $10/1M output
# Gemini: Free tier até 1500 requests/dia
# Cloudflare: $0.50/1M tokens
```

### 4. Teste sem LLM (fallback)
```bash
# Omita llmProvider para usar apenas rule-based:
curl -X POST http://localhost:3002/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","profile":{...}}'

# Resposta virá sem llmNarrative, mas com dashboard completo
```

---

## 📚 Resources

- **Vera Status:** `VERA_STATUS.md`
- **LLM Examples:** `LLM_EXAMPLES.md`
- **Integration Guide:** `LLM_INTEGRATION_GUIDE.md`
- **Server Code:** `server.ts`

---

## ✅ Checklist

- [ ] Copiei `.env.local.example` para `.env.local`
- [ ] Adicionei minhas chaves API ao `.env.local`
- [ ] Servidor está rodando (`npm run dev`)
- [ ] Testei com pelo menos um LLM provider
- [ ] Comparei respostas de diferentes providers
- [ ] Experimentei com diferentes perfis de usuários

---

**Pronto para começar? Execute o Passo 1 acima!** 🚀
