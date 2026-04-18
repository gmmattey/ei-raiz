import type {
  AbaImportacao,
  CategoriaAtivo,
  CategoriaImportacao,
  ConfirmacaoImportacao,
  ItemAcaoBruto,
  ItemFundoBruto,
  ItemImportacao,
  ItemImovelBruto,
  ItemPoupancaBruto,
  ItemVeiculoBruto,
  PreviewImportacao,
  ServicoImportacao,
  UploadExtrato,
  UploadPatrimonioXlsx,
} from "@ei/contratos";
import type { ParserExtrato } from "./parsers/tipos";
import { ErroImportacao } from "./erros";
import { normalizarIdentidadeAtivo } from "./normalizacao-ativos";
import type { RepositorioImportacao } from "./repositorio";

const categoriasAtivo = new Set<CategoriaAtivo>(["acao", "fundo", "previdencia", "renda_fixa"]);
const regexTickerAcao = /^[A-Z]{4,5}\d{1,2}$/;
const regexTickerFundo = /^[A-Z0-9]{4,12}$/;
const colunasEsperadasCsv = ["data", "ticker", "nome", "categoria", "plataforma", "quantidade", "valor"];

type ServicoDeps = {
  repositorio: RepositorioImportacao;
  db: D1Database;
  parsers: ParserExtrato[];
};

export class ServicoImportacaoPadrao implements ServicoImportacao {
  constructor(private readonly deps: ServicoDeps) {}

  async gerarPreview(upload: UploadExtrato | UploadPatrimonioXlsx): Promise<PreviewImportacao> {
    if (upload.tipoArquivo === "xlsx") {
      return this.gerarPreviewXlsx(upload);
    }
    return this.gerarPreviewCsv(upload);
  }

  // --------- CSV (legado) ---------
  private async gerarPreviewCsv(upload: UploadExtrato): Promise<PreviewImportacao> {
    const parser = this.encontrarParser(upload);
    const buffer = new TextEncoder().encode(upload.conteudo).buffer as ArrayBuffer;
    const brutos = parser.processar(buffer);

    const itens = await Promise.all(
      brutos.map((item) =>
        this.validarItemAtivo(upload.usuarioId, {
          linha: item.linha,
          abaOrigem: mapCategoriaToAba(item.categoria as CategoriaAtivo),
          ticker: item.ticker,
          nome: item.nome,
          categoria: item.categoria as CategoriaAtivo,
          plataforma: item.plataforma,
          quantidade: item.quantidade,
          valor: item.valor,
          dataOperacao: item.dataOperacao,
          status: "ok",
        }),
      ),
    );

    return this.salvarERetornarPreview(upload.usuarioId, upload.nomeArquivo, itens);
  }

  // --------- XLSX (novo) ---------
  private async gerarPreviewXlsx(upload: UploadPatrimonioXlsx): Promise<PreviewImportacao> {
    const itens = await Promise.all(
      upload.itens.map((item, idx) => {
        const linha = item.linha ?? idx + 1;
        switch (item.aba) {
          case "acoes":
            return this.validarAcao(upload.usuarioId, item as ItemAcaoBruto, linha);
          case "fundos":
            return this.validarFundo(upload.usuarioId, item as ItemFundoBruto, linha);
          case "imoveis":
            return this.validarImovel(upload.usuarioId, item as ItemImovelBruto, linha);
          case "veiculos":
            return this.validarVeiculo(upload.usuarioId, item as ItemVeiculoBruto, linha);
          case "poupanca":
            return this.validarPoupanca(upload.usuarioId, item as ItemPoupancaBruto, linha);
        }
      }),
    );

    return this.salvarERetornarPreview(upload.usuarioId, upload.nomeArquivo, itens);
  }

  private async salvarERetornarPreview(
    _usuarioId: string,
    nomeArquivo: string,
    itens: ItemImportacao[],
  ): Promise<PreviewImportacao> {
    const importacaoId = crypto.randomUUID();
    const preview = this.montarPreview(importacaoId, itens);

    await this.deps.repositorio.criarImportacao({
      id: importacaoId,
      usuarioId: _usuarioId,
      arquivoNome: nomeArquivo,
    });
    await this.deps.repositorio.salvarItens(importacaoId, preview.itens);
    await this.deps.repositorio.atualizarResumo(importacaoId, preview);

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

  // --------- Validações por tipo ---------

  private async validarAcao(usuarioId: string, item: ItemAcaoBruto, linha: number): Promise<ItemImportacao> {
    const base: ItemImportacao = {
      linha,
      abaOrigem: "acoes",
      categoria: "acao",
      ticker: (item.ticker ?? "").toUpperCase(),
      nome: item.nome ?? item.ticker ?? "",
      plataforma: item.plataforma ?? "Importação",
      quantidade: Number(item.quantidade) || 0,
      valor: Number(item.precoMedio ?? 0) * Number(item.quantidade || 1) || Number(item.valorTotal ?? 0),
      dataOperacao: item.dataCompra,
      status: "ok",
    };

    if (!item.ticker?.trim()) {
      return { ...base, status: "erro", observacao: "ticker obrigatório para ação" };
    }
    if (!Number.isFinite(base.valor) || base.valor <= 0) {
      return { ...base, status: "erro", observacao: "valor inválido (preço médio ou valor total deve ser positivo)" };
    }

    return this.validarItemAtivo(usuarioId, base);
  }

  private async validarFundo(usuarioId: string, item: ItemFundoBruto, linha: number): Promise<ItemImportacao> {
    const ticker = (item.nome ?? "").toUpperCase().replace(/\s+/g, "").slice(0, 12);
    const valor = Number(item.valorAplicado ?? 0);

    const base: ItemImportacao = {
      linha,
      abaOrigem: "fundos",
      categoria: "fundo",
      ticker,
      nome: item.nome ?? "",
      plataforma: item.instituicao ?? "Importação",
      quantidade: 1,
      valor,
      dataOperacao: item.dataAplicacao,
      cnpjFundo: item.cnpj?.replace(/\D/g, ""),
      metadados: { tipo: item.tipo, cnpj: item.cnpj },
      status: "ok",
    };

    if (!item.nome?.trim()) {
      return { ...base, status: "erro", observacao: "nome do fundo obrigatório" };
    }
    if (!item.instituicao?.trim()) {
      return { ...base, status: "erro", observacao: "instituição obrigatória" };
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      return { ...base, status: "erro", observacao: "valor aplicado inválido (deve ser positivo)" };
    }

    return this.validarItemAtivo(usuarioId, base);
  }

  private async validarImovel(usuarioId: string, item: ItemImovelBruto, linha: number): Promise<ItemImportacao> {
    const valor = Number(item.valorEstimado ?? 0);

    const base: ItemImportacao = {
      linha,
      abaOrigem: "imoveis",
      categoria: "imovel",
      nome: item.descricao ?? "",
      valor,
      metadados: {
        tipo: item.tipo,
        saldoDevedor: item.saldoDevedor ?? 0,
        finalidade: item.finalidade,
        participacaoPercentual: item.participacaoPercentual ?? 100,
      },
      status: "ok",
    };

    if (!item.descricao?.trim()) {
      return { ...base, status: "erro", observacao: "descrição do imóvel obrigatória" };
    }
    if (!item.tipo?.trim()) {
      return { ...base, status: "erro", observacao: "tipo do imóvel obrigatório" };
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      return { ...base, status: "erro", observacao: "valor estimado inválido (deve ser positivo)" };
    }

    // Verificar duplicidade em posicoes_financeiras
    const conflito = await this.deps.db
      .prepare(
        "SELECT id FROM posicoes_financeiras WHERE usuario_id = ? AND tipo = 'imovel' AND nome = ? AND ativo = 1 LIMIT 1",
      )
      .bind(usuarioId, item.descricao.trim())
      .first<{ id: string }>();

    if (conflito) {
      return { ...base, status: "conflito", observacao: "imóvel já cadastrado com este nome" };
    }

    return base;
  }

  private async validarVeiculo(usuarioId: string, item: ItemVeiculoBruto, linha: number): Promise<ItemImportacao> {
    const valor = Number(item.valorReferencia ?? 0);
    const ano = Number(item.anoModelo ?? 0);
    const nome = `${item.montadora ?? ""} ${item.modelo ?? ""} ${ano || ""}`.trim();

    const base: ItemImportacao = {
      linha,
      abaOrigem: "veiculos",
      categoria: "veiculo",
      nome,
      valor,
      metadados: {
        tipo: item.tipo,
        montadora: item.montadora,
        modelo: item.modelo,
        anoModelo: ano,
        saldoDevedor: item.saldoDevedor ?? 0,
      },
      status: "ok",
    };

    if (!item.montadora?.trim() || !item.modelo?.trim()) {
      return { ...base, status: "erro", observacao: "montadora e modelo são obrigatórios" };
    }
    if (!ano || ano < 1900 || ano > 2100) {
      return { ...base, status: "erro", observacao: "ano do modelo inválido" };
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      return { ...base, status: "erro", observacao: "valor de referência inválido (deve ser positivo)" };
    }

    // Verificar duplicidade: montadora + modelo + ano
    const conflito = await this.deps.db
      .prepare(
        [
          "SELECT id FROM posicoes_financeiras",
          "WHERE usuario_id = ? AND tipo = 'veiculo' AND ativo = 1",
          "AND json_extract(metadata_json, '$.montadora') = ?",
          "AND json_extract(metadata_json, '$.modelo') = ?",
          "AND json_extract(metadata_json, '$.anoModelo') = ?",
          "LIMIT 1",
        ].join(" "),
      )
      .bind(usuarioId, item.montadora?.trim(), item.modelo?.trim(), ano)
      .first<{ id: string }>();

    if (conflito) {
      return { ...base, status: "conflito", observacao: "veículo já cadastrado (mesma montadora, modelo e ano)" };
    }

    return base;
  }

  private async validarPoupanca(usuarioId: string, item: ItemPoupancaBruto, linha: number): Promise<ItemImportacao> {
    const valor = Number(item.valorAtual ?? 0);

    const base: ItemImportacao = {
      linha,
      abaOrigem: "poupanca",
      categoria: "poupanca",
      nome: `Poupança ${item.instituicao ?? ""}`.trim(),
      plataforma: item.instituicao,
      valor,
      metadados: {
        instituicao: item.instituicao,
        titularidade: item.titularidade,
      },
      status: "ok",
    };

    if (!item.instituicao?.trim()) {
      return { ...base, status: "erro", observacao: "instituição obrigatória" };
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      return { ...base, status: "erro", observacao: "valor atual inválido (deve ser positivo)" };
    }

    // Verificar duplicidade: instituição
    const conflito = await this.deps.db
      .prepare(
        "SELECT id FROM posicoes_financeiras WHERE usuario_id = ? AND tipo = 'poupanca' AND ativo = 1 AND json_extract(metadata_json, '$.instituicao') = ? LIMIT 1",
      )
      .bind(usuarioId, item.instituicao.trim())
      .first<{ id: string }>();

    if (conflito) {
      return { ...base, status: "conflito", observacao: "poupança já cadastrada para esta instituição" };
    }

    return base;
  }

  // --------- Validação de ativos listados (ação/fundo/previdência/renda_fixa) ---------

  private async validarItemAtivo(usuarioId: string, item: ItemImportacao): Promise<ItemImportacao> {
    const categoria = item.categoria as CategoriaAtivo;

    if (item.dataOperacao && Number.isNaN(Date.parse(item.dataOperacao))) {
      return { ...item, status: "erro", observacao: "data inválida (use AAAA-MM-DD)" };
    }
    if (!Number.isFinite(item.valor) || item.valor <= 0) {
      return { ...item, status: "erro", observacao: "valor inválido (deve ser maior que zero)" };
    }
    if (!categoriasAtivo.has(categoria)) {
      return { ...item, status: "erro", observacao: "categoria inválida" };
    }

    const identidade = normalizarIdentidadeAtivo({
      ticker: item.ticker ?? "",
      nome: item.nome,
      categoria,
      cnpj: item.cnpjFundo,
    });

    if (!identidade.identificadorCanonico) {
      return { ...item, status: "erro", observacao: "identificação canônica inválida" };
    }
    if (
      categoria === "acao" &&
      (!identidade.tickerCanonico || !regexTickerAcao.test(identidade.tickerCanonico))
    ) {
      return { ...item, status: "erro", observacao: "ticker não reconhecido para ação (ex.: PETR4, VALE3)" };
    }
    if (
      categoria === "fundo" &&
      !identidade.cnpjFundo &&
      !identidade.isin &&
      (!identidade.tickerCanonico || !regexTickerFundo.test(identidade.tickerCanonico))
    ) {
      return { ...item, status: "erro", observacao: "ticker/CNPJ de fundo não reconhecido" };
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
        item.ticker ?? "",
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
      tickerCanonico: identidade.tickerCanonico ?? undefined,
      nomeCanonico: identidade.nomeCanonico,
      identificadorCanonico: identidade.identificadorCanonico,
      cnpjFundo: identidade.cnpjFundo ?? undefined,
      isin: identidade.isin ?? undefined,
      aliases: identidade.aliases,
      status: "ok",
    };
  }

  // --------- Helpers CSV ---------

  private encontrarParser(upload: UploadExtrato): ParserExtrato {
    if ((upload.tipoArquivo ?? "").toLowerCase() !== "csv") {
      throw new ErroImportacao("ARQUIVO_TIPO_INVALIDO", 422, "Tipo de arquivo inválido.");
    }
    const buffer = new TextEncoder().encode(upload.conteudo).buffer as ArrayBuffer;
    const parser = this.deps.parsers.find((p) => p.detectar(buffer));
    if (!parser) {
      const cabecalhoEncontrado = extrairCabecalho(upload.conteudo);
      throw new ErroImportacao(
        "ARQUIVO_FORA_PADRAO",
        422,
        `Cabeçalho encontrado: ${cabecalhoEncontrado || "(vazio)"}. Esperado: ${colunasEsperadasCsv.join(",")}`,
        { cabecalhoEncontrado, cabecalhoEsperado: colunasEsperadasCsv },
      );
    }
    return parser;
  }

  private montarPreview(importacaoId: string, itens: ItemImportacao[]): PreviewImportacao {
    const validos = itens.filter((i) => i.status === "ok").length;
    const conflitos = itens.filter((i) => i.status === "conflito").length;
    const erros = itens.filter((i) => i.status === "erro").length;
    return { importacaoId, totalLinhas: itens.length, validos, conflitos, erros, itens };
  }
}

function mapCategoriaToAba(categoria: CategoriaAtivo): AbaImportacao {
  if (categoria === "acao") return "acoes";
  if (categoria === "fundo") return "fundos";
  return "fundos";
}

function extrairCabecalho(conteudo: string): string {
  const primeiraLinha = conteudo.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  if (!primeiraLinha) return "";
  const delimitador = primeiraLinha.includes(";") ? ";" : ",";
  return primeiraLinha
    .split(delimitador)
    .map((coluna) => coluna.trim().toLowerCase())
    .join(",");
}
