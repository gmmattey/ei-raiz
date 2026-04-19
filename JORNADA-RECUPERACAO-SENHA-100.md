# Jornada de Recuperação de Senha — 100% Segura e com Ótima UX

## 📋 Arquitetura da Segurança

### Fluxo Seguro (Sem token na URL)

```
Usuário → "Esqueci minha senha" → Email → Token copiado do email
                                      ↓
                            Clica link (sem token na URL)
                                      ↓
                            Frontend abre recuperação
                                      ↓
                            Cola token manualmente
                                      ↓
                            Define nova senha
                                      ↓
                            Sucesso! Volta pro login
```

### Por que é seguro?

✅ **Token nunca fica na URL**
- Não aparece no histórico do navegador
- Não fica visível em screenshots/compartilhamento de tela
- Não é exposto em referrer headers
- Não é armazenado em caches de proxy

✅ **Token fornecido via email**
- Está em local controlado (caixa de entrada do usuário)
- Requer acesso ao email do usuário
- Token é válido por 24h e depois expira

✅ **Validações fortes**
- Campo de token exige mínimo de 32 caracteres
- Senha segue regex: 8+ chars, maiúscula, minúscula, número, símbolo
- Feedback claro sobre erros

---

## 🧪 Como Testar a Jornada Completa

### Pré-requisitos
- ✅ Backend deployado em production
- ✅ GoogleAppsScript Web App ativo
- ✅ Frontend com código atualizado
- ✅ D1 com usuário de teste

### Teste 1: Solicitar Recuperação por Email

**Passos:**
1. Abra `https://esquilo.wallet`
2. Clique em "Entrar"
3. No modal de login, clique em "Esqueci minha senha"
4. Informe um email válido (seu email de teste)
5. Clique em "Enviar código de recuperação"

**Verificar:**
- ✅ Mensagem: "Solicitação enviada para `seu-email@...`"
- ✅ Email recebido em ~30 segundos
- ✅ Email vem do GoogleAppsScript
- ✅ Template está limpo e bem formatado

---

### Teste 2: Analisar Email Recebido

**O que procurar no email:**

```
┌─────────────────────────────────────────┐
│         Esquilo Wallet                  │
├─────────────────────────────────────────┤
│ Redefinir sua senha                     │
│                                         │
│ [Abrir recuperação de senha] ← clicável │
│                                         │
│ Como proceder:                          │
│ 1. Clique no botão acima                │
│ 2. Copie o código abaixo                │
│ 3. Cole no formulário e defina senha    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Seu código de recuperação (24h)      │ │
│ │ ABC123XYZ...XXXXX                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Se o botão não funcionar:               │
│ https://esquilo.wallet/...email=...     │ │
└─────────────────────────────────────────┘
```

**Verificar:**
- ✅ Botão "Abrir recuperação de senha" é clicável
- ✅ URL do botão NÃO contém token: `?abrir=login&step=forgotPassword&email=...` (SEM `&token=`)
- ✅ Token destacado em caixa cinza/laranja
- ✅ Instruções claras em 3 passos

---

### Teste 3: Clicar no Link do Email

**Passos:**
1. Clique no botão "Abrir recuperação de senha"
2. Ou copie/cole a URL `https://esquilo.wallet/?abrir=login&step=forgotPassword&email=seu@email.com`

**Verificar:**
- ✅ Modal de login abre automaticamente
- ✅ Está na aba "Recuperar Senha"
- ✅ Email está preenchido corretamente
- ✅ Campo de "Cole o código do email" está vazio
- ✅ Nenhum token foi auto-preenchido

---

### Teste 4: Colar o Código e Redefinir Senha

**Passos:**
1. Volte ao email e **copie** o código de recuperação
2. No formulário, **cole** no campo "Cole o código do email"
3. Informe uma nova senha forte (ex: `NovaSenha@123`)
4. Clique em "Redefinir senha"

**Validações esperadas:**
- ❌ Se código tiver < 32 caracteres: "Código incompleto. Verifique..."
- ❌ Se senha NÃO tiver maiúscula: "Senha deve ter 8+ caracteres com..."
- ❌ Se código estiver errado: "Código incorreto. Verifique..."
- ❌ Se código expirou (>24h): "Código expirado. Solicite uma nova..."

**Sucesso:**
- ✅ Mensagem verde: "✓ Senha redefinida com sucesso!"
- ✅ Após 2 segundos, volta automaticamente pro login

---

### Teste 5: Fazer Login com Nova Senha

**Passos:**
1. No modal de login aberto, informe:
   - Email: seu@email.com
   - Senha: `NovaSenha@123`
2. Clique em "Entrar"

**Verificar:**
- ✅ Login bem-sucedido
- ✅ Redireciona para `/home`
- ✅ Sessão está ativa

---

### Teste 6: Segurança da URL

**Verifique que o token NUNCA aparece na URL:**

1. Após clicar no link do email, abra DevTools (F12)
2. Vá para "Network" ou "Console"
3. Veja a URL: deve ser apenas `?abrir=login&step=forgotPassword&email=seu@email.com`
4. **Confirme**: Não há `&token=` na URL

**Histórico do navegador:**
1. Abra Ctrl+H (histórico)
2. Procure por "esquilo.wallet"
3. Verifique que nenhuma URL contém token

---

### Teste 7: Fallback (Se GoogleAppsScript falhar)

Se o email não chegar:
1. Verifique que GoogleAppsScript está ativo: `https://script.google.com/macros/s/AKfycbzwrYNylQiyaWuC8gXsUDAYOC1QROvfWQ9DCiZ32GfNba9Zsxnj4_tUmREmXtS2Xt75/exec`
2. Aguarde 1 minuto (GoogleAppsScript pode ser lento)
3. Verifique spam/filtros
4. Sistema fará fallback para Resend automaticamente

---

## 🔐 Checklist Final de Segurança

- [ ] Token nunca aparece na URL
- [ ] Email requer copiar/colar do código
- [ ] Validação de comprimento de código (32+ chars)
- [ ] Validação de senha forte (regex)
- [ ] Mensagens de erro claras
- [ ] Token expira após 24h
- [ ] Feedback visual de sucesso
- [ ] Volta pro login após sucesso

---

## 📧 Contato

Se houver problemas:
1. Verifique se GoogleAppsScript Web App está respondendo
2. Confira wrangler.toml tem `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` correto
3. Teste a senha novo usando: `/api/auth/redefinir-senha`
