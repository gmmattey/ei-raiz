import type { CategoriaAtivo } from "./carteira";

export type UploadExtrato = {
  usuarioId: string;
  nomeArquivo: string;
  conteudo: string;
  tipoArquivo: "csv";
};

export type ItemImportacao = {
  linha: number;
  dataOperacao: string;
  ticker: string;
  nome: string;
  categoria: CategoriaAtivo;
  plataforma: string;
  quantidade: number;
  valor: number;
  tickerCanonico?: string;
  nomeCanonico?: string;
  identificadorCanonico?: string;
  cnpjFundo?: string;
  isin?: string;
  aliases?: string[];
  status: "ok" | "conflito" | "erro";
  observacao?: string;
};

export type PreviewImportacao = {
  importacaoId: string;
  totalLinhas: number;
  validos: number;
  conflitos: number;
  erros: number;
  itens: ItemImportacao[];
};

export type ConfirmacaoImportacao = {
  importacaoId: string;
  itensConfirmados: number;
  itensIgnorados: number;
};

export interface ServicoImportacao {
  gerarPreview(upload: UploadExtrato): Promise<PreviewImportacao>;
  obterPreview(importacaoId: string): Promise<PreviewImportacao>;
  confirmarImportacao(importacaoId: string, itensValidos: number[]): Promise<ConfirmacaoImportacao>;
}
