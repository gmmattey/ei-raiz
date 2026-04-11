import type { ConfirmacaoImportacao, ItemPatrimonioBruto, PreviewImportacao } from "@ei/contratos";
import { apiRequest } from "./http";

type UploadCsvPayload = {
  nomeArquivo: string;
  conteudo: string;
  tipoArquivo: "csv";
};

type UploadXlsxPayload = {
  nomeArquivo: string;
  tipoArquivo: "xlsx";
  itens: ItemPatrimonioBruto[];
};

type UploadPayload = UploadCsvPayload | UploadXlsxPayload;

export function uploadExtrato(payload: UploadPayload): Promise<PreviewImportacao> {
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
