package io.savro.designsystem.componentes

/**
 * Máscara de ocultação global de valores (issue #120: "valores ocultos não podem vazar em texto,
 * gráfico, semantics/acessibilidade"; unificada na #230). Função pura e testável: garante, no
 * nível mais baixo possível, que nenhum dígito do valor real sobrevive ao texto/descrição exibidos
 * quando oculto.
 *
 * `internal`: única implementação canônica, consumida somente por [SavroPrivacyMask]/
 * [SavroPrivacyText] neste módulo — nenhuma tela deve chamar isto diretamente (era exatamente essa
 * chamada direta, duplicada em três telas, que a #230 elimina). Vive em `:shared:core:designsystem`
 * e não em `:shared:domain:patrimonio` porque a allowlist de dependências de produção
 * (`aplicativo/build.gradle.kts`) só permite `designsystem → core:common` — o domínio de patrimônio
 * não pode ser consumido daqui, e o design system não deve depender de um domínio de negócio
 * específico.
 */
internal object ApresentacaoValor {
    const val MASCARA: String = "••••••"
    const val DESCRICAO_ACESSIBILIDADE_OCULTO: String = "Valor oculto"

    /** Texto já formatado (ex.: "R$ 1.234,56") -> [MASCARA] quando [oculto]. */
    fun texto(valorFormatado: String, oculto: Boolean): String = if (oculto) MASCARA else valorFormatado

    /** `contentDescription` seguro para leitor de tela — nunca o valor real quando [oculto]. */
    fun descricaoAcessibilidade(valorFormatado: String, oculto: Boolean): String =
        if (oculto) DESCRICAO_ACESSIBILIDADE_OCULTO else valorFormatado
}
