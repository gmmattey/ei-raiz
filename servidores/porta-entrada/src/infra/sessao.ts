// Contexto de sessão injetado nas rotas após middleware de autenticação.

export interface ContextoSessao {
  usuarioId: string;
  email: string;
  nome: string;
  ehAdmin: boolean;
}

export type RequisicaoAutenticada = Request & { sessao?: ContextoSessao };
