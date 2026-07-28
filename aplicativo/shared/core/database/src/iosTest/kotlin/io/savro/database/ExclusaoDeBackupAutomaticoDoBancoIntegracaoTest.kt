package io.savro.database

import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import kotlin.test.Test
import kotlin.test.assertTrue
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.ObjCObjectVar
import kotlinx.cinterop.alloc
import kotlinx.cinterop.memScoped
import kotlinx.cinterop.ptr
import kotlinx.cinterop.value
import kotlinx.coroutines.test.runTest
import platform.Foundation.NSFileManager
import platform.Foundation.NSNumber
import platform.Foundation.NSTemporaryDirectory
import platform.Foundation.NSURL
import platform.Foundation.NSURLIsExcludedFromBackupKey
import platform.Foundation.NSUUID

/**
 * Prova de verdade (não só "a chamada existe no código") de que o arquivo físico do banco criado
 * por [RepositorioItensPatrimoniaisSQLCipher.abrir] fica com `NSURLIsExcludedFromBackupKey == true`
 * no sistema de arquivos — #130, correção obrigatória do Luiz sobre o achado de que `savro.db` não
 * tinha exclusão explícita de backup automático (iCloud/iTunes) no iOS.
 *
 * NÃO EXECUTADO neste ambiente/sessão (host Windows sem toolchain iOS) — depende do job
 * `ios-xcode-macos` da CI (runner macOS real, o mesmo que já valida
 * `SQLCipherRepositorioItensPatrimoniaisContratoTest` e o vetor de interoperabilidade do backup).
 */
@OptIn(ExperimentalForeignApi::class)
class ExclusaoDeBackupAutomaticoDoBancoIntegracaoTest {

    @Test
    fun bancoCriado_ficaExcluidoDoBackupAutomaticoDeVerdade() = runTest {
        val caminho = NSTemporaryDirectory() + "savro-teste-exclusao-" + NSUUID().UUIDString + ".db"
        val repositorio: RepositorioItensPatrimoniais = RepositorioItensPatrimoniaisSQLCipher(
            provedorChaveMestra = FakeProvedorChaveMestra(chaveValidaSimulada = true),
            relogio = RelogioDeTeste(),
            caminhoPersonalizado = caminho,
        )

        try {
            repositorio.abrir()

            assertTrue(
                estaExcluidoDoBackupAutomatico(caminho),
                "savro.db deveria estar marcado como excluído do backup automático do sistema",
            )
        } finally {
            repositorio.fechar()
            NSFileManager.defaultManager().removeItemAtPath(caminho, error = null)
        }
    }

    private fun estaExcluidoDoBackupAutomatico(caminho: String): Boolean = memScoped {
        val url = NSURL.fileURLWithPath(caminho)
        val valor = alloc<ObjCObjectVar<Any?>>()
        val sucesso = url.getResourceValue(valor.ptr, forKey = NSURLIsExcludedFromBackupKey, error = null)
        sucesso && valor.value.comoBooleanoDeResourceValue()
    }
}

/**
 * `getResourceValue` devolve o valor via `id`/`Any?` — dependendo da versão do bridging
 * Objective-C/Kotlin-Native, um `NSNumber` booleano pode chegar já desembrulhado como [Boolean] ou
 * ainda como [NSNumber]. Cobre os dois casos em vez de assumir um só, já que este código nunca foi
 * compilado localmente (ver Kdoc da classe).
 */
@OptIn(ExperimentalForeignApi::class)
private fun Any?.comoBooleanoDeResourceValue(): Boolean = when (this) {
    is Boolean -> this
    is NSNumber -> this.boolValue
    else -> false
}
