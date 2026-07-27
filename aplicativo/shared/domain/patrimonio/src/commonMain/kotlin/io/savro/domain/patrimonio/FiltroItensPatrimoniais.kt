package io.savro.domain.patrimonio

import io.savro.model.ItemPatrimonial
import io.savro.model.TipoItemPatrimonial

/**
 * Filtro aplicado sobre itens já carregados do banco local (issue #119: "buscar e filtrar apenas
 * dados já armazenados localmente" — nunca consulta remota). `incluirArquivados = false` é o
 * padrão: a visão principal de Home/Patrimônio não mostra itens arquivados a menos que a tela
 * peça explicitamente.
 */
data class FiltroItensPatrimoniais(
    val texto: String = "",
    val tipos: Set<TipoItemPatrimonial> = emptySet(),
    val incluirArquivados: Boolean = false,
) {
    fun aplicar(itens: List<ItemPatrimonial>): List<ItemPatrimonial> {
        val textoNormalizado = texto.trim().lowercase()
        return itens.filter { item ->
            (incluirArquivados || !item.arquivado) &&
                (tipos.isEmpty() || item.tipo in tipos) &&
                (textoNormalizado.isEmpty() || correspondeAoTexto(item, textoNormalizado))
        }
    }

    private fun correspondeAoTexto(item: ItemPatrimonial, textoNormalizado: String): Boolean =
        item.nome.lowercase().contains(textoNormalizado) ||
            item.instituicao?.lowercase()?.contains(textoNormalizado) == true ||
            item.observacao?.lowercase()?.contains(textoNormalizado) == true
}
