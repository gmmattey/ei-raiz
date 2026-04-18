# PLANO DE REORGANIZAÇÃO DO REPOSITÓRIO

## Estrutura Atual → Nova Estrutura

```
ATUAL                               NOVO (PT-BR)
───────────────────────────────────────────────────

apps/web                    →       apresentacao/
apps/api                    →       servidores/porta-entrada/
servicos/*                  →       servidores/modulos-backend/*
pacotes/*                   →       bibliotecas/*
banco/                      →       infra/banco/
docs/                       →       documentacao/
assets/                     →       midia/
scripts/                    →       utilitarios/
dev/                        →       utilitarios/dev/
tests/                      →       testes/
```

## Detalhamento

### 1. APRESENTACAO/ (antigamente apps/web/)
- src/
  - features/ (funcionalidades por domínio)
  - components/ (componentes reutilizáveis)
  - hooks/ (custom hooks)
  - context/ (contexto React)
  - utils/ (utilitários)
  - types/ (tipos TypeScript)
  - styles/ (estilos)
  - services/ (chamadas API)
  - app/ (layout, routing, providers)
- public/
- wrangler.toml (Cloudflare Pages)
- package.json

### 2. SERVIDORES/
├── porta-entrada/ (antigamente apps/api/ - API Gateway)
│   - src/gateway, handlers, middleware, router, etc
│   - wrangler.toml
│   - package.json
│
└── modulos-backend/
    ├── autenticacao/
    ├── carteira/
    ├── decisoes/
    ├── historico/
    ├── importacao/
    ├── insights/
    └── perfil/
    (Cada um com src/, testes/, package.json)

### 3. BIBLIOTECAS/ (antigamente pacotes/)
├── contratos/ (tipos compartilhados)
├── utilitarios/ (funções reutilizáveis)
└── validacao/ (schemas de validação)

### 4. INFRA/
├── banco/
│   ├── migrations/
│   ├── seed/
│   └── wrangler.toml (D1)
├── docker-compose.yml
└── .env.example

### 5. TESTES/
├── e2e/
├── integracao/
└── massa-dados/

### 6. DOCUMENTACAO/
├── arquitetura/
├── marca/
├── produto/
├── mobile-wireframes.md
├── README.md
└── ... (demais docs)

### 7. MIDIA/
├── marca/
├── fontes/
├── icones/
├── logo/
└── imagens/

### 8. UTILITARIOS/
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   └── ...
└── dev/ (config de desenvolvimento)

## Arquivos na Raiz
- package.json (monorepo - atualizar workspaces)
- tsconfig.json
- .gitignore
- README.md
- ENVIRONMENT.md
- SETUP.md
- Makefile
- docker-compose.yml (mover para infra/)
- iniciar-ambiente-teste.bat (mover para utilitarios/)

## Lixo a Descartar
- .continue/
- .wrangler/
- dashboard.txt
- esquilo-invest-wallpaper.png (opcional, pode manter se for importante)
- tmp-*.png (screenshots temporários)
- RULES_ENGINE_* (parece obsoleto)
- AMBIENTE_LOCAL.md (consolidar em docs/SETUP.md)

## Execução Passo a Passo
1. ✅ Criar nova estrutura de diretórios
2. ✅ Copiar arquivos mantendo estrutura interna
3. ✅ Atualizar package.json (workspaces)
4. ✅ Atualizar imports em apps/web
5. ✅ Atualizar imports em apps/api
6. ✅ Validar imports nos servicos/
7. ✅ Validar imports nos pacotes/
8. ✅ Testar build
9. ✅ Remover pastas antigas
10. ✅ Commit único "refactor: reorganizar estrutura do repositório"
