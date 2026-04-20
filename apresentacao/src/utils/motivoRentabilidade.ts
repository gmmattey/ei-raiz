/**
 * Traduz códigos de `motivoRentabilidadeIndisponivel` (contrato backend) em texto
 * curto legível em PT-BR, para exibir ao usuário quando `rentabilidadeConfiavel === false`.
 *
 * Códigos emitidos pelo backend em `modulos-backend/carteira/src/familias.ts`.
 * Fator de correção tem prefixo dinâmico (`fator_de_correcao_indisponivel_para_<INDEXADOR>`)
 * — tratado por prefixo.
 */

const MENSAGENS_FIXAS: Record<string, string> = {
  preco_medio_inconsistente:
    "Preço médio não reconcilia com o valor investido. Revise a importação.",
  custo_zero:
    "Custo total zero ou ausente — sem base para calcular rentabilidade.",
  cota_na_data_de_aquisicao_nao_encontrada:
    "CVM não tem a cota do fundo na data de aquisição.",
  cota_atual_indisponivel_na_cvm:
    "CVM não retornou a cota atual deste fundo.",
  indexador_ou_taxa_ausentes_em_renda_fixa:
    "Renda fixa sem indexador ou taxa cadastrados.",
  bens_nao_tem_rentabilidade_marcada_a_mercado:
    "Bens não têm rentabilidade marcada a mercado.",
  caixa_poupanca_sem_historico_mensal:
    "Poupança/caixa sem histórico mensal — rentabilidade calculada apenas no fechamento.",
};

export function mensagemMotivoIndisponivel(codigo?: string | null): string | null {
  if (!codigo) return null;
  const fixa = MENSAGENS_FIXAS[codigo];
  if (fixa) return fixa;
  if (codigo.startsWith("fator_de_correcao_indisponivel_para_")) {
    const indexador = codigo.replace("fator_de_correcao_indisponivel_para_", "").toUpperCase();
    return `Fator de correção do ${indexador} indisponível no período.`;
  }
  return null;
}
