export type AppEnv = 'local' | 'hml' | 'prd';

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  version: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ApiEnvelopeOk<TData> = {
  ok: true;
  meta: ApiMeta;
  data: TData;
};

export type ApiEnvelopeError = {
  ok: false;
  meta: ApiMeta;
  error: ApiError;
};

export type ApiEnvelope<TData> = ApiEnvelopeOk<TData> | ApiEnvelopeError;

export interface JsonLoader {
  load<T>(path: string): Promise<T>;
}

