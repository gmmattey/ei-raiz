package io.savro.domain.patrimonio.calculo

/**
 * Máscara de ocultação global de valores (issue #120: "valores ocultos não podem vazar em texto,
 * gráfico, semantics/acessibilidade"). Função pura e testável: garante, no nível mais baixo
 * possível, que nenhum dígito do valor real sobrevive ao texto/descrição exibidos quando oculto —
 * a camada de UI (Compose) usa isto para o texto visível **e** para o `contentDescription` de
 * leitor de tela, nunca só um dos dois.
 */
object ApresentacaoValor {
    const val MASCARA: String = "••••••"
    const val DESCRICAO_ACESSIBILIDADE_OCULTO: String = "Valor oculto"

    /** Texto já formatado (ex.: "R$ 1.234,56") -> [MASCARA] quando [oculto]. */
    fun texto(valorFormatado: String, oculto: Boolean): String = if (oculto) MASCARA else valorFormatado

    /** `contentDescription` seguro para leitor de tela — nunca o valor real quando [oculto]. */
    fun descricaoAcessibilidade(valorFormatado: String, oculto: Boolean): String =
        if (oculto) DESCRICAO_ACESSIBILIDADE_OCULTO else valorFormatado
}
