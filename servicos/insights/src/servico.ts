import type { AcaoPrioritaria, Diagnostico, PerfilFinanceiro, RiscoPrincipal, ScoreCarteira, ServicoInsights } from "@ei/contratos";
import type { MetricasCarteira, RepositorioInsights } from "./repositorio";

type Fator = { label: string; impacto: number };
type BlocoScore = keyof ScoreCarteira["blocos"];
type TipoPenalidade =
  | "perfilConservadorRvAlto"
  | "perfilModeradoRvAlto"
  | "perfilArrojadoRvBaixo"
  | "horizonteCurtoAgressivo"
  | "rendaBaixaVolatilidadeAlta"
  | "maiorAtivoAlto"
  | "top3Concentrado"
  | "classeUnica"
  | "poucosAtivos"
  | "semDefensivo"
  | "objetivoPreservacaoRisco"
  | "objetivoCrescimentoDefensivo"
  | "objetivoRendaSemBase"
  | "objetivoAposentadoriaSemConsistencia"
  | "aportesInconsistentes"
  | "evolucaoNegativa";

type PenalidadeAplicada = {
  tipo: TipoPenalidade;
  peso: number;
  descricao: string;
  bloco: BlocoScore;
};

type InsightPrincipal = {
  titulo: string;
  descricao: string;
  acao: string;
};

type DiagnosticoFinal = {
  mensagem: string;
  insightPrincipal: InsightPrincipal;
};

export type ResumoInsightsMotor = {
  score: number;
  classificacao: "critico" | "baixo" | "ok" | "bom" | "excelente";
  retorno: number;
  diagnostico: DiagnosticoFinal;
  scoreDetalhado: ScoreCarteira;
  diagnosticoLegado: Diagnostico;
  riscoPrincipal: RiscoPrincipal;
  acaoPrioritaria: AcaoPrioritaria;
  penalidadesAplicadas: PenalidadeAplicada[];
};

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
    aportesInconsistentes: 6,
    evolucaoNegativa: 8,
  },
};

const mapFaixa = (score: number, thresholds: typeof defaultScoreConfig.thresholds): ScoreCarteira["faixa"] => {
  if (score <= thresholds.criticoMax) return "critico";
  if (score <= thresholds.fragilMax) return "fragil";
  if (score <= thresholds.regularMax) return "regular";
  if (score <= thresholds.bomMax) return "bom";
  return "muito_bom";
};

const mapClassificacao = (score: number, thresholds: typeof defaultScoreConfig.thresholds): ResumoInsightsMotor["classificacao"] => {
  if (score <= thresholds.criticoMax) return "critico";
  if (score <= thresholds.fragilMax) return "baixo";
  if (score <= thresholds.regularMax) return "ok";
  if (score <= thresholds.bomMax) return "bom";
  return "excelente";
};

export class ServicoInsightsPadrao implements ServicoInsights {
  constructor(private readonly repositorio: RepositorioInsights) {}

  async gerarResumo(usuarioId: string): Promise<ResumoInsightsMotor> {
    const [configRaw, perfil, metricas, ultimo] = await Promise.all([
      this.repositorio.obterConfiguracaoScore(),
      this.repositorio.obterPerfil(usuarioId),
      this.repositorio.obterMetricasCarteira(usuarioId),
      this.repositorio.obterUltimoSnapshotScore(usuarioId),
    ]);
    const config = this.montarConfiguracaoScore(configRaw);
    const penalidadesAplicadas = this.calcularPenalidades(metricas, perfil, config);
    const totalPenalidade = penalidadesAplicadas.reduce((acc, item) => acc + item.peso, 0);
    const scoreValor = clamp(0, 100, arred(100 - totalPenalidade));
    const faixa = mapFaixa(scoreValor, config.thresholds);
    const classificacao = mapClassificacao(scoreValor, config.thresholds);
    const retorno = arred(metricas.evolucaoPatrimonio12m * 100) / 100;
    const atualizadoEm = new Date().toISOString();

    const blocos = this.calcularBlocos(config, penalidadesAplicadas);
    const fatoresPositivos = this.calcularFatoresPositivos(metricas, perfil).slice(0, 5);
    const fatoresNegativos = penalidadesAplicadas
      .map((item) => ({ label: item.descricao, impacto: -item.peso }))
      .sort((a, b) => a.impacto - b.impacto)
      .slice(0, 5);

    const penalidadePrincipal = penalidadesAplicadas.sort((a, b) => b.peso - a.peso)[0] ?? null;
    const insightPrincipal = this.traduzirPenalidade(penalidadePrincipal);
    const riscoCodigo = this.codigoRiscoPorPenalidade(penalidadePrincipal?.tipo);
    const acaoCodigo = this.codigoAcaoPorRisco(riscoCodigo);

    const scoreAnterior = ultimo?.score;
    const variacao = typeof scoreAnterior === "number" ? scoreValor - scoreAnterior : undefined;

    const scoreDetalhado: ScoreCarteira = {
      scoreAnterior,
      variacao,
      score: scoreValor,
      faixa,
      fatoresPositivos,
      fatoresNegativos,
      riscoPrincipal: riscoCodigo,
      acaoPrioritaria: acaoCodigo,
      blocos,
      atualizadoEm,
    };

    await this.repositorio.salvarSnapshotScore(usuarioId, {
      score: scoreDetalhado.score,
      faixa: scoreDetalhado.faixa,
      riscoPrincipal: scoreDetalhado.riscoPrincipal,
      acaoPrioritaria: scoreDetalhado.acaoPrioritaria,
      blocos: scoreDetalhado.blocos,
      fatoresPositivos: scoreDetalhado.fatoresPositivos,
      fatoresNegativos: scoreDetalhado.fatoresNegativos,
    });

    const riscoPrincipal: RiscoPrincipal = {
      codigo: riscoCodigo,
      titulo: this.tituloRisco(riscoCodigo),
      descricao: this.descricaoRisco(riscoCodigo),
      severidade: faixa === "critico" || faixa === "fragil" ? "alto" : faixa === "regular" ? "medio" : "baixo",
    };

    const acaoPrioritaria: AcaoPrioritaria = {
      codigo: acaoCodigo,
      titulo: this.tituloAcao(acaoCodigo),
      descricao: insightPrincipal.acao,
      impactoEsperado: `Melhora esperada na classificação atual (${classificacao}).`,
    };

    const diagnostico = this.gerarDiagnosticoFinal(scoreValor, retorno, insightPrincipal);
    const diagnosticoLegado: Diagnostico = {
      resumo: diagnostico.mensagem,
      riscos: [riscoPrincipal],
      acoes: [acaoPrioritaria],
    };

    return {
      score: scoreValor,
      classificacao,
      retorno,
      diagnostico,
      scoreDetalhado,
      diagnosticoLegado,
      riscoPrincipal,
      acaoPrioritaria,
      penalidadesAplicadas,
    };
  }

  async calcularScore(usuarioId: string): Promise<ScoreCarteira> {
    const resumo = await this.gerarResumo(usuarioId);
    return resumo.scoreDetalhado;
  }

  async gerarDiagnostico(usuarioId: string): Promise<Diagnostico> {
    const resumo = await this.gerarResumo(usuarioId);
    return resumo.diagnosticoLegado;
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

  private calcularPenalidades(
    metricas: MetricasCarteira,
    perfil: PerfilFinanceiro | null,
    config: typeof defaultScoreConfig,
  ): PenalidadeAplicada[] {
    const penalidades: PenalidadeAplicada[] = [];
    const perfilRisco = (perfil?.perfilRisco ?? "").toLowerCase();
    const objetivo = (perfil?.objetivo ?? "").toLowerCase();
    const horizonte = (perfil?.horizonte ?? "").toLowerCase();
    const rendaMensal = perfil?.rendaMensal ?? 0;
    const rv = metricas.percentualRendaVariavel;
    const rf = metricas.percentualRendaFixa;

    const add = (tipo: TipoPenalidade, descricao: string, bloco: BlocoScore): void => {
      penalidades.push({
        tipo,
        peso: config.penalidades[tipo],
        descricao,
        bloco,
      });
    };

    if (perfilRisco.includes("conservador") && rv > 30) {
      add("perfilConservadorRvAlto", "Perfil conservador com exposição elevada a renda variável.", "aderenciaPerfil");
    }
    if (perfilRisco.includes("moderado") && rv > 60) {
      add("perfilModeradoRvAlto", "Perfil moderado com exposição agressiva acima do esperado.", "aderenciaPerfil");
    }
    if (perfilRisco.includes("arrojado") && rv < 20) {
      add("perfilArrojadoRvBaixo", "Perfil arrojado com baixa exposição a ativos de crescimento.", "aderenciaPerfil");
    }
    if (horizonte.includes("curto") && rv > 50) {
      add("horizonteCurtoAgressivo", "Horizonte curto com risco elevado na carteira.", "aderenciaPerfil");
    }
    if (rendaMensal > 0 && rendaMensal < 5000 && metricas.maiorParticipacao > 35 && rv > 50) {
      add("rendaBaixaVolatilidadeAlta", "Volatilidade da carteira incompatível com faixa de renda atual.", "aderenciaPerfil");
    }

    if (metricas.maiorParticipacao > 25) {
      add("maiorAtivoAlto", "Carteira concentrada no maior ativo acima de 25%.", "qualidadeCarteira");
    }
    if (metricas.top3Participacao > 60) {
      add("top3Concentrado", "Top 3 ativos concentram risco estrutural da carteira.", "qualidadeCarteira");
    }
    if (metricas.quantidadeCategorias <= 1) {
      add("classeUnica", "Apenas uma classe de ativos na carteira.", "qualidadeCarteira");
    }
    if (metricas.quantidadeAtivos < 4) {
      add("poucosAtivos", "Quantidade de ativos insuficiente para diversificação mínima.", "qualidadeCarteira");
    }
    if (!perfilRisco.includes("arrojado") && metricas.percentualDefensivo <= 0) {
      add("semDefensivo", "Carteira sem componente defensivo para o perfil atual.", "qualidadeCarteira");
    }

    if (objetivo.includes("preserva") && rv > 50) {
      add("objetivoPreservacaoRisco", "Objetivo de preservação com risco acima do esperado.", "adequacaoObjetivo");
    }
    if (objetivo.includes("crescimento") && rf > 90 && horizonte.includes("longo")) {
      add("objetivoCrescimentoDefensivo", "Objetivo de crescimento com carteira excessivamente defensiva.", "adequacaoObjetivo");
    }
    if (objetivo.includes("renda") && rf < 20) {
      add("objetivoRendaSemBase", "Objetivo de renda com base fraca em ativos geradores de renda.", "adequacaoObjetivo");
    }
    if (objetivo.includes("aposentadoria") && metricas.mesesComAporteUltimos6m < 4) {
      add("objetivoAposentadoriaSemConsistencia", "Objetivo de longo prazo sem consistência de aportes recentes.", "adequacaoObjetivo");
    }

    if (metricas.mesesComAporteUltimos6m < 3) {
      add("aportesInconsistentes", "Baixa consistência de aportes nos últimos 6 meses.", "consistenciaAportes");
    }
    if (metricas.evolucaoPatrimonio12m < 0) {
      add("evolucaoNegativa", "Patrimônio em evolução negativa no horizonte de 12 meses.", "historicoMomentoVida");
    }

    return penalidades;
  }

  private calcularBlocos(
    config: typeof defaultScoreConfig,
    penalidadesAplicadas: PenalidadeAplicada[],
  ): ScoreCarteira["blocos"] {
    const penalidadePorBloco: Record<BlocoScore, number> = {
      aderenciaPerfil: 0,
      qualidadeCarteira: 0,
      consistenciaAportes: 0,
      adequacaoObjetivo: 0,
      historicoMomentoVida: 0,
    };
    for (const item of penalidadesAplicadas) {
      penalidadePorBloco[item.bloco] += item.peso;
    }
    return {
      aderenciaPerfil: clamp(0, config.pesos.aderenciaPerfil, arred(config.pesos.aderenciaPerfil - penalidadePorBloco.aderenciaPerfil)),
      qualidadeCarteira: clamp(0, config.pesos.qualidadeCarteira, arred(config.pesos.qualidadeCarteira - penalidadePorBloco.qualidadeCarteira)),
      consistenciaAportes: clamp(0, config.pesos.consistenciaAportes, arred(config.pesos.consistenciaAportes - penalidadePorBloco.consistenciaAportes)),
      adequacaoObjetivo: clamp(0, config.pesos.adequacaoObjetivo, arred(config.pesos.adequacaoObjetivo - penalidadePorBloco.adequacaoObjetivo)),
      historicoMomentoVida: clamp(0, config.pesos.historicoMomentoVida, arred(config.pesos.historicoMomentoVida - penalidadePorBloco.historicoMomentoVida)),
    };
  }

  private calcularFatoresPositivos(metricas: MetricasCarteira, perfil: PerfilFinanceiro | null): Fator[] {
    const positivos: Fator[] = [];
    if (metricas.quantidadeCategorias >= 3) positivos.push({ label: "Boa diversificação entre classes de ativos.", impacto: 3 });
    if (metricas.maiorParticipacao <= 25 && metricas.top3Participacao <= 60) positivos.push({ label: "Concentração controlada no topo da carteira.", impacto: 3 });
    if (metricas.percentualInternacional > 5) positivos.push({ label: "Exposição internacional presente.", impacto: 2 });
    if (metricas.mesesComAporteUltimos6m >= 5) positivos.push({ label: "Consistência recente de aportes.", impacto: 4 });
    if (metricas.evolucaoPatrimonio12m > 0) positivos.push({ label: "Evolução patrimonial positiva em 12 meses.", impacto: 4 });
    if ((perfil?.objetivo ?? "").toLowerCase().includes("crescimento") && metricas.percentualRendaVariavel >= 30) {
      positivos.push({ label: "Alocação compatível com objetivo de crescimento.", impacto: 2 });
    }
    return positivos.sort((a, b) => b.impacto - a.impacto);
  }

  private traduzirPenalidade(penalidade: PenalidadeAplicada | null): InsightPrincipal {
    if (!penalidade) {
      return {
        titulo: "Estratégia saudável",
        descricao: "Não identificamos penalidade estrutural dominante na carteira atual.",
        acao: "Manter consistência de aportes e monitorar mudanças de perfil.",
      };
    }
    switch (penalidade.tipo) {
      case "perfilConservadorRvAlto":
      case "perfilModeradoRvAlto":
      case "horizonteCurtoAgressivo":
      case "rendaBaixaVolatilidadeAlta":
        return {
          titulo: "Risco acima do seu perfil",
          descricao: "Sua carteira está assumindo mais risco do que o perfil e o contexto atual sugerem.",
          acao: "Reduzir exposição em renda variável e reforçar componente defensivo.",
        };
      case "maiorAtivoAlto":
      case "top3Concentrado":
      case "classeUnica":
      case "poucosAtivos":
        return {
          titulo: "Carteira concentrada",
          descricao: "Boa parte do patrimônio está em poucos ativos ou poucas classes.",
          acao: "Diversificar por classe e reduzir concentração no topo da carteira.",
        };
      case "objetivoPreservacaoRisco":
      case "objetivoCrescimentoDefensivo":
      case "objetivoRendaSemBase":
      case "objetivoAposentadoriaSemConsistencia":
        return {
          titulo: "Carteira desalinhada ao objetivo",
          descricao: "A alocação atual não está coerente com o objetivo financeiro declarado.",
          acao: "Rebalancear carteira para aproximar risco, prazo e objetivo.",
        };
      case "aportesInconsistentes":
      case "evolucaoNegativa":
        return {
          titulo: "Ritmo de evolução fraco",
          descricao: "A frequência de aportes e a evolução patrimonial estão abaixo do esperado.",
          acao: "Regularizar rotina de aportes e revisar estratégia de execução.",
        };
      case "semDefensivo":
        return {
          titulo: "Proteção insuficiente",
          descricao: "A carteira não tem camada defensiva para absorver volatilidade.",
          acao: "Adicionar ativos defensivos compatíveis com seu perfil.",
        };
      default:
        return {
          titulo: "Estratégia ajustável",
          descricao: penalidade.descricao,
          acao: "Revisar composição da carteira e objetivo financeiro.",
        };
    }
  }

  private gerarDiagnosticoFinal(score: number, retorno: number, insightPrincipal: InsightPrincipal): DiagnosticoFinal {
    if (retorno > 0 && score < 70) {
      return {
        mensagem: `Sua carteira rendeu ${retorno.toFixed(2)}% em 12 meses, mas a estratégia ainda está frágil.`,
        insightPrincipal,
      };
    }
    if (retorno < 0 && score >= 80) {
      return {
        mensagem: `A estratégia está bem estruturada, mas o mercado impactou o retorno (${retorno.toFixed(2)}%).`,
        insightPrincipal,
      };
    }
    if (retorno < 0 && score < 70) {
      return {
        mensagem: `Resultado e estrutura estão pressionados (retorno ${retorno.toFixed(2)}%). Priorize ajuste estrutural.`,
        insightPrincipal,
      };
    }
    return {
      mensagem: `Estratégia e resultado estão em linha (retorno ${retorno.toFixed(2)}%).`,
      insightPrincipal,
    };
  }

  private codigoRiscoPorPenalidade(tipo?: TipoPenalidade): string {
    if (!tipo) return "sem_risco_estrutural";
    if (["maiorAtivoAlto", "top3Concentrado", "classeUnica", "poucosAtivos"].includes(tipo)) return "concentracao_renda_variavel";
    if (["aportesInconsistentes", "evolucaoNegativa"].includes(tipo)) return "inconsistencia_aportes";
    if (["perfilConservadorRvAlto", "perfilModeradoRvAlto", "horizonteCurtoAgressivo", "rendaBaixaVolatilidadeAlta", "semDefensivo"].includes(tipo)) {
      return "risco_incompativel_perfil";
    }
    return "desalinhamento_objetivo";
  }

  private codigoAcaoPorRisco(riscoPrincipal: string): string {
    if (riscoPrincipal === "concentracao_renda_variavel") return "diversificar_por_classe_de_ativo";
    if (riscoPrincipal === "inconsistencia_aportes") return "regularizar_aportes_mensais";
    if (riscoPrincipal === "risco_incompativel_perfil") return "reduzir_assimetria_nos_proximos_aportes";
    if (riscoPrincipal === "sem_risco_estrutural") return "manter_estrategia_com_consistencia";
    return "realinhar_carteira_ao_objetivo";
  }

  private tituloRisco(codigo: string): string {
    if (codigo === "concentracao_renda_variavel") return "Concentração excessiva em poucos ativos";
    if (codigo === "inconsistencia_aportes") return "Inconsistência de aportes e evolução";
    if (codigo === "risco_incompativel_perfil") return "Risco incompatível com seu perfil";
    if (codigo === "sem_risco_estrutural") return "Sem risco estrutural dominante";
    return "Desalinhamento com objetivo";
  }

  private descricaoRisco(codigo: string): string {
    if (codigo === "concentracao_renda_variavel") return "A carteira está concentrada e mais vulnerável a eventos isolados.";
    if (codigo === "inconsistencia_aportes") return "A regularidade de aportes e evolução patrimonial está abaixo do esperado.";
    if (codigo === "risco_incompativel_perfil") return "A exposição de risco não está alinhada com seu perfil e contexto atual.";
    if (codigo === "sem_risco_estrutural") return "Não foi identificada fragilidade dominante com peso crítico.";
    return "A alocação atual não está totalmente aderente ao objetivo financeiro declarado.";
  }

  private tituloAcao(codigo: string): string {
    if (codigo === "diversificar_por_classe_de_ativo") return "Diversificar por classe de ativo";
    if (codigo === "regularizar_aportes_mensais") return "Regularizar aportes mensais";
    if (codigo === "reduzir_assimetria_nos_proximos_aportes") return "Rebalancear risco nos próximos aportes";
    if (codigo === "manter_estrategia_com_consistencia") return "Manter estratégia com disciplina";
    return "Realinhar carteira ao objetivo";
  }
}
