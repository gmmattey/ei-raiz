import type {
  CategoriaAtivo,
  ConfirmacaoImportacao,
  ItemImportacao,
  PreviewImportacao,
  ServicoImportacao,
  UploadExtrato,
} from "@ei/contratos";
import type { ParserExtrato } from "./parsers/tipos";
import { ErroImportacao } from "./erros";
import { normalizarIdentidadeAtivo } from "./normalizacao-ativos";
import type { RepositorioImportacao } from "./repositorio";

const categoriasValidas = new Set<CategoriaAtivo>(["acao", "fundo", "previdencia", "renda_fixa"]);
const regexTickerAcao = /^[A-Z]{4,5}\d{1,2}$/;
const regexTickerFundo = /^[A-Z0-9]{4,12}$/;

type ServicoDeps = {
  repositorio: RepositorioImportacao;
  db: D1Database;
  parsers: ParserExtrato[];
};

export class ServicoImportacaoPadrao implements ServicoImportacao {
  constructor(private readonly deps: ServicoDeps) {}

  async gerarPreview(upload: UploadExtrato): Promise<PreviewImportacao> {
    const parser = this.encontrarParser(upload);
    const buffer = new TextEncoder().encode(upload.conteudo).buffer as ArrayBuffer;
    const brutos = parser.processar(buffer);

    const itens = await Promise.all(brutos.map((item) => this.validarItem(upload.usuarioId, item)));
    const preview = this.montarPreview(crypto.randomUUID(), itens);

    await this.deps.repositorio.criarImportacao({
      id: preview.importacaoId,
      usuarioId: upload.usuarioId,
      arquivoNome: upload.nomeArquivo,
    });
    await this.deps.repositorio.salvarItens(preview.importacaoId, preview.itens);
    await this.deps.repositorio.atualizarResumo(preview.importacaoId, preview);

    return preview;
  }

  async obterPreview(importacaoId: string): Promise<PreviewImportacao> {
    const preview = await this.deps.repositorio.obterPreview(importacaoId);
    if (!preview) {
      throw new ErroImportacao("IMPORTACAO_NAO_ENCONTRADA", 404, "Importação não encontrada");
    }
    return preview;
  }

  async confirmarImportacao(importacaoId: string, itensValidos: number[]): Promise<ConfirmacaoImportacao> {
    const preview = await this.obterPreview(importacaoId);
    const importacao = await this.deps.db
      .prepare("SELECT usuario_id FROM importacoes WHERE id = ?")
      .bind(importacaoId)
      .first<{ usuario_id: string }>();

    if (!importacao) throw new ErroImportacao("IMPORTACAO_NAO_ENCONTRADA", 404, "Importação não encontrada");

    const existentes = new Set(preview.itens.filter((i) => i.status === "ok").map((i) => i.linha));
    const linhasValidas = itensValidos.filter((linha) => existentes.has(linha));

    const resultado = await this.deps.repositorio.confirmarItens(importacaoId, importacao.usuario_id, linhasValidas);
    return {
      importacaoId,
      itensConfirmados: resultado.itensConfirmados,
      itensIgnorados: resultado.itensIgnorados,
    };
  }

  private encontrarParser(upload: UploadExtrato): ParserExtrato {
    if ((upload.tipoArquivo ?? "").toLowerCase() !== "csv") {
      throw new ErroImportacao("ARQUIVO_TIPO_INVALIDO", 422, "Tipo de arquivo inválido. Envie um CSV.");
    }
    const buffer = new TextEncoder().encode(upload.conteudo).buffer as ArrayBuffer;
    const parser = this.deps.parsers.find((item) => item.detectar(buffer));
    if (!parser) {
      throw new ErroImportacao(
        "ARQUIVO_FORA_PADRAO",
        422,
        "Arquivo fora do padrão esperado. Use o template CSV do Esquilo.",
      );
    }
    return parser;
  }

  private montarPreview(importacaoId: string, itens: ItemImportacao[]): PreviewImportacao {
    const validos = itens.filter((item) => item.status === "ok").length;
    const conflitos = itens.filter((item) => item.status === "conflito").length;
    const erros = itens.filter((item) => item.status === "erro").length;
    return {
      importacaoId,
      totalLinhas: itens.length,
      validos,
      conflitos,
      erros,
      itens,
    };
  }

  private async validarItem(
    usuarioId: string,
    item: {
      linha: number;
      dataOperacao: string;
      ticker: string;
      nome: string;
      categoria: string;
      plataforma: string;
      quantidade: number;
      valor: number;
    },
  ): Promise<ItemImportacao> {
    const categoria = item.categoria as CategoriaAtivo;

    if (!item.dataOperacao || Number.isNaN(Date.parse(item.dataOperacao))) {
      return { ...item, categoria: categoriasValidas.has(categoria) ? categoria : "acao", status: "erro", observacao: "data inválida (use AAAA-MM-DD)" };
    }
    if (!Number.isFinite(item.valor) || item.valor <= 0) {
      return { ...item, categoria: categoriasValidas.has(categoria) ? categoria : "acao", status: "erro", observacao: "valor inválido (deve ser maior que zero)" };
    }
    if (!categoriasValidas.has(categoria)) {
      return {
        ...item,
        categoria: "acao",
        status: "erro",
        observacao: "categoria inválida (use: acao, fundo, previdencia ou renda_fixa)",
      };
    }
    const identidade = normalizarIdentidadeAtivo({
      ticker: item.ticker,
      nome: item.nome,
      categoria,
    });
    if (!identidade.identificadorCanonico) {
      return { ...item, categoria, status: "erro", observacao: "identificação canônica inválida" };
    }
    if (!identidade.tickerCanonico && !identidade.cnpjFundo && !identidade.isin && !item.nome.trim()) {
      return { ...item, categoria, status: "erro", observacao: "ativo sem chave de identificação" };
    }
    if (categoria === "acao" && (!identidade.tickerCanonico || !regexTickerAcao.test(identidade.tickerCanonico))) {
      return {
        ...item,
        categoria,
        status: "erro",
        observacao: "ticker não reconhecido para ação (ex.: PETR4, VALE3)",
      };
    }
    if (
      categoria === "fundo" &&
      !identidade.cnpjFundo &&
      !identidade.isin &&
      (!identidade.tickerCanonico || !regexTickerFundo.test(identidade.tickerCanonico))
    ) {
      return {
        ...item,
        categoria,
        status: "erro",
        observacao: "ticker/CNPJ de fundo não reconhecido",
      };
    }

    const conflito = await this.deps.db
      .prepare(
        [
          "SELECT id FROM ativos",
          "WHERE usuario_id = ?",
          "AND (",
          "  identificador_canonico = ?",
          "  OR ticker = ?",
          "  OR (? IS NOT NULL AND ticker_canonico = ?)",
          "  OR (? IS NOT NULL AND cnpj_fundo = ?)",
          "  OR (? IS NOT NULL AND isin = ?)",
          ")",
          "LIMIT 1",
        ].join(" "),
      )
      .bind(
        usuarioId,
        identidade.identificadorCanonico,
        item.ticker,
        identidade.tickerCanonico,
        identidade.tickerCanonico,
        identidade.cnpjFundo,
        identidade.cnpjFundo,
        identidade.isin,
        identidade.isin,
      )
      .first<{ id: string }>();

    if (conflito) {
      return {
        ...item,
        categoria,
        tickerCanonico: identidade.tickerCanonico ?? undefined,
        nomeCanonico: identidade.nomeCanonico,
        identificadorCanonico: identidade.identificadorCanonico,
        cnpjFundo: identidade.cnpjFundo ?? undefined,
        isin: identidade.isin ?? undefined,
        aliases: identidade.aliases,
        status: "conflito",
        observacao: "ativo já existe na carteira (conflito de identificação)",
      };
    }
    return {
      ...item,
      categoria,
      tickerCanonico: identidade.tickerCanonico ?? undefined,
      nomeCanonico: identidade.nomeCanonico,
      identificadorCanonico: identidade.identificadorCanonico,
      cnpjFundo: identidade.cnpjFundo ?? undefined,
      isin: identidade.isin ?? undefined,
      aliases: identidade.aliases,
      status: "ok",
    };
  }
}
