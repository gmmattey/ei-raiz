package io.savro.model

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Gate de regressão do contrato de redaction (#130, critério "testes impedem regressão de
 * telemetria quando novos modelos/campos patrimoniais forem adicionados").
 *
 * Toda `data class` Kotlin gera um `toString()` que interpola **todos** os campos em texto claro —
 * é esse `toString()` implícito que um `Log.d(TAG, item.toString())` futuro, uma interpolação
 * `"$item"` dentro de uma mensagem de erro, ou uma breadcrumb de crash reporter usariam por padrão,
 * sem que ninguém tenha escrito uma linha de código pensando em telemetria. `ItemPatrimonial`,
 * `AjusteValorItem` e `EventoTimelineItem` sobrescrevem `toString()` para nunca incluir nome,
 * instituição, observação, moeda ou valor monetário — este teste fixa esse contrato com
 * valores-marcador reconhecíveis.
 *
 * Limite honesto: isto é uma amostra fixa, não uma verificação exaustiva de todo campo futuro —
 * `commonMain` em Kotlin/Native não tem reflexão completa disponível para inspecionar
 * automaticamente cada propriedade de uma `data class`. Quem adicionar um campo sensível novo a
 * qualquer um destes modelos precisa atualizar o `toString()` correspondente; este teste só
 * garante que os campos sensíveis **conhecidos hoje** nunca regridem. Ver
 * `documentacao/arquitetura/seguranca/contrato-redaction-savro.md`.
 */
class RedacaoModeloPatrimonialTest {

    private val marcadorNome = "MARCADOR_NOME_SENSIVEL_XPTO"
    private val marcadorInstituicao = "MARCADOR_INSTITUICAO_SENSIVEL_XPTO"
    private val marcadorObservacao = "MARCADOR_OBSERVACAO_SENSIVEL_XPTO"
    private val marcadorMoeda = "XPT"
    private val valorMarcadorAnterior = 123_456_789L
    private val valorMarcadorNovo = 987_654_321L

    @Test
    fun itemPatrimonial_toString_nuncaContemCamposSensiveis() {
        val item = ItemPatrimonial(
            id = "item-teste-redaction",
            tipo = TipoItemPatrimonial.CONTA,
            nome = marcadorNome,
            valorCentavos = valorMarcadorAnterior,
            moeda = marcadorMoeda,
            instituicao = marcadorInstituicao,
            observacao = marcadorObservacao,
            quantidadeMilesimos = null,
            precoMedioCentavos = null,
            origem = OrigemValor.MANUAL,
            arquivado = false,
            criadoEmEpocaMs = 0L,
            atualizadoEmEpocaMs = 0L,
        )

        val texto = item.toString()

        assertFalse(texto.contains(marcadorNome), "toString() vazou o nome do item: $texto")
        assertFalse(texto.contains(marcadorInstituicao), "toString() vazou a instituição: $texto")
        assertFalse(texto.contains(marcadorObservacao), "toString() vazou a observação: $texto")
        assertFalse(texto.contains(marcadorMoeda), "toString() vazou a moeda: $texto")
        assertFalse(texto.contains(valorMarcadorAnterior.toString()), "toString() vazou o valor: $texto")
        assertTrue(texto.contains("item-teste-redaction"), "id deveria continuar visível (não é sensível)")
    }

    @Test
    fun ajusteValorItem_toString_nuncaContemValoresMonetarios() {
        val ajuste = AjusteValorItem(
            id = "ajuste-teste-redaction",
            itemId = "item-teste-redaction",
            valorCentavosAnterior = valorMarcadorAnterior,
            valorCentavosNovo = valorMarcadorNovo,
            origem = OrigemValor.MANUAL,
            dataEpocaMs = 0L,
        )

        val texto = ajuste.toString()

        assertFalse(texto.contains(valorMarcadorAnterior.toString()), "toString() vazou o valor anterior: $texto")
        assertFalse(texto.contains(valorMarcadorNovo.toString()), "toString() vazou o valor novo: $texto")
        assertTrue(texto.contains("ajuste-teste-redaction"))
    }

    @Test
    fun eventoTimelineItem_toString_nuncaContemNomeDoItem() {
        val evento = EventoTimelineItem(
            id = "evento-teste-redaction",
            itemId = "item-teste-redaction",
            itemNome = marcadorNome,
            tipo = TipoEventoTimeline.ITEM_CRIADO,
            dataEpocaMs = 0L,
        )

        val texto = evento.toString()

        assertFalse(texto.contains(marcadorNome), "toString() vazou itemNome: $texto")
        assertTrue(texto.contains("evento-teste-redaction"))
    }
}
