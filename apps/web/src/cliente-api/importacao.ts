import type { ConfirmacaoImportacao, PreviewImportacao } from "@ei/contratos";
import { apiRequest } from "./http";

type UploadExtratoPayload = {
  nomeArquivo: string;
  conteudo: string;
  tipoArquivo: "csv";
};

export function uploadExtrato(payload: UploadExtratoPayload): Promise<PreviewImportacao> {
  return apiRequest<PreviewImportacao>("/api/importacao/upload", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function obterPreview(importacaoId: string): Promise<PreviewImportacao> {
  return apiRequest<PreviewImportacao>(`/api/importacao/${importacaoId}/preview`, { method: "GET" });
}

export function confirmarImportacao(importacaoId: string, itensValidos: number[]): Promise<ConfirmacaoImportacao> {
  return apiRequest<ConfirmacaoImportacao>(`/api/importacao/${importacaoId}/confirmar`, {
    method: "POST",
    body: JSON.stringify({ itensValidos }),
  });
}
