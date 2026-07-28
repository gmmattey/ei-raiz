package io.savro.domain.patrimonio

import io.savro.model.ItemPatrimonial

/** Ordenação da lista de Patrimônio (issue #120: "ordenação por nome ou valor"). */
enum class OrdenacaoItensPatrimoniais {
    NOME_ASC,
    NOME_DESC,
    VALOR_ASC,
    VALOR_DESC,
}

/**
 * Aplica [ordenacao] sobre uma lista já filtrada — usada igualmente por Home (top pendências) e
 * Patrimônio (lista completa), nunca reimplementada por tela. Ordenar por valor usa
 * `valorCentavos` diretamente (`Long`), nunca `Double`.
 */
fun List<ItemPatrimonial>.ordenarPor(ordenacao: OrdenacaoItensPatrimoniais): List<ItemPatrimonial> = when (ordenacao) {
    OrdenacaoItensPatrimoniais.NOME_ASC -> sortedBy { it.nome.lowercase() }
    OrdenacaoItensPatrimoniais.NOME_DESC -> sortedByDescending { it.nome.lowercase() }
    OrdenacaoItensPatrimoniais.VALOR_ASC -> sortedBy { it.valorCentavos }
    OrdenacaoItensPatrimoniais.VALOR_DESC -> sortedByDescending { it.valorCentavos }
}
