// ======= TEMPLATE 1: CLEAN E DIRETO =======

function emailTemplate1(email, token) {
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
    .header { text-align: center; padding: 30px; border-bottom: 1px solid #efe7dc; }
    .logo { font-size: 24px; font-weight: bold; margin: 0; }
    .logo-esquilo { color: #0b1218; }
    .logo-wallet { color: #f56a2a; }
    .content { padding: 40px 30px; }
    .title { font-size: 28px; font-weight: bold; color: #0b1218; margin: 0 0 16px 0; }
    .text { font-size: 16px; line-height: 1.6; color: #0b1218; margin: 0 0 24px 0; }
    .button { display: inline-block; background: white; color: #f56a2a; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; margin: 32px 0; border: 2px solid #f56a2a; }
    .button-link { text-align: center; }
    .link-copy { font-size: 14px; color: #0b1218; opacity: 0.7; margin: 24px 0 0 0; }
    .link-copy a { color: #f56a2a; word-break: break-all; }
    .footer { padding: 30px; border-top: 1px solid #efe7dc; text-align: center; font-size: 12px; color: #0b1218; opacity: 0.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">

      <!-- HEADER COM LOGO -->
      <div class="header">
        <h2 class="logo"><span class="logo-esquilo">Esquilo</span><span class="logo-wallet">wallet</span></h2>
      </div>

      <!-- CONTEUDO -->
      <div class="content">
        <h1 class="title">Redefinir sua senha</h1>

        <p class="text">Recebemos uma solicitacao para redefinir a senha da sua conta Esquilo Wallet. Clique no botao abaixo para criar uma nova senha.</p>

        <!-- BOTAO -->
        <div class="button-link">
          <a href="${urlReset}" class="button">Redefinir Senha</a>
        </div>

        <!-- LINK ALTERNATIVO -->
        <p class="link-copy">
          Se o botao nao funcionar, copie e cole este link no seu navegador:<br>
          <a href="${urlReset}">${urlReset}</a>
        </p>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <p>Este link eh valido por 24 horas. Se nao solicitou esta recuperacao, ignore este email.</p>
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
    // Gera token aleatorio
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

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

function testar() {
  const resultado = enviarRecuperacao('seu-email@gmail.com');
  console.log(JSON.stringify(resultado, null, 2));
}
