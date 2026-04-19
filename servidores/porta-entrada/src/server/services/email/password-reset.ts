import type { Env } from "../../types/gateway";
import { gerarPinSeisDígitos } from "./pin-generator";

type PasswordResetPayload = {
  email: string;
  token: string;
  expiraEm: string;
};

export async function notificarRecuperacaoSenha(env: Env, payload: PasswordResetPayload): Promise<void> {
  console.log(`[notificacaoSenha] Iniciando para ${payload.email}`);

  // Gerar PIN de 6 dígitos do token
  const pin = gerarPinSeisDígitos(payload.token);
  console.log(`[notificacaoSenha] PIN: ${pin}`);

  // Google Apps Script — enviar o formato antigo que ele já conhece
  // Agora o "token" é o PIN de 6 dígitos em vez do token completo
  const webhookUrl = env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    try {
      console.log(`[GoogleAppsScript] Enviando para ${webhookUrl}`);
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: payload.email,
          token: pin,  // PIN de 6 dígitos (não o token completo)
          resetUrl: `${(env.WEB_BASE_URL || "http://localhost:3000").replace(/\/+$/, "")}/?abrir=login&step=forgotPassword&email=${encodeURIComponent(payload.email)}`,
          expiraEm: payload.expiraEm,
        }),
      });

      console.log(`[GoogleAppsScript] Status: ${response.status}`);
      const text = await response.text();
      console.log(`[GoogleAppsScript] Resposta: ${text}`);

      if (!response.ok) {
        throw new Error(`GoogleAppsScript error: ${response.status} - ${text}`);
      }

      console.log(`[GoogleAppsScript] ✓ Enviado com sucesso para ${payload.email}`);
      return;
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      console.error(`[GoogleAppsScript] ✗ Erro: ${msg}`);
      throw erro;
    }
  }

  console.log("[notificacaoSenha] Webhook não configurado!");
}
