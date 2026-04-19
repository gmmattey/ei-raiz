import type { CategoriaAtivo, IndexadorRendaFixa } from "./carteira";

// Tipos de patrimônio real (não financeiro listado)
export type TipoPatrimonio = "imovel" | "veiculo" | "poupanca";

// Categoria unificada para importação (financeiro + patrimônio)
export type CategoriaImportacao = CategoriaAtivo | TipoPatrimonio;

// Aba de origem no XLSX
export type AbaImportacao =
  | "acoes"
  | "fundos"
  | "renda_fixa"
  | "previdencia"
  | "imoveis"
  | "veiculos"
  | "poupanca";

// ------- Itens brutos por tipo (vindos do XLSX parseado no frontend) -------

export type ItemAcaoBruto = {
  aba: "acoes";
  linha: number;
  ticker: string;
  nome?: string;
  quantidade: number;
  precoMedio?: number;
  valorTotal?: number;
  dataCompra?: string;
  plataforma?: string;
};

export type ItemFundoBruto = {
  aba: "fundos";
  linha: number;
  nome: string;
  cnpj?: string;
  tipo?: string;
  instituicao: string;
  valorAplicado: number;
  dataAplicacao?: string;
};

/**
 * Ativo de renda fixa contratada (CDB, LCI/LCA, Tesouro, Debêntures).
 * Campos obrigatórios para marcar a mercado:
 *   valorAplicado + indexador + taxa + dataInicio.
 * Sem eles o item entra como status="erro" na validação.
 */
export type ItemRendaFixaBruto = {
  aba: "renda_fixa";
  linha: number;
  nome: string;
  instituicao: string;
  tipo?: string;                       // "CDB" | "LCI" | "LCA" | "Tesouro" | "Debênture" | ...
  valorAplicado: number;
  indexador: IndexadorRendaFixa;
  taxa: number;                        // ver carteira.ts para escala
  dataInicio: string;                  // ISO 8601
  vencimento?: string;                 // ISO 8601 (nulo = sem prazo)
};

/**
 * Previdência privada (PGBL/VGBL). Matematicamente parente de renda fixa
 * contratada, mas categoria separada por razão fiscal/legal.
 */
export type ItemPrevidenciaBruto = {
  aba: "previdencia";
  linha: number;
  nome: string;
  instituicao: string;
  tipo?: string;                       // "PGBL" | "VGBL"
  valorAplicado: number;
  indexador: IndexadorRendaFixa;
  taxa: number;
  dataInicio: string;
  vencimento?: string;
};

export type ItemImovelBruto = {
  aba: "imoveis";
  linha: number;
  descricao: string;
  tipo: string; // residencial, comercial, terreno, rural, outros
  valorEstimado: number;
  saldoDevedor?: number;
  finalidade?: string; // moradia, aluguel, lazer, outros
  participacaoPercentual?: number;
};

export type ItemVeiculoBruto = {
  aba: "veiculos";
  linha: number;
  tipo: string; // carro, moto, caminhao, outro
  montadora: string;
  modelo: string;
  anoModelo: number;
  valorReferencia: number;
  saldoDevedor?: number;
};

export type ItemPoupancaBruto = {
  aba: "poupanca";
  linha: number;
  instituicao: string;
  valorAtual: number;
  titularidade?: string;
};

export type ItemPatrimonioBruto =
  | ItemAcaoBruto
  | ItemFundoBruto
  | ItemRendaFixaBruto
  | ItemPrevidenciaBruto
  | ItemImovelBruto
  | ItemVeiculoBruto
  | ItemPoupancaBruto;

// ------- Payload de upload -------

// Upload legado (CSV) - mantido para compatibilidade
export type UploadExtrato = {
  usuarioId: string;
  nomeArquivo: string;
  conteudo: string;
  tipoArquivo: "csv";
};

// Upload novo (XLSX com múltiplas abas, parseado no frontend)
export type UploadPatrimonioXlsx = {
  usuarioId: string;
  nomeArquivo: string;
  tipoArquivo: "xlsx";
  itens: ItemPatrimonioBruto[];
};

// ------- Item de preview (resultado da validação) -------

export type ItemImportacao = {
  linha: number;
  abaOrigem: AbaImportacao;
  categoria: CategoriaImportacao;
  // Campos comuns
  ticker?: string;
  nome: string;
  plataforma?: string;
  quantidade?: number;
  valor: number;
  dataOperacao?: string;
  // Identidade canônica (ativos listados)
  tickerCanonico?: string;
  nomeCanonico?: string;
  identificadorCanonico?: string;
  cnpjFundo?: string;
  isin?: string;
  aliases?: string[];
  // Metadados específicos por tipo (patrimônio / RF / previdência)
  metadados?: Record<string, unknown>;
  // Status de validação
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
  gerarPreview(upload: UploadExtrato | UploadPatrimonioXlsx): Promise<PreviewImportacao>;
  obterPreview(importacaoId: string): Promise<PreviewImportacao>;
  confirmarImportacao(importacaoId: string, itensValidos: number[]): Promise<ConfirmacaoImportacao>;
}
