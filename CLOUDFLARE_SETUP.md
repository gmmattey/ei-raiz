# Configuração do Cloudflare Workers AI

## O que é?
Cloudflare oferece acesso a modelos de IA através do Workers AI, permitindo executar inferência sem custo inicial significativo. É uma alternativa econômica aos provedores como OpenAI, Gemini e Anthropic.

## Passos de Configuração

### 1. Obter Account ID
1. Acesse: https://dash.cloudflare.com/?to=/:account/workers/services
2. Copie seu **Account ID** (formato: 32 caracteres hexadecimais)
3. Cole em `.env`:
```
CLOUDFLARE_ACCOUNT_ID=seu_account_id_aqui
```

### 2. Gerar API Token
1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em **Create Token**
3. Selecione "Custom token"
4. Configure as permissões:
   - **All zones** → `Workers AI Scripts` → `Read`
   - **All zones** → `Account Settings` → `Read`
5. Copie o token gerado
6. Cole em `.env`:
```
CLOUDFLARE_API_TOKEN=seu_token_aqui
```

### 3. Modelos Disponíveis
O servidor usa por padrão: `@cf/meta/llama-3-8b-instruct`

Outros modelos disponíveis:
- `@cf/meta/llama-2-7b-chat-int8` (Llama 2)
- `@cf/mistral/mistral-7b-instruct-v0.1` (Mistral)
- `@cf/qwen/qwen-1.5-0.5b-chat` (Qwen - rápido, leve)

## Testando a Integração

### Via cURL
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "idade": 35,
      "renda_mensal": 5000,
      "patrimonio": 50000
    },
    "portfolio": {
      "acoes": 20000,
      "renda_fixa": 15000,
      "caixa": 15000
    },
    "providers": [
      {
        "id": "cloudflare",
        "name": "Cloudflare AI",
        "model": "@cf/meta/llama-3-8b-instruct"
      }
    ]
  }'
```

### Via JavaScript
```javascript
const response = await fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profile: { idade: 35, renda_mensal: 5000, patrimonio: 50000 },
    portfolio: { acoes: 20000, renda_fixa: 15000, caixa: 15000 },
    providers: [
      {
        id: 'cloudflare',
        name: 'Cloudflare AI',
        model: '@cf/meta/llama-3-8b-instruct'
      }
    ]
  })
});
const data = await response.json();
console.log(data);
```

## Resposta Esperada
```json
{
  "provider": "Cloudflare AI",
  "model": "@cf/meta/llama-3-8b-instruct",
  "result": {
    "analise_geral": {
      "analise": "...",
      "acao": "..."
    },
    "acoes": {
      "analise": "...",
      "acao": "...",
      "recomendacoes": [...]
    },
    "fundos": {...},
    "previdencia": {...},
    "poupanca": {...}
  },
  "tokens": {
    "prompt": 450,
    "completion": 1200,
    "total": 1650
  },
  "latency": 2341
}
```

## Ordem de Tentativa (Fallback)
O servidor tenta os provedores nesta ordem até um sucesso:
1. **Cloudflare AI** - `@cf/meta/llama-3-8b-instruct` ✅ (primeira prioridade)
2. **OpenAI (ChatGPT)** - `gpt-4o`
3. **Google Gemini** - `gemini-1.5-pro`
4. **Anthropic (Claude)** - `claude-3-5-sonnet-20240620`
5. **Fallback interno** (regras JSON do `scenarios.json`)

## Vantagens do Cloudflare
- ✅ Sem custo inicial para primeiros 50k tokens/dia
- ✅ Inferência rápida (edge computing)
- ✅ Integrado com Cloudflare Workers
- ✅ Suporte a múltiplos modelos
- ⚠️ Modelos menores (8B-7B parâmetros)

## Dicas de Performance
- Para respostas rápidas: use `@cf/qwen/qwen-1.5-0.5b-chat`
- Para melhor qualidade: use `@cf/meta/llama-3-8b-instruct`
- Cloudflare não cobra por erros, apenas tokens utilizados

## Troubleshooting

### Erro: "Cloudflare Account ID or API Token not configured"
→ Verifique se `.env` tem as variáveis corretas

### Erro: "401 Unauthorized"
→ Token expirou ou foi revogado, gere um novo

### Erro: "429 Too Many Requests"
→ Limite de taxa atingido, aguarde ou escale para plano pago

## Referências
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Modelos disponíveis](https://developers.cloudflare.com/workers-ai/models/)
- [API Reference](https://developers.cloudflare.com/api/operations/workers-ai-post-run-model)
