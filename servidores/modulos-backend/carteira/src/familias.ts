/**
 * Estratégias de cálculo por família de ativo.
 *
 * Cada família recebe os insumos canônicos (ativo + metadados de mercado) e
 * devolve `ResultadoCalculo`. Nenhuma família chama I/O — todo dado externo
 * (cotação, série de índice) é fornecido pelo chamador. Isso mantém as famílias
 * puramente funcionais e testáveis.
 *
 * Regra de ouro: quando um insumo essencial está faltando, a família devolve
 * `rentabilidadeDesdeAquisicaoPct = null` e `rentabilidadeConfiavel = false`
 * com motivo legível. NUNCA chuta 0. A UI é responsável por exibir "—".
 *
 * Famílias:
 *   A — renda_variavel_listada: preço × quantidade via BRAPI
 *   B — fundo_cvm:              custo × (cota_atual / cota_aquisicao)
 *   C — renda_fixa_contratada:  valor_contratado × fator_correcao(indexador, taxa, tempo)
 *   D — bens:                   valor declarado, sem rentabilidade marcada
 *   E — caixa_poupanca:         valor declarado, sem rentabilidade marcada
 */

import type { FamiliaAtivo, IndexadorRendaFixa } from "@ei/contratos";

export type StatusPrecoMedio = "confiavel" | "ajustado_heuristica" | "inconsistente";

export type PrecoMedioNormalizado = {
  valor: number;
  status: StatusPrecoMedio;
  motivo?: string;
};

/**
 * Reconciliação auditável do preço médio importado.
 * Preservada do código original — núcleo correto.
 */
export const normalizarPrecoMedioUnitario = (
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

// ─── Tipos compartilhados entre famílias ──────────────────────────────────────

export type FontePreco = "brapi" | "cvm" | "calculado" | "nenhuma";
export type StatusAtualizacao = "atualizado" | "atrasado" | "indisponivel";

export type EntradaAtivo = {
  id: string;
  categoria: string;
  familia: FamiliaAtivo;
  quantidade: number;
  precoMedio: number;                  // em RF: "valor contratado"
  valorAtualPersistido: number;        // último valor gravado no DB
  dataAquisicao: string | null;
  // Específico RF/Prev
  indexador?: IndexadorRendaFixa | null;
  taxa?: number | null;
  dataInicio?: string | null;
  vencimento?: string | null;
};

export type MetaMercado = {
  fonte: FontePreco;
  status: StatusAtualizacao;
  precoAtual: number | null;
  variacaoPercentual: number | null;
  atualizadoEm: string | null;
  /**
   * Fundo CVM apenas: cota na data de aquisição. Presença habilita a fórmula
   * correta (variação de cota); ausência força confiavel=false.
   */
  cotaAquisicao?: number | null;
};

export type ContextoRendaFixa = {
  /**
   * Fator de correção acumulado entre `dataInicio` e hoje.
   * Exemplo: para 110% CDI com CDI acumulado de 8% no período, o chamador
   * calcula fator = (1 + 0.08 × 1.10) = 1.088.
   * null significa "não foi possível obter" → família C cai em fallback.
   */
  fatorCorrecaoAcumulado: number | null;
};

export type ResultadoCalculo = {
  valorAtual: number;
  rentabilidadeDesdeAquisicaoPct: number | null;
  rentabilidadeConfiavel: boolean;
  motivoRentabilidadeIndisponivel?: string;
  ganhoPerda: number;
  ganhoPerdaPercentual: number | null;
  precoAtual: number | null;
  variacaoPercentual: number | null;
  fontePreco: FontePreco;
  statusAtualizacao: StatusAtualizacao;
  atualizadoEm: string | null;
  statusPrecoMedio: StatusPrecoMedio;
  precoMedioUnitario: number;
};

// ─── Família A: Renda variável listada (ação, FII, ETF, BDR) ──────────────────

/**
 * Marca a mercado = preco_atual × quantidade.
 * Rentabilidade = (valor_atual − custo) / custo.
 */
export function calcularFamiliaA(ativo: EntradaAtivo, meta: MetaMercado): ResultadoCalculo {
  const norm = normalizarPrecoMedioUnitario(ativo.precoMedio, ativo.quantidade, ativo.valorAtualPersistido);
  const custoTotal = norm.valor * ativo.quantidade;

  // Sem cotação disponível: preserva valor persistido, mas rentabilidade fica
  // explicitamente confiável se temos custo + valor persistido. Se preço médio
  // é inconsistente, marca como não-confiável.
  if (meta.precoAtual === null) {
    const valorAtual = ativo.valorAtualPersistido;
    const confiavelPrecoMedio = norm.status !== "inconsistente";
    const rentabilidade = confiavelPrecoMedio && custoTotal > 0
      ? ((valorAtual - custoTotal) / custoTotal) * 100
      : null;
    return {
      valorAtual,
      rentabilidadeDesdeAquisicaoPct: rentabilidade !== null ? Number(rentabilidade.toFixed(4)) : null,
      rentabilidadeConfiavel: confiavelPrecoMedio && custoTotal > 0,
      motivoRentabilidadeIndisponivel: confiavelPrecoMedio
        ? undefined
        : "preco_medio_inconsistente",
      ganhoPerda: valorAtual - custoTotal,
      ganhoPerdaPercentual: rentabilidade !== null ? Number(rentabilidade.toFixed(4)) : null,
      precoAtual: null,
      variacaoPercentual: null,
      fontePreco: meta.fonte,
      statusAtualizacao: meta.status,
      atualizadoEm: meta.atualizadoEm,
      statusPrecoMedio: norm.status,
      precoMedioUnitario: norm.valor,
    };
  }

  const valorAtual = meta.precoAtual * ativo.quantidade;
  const rentabilidade = custoTotal > 0 ? ((valorAtual - custoTotal) / custoTotal) * 100 : null;
  const confiavel = norm.status !== "inconsistente" && custoTotal > 0;

  return {
    valorAtual: Number(valorAtual.toFixed(2)),
    rentabilidadeDesdeAquisicaoPct: rentabilidade !== null ? Number(rentabilidade.toFixed(4)) : null,
    rentabilidadeConfiavel: confiavel,
    motivoRentabilidadeIndisponivel: confiavel
      ? undefined
      : norm.status === "inconsistente"
        ? "preco_medio_inconsistente"
        : "custo_zero",
    ganhoPerda: valorAtual - custoTotal,
    ganhoPerdaPercentual: rentabilidade !== null ? Number(rentabilidade.toFixed(4)) : null,
    precoAtual: meta.precoAtual,
    variacaoPercentual: meta.variacaoPercentual,
    fontePreco: meta.fonte,
    statusAtualizacao: meta.status,
    atualizadoEm: meta.atualizadoEm,
    statusPrecoMedio: norm.status,
    precoMedioUnitario: norm.valor,
  };
}

// ─── Família B: Fundo CVM (cota unitária) ─────────────────────────────────────

/**
 * Semântica específica do nosso import:
 *   quantidade = 1 e precoMedio = valor total aplicado.
 *   CVM devolve cota (preço por unidade de fundo, escala muito diferente).
 *
 * Fórmula correta:
 *   valor_atual = custo_total × (cota_atual / cota_aquisicao)
 *   rentabilidade = (cota_atual − cota_aquisicao) / cota_aquisicao
 *
 * Sem `cotaAquisicao`, cai em confiavel=false (valorAtual mantém persistido).
 * Um fundo que veio com ticker (não CVM) usa família A.
 */
export function calcularFamiliaB(ativo: EntradaAtivo, meta: MetaMercado): ResultadoCalculo {
  const norm = normalizarPrecoMedioUnitario(ativo.precoMedio, ativo.quantidade, ativo.valorAtualPersistido);
  const custoTotal = norm.valor * ativo.quantidade;

  const semCotaAtual = meta.precoAtual === null;
  const semCotaBase = meta.cotaAquisicao == null || meta.cotaAquisicao <= 0;

  if (semCotaAtual || semCotaBase) {
    return {
      valorAtual: ativo.valorAtualPersistido,
      rentabilidadeDesdeAquisicaoPct: null,
      rentabilidadeConfiavel: false,
      motivoRentabilidadeIndisponivel: semCotaAtual
        ? "cota_atual_indisponivel_na_cvm"
        : "cota_na_data_de_aquisicao_nao_encontrada",
      ganhoPerda: 0,
      ganhoPerdaPercentual: null,
      precoAtual: meta.precoAtual,
      variacaoPercentual: meta.variacaoPercentual,
      fontePreco: meta.fonte,
      statusAtualizacao: meta.status,
      atualizadoEm: meta.atualizadoEm,
      statusPrecoMedio: norm.status,
      precoMedioUnitario: norm.valor,
    };
  }

  const retornoCota = (meta.precoAtual! - meta.cotaAquisicao!) / meta.cotaAquisicao!;
  const valorAtual = custoTotal * (1 + retornoCota);
  const rentabilidadePct = retornoCota * 100;

  return {
    valorAtual: Number(valorAtual.toFixed(2)),
    rentabilidadeDesdeAquisicaoPct: Number(rentabilidadePct.toFixed(4)),
    rentabilidadeConfiavel: true,
    ganhoPerda: valorAtual - custoTotal,
    ganhoPerdaPercentual: Number(rentabilidadePct.toFixed(4)),
    precoAtual: meta.precoAtual,
    variacaoPercentual: meta.variacaoPercentual,
    fontePreco: meta.fonte,
    statusAtualizacao: meta.status,
    atualizadoEm: meta.atualizadoEm,
    statusPrecoMedio: norm.status,
    precoMedioUnitario: norm.valor,
  };
}

// ─── Família C: Renda fixa contratada (CDB, LCI/LCA, Tesouro, Debêntures) ─────

/**
 * Semântica específica:
 *   quantidade = 1; precoMedio = valor contratado.
 *   valor_atual = valor_contratado × fator_correcao
 *
 * fator_correcao depende do indexador:
 *   PRE:        (1 + taxa/100) ^ ((hoje − dataInicio)/365)    — pode ser calculado sem fonte externa
 *   CDI/SELIC:  (1 + indice_acumulado × (taxa/100))            — exige série BCB (vem via contexto)
 *   IPCA/IGPM:  (1 + indice_acumulado) × (1 + taxa/100)^anos   — exige série BCB (vem via contexto)
 *
 * Se `contexto.fatorCorrecaoAcumulado` for fornecido, usa esse valor (respeita
 * qualquer indexador). Se não for e o indexador for PRE com dados mínimos, calcula
 * localmente. Caso contrário, confiavel=false com motivo.
 */
export function calcularFamiliaC(
  ativo: EntradaAtivo,
  meta: MetaMercado,
  contexto: ContextoRendaFixa,
  agora: Date = new Date(),
): ResultadoCalculo {
  const valorContratado = Number(ativo.precoMedio) * Number(ativo.quantidade || 1);
  const dataInicio = ativo.dataInicio ?? ativo.dataAquisicao;

  const faltaIndexador = !ativo.indexador || !Number.isFinite(ativo.taxa ?? NaN);
  const faltaData = !dataInicio;

  if (faltaIndexador || faltaData || !(valorContratado > 0)) {
    return {
      valorAtual: ativo.valorAtualPersistido || valorContratado,
      rentabilidadeDesdeAquisicaoPct: null,
      rentabilidadeConfiavel: false,
      motivoRentabilidadeIndisponivel: faltaIndexador
        ? "indexador_ou_taxa_ausentes_em_renda_fixa"
        : faltaData
          ? "data_inicio_ausente"
          : "valor_contratado_invalido",
      ganhoPerda: 0,
      ganhoPerdaPercentual: null,
      precoAtual: null,
      variacaoPercentual: null,
      fontePreco: "calculado",
      statusAtualizacao: meta.status,
      atualizadoEm: meta.atualizadoEm,
      statusPrecoMedio: "confiavel",
      precoMedioUnitario: ativo.precoMedio,
    };
  }

  let fator: number | null = contexto.fatorCorrecaoAcumulado;
  let motivoNaoConfiavel: string | undefined;

  // Fallback local apenas para PRE (determinístico sem fonte externa).
  if (fator === null && ativo.indexador === "PRE") {
    const inicio = new Date(dataInicio!);
    if (!Number.isNaN(inicio.getTime())) {
      const anos = Math.max(0, (agora.getTime() - inicio.getTime()) / (365 * 24 * 3600 * 1000));
      fator = Math.pow(1 + (ativo.taxa! / 100), anos);
    }
  }

  if (fator === null || !Number.isFinite(fator) || fator <= 0) {
    return {
      valorAtual: ativo.valorAtualPersistido || valorContratado,
      rentabilidadeDesdeAquisicaoPct: null,
      rentabilidadeConfiavel: false,
      motivoRentabilidadeIndisponivel: motivoNaoConfiavel
        ?? "fator_de_correcao_indisponivel_para_" + ativo.indexador,
      ganhoPerda: 0,
      ganhoPerdaPercentual: null,
      precoAtual: null,
      variacaoPercentual: null,
      fontePreco: "calculado",
      statusAtualizacao: "indisponivel",
      atualizadoEm: meta.atualizadoEm,
      statusPrecoMedio: "confiavel",
      precoMedioUnitario: ativo.precoMedio,
    };
  }

  const valorAtual = valorContratado * fator;
  const rentabilidadePct = (fator - 1) * 100;

  return {
    valorAtual: Number(valorAtual.toFixed(2)),
    rentabilidadeDesdeAquisicaoPct: Number(rentabilidadePct.toFixed(4)),
    rentabilidadeConfiavel: true,
    ganhoPerda: valorAtual - valorContratado,
    ganhoPerdaPercentual: Number(rentabilidadePct.toFixed(4)),
    precoAtual: null,
    variacaoPercentual: null,
    fontePreco: "calculado",
    statusAtualizacao: "atualizado",
    atualizadoEm: agora.toISOString(),
    statusPrecoMedio: "confiavel",
    precoMedioUnitario: ativo.precoMedio,
  };
}

// ─── Família D: Bens (imóvel, veículo) ────────────────────────────────────────

/**
 * Bens são valor declarado. Rentabilidade NÃO é computada aqui — sem série
 * temporal de valor_estimado por mês, qualquer cálculo seria chute. UI exibe
 * apenas o valor, sem coluna de rentabilidade.
 *
 * Nota: no contrato de ativos atual, bens entram pelo campo `categoria="bens"`
 * mas normalmente são persistidos em `contexto_financeiro_usuario.imoveis` /
 * `.veiculos`, fora da tabela `ativos`. Esta família existe por robustez.
 */
export function calcularFamiliaD(ativo: EntradaAtivo): ResultadoCalculo {
  const valorAtual = Number(ativo.valorAtualPersistido || ativo.precoMedio || 0);
  return {
    valorAtual: Number(valorAtual.toFixed(2)),
    rentabilidadeDesdeAquisicaoPct: null,
    rentabilidadeConfiavel: false,
    motivoRentabilidadeIndisponivel: "bens_nao_tem_rentabilidade_marcada_a_mercado",
    ganhoPerda: 0,
    ganhoPerdaPercentual: null,
    precoAtual: null,
    variacaoPercentual: null,
    fontePreco: "nenhuma",
    statusAtualizacao: "indisponivel",
    atualizadoEm: null,
    statusPrecoMedio: "confiavel",
    precoMedioUnitario: ativo.precoMedio,
  };
}

// ─── Família E: Caixa / poupança / cofrinho ───────────────────────────────────

/**
 * Caixa/poupança entram como saldo declarado. Sem série temporal mensal, não
 * calculamos rentabilidade aqui — evita mostrar 0% quando na verdade a poupança
 * rendeu TR+0,5% ao longo do período mas não temos o snapshot inicial.
 */
export function calcularFamiliaE(ativo: EntradaAtivo): ResultadoCalculo {
  const valorAtual = Number(ativo.valorAtualPersistido || ativo.precoMedio || 0);
  return {
    valorAtual: Number(valorAtual.toFixed(2)),
    rentabilidadeDesdeAquisicaoPct: null,
    rentabilidadeConfiavel: false,
    motivoRentabilidadeIndisponivel: "caixa_poupanca_sem_historico_mensal",
    ganhoPerda: 0,
    ganhoPerdaPercentual: null,
    precoAtual: null,
    variacaoPercentual: null,
    fontePreco: "nenhuma",
    statusAtualizacao: "indisponivel",
    atualizadoEm: null,
    statusPrecoMedio: "confiavel",
    precoMedioUnitario: ativo.precoMedio,
  };
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export type ContextoCalculo = {
  rendaFixa?: ContextoRendaFixa;
};

/**
 * Dispatch por família. Exaustivo por construção — se `FamiliaAtivo` ganhar um
 * novo valor, TypeScript força o mapeamento explícito aqui.
 */
export function calcularPorFamilia(
  ativo: EntradaAtivo,
  meta: MetaMercado,
  contexto: ContextoCalculo = {},
): ResultadoCalculo {
  switch (ativo.familia) {
    case "renda_variavel_listada":
      return calcularFamiliaA(ativo, meta);
    case "fundo_cvm":
      return calcularFamiliaB(ativo, meta);
    case "renda_fixa_contratada":
      return calcularFamiliaC(ativo, meta, contexto.rendaFixa ?? { fatorCorrecaoAcumulado: null });
    case "bens":
      return calcularFamiliaD(ativo);
    case "caixa_poupanca":
      return calcularFamiliaE(ativo);
    default: {
      const _exhaustive: never = ativo.familia;
      return _exhaustive;
    }
  }
}
