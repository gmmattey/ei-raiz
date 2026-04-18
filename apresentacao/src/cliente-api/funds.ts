import { apiRequest } from "./http";

export type FundDocumentItem = {
  cnpj: string;
  fundName: string | null;
  type: string;
  title: string;
  documentDate: string | null;
  referenceDate: string | null;
  source: "cvm";
  url: string | null;
  fetchedAt: string;
};

export function obterDocumentosFundo(cnpj: string): Promise<{ cnpj: string; items: FundDocumentItem[]; fetchedAt: string }> {
  return apiRequest<{ cnpj: string; items: FundDocumentItem[]; fetchedAt: string }>(`/api/funds/${encodeURIComponent(cnpj)}/documents`, { method: "GET" });
}
