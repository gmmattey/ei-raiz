/**
 * Contratos para cotações de fundos via CVM Dados Abertos.
 *
 * A CVM publica diariamente o informe de cada fundo registrado (VL_QUOTA),
 * identificado por CNPJ. Este contrato modela a leitura dessas cotas já
 * normalizadas e em cache no D1.
 */

/** Uma cota diária de um fundo no D1 (tabela cotas_fundos_cvm). */
export type CotaFundoCvm = {
  cnpj: string;            // apenas dígitos, 14 chars
  dataRef: string;         // "YYYY-MM-DD"
  vlQuota: number;
  vlPatrimLiq?: number | null;
  nrCotst?: number | null;
};

/** Uma linha do catálogo CAD_FI da CVM (tabela fundos_cvm_cadastro). */
export type FundoCvmCadastro = {
  cnpj: string;
  denominacaoSocial: string;
  denominacaoNorm: string;
  classe?: string | null;
  situacao?: string | null;
};

/**
 * Provedor de cotações de fundos — leitura pura, sem ingestão.
 * A ingestão é responsabilidade de scripts/cron; este provedor consome o D1.
 */
export interface ProvedorCotacaoFundosCvm {
  /**
   * Retorna a cota mais recente de um fundo até a data-limite (exclusiva ou inclusiva).
   * Se `ateData` omitido, retorna a última cota disponível. `null` se não há cota em cache.
   */
  obterCotaMaisRecente(cnpj: string, ateData?: string): Promise<CotaFundoCvm | null>;

  /**
   * Retorna a última cota de cada mês dentro do período informado.
   * Chave do mapa: "YYYY-MM". Útil para reconstrução histórica mensal.
   */
  obterFechamentosMensais(
    cnpjs: string[],
    anoMesInicial: string,
    anoMesFinal: string,
  ): Promise<Map<string, Map<string, number>>>; // cnpj -> (anoMes -> vlQuota)
}
