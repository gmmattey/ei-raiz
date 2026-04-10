import type { AtivoResumo, CategoriaAtivo, DetalheCategoria, ResumoCarteira, ServicoCarteira } from "@ei/contratos";
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
      precoAtual: precoAtual ?? undefined,
      variacaoPercentual: meta.variacaoPercentual ?? undefined,
      ganhoPerda,
      ganhoPerdaPercentual: Number(ganhoPerdaPercentual.toFixed(2)),
      ultimaAtualizacao: meta.atualizadoEm ?? undefined,
      fontePreco: meta.fonte,
      statusAtualizacao: meta.status,
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
}
