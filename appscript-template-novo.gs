// ======= ESQUILO WALLET - PASSWORD RESET COM HTML DO BACKEND =======
// Copia e cola TUDO isso no Apps Script
// O backend (Cloudflare Workers) gera o HTML completo
// Este script apenas recebe e envia via Gmail

// ===== WEBHOOK (recebe POST do Backend) =====

function doPost(e) {
  try {
    // Parse do JSON que vem do Cloudflare Workers
    const data = JSON.parse(e.postData.contents);

    // Validar campos obrigatórios
    if (!data.email || !data.htmlBody) {
      return ContentService.createTextOutput(
        JSON.stringify({ sucesso: false, erro: 'email e htmlBody obrigatorios' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Enviar email com HTML já pronto do backend
    GmailApp.sendEmail(
      data.email,
      'Redefinir sua senha - Esquilo Wallet',
      '',
      { htmlBody: data.htmlBody }
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

// ===== TESTE LOCAL (opcional) =====

function testarWebhook() {
  // Simula uma chamada POST do Cloudflare Workers
  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f0eb; }
    .container { max-width: 600px; margin: 20px auto; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { text-align: center; padding: 30px; border-bottom: 1px solid #efe7dc; }
    .logo { font-size: 24px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .pin-box { background: #f5f0eb; border: 2px solid #f56a2a; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center; }
    .pin-value { font-size: 32px; letter-spacing: 8px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">Esquilo<span style="color: #f56a2a;">wallet</span></div>
      </div>
      <div class="content">
        <h1>Redefinir sua senha</h1>
        <div class="pin-box">
          <div style="font-size: 12px; color: #f56a2a; text-transform: uppercase;">Seu PIN de recuperação</div>
          <div class="pin-value">123456</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const dadosMock = {
    email: 'seu-email@gmail.com',
    htmlBody: htmlBody
  };

  const e = {
    postData: {
      contents: JSON.stringify(dadosMock)
    }
  };

  const resposta = doPost(e);
  Logger.log('Resposta do webhook:', resposta.getContent());
}
