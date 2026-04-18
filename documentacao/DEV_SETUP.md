# 🚀 Guia Rápido - Ambiente Local Esquilo Invest

## Problema Resolvido
Você não precisa mais abrir múltiplos terminais ou lidar com auto-refresh. Use os scripts prontos abaixo.

---

## ⚡ Iniciar Tudo com Um Clique (Windows)

### Opção 1: Script em Batch (Simples)
Abra a pasta do projeto e **clique duas vezes** em:
```
start-dev.bat
```

Pronto! Dois terminais abrem automaticamente:
- **Terminal 1**: API rodando em http://localhost:8787
- **Terminal 2**: Frontend rodando em http://localhost:3001

### Opção 2: PowerShell (Mais Robusto)
Abra o PowerShell na pasta do projeto e execute:
```powershell
.\start-dev.ps1
```

Para parar tudo:
```powershell
.\start-dev.ps1 -StopAll
```

---

## 🐧 Linux / Mac

Execute na raiz do projeto:
```bash
./start-dev.sh
```

Para parar: `Ctrl+C`

---

## 🧪 Testar a Integração Vera

### 1. Acesse o Frontend
Abra no navegador: **http://localhost:3001**

### 2. Faça Login
```
Email: teste.vera@example.com
Senha: Teste@1234
```

### 3. Vá para Insights
Clique em "Insights" no menu. O **VeraCard** aparece no topo com a avaliação financeira.

### 4. Teste o CTA
Clique no botão "Ver Plano de Reserva" para confirmar que tudo está funcionando.

---

## 🔧 Troubleshooting

### Porta 3001 ou 8787 já em uso?
Se receber erro de porta ocupada:

**Windows:**
```cmd
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:3001 | xargs kill -9
```

### Frontend branco / auto-refresh?
1. Limpe cache do navegador: `Ctrl+Shift+Del`
2. Force reload: `Ctrl+Shift+R`
3. Se persistir, delete `apps/web/node_modules/.vite` e reinicie

### API retorna erro 401?
Faça login novamente. Token pode ter expirado.

---

## 📊 Verificar Status

### Verificar se tudo está rodando:
```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :8787

# Linux/Mac
lsof -i :3001
lsof -i :8787
```

---

## 🧠 Como Funciona

1. **start-dev.bat** (Windows)
   - Verifica se Node.js está instalado
   - Inicia API em `http://localhost:8787`
   - Aguarda 3 segundos
   - Inicia Frontend em `http://localhost:3001`
   - Abre em terminais separados para debug fácil

2. **start-dev.ps1** (PowerShell)
   - Mesmo que .bat, mas mais robusto
   - Suporta `-NoInstall` (pula npm install)
   - Suporta `-StopAll` (encerra todos os processos)

3. **start-dev.sh** (Linux/Mac)
   - Equivalente bash com trap cleanup
   - `Ctrl+C` para parar tudo

---

## 📝 Credenciais de Teste

**Usuário:** teste.vera@example.com  
**Senha:** Teste@1234

Ou crie um novo usuário diretamente no frontend.

---

## ✅ Checklist de Integração Vera

- [ ] Frontend em http://localhost:3001
- [ ] API em http://localhost:8787
- [ ] Login com teste.vera@example.com
- [ ] Ir para Insights
- [ ] VeraCard aparece com avaliação
- [ ] CTA clicável
- [ ] Sem erros no console (F12)

---

## 🆘 Contato / Dúvidas

Se algo der errado, verifique:
1. Node.js v18+ instalado: `node --version`
2. npm v9+ instalado: `npm --version`
3. Portas 3001 e 8787 livres
4. Console do navegador (F12) para erros

Após resolver, execute novamente:
```
start-dev.bat    (Windows)
./start-dev.ps1  (PowerShell)
./start-dev.sh   (Linux/Mac)
```

---

**Última atualização:** 2026-04-13
