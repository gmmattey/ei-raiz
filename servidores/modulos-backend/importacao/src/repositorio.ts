import type { CategoriaImportacao, ItemImportacao, PreviewImportacao } from "@ei/contratos";

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

// Categorias que vão para posicoes_financeiras (não para ativos)
const categoriaPatrimonio = new Set<CategoriaImportacao>(["imovel", "veiculo", "poupanca"]);

// Mapeamento de categoria → liquidez e risco para posicoes_financeiras
function metaPatrimonio(categoria: CategoriaImportacao): { liquidez: string; risco: string; categoriaPos: string } {
  switch (categoria) {
    case "imovel":
      return { liquidez: "baixa", risco: "baixo", categoriaPos: "patrimônio imobiliário" };
    case "veiculo":
      return { liquidez: "baixa", risco: "medio", categoriaPos: "bens móveis" };
    case "poupanca":
      return { liquidez: "imediata", risco: "baixo", categoriaPos: "reserva" };
    default:
      return { liquidez: "medio_prazo", risco: "medio", categoriaPos: "outros" };
  }
}

type RowItemImportacao = {
  id: string;
  data_operacao: string | null;
  ticker: string | null;
  nome: string | null;
  categoria: CategoriaImportacao;
  plataforma: string | null;
  quantidade: number | null;
  valor: number;
  ticker_canonico: string | null;
  nome_canonico: string | null;
  identificador_canonico: string | null;
  cnpj_fundo: string | null;
  isin: string | null;
  aliases_json: string | null;
  metadata_json: string | null;
  aba_origem: string | null;
  status: "ok" | "conflito" | "erro";
  observacao: string | null;
};

const mapRowToItem = (row: RowItemImportacao): ItemImportacao => {
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
  let metadados: Record<string, unknown> | undefined;
  if (row.metadata_json) {
    try {
      const parsed = JSON.parse(row.metadata_json) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        metadados = parsed as Record<string, unknown>;
      }
    } catch {
      metadados = undefined;
    }
  }
  return {
    linha,
    abaOrigem: (row.aba_origem as ItemImportacao["abaOrigem"]) ?? "fundos",
    dataOperacao: row.data_operacao ?? "",
    ticker: row.ticker ?? undefined,
    nome: row.nome ?? "",
    categoria: row.categoria,
    plataforma: row.plataforma ?? undefined,
    quantidade: row.quantidade ?? undefined,
    valor: row.valor ?? 0,
    tickerCanonico: row.ticker_canonico ?? undefined,
    nomeCanonico: row.nome_canonico ?? undefined,
    identificadorCanonico: row.identificador_canonico ?? undefined,
    cnpjFundo: row.cnpj_fundo ?? undefined,
    isin: row.isin ?? undefined,
    aliases,
    metadados,
    status: row.status,
    observacao: row.observacao ?? undefined,
  };
};

export class RepositorioImportacaoD1 implements RepositorioImportacao {
  constructor(private readonly db: D1Database) {}

  async criarImportacao(registro: RegistroImportacao): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO importacoes (id, usuario_id, arquivo_nome, status, total_linhas, conflitos, erros, validos) VALUES (?, ?, ?, 'pendente', 0, 0, 0, 0)",
      )
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
            "metadata_json, aba_origem,",
            "status, observacao",
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ].join(" "),
        )
        .bind(
          `item_${importacaoId}_${item.linha}`,
          importacaoId,
          item.dataOperacao ?? null,
          item.ticker ?? null,
          item.nome,
          item.categoria,
          item.plataforma ?? null,
          item.quantidade ?? null,
          item.valor,
          item.tickerCanonico ?? null,
          item.nomeCanonico ?? null,
          item.identificadorCanonico ?? null,
          item.cnpjFundo ?? null,
          item.isin ?? null,
          item.aliases ? JSON.stringify(item.aliases) : null,
          item.metadados ? JSON.stringify(item.metadados) : null,
          item.abaOrigem ?? null,
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
          "metadata_json, aba_origem,",
          "status, observacao",
          "FROM itens_importacao",
          "WHERE importacao_id = ?",
          "ORDER BY id ASC",
        ].join(" "),
      )
      .bind(importacaoId)
      .all<RowItemImportacao>();
    return (result.results ?? []).map(mapRowToItem);
  }

  async confirmarItens(
    importacaoId: string,
    usuarioId: string,
    itensValidos: number[],
  ): Promise<{ itensConfirmados: number; itensIgnorados: number }> {
    const itens = await this.listarItens(importacaoId);
    const selecionados = itens.filter((item) => item.status === "ok" && itensValidos.includes(item.linha));

    const ativosItems = selecionados.filter((item) => !categoriaPatrimonio.has(item.categoria));
    const patrimonioItems = selecionados.filter((item) => categoriaPatrimonio.has(item.categoria));

    const statements: D1PreparedStatement[] = [];

    // --- Ativos listados (ações, fundos, previdência, renda_fixa) → tabela ativos ---
    // Cada item confirmado também gera um registro em `aportes` (origem = "importacao")
    // com o valor investido e a data da operação — substitui o sinal indireto de
    // crescimento patrimonial por evidência transacional real.
    for (const item of ativosItems) {
      const quantidade = Number(item.quantidade || 1);
      const valorTotal = Number(item.valor || 0);
      const precoMedioUnitario = quantidade > 0 ? valorTotal / quantidade : valorTotal;
      const ativoId = crypto.randomUUID();
      const meta = (item.metadados ?? {}) as Record<string, unknown>;
      const isContratado = item.categoria === "renda_fixa" || item.categoria === "previdencia";
      const indexador = isContratado && typeof meta.indexador === "string" ? meta.indexador : null;
      const taxa = isContratado && Number.isFinite(Number(meta.taxa)) ? Number(meta.taxa) : null;
      const dataInicio =
        isContratado && typeof meta.dataInicio === "string" && meta.dataInicio.length > 0
          ? meta.dataInicio
          : null;
      const vencimento =
        isContratado && typeof meta.vencimento === "string" && meta.vencimento.length > 0
          ? meta.vencimento
          : null;
      statements.push(
        this.db
          .prepare(
            [
              "INSERT INTO ativos",
              "(",
              "id, usuario_id, ticker, nome, categoria, plataforma, quantidade, preco_medio, valor_atual, participacao, rentabilidade_desde_aquisicao_pct,",
              "ticker_canonico, nome_canonico, identificador_canonico, cnpj_fundo, isin, aliases_json, data_cadastro, data_aquisicao,",
              "indexador, taxa, data_inicio, vencimento",
              ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ].join(" "),
          )
          .bind(
            ativoId,
            usuarioId,
            item.ticker ?? null,
            item.nome || item.ticker || "Ativo",
            item.categoria,
            item.plataforma ?? null,
            quantidade,
            Number(precoMedioUnitario.toFixed(8)),
            Number(valorTotal.toFixed(2)),
            0,
            0,
            item.tickerCanonico ?? null,
            item.nomeCanonico ?? null,
            item.identificadorCanonico ?? null,
            item.cnpjFundo ?? null,
            item.isin ?? null,
            item.aliases ? JSON.stringify(item.aliases) : null,
            new Date().toISOString(),
            item.dataOperacao || new Date().toISOString().slice(0, 10),
            indexador,
            taxa,
            dataInicio,
            vencimento,
          ),
      );

      if (valorTotal > 0) {
        statements.push(
          this.db
            .prepare(
              "INSERT INTO aportes (id, usuario_id, ativo_id, valor, data_aporte, origem, observacao, criado_em) VALUES (?, ?, ?, ?, ?, 'importacao', ?, ?)",
            )
            .bind(
              crypto.randomUUID(),
              usuarioId,
              ativoId,
              Number(valorTotal.toFixed(2)),
              item.dataOperacao || new Date().toISOString().slice(0, 10),
              item.nome || item.ticker || null,
              new Date().toISOString(),
            ),
        );
      }
    }

    // --- Patrimônio (imóveis, veículos, poupança) → tabela posicoes_financeiras ---
    for (const item of patrimonioItems) {
      const meta = metaPatrimonio(item.categoria);
      const metadados = item.metadados ?? {};
      const valorAtual = Number(item.valor || 0);
      const custoAquisicao = valorAtual; // sem info de custo separado na importação

      statements.push(
        this.db
          .prepare(
            [
              "INSERT INTO posicoes_financeiras",
              "(id, usuario_id, tipo, nome, valor_atual, custo_aquisicao, liquidez, risco, categoria, metadata_json, ativo, criado_em, atualizado_em)",
              "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
            ].join(" "),
          )
          .bind(
            crypto.randomUUID(),
            usuarioId,
            item.categoria, // tipo: imovel | veiculo | poupanca
            item.nome,
            valorAtual,
            custoAquisicao,
            meta.liquidez,
            meta.risco,
            meta.categoriaPos,
            JSON.stringify(metadados),
            new Date().toISOString(),
            new Date().toISOString(),
          ),
      );
    }

    if (statements.length > 0) {
      await this.db.batch(statements);
    }

    await this.db.prepare("UPDATE importacoes SET status = 'confirmado' WHERE id = ?").bind(importacaoId).run();
    return { itensConfirmados: selecionados.length, itensIgnorados: itens.length - selecionados.length };
  }
}
