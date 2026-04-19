import type { Env } from "../../types/gateway";
import { criarTemplateRecuperacaoSenha } from "./template-recuperacao-senha";
import { gerarPinSeisDígitos } from "./pin-generator";

type PasswordResetPayload = {
  email: string;
  token: string;
  expiraEm: string;
};

export async function enviarViaGoogleAppsScript(env: Env, payload: PasswordResetPayload): Promise<void> {
  const webhookUrl = env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    throw new Error("GOOGLE_APPS_SCRIPT_WEBHOOK_URL nao configurada");
  }

  // O payload já vem com token = PIN de 6 dígitos (vindo de notificarRecuperacaoSenha)
  const pin = payload.token; // Este é o PIN de 6 dígitos
  const htmlBody = criarTemplateRecuperacaoSenha(payload.email, pin, payload.expiraEm);

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      htmlBody: htmlBody,
    }),
  });

  if (!response.ok) {
    const texto = await response.text();
    throw new Error(`GoogleAppsScript error: ${response.status} - ${texto}`);
  }
}
