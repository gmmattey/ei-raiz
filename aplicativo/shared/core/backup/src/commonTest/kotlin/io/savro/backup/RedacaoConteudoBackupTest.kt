package io.savro.backup

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Complementa `RedacaoModeloPatrimonialTest` (`:shared:core:model`) no nível de
 * [ConteudoBackup] — o retrato completo do cofre que a #121 monta antes de cifrar. Confirma que o
 * `toString()` de [ConteudoBackup] não reintroduz o vazamento (ex.: imprimindo `itens=[...]` com a
 * lista inteira) mesmo que cada [io.savro.model.ItemPatrimonial] individual já se redija sozinho.
 */
class RedacaoConteudoBackupTest {

    @Test
    fun conteudoBackup_toString_nuncaContemCamposSensiveisDosItens() {
        val marcador = "MARCADOR_XPTO_CONTEUDO_BACKUP"
        val conteudo = conteudoDeTeste(
            itens = listOf(
                itemDeTeste(id = "item-marcado", nome = marcador, instituicao = marcador, observacao = marcador),
            ),
        )

        val texto = conteudo.toString()

        assertFalse(texto.contains(marcador), "toString() de ConteudoBackup vazou campo sensível: $texto")
        assertTrue(texto.contains("itens=1"), "contagem de itens deveria continuar visível: $texto")
    }
}
