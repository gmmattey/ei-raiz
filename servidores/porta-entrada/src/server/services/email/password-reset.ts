import type { Env } from "../../types/gateway";
import { gerarPinSeisDígitos } from "./pin-generator";
import { criarTemplateRecuperacaoSenha } from "./template-recuperacao-senha";

type PasswordResetPayload = {
  email: string;
  token: string;
  expiraEm: string;
};

export async function notificarRecuperacaoSenha(env: Env, payload: PasswordResetPayload): Promise<void> {
  console.log(`[notificacaoSenha] Iniciando para ${payload.email}`);

  const pin = gerarPinSeisDígitos(payload.token);
  console.log(`[notificacaoSenha] PIN: ${pin}`);

  const webhookUrl = env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    console.log("[notificacaoSenha] Webhook não configurado!");
    return;
  }

  const htmlBody = criarTemplateRecuperacaoSenha(payload.email, pin, payload.expiraEm);

  try {
    console.log(`[GoogleAppsScript] Enviando para ${webhookUrl}`);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: payload.email, htmlBody }),
    });

    const text = await response.text();
    console.log(`[GoogleAppsScript] Status: ${response.status} | Resposta: ${text}`);

    if (!response.ok) {
      throw new Error(`GoogleAppsScript HTTP ${response.status}: ${text}`);
    }

    let parsed: { sucesso?: boolean; erro?: string } | null = null;
    try { parsed = JSON.parse(text); } catch { /* resposta não-JSON */ }

    if (parsed && parsed.sucesso === false) {
      throw new Error(`GoogleAppsScript rejeitou: ${parsed.erro || "sem detalhes"}`);
    }

    console.log(`[GoogleAppsScript] ✓ Enviado com sucesso para ${payload.email}`);
  } catch (erro) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    console.error(`[GoogleAppsScript] ✗ Erro: ${msg}`);
    throw erro;
  }
}
