# 🤖 Vera - Motor de Decisão Financeira com IA

**Vera** é um sistema inteligente de análise de carteiras e recomendações financeiras que utiliza múltiplos provedores de IA com padrão de cascade (fallback automático).

## 📋 Visão Geral

Vera analisa o perfil e carteira de investimentos de clientes e fornece recomendações estruturadas em JSON, cobrindo:

- 📊 Análise Geral (saúde financeira)
- 📈 Recomendações de Ações
- 💼 Recomendações de Fundos
- 🏦 Análise de Previdência
- 💰 Análise de Poupança

## 🎯 Cascade de Provedores IA

O sistema tenta integração com múltiplos provedores nesta ordem:

1. **☁️ Cloudflare AI** (Primeira prioridade)
   - Modelo: `@cf/meta/llama-3-8b-instruct`
   - Vantagem: Rápido, edge computing
   
2. **🔓 OpenAI (ChatGPT)**
   - Modelo: `gpt-4o`
   
3. **🔍 Google Gemini**
   - Modelo: `gemini-1.5-pro`
   
4. **🧠 Anthropic (Claude)**
   - Modelo: `claude-3-5-sonnet-20240620`
   
5. **⚙️ Fallback Interno**
   - Motor de regras determinísticas (scenarios.json)
   - Ativado quando todos os provedores externos falham

## 🚀 Quick Start

### Instalação

```bash
cd "Projeto Vera"
npm install
```

### Configuração

Crie um arquivo `.env`:

```env
# Cloudflare Workers AI
CLOUDFLARE_ACCOUNT_ID=seu_account_id
CLOUDFLARE_API_TOKEN=seu_token

# OpenAI (opcional)
OPENAI_API_KEY=sk-...

# Google Gemini (opcional)
GEMINI_API_KEY=AIza-...

# Anthropic (opcional)
ANTHROPIC_API_KEY=sk-ant-...
```

Obtenha credenciais em:
- **Cloudflare**: https://dash.cloudflare.com
- **OpenAI**: https://platform.openai.com/api-keys
- **Gemini**: https://aistudio.google.com/app/apikey
- **Anthropic**: https://console.anthropic.com

### Iniciar Servidor

```bash
npm run dev
```

Servidor rodará em `http://localhost:3000`

## 📡 API

### Endpoint: POST /api/analyze

**Request:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "idade": 35,
      "renda_mensal": 5000,
      "patrimonio": 50000,
      "horizonte": "10 anos",
      "perfil_risco": "moderado"
    },
    "portfolio": {
      "acoes": 20000,
      "renda_fixa": 15000,
      "caixa": 15000,
      "imoveis": 100000
    }
  }'
```

**Response:**
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
      "recomendacoes": [
        {
          "ativo": "PETR4",
          "tipo": "compra|venda|troca",
          "justificativa": "..."
        }
      ]
    },
    "fundos": { ... },
    "previdencia": { ... },
    "poupanca": { ... }
  },
  "latency": 1234
}
```

## 🧪 Testes

### Teste de Conectividade (todos os provedores)
```bash
npx tsx test-providers.ts
```

### Teste Específico (Cloudflare)
```bash
npx tsx test-cloudflare.ts
```

## 📚 Documentação

- **[CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md)** - Guia de configuração do Cloudflare
- **[DIAGNOSTIC.md](./DIAGNOSTIC.md)** - Relatório técnico e troubleshooting
- **[server.ts](./server.ts)** - Implementação do servidor e cascade logic

## 🏗️ Estrutura do Projeto

```
├── server.ts              # Backend principal (Express)
├── test-cloudflare.ts    # Teste específico do Cloudflare
├── test-providers.ts     # Teste de todos os provedores
├── .env.example          # Exemplo de variáveis de ambiente
├── package.json          # Dependências
├── tsconfig.json         # Configuração TypeScript
├── CLOUDFLARE_SETUP.md   # Guia de setup
├── DIAGNOSTIC.md         # Relatório técnico
└── scenarios.json        # Regras do fallback interno
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor em desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview da build
npm run lint         # Type checking
npm run clean        # Remove diretório dist
```

## 🛡️ Segurança

- Não commite `.env` com credenciais reais
- Use `.env.example` como template
- Rotacione chaves API regularmente
- Valide inputs em produção

## 🐛 Troubleshooting

### Erro: "Cloudflare Account ID or API Token not configured"
→ Verifique se `.env` tem variáveis corretas

### Erro: "401 Unauthorized"
→ Token expirou ou é inválido. Gere um novo.

### Erro: "429 Too Many Requests"
→ Limite de taxa atingido. Aguarde ou escale plano.

Para mais detalhes, veja [DIAGNOSTIC.md](./DIAGNOSTIC.md)

## 📈 Status da Integração

- ✅ Cloudflare AI (Primeira prioridade)
- ✅ OpenAI integration
- ✅ Google Gemini integration
- ✅ Anthropic Claude integration
- ✅ Fallback interno com regras
- ✅ TypeScript + Express
- ✅ Testes diagnósticos

## 📝 Licença

Projeto privado Esquilo Invest

## 👤 Autor

**Luiz Giammattey** (serealdemanga)

---

**Last Updated:** 2026-04-18  
**Version:** 1.0.0
