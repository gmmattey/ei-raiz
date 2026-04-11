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
};

const nowIso = (): string => new Date().toISOString();
const toIsoOffset = (mins: number): string => new Date(Date.now() + mins * 60_000).toISOString();
const toIsoOffsetHours = (hours: number): string => new Date(Date.now() + hours * 3_600_000).toISOString();
const normalizarCnpj = (value: string): string => value.replace(/\D/g, "");

export class ServicoCarteiraPadrao implements ServicoCarteira {
  private readonly fetchFn: typeof fetch;

  constructor(private readonly deps: DependenciasServicoCarteira) {
    this.fetchFn = deps.fetchFn ?? fetch;
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

    for (const ativo of ativos) {
      const meta = await this.obterAtualizacaoMercado(ativo);
      const precoAtual = meta.precoAtual ?? ativo.valorAtual / ativo.quantidade;
      
      const valorMercadoAtual = precoAtual * ativo.quantidade;
      const custoAquisicao = ativo.precoMedio * ativo.quantidade;

      patrimonioTotal += valorMercadoAtual;
      custoTotalAcumulado += custoAquisicao;
    }

    const retornoTotal = custoTotalAcumulado > 0 
      ? ((patrimonioTotal - custoTotalAcumulado) / custoTotalAcumulado) * 100 
      : 0;

    return {
      patrimonioTotal: Number(patrimonioTotal.toFixed(2)),
      retorno12m: Number(retornoTotal.toFixed(2)),
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
    if (ativo.categoria === "acao" && (ativo.tickerCanonico || ativo.ticker)) {
      return this.obterCotacaoComCache("brapi", (ativo.tickerCanonico || ativo.ticker).toUpperCase());
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
    const precoAtual = meta.precoAtual;
    const custoTotal = ativo.precoMedio * ativo.quantidade;
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
      precoMedio: ativo.precoMedio,
      preco_medio: ativo.precoMedio,
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
      retorno12m: ativo.retorno12m ?? 0,
    };
  }

  private async obterCotacaoComCache(fonte: FonteMercado, chaveAtivo: string): Promise<AtualizacaoMercado> {
    const cache = await this.deps.repositorio.lerCacheValido(fonte, chaveAtivo, nowIso());
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
        chaveAtivo,
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
      const fallback = await this.deps.repositorio.lerUltimoCache(fonte, chaveAtivo);
      await this.deps.repositorio.salvarCache(
        fonte,
        chaveAtivo,
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
    const response = await this.fetchFn(`https://brapi.dev/api/quote/${encodeURIComponent(ticker)}`, {
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

  private async buscarCvm(cnpj: string): Promise<{ precoAtual: number | null; variacaoPercentual: number | null; payload: unknown }> {
    const response = await this.fetchFn("https://dados.cvm.gov.br/dados/FI/CAD/DADOS/cad_fi.csv", {
      method: "GET",
      headers: { accept: "text/csv" },
    });
    if (!response.ok) throw new Error(`CVM_HTTP_${response.status}`);
    const csv = await response.text();
    const linhas = csv.split(/\r?\n/);
    const cabecalho = (linhas[0] ?? "").split(";").map((col) => col.replace(/"/g, "").trim().toUpperCase());
    const idxCnpj = cabecalho.indexOf("CNPJ_FUNDO");
    const idxNome = cabecalho.indexOf("DENOM_SOCIAL");
    if (idxCnpj < 0) throw new Error("CVM_HEADER_CNPJ_INVALIDO");

    const linha = linhas.slice(1).find((row) => {
      const cols = row.split(";");
      const doc = normalizarCnpj((cols[idxCnpj] ?? "").replace(/"/g, ""));
      return doc === cnpj;
    });
    if (!linha) throw new Error("CVM_FUNDO_NAO_ENCONTRADO");
    const cols = linha.split(";");
    const nome = idxNome >= 0 ? (cols[idxNome] ?? "").replace(/"/g, "").trim() : "";

    return {
      precoAtual: null,
      variacaoPercentual: null,
      payload: { cnpj, nome },
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
