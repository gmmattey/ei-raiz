import type {
  EstadoReconstrucaoCarteira,
  MapaPrecosHistoricos,
  PayloadHistoricoMensal,
  ProvedorHistoricoCotacoes,
  ServicoReconstrucaoCarteira,
  StatusReconstrucao,
} from "@ei/contratos";
import {
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
};

export type ContextoReconstrucao = {
  imoveis: Array<{ valorEstimado: number; saldoFinanciamento: number }>;
  veiculos: Array<{ valorEstimado: number }>;
  poupanca: number;
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
};

const TAMANHO_LOTE_PADRAO = 6; // 6 meses por execução (margem para timeout do Worker)

/**
 * Calcula o valor de mercado de um ativo num determinado mês.
 * Usa o close histórico real quando o ticker está presente no mapa, senão cai
 * no preço médio (aproximação v1).
 */
function valorAtivoNoMes(
  ativo: AtivoParaReconstrucao,
  anoMes: string,
  precosHistoricos?: MapaPrecosHistoricos,
): number {
  if (precosHistoricos && ativo.ticker) {
    const porMes = precosHistoricos.get(ativo.ticker.toUpperCase());
    const close = porMes?.get(anoMes);
    if (typeof close === "number" && Number.isFinite(close) && close > 0) {
      return ativo.quantidade * close;
    }
  }
  return ativo.quantidade * ativo.precoMedio;
}

/**
 * Monta o payload mensal a partir dos ativos que já existiam no mês de referência.
 *
 * Quando `precosHistoricos` é fornecido, usa close real por (ticker, ano-mês).
 * Quando ausente, cai no fallback v1 de quantidade × precoMedio constante.
 * Para bens/poupança usa os valores atuais do contexto — não temos histórico
 * desses campos.
 */
export function montarPayloadMesHistorico(
  ativos: AtivoParaReconstrucao[],
  contexto: ContextoReconstrucao,
  anoMes: string,
  precosHistoricos?: MapaPrecosHistoricos,
): PayloadHistoricoMensal {
  const ativosNoMes = ativos.filter((a) => extrairAnoMes(a.dataAquisicao) <= anoMes);

  const patrimonioInvestimentos = ativosNoMes.reduce(
    (acc, a) => acc + valorAtivoNoMes(a, anoMes, precosHistoricos),
    0,
  );

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

  const patrimonioTotal = patrimonioInvestimentos + patrimonioBens + patrimonioPoupanca;

  const distribuicaoBase = [
    { id: "investimentos", label: "Investimentos", valor: patrimonioInvestimentos },
    { id: "bens", label: "Bens", valor: patrimonioBens },
    { id: "poupanca", label: "Poupança", valor: patrimonioPoupanca },
  ].filter((item) => item.valor > 0);

  const distribuicaoPatrimonio = distribuicaoBase.map((item) => ({
    ...item,
    percentual:
      patrimonioTotal > 0
        ? Number(((item.valor / patrimonioTotal) * 100).toFixed(4))
        : 0,
  }));

  return {
    ativos: ativosNoMes.map((a) => {
      const valorAtivo = valorAtivoNoMes(a, anoMes, precosHistoricos);
      const totalInvestido = a.quantidade * a.precoMedio;
      const retornoAcumulado =
        totalInvestido > 0
          ? Number((((valorAtivo - totalInvestido) / totalInvestido) * 100).toFixed(4))
          : 0;
      return {
        id: a.id,
        ticker: a.ticker ?? null,
        nome: a.nome,
        categoria: a.categoria,
        valorAtual: Number(valorAtivo.toFixed(2)),
        totalInvestido: Number(totalInvestido.toFixed(2)),
        retornoAcumulado,
        participacao:
          patrimonioTotal > 0
            ? Number(((valorAtivo / patrimonioTotal) * 100).toFixed(4))
            : 0,
      };
    }),
    patrimonioInvestimentos: Number(patrimonioInvestimentos.toFixed(2)),
    patrimonioBens: Number(patrimonioBens.toFixed(2)),
    patrimonioPoupanca: Number(patrimonioPoupanca.toFixed(2)),
    patrimonioTotal: Number(patrimonioTotal.toFixed(2)),
    distribuicaoPatrimonio,
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

      // Pré-busca cotações históricas uma única vez por execução de lote.
      // Falhas no provedor não abortam a reconstrução — caímos no fallback.
      const precosHistoricos = await this.carregarPrecosHistoricos(ativos);

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
        );

        const totalInvestido = payload.ativos.reduce(
          (acc, a) => acc + a.totalInvestido,
          0,
        );

        const [mesAnterior, primeiroMes] = await Promise.all([
          this.deps.historicoMensal.obterMesAnterior(usuarioId, cursorParaGravar),
          this.deps.historicoMensal.obterMesMaisAntigo(usuarioId),
        ]);

        const retornoMes =
          mesAnterior && mesAnterior.totalAtual > 0
            ? ((payload.patrimonioTotal - mesAnterior.totalAtual) /
                mesAnterior.totalAtual) *
              100
            : 0;

        const retornoAcum =
          primeiroMes && primeiroMes.totalAtual > 0
            ? ((payload.patrimonioTotal - primeiroMes.totalAtual) /
                primeiroMes.totalAtual) *
              100
            : 0;

        await this.deps.historicoMensal.gravar(
          usuarioId,
          cursorParaGravar,
          calcularUltimoDiaDoMes(cursorParaGravar),
          Number(totalInvestido.toFixed(2)),
          Number(payload.patrimonioTotal.toFixed(2)),
          Number(retornoMes.toFixed(4)),
          Number(retornoAcum.toFixed(4)),
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
