# 🚀 Esquilo Invest - Guia do Ambiente Local

Bem-vindo! Este documento explica como rodar a aplicação Esquilo Invest em seu computador com uma configuração simples, sem reconfiguração constante de rotas.

---

## 📋 Pré-requisitos

### Opção 1: Desenvolvimento Direto (Recomendado para Dev)
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (vem com Node.js)
- ~500MB de espaço em disco

### Opção 2: Docker (Recomendado para Produção Local)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- ~2GB de espaço em disco

---

## 🎯 Iniciação Rápida

### Windows - Modo Desenvolvimento

**Clique duplo em:** `start-dev.bat`

Ou via terminal:
```bash
.\start-dev.bat
```

Pronto! Acesse: **http://localhost:3000**

---

### macOS / Linux - Modo Desenvolvimento

**Primeiro, dê permissão ao script:**
```bash
chmod +x start-dev.sh
```

**Depois execute:**
```bash
./start-dev.sh
```

Pronto! Acesse: **http://localhost:3000**

---

### Docker (Qualquer SO)

**Windows - Clique duplo em:** `start-docker.bat`

**macOS/Linux:**
```bash
chmod +x start-docker.sh
./start-docker.sh
```

Acesse: **http://localhost:3000**

---

## 🔧 Configuração Manual

Se preferir não usar os scripts:

### 1. Instalar Dependências
```bash
cd apps/web
npm install
```

### 2. Iniciar Servidor (Dev)
```bash
npm run dev
```

### 3. Build para Produção
```bash
npm run build
npm run preview
```

---

## 📍 URLs Disponíveis

| URL | O que é | Quando usar |
|-----|---------|-----------|
| `http://localhost:3000` | App React (Dev) | Desenvolvimento com Hot Reload |
| `http://localhost:3000` | App React (Docker) | Produção local |
| `http://0.0.0.0:3000` | Acesso externo | Testar em outro dispositivo |

---

## 🌐 Acessar de Outro Computador na Rede

Se ambos estão na mesma rede WiFi/Ethernet:

1. **Descubra seu IP local:**

   **Windows:**
   ```bash
   ipconfig
   ```
   (Procure por "IPv4 Address" tipo `192.168.1.X`)

   **macOS/Linux:**
   ```bash
   ifconfig
   ```

2. **No outro computador, acesse:**
   ```
   http://SEU_IP_LOCAL:3000
   ```
   
   Exemplo: `http://192.168.1.50:3000`

---

## 📁 Estrutura de Arquivos

```
Esquilo Invest/
├── apps/web/                 # Aplicação React
│   ├── src/                 # Código fonte
│   ├── public/              # Assets (logos, ícones)
│   ├── Dockerfile           # Build para Docker
│   ├── package.json         # Dependências
│   ├── vite.config.ts       # Configuração Vite (PORTA FIXA: 3000)
│   └── .env.local           # Variáveis de ambiente locais
├── docker-compose.yml       # Orquestração Docker
├── start-dev.bat           # Script para Windows (Dev)
├── start-dev.sh            # Script para Mac/Linux (Dev)
├── start-docker.bat        # Script para Windows (Docker)
└── start-docker.sh         # Script para Mac/Linux (Docker)
```

---

## ⚙️ Variáveis de Ambiente

O arquivo `.env.local` contém:

```env
# Aplicação
VITE_APP_NAME=Esquilo Invest
VITE_API_URL=http://localhost:3001

# Features
VITE_ENABLE_MOCK_DATA=true          # Usar dados fake
VITE_ENABLE_DEV_TOOLS=true          # Ferramentas dev ativas
VITE_LOG_LEVEL=debug                # Logs detalhados

# Segurança
VITE_AUTH_ENABLED=true
VITE_SESSION_TIMEOUT=3600000        # 1 hora

# Analytics (desativado localmente)
VITE_ANALYTICS_ENABLED=false
```

### Customizar Variáveis

Edite `.env.local` e reinicie o servidor.

---

## 🐛 Solução de Problemas

### Porta 3000 já está em uso

**Opção 1: Encerrar processo**

Windows:
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

macOS/Linux:
```bash
lsof -i :3000
kill -9 <PID>
```

**Opção 2: Usar outra porta**

Edite `vite.config.ts` e mude:
```typescript
server: {
  port: 3001  // Mude aqui
}
```

---

### Node.js não encontrado

**Windows:**
1. Baixe em https://nodejs.org/
2. Execute o instalador
3. Reinicie o terminal

**macOS:**
```bash
brew install node
```

**Linux:**
```bash
sudo apt-get install nodejs npm
```

---

### Docker não inicia

1. **Verifique se Docker está rodando:**
   - Windows/Mac: Abra "Docker Desktop"
   - Linux: `sudo systemctl start docker`

2. **Limpe containers antigos:**
   ```bash
   docker-compose down -v
   docker system prune
   ```

3. **Rebuild:**
   ```bash
   docker-compose up --build
   ```

---

### Página em branco / CSS não carrega

Limpe o cache:
- **Windows/Mac:** `Ctrl/Cmd + Shift + Delete` → Limpar cache
- **Linux:** Limpe manualmente em `~/.cache/`

Ou reinicie com Ctrl+Shift+R (hard refresh)

---

## 📊 Monitoramento

### Ver logs em tempo real

**Desenvolvimento:**
```
Abra o console (F12) no navegador
```

**Docker:**
```bash
docker-compose logs -f esquilo-web
```

### Status da aplicação

**Desenvolvimento:**
```
Terminal mostra: "Local: http://localhost:3000"
```

**Docker:**
```bash
docker-compose ps
```

---

## 🔄 Fluxo de Desenvolvimento Típico

1. **Inicie o servidor:**
   ```bash
   ./start-dev.sh
   ```

2. **Faça mudanças no código** em `apps/web/src/`

3. **Veja as mudanças em tempo real** (Hot Module Replacement)
   - Não precisa recarregar manualmente
   - Não precisa reconfigurar rotas

4. **Abra DevTools** (F12) para ver logs e erros

5. **Commit quando pronto**
   ```bash
   git add .
   git commit -m "Descrição da mudança"
   ```

---

## 🚢 Build para Produção

### Localmente

```bash
cd apps/web
npm run build        # Cria dist/
npm run preview      # Testa build localmente (http://localhost:3000)
```

### Via Docker

```bash
docker-compose --file docker-compose.yml build
docker-compose up
```

---

## 🔐 Segurança Local

A aplicação roda em **localhost** por padrão (apenas seu computador).

Para acessar de outra máquina:
- Mude `host: 'localhost'` para `host: '0.0.0.0'` em `vite.config.ts`
- Reinicie o servidor
- Acesse via seu IP local

⚠️ **NUNCA exponha a porta 3000 para a internet** (use VPN ou firewall)

---

## 📝 Checklist de Setup

- [ ] Node.js v18+ instalado (`node --version`)
- [ ] Pasta `Esquilo Invest` clonada/extraída
- [ ] Terminal aberto na pasta raiz
- [ ] Executou `start-dev.sh` ou `start-dev.bat`
- [ ] Navegador abriu em `http://localhost:3000`
- [ ] Vê LandingPage com logo do Esquilo
- [ ] DevTools aberto (F12) sem erros

---

## 🆘 Precisa de Ajuda?

1. **Verificar se Node/Docker estão instalados:**
   ```bash
   node --version
   npm --version
   docker --version
   ```

2. **Limpar tudo e começar do zero:**
   ```bash
   rm -rf node_modules
   npm ci
   npm run dev
   ```

3. **Verificar porta:**
   ```bash
   netstat -ano | findstr :3000
   ```

4. **Ver logs de erro:**
   - Abra DevTools (F12)
   - Vá para "Console"
   - Procure por mensagens vermelhas

---

## 📞 Suporte

Arquivo de log: `~/.esquilo-invest/app.log`

Versão atual: **0.1.0**

Data: **2026-04-07**

---

**Pronto! Agora você consegue rodar a aplicação localmente sem reconfigurar nada. Boa sorte! 🚀**
