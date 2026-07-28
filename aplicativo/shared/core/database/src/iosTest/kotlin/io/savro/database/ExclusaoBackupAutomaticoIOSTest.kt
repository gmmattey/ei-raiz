package io.savro.database

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlinx.cinterop.ExperimentalForeignApi
import platform.Foundation.NSData
import platform.Foundation.NSFileManager
import platform.Foundation.NSTemporaryDirectory
import platform.Foundation.NSUUID
import platform.Foundation.writeToFile

/**
 * Teste unitário da lógica de exclusão de backup automático (#130, correção obrigatória do Luiz).
 * NÃO EXECUTADO neste ambiente/sessão (host Windows sem toolchain iOS) — depende do job
 * `ios-xcode-macos` da CI (runner macOS real) para rodar de verdade, mesmo padrão já documentado
 * em `SQLCipherRepositorioItensPatrimoniaisContratoTest`.
 */
@OptIn(ExperimentalForeignApi::class)
class ExclusaoBackupAutomaticoIOSTest {

    @Test
    fun arquivoInexistente_retornaArquivoInexistente_semLancarExcecao() {
        val caminho = NSTemporaryDirectory() + "savro-teste-inexistente-" + NSUUID().UUIDString

        val resultado = excluirArquivoDoBackupAutomatico(caminho, indice = 0)

        assertEquals(ResultadoExclusaoBackupAutomatico.ArquivoInexistente, resultado)
    }

    @Test
    fun arquivoExistente_eExcluidoComSucesso() {
        val caminho = NSTemporaryDirectory() + "savro-teste-existente-" + NSUUID().UUIDString
        NSData().writeToFile(caminho, atomically = true)

        try {
            val resultado = excluirArquivoDoBackupAutomatico(caminho, indice = 0)

            assertEquals(ResultadoExclusaoBackupAutomatico.Excluido, resultado)
        } finally {
            NSFileManager.defaultManager().removeItemAtPath(caminho, error = null)
        }
    }

    @Test
    fun candidatosDeSidecarDoBanco_incluiPrincipalJournalWalEShm() {
        val candidatos = candidatosDeSidecarDoBanco("/tmp/savro.db")

        assertEquals(
            listOf("/tmp/savro.db", "/tmp/savro.db-journal", "/tmp/savro.db-wal", "/tmp/savro.db-shm"),
            candidatos,
        )
    }

    @Test
    fun excluirBancoDoBackupAutomatico_tentaTodosOsCandidatosNaOrdem() {
        val caminhoBase = NSTemporaryDirectory() + "savro-teste-banco-" + NSUUID().UUIDString + ".db"
        NSData().writeToFile(caminhoBase, atomically = true)

        try {
            val resultados = excluirBancoDoBackupAutomatico(caminhoBase)

            // Só o arquivo principal existe neste teste — os três sidecars não foram criados.
            assertEquals(4, resultados.size)
            assertEquals(ResultadoExclusaoBackupAutomatico.Excluido, resultados[0])
            assertTrue(resultados.drop(1).all { it == ResultadoExclusaoBackupAutomatico.ArquivoInexistente })
        } finally {
            NSFileManager.defaultManager().removeItemAtPath(caminhoBase, error = null)
        }
    }

    @Test
    fun resultadoFalhou_toString_nuncaContemCaminho() {
        val caminhoSensivel = "/private/var/mobile/Containers/Data/Application/algo/savro.db"
        val resultado = ResultadoExclusaoBackupAutomatico.Falhou(indice = 2)

        val texto = resultado.toString()

        assertFalse(texto.contains(caminhoSensivel))
        assertTrue(texto.contains("índice 2"))
    }
}
