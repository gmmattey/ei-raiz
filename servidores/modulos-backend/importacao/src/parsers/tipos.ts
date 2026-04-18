export type ItemImportacaoBruto = {
  linha: number;
  dataOperacao: string;
  ticker: string;
  nome: string;
  categoria: string;
  plataforma: string;
  quantidade: number;
  valor: number;
};

export interface ParserExtrato {
  nome: string;
  detectar(arquivo: ArrayBuffer): boolean;
  processar(arquivo: ArrayBuffer, contexto?: { plataformaPadrao?: string }): ItemImportacaoBruto[];
}
