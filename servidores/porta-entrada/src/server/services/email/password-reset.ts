import type { Env } from "../../types/gateway";

type PasswordResetPayload = {
  email: string;
  token: string;
  expiraEm: string;
};

function buildResetUrl(env: Env, payload: PasswordResetPayload): string {
  const base = (env.WEB_BASE_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const url = new URL("/", base);
  url.searchParams.set("abrir", "login");
  url.searchParams.set("step", "forgotPassword");
  url.searchParams.set("email", payload.email);
  url.searchParams.set("token", payload.token);
  return url.toString();
}

async function enviarViaResend(env: Env, payload: PasswordResetPayload): Promise<void> {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const from = env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error("EMAIL_FROM_NAO_CONFIGURADO");
  }

  const resetUrl = buildResetUrl(env, payload);
  const expiraEmIso = payload.expiraEm;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.email,
      subject: "Esquilo Invest — Recuperacao de senha",
      html: [
        `<p>Recebemos uma solicitacao para redefinir sua senha no Esquilo Invest.</p>`,
        `<p><a href="${resetUrl}">Clique aqui para redefinir sua senha</a></p>`,
        `<p>Ou use este codigo no app: <b>${payload.token}</b></p>`,
        `<p>Expira em: ${expiraEmIso}</p>`,
        `<p>Se voce nao solicitou, ignore este e-mail.</p>`,
      ].join(""),
    }),
  });
}

async function enviarViaWebhook(env: Env, payload: PasswordResetPayload): Promise<void> {
  const webhook = env.PASSWORD_RESET_WEBHOOK_URL?.trim();
  if (!webhook) return;
  await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "password_reset", ...payload }),
  });
}

export async function notificarRecuperacaoSenha(env: Env, payload: PasswordResetPayload): Promise<void> {
  if (env.RESEND_API_KEY?.trim()) {
    await enviarViaResend(env, payload);
    return;
  }
  if (env.PASSWORD_RESET_WEBHOOK_URL?.trim()) {
    await enviarViaWebhook(env, payload);
    return;
  }

  const resetUrl = buildResetUrl(env, payload);
  console.log("----------------------------------------------------------");
  console.log(`[DEV] Recuperacao de senha solicitada para: ${payload.email}`);
  console.log(`[DEV] Link: ${resetUrl}`);
  console.log(`[DEV] Token: ${payload.token}`);
  console.log(`[DEV] Expira em: ${payload.expiraEm}`);
  console.log("----------------------------------------------------------");
}
