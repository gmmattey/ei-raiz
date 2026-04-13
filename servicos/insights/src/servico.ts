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
  | "concentracaoExtrema"
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
  | "dependenciaDeAtivoIliquido"
  | "endividamentoAlto"
  // Regras de adequação ao momento de vida por faixa etária
  | "idadeMaduraRiscoAgressivo"
  | "idadeJovemSubaproveitada"
  | "idadePreAposentadoriaDefensiva";

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
  patrimonioConsolidado: {
    patrimonioBruto: number;
    patrimonioLiquido: number;
    ativosLiquidos: number;
    ativosIliquidos: number;
    passivoTotal: number;
    distribuicao: {
      imoveis: number;
      veiculos: number;
      investimentos: number;
      caixa: number;
      outros: number;
    };
  };
  pesosProprietarios: {
    liquidez: number;
    patrimonioLiquido: number;
    diversificacao: number;
    concentracaoIliquida: number;
    endividamento: number;
    reservaFinanceira: number;
    investimentos: number;
  };
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
    concentracaoExtrema: 20,
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
    dependenciaDeAtivoIliquido: 5,
    endividamentoAlto: 7,
    idadeMaduraRiscoAgressivo: 8,
    idadeJovemSubaproveitada: 4,
    idadePreAposentadoriaDefensiva: 5,
  },
};

const proprietaryWeights = {
  liquidez: 24,
  patrimonioLiquido: 18,
  diversificacao: 14,
  concentracaoIliquida: 12,
  endividamento: 20,
  reservaFinanceira: 8,
  investimentos: 4,
} as const;

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
    const pilares = this.calcularPilares(config, penalidadesAplicadas);
    const scoreBase = arred(
      pilares.estrategiaCarteira +
      pilares.comportamentoFinanceiro +
      pilares.estruturaPatrimonial +
      pilares.adequacaoMomentoVida,
    );
    const ajusteProprietario = this.calcularAjusteProprietario(metricas);
    const scoreValor = clamp(0, 100, scoreBase + ajusteProprietario);
    const faixa = mapFaixa(scoreValor, config.thresholds);
    const classificacao = mapClassificacao(scoreValor, config.thresholds);
    const retorno = arred(metricas.evolucaoPatrimonio12m * 100) / 100;
    const atualizadoEm = new Date().toISOString();
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

    const pontosRecuperaveis = penalidadePrincipal?.peso ?? 0;
    const acaoPrioritaria: AcaoPrioritaria = {
      codigo: acaoCodigo,
      titulo: this.tituloAcao(acaoCodigo),
      descricao: insightPrincipal.acao,
      impactoEsperado: pontosRecuperaveis > 0
        ? `Resolver isso pode recuperar até ${pontosRecuperaveis} pontos no seu score (de ${scoreValor}/100 para até ${Math.min(100, scoreValor + pontosRecuperaveis)}/100).`
        : `Melhora esperada na classificação atual: ${classificacao}.`,
    };

    const diagnostico = this.gerarDiagnosticoFinal(scoreValor, retorno, insightPrincipal, impactoDecisoesRecentes, config.thresholds);
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
      patrimonioConsolidado: {
        patrimonioBruto: metricas.patrimonioBruto,
        patrimonioLiquido: metricas.patrimonioLiquido,
        ativosLiquidos: metricas.ativosLiquidos,
        ativosIliquidos: metricas.ativosIliquidos,
        passivoTotal: metricas.passivoTotal,
        distribuicao: {
          imoveis: metricas.percentualEmImoveis,
          veiculos: metricas.percentualEmVeiculos,
          investimentos: metricas.percentualEmInvestimentos,
          caixa: metricas.percentualEmCaixa,
          outros: metricas.percentualEmOutros,
        },
      },
      pesosProprietarios: { ...proprietaryWeights },
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

    if (metricas.maiorParticipacao > 80) {
      add("concentracaoExtrema", "Um único ativo concentra mais de 80% do patrimônio.", "estrategiaCarteira");
    } else if (metricas.maiorParticipacao > 25) {
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
    if (objetivo.includes("aposentadoria") && metricas.mesesComAporteUltimos6m >= 3 && metricas.mesesComAporteUltimos6m < 4) {
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
    if (metricas.percentualEmImoveis > 55) {
      add("dependenciaDeAtivoIliquido", "Concentração patrimonial elevada em imóveis.", "estruturaPatrimonial");
    }
    if (metricas.percentualEmVeiculos > 25) {
      add("dinheiroParadoAlto", "Concentração patrimonial elevada em veículos.", "estruturaPatrimonial");
    }
    if (metricas.ativosLiquidos > 0 && metricas.passivoTotal / metricas.ativosLiquidos > 0.7) {
      add("endividamentoAlto", "Passivo pressiona fortemente a liquidez disponível.", "comportamentoFinanceiro");
    }

    // ── Regras de adequação ao momento de vida por faixa etária ──────────────
    const faixaEtaria = (perfil?.faixaEtaria ?? "").toLowerCase();
    const idadeMadura = faixaEtaria.startsWith("46") || faixaEtaria.startsWith("56") || faixaEtaria.startsWith("55+") || faixaEtaria.startsWith("56+");
    const idadeJovem = faixaEtaria.startsWith("18") || faixaEtaria.startsWith("26") || faixaEtaria.startsWith("20") || faixaEtaria.startsWith("25");
    const preAposentadoria = faixaEtaria.startsWith("56") || faixaEtaria.startsWith("55+") || faixaEtaria.startsWith("56+");

    // 46+ com >60% em renda variável: risco desproporcional para o momento
    if (idadeMadura && rv > 60) {
      add(
        "idadeMaduraRiscoAgressivo",
        `Faixa etária ${perfil?.faixaEtaria} com ${rv.toFixed(0)}% em renda variável — risco elevado para o momento de vida.`,
        "adequacaoMomentoVida",
      );
    }

    // 18-35 com >80% em renda fixa e horizonte longo: subaproveitamento do tempo
    if (idadeJovem && horizonte.includes("longo") && rf > 80) {
      add(
        "idadeJovemSubaproveitada",
        `Investidor jovem (${perfil?.faixaEtaria}) com horizonte longo mas carteira excessivamente conservadora (${rf.toFixed(0)}% em renda fixa).`,
        "adequacaoMomentoVida",
      );
    }

    // 55+ próximo da aposentadoria: exposição em RV acima de 40% é preocupante
    if (preAposentadoria && rv > 40) {
      add(
        "idadePreAposentadoriaDefensiva",
        `Próximo da aposentadoria (${perfil?.faixaEtaria}) com ${rv.toFixed(0)}% em renda variável — considere migrar gradualmente para ativos mais defensivos.`,
        "adequacaoMomentoVida",
      );
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
    if (metricas.percentualEmInvestimentos >= 20) positivos.push({ label: "Parcela relevante do patrimônio em investimentos produtivos.", impacto: 3 });
    if (metricas.ativosLiquidos > 0 && metricas.passivoTotal / metricas.ativosLiquidos < 0.25) positivos.push({ label: "Endividamento controlado frente à liquidez.", impacto: 4 });
    return positivos.sort((a, b) => b.impacto - a.impacto);
  }

  private calcularAjusteProprietario(metricas: MetricasCarteira): number {
    const scoreLiquidez =
      metricas.patrimonioBruto > 0 ? Math.max(0, Math.min(1, metricas.ativosLiquidos / metricas.patrimonioBruto)) : 0;
    const scorePatrimonioLiquido = metricas.patrimonioBruto > 0 ? Math.max(0, Math.min(1, metricas.patrimonioLiquido / metricas.patrimonioBruto)) : 0;
    const scoreDiversificacao = Math.max(0, Math.min(1, metricas.quantidadeCategorias / 5));
    const scoreConcentracaoIliquida = 1 - Math.max(0, Math.min(1, (metricas.percentualEmImoveis + metricas.percentualEmVeiculos) / 100));
    const scoreEndividamento = 1 - Math.max(0, Math.min(1, metricas.percentualDividaSobrePatrimonio / 100));
    const scoreReserva = Math.max(0, Math.min(1, metricas.percentualEmCaixa / 20));
    const scoreInvestimentos = Math.max(0, Math.min(1, metricas.percentualEmInvestimentos / 40));

    const weighted =
      scoreLiquidez * proprietaryWeights.liquidez +
      scorePatrimonioLiquido * proprietaryWeights.patrimonioLiquido +
      scoreDiversificacao * proprietaryWeights.diversificacao +
      scoreConcentracaoIliquida * proprietaryWeights.concentracaoIliquida +
      scoreEndividamento * proprietaryWeights.endividamento +
      scoreReserva * proprietaryWeights.reservaFinanceira +
      scoreInvestimentos * proprietaryWeights.investimentos;

    return Math.round(weighted - 50);
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
      case "concentracaoExtrema":
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
        return {
          titulo: "Estrutura patrimonial pressionada",
          descricao: "A composição entre liquidez, ativos ilíquidos e dívidas está frágil.",
          acao: "Reforçar reserva líquida e reduzir exposição ilíquida nos próximos aportes.",
        };
      case "idadeMaduraRiscoAgressivo":
      case "idadePreAposentadoriaDefensiva":
        return {
          titulo: "Risco desalinhado com o momento de vida",
          descricao: "Sua exposição a renda variável está elevada para a faixa etária declarada.",
          acao: "Migrar gradualmente parte da carteira para ativos de menor volatilidade compatíveis com o horizonte restante.",
        };
      case "idadeJovemSubaproveitada":
        return {
          titulo: "Potencial de crescimento subutilizado",
          descricao: "Com seu horizonte de investimento e faixa etária, uma carteira mais diversificada pode gerar retornos superiores no longo prazo.",
          acao: "Avaliar gradual aumento da exposição a renda variável e diversificação por classes de maior crescimento.",
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
    thresholds: typeof defaultScoreConfig.thresholds,
  ): DiagnosticoFinal {
    const limiteFragil = thresholds.regularMax;
    const limiteSolido = thresholds.bomMax + 1;

    const impactoConcreto = score <= limiteFragil
      ? `Seu score está em ${score}/100, abaixo do patamar saudável para execução consistente.`
      : `Seu score está em ${score}/100, com estrutura financeira funcional.`;

    const consequencia = score <= limiteFragil
      ? "Mantendo o cenário atual, o risco de perda de eficiência e desalinhamento com objetivo aumenta nos próximos ciclos."
      : "Se você mantiver a disciplina atual, a tendência é sustentar evolução com menor volatilidade estrutural.";

    const efeitoDecisoes = impactoDecisoes.quantidade > 0
      ? `Decisões recentes ${impactoDecisoes.deltaTotal >= 0 ? "melhoraram" : "pioraram"} o score em ${impactoDecisoes.deltaTotal.toFixed(1)} pontos acumulados.`
      : "Ainda não há decisões simuladas salvas para calibrar o diagnóstico comportamental.";

    if (retorno > 0 && score <= limiteFragil) {
      return {
        mensagem: `Sua carteira rendeu ${retorno.toFixed(2)}%, mas a estratégia está frágil. ${efeitoDecisoes}`,
        impactoConcreto,
        consequencia,
        oQueFazerAgora: insightPrincipal.acao,
        insightPrincipal,
      };
    }
    if (retorno < 0 && score >= limiteSolido) {
      return {
        mensagem: `A estratégia está sólida, mas o mercado pressionou o retorno (${retorno.toFixed(2)}%). ${efeitoDecisoes}`,
        impactoConcreto,
        consequencia,
        oQueFazerAgora: insightPrincipal.acao,
        insightPrincipal,
      };
    }
    if (retorno < 0 && score <= limiteFragil) {
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
    if (["maiorAtivoAlto", "concentracaoExtrema", "top3Concentrado", "classeUnica", "poucosAtivos"].includes(tipo)) return "concentracao_renda_variavel";
    if (["aportesInconsistentes", "evolucaoNegativa"].includes(tipo)) return "inconsistencia_aportes";
    if (["perfilConservadorRvAlto", "perfilModeradoRvAlto", "horizonteCurtoAgressivo", "rendaBaixaVolatilidadeAlta", "semDefensivo"].includes(tipo)) {
      return "risco_incompativel_perfil";
    }
    if (["liquidezBaixa", "dinheiroParadoAlto", "dependenciaDeAtivoIliquido", "endividamentoAlto"].includes(tipo)) {
      return "estrutura_patrimonial_fragil";
    }
    if (["idadeMaduraRiscoAgressivo", "idadeJovemSubaproveitada", "idadePreAposentadoriaDefensiva"].includes(tipo)) {
      return "risco_incompativel_momento_vida";
    }
    return "desalinhamento_objetivo";
  }

  private codigoAcaoPorRisco(riscoPrincipal: string): string {
    if (riscoPrincipal === "concentracao_renda_variavel") return "diversificar_por_classe_de_ativo";
    if (riscoPrincipal === "inconsistencia_aportes") return "regularizar_aportes_mensais";
    if (riscoPrincipal === "risco_incompativel_perfil") return "reduzir_assimetria_nos_proximos_aportes";
    if (riscoPrincipal === "estrutura_patrimonial_fragil") return "recompor_reserva_e_liquidez";
    if (riscoPrincipal === "sem_risco_estrutural") return "manter_estrategia_com_consistencia";
    if (riscoPrincipal === "risco_incompativel_momento_vida") return "adequar_carteira_ao_momento_de_vida";
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
    if (codigo === "risco_incompativel_momento_vida") return "A exposição ao risco não está adequada à sua faixa etária e momento de vida atual.";
    return "A alocação atual não está totalmente aderente ao objetivo financeiro declarado.";
  }

  private tituloAcao(codigo: string): string {
    if (codigo === "diversificar_por_classe_de_ativo") return "Diversificar por classe de ativo";
    if (codigo === "regularizar_aportes_mensais") return "Regularizar aportes mensais";
    if (codigo === "reduzir_assimetria_nos_proximos_aportes") return "Rebalancear risco nos próximos aportes";
    if (codigo === "recompor_reserva_e_liquidez") return "Recompor reserva e liquidez imediata";
    if (codigo === "manter_estrategia_com_consistencia") return "Manter estratégia com disciplina";
    if (codigo === "risco_incompativel_momento_vida") return "Adequar carteira ao momento de vida";
    return "Realinhar carteira ao objetivo";
  }
}
