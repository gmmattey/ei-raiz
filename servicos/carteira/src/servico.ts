import type {
  AtivoResumo,
  CategoriaAtivo,
  ComparativoBenchmarkCarteira,
  DetalheCategoria,
  ResumoCarteira,
  ServicoCarteira,
} from "@ei/contratos";
import type { AtivoPersistido, FonteMercado, RepositorioCarteira } from "./repositorio";

const BOLSA_TTL_MIN = 10;
const FUNDOS_TTL_HOURS = 18;

type AtualizacaoMercado = {
  fonte: FonteMercado | "nenhuma";
  status: "atualizado" | "atrasado" | "indisponivel";
  precoAtual: number | null;
  variacaoPercentual: number | null;
  atualizadoEm: string | null;
};

type DependenciasServicoCarteira = {
  repositorio: RepositorioCarteira;
  fetchFn?: typeof fetch;
  brapiToken?: string;
  brapiBaseUrl?: string;
};

const nowIso = (): string => new Date().toISOString();
const toIsoOffset = (mins: number): string => new Date(Date.now() + mins * 60_000).toISOString();
const toIsoOffsetHours = (hours: number): string => new Date(Date.now() + hours * 3_600_000).toISOString();
const normalizarCnpj = (value: string): string => value.replace(/\D/g, "");
const pareceTickerListado = (ticker: string): boolean => /^[A-Z]{4}\d{1,2}$/.test(ticker) || /^[A-Z]{5}\d{1,2}$/.test(ticker) || /^\^[A-Z0-9.]+$/.test(ticker);
const normalizarPrecoMedioUnitario = (precoMedio: number, quantidade: number, valorAtual: number): number => {
  if (!Number.isFinite(precoMedio) || precoMedio <= 0) return 0;
  if (!Number.isFinite(quantidade) || quantidade <= 0) return precoMedio;
  const totalEstimadoComUnitario = precoMedio * quantidade;
  const valorReferencia = Number.isFinite(valorAtual) && valorAtual > 0 ? valorAtual : totalEstimadoComUnitario;
  const referenciaUnitaria = valorReferencia / quantidade;
  const erroRelativoUnitario = Math.abs(totalEstimadoComUnitario - valorReferencia) / Math.max(1, valorReferencia);
  const erroRelativoTotal = Math.abs(precoMedio - valorReferencia) / Math.max(1, valorReferencia);
  if (erroRelativoUnitario <= 0.05) return precoMedio;
  if (erroRelativoTotal <= 0.05) return precoMedio / quantidade;
  if (Number.isFinite(referenciaUnitaria) && referenciaUnitaria > 0) {
    const candidatos = [precoMedio, precoMedio / 10, precoMedio / 100, precoMedio / 1000, precoMedio / 10000];
    let melhor = precoMedio;
    let menorErro = Number.POSITIVE_INFINITY;
    for (const candidato of candidatos) {
      if (!Number.isFinite(candidato) || candidato <= 0) continue;
      const erro = Math.abs(candidato - referenciaUnitaria) / Math.max(1, referenciaUnitaria);
      if (erro < menorErro) {
        menorErro = erro;
        melhor = candidato;
      }
    }
    if (menorErro <= 0.35) return melhor;
  }
  return precoMedio;
};

export class ServicoCarteiraPadrao implements ServicoCarteira {
  private readonly fetchFn: typeof fetch;
  private readonly brapiToken: string | null;
  private readonly brapiBaseUrl: string;

  constructor(private readonly deps: DependenciasServicoCarteira) {
    this.fetchFn = deps.fetchFn ?? fetch;
    this.brapiToken = deps.brapiToken?.trim() || null;
    this.brapiBaseUrl = deps.brapiBaseUrl?.trim().replace(/\/+$/, "") || "https://brapi.dev/api";
  }

  async listarAtivos(usuarioId: string): Promise<AtivoResumo[]> {
    const ativos = await this.deps.repositorio.listarAtivos(usuarioId);
    const atualizados: AtivoResumo[] = [];

    for (const ativo of ativos) {
      const meta = await this.obterAtualizacaoMercado(ativo);
      const resumo = this.mapComAtualizacao(ativo, meta);
      if (meta.precoAtual !== null) {
        await this.deps.repositorio.atualizarValorAtivo(ativo.id, resumo.valorAtual, resumo.ganhoPerdaPercentual ?? 0);
      }
      atualizados.push(resumo);
    }

    const total = atualizados.reduce((acc, item) => acc + item.valorAtual, 0);
    return atualizados
      .map((item) => ({
        ...item,
        participacao: total > 0 ? Number(((item.valorAtual / total) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.valorAtual - a.valorAtual);
  }

  async obterResumo(usuarioId: string): Promise<ResumoCarteira> {
    const ativos = await this.deps.repositorio.listarAtivos(usuarioId);
    let patrimonioTotal = 0;
    let custoTotalAcumulado = 0;
    let todosComBaseCusto = true;

    for (const ativo of ativos) {
      const meta = await this.obterAtualizacaoMercado(ativo);
      const precoAtual = meta.precoAtual ?? ativo.valorAtual / ativo.quantidade;
      
      const valorMercadoAtual = precoAtual * ativo.quantidade;
      const precoMedioUnitario = normalizarPrecoMedioUnitario(ativo.precoMedio, ativo.quantidade, ativo.valorAtual);
      const custoAquisicao = precoMedioUnitario * ativo.quantidade;
      if (!(Number.isFinite(ativo.precoMedio) && ativo.precoMedio > 0)) {
        todosComBaseCusto = false;
      }

      patrimonioTotal += valorMercadoAtual;
      custoTotalAcumulado += custoAquisicao;
    }

    const retornoDisponivel = ativos.length > 0 && todosComBaseCusto;
    const retornoTotal = retornoDisponivel && custoTotalAcumulado > 0
      ? ((patrimonioTotal - custoTotalAcumulado) / custoTotalAcumulado) * 100 
      : 0;

    return {
      patrimonioTotal: Number(patrimonioTotal.toFixed(2)),
      retorno12m: Number(retornoTotal.toFixed(2)),
      retornoDisponivel,
      motivoRetornoIndisponivel: retornoDisponivel ? undefined : "Retorno indisponível — importe seu histórico para calcular",
      // Score agora reflete a saúde da rentabilidade real (70 base + ajuste de performance)
      score: patrimonioTotal > 0 ? Math.max(0, Math.min(100, Math.round(70 + (retornoTotal / 2)))) : 0,
      quantidadeAtivos: ativos.length,
    };
  }

  async obterDetalhePorCategoria(usuarioId: string, categoria: CategoriaAtivo): Promise<DetalheCategoria> {
    const ativos = await this.listarAtivos(usuarioId);
    const itens = ativos.filter((item) => item.categoria === categoria);
    const valorTotal = itens.reduce((acc, item) => acc + item.valorAtual, 0);
    const totalCarteira = ativos.reduce((acc, item) => acc + item.valorAtual, 0);

    return {
      categoria,
      valorTotal,
      participacao: totalCarteira > 0 ? Number(((valorTotal / totalCarteira) * 100).toFixed(2)) : 0,
      ativos: itens,
    };
  }

  async obterComparativoBenchmark(usuarioId: string, periodoMeses: number): Promise<ComparativoBenchmarkCarteira> {
    const meses = Number.isFinite(periodoMeses) ? Math.max(3, Math.min(24, Math.floor(periodoMeses))) : 12;
    const snapshots = await this.deps.repositorio.listarSnapshotsPatrimonio(usuarioId, Math.max(meses, 12));
    const serieCarteira = [...snapshots].reverse().map((item) => ({ data: item.data, valor: item.valorTotal }));
    const baseCarteira = serieCarteira[0]?.valor ?? 0;
    const serieCarteiraNormalizada = serieCarteira.map((item) => ({
      data: item.data,
      carteira: baseCarteira > 0 ? Number(((item.valor / baseCarteira) * 100).toFixed(4)) : 100,
    }));

    const comparativoCDI = await this.obterSerieCDI(meses);
    const datas = new Set<string>([
      ...serieCarteiraNormalizada.map((item) => item.data),
      ...comparativoCDI.serie.map((item) => item.data),
    ]);

    const carteiraMap = new Map(serieCarteiraNormalizada.map((item) => [item.data, item.carteira]));
    const cdiMap = new Map(comparativoCDI.serie.map((item) => [item.data, item.valor]));

    let lastCarteira = 100;
    let lastCDI = 100;
    const serie = Array.from(datas)
      .sort((a, b) => (a < b ? -1 : 1))
      .map((data) => {
        const c = carteiraMap.get(data);
        if (typeof c === "number") lastCarteira = c;
        const d = cdiMap.get(data);
        if (typeof d === "number") lastCDI = d;
        return { data, carteira: Number(lastCarteira.toFixed(4)), cdi: Number(lastCDI.toFixed(4)) };
      });

    const ultimoCarteira = serie[serie.length - 1]?.carteira ?? 100;
    const ultimoCDI = serie[serie.length - 1]?.cdi ?? 100;
    const carteiraRetornoPeriodo = Number((ultimoCarteira - 100).toFixed(2));
    const cdiRetornoPeriodo = Number((ultimoCDI - 100).toFixed(2));

    return {
      periodoMeses: meses,
      carteiraRetornoPeriodo,
      cdiRetornoPeriodo,
      excessoRetorno: Number((carteiraRetornoPeriodo - cdiRetornoPeriodo).toFixed(2)),
      fonteBenchmark: comparativoCDI.fonte,
      statusAtualizacaoBenchmark: comparativoCDI.status,
      atualizadoEmBenchmark: comparativoCDI.atualizadoEm,
      serie,
    };
  }

  private async obterAtualizacaoMercado(ativo: AtivoPersistido): Promise<AtualizacaoMercado> {
    const tickerListado = (ativo.tickerCanonico || ativo.ticker)?.toUpperCase();
    const tickerComCaraDeBolsa = !!tickerListado && pareceTickerListado(tickerListado);
    const deveUsarBrapi =
      !!tickerListado &&
      (ativo.categoria === "acao" ||
        tickerComCaraDeBolsa ||
        (ativo.categoria === "fundo" && !(ativo.cnpjFundo && normalizarCnpj(ativo.cnpjFundo).length > 0)));
    if (deveUsarBrapi && tickerListado) {
      return this.obterCotacaoComCache("brapi", tickerListado);
    }
    if (ativo.categoria === "fundo" && ativo.cnpjFundo) {
      return this.obterCotacaoComCache("cvm", normalizarCnpj(ativo.cnpjFundo));
    }
    return {
      fonte: "nenhuma",
      status: "indisponivel",
      precoAtual: null,
      variacaoPercentual: null,
      atualizadoEm: null,
    };
  }

  private mapComAtualizacao(ativo: AtivoPersistido, meta: AtualizacaoMercado): AtivoResumo {
    const precoMedioUnitario = normalizarPrecoMedioUnitario(ativo.precoMedio, ativo.quantidade, ativo.valorAtual);
    const precoAtual = meta.precoAtual;
    const custoTotal = precoMedioUnitario * ativo.quantidade;
    const valorAtual = precoAtual !== null ? precoAtual * ativo.quantidade : ativo.valorAtual;
    const ganhoPerda = valorAtual - custoTotal;
    const ganhoPerdaPercentual = custoTotal > 0 ? (ganhoPerda / custoTotal) * 100 : 0;

    return {
      id: ativo.id,
      ticker: ativo.ticker,
      nome: ativo.nome,
      categoria: ativo.categoria,
      plataforma: ativo.plataforma ?? "",
      quantidade: ativo.quantidade,
      precoMedio: Number(precoMedioUnitario.toFixed(8)),
      preco_medio: Number(precoMedioUnitario.toFixed(8)),
      precoAtual: precoAtual ?? undefined,
      variacaoPercentual: meta.variacaoPercentual ?? undefined,
      ganhoPerda,
      ganhoPerdaPercentual: Number(ganhoPerdaPercentual.toFixed(2)),
      ultimaAtualizacao: meta.atualizadoEm ?? undefined,
      fontePreco: meta.fonte,
      statusAtualizacao: meta.status,
      dataCadastro: ativo.dataCadastro ?? undefined,
      dataAquisicao: (ativo.dataAquisicao ?? ativo.dataCadastro) ?? undefined,
      valorAtual: Number(valorAtual.toFixed(2)),
      participacao: ativo.participacao ?? 0,
      retorno12m: Number(ganhoPerdaPercentual.toFixed(2)),
    };
  }

  private async obterCotacaoComCache(fonte: FonteMercado, chaveAtivo: string): Promise<AtualizacaoMercado> {
    const cacheKeyPrimaria = fonte === "brapi" ? `quote:${chaveAtivo.toUpperCase()}` : chaveAtivo;
    const cache = (await this.deps.repositorio.lerCacheValido(fonte, cacheKeyPrimaria, nowIso()))
      ?? (fonte === "brapi" ? await this.deps.repositorio.lerCacheValido(fonte, chaveAtivo, nowIso()) : null);
    if (cache) {
      return {
        fonte,
        status: "atualizado",
        precoAtual: cache.precoAtual,
        variacaoPercentual: cache.variacaoPercentual,
        atualizadoEm: cache.atualizadoEm,
      };
    }

    try {
      const resultado = fonte === "brapi" ? await this.buscarBrapi(chaveAtivo) : await this.buscarCvm(chaveAtivo);
      const atualizadoEm = nowIso();
      const expiraEm = fonte === "brapi" ? toIsoOffset(BOLSA_TTL_MIN) : toIsoOffsetHours(FUNDOS_TTL_HOURS);
      await this.deps.repositorio.salvarCache(
        fonte,
        cacheKeyPrimaria,
        resultado.precoAtual,
        resultado.variacaoPercentual,
        resultado.payload,
        atualizadoEm,
        expiraEm,
        null,
      );

      return {
        fonte,
        status: resultado.precoAtual !== null ? "atualizado" : "atrasado",
        precoAtual: resultado.precoAtual,
        variacaoPercentual: resultado.variacaoPercentual,
        atualizadoEm,
      };
    } catch (error) {
      const fallback = (await this.deps.repositorio.lerUltimoCache(fonte, cacheKeyPrimaria))
        ?? (fonte === "brapi" ? await this.deps.repositorio.lerUltimoCache(fonte, chaveAtivo) : null);
      await this.deps.repositorio.salvarCache(
        fonte,
        cacheKeyPrimaria,
        fallback?.precoAtual ?? null,
        fallback?.variacaoPercentual ?? null,
        fallback?.payload ?? null,
        nowIso(),
        fonte === "brapi" ? toIsoOffset(2) : toIsoOffsetHours(2),
        error instanceof Error ? error.message : "ERRO_DESCONHECIDO",
      );
      if (fallback) {
        return {
          fonte,
          status: "atrasado",
          precoAtual: fallback.precoAtual,
          variacaoPercentual: fallback.variacaoPercentual,
          atualizadoEm: fallback.atualizadoEm,
        };
      }
      return {
        fonte,
        status: "indisponivel",
        precoAtual: null,
        variacaoPercentual: null,
        atualizadoEm: null,
      };
    }
  }

  private async buscarBrapi(ticker: string): Promise<{ precoAtual: number | null; variacaoPercentual: number | null; payload: unknown }> {
    const url = new URL(`${this.brapiBaseUrl}/quote/${encodeURIComponent(ticker)}`);
    if (this.brapiToken) url.searchParams.set("token", this.brapiToken);
    const response = await this.fetchFn(url.toString(), {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`BRAPI_HTTP_${response.status}`);
    const data = (await response.json()) as {
      results?: Array<{
        regularMarketPrice?: number;
        regularMarketChangePercent?: number;
      }>;
    };
    const first = data.results?.[0];
    return {
      precoAtual: typeof first?.regularMarketPrice === "number" ? first.regularMarketPrice : null,
      variacaoPercentual: typeof first?.regularMarketChangePercent === "number" ? first.regularMarketChangePercent : null,
      payload: data,
    };
  }

  /**
   * Busca a cota diária de um fundo via CVM (inf_diario_fi_YYYYMM.csv).
   * Tenta o mês atual e, em caso de falha (arquivo ainda não publicado), tenta o mês anterior.
   * O arquivo é lido via streaming para evitar carregar dezenas de MB em memória.
   */
  private async buscarCvm(cnpj: string): Promise<{ precoAtual: number | null; variacaoPercentual: number | null; payload: unknown }> {
    const resultado = await this.buscarCotaCvmDiaria(cnpj);
    if (resultado !== null) return resultado;
    throw new Error("CVM_COTA_NAO_ENCONTRADA");
  }

  private async buscarCotaCvmDiaria(cnpj: string): Promise<{ precoAtual: number | null; variacaoPercentual: number | null; payload: unknown } | null> {
    const tentativas = this.gerarUrlsCvmDiaria();
    for (const url of tentativas) {
      try {
        const resultado = await this.lerCotaCvmStream(url, cnpj);
        if (resultado !== null) return resultado;
      } catch {
        // tenta próxima URL
      }
    }
    return null;
  }

  /** Gera as URLs do arquivo CVM para o mês atual e o anterior. */
  private gerarUrlsCvmDiaria(): string[] {
    const agora = new Date();
    const urls: string[] = [];
    for (let delta = 0; delta <= 1; delta++) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - delta, 1);
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      urls.push(`https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO_FI/DADOS/inf_diario_fi_${ano}${mes}.csv`);
    }
    return urls;
  }

  /**
   * Lê o CSV CVM via streaming em chunks de texto, procurando o CNPJ sem
   * carregar o arquivo inteiro na memória. Retorna a cota mais recente ou null.
   */
  private async lerCotaCvmStream(url: string, cnpj: string): Promise<{ precoAtual: number | null; variacaoPercentual: number | null; payload: unknown } | null> {
    const response = await this.fetchFn(url, { method: "GET", headers: { accept: "text/plain" } });
    if (!response.ok) throw new Error(`CVM_DIARIO_HTTP_${response.status}`);
    if (!response.body) throw new Error("CVM_DIARIO_SEM_BODY");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("latin1");
    let buffer = "";
    let cabecalho: string[] | null = null;
    let idxCnpj = -1;
    let idxData = -1;
    let idxCota = -1;
    let melhorData = "";
    let melhorCota: number | null = null;
    let cotaAnterior: number | null = null;

    const processarLinha = (linha: string): void => {
      if (!linha.trim()) return;
      const cols = linha.split(";");
      if (cabecalho === null) {
        cabecalho = cols.map((c) => c.replace(/"/g, "").trim().toUpperCase());
        idxCnpj = cabecalho.indexOf("CNPJ_FUNDO");
        idxData = cabecalho.indexOf("DT_COMPTC");
        idxCota = cabecalho.indexOf("VL_QUOTA");
        return;
      }
      if (idxCnpj < 0 || idxData < 0 || idxCota < 0) return;
      const cnpjLinha = normalizarCnpj((cols[idxCnpj] ?? "").replace(/"/g, ""));
      if (cnpjLinha !== cnpj) return;
      const data = (cols[idxData] ?? "").trim();
      const cotaStr = (cols[idxCota] ?? "").replace(",", ".").trim();
      const cota = Number.parseFloat(cotaStr);
      if (!Number.isFinite(cota) || cota <= 0) return;
      if (data > melhorData) {
        cotaAnterior = melhorCota;
        melhorData = data;
        melhorCota = cota;
      }
    };

    // Limite de segurança: até 30 MB de dados lidos para evitar travamento em Workers
    const MAX_BYTES = 30 * 1024 * 1024;
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        buffer += decoder.decode(value, { stream: true });
        const linhas = buffer.split(/\r?\n/);
        buffer = linhas.pop() ?? "";
        for (const linha of linhas) processarLinha(linha);
        if (totalBytes >= MAX_BYTES) break;
      }
      if (buffer) processarLinha(buffer);
    } finally {
      reader.cancel().catch(() => undefined);
    }

    if (melhorCota === null) return null;

    const variacaoPercentual = cotaAnterior !== null && cotaAnterior > 0
      ? ((melhorCota - cotaAnterior) / cotaAnterior) * 100
      : null;

    return {
      precoAtual: melhorCota,
      variacaoPercentual,
      payload: { cnpj, data: melhorData, cota: melhorCota },
    };
  }

  private async obterSerieCDI(
    periodoMeses: number,
  ): Promise<{ serie: Array<{ data: string; valor: number }>; fonte: string; status: "atualizado" | "atrasado" | "indisponivel"; atualizadoEm: string | null }> {
    const fim = new Date();
    const inicio = new Date();
    inicio.setMonth(fim.getMonth() - periodoMeses);

    const d2 = `${String(fim.getDate()).padStart(2, "0")}/${String(fim.getMonth() + 1).padStart(2, "0")}/${fim.getFullYear()}`;
    const d1 = `${String(inicio.getDate()).padStart(2, "0")}/${String(inicio.getMonth() + 1).padStart(2, "0")}/${inicio.getFullYear()}`;

    const parseBCBDate = (value: string): string => {
      const [day, month, year] = value.split("/");
      return `${year}-${month}-${day}`;
    };

    try {
      const response = await this.fetchFn(
        `https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados?formato=json&dataInicial=${encodeURIComponent(d1)}&dataFinal=${encodeURIComponent(d2)}`,
      );
      if (!response.ok) throw new Error(`BCB_CDI_HTTP_${response.status}`);
      const data = (await response.json()) as Array<{ data: string; valor: string }>;
      if (!Array.isArray(data) || data.length === 0) throw new Error("BCB_CDI_EMPTY");

      let acumulado = 100;
      const serie = data.map((item) => {
        const taxa = Number.parseFloat(String(item.valor).replace(",", "."));
        if (Number.isFinite(taxa)) acumulado *= 1 + taxa / 100;
        return { data: parseBCBDate(item.data), valor: Number(acumulado.toFixed(4)) };
      });
      return { serie, fonte: "bcb_sgs_4389", status: "atualizado", atualizadoEm: new Date().toISOString() };
    } catch {
      try {
        const response = await this.fetchFn(
          `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${encodeURIComponent(d1)}&dataFinal=${encodeURIComponent(d2)}`,
        );
        if (!response.ok) throw new Error(`BCB_SELIC_HTTP_${response.status}`);
        const data = (await response.json()) as Array<{ data: string; valor: string }>;
        if (!Array.isArray(data) || data.length === 0) throw new Error("BCB_SELIC_EMPTY");

        let acumulado = 100;
        const serie = data.map((item) => {
          const taxa = Number.parseFloat(String(item.valor).replace(",", "."));
          if (Number.isFinite(taxa)) acumulado *= 1 + taxa / 100;
          return { data: parseBCBDate(item.data), valor: Number(acumulado.toFixed(4)) };
        });
        return { serie, fonte: "bcb_sgs_12_proxy", status: "atrasado", atualizadoEm: new Date().toISOString() };
      } catch {
        return { serie: [], fonte: "indisponivel", status: "indisponivel", atualizadoEm: null };
      }
    }
  }
}
