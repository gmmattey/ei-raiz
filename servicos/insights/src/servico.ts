import type { AcaoPrioritaria, Diagnostico, PerfilFinanceiro, RiscoPrincipal, ScoreCarteira, ServicoInsights } from "@ei/contratos";
import type { ImpactoDecisoesRecentes, MetricasCarteira, RepositorioInsights } from "./repositorio";

type Fator = { label: string; impacto: number };
type PilarScore = keyof ScoreCarteira["pilares"];
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
  | "evolucaoNegativa"
  | "liquidezBaixa"
  | "dinheiroParadoAlto"
  | "concentracaoEmImovel"
  | "dependenciaDeAtivoIliquido"
  | "endividamentoAlto"
  | "usoExcessivoDaReserva"
  | "custoFixoElevado"
  | "compraIncompativelComMomento"
  | "veiculoAcimaDaCapacidade"
  | "financiamentoDesfavoravel";

type PenalidadeAplicada = {
  tipo: TipoPenalidade;
  peso: number;
  descricao: string;
  pilar: PilarScore;
};

type InsightPrincipal = {
  titulo: string;
  descricao: string;
  acao: string;
};

type DiagnosticoFinal = {
  mensagem: string;
  impactoConcreto: string;
  consequencia: string;
  oQueFazerAgora: string;
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
  impactoDecisoesRecentes: ImpactoDecisoesRecentes;
};

const clamp = (min: number, max: number, value: number): number => Math.max(min, Math.min(max, value));
const arred = (value: number): number => Math.round(value);

const defaultScoreConfig = {
  pesos: {
    estrategiaCarteira: 35,
    comportamentoFinanceiro: 25,
    estruturaPatrimonial: 20,
    adequacaoMomentoVida: 20,
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
    liquidezBaixa: 6,
    dinheiroParadoAlto: 4,
    concentracaoEmImovel: 5,
    dependenciaDeAtivoIliquido: 5,
    endividamentoAlto: 7,
    usoExcessivoDaReserva: 5,
    custoFixoElevado: 4,
    compraIncompativelComMomento: 6,
    veiculoAcimaDaCapacidade: 5,
    financiamentoDesfavoravel: 4,
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
    const [configRaw, perfil, metricas, ultimo, impactoDecisoesRecentes] = await Promise.all([
      this.repositorio.obterConfiguracaoScore(),
      this.repositorio.obterPerfil(usuarioId),
      this.repositorio.obterMetricasCarteira(usuarioId),
      this.repositorio.obterUltimoSnapshotScore(usuarioId),
      this.repositorio.obterImpactoDecisoesRecentes(usuarioId),
    ]);
    const config = this.montarConfiguracaoScore(configRaw);
    const penalidadesAplicadas = this.calcularPenalidades(metricas, perfil, config);
    const totalPenalidade = penalidadesAplicadas.reduce((acc, item) => acc + item.peso, 0);
    const scoreValor = clamp(0, 100, arred(100 - totalPenalidade));
    const faixa = mapFaixa(scoreValor, config.thresholds);
    const classificacao = mapClassificacao(scoreValor, config.thresholds);
    const retorno = arred(metricas.evolucaoPatrimonio12m * 100) / 100;
    const atualizadoEm = new Date().toISOString();

    const pilares = this.calcularPilares(config, penalidadesAplicadas);
    const fatoresPositivos = this.calcularFatoresPositivos(metricas, perfil).slice(0, 5);
    const fatoresNegativos = [...penalidadesAplicadas]
      .map((item) => ({ label: item.descricao, impacto: -item.peso }))
      .sort((a, b) => a.impacto - b.impacto)
      .slice(0, 5);

    const penalidadePrincipal = [...penalidadesAplicadas].sort((a, b) => b.peso - a.peso)[0] ?? null;
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
      pilares,
      atualizadoEm,
    };

    await this.repositorio.salvarSnapshotScore(usuarioId, {
      score: scoreDetalhado.score,
      faixa: scoreDetalhado.faixa,
      riscoPrincipal: scoreDetalhado.riscoPrincipal,
      acaoPrioritaria: scoreDetalhado.acaoPrioritaria,
      pilares: scoreDetalhado.pilares,
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

    const diagnostico = this.gerarDiagnosticoFinal(scoreValor, retorno, insightPrincipal, impactoDecisoesRecentes);
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
      impactoDecisoesRecentes,
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

    const add = (tipo: TipoPenalidade, descricao: string, pilar: PilarScore): void => {
      penalidades.push({
        tipo,
        peso: config.penalidades[tipo],
        descricao,
        pilar,
      });
    };

    if (perfilRisco.includes("conservador") && rv > 30) {
      add("perfilConservadorRvAlto", "Perfil conservador com exposição elevada a renda variável.", "estrategiaCarteira");
    }
    if (perfilRisco.includes("moderado") && rv > 60) {
      add("perfilModeradoRvAlto", "Perfil moderado com exposição agressiva acima do esperado.", "estrategiaCarteira");
    }
    if (perfilRisco.includes("arrojado") && rv < 20) {
      add("perfilArrojadoRvBaixo", "Perfil arrojado com baixa exposição a ativos de crescimento.", "estrategiaCarteira");
    }
    if (horizonte.includes("curto") && rv > 50) {
      add("horizonteCurtoAgressivo", "Horizonte curto com risco elevado na carteira.", "adequacaoMomentoVida");
    }
    if (rendaMensal > 0 && rendaMensal < 5000 && metricas.maiorParticipacao > 35 && rv > 50) {
      add("rendaBaixaVolatilidadeAlta", "Volatilidade da carteira incompatível com faixa de renda atual.", "adequacaoMomentoVida");
    }

    if (metricas.maiorParticipacao > 25) {
      add("maiorAtivoAlto", "Carteira concentrada no maior ativo acima de 25%.", "estrategiaCarteira");
    }
    if (metricas.top3Participacao > 60) {
      add("top3Concentrado", "Top 3 ativos concentram risco estrutural da carteira.", "estrategiaCarteira");
    }
    if (metricas.quantidadeCategorias <= 1) {
      add("classeUnica", "Apenas uma classe de ativos na carteira.", "estrategiaCarteira");
    }
    if (metricas.quantidadeAtivos < 4) {
      add("poucosAtivos", "Quantidade de ativos insuficiente para diversificação mínima.", "estrategiaCarteira");
    }
    if (!perfilRisco.includes("arrojado") && metricas.percentualDefensivo <= 0) {
      add("semDefensivo", "Carteira sem componente defensivo para o perfil atual.", "estrategiaCarteira");
    }

    if (objetivo.includes("preserva") && rv > 50) {
      add("objetivoPreservacaoRisco", "Objetivo de preservação com risco acima do esperado.", "adequacaoMomentoVida");
    }
    if (objetivo.includes("crescimento") && rf > 90 && horizonte.includes("longo")) {
      add("objetivoCrescimentoDefensivo", "Objetivo de crescimento com carteira excessivamente defensiva.", "adequacaoMomentoVida");
    }
    if (objetivo.includes("renda") && rf < 20) {
      add("objetivoRendaSemBase", "Objetivo de renda com base fraca em ativos geradores de renda.", "adequacaoMomentoVida");
    }
    if (objetivo.includes("aposentadoria") && metricas.mesesComAporteUltimos6m < 4) {
      add("objetivoAposentadoriaSemConsistencia", "Objetivo de longo prazo sem consistência de aportes recentes.", "comportamentoFinanceiro");
    }

    if (metricas.mesesComAporteUltimos6m < 3) {
      add("aportesInconsistentes", "Baixa consistência de aportes nos últimos 6 meses.", "comportamentoFinanceiro");
    }
    if (metricas.evolucaoPatrimonio12m < 0) {
      add("evolucaoNegativa", "Patrimônio em evolução negativa no horizonte de 12 meses.", "comportamentoFinanceiro");
    }
    if (metricas.percentualLiquidezImediata < 10) {
      add("liquidezBaixa", "Liquidez imediata abaixo do mínimo recomendado.", "estruturaPatrimonial");
    }
    if (metricas.percentualDinheiroParado > 25) {
      add("dinheiroParadoAlto", "Excesso de dinheiro parado em caixa/poupança.", "estruturaPatrimonial");
    }
    if (metricas.percentualIliquido > 60) {
      add("dependenciaDeAtivoIliquido", "Dependência elevada de ativos ilíquidos.", "estruturaPatrimonial");
    }
    if (metricas.percentualDividaSobrePatrimonio > 35) {
      add("endividamentoAlto", "Nível de endividamento elevado em relação ao patrimônio.", "comportamentoFinanceiro");
    }
    if (metricas.percentualDinheiroParado > 35 && metricas.percentualLiquidezImediata < 8) {
      add("usoExcessivoDaReserva", "Reserva mal distribuída entre liquidez e retorno.", "estruturaPatrimonial");
    }

    return penalidades;
  }

  private calcularPilares(
    config: typeof defaultScoreConfig,
    penalidadesAplicadas: PenalidadeAplicada[],
  ): ScoreCarteira["pilares"] {
    const penalidadePorPilar: Record<PilarScore, number> = {
      estrategiaCarteira: 0,
      comportamentoFinanceiro: 0,
      estruturaPatrimonial: 0,
      adequacaoMomentoVida: 0,
    };
    for (const item of penalidadesAplicadas) {
      penalidadePorPilar[item.pilar] += item.peso;
    }
    return {
      estrategiaCarteira: clamp(0, config.pesos.estrategiaCarteira, arred(config.pesos.estrategiaCarteira - penalidadePorPilar.estrategiaCarteira)),
      comportamentoFinanceiro: clamp(0, config.pesos.comportamentoFinanceiro, arred(config.pesos.comportamentoFinanceiro - penalidadePorPilar.comportamentoFinanceiro)),
      estruturaPatrimonial: clamp(0, config.pesos.estruturaPatrimonial, arred(config.pesos.estruturaPatrimonial - penalidadePorPilar.estruturaPatrimonial)),
      adequacaoMomentoVida: clamp(0, config.pesos.adequacaoMomentoVida, arred(config.pesos.adequacaoMomentoVida - penalidadePorPilar.adequacaoMomentoVida)),
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
          titulo: "Ritmo financeiro inconsistente",
          descricao: "A frequência de aportes e a evolução patrimonial estão abaixo do esperado.",
          acao: "Regularizar rotina de aportes e revisar estratégia de execução.",
        };
      case "liquidezBaixa":
      case "dinheiroParadoAlto":
      case "dependenciaDeAtivoIliquido":
      case "endividamentoAlto":
      case "usoExcessivoDaReserva":
        return {
          titulo: "Estrutura patrimonial pressionada",
          descricao: "A composição entre liquidez, ativos ilíquidos e dívidas está frágil.",
          acao: "Reforçar reserva líquida e reduzir exposição ilíquida nos próximos aportes.",
        };
      default:
        return {
          titulo: "Estratégia ajustável",
          descricao: penalidade.descricao,
          acao: "Revisar composição da carteira e objetivo financeiro.",
        };
    }
  }

  private gerarDiagnosticoFinal(
    score: number,
    retorno: number,
    insightPrincipal: InsightPrincipal,
    impactoDecisoes: ImpactoDecisoesRecentes,
  ): DiagnosticoFinal {
    const impactoConcreto = score < 70
      ? `Seu score está em ${score}/100, abaixo do patamar saudável para execução consistente.`
      : `Seu score está em ${score}/100, com estrutura financeira funcional.`;

    const consequencia = score < 70
      ? "Mantendo o cenário atual, o risco de perda de eficiência e desalinhamento com objetivo aumenta nos próximos ciclos."
      : "Se você mantiver a disciplina atual, a tendência é sustentar evolução com menor volatilidade estrutural.";

    const efeitoDecisoes = impactoDecisoes.quantidade > 0
      ? `Decisões recentes ${impactoDecisoes.deltaTotal >= 0 ? "melhoraram" : "pioraram"} o score em ${impactoDecisoes.deltaTotal.toFixed(1)} pontos acumulados.`
      : "Ainda não há decisões simuladas salvas para calibrar o diagnóstico comportamental.";

    if (retorno > 0 && score < 70) {
      return {
        mensagem: `Sua carteira rendeu ${retorno.toFixed(2)}%, mas a estratégia está frágil. ${efeitoDecisoes}`,
        impactoConcreto,
        consequencia,
        oQueFazerAgora: insightPrincipal.acao,
        insightPrincipal,
      };
    }
    if (retorno < 0 && score >= 80) {
      return {
        mensagem: `A estratégia está sólida, mas o mercado pressionou o retorno (${retorno.toFixed(2)}%). ${efeitoDecisoes}`,
        impactoConcreto,
        consequencia,
        oQueFazerAgora: insightPrincipal.acao,
        insightPrincipal,
      };
    }
    if (retorno < 0 && score < 70) {
      return {
        mensagem: `Resultado e estrutura estão pressionados (retorno ${retorno.toFixed(2)}%). ${efeitoDecisoes}`,
        impactoConcreto,
        consequencia,
        oQueFazerAgora: insightPrincipal.acao,
        insightPrincipal,
      };
    }
    return {
      mensagem: `Estratégia e resultado estão em linha (retorno ${retorno.toFixed(2)}%). ${efeitoDecisoes}`,
      impactoConcreto,
      consequencia,
      oQueFazerAgora: insightPrincipal.acao,
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
    if (["liquidezBaixa", "dinheiroParadoAlto", "dependenciaDeAtivoIliquido", "endividamentoAlto", "usoExcessivoDaReserva"].includes(tipo)) {
      return "estrutura_patrimonial_fragil";
    }
    return "desalinhamento_objetivo";
  }

  private codigoAcaoPorRisco(riscoPrincipal: string): string {
    if (riscoPrincipal === "concentracao_renda_variavel") return "diversificar_por_classe_de_ativo";
    if (riscoPrincipal === "inconsistencia_aportes") return "regularizar_aportes_mensais";
    if (riscoPrincipal === "risco_incompativel_perfil") return "reduzir_assimetria_nos_proximos_aportes";
    if (riscoPrincipal === "estrutura_patrimonial_fragil") return "recompor_reserva_e_liquidez";
    if (riscoPrincipal === "sem_risco_estrutural") return "manter_estrategia_com_consistencia";
    return "realinhar_carteira_ao_objetivo";
  }

  private tituloRisco(codigo: string): string {
    if (codigo === "concentracao_renda_variavel") return "Concentração excessiva em poucos ativos";
    if (codigo === "inconsistencia_aportes") return "Inconsistência de aportes e evolução";
    if (codigo === "risco_incompativel_perfil") return "Risco incompatível com seu perfil";
    if (codigo === "estrutura_patrimonial_fragil") return "Liquidez e estrutura patrimonial fragilizadas";
    if (codigo === "sem_risco_estrutural") return "Sem risco estrutural dominante";
    return "Desalinhamento com objetivo";
  }

  private descricaoRisco(codigo: string): string {
    if (codigo === "concentracao_renda_variavel") return "A carteira está concentrada e mais vulnerável a eventos isolados.";
    if (codigo === "inconsistencia_aportes") return "A regularidade de aportes e evolução patrimonial está abaixo do esperado.";
    if (codigo === "risco_incompativel_perfil") return "A exposição de risco não está alinhada com seu perfil e contexto atual.";
    if (codigo === "estrutura_patrimonial_fragil") return "O patrimônio está pouco líquido e com pressão de endividamento ou caixa ineficiente.";
    if (codigo === "sem_risco_estrutural") return "Não foi identificada fragilidade dominante com peso crítico.";
    return "A alocação atual não está totalmente aderente ao objetivo financeiro declarado.";
  }

  private tituloAcao(codigo: string): string {
    if (codigo === "diversificar_por_classe_de_ativo") return "Diversificar por classe de ativo";
    if (codigo === "regularizar_aportes_mensais") return "Regularizar aportes mensais";
    if (codigo === "reduzir_assimetria_nos_proximos_aportes") return "Rebalancear risco nos próximos aportes";
    if (codigo === "recompor_reserva_e_liquidez") return "Recompor reserva e liquidez imediata";
    if (codigo === "manter_estrategia_com_consistencia") return "Manter estratégia com disciplina";
    return "Realinhar carteira ao objetivo";
  }
}
