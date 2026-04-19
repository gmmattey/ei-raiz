/**
 * Esquilo Wallet - Recuperação de Senha via Google Apps Script
 * Envia templates de email de recuperação de senha
 */

// ====== CONFIGURAÇÕES ======
const CONFIG = {
  urlBaseApp: 'https://esquilo.wallet',
  nomeRemetente: 'Esquilo Wallet',
  emailRemetente: 'noreply@esquilo.wallet', // Ajustar conforme domínio
  horasValidadeToken: 24,
};

// ====== TEMPLATE 1: CLEAN E DIRETO ======
function gerarEmailLimpo(email, tokenReset) {
  const urlReset = `${CONFIG.urlBaseApp}/reset-password?token=${tokenReset}`;

  return {
    to: email,
    subject: 'Redefinir sua senha - Esquilo Invest',
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

            <!-- Header -->
            <div style="text-align: center; padding: 30px; border-bottom: 1px solid #EFE7DC;">
              <h2 style="font-family: 'Sora', Arial, sans-serif; font-size: 20px; color: #F56A2A; margin: 0;">ESQUILO INVEST</h2>
            </div>

            <!-- Conteúdo -->
            <div style="padding: 30px;">
              <h1 style="font-family: 'Sora', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #0B1218; margin: 0 0 16px 0;">Redefinir sua senha</h1>

              <p style="font-size: 16px; line-height: 1.6; color: #0B1218; margin: 0 0 24px 0;">
                Recebemos uma solicitação para redefinir a senha da sua conta Esquilo Invest. Clique no botão abaixo para criar uma nova senha.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${urlReset}" style="display: inline-block; background-color: #F56A2A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Redefinir Senha
                </a>
              </div>

              <p style="font-size: 14px; color: #0B1218; margin: 24px 0 0 0; opacity: 0.7;">
                Se o botão não funcionar, copie este link:<br>
                <span style="word-break: break-all; color: #F56A2A; font-size: 12px;">${urlReset}</span>
              </p>
            </div>

            <!-- Footer -->
            <div style="padding: 20px 30px; border-top: 1px solid #EFE7DC; text-align: center; background-color: #F5F0EB; font-size: 12px; color: #0B1218; opacity: 0.6;">
              <p style="margin: 0;">Este link é válido por ${CONFIG.horasValidadeToken} horas. Se não solicitou, ignore este email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// ====== TEMPLATE 2: SEGURANÇA E CONFIANÇA ======
function gerarEmailSeguranca(email, tokenReset, ipOrigem = 'Desconhecido', dispositivo = 'Navegador Web') {
  const urlReset = `${CONFIG.urlBaseApp}/reset-password?token=${tokenReset}`;
  const dataAtual = new Date().toLocaleString('pt-BR');

  return {
    to: email,
    subject: 'Solicitação de redefinição de senha - Esquilo Invest',
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

            <!-- Header -->
            <div style="text-align: center; padding: 30px; border-bottom: 1px solid #EFE7DC;">
              <h2 style="font-family: 'Sora', Arial, sans-serif; font-size: 20px; color: #F56A2A; margin: 0;">ESQUILO INVEST</h2>
              <p style="font-size: 14px; color: #F56A2A; margin: 8px 0 0 0; font-weight: 600;">Sua segurança é prioridade</p>
            </div>

            <!-- Conteúdo -->
            <div style="padding: 30px;">
              <h1 style="font-family: 'Sora', Arial, sans-serif; font-size: 24px; font-weight: 700; color: #0B1218; margin: 0 0 24px 0;">Solicitação de redefinição</h1>

              <!-- Card de Segurança -->
              <div style="background-color: #F5F0EB; border-left: 4px solid #F56A2A; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="font-size: 14px; line-height: 1.8; color: #0B1218; margin: 0;">
                  <strong>Informações da solicitação:</strong><br>
                  📅 Data: ${dataAtual}<br>
                  🖥️ Dispositivo: ${dispositivo}<br>
                  🌐 IP: ${ipOrigem}
                </p>
              </div>

              <p style="font-size: 16px; line-height: 1.6; color: #0B1218; margin: 0 0 24px 0;">
                Para proteger sua conta, você precisa criar uma nova senha. Este link é válido apenas por ${CONFIG.horasValidadeToken} horas.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${urlReset}" style="display: inline-block; background-color: #F56A2A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Criar Nova Senha
                </a>
              </div>

              <!-- Aviso de Segurança -->
              <div style="background-color: #FFF3E0; border: 1px solid #F56A2A; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="font-size: 13px; color: #0B1218; margin: 0;">
                  ⚠️ <strong>Nunca compartilhe este link</strong> com outras pessoas. A Esquilo nunca pedirá sua senha por email.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 20px 30px; border-top: 1px solid #EFE7DC; text-align: center; background-color: #F5F0EB; font-size: 12px; color: #0B1218; opacity: 0.6;">
              <p style="margin: 0 0 8px 0;">Não fez esta solicitação? <a href="${CONFIG.urlBaseApp}/suporte" style="color: #F56A2A; text-decoration: none;">Contate nosso suporte</a></p>
              <p style="margin: 0;">© 2026 Esquilo Invest. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// ====== TEMPLATE 3: AMIGÁVEL E CONTEXTUAL (COM LOGO) ======
function gerarEmailAmigavel(email, tokenReset) {
  const urlReset = `${CONFIG.urlBaseApp}/reset-password?token=${tokenReset}`;

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

            <!-- Header com fundo e logo -->
            <div style="background: linear-gradient(135deg, #0B1218 0%, #1a2329 100%); padding: 50px 30px; text-align: center;">
              <!-- Logo SVG Inline -->
              <svg width="360" height="54" viewBox="0 0 720.80884 108.52799" style="margin: 0 auto; display: block;">
                <g transform="translate(-314.18408,-5.872101)">
                  <g transform="translate(305,92)">
                    <text x="0" y="0" font-size="112px" fill="#ffffff" style="font-weight:bold;font-family:Sora"><tspan>Esquilo</tspan></text>
                    <text x="428.82883" y="2.0045044" font-size="112px" fill="#f56a2a" style="font-weight:300;font-family:Inter"><tspan>wallet</tspan></text>
                  </g>
                </g>
              </svg>
              <h2 style="font-family: 'Sora', Arial, sans-serif; font-size: 20px; color: #F56A2A; margin: 24px 0 0 0; font-weight: 700; letter-spacing: 0.5px;">Tudo bem, vamos resetar!</h2>
            </div>

            <!-- Conteúdo -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #0B1218; margin: 0 0 28px 0;">
                Oi! 👋 Sabemos que às vezes a gente esquece a senha mesmo. Sem problemas, ajudamos você a criar uma nova em alguns cliques.
              </p>

              <!-- Passos -->
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

              <!-- Dúvidas -->
              <div style="background-color: #F5F0EB; padding: 24px; border-radius: 12px; border-left: 4px solid #F56A2A;">
                <p style="font-family: 'Sora', Arial, sans-serif; font-weight: 600; color: #0B1218; margin: 0 0 12px 0; font-size: 15px;">❓ Ficou com dúvida?</p>
                <ul style="font-size: 14px; color: #0B1218; opacity: 0.8; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li style="margin-bottom: 8px;">O link expira em ${CONFIG.horasValidadeToken} horas</li>
                  <li style="margin-bottom: 8px;">Se não pediu esta recuperação, ignore este email</li>
                  <li>Precisa de ajuda? <a href="${CONFIG.urlBaseApp}/suporte" style="color: #F56A2A; text-decoration: none; font-weight: 600;">Fale com nosso suporte</a></li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 24px 30px; border-top: 1px solid #EFE7DC; background-color: #F5F0EB; text-align: center;">
              <p style="font-size: 13px; color: #0B1218; opacity: 0.7; margin: 0 0 8px 0;">
                © 2026 Esquilo Wallet. Todos os direitos reservados.
              </p>
              <p style="font-size: 12px; color: #0B1218; opacity: 0.6; margin: 0;">
                <a href="${CONFIG.urlBaseApp}/privacidade" style="color: #F56A2A; text-decoration: none; margin: 0 8px;">Política de Privacidade</a> •
                <a href="${CONFIG.urlBaseApp}/termos" style="color: #F56A2A; text-decoration: none; margin: 0 8px;">Termos de Uso</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// ====== FUNÇÕES DE ENVIO ======

/**
 * Envia email de recuperação de senha
 * @param {string} email - Email do usuário
 * @param {string} tokenReset - Token de recuperação
 * @param {number} templateId - Qual template usar (1, 2 ou 3)
 * @param {Object} opcoes - Opções adicionais (ipOrigem, dispositivo)
 */
function enviarEmailRecuperacaoSenha(email, tokenReset, templateId = 1, opcoes = {}) {
  try {
    let emailObjeto;

    switch(templateId) {
      case 1:
        emailObjeto = gerarEmailLimpo(email, tokenReset);
        break;
      case 2:
        emailObjeto = gerarEmailSeguranca(
          email,
          tokenReset,
          opcoes.ipOrigem || 'Desconhecido',
          opcoes.dispositivo || 'Navegador Web'
        );
        break;
      case 3:
        emailObjeto = gerarEmailAmigavel(email, tokenReset);
        break;
      default:
        throw new Error('Template ID inválido. Use 1, 2 ou 3.');
    }

    // Adicionar headers e enviar
    const opcoesSMTP = {
      name: CONFIG.nomeRemetente,
      replyTo: CONFIG.emailRemetente,
    };

    GmailApp.sendEmail(
      emailObjeto.to,
      emailObjeto.subject,
      '', // plainTextBody vazio, usando HTML
      {
        htmlBody: emailObjeto.htmlBody,
        name: CONFIG.nomeRemetente,
      }
    );

    console.log(`✓ Email enviado para ${email} (Template ${templateId})`);
    return { sucesso: true, email, template: templateId };

  } catch (erro) {
    console.error(`✗ Erro ao enviar email: ${erro.message}`);
    return { sucesso: false, email, erro: erro.message };
  }
}

// ====== UTILITÁRIOS ======

/**
 * Gera um token de reset seguro
 * @returns {string} Token aleatório
 */
function gerarTokenReset() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return token;
}

/**
 * Exemplo de uso: Função acionável via API
 */
function obterTokenEEnviarEmail(email, templateId = 1) {
  const token = gerarTokenReset();
  // Aqui você salvaria o token no banco de dados com timestamp de expiração
  // Exemplo: salvar em Firestore, Sheets, ou banco de dados próprio

  const resultado = enviarEmailRecuperacaoSenha(email, token, templateId);

  return {
    ...resultado,
    token: token, // Retornar apenas para testes, remover em produção
    expiresIn: `${CONFIG.horasValidadeToken} horas`
  };
}

// ====== TESTES ======

function testarTodosTemplates() {
  const emailTeste = 'seu-email@example.com'; // Alterar para email real

  console.log('=== Testando Templates de Recuperação de Senha ===\n');

  const token = gerarTokenReset();
  console.log(`Token gerado: ${token}\n`);

  // Template 1
  console.log('Template 1 (Clean):');
  console.log(JSON.stringify(gerarEmailLimpo(emailTeste, token), null, 2));
  console.log('\n---\n');

  // Template 2
  console.log('Template 2 (Segurança):');
  console.log(JSON.stringify(gerarEmailSeguranca(emailTeste, token, '192.168.1.1', 'Chrome - Windows'), null, 2));
  console.log('\n---\n');

  // Template 3
  console.log('Template 3 (Amigável):');
  console.log(JSON.stringify(gerarEmailAmigavel(emailTeste, token), null, 2));
}
