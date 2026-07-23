# Vera Insights

Plataforma de inteligência financeira que combina regras determinísticas, análise de perfil, diagnóstico de risco e narrativas geradas por IA.

## Objetivo

Avaliar a saúde financeira do usuário, identificar problemas prioritários e apresentar recomendações práticas sem depender exclusivamente de modelos generativos.

## Capacidades principais

- Classificação do estágio financeiro
- Cálculo de pressão de dívida e liquidez
- Score simplificado de saúde financeira
- Identificação de problemas e oportunidades
- Geração de dados para dashboard
- Integração opcional com Claude, OpenAI, Gemini e Cloudflare Workers AI
- Fallback baseado em regras quando nenhum provedor de IA está disponível

## Stack

- React 19
- TypeScript
- Vite
- Express e Hono
- Tailwind CSS
- Cloudflare Workers e Wrangler
- Integrações com múltiplos provedores de IA

## Como executar

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

O servidor de desenvolvimento utiliza `server.ts`. As chaves de IA são opcionais para os fluxos baseados apenas em regras.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run deploy:worker
```

## Estrutura relevante

```text
src/lib/esquilo/       Motor principal de decisão
src/lib/vera/          Cálculos, recomendações e narrativas
src/worker/            Worker para Cloudflare
server.ts              API local em Express
VERA_STATUS.md         Inventário detalhado do estado do projeto
```

## Segurança e limites

- Chaves devem permanecer em variáveis de ambiente.
- Recomendações financeiras devem ser tratadas como apoio informativo, não como ordem de investimento.
- Afirmações de segurança, criptografia ou prontidão para produção precisam ser verificadas no código e na infraestrutura antes de publicação.

## Status

Protótipo funcional em evolução. Consulte `VERA_STATUS.md` para o inventário técnico detalhado, mas valide qualquer informação antiga diretamente no código.