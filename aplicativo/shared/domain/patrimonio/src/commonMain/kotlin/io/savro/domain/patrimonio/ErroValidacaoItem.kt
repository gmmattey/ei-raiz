package io.savro.domain.patrimonio

/**
 * Vocabulário de erro de validação de formulário (issue #119). Independente de UI — a tela só
 * traduz cada caso para uma mensagem visível; a regra em si vive aqui, testável em `commonTest`
 * sem Compose.
 */
sealed class ErroValidacaoItem {
    data object NomeObrigatorio : ErroValidacaoItem()
    data object NomeMuitoLongo : ErroValidacaoItem()
    data object MoedaObrigatoria : ErroValidacaoItem()
    data object MoedaInvalida : ErroValidacaoItem()
    data object ValorObrigatorio : ErroValidacaoItem()

    /** [tipo] não aceita valor negativo (todos exceto `DIVIDA`, ver convenção em `ItemPatrimonial`). */
    data class ValorNaoPodeSerNegativo(val tipo: io.savro.model.TipoItemPatrimonial) : ErroValidacaoItem()

    /** `DIVIDA` deve ser <= 0 — ver convenção de sinal em `ItemPatrimonial`. */
    data object ValorDeDividaDeveSerNegativoOuZero : ErroValidacaoItem()

    data object QuantidadeDeveSerPositiva : ErroValidacaoItem()
    data object PrecoMedioDeveSerPositivo : ErroValidacaoItem()

    /** Quantidade e preço médio só se aplicam a `RENDA_VARIAVEL` (issue #119). */
    data object QuantidadeOuPrecoMedioForaDeContexto : ErroValidacaoItem()

    data object ObservacaoMuitoLonga : ErroValidacaoItem()
    data object InstituicaoMuitoLonga : ErroValidacaoItem()
}
