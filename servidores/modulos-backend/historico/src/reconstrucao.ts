import type {
  AtivoResumoMensal,
  EstadoReconstrucaoCarteira,
  MapaPrecosHistoricos,
  PayloadHistoricoMensal,
  ProvedorCotacaoFundosCvm,
  ProvedorHistoricoCotacoes,
  ServicoReconstrucaoCarteira,
  StatusReconstrucao,
} from "@ei/contratos";
import {
  calcularRetornosMensais,
  calcularUltimoDiaDoMes,
  extrairAnoMes,
  proximoAnoMes,
  type RepositorioHistoricoMensal,
} from "./historico-mensal";

/**
 * Um ativo como conhecido hoje — precoMedio, quantidade e data de aquisição.
 * A reconstrução assume que o ativo "existia" desde data_aquisicao com esses
 * valores (aproximação: não temos histórico de compras incrementais por data).
 */
export type AtivoParaReconstrucao = {
  id: string;
  ticker: string | null;
  nome: string;
  categoria: string;
  quantidade: number;
  precoMedio: number;
  dataAquisicao: string; // ISO 8601
  /**
   * CNPJ do fundo (somente dígitos) quando categoria === "fundo". Permite à
   * reconstrução usar o histórico CVM de cotas por (cnpj, ano-mês) ao invés
   * do fallback quantidade × precoMedio.
   */
  cnpj?: string | null;
};

/**
 * Fechamentos mensais de fundos por CNPJ.
 * Mapa: cnpj (14 dígitos) → (anoMes "YYYY-MM" → valor da cota no último dia útil do mês).
 */
export type MapaFechamentosFundos = Map<string, Map<string, number>>;

/**
 * Contexto patrimonial não-investimento aplicado em cada mês da reconstrução.
 * Como não há histórico para bens/poupança/dívidas, usam-se os valores atuais
 * como aproximação — a curva de rentabilidade NÃO depende desses valores,
 * então esse achatamento não contamina o gráfico de retornos.
 */
export type ContextoReconstrucao = {
  imoveis: Array<{ valorEstimado: number; saldoFinanciamento: number }>;
  veiculos: Array<{ valorEstimado: number }>;
  poupanca: number;
  dividas: number;
};

export interface RepositorioFilaReconstrucao {
  obter(usuarioId: string): Promise<EstadoReconstrucaoCarteira | null>;
  criar(
    usuarioId: string,
    anoMesInicial: string,
    anoMesFinal: string,
  ): Promise<EstadoReconstrucaoCarteira>;
  atualizar(
    usuarioId: string,
    patch: Partial<EstadoReconstrucaoCarteira>,
  ): Promise<EstadoReconstrucaoCarteira>;
}

export interface FonteDadosReconstrucao {
  listarAtivos(usuarioId: string): Promise<AtivoParaReconstrucao[]>;
  obterContexto(usuarioId: string): Promise<ContextoReconstrucao>;
}

type Dependencias = {
  fila: RepositorioFilaReconstrucao;
  historicoMensal: RepositorioHistoricoMensal;
  fonte: FonteDadosReconstrucao;
  /**
   * Provedor opcional de cotações históricas mensais. Quando presente, a
   * reconstrução usa close real por (ticker, ano-mês). Quando ausente, mantém
   * o fallback de quantidade × precoMedio constante.
   */
  provedorHistorico?: ProvedorHistoricoCotacoes;
  /**
   * Provedor opcional de cotações históricas de fundos CVM. Quando presente,
   * usa a cota mensal real por (cnpj, ano-mês). Complementa BRAPI (que não
   * cobre fundos de investimento brasileiros).
   */
  provedorFundos?: ProvedorCotacaoFundosCvm;
};

const TAMANHO_LOTE_PADRAO = 6; // 6 meses por execução (margem para timeout do Worker)

/**
 * Resultado da avaliação de valor de um ativo em um mês específico.
 *  - `confiavel=true` ⇒ usamos preço de mercado real (cota CVM ou close BRAPI).
 *  - `confiavel=false` ⇒ caímos no fallback quantidade × precoMedio; o ativo
 *    aparece com valor contábil constante, então o ponto do mês não representa
 *    rentabilidade de mercado real.
 */
type ValorAtivoNoMes = {
  valor: number;
  confiavel: boolean;
};

/**
 * Calcula o valor de mercado de um ativo num determinado mês.
 *
 * Ordem de prioridade:
 *   1. Fundo com CNPJ mapeado → variação de cota CVM sobre o custo total.
 *      Para fundos, o usuário registra `quantidade = 1` e `precoMedio = total investido`.
 *      A cota CVM é o preço por unidade de cota (escala diferente). Portanto usamos:
 *        valor = custoTotal × (cotaMes / cotaAquisicao)
 *      Onde cotaAquisicao é a primeira cota disponível no mapa (mês de aquisição).
 *   2. Ativo com ticker mapeado → close BRAPI do mês (ações/ETFs/FIIs/BDRs)
 *   3. Fallback → quantidade × precoMedio (valor constante desde a aquisição,
 *      marcado como não-confiável).
 */
function valorAtivoNoMes(
  ativo: AtivoParaReconstrucao,
  anoMes: string,
  precosHistoricos?: MapaPrecosHistoricos,
  fechamentosFundos?: MapaFechamentosFundos,
): ValorAtivoNoMes {
  if (fechamentosFundos && ativo.cnpj) {
    const porMes = fechamentosFundos.get(ativo.cnpj);
    const cotaMes = porMes?.get(anoMes);
    if (typeof cotaMes === "number" && Number.isFinite(cotaMes) && cotaMes > 0) {
      const anoMesAquisicao = extrairAnoMes(ativo.dataAquisicao);
      const cotaRef = porMes?.get(anoMesAquisicao);
      if (typeof cotaRef === "number" && Number.isFinite(cotaRef) && cotaRef > 0) {
        const custoTotal = ativo.quantidade * ativo.precoMedio;
        return { valor: custoTotal * (cotaMes / cotaRef), confiavel: true };
      }
      const mesesOrdenados = Array.from(porMes!.keys()).sort();
      const cotaMaisAntiga = mesesOrdenados.length > 0 ? porMes!.get(mesesOrdenados[0]) : null;
      if (typeof cotaMaisAntiga === "number" && cotaMaisAntiga > 0) {
        const custoTotal = ativo.quantidade * ativo.precoMedio;
        return { valor: custoTotal * (cotaMes / cotaMaisAntiga), confiavel: true };
      }
    }
  }
  if (precosHistoricos && ativo.ticker) {
    const porMes = precosHistoricos.get(ativo.ticker.toUpperCase());
    const close = porMes?.get(anoMes);
    if (typeof close === "number" && Number.isFinite(close) && close > 0) {
      return { valor: ativo.quantidade * close, confiavel: true };
    }
  }
  return { valor: ativo.quantidade * ativo.precoMedio, confiavel: false };
}

/**
 * Monta o payload mensal a partir dos ativos que já existiam no mês de referência.
 *
 * Escopos separados:
 *  - `valorInvestimentos`   = soma marcada a mercado (base de rentabilidade)
 *  - `patrimonioBens`       = valor contábil de imóveis/veículos (não entra em rent.)
 *  - `patrimonioPoupanca`   = saldo de poupança (não entra em rent.)
 *  - `patrimonioDividas`    = dívidas (subtrai do patrimônio líquido)
 *  - `patrimonioTotal`      = patrimônio líquido = inv + bens + poup − dívidas
 *
 * `confiavel` do payload é `true` somente se TODOS os ativos do mês tiveram
 * preço de mercado real. Um único fallback marca o ponto inteiro como não-
 * auditável — o frontend deve sinalizar isso na curva de rentabilidade.
 */
export function montarPayloadMesHistorico(
  ativos: AtivoParaReconstrucao[],
  contexto: ContextoReconstrucao,
  anoMes: string,
  precosHistoricos?: MapaPrecosHistoricos,
  fechamentosFundos?: MapaFechamentosFundos,
): PayloadHistoricoMensal {
  const ativosNoMes = ativos.filter((a) => extrairAnoMes(a.dataAquisicao) <= anoMes);

  const avaliacoes = ativosNoMes.map((a) => ({
    ativo: a,
    ...valorAtivoNoMes(a, anoMes, precosHistoricos, fechamentosFundos),
  }));

  const valorInvestimentos = avaliacoes.reduce((acc, x) => acc + x.valor, 0);

  const patrimonioImoveis = contexto.imoveis.reduce(
    (acc, i) =>
      acc + Math.max(0, Number(i.valorEstimado ?? 0) - Number(i.saldoFinanciamento ?? 0)),
    0,
  );
  const patrimonioVeiculos = contexto.veiculos.reduce(
    (acc, v) => acc + Math.max(0, Number(v.valorEstimado ?? 0)),
    0,
  );
  const patrimonioBens = patrimonioImoveis + patrimonioVeiculos;
  const patrimonioPoupanca = Number(contexto.poupanca ?? 0);
  const patrimonioDividas = Math.max(0, Number(contexto.dividas ?? 0));

  const patrimonioTotal =
    valorInvestimentos + patrimonioBens + patrimonioPoupanca - patrimonioDividas;

  const baseDistribuicao = valorInvestimentos + patrimonioBens + patrimonioPoupanca;
  const distribuicaoBase = [
    { id: "investimentos", label: "Investimentos", valor: valorInvestimentos },
    { id: "bens", label: "Bens", valor: patrimonioBens },
    { id: "poupanca", label: "Poupança", valor: patrimonioPoupanca },
  ].filter((item) => item.valor > 0);

  const distribuicaoPatrimonio = distribuicaoBase.map((item) => ({
    ...item,
    percentual:
      baseDistribuicao > 0
        ? Number(((item.valor / baseDistribuicao) * 100).toFixed(4))
        : 0,
  }));

  const todosConfiaveis = avaliacoes.every((x) => x.confiavel);

  const ativosPayload: AtivoResumoMensal[] = avaliacoes.map(({ ativo: a, valor, confiavel }) => {
    const totalInvestido = a.quantidade * a.precoMedio;
    const retornoAcumulado =
      totalInvestido > 0
        ? Number((((valor - totalInvestido) / totalInvestido) * 100).toFixed(4))
        : 0;
    return {
      id: a.id,
      ticker: a.ticker ?? null,
      nome: a.nome,
      categoria: a.categoria,
      valorAtual: Number(valor.toFixed(2)),
      totalInvestido: Number(totalInvestido.toFixed(2)),
      retornoAcumulado,
      participacao:
        valorInvestimentos > 0
          ? Number(((valor / valorInvestimentos) * 100).toFixed(4))
          : 0,
      confiavel,
    };
  });

  return {
    ativos: ativosPayload,
    valorInvestimentos: Number(valorInvestimentos.toFixed(2)),
    patrimonioInvestimentos: Number(valorInvestimentos.toFixed(2)),
    patrimonioBens: Number(patrimonioBens.toFixed(2)),
    patrimonioPoupanca: Number(patrimonioPoupanca.toFixed(2)),
    patrimonioDividas: Number(patrimonioDividas.toFixed(2)),
    patrimonioTotal: Number(patrimonioTotal.toFixed(2)),
    distribuicaoPatrimonio,
    confiavel: ativosPayload.length === 0 ? false : todosConfiaveis,
  };
}

export class ServicoReconstrucaoCarteiraPadrao implements ServicoReconstrucaoCarteira {
  constructor(private readonly deps: Dependencias) {}

  /**
   * Busca cotações históricas mensais para todos os tickers únicos da carteira.
   * Falha silenciosa: provedor ausente ou erro retornam undefined → fallback v1.
   */
  private async carregarPrecosHistoricos(
    ativos: AtivoParaReconstrucao[],
  ): Promise<MapaPrecosHistoricos | undefined> {
    if (!this.deps.provedorHistorico) return undefined;
    const tickers = Array.from(
      new Set(
        ativos
          .map((a) => a.ticker?.trim().toUpperCase())
          .filter((t): t is string => Boolean(t && t.length > 0)),
      ),
    );
    if (tickers.length === 0) return undefined;
    try {
      return await this.deps.provedorHistorico.obterPrecosHistoricosMensais(tickers);
    } catch {
      return undefined;
    }
  }

  /**
   * Busca fechamentos mensais CVM para todos os fundos (por CNPJ) únicos da
   * carteira. Janela: do mês mais antigo entre aquisições até o mês final da
   * reconstrução. Falha silenciosa: sem provedor ou erro → undefined.
   */
  private async carregarFechamentosFundos(
    ativos: AtivoParaReconstrucao[],
    anoMesInicial: string,
    anoMesFinal: string,
  ): Promise<MapaFechamentosFundos | undefined> {
    if (!this.deps.provedorFundos) return undefined;
    const cnpjs = Array.from(
      new Set(
        ativos
          .filter((a) => a.categoria === "fundo")
          .map((a) => a.cnpj?.replace(/\D/g, ""))
          .filter((c): c is string => Boolean(c && c.length === 14)),
      ),
    );
    if (cnpjs.length === 0) return undefined;
    try {
      return await this.deps.provedorFundos.obterFechamentosMensais(
        cnpjs,
        anoMesInicial,
        anoMesFinal,
      );
    } catch {
      return undefined;
    }
  }

  async enfileirar(usuarioId: string): Promise<EstadoReconstrucaoCarteira> {
    const ativos = await this.deps.fonte.listarAtivos(usuarioId);
    if (ativos.length === 0) {
      return this.deps.fila.criar(
        usuarioId,
        extrairAnoMes(new Date().toISOString()),
        extrairAnoMes(new Date().toISOString()),
      );
    }

    const dataMaisAntiga = ativos
      .map((a) => a.dataAquisicao)
      .sort()[0];

    const anoMesInicial = extrairAnoMes(dataMaisAntiga);
    const anoMesFinal = extrairAnoMes(new Date().toISOString());

    return this.deps.fila.criar(usuarioId, anoMesInicial, anoMesFinal);
  }

  obterEstado(usuarioId: string): Promise<EstadoReconstrucaoCarteira | null> {
    return this.deps.fila.obter(usuarioId);
  }

  async processarProximoLote(
    usuarioId: string,
    tamanhoLote: number = TAMANHO_LOTE_PADRAO,
  ): Promise<EstadoReconstrucaoCarteira> {
    const estado = await this.deps.fila.obter(usuarioId);
    if (!estado) {
      throw new Error(`reconstrucao nao enfileirada para usuario ${usuarioId}`);
    }
    if (estado.status === "concluido") {
      return estado;
    }

    const marcado = await this.deps.fila.atualizar(usuarioId, {
      status: "processando",
      iniciadoEm: estado.iniciadoEm ?? new Date().toISOString(),
      tentativas: estado.tentativas + 1,
    });

    try {
      const [ativos, contexto] = await Promise.all([
        this.deps.fonte.listarAtivos(usuarioId),
        this.deps.fonte.obterContexto(usuarioId),
      ]);

      const cursorInicial = marcado.anoMesCursor
        ? proximoAnoMes(marcado.anoMesCursor)
        : marcado.anoMesInicial;

      if (!cursorInicial || !marcado.anoMesFinal) {
        return this.deps.fila.atualizar(usuarioId, {
          status: "concluido",
          concluidoEm: new Date().toISOString(),
        });
      }

      const [precosHistoricos, fechamentosFundos] = await Promise.all([
        this.carregarPrecosHistoricos(ativos),
        this.carregarFechamentosFundos(
          ativos,
          marcado.anoMesInicial ?? cursorInicial,
          marcado.anoMesFinal,
        ),
      ]);

      let mesesProcessados = marcado.mesesProcessados;
      let cursorParaGravar = cursorInicial;
      let ultimoGravado: string | null = marcado.anoMesCursor;

      for (let i = 0; i < tamanhoLote; i += 1) {
        if (cursorParaGravar > marcado.anoMesFinal) break;

        const payload = montarPayloadMesHistorico(
          ativos,
          contexto,
          cursorParaGravar,
          precosHistoricos,
          fechamentosFundos,
        );

        const totalInvestido = payload.ativos.reduce(
          (acc, a) => acc + a.totalInvestido,
          0,
        );

        const [mesAnterior, primeiroMes] = await Promise.all([
          this.deps.historicoMensal.obterMesAnterior(usuarioId, cursorParaGravar),
          this.deps.historicoMensal.obterMesMaisAntigo(usuarioId),
        ]);

        const { rentabilidadeMesPct, rentabilidadeAcumPct } = calcularRetornosMensais(
          payload.valorInvestimentos,
          mesAnterior?.valorInvestimentos ?? null,
          primeiroMes?.valorInvestimentos ?? null,
        );

        await this.deps.historicoMensal.gravar(
          usuarioId,
          cursorParaGravar,
          calcularUltimoDiaDoMes(cursorParaGravar),
          Number(totalInvestido.toFixed(2)),
          Number(payload.valorInvestimentos.toFixed(2)),
          Number(payload.patrimonioTotal.toFixed(2)),
          rentabilidadeMesPct,
          rentabilidadeAcumPct,
          payload.confiavel !== false,
          payload,
          "reconstrucao",
        );

        ultimoGravado = cursorParaGravar;
        mesesProcessados += 1;
        cursorParaGravar = proximoAnoMes(cursorParaGravar);
      }

      const concluiu =
        ultimoGravado !== null && ultimoGravado >= marcado.anoMesFinal;
      const novoStatus: StatusReconstrucao = concluiu ? "concluido" : "pendente";

      return this.deps.fila.atualizar(usuarioId, {
        status: novoStatus,
        anoMesCursor: ultimoGravado,
        mesesProcessados,
        concluidoEm: concluiu ? new Date().toISOString() : null,
      });
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "erro desconhecido";
      return this.deps.fila.atualizar(usuarioId, {
        status: "erro",
        erroMensagem: mensagem,
      });
    }
  }
}
