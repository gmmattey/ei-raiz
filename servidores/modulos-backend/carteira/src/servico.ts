import type {
  AtivoResumo,
  CategoriaAtivo,
  ComparativoBenchmarkCarteira,
  DetalheCategoria,
  ProvedorCotacaoFundosCvm,
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
  /**
   * Para fundos CVM: cota na data de aquisição do ativo. Quando presente,
   * indica que `precoAtual` é uma cota unitária e o retorno deve ser calculado
   * pela variação (cotaAtual / cotaAquisicao − 1), não pelo par precoAtual × qtd.
   */
  cotaAquisicao?: number | null;
};

type DependenciasServicoCarteira = {
  repositorio: RepositorioCarteira;
  fetchFn?: typeof fetch;
  brapiToken?: string;
  brapiBaseUrl?: string;
  /**
   * Provedor de cotações de fundos vindas da CVM (cache em D1). Quando presente,
   * é a primeira fonte consultada para ativos com `cnpjFundo`. Se não encontrar
   * cota em cache, a classe cai no streaming direto ao CSV da CVM (fallback
   * frágil preservado por retrocompatibilidade — v2 deve remover).
   */
  provedorCotacaoFundos?: ProvedorCotacaoFundosCvm;
};

const nowIso = (): string => new Date().toISOString();
const toIsoOffset = (mins: number): string => new Date(Date.now() + mins * 60_000).toISOString();
const toIsoOffsetHours = (hours: number): string => new Date(Date.now() + hours * 3_600_000).toISOString();
const normalizarCnpj = (value: string): string => value.replace(/\D/g, "");
const dataIsoAnterior = (dataRef: string): string | null => {
  // dataRef esperado no formato "YYYY-MM-DD". Retorna o dia anterior no mesmo
  // formato ou null se a string não parseável.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataRef)) return null;
  const d = new Date(`${dataRef}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};
const pareceTickerListado = (ticker: string): boolean => /^[A-Z]{4}\d{1,2}$/.test(ticker) || /^[A-Z]{5}\d{1,2}$/.test(ticker) || /^\^[A-Z0-9.]+$/.test(ticker);
type StatusPrecoMedio = "confiavel" | "ajustado_heuristica" | "inconsistente";
type PrecoMedioNormalizado = {
  valor: number;
  status: StatusPrecoMedio;
  motivo?: string;
};

/**
 * Reconciliação auditável do preço médio importado.
 *
 * Ao invés de devolver um número "mágico" silenciosamente, devolve também o
 * status e o motivo da decisão, para que o cálculo consuma com cautela o valor
 * quando a confiança é baixa. Qualquer fallback heurístico fica rastreável.
 */
const normalizarPrecoMedioUnitario = (
  precoMedio: number,
  quantidade: number,
  valorAtual: number,
): PrecoMedioNormalizado => {
  if (!Number.isFinite(precoMedio) || precoMedio <= 0) {
    return { valor: 0, status: "inconsistente", motivo: "preco_medio_ausente_ou_invalido" };
  }
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return { valor: precoMedio, status: "confiavel", motivo: "sem_quantidade_para_reconciliar" };
  }
  const totalEstimadoComUnitario = precoMedio * quantidade;
  const valorReferencia = Number.isFinite(valorAtual) && valorAtual > 0 ? valorAtual : totalEstimadoComUnitario;
  const referenciaUnitaria = valorReferencia / quantidade;
  const erroRelativoUnitario = Math.abs(totalEstimadoComUnitario - valorReferencia) / Math.max(1, valorReferencia);
  const erroRelativoTotal = Math.abs(precoMedio - valorReferencia) / Math.max(1, valorReferencia);
  if (erroRelativoUnitario <= 0.05) {
    return { valor: precoMedio, status: "confiavel" };
  }
  if (erroRelativoTotal <= 0.05) {
    return { valor: precoMedio / quantidade, status: "ajustado_heuristica", motivo: "preco_medio_recebido_como_total_investido" };
  }
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
    if (menorErro <= 0.35) {
      return {
        valor: melhor,
        status: melhor === precoMedio ? "inconsistente" : "ajustado_heuristica",
        motivo: melhor === precoMedio
          ? "reconciliacao_falhou_mantido_valor_original"
          : "preco_medio_ajustado_por_ordem_de_grandeza",
      };
    }
  }
  return { valor: precoMedio, status: "inconsistente", motivo: "nao_reconciliavel_com_valor_atual" };
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

    let houveInconsistencia = false;
    for (const ativo of ativos) {
      const meta = await this.obterAtualizacaoMercado(ativo);
      const normalizado = normalizarPrecoMedioUnitario(ativo.precoMedio, ativo.quantidade, ativo.valorAtual);
      if (normalizado.status === "inconsistente") houveInconsistencia = true;
      const precoMedioUnitario = normalizado.valor;
      const custoAquisicao = precoMedioUnitario * ativo.quantidade;

      // Para fundos CVM: variação da cota sobre o custo (mesma lógica de mapComAtualizacao)
      let valorMercadoAtual: number;
      const usarVariacaoCota =
        meta.fonte === "cvm" &&
        meta.precoAtual !== null &&
        meta.cotaAquisicao != null &&
        meta.cotaAquisicao > 0;

      if (usarVariacaoCota) {
        const retornoCota = (meta.precoAtual! - meta.cotaAquisicao!) / meta.cotaAquisicao!;
        valorMercadoAtual = custoAquisicao * (1 + retornoCota);
      } else {
        const precoAtual = meta.precoAtual ?? (ativo.quantidade > 0 ? ativo.valorAtual / ativo.quantidade : 0);
        valorMercadoAtual = precoAtual * ativo.quantidade;
      }

      if (!(Number.isFinite(ativo.precoMedio) && ativo.precoMedio > 0)) {
        todosComBaseCusto = false;
      }

      patrimonioTotal += valorMercadoAtual;
      custoTotalAcumulado += custoAquisicao;
    }

    const retornoDisponivel = ativos.length > 0 && todosComBaseCusto && !houveInconsistencia;
    const retornoTotal = retornoDisponivel && custoTotalAcumulado > 0
      ? ((patrimonioTotal - custoTotalAcumulado) / custoTotalAcumulado) * 100
      : 0;
    const retornoArredondado = Number(retornoTotal.toFixed(2));
    const motivoIndisponivel = !retornoDisponivel
      ? houveInconsistencia
        ? "Preço médio de pelo menos um ativo é inconsistente — revise seus dados importados"
        : "Retorno indisponível — importe seu histórico para calcular"
      : undefined;

    return {
      patrimonioTotal: Number(patrimonioTotal.toFixed(2)),
      retornoDesdeAquisicao: retornoArredondado,
      retorno_desde_aquisicao: retornoArredondado,
      // Campo legado — mesmo valor de `retornoDesdeAquisicao`. Remover após migração do frontend.
      retorno12m: retornoArredondado,
      retornoDisponivel,
      motivoRetornoIndisponivel: motivoIndisponivel,
      // Score legado/deprecated — mantido por compat; consumidores devem usar scoreUnificado.
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
      const meta = await this.obterCotacaoComCache("cvm", normalizarCnpj(ativo.cnpjFundo));
      // Busca cota na data de aquisição para calcular retorno por variação de cota.
      // Sem isso, o cálculo precoAtual × quantidade dá errado (cota ≠ preço total).
      if (meta.precoAtual !== null && this.deps.provedorCotacaoFundos) {
        const dataAq = ativo.dataAquisicao ?? ativo.dataCadastro;
        if (dataAq) {
          try {
            const cotaAq = await this.deps.provedorCotacaoFundos.obterCotaMaisRecente(
              normalizarCnpj(ativo.cnpjFundo),
              dataAq.slice(0, 10),
            );
            meta.cotaAquisicao = cotaAq?.vlQuota ?? null;
          } catch {
            // fail-silent
          }
        }
      }
      return meta;
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
    const normalizado = normalizarPrecoMedioUnitario(ativo.precoMedio, ativo.quantidade, ativo.valorAtual);
    const precoMedioUnitario = normalizado.valor;
    const statusPrecoMedio = normalizado.status;
    const precoAtual = meta.precoAtual;
    const custoTotal = precoMedioUnitario * ativo.quantidade;

    // ── Cálculo de valor_atual e retorno ──────────────────────────────────────
    // Para fundos CVM o "precoAtual" é a cota unitária (ex: R$ 16,87), enquanto
    // "precoMedio" é o total investido (ex: R$ 29.500). Multiplicar cota × qtd
    // dá errado. Quando temos a cota na data de aquisição, usamos a variação
    // percentual da cota para derivar valorAtual e retorno sobre o total investido.
    let valorAtual: number;
    let ganhoPerdaPercentual: number;

    const usarVariacaoCota =
      meta.fonte === "cvm" &&
      precoAtual !== null &&
      meta.cotaAquisicao != null &&
      meta.cotaAquisicao > 0;

    if (usarVariacaoCota) {
      const retornoCota = (precoAtual - meta.cotaAquisicao!) / meta.cotaAquisicao!;
      valorAtual = custoTotal * (1 + retornoCota);
      ganhoPerdaPercentual = retornoCota * 100;
    } else if (precoAtual !== null && meta.fonte !== "cvm") {
      // Ações / FIIs / BDRs — lógica original: precoAtual × quantidade
      valorAtual = precoAtual * ativo.quantidade;
      ganhoPerdaPercentual = custoTotal > 0 ? ((valorAtual - custoTotal) / custoTotal) * 100 : 0;
    } else {
      // Sem cotação disponível: mantém valor do DB
      valorAtual = ativo.valorAtual;
      ganhoPerdaPercentual = custoTotal > 0 ? ((valorAtual - custoTotal) / custoTotal) * 100 : 0;
    }

    const ganhoPerda = valorAtual - custoTotal;

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
      retornoDesdeAquisicao: Number(ganhoPerdaPercentual.toFixed(2)),
      retorno_desde_aquisicao: Number(ganhoPerdaPercentual.toFixed(2)),
      // Campo legado — mesmo valor. Ver contrato para detalhes.
      retorno12m: Number(ganhoPerdaPercentual.toFixed(2)),
      statusPrecoMedio,
      status_preco_medio: statusPrecoMedio,
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
   * Busca a cota diária de um fundo via CVM.
   *
   * Estratégia em cascata:
   *  1) Provider D1 (cache populado pelo script offline de ingestão) — rápido,
   *     preferencial. Calcula variação pegando a cota do dia anterior disponível.
   *  2) Streaming direto ao CSV da CVM — fallback preservado para casos em que
   *     o provider não foi injetado ou o cache ainda não tem aquele CNPJ.
   *     Tênue por limites de CPU do Worker; será descontinuado em v2.
   */
  private async buscarCvm(cnpj: string): Promise<{ precoAtual: number | null; variacaoPercentual: number | null; payload: unknown }> {
    // 1) D1 cache (preferencial)
    if (this.deps.provedorCotacaoFundos) {
      try {
        const atual = await this.deps.provedorCotacaoFundos.obterCotaMaisRecente(cnpj);
        if (atual) {
          // Tenta recuperar a cota do dia anterior para calcular variação.
          const ateAnterior = dataIsoAnterior(atual.dataRef);
          const anterior = ateAnterior
            ? await this.deps.provedorCotacaoFundos.obterCotaMaisRecente(cnpj, ateAnterior)
            : null;
          const variacaoPercentual =
            anterior && anterior.vlQuota > 0 && anterior.dataRef !== atual.dataRef
              ? ((atual.vlQuota - anterior.vlQuota) / anterior.vlQuota) * 100
              : null;
          return {
            precoAtual: atual.vlQuota,
            variacaoPercentual,
            payload: { cnpj: atual.cnpj, data: atual.dataRef, cota: atual.vlQuota, fonte: "cvm_d1" },
          };
        }
      } catch {
        // fail-silent → cai para o streaming
      }
    }

    // 2) Streaming direto (fallback)
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
