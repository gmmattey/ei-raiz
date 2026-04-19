export function criarTemplateRecuperacaoSenha(email: string, pin: string, expiraEm: string): string {
  return `<!DOCTYPE html>
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
    .instructions { font-size: 14px; color: #0b1218; opacity: 0.7; margin: 16px 0 0 0; }
    .step { margin: 12px 0; }
    .pin-box { background: #f5f0eb; border: 2px solid #f56a2a; border-radius: 8px; padding: 16px; margin: 24px 0; }
    .pin-label { font-size: 12px; font-weight: bold; color: #f56a2a; text-transform: uppercase; margin-bottom: 8px; }
    .pin-value { font-family: monospace; font-size: 32px; color: #0b1218; word-break: break-all; letter-spacing: 8px; font-weight: bold; text-align: center; }
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
        <p class="text">Recebemos uma solicitação para redefinir a senha da sua conta Esquilo Wallet.</p>

        <div class="instructions">
          <p style="font-weight: bold; color: #0b1218; margin: 0 0 12px 0;">Como proceder:</p>
          <div class="step"><strong>1.</strong> Acesse esquilo.wallet no seu navegador;</div>
          <div class="step"><strong>2.</strong> Clique em "Esqueci minha senha";</div>
          <div class="step"><strong>3.</strong> Copie o código abaixo e cole no formulário;</div>
          <div class="step"><strong>4.</strong> Defina sua nova senha.</div>
        </div>

        <div class="pin-box">
          <div class="pin-label">Seu PIN de recuperação (válido por 24h)</div>
          <div class="pin-value">${pin}</div>
        </div>

        <p class="instructions">
          Se não solicitou esta recuperação, ignore este email e não compartilhe o código.
        </p>
      </div>
      <div class="footer">
        <p>Este código é válido por 24 horas. Se não solicitou esta recuperação, ignore este email e não compartilhe o código.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
