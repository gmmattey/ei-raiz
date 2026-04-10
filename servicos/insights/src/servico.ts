import type { AcaoPrioritaria, Diagnostico, RiscoPrincipal, ScoreCarteira, ServicoInsights } from "@ei/contratos";
import type { MetricasCarteira, RepositorioInsights } from "./repositorio";

type Fator = { label: string; impacto: number };

const clamp = (min: number, max: number, value: number): number => Math.max(min, Math.min(max, value));
const arred = (value: number): number => Math.round(value);

const defaultScoreConfig = {
  pesos: {
    aderenciaPerfil: 25,
    qualidadeCarteira: 25,
    consistenciaAportes: 15,
    adequacaoObjetivo: 15,
    historicoMomentoVida: 20,
  },
  thresholds: {
    criticoMax: 39,
    fragilMax: 59,
    regularMax: 74,
    bomMax: 89,
  },
  penalidades: {
    perfilConservadorRvAlto: 10,
    perfilModeradoRvAlto: 6,
    perfilArrojadoRvBaixo: 4,
    horizonteCurtoAgressivo: 5,
    rendaBaixaVolatilidadeAlta: 4,
    maiorAtivoAlto: 6,
    top3Concentrado: 5,
    classeUnica: 6,
    poucosAtivos: 4,
    semDefensivo: 4,
    objetivoPreservacaoRisco: 7,
    objetivoCrescimentoDefensivo: 5,
    objetivoRendaSemBase: 4,
    objetivoAposentadoriaSemConsistencia: 3,
  },
};

const mapFaixa = (score: number, thresholds: typeof defaultScoreConfig.thresholds): ScoreCarteira["faixa"] => {
  if (score <= thresholds.criticoMax) return "critico";
  if (score <= thresholds.fragilMax) return "fragil";
  if (score <= thresholds.regularMax) return "regular";
  if (score <= thresholds.bomMax) return "bom";
  return "muito_bom";
};

export class ServicoInsightsPadrao implements ServicoInsights {
  constructor(private readonly repositorio: RepositorioInsights) {}

  async calcularScore(usuarioId: string): Promise<ScoreCarteira> {
    const configRaw = await this.repositorio.obterConfiguracaoScore();
    const config = this.montarConfiguracaoScore(configRaw);
    const perfil = await this.repositorio.obterPerfil(usuarioId);
    const metricas = await this.repositorio.obterMetricasCarteira(usuarioId);
    const fatoresPositivos: Fator[] = [];
    const fatoresNegativos: Fator[] = [];

    const aderenciaPerfil = this.scoreAderenciaPerfil(metricas, perfil?.perfilRisco ?? "", perfil?.horizonte ?? "", perfil?.rendaMensal ?? 0, fatoresNegativos, config);
    const qualidadeCarteira = this.scoreQualidadeCarteira(metricas, perfil?.perfilRisco ?? "", fatoresPositivos, fatoresNegativos, config);
    const consistenciaAportes = this.scoreConsistenciaAportes(metricas, perfil?.aporteMensal ?? 0, fatoresPositivos, fatoresNegativos, config);
    const adequacaoObjetivo = this.scoreAdequacaoObjetivo(metricas, perfil?.objetivo ?? "", perfil?.horizonte ?? "", fatoresPositivos, fatoresNegativos, config);
    const historicoMomentoVida = this.scoreHistoricoMomentoVida(metricas, perfil?.maturidade ?? 1, fatoresPositivos, fatoresNegativos, config);

    const score = clamp(0, 100, arred(aderenciaPerfil + qualidadeCarteira + consistenciaAportes + adequacaoObjetivo + historicoMomentoVida));
    const faixa = mapFaixa(score, config.thresholds);
    const riscoPrincipal = this.definirRiscoPrincipal(metricas, fatoresNegativos);
    const acaoPrioritaria = this.definirAcaoPrioritaria(riscoPrincipal);

    const ultimo = await this.repositorio.obterUltimoSnapshotScore(usuarioId);
    const scoreAnterior = ultimo?.score;
    const variacao = typeof scoreAnterior === "number" ? score - scoreAnterior : undefined;
    const atualizadoEm = new Date().toISOString();

    const resultado: ScoreCarteira = {
      scoreAnterior,
      variacao,
      score,
      faixa,
      fatoresPositivos: fatoresPositivos.sort((a, b) => b.impacto - a.impacto).slice(0, 5),
      fatoresNegativos: fatoresNegativos.sort((a, b) => a.impacto - b.impacto).slice(0, 5),
      riscoPrincipal,
      acaoPrioritaria,
      blocos: {
        aderenciaPerfil,
        qualidadeCarteira,
        consistenciaAportes,
        adequacaoObjetivo,
        historicoMomentoVida,
      },
      atualizadoEm,
    };

    await this.repositorio.salvarSnapshotScore(usuarioId, {
      score: resultado.score,
      faixa: resultado.faixa,
      riscoPrincipal: resultado.riscoPrincipal,
      acaoPrioritaria: resultado.acaoPrioritaria,
      blocos: resultado.blocos,
      fatoresPositivos: resultado.fatoresPositivos,
      fatoresNegativos: resultado.fatoresNegativos,
    });

    return resultado;
  }

  async gerarDiagnostico(usuarioId: string): Promise<Diagnostico> {
    const score = await this.calcularScore(usuarioId);
    const risco: RiscoPrincipal = {
      codigo: score.riscoPrincipal,
      titulo: this.tituloRisco(score.riscoPrincipal),
      descricao: this.descricaoRisco(score.riscoPrincipal),
      severidade: score.faixa === "critico" || score.faixa === "fragil" ? "alto" : score.faixa === "regular" ? "medio" : "baixo",
    };

    const acao: AcaoPrioritaria = {
      codigo: score.acaoPrioritaria,
      titulo: this.tituloAcao(score.acaoPrioritaria),
      descricao: this.descricaoAcao(score.acaoPrioritaria),
      impactoEsperado: `Melhora esperada na faixa atual (${score.faixa}).`,
    };

    return {
      resumo: `Score ${score.score} (${score.faixa}). Risco principal: ${risco.titulo}.`,
      riscos: [risco],
      acoes: [acao],
    };
  }

  private montarConfiguracaoScore(raw: Record<string, unknown> | null): typeof defaultScoreConfig {
    if (!raw) return defaultScoreConfig;
    const pesos = this.mergeNumerico(defaultScoreConfig.pesos, raw.pesos);
    const thresholds = this.mergeNumerico(defaultScoreConfig.thresholds, raw.thresholds);
    const penalidades = this.mergeNumerico(defaultScoreConfig.penalidades, raw.penalidades);
    return { pesos, thresholds, penalidades };
  }

  private mergeNumerico<T extends Record<string, number>>(base: T, value: unknown): T {
    if (!value || typeof value !== "object" || Array.isArray(value)) return base;
    const parcial = value as Record<string, unknown>;
    const out = { ...base };
    for (const key of Object.keys(base)) {
      const candidate = parcial[key];
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        out[key as keyof T] = candidate as T[keyof T];
      }
    }
    return out;
  }

  private scoreAderenciaPerfil(
    metricas: MetricasCarteira,
    perfilRisco: string,
    horizonte: string,
    rendaMensal: number,
    negativos: Fator[],
    config: typeof defaultScoreConfig,
  ): number {
    let score = config.pesos.aderenciaPerfil;
    const perfil = perfilRisco.toLowerCase();
    const horizonteCurto = horizonte.toLowerCase().includes("curto");
    const rv = metricas.percentualRendaVariavel;

    if (perfil.includes("conservador") && rv > 30) {
      score -= config.penalidades.perfilConservadorRvAlto;
      negativos.push({ label: "Perfil conservador com renda variável alta", impacto: -config.penalidades.perfilConservadorRvAlto });
    }
    if (perfil.includes("moderado") && rv > 60) {
      score -= config.penalidades.perfilModeradoRvAlto;
      negativos.push({ label: "Perfil moderado com exposição agressiva", impacto: -config.penalidades.perfilModeradoRvAlto });
    }
    if (perfil.includes("arrojado") && rv < 20) {
      score -= config.penalidades.perfilArrojadoRvBaixo;
      negativos.push({ label: "Perfil arrojado com baixa exposição a risco", impacto: -config.penalidades.perfilArrojadoRvBaixo });
    }
    if (horizonteCurto && rv > 50) {
      score -= config.penalidades.horizonteCurtoAgressivo;
      negativos.push({ label: "Horizonte curto com carteira agressiva", impacto: -config.penalidades.horizonteCurtoAgressivo });
    }
    if (rendaMensal > 0 && rendaMensal < 5000 && metricas.maiorParticipacao > 35 && rv > 50) {
      score -= config.penalidades.rendaBaixaVolatilidadeAlta;
      negativos.push({ label: "Alta volatilidade para renda mensal baixa", impacto: -config.penalidades.rendaBaixaVolatilidadeAlta });
    }

    return clamp(0, config.pesos.aderenciaPerfil, arred(score));
  }

  private scoreQualidadeCarteira(metricas: MetricasCarteira, perfilRisco: string, positivos: Fator[], negativos: Fator[], config: typeof defaultScoreConfig): number {
    let score = config.pesos.qualidadeCarteira;
    if (metricas.maiorParticipacao > 25) {
      score -= config.penalidades.maiorAtivoAlto;
      negativos.push({ label: "Concentração no maior ativo acima de 25%", impacto: -config.penalidades.maiorAtivoAlto });
    }
    if (metricas.top3Participacao > 60) {
      score -= config.penalidades.top3Concentrado;
      negativos.push({ label: "Top 3 ativos concentrados", impacto: -config.penalidades.top3Concentrado });
    }
    if (metricas.quantidadeCategorias <= 1) {
      score -= config.penalidades.classeUnica;
      negativos.push({ label: "Apenas uma classe de ativos", impacto: -config.penalidades.classeUnica });
    }
    if (metricas.quantidadeAtivos < 4) {
      score -= config.penalidades.poucosAtivos;
      negativos.push({ label: "Poucos ativos na carteira", impacto: -config.penalidades.poucosAtivos });
    }
    if (!perfilRisco.toLowerCase().includes("arrojado") && metricas.percentualDefensivo <= 0) {
      score -= config.penalidades.semDefensivo;
      negativos.push({ label: "Sem posição defensiva para o perfil", impacto: -config.penalidades.semDefensivo });
    }
    if (metricas.quantidadeCategorias >= 3) {
      score += 2;
      positivos.push({ label: "Diversificação por 3+ classes", impacto: 2 });
    }
    if (metricas.percentualInternacional > 5) {
      score += 2;
      positivos.push({ label: "Exposição internacional presente", impacto: 2 });
    }
    if (metricas.maiorParticipacao <= 25 && metricas.top3Participacao <= 60) {
      score += 2;
      positivos.push({ label: "Concentração controlada", impacto: 2 });
    }
    return clamp(0, config.pesos.qualidadeCarteira, arred(score));
  }

  private scoreConsistenciaAportes(metricas: MetricasCarteira, aporteMensalPlanejado: number, positivos: Fator[], negativos: Fator[], config: typeof defaultScoreConfig): number {
    const frequencia = clamp(0, 1, metricas.mesesComAporteUltimos6m / 6);
    const aporteRealProxy = metricas.patrimonioTotal > 0 ? metricas.patrimonioTotal / Math.max(metricas.idadeCarteiraMeses, 1) : 0;
    if (aporteMensalPlanejado <= 0) {
      const score = clamp(0, 10, arred((config.pesos.consistenciaAportes * 0.66) * frequencia));
      if (score >= 7) positivos.push({ label: "Frequência de evolução patrimonial consistente", impacto: score });
      else negativos.push({ label: "Baixa consistência sem meta de aporte definida", impacto: -Math.max(1, 10 - score) });
      return score;
    }
    const aderenciaValor = clamp(0, 1, aporteRealProxy / aporteMensalPlanejado);
    const score = config.pesos.consistenciaAportes * (0.6 * frequencia + 0.4 * aderenciaValor);
    if (score >= 10) positivos.push({ label: "Boa consistência de aportes", impacto: arred(score - 7) });
    else negativos.push({ label: "Aportes abaixo do planejado", impacto: -arred(10 - score) });
    return clamp(0, config.pesos.consistenciaAportes, arred(score));
  }

  private scoreAdequacaoObjetivo(
    metricas: MetricasCarteira,
    objetivo: string,
    horizonte: string,
    positivos: Fator[],
    negativos: Fator[],
    config: typeof defaultScoreConfig,
  ): number {
    let score = config.pesos.adequacaoObjetivo;
    const objetivoNorm = objetivo.toLowerCase();
    const horizonteLongo = horizonte.toLowerCase().includes("longo");
    const rv = metricas.percentualRendaVariavel;
    const rf = metricas.percentualRendaFixa;

    if (objetivoNorm.includes("preserva") && rv > 50) {
      score -= config.penalidades.objetivoPreservacaoRisco;
      negativos.push({ label: "Objetivo de preservação com risco elevado", impacto: -config.penalidades.objetivoPreservacaoRisco });
    }
    if (objetivoNorm.includes("crescimento") && rf > 90 && horizonteLongo) {
      score -= config.penalidades.objetivoCrescimentoDefensivo;
      negativos.push({ label: "Objetivo de crescimento excessivamente defensivo", impacto: -config.penalidades.objetivoCrescimentoDefensivo });
    }
    if (objetivoNorm.includes("renda") && rf < 20) {
      score -= config.penalidades.objetivoRendaSemBase;
      negativos.push({ label: "Objetivo de renda sem base de ativos de renda", impacto: -config.penalidades.objetivoRendaSemBase });
    }
    if (objetivoNorm.includes("aposentadoria") && metricas.mesesComAporteUltimos6m < 4) {
      score -= config.penalidades.objetivoAposentadoriaSemConsistencia;
      negativos.push({ label: "Aposentadoria com baixa consistência de aportes", impacto: -config.penalidades.objetivoAposentadoriaSemConsistencia });
    }
    if (score >= 12) positivos.push({ label: "Carteira aderente ao objetivo declarado", impacto: 3 });
    return clamp(0, config.pesos.adequacaoObjetivo, arred(score));
  }

  private scoreHistoricoMomentoVida(metricas: MetricasCarteira, maturidade: number, positivos: Fator[], negativos: Fator[], config: typeof defaultScoreConfig): number {
    const scoreEvolucao =
      metricas.evolucaoPatrimonio6m > 8 ? 8 : metricas.evolucaoPatrimonio6m > 0 ? 6 : metricas.evolucaoPatrimonio6m > -5 ? 3 : 1;
    const scoreEstabilidade = metricas.mesesComAporteUltimos6m >= 5 ? 6 : metricas.mesesComAporteUltimos6m >= 3 ? 4 : 2;
    const scoreCoerenciaFase =
      maturidade <= 2
        ? metricas.quantidadeCategorias >= 2
          ? 6
          : 4
        : metricas.quantidadeCategorias >= 3
          ? 6
          : 3;

    const total = clamp(0, config.pesos.historicoMomentoVida, scoreEvolucao + scoreEstabilidade + scoreCoerenciaFase);
    if (total >= 14) positivos.push({ label: "Histórico de evolução coerente", impacto: 6 });
    else negativos.push({ label: "Histórico ainda instável", impacto: -Math.max(2, 14 - total) });
    return arred(total);
  }

  private definirRiscoPrincipal(metricas: MetricasCarteira, negativos: Fator[]): string {
    if (metricas.maiorParticipacao > 35) return "concentracao_renda_variavel";
    if (metricas.quantidadeCategorias <= 1) return "baixa_diversificacao";
    if (negativos.some((item) => item.label.includes("Aportes"))) return "inconsistencia_aportes";
    return "desalinhamento_objetivo";
  }

  private definirAcaoPrioritaria(riscoPrincipal: string): string {
    if (riscoPrincipal === "concentracao_renda_variavel") return "reduzir_assimetria_nos_proximos_aportes";
    if (riscoPrincipal === "baixa_diversificacao") return "diversificar_por_classe_de_ativo";
    if (riscoPrincipal === "inconsistencia_aportes") return "regularizar_aportes_mensais";
    return "realinhar_carteira_ao_objetivo";
  }

  private tituloRisco(codigo: string): string {
    if (codigo === "concentracao_renda_variavel") return "Concentração excessiva em renda variável";
    if (codigo === "baixa_diversificacao") return "Baixa diversificação estrutural";
    if (codigo === "inconsistencia_aportes") return "Inconsistência de aportes";
    return "Desalinhamento com objetivo";
  }

  private descricaoRisco(codigo: string): string {
    if (codigo === "concentracao_renda_variavel") return "A maior posição concentra risco relevante na carteira.";
    if (codigo === "baixa_diversificacao") return "A carteira está exposta por falta de classes complementares.";
    if (codigo === "inconsistencia_aportes") return "A evolução patrimonial mostra baixa regularidade recente.";
    return "A carteira não está totalmente alinhada ao objetivo financeiro atual.";
  }

  private tituloAcao(codigo: string): string {
    if (codigo === "reduzir_assimetria_nos_proximos_aportes") return "Reduzir assimetria nos próximos aportes";
    if (codigo === "diversificar_por_classe_de_ativo") return "Diversificar por classe de ativo";
    if (codigo === "regularizar_aportes_mensais") return "Regularizar aportes mensais";
    return "Realinhar carteira ao objetivo";
  }

  private descricaoAcao(codigo: string): string {
    if (codigo === "reduzir_assimetria_nos_proximos_aportes") return "Direcione novos aportes para ativos sub-representados.";
    if (codigo === "diversificar_por_classe_de_ativo") return "Amplie classes defensivas e complementares na carteira.";
    if (codigo === "regularizar_aportes_mensais") return "Defina e execute uma rotina estável de aportes mensais.";
    return "Ajuste a alocação para refletir melhor seu objetivo declarado.";
  }
}
