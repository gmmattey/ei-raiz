import type {
  RegistrarEntrada,
  EntrarEntrada,
  TokenSaida,
  SessaoSaida,
  RecuperarIniciarEntrada,
  RecuperarConfirmarEntrada,
  RecuperarRedefinirEntrada,
} from "@ei/contratos";
import { clearSession, saveSession } from "./authStorage";
import { apiRequest } from "./http";

const EMAIL_RECUPERACAO_STORAGE_KEY = "ei:recuperacao:email";

export function registrar(entrada: RegistrarEntrada): Promise<TokenSaida> {
  return apiRequest<TokenSaida>("/api/auth/registrar", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
}

export async function entrar(entradaOrEmail: EntrarEntrada | string, senha?: string): Promise<TokenSaida> {
  const entrada: EntrarEntrada = typeof entradaOrEmail === "string"
    ? { email: entradaOrEmail, senha: senha ?? "" }
    : entradaOrEmail;
  const resposta = await apiRequest<TokenSaida>("/api/auth/entrar", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
  saveSession({
    token: resposta.token,
    usuario: { id: "", nome: "", email: entrada.email },
  });
  const sessao = await obterSessao();
  saveSession({
    token: resposta.token,
    usuario: { id: sessao.usuarioId, nome: sessao.nome, email: sessao.email },
  });
  return resposta;
}

export async function sair(): Promise<void> {
  try {
    await apiRequest<{ encerrado: boolean }>("/api/auth/sair", { method: "POST" });
  } finally {
    clearSession();
  }
}

export function obterSessao(): Promise<SessaoSaida> {
  return apiRequest<SessaoSaida>("/api/auth/sessao", { method: "GET" });
}

export function recuperarIniciar(entrada: RecuperarIniciarEntrada): Promise<{ solicitado: boolean; destinoMascara: string }> {
  return apiRequest("/api/auth/recuperar/iniciar", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
}

export function recuperarConfirmar(entrada: RecuperarConfirmarEntrada): Promise<{ token: string }> {
  return apiRequest("/api/auth/recuperar/confirmar", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
}

export function recuperarRedefinir(entrada: RecuperarRedefinirEntrada): Promise<{ redefinido: boolean }> {
  return apiRequest("/api/auth/recuperar/redefinir", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
}

// Shims compat com assinaturas antigas usadas por LandingPage.tsx. Saem em
// Etapa 7 quando LandingPage for refatorada para consumir recuperarIniciar/
// recuperarRedefinir diretamente.
export async function solicitarRecuperacaoPorEmail(email: string): Promise<{ solicitado: boolean; destinoMascara: string }> {
  try {
    window.sessionStorage.setItem(EMAIL_RECUPERACAO_STORAGE_KEY, email);
  } catch { /* sessionStorage indisponível: segue o baile */ }
  return recuperarIniciar({ email });
}

export async function solicitarRecuperacaoPorCpf(_cpf: string): Promise<{ solicitado: boolean; destinoMascara: string }> {
  throw new Error("Fluxo de recuperação por CPF indisponível: use o e-mail cadastrado.");
}

export async function redefinirSenha(pin: string, novaSenha: string): Promise<{ redefinido: boolean }> {
  let email = "";
  try { email = window.sessionStorage.getItem(EMAIL_RECUPERACAO_STORAGE_KEY) ?? ""; } catch { /* noop */ }
  const resposta = await recuperarRedefinir({ email, pin, novaSenha });
  try { window.sessionStorage.removeItem(EMAIL_RECUPERACAO_STORAGE_KEY); } catch { /* noop */ }
  return resposta;
}
