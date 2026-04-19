// ======= ESQUILO WALLET - PASSWORD RESET COMPLETO =======
// Copia e cola TUDO isso no Apps Script

// ===== CONFIGURAÇÕES =====
const URL_APP = 'https://esquilo.wallet';
const EMAIL_EMPRESA = 'noreply@esquilo.wallet';

// ===== TEMPLATE DE EMAIL =====

function emailTemplate1(email, token) {
  const urlReset = `${URL_APP}/?abrir=login&step=forgotPassword&email=${encodeURIComponent(email)}`;

  return {
    to: email,
    subject: 'Redefinir sua senha - Esquilo Wallet',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f0eb; }
    .container { max-width: 600px; margin: 20px auto; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { text-align: center; padding: 30px; border-bottom: 1px solid #efe7dc; }
    .logo { font-size: 24px; font-weight: bold; margin: 0; }
    .logo-esquilo { color: #0b1218; }
    .logo-wallet { color: #f56a2a; }
    .content { padding: 40px 30px; }
    .title { font-size: 28px; font-weight: bold; color: #0b1218; margin: 0 0 16px 0; }
    .text { font-size: 16px; line-height: 1.6; color: #0b1218; margin: 0 0 24px 0; }
    .button { display: inline-block; background: white; color: #f56a2a; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; margin: 24px 0; border: 2px solid #f56a2a; }
    .button-link { text-align: center; }
    .token-box { background: #f5f0eb; border: 2px solid #f56a2a; border-radius: 8px; padding: 16px; margin: 24px 0; }
    .token-label { font-size: 12px; font-weight: bold; color: #f56a2a; text-transform: uppercase; margin-bottom: 8px; }
    .token-value { font-family: monospace; font-size: 16px; color: #0b1218; word-break: break-all; letter-spacing: 1px; font-weight: bold; }
    .instructions { font-size: 14px; color: #0b1218; opacity: 0.7; margin: 16px 0 0 0; }
    .step { margin: 12px 0; }
    .footer { padding: 30px; border-top: 1px solid #efe7dc; text-align: center; font-size: 12px; color: #0b1218; opacity: 0.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h2 class="logo"><span class="logo-esquilo">Esquilo</span><span class="logo-wallet">wallet</span></h2>
      </div>
      <div class="content">
        <h1 class="title">Redefinir sua senha</h1>
        <p class="text">Recebemos uma solicitacao para redefinir a senha da sua conta Esquilo Wallet.</p>

        <div class="instructions">
          <p style="font-weight: bold; color: #0b1218; margin: 0 0 12px 0;">Como proceder:</p>
          <div class="step"><strong>1.</strong> Acesse esquilo.wallet no seu navegador;</div>
          <div class="step"><strong>2.</strong> Clique em "Esqueci minha senha";</div>
          <div class="step"><strong>3.</strong> Copie o codigo abaixo e cole no formulario;</div>
          <div class="step"><strong>4.</strong> Defina sua nova senha.</div>
        </div>

        <div class="token-box">
          <div class="token-label">Seu PIN de recuperacao (valido por 24h)</div>
          <div class="token-value" style="font-size: 32px; letter-spacing: 8px; text-align: center;">${token}</div>
        </div>

        <p class="instructions">
          Se nao solicitou esta recuperacao, ignore este email e nao compartilhe o codigo.
        </p>
      </div>
      <div class="footer">
        <p>Este codigo eh valido por 24 horas. Se nao solicitou esta recuperacao, ignore este email e nao compartilhe o codigo.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  };
}

// ===== FUNÇÕES DE ENVIO =====

function gerarToken() {
  // Gera PIN de 6 dígitos (000000 a 999999)
  let pin = '';
  for (let i = 0; i < 6; i++) {
    pin += Math.floor(Math.random() * 10);
  }
  return pin;
}

function enviarRecuperacao(email) {
  try {
    const token = gerarToken();
    const emailObj = emailTemplate1(email, token);

    GmailApp.sendEmail(
      emailObj.to,
      emailObj.subject,
      '',
      { htmlBody: emailObj.htmlBody }
    );

    return { sucesso: true, email: email, token: token };
  } catch (erro) {
    return { sucesso: false, erro: erro.toString() };
  }
}

// ===== WEBHOOK (recebe POST do D1) =====

function doPost(e) {
  try {
    // Parse do JSON que vem do D1
    const data = JSON.parse(e.postData.contents);

    // Validar campos obrigatórios
    if (!data.email) {
      return ContentService.createTextOutput(
        JSON.stringify({ sucesso: false, erro: 'email obrigatorio' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Enviar email com o token que veio do D1
    const emailObj = emailTemplate1(data.email, data.token);

    GmailApp.sendEmail(
      emailObj.to,
      emailObj.subject,
      '',
      { htmlBody: emailObj.htmlBody }
    );

    // Log para debug
    Logger.log(`[doPost] Email enviado para: ${data.email}`);

    // Retorna sucesso
    return ContentService.createTextOutput(
      JSON.stringify({
        sucesso: true,
        mensagem: 'Email enviado com sucesso',
        email: data.email
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (erro) {
    Logger.log(`[doPost] Erro: ${erro.toString()}`);

    return ContentService.createTextOutput(
      JSON.stringify({
        sucesso: false,
        erro: erro.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== TESTE LOCAL =====

function testar() {
  const resultado = enviarRecuperacao('seu-email@gmail.com');
  console.log(JSON.stringify(resultado, null, 2));
}

// ===== TESTE DO WEBHOOK =====

function testarWebhook() {
  // Simula uma chamada POST do D1
  const dadosMock = {
    email: 'seu-email@gmail.com',
    token: 'token-teste-123456789',
    resetUrl: 'https://esquilo.wallet/reset-password?token=token-teste-123456789',
    expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  const e = {
    postData: {
      contents: JSON.stringify(dadosMock)
    }
  };

  const resposta = doPost(e);
  Logger.log('Resposta do webhook:', resposta.getContent());
}
