export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_TOKEN?: string;
  ADMIN_EMAILS?: string;
  BRAPI_TOKEN?: string;
  BRAPI_BASE_URL?: string;
  CVM_BASE_URL?: string;
  FIPE_BASE_URL?: string;
  PASSWORD_RESET_WEBHOOK_URL?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  WEB_BASE_URL?: string;
};

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

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
