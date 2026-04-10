# 🎯 Ambiente Local - Esquilo Invest

## ✨ O que foi criado?

Um ambiente de desenvolvimento **robusto, intuitivo e sem reconfiguração constante** para a aplicação Esquilo Invest.

---

## 📦 Arquivos Criados

### 1. **Configuração Vite** (`apps/web/vite.config.ts`)
```typescript
✅ Porta fixa: 3000
✅ Host: 0.0.0.0 (acessível de qualquer rede)
✅ Hot Module Replacement (HMR) configurado
✅ Build otimizado para produção
```

### 2. **Variáveis de Ambiente** (`apps/web/.env.local`)
```env
✅ Configurações locais pré-definidas
✅ API URL: http://localhost:3001
✅ Mock data habilitado
✅ Dev tools ativas
```

### 3. **Docker** (`docker-compose.yml` + `apps/web/Dockerfile`)
```
✅ Containerização da aplicação
✅ Build automático
✅ Health checks inclusos
✅ Pronto para produção
```

### 4. **Scripts de Inicialização**

| Arquivo | Sistema | Comando | Função |
|---------|---------|---------|--------|
| `start-dev.bat` | Windows | Duplo clique | Dev com HMR |
| `start-dev.sh` | Mac/Linux | `./start-dev.sh` | Dev com HMR |
| `start-docker.bat` | Windows | Duplo clique | Docker |
| `start-docker.sh` | Mac/Linux | `./start-docker.sh` | Docker |

### 5. **Makefile** (`Makefile`)
```bash
make dev            # Desenvolvimento
make docker         # Docker
make build          # Build produção
make clean          # Limpar
make help           # Ver todos
```

### 6. **Documentação**

| Arquivo | Propósito |
|---------|-----------|
| `SETUP_RAPIDO.md` | ⚡ Setup em 2 minutos |
| `AMBIENTE_LOCAL.md` | 📖 Guia completo (15 min de leitura) |
| `README_AMBIENTE.md` | 📋 Este arquivo |

### 7. **Git Ignore** (`.gitignore`)
```
✅ node_modules
✅ dist/
✅ .env.local
✅ Docker files
```

---

## 🚀 Como Usar

### Desenvolvimento (Recomendado)

**Windows:**
```bash
Double-click: start-dev.bat
```

**Mac/Linux:**
```bash
./start-dev.sh
```

**Manual:**
```bash
cd apps/web && npm install && npm run dev
```

### Produção (Docker)

**Windows:**
```bash
Double-click: start-docker.bat
```

**Mac/Linux:**
```bash
./start-docker.sh
```

**Manual:**
```bash
docker-compose up --build
```

### Via Makefile

```bash
make dev            # Inicia dev
make docker         # Inicia Docker
make build          # Build produção
make clean          # Remove temporários
make help           # Mostra todos os comandos
```

---

## 🌐 URLs

| URL | Acesso | Quando |
|-----|--------|--------|
| `http://localhost:3000` | Local (você) | Sempre |
| `http://192.168.1.X:3000` | Outro PC na rede | Depois de descobrir seu IP |
| `http://0.0.0.0:3000` | Qualquer rede | Se editar vite.config.ts |

---

## ✅ Características

- ✅ **Porta Fixa**: Sempre 3000 (ou próxima disponível se ocupada)
- ✅ **Sem Reconfiguração**: Basta clicar no script e pronto
- ✅ **Hot Reload**: Mudanças no código aparecem em tempo real
- ✅ **Multi-OS**: Windows, Mac e Linux com mesmo script
- ✅ **Docker Ready**: Pronto para containerização
- ✅ **Documentação**: 2 guias completos
- ✅ **Health Checks**: Verifica se aplicação está rodando
- ✅ **CORS Habilitado**: Testa com múltiplos origins

---

## 📊 Estrutura Final

```
Esquilo Invest/
│
├── 🔵 SETUP_RAPIDO.md          ← Leia PRIMEIRO (2 min)
├── 🔵 AMBIENTE_LOCAL.md        ← Leia se tiver dúvidas
├── 🔵 README_AMBIENTE.md       ← Este arquivo
│
├── 🚀 start-dev.bat             ← Click para Windows (Dev)
├── 🚀 start-dev.sh              ← ./start-dev.sh em Mac/Linux (Dev)
├── 🚀 start-docker.bat          ← Click para Windows (Docker)
├── 🚀 start-docker.sh           ← ./start-docker.sh em Mac/Linux (Docker)
├── 📋 Makefile                  ← make dev / make docker
│
├── 🐳 docker-compose.yml        ← Orquestração Docker
│
├── apps/web/
│   ├── src/                     ← Código React
│   ├── public/                  ← Assets (logos, ícones)
│   ├── 📄 vite.config.ts        ← Porta 3000 fixa
│   ├── 📄 .env.local            ← Variáveis locais
│   ├── 📄 Dockerfile            ← Build Docker
│   ├── 📄 package.json
│   └── 📄 tsconfig.json
│
├── 🔒 .gitignore                ← Ignora node_modules, dist, .env
└── ...outros arquivos
```

---

## 🎯 Fluxo Típico

### Dia 1: Setup
```
1. Clonar/extrair projeto
2. Executar start-dev.bat (ou .sh)
3. Navegador abre http://localhost:3000 automaticamente
4. ✅ Pronto!
```

### Dia 2+: Desenvolvimento
```
1. Abrir terminal na pasta raiz
2. ./start-dev.sh (Mac/Linux) ou start-dev.bat (Windows)
3. Fazer mudanças no código
4. Mudanças aparecem automaticamente no navegador (HMR)
5. Não precisa recarregar, não precisa reconfigurar rotas
6. Commit & Push quando pronto
```

---

## 🔄 Comparação: Antes vs Depois

### ❌ Antes (Sem Setup)
```
Usar aplicação:
1. Configurar variáveis de ambiente manualmente
2. Verificar qual porta está livre
3. npm install manualmente
4. npm run dev manualmente
5. Reconfigurar se porta mudar
6. Problema? Limpar cache, reinstalar tudo
```

### ✅ Depois (Com Setup)
```
Usar aplicação:
1. Duplo clique em start-dev.bat
2. Pronto! http://localhost:3000 abre automaticamente
```

---

## 🆘 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Porta 3000 ocupada | Script tenta próxima porta automaticamente |
| "Node not found" | Instale Node.js em https://nodejs.org |
| Docker não inicia | Abra Docker Desktop e tente novamente |
| Página em branco | Hard refresh: Ctrl+Shift+R |
| Mudanças não aparecem | Abra DevTools (F12) e veja console |

---

## 📞 Próximos Passos

1. **Leia:** `SETUP_RAPIDO.md` (2 minutos)
2. **Execute:** Um dos scripts de inicialização
3. **Acesse:** http://localhost:3000
4. **Desenvolva:** Faça mudanças no código em `apps/web/src/`
5. **Commit:** `git add . && git commit -m "Descri​ção"`

---

## 🎓 Comandos Úteis

```bash
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f esquilo-web

# Parar tudo
docker-compose down

# Limpar tudo (espaço em disco)
docker-compose down -v && rm -rf apps/web/node_modules

# Verificar porta em uso
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -i :3000
```

---

## 📝 Versões

| Componente | Versão |
|-----------|--------|
| Node.js | 18+ |
| React | 18.3.1 |
| Vite | 5.4.1 |
| TypeScript | 5.5.3 |
| Tailwind CSS | 3.4.13 |
| Docker | 20.10+ |

---

## ✨ Resumo Final

**Você agora tem:**
- ✅ URL fixa (`http://localhost:3000`)
- ✅ Sem reconfiguração
- ✅ Scripts prontos (Windows, Mac, Linux)
- ✅ Docker para produção
- ✅ Documentação completa
- ✅ Hot reload habilitado
- ✅ Health checks automáticos

**Pronto para desenvolver com produtividade máxima! 🚀**

---

**Documento criado:** 2026-04-07  
**Versão:** 1.0  
**Status:** Pronto para usar ✅
