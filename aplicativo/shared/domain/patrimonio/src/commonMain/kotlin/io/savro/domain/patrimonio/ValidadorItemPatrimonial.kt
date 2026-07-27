package io.savro.domain.patrimonio

import io.savro.common.Resultado
import io.savro.model.OrigemValor
import io.savro.model.TipoItemPatrimonial

private const val TAMANHO_MAXIMO_NOME = 120
private const val TAMANHO_MAXIMO_INSTITUICAO = 120
private const val TAMANHO_MAXIMO_OBSERVACAO = 500
private val PADRAO_MOEDA = Regex("^[A-Z]{3}$")

/** Campos já validados e prontos para virar [io.savro.model.ItemPatrimonial] (falta só id/timestamps/origem/arquivado). */
data class ItemPatrimonialValidado(
    val tipo: TipoItemPatrimonial,
    val nome: String,
    val valorCentavos: Long,
    val moeda: String,
    val instituicao: String?,
    val observacao: String?,
    val quantidadeMilesimos: Long?,
    val precoMedioCentavos: Long?,
)

/**
 * Valida [EstadoFormularioItemPatrimonial] segundo as regras obrigatórias da issue #119. Pura,
 * sem acesso a banco/rede/relógio — só recebe e devolve dados. Retorna todos os erros encontrados
 * de uma vez (não para no primeiro), para a tela poder sinalizar todos os campos inválidos juntos.
 */
object ValidadorItemPatrimonial {

    fun validar(estado: EstadoFormularioItemPatrimonial): Resultado<ItemPatrimonialValidado, List<ErroValidacaoItem>> {
        val erros = mutableListOf<ErroValidacaoItem>()

        val tipo = estado.tipo
        val nome = estado.nome.trim()
        if (nome.isEmpty()) erros += ErroValidacaoItem.NomeObrigatorio
        if (nome.length > TAMANHO_MAXIMO_NOME) erros += ErroValidacaoItem.NomeMuitoLongo

        val moeda = estado.moeda.trim().uppercase()
        if (moeda.isEmpty()) {
            erros += ErroValidacaoItem.MoedaObrigatoria
        } else if (!PADRAO_MOEDA.matches(moeda)) {
            erros += ErroValidacaoItem.MoedaInvalida
        }

        val valorCentavos = ConversorMonetario.paraCentavos(estado.valorTexto)
        if (valorCentavos == null) {
            erros += ErroValidacaoItem.ValorObrigatorio
        } else if (tipo != null) {
            if (tipo == TipoItemPatrimonial.DIVIDA && valorCentavos > 0) {
                erros += ErroValidacaoItem.ValorDeDividaDeveSerNegativoOuZero
            }
            if (tipo != TipoItemPatrimonial.DIVIDA && valorCentavos < 0) {
                erros += ErroValidacaoItem.ValorNaoPodeSerNegativo(tipo)
            }
        }

        val instituicao = estado.instituicao.trim().ifEmpty { null }
        if ((instituicao?.length ?: 0) > TAMANHO_MAXIMO_INSTITUICAO) erros += ErroValidacaoItem.InstituicaoMuitoLonga

        val observacao = estado.observacao.trim().ifEmpty { null }
        if ((observacao?.length ?: 0) > TAMANHO_MAXIMO_OBSERVACAO) erros += ErroValidacaoItem.ObservacaoMuitoLonga

        val quantidadeInformada = estado.quantidadeTexto.isNotBlank()
        val precoMedioInformado = estado.precoMedioTexto.isNotBlank()
        var quantidadeMilesimos: Long? = null
        var precoMedioCentavos: Long? = null

        if (quantidadeInformada || precoMedioInformado) {
            if (tipo != TipoItemPatrimonial.RENDA_VARIAVEL) {
                erros += ErroValidacaoItem.QuantidadeOuPrecoMedioForaDeContexto
            }
            if (quantidadeInformada) {
                quantidadeMilesimos = ConversorMonetario.paraQuantidadeMilesimos(estado.quantidadeTexto)
                if (quantidadeMilesimos == null || quantidadeMilesimos <= 0) {
                    erros += ErroValidacaoItem.QuantidadeDeveSerPositiva
                    quantidadeMilesimos = null
                }
            }
            if (precoMedioInformado) {
                precoMedioCentavos = ConversorMonetario.paraCentavos(estado.precoMedioTexto)
                if (precoMedioCentavos == null || precoMedioCentavos <= 0) {
                    erros += ErroValidacaoItem.PrecoMedioDeveSerPositivo
                    precoMedioCentavos = null
                }
            }
        }

        if (tipo == null || erros.isNotEmpty() || valorCentavos == null) {
            return Resultado.Falha(erros.ifEmpty { listOf(ErroValidacaoItem.ValorObrigatorio) })
        }

        return Resultado.Sucesso(
            ItemPatrimonialValidado(
                tipo = tipo,
                nome = nome,
                valorCentavos = valorCentavos,
                moeda = moeda,
                instituicao = instituicao,
                observacao = observacao,
                quantidadeMilesimos = quantidadeMilesimos,
                precoMedioCentavos = precoMedioCentavos,
            ),
        )
    }
}

/**
 * Resumo revisável antes de salvar (issue #119: "mostrar resumo revisável antes de salvar").
 * Só formata o que [ValidadorItemPatrimonial] já validou — nunca formata um estado inválido.
 */
data class ResumoItemPatrimonial(
    val tipo: TipoItemPatrimonial,
    val nome: String,
    val valorFormatado: String,
    val moeda: String,
    val instituicao: String?,
    val observacao: String?,
    val quantidadeFormatada: String?,
    val precoMedioFormatado: String?,
    val origem: OrigemValor,
) {
    companion object {
        fun de(item: ItemPatrimonialValidado): ResumoItemPatrimonial = ResumoItemPatrimonial(
            tipo = item.tipo,
            nome = item.nome,
            valorFormatado = ConversorMonetario.centavosParaTexto(item.valorCentavos),
            moeda = item.moeda,
            instituicao = item.instituicao,
            observacao = item.observacao,
            quantidadeFormatada = item.quantidadeMilesimos?.let(ConversorMonetario::quantidadeMilesimosParaTexto),
            precoMedioFormatado = item.precoMedioCentavos?.let(ConversorMonetario::centavosParaTexto),
            origem = OrigemValor.MANUAL,
        )
    }
}
