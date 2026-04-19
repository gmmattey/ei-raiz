# Setup: GoogleAppsScript + D1 para Recuperação de Senha

## 1️⃣ Configurar GoogleAppsScript

### No Apps Script:
1. Abra https://script.google.com
2. Crie novo projeto chamado "Esquilo Wallet - Password Reset"
3. Cole o código de `appscript-template1.gs`
4. **Salve** (Ctrl+S)

### Implantar como Web App:
1. Clique em **Implantar** → **Nova implantação**
2. Tipo: **Aplicativo web**
3. Executar como: **seu-email@gmail.com**
4. Quem tem acesso: **Qualquer pessoa** (ou **Qualquer um***)
5. Clique em **Implantar**
6. Copie a **URL de implantação** (vai ser algo como `https://script.googleapis.com/macros/s/{SCRIPT_ID}/usercallable`)
7. Guarde para o passo 3

---

## 2️⃣ Configurar Webhook no Apps Script

Crie uma função que recebe POST com os dados:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const resultado = enviarRecuperacao(data.email);
    
    return ContentService.createTextOutput(
      JSON.stringify({ sucesso: true, token: resultado.token })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (erro) {
    return ContentService.createTextOutput(
      JSON.stringify({ sucesso: false, erro: erro.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

**Cole isso no App Script junto com o código anterior.**

---

## 3️⃣ Configurar Variáveis de Ambiente (wrangler.toml)

```toml
[env.production.vars]
GOOGLE_APPS_SCRIPT_WEBHOOK_URL = "https://script.googleapis.com/macros/s/{SCRIPT_ID}/usercallable"
WEB_BASE_URL = "https://esquilo.wallet"
```

Substitua `{SCRIPT_ID}` pelo ID da URL de implantação do passo anterior.

---

## 4️⃣ Deploy no Cloudflare Workers

```bash
cd servidores/porta-entrada
wrangler deploy --env production
```

---

## 5️⃣ Testar

Faça uma requisição POST:

```bash
curl -X POST https://seu-api.com/auth/recuperar-senha \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@email.com"}'
```

O email sairá com o template bonito via GoogleAppsScript!

---

## ⚙️ Fallback

Se GoogleAppsScript falhar, automaticamente volta para **Resend** (se configurado).

Prioridade:
1. ✅ GoogleAppsScript (nosso template)
2. ✅ Resend (seu provider atual)
3. ✅ Webhook genérico
4. ✅ Log (modo dev)

---

## 🔗 Fluxo Completo

```
Usuário clica "Esqueci senha"
    ↓
Backend cria token no D1 (24h expiração)
    ↓
Chama notificarRecuperacaoSenha()
    ↓
Tenta enviar via GoogleAppsScript
    ↓
Email chega com template Template 1 (Clean)
```

---

## Variáveis Obrigatórias

- `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` — URL do webhook do GoogleAppsScript
- `WEB_BASE_URL` — URL da sua app web (ex: https://esquilo.wallet)
- `DB` — Conexão D1 (já configurada)

---

## Dúvidas Comuns

**P: E se o GoogleAppsScript cair?**  
R: Volta automaticamente para Resend. Sem problema.

**P: Preciso remover o Resend?**  
R: Não, mantém como fallback.

**P: Quanto custa?**  
R: GoogleAppsScript é gratuito. Resend tem limite grátis.
