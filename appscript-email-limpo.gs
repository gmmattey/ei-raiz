// EMAIL TEMPLATE SIMPLIFICADO E FUNCIONAL

function emailTemplate(email, token) {
  const urlReset = 'https://esquilo.wallet/reset-password?token=' + token;

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
    .header { background: linear-gradient(135deg, #0B1218 0%, #1a2329 100%); padding: 40px 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 1px; }
    .logo-esquilo { color: white; display: inline; }
    .logo-wallet { color: #f56a2a; display: inline; }
    .content { padding: 40px 30px; }
    .title { font-size: 24px; font-weight: bold; color: #0b1218; margin: 0 0 16px 0; }
    .text { font-size: 16px; line-height: 1.6; color: #0b1218; margin: 0 0 24px 0; }
    .step { display: flex; margin: 0 0 20px 0; align-items: flex-start; }
    .step-num { background: #f56a2a; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; margin-right: 16px; flex-shrink: 0; }
    .step-text h3 { font-size: 16px; font-weight: bold; color: #0b1218; margin: 0 0 4px 0; }
    .step-text p { font-size: 14px; color: #0b1218; opacity: 0.7; margin: 0; }
    .button { display: inline-block; background: #f56a2a; color: white; padding: 16px 48px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; margin: 24px 0; }
    .button-link { text-align: center; }
    .help-box { background: #f5f0eb; padding: 20px; border-radius: 10px; border-left: 4px solid #f56a2a; margin: 24px 0; }
    .help-title { font-weight: bold; color: #0b1218; margin: 0 0 12px 0; }
    .help-list { font-size: 14px; color: #0b1218; margin: 0; padding-left: 20px; }
    .help-list li { margin-bottom: 8px; }
    .help-list a { color: #f56a2a; text-decoration: none; font-weight: bold; }
    .footer { padding: 20px 30px; background: #f5f0eb; border-top: 1px solid #efe7dc; text-align: center; font-size: 12px; color: #0b1218; opacity: 0.7; }
    .footer a { color: #f56a2a; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">

      <!-- HEADER -->
      <div class="header">
        <h2 class="logo"><span class="logo-esquilo">Esquilo</span><span class="logo-wallet">wallet</span></h2>
        <p style="color: #f56a2a; font-size: 18px; margin: 16px 0 0 0; font-weight: bold;">Vamos resetar sua senha!</p>
      </div>

      <!-- CONTEUDO -->
      <div class="content">
        <h1 class="title">Olá!</h1>
        <p class="text">Recebemos uma solicitação para redefinir a senha da sua conta. Nao se preocupe, vamos ajudar você em 3 passos simples.</p>

        <!-- PASSOS -->
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">
            <h3>Clique no botao abaixo</h3>
            <p>Voce sera levado para a pagina de redefinicao</p>
          </div>
        </div>

        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">
            <h3>Digite sua nova senha</h3>
            <p>Escolha algo seguro, como sua senha de banco</p>
          </div>
        </div>

        <div class="step">
          <div class="step-num">OK</div>
          <div class="step-text">
            <h3>Pronto!</h3>
            <p>Faca login com sua nova senha</p>
          </div>
        </div>

        <!-- BOTAO -->
        <div class="button-link">
          <a href="${urlReset}" class="button">Resetar Minha Senha</a>
        </div>

        <!-- CAIXA DE AJUDA -->
        <div class="help-box">
          <p class="help-title">Duvidas?</p>
          <ul class="help-list">
            <li>O link expira em 24 horas</li>
            <li>Se nao pediu, ignore este email</li>
            <li><a href="https://esquilo.wallet/suporte">Fale com nosso suporte</a></li>
          </ul>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <p style="margin: 0 0 8px 0;">© 2026 Esquilo Wallet. Todos os direitos reservados.</p>
        <p style="margin: 0;">
          <a href="https://esquilo.wallet/privacidade">Politica de Privacidade</a> |
          <a href="https://esquilo.wallet/termos">Termos de Uso</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  };
}

function enviarRecuperacao(email) {
  try {
    // Gera um token aleatorio
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const emailObj = emailTemplate(email, token);

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

function testar() {
  const resultado = enviarRecuperacao('seu-email@gmail.com');
  console.log(JSON.stringify(resultado, null, 2));
}
