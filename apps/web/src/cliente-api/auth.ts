import type { EntrarSaida, RegistrarSaida, SessaoUsuarioSaida } from "@ei/contratos";
import { saveSession } from "./authStorage";
import { apiRequest } from "./http";

export async function entrar(email: string, senha: string): Promise<EntrarSaida> {
  const resposta = await apiRequest<EntrarSaida>("/api/auth/entrar", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });

  saveSession({
    token: resposta.sessao.token,
    usuario: {
      id: resposta.usuario.id,
      nome: resposta.usuario.nome,
      email: resposta.usuario.email,
    },
  });
  return resposta;
}

export async function registrar(nome: string, cpf: string, email: string, senha: string): Promise<RegistrarSaida> {
  const resposta = await apiRequest<RegistrarSaida>("/api/auth/registrar", {
    method: "POST",
    body: JSON.stringify({ nome, cpf, email, senha }),
  });

  saveSession({
    token: resposta.sessao.token,
    usuario: {
      id: resposta.usuario.id,
      nome: resposta.usuario.nome,
      email: resposta.usuario.email,
    },
  });
  return resposta;
}

export function verificarCadastro(cpf: string, email: string): Promise<{ cpfDisponivel: boolean; emailDisponivel: boolean }> {
  return apiRequest<{ cpfDisponivel: boolean; emailDisponivel: boolean }>("/api/auth/verificar-cadastro", {
    method: "POST",
    body: JSON.stringify({ cpf, email }),
  });
}

export function obterUsuarioAutenticado(): Promise<SessaoUsuarioSaida> {
  return apiRequest<SessaoUsuarioSaida>("/api/auth/eu", { method: "GET" });
}

export type RecuperacaoResposta = {
  solicitado: boolean;
  canal: "email";
  destinoMascara: string;
  observacao: string;
};

export function solicitarRecuperacaoPorEmail(email: string): Promise<RecuperacaoResposta> {
  return apiRequest<RecuperacaoResposta>("/api/auth/recuperar-senha", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function solicitarRecuperacaoPorCpf(cpf: string): Promise<RecuperacaoResposta> {
  return apiRequest<RecuperacaoResposta>("/api/auth/recuperar-acesso", {
    method: "POST",
    body: JSON.stringify({ cpf }),
  });
}

export function redefinirSenha(token: string, novaSenha: string): Promise<{ redefinido: boolean }> {
  return apiRequest<{ redefinido: boolean }>("/api/auth/redefinir-senha", {
    method: "POST",
    body: JSON.stringify({ token, novaSenha }),
  });
}
