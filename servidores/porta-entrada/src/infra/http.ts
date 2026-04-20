// Tipos e helpers HTTP compartilhados por todos os domínios.

export type ServiceError = {
  ok: false;
  status: number;
  codigo: string;
  mensagem: string;
  detalhes?: unknown;
};

export type ServiceSuccess<T> = {
  ok: true;
  dados: T;
};

export type ServiceResponse<T> = ServiceSuccess<T> | ServiceError;

export const erro = (
  codigo: string,
  mensagem: string,
  status = 400,
  detalhes?: unknown,
): ServiceError => ({ ok: false, status, codigo, mensagem, detalhes });

export const sucesso = <T>(dados: T): ServiceSuccess<T> => ({ ok: true, dados });

export async function lerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export const metodoNaoPermitido = (metodo: string): ServiceError =>
  erro('metodo_nao_permitido', `Método ${metodo} não permitido`, 405);

export const naoEncontrado = (): ServiceError =>
  erro('nao_encontrado', 'Recurso não encontrado', 404);
