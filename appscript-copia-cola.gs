// ======= COPIA E COLA TUDO ISSO NO APPS SCRIPT =======

// ===== CONFIGURAÇÕES (Mude essas 2 linhas) =====
const URL_APP = 'https://esquilo.wallet';  // ← Mude aqui
const EMAIL_EMPRESA = 'noreply@esquilo.wallet';  // ← Mude aqui

// ===== TEMPLATES DE EMAIL =====

function emailTemplate3(email, token) {
  const urlReset = `${URL_APP}/reset-password?token=${token}`;

  return {
    to: email,
    subject: 'Tudo bem, vamos resetar sua senha! 👋',
    htmlBody: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #F5F0EB;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(11, 18, 24, 0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0B1218 0%, #1a2329 100%); padding: 50px 30px; text-align: center;">
              <svg width="360" height="54" viewBox="0 0 720.80884 108.52799" style="margin: 0 auto; display: block;">
                <g transform="translate(-314.18408,-5.872101)">
                  <g transform="translate(305,92)">
                    <text x="0" y="0" font-size="112px" fill="#ffffff" style="font-weight:bold;font-family:Sora"><tspan>Esquilo</tspan></text>
                    <text x="428.82883" y="2.0045044" font-size="112px" fill="#f56a2a" style="font-weight:300;font-family:Inter"><tspan>wallet</tspan></text>
                  </g>
                </g>
              </svg>
              <h2 style="font-family: 'Sora', Arial, sans-serif; font-size: 20px; color: #F56A2A; margin: 24px 0 0 0; font-weight: 700;">Tudo bem, vamos resetar!</h2>
            </div>
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #0B1218; margin: 0 0 28px 0;">Oi! 👋 Sabemos que às vezes a gente esquece a senha mesmo. Sem problemas, ajudamos você a criar uma nova em alguns cliques.</p>
              <div style="margin: 32px 0 40px 0;">
                <div style="display: flex; margin-bottom: 20px;">
                  <div style="background-color: #F56A2A; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; margin-right: 16px; flex-shrink: 0;">1</div>
                  <div style="flex: 1;">
                    <p style="font-family: 'Sora', Arial, sans-serif; font-weight: 600; color: #0B1218; margin: 0 0 4px 0; font-size: 16px;">Clique no botão abaixo</p>
                    <p style="font-size: 14px; color: #0B1218; opacity: 0.7; margin: 0; line-height: 1.5;">Você será levado para a página de redefinição</p>
                  </div>
                </div>
                <div style="display: flex; margin-bottom: 20px;">
                  <div style="background-color: #F56A2A; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; margin-right: 16px; flex-shrink: 0;">2</div>
                  <div style="flex: 1;">
                    <p style="font-family: 'Sora', Arial, sans-serif; font-weight: 600; color: #0B1218; margin: 0 0 4px 0; font-size: 16px;">Digite sua nova senha</p>
                    <p style="font-size: 14px; color: #0B1218; opacity: 0.7; margin: 0; line-height: 1.5;">Escolha algo seguro, como sua senha de banco</p>
                  </div>
                </div>
                <div style="display: flex;">
                  <div style="background-color: #F56A2A; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; margin-right: 16px; flex-shrink: 0;">✓</div>
                  <div style="flex: 1;">
                    <p style="font-family: 'Sora', Arial, sans-serif; font-weight: 600; color: #0B1218; margin: 0 0 4px 0; font-size: 16px;">Pronto!</p>
                    <p style="font-size: 14px; color: #0B1218; opacity: 0.7; margin: 0; line-height: 1.5;">Faça login com sua nova senha</p>
                  </div>
                </div>
              </div>
              <div style="text-align: center; margin: 0 0 32px 0;">
                <a href="${urlReset}" style="display: inline-block; background-color: #F56A2A; color: white; padding: 16px 48px; text-decoration: none; border-radius: 12px; font-family: 'Sora', Arial, sans-serif; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 106, 42, 0.3);">
                  Resetar Minha Senha
                </a>
              </div>
              <div style="background-color: #F5F0EB; padding: 24px; border-radius: 12px; border-left: 4px solid #F56A2A;">
                <p style="font-family: 'Sora', Arial, sans-serif; font-weight: 600; color: #0B1218; margin: 0 0 12px 0; font-size: 15px;">❓ Ficou com dúvida?</p>
                <ul style="font-size: 14px; color: #0B1218; opacity: 0.8; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li style="margin-bottom: 8px;">O link expira em 24 horas</li>
                  <li style="margin-bottom: 8px;">Se não pediu esta recuperação, ignore este email</li>
                  <li>Precisa de ajuda? <a href="${URL_APP}/suporte" style="color: #F56A2A; text-decoration: none; font-weight: 600;">Fale com nosso suporte</a></li>
                </ul>
              </div>
            </div>
            <div style="padding: 24px 30px; border-top: 1px solid #EFE7DC; background-color: #F5F0EB; text-align: center;">
              <p style="font-size: 13px; color: #0B1218; opacity: 0.7; margin: 0 0 8px 0;">© 2026 Esquilo Wallet. Todos os direitos reservados.</p>
              <p style="font-size: 12px; color: #0B1218; opacity: 0.6; margin: 0;">
                <a href="${URL_APP}/privacidade" style="color: #F56A2A; text-decoration: none; margin: 0 8px;">Política de Privacidade</a> •
                <a href="${URL_APP}/termos" style="color: #F56A2A; text-decoration: none; margin: 0 8px;">Termos de Uso</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// ===== FUNÇÕES PRINCIPAIS =====

function gerarToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function enviarEmailRecuperacao(email) {
  try {
    const token = gerarToken();
    const emailObj = emailTemplate3(email, token);

    GmailApp.sendEmail(
      emailObj.to,
      emailObj.subject,
      '',
      { htmlBody: emailObj.htmlBody, name: 'Esquilo Wallet' }
    );

    return { sucesso: true, email, token, msg: 'Email enviado!' };
  } catch (erro) {
    return { sucesso: false, email, erro: erro.toString() };
  }
}

// ===== TESTE RÁPIDO =====

function testar() {
  const resultado = enviarEmailRecuperacao('seu-email@gmail.com');
  console.log('Resultado:', JSON.stringify(resultado, null, 2));
}
