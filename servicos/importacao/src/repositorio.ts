import type { CategoriaAtivo, ItemImportacao, PreviewImportacao } from "@ei/contratos";

export type RegistroImportacao = {
  id: string;
  usuarioId: string;
  arquivoNome: string;
};

export interface RepositorioImportacao {
  criarImportacao(registro: RegistroImportacao): Promise<void>;
  salvarItens(importacaoId: string, itens: ItemImportacao[]): Promise<void>;
  atualizarResumo(importacaoId: string, preview: PreviewImportacao): Promise<void>;
  obterPreview(importacaoId: string): Promise<PreviewImportacao | null>;
  listarItens(importacaoId: string): Promise<ItemImportacao[]>;
  confirmarItens(
    importacaoId: string,
    usuarioId: string,
    itensValidos: number[],
  ): Promise<{ itensConfirmados: number; itensIgnorados: number }>;
}

const mapRowToItem = (row: {
  id: string;
  data_operacao: string | null;
  ticker: string;
  nome: string | null;
  categoria: CategoriaAtivo;
  plataforma: string;
  quantidade: number | null;
  valor: number;
  ticker_canonico: string | null;
  nome_canonico: string | null;
  identificador_canonico: string | null;
  cnpj_fundo: string | null;
  isin: string | null;
  aliases_json: string | null;
  status: "ok" | "conflito" | "erro";
  observacao: string | null;
}): ItemImportacao => {
  const linha = Number.parseInt(row.id.split("_").at(-1) ?? "0", 10);
  let aliases: string[] | undefined;
  if (row.aliases_json) {
    try {
      const parsed = JSON.parse(row.aliases_json) as unknown;
      if (Array.isArray(parsed)) {
        aliases = parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      aliases = undefined;
    }
  }
  return {
    linha,
    dataOperacao: row.data_operacao ?? "",
    ticker: row.ticker ?? "",
    nome: row.nome ?? "",
    categoria: row.categoria,
    plataforma: row.plataforma ?? "",
    quantidade: row.quantidade ?? 0,
    valor: row.valor ?? 0,
    tickerCanonico: row.ticker_canonico ?? undefined,
    nomeCanonico: row.nome_canonico ?? undefined,
    identificadorCanonico: row.identificador_canonico ?? undefined,
    cnpjFundo: row.cnpj_fundo ?? undefined,
    isin: row.isin ?? undefined,
    aliases,
    status: row.status,
    observacao: row.observacao ?? undefined,
  };
};

export class RepositorioImportacaoD1 implements RepositorioImportacao {
  constructor(private readonly db: D1Database) {}

  async criarImportacao(registro: RegistroImportacao): Promise<void> {
    await this.db
      .prepare("INSERT INTO importacoes (id, usuario_id, arquivo_nome, status, total_linhas, conflitos, erros, validos) VALUES (?, ?, ?, 'pendente', 0, 0, 0, 0)")
      .bind(registro.id, registro.usuarioId, registro.arquivoNome)
      .run();
  }

  async salvarItens(importacaoId: string, itens: ItemImportacao[]): Promise<void> {
    const statements = itens.map((item) =>
      this.db
        .prepare(
          [
            "INSERT INTO itens_importacao",
            "(",
            "id, importacao_id, data_operacao, ticker, nome, categoria, plataforma, quantidade, valor,",
            "ticker_canonico, nome_canonico, identificador_canonico, cnpj_fundo, isin, aliases_json,",
            "status, observacao",
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ].join(" "),
        )
        .bind(
          `item_${importacaoId}_${item.linha}`,
          importacaoId,
          item.dataOperacao,
          item.ticker,
          item.nome,
          item.categoria,
          item.plataforma,
          item.quantidade,
          item.valor,
          item.tickerCanonico ?? null,
          item.nomeCanonico ?? null,
          item.identificadorCanonico ?? null,
          item.cnpjFundo ?? null,
          item.isin ?? null,
          item.aliases ? JSON.stringify(item.aliases) : null,
          item.status,
          item.observacao ?? null,
        ),
    );
    if (statements.length > 0) {
      await this.db.batch(statements);
    }
  }

  async atualizarResumo(importacaoId: string, preview: PreviewImportacao): Promise<void> {
    await this.db
      .prepare("UPDATE importacoes SET total_linhas = ?, conflitos = ?, erros = ?, validos = ? WHERE id = ?")
      .bind(preview.totalLinhas, preview.conflitos, preview.erros, preview.validos, importacaoId)
      .run();
  }

  async obterPreview(importacaoId: string): Promise<PreviewImportacao | null> {
    const importacao = await this.db
      .prepare("SELECT id, total_linhas, conflitos, erros, validos FROM importacoes WHERE id = ?")
      .bind(importacaoId)
      .first<{ id: string; total_linhas: number; conflitos: number; erros: number; validos: number }>();

    if (!importacao) return null;
    const itens = await this.listarItens(importacaoId);
    return {
      importacaoId: importacao.id,
      totalLinhas: importacao.total_linhas ?? itens.length,
      conflitos: importacao.conflitos ?? 0,
      erros: importacao.erros ?? 0,
      validos: importacao.validos ?? 0,
      itens,
    };
  }

  async listarItens(importacaoId: string): Promise<ItemImportacao[]> {
    const result = await this.db
      .prepare(
        [
          "SELECT",
          "id, data_operacao, ticker, nome, categoria, plataforma, quantidade, valor,",
          "ticker_canonico, nome_canonico, identificador_canonico, cnpj_fundo, isin, aliases_json,",
          "status, observacao",
          "FROM itens_importacao",
          "WHERE importacao_id = ?",
          "ORDER BY id ASC",
        ].join(" "),
      )
      .bind(importacaoId)
      .all<{
        id: string;
        data_operacao: string | null;
        ticker: string;
        nome: string | null;
        categoria: CategoriaAtivo;
        plataforma: string;
        quantidade: number | null;
        valor: number;
        ticker_canonico: string | null;
        nome_canonico: string | null;
        identificador_canonico: string | null;
        cnpj_fundo: string | null;
        isin: string | null;
        aliases_json: string | null;
        status: "ok" | "conflito" | "erro";
        observacao: string | null;
      }>();
    return (result.results ?? []).map(mapRowToItem);
  }

  async confirmarItens(importacaoId: string, usuarioId: string, itensValidos: number[]): Promise<{ itensConfirmados: number; itensIgnorados: number }> {
    const itens = await this.listarItens(importacaoId);
    const selecionados = itens.filter((item) => item.status === "ok" && itensValidos.includes(item.linha));
    const statements = selecionados.map((item) =>
      this.db
        .prepare(
          [
            "INSERT INTO ativos",
            "(",
            "id, usuario_id, ticker, nome, categoria, plataforma, quantidade, preco_medio, valor_atual, participacao, retorno_12m,",
            "ticker_canonico, nome_canonico, identificador_canonico, cnpj_fundo, isin, aliases_json",
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ].join(" "),
        )
        .bind(
          crypto.randomUUID(),
          usuarioId,
          item.ticker,
          item.nome || item.ticker,
          item.categoria,
          item.plataforma,
          item.quantidade || 1,
          item.valor,
          item.valor,
          0,
          0,
          item.tickerCanonico ?? null,
          item.nomeCanonico ?? null,
          item.identificadorCanonico ?? null,
          item.cnpjFundo ?? null,
          item.isin ?? null,
          item.aliases ? JSON.stringify(item.aliases) : null,
        ),
    );
    if (statements.length > 0) {
      await this.db.batch(statements);
    }

    await this.db.prepare("UPDATE importacoes SET status = 'confirmado' WHERE id = ?").bind(importacaoId).run();
    const itensConfirmados = selecionados.length;
    return { itensConfirmados, itensIgnorados: itens.length - itensConfirmados };
  }
}
