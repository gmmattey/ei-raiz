package io.savro.database

import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import kotlinx.cinterop.ExperimentalForeignApi
import platform.Foundation.NSTemporaryDirectory
import platform.Foundation.NSUUID

/**
 * Roda o contrato comum contra SQLCipher real (via cinterop). Testa a mesma suíte de
 * comportamento que `RoomRepositorioItensPatrimoniaisContratoTest` no Android — mesmo contrato,
 * engines diferentes.
 *
 * NÃO EXECUTADO neste ambiente/sessão (host Windows sem toolchain iOS, ver relatório da #180).
 * Validação real depende da CI macOS existente (#195, job `ios-xcode-macos`).
 */
@OptIn(ExperimentalForeignApi::class)
class SQLCipherRepositorioItensPatrimoniaisContratoTest : RepositorioItensPatrimoniaisContratoTeste() {

    private val relogioDeTeste = RelogioDeTeste()

    override suspend fun criarRepositorio(): RepositorioItensPatrimoniais =
        RepositorioItensPatrimoniaisSQLCipher(
            provedorChaveMestra = FakeProvedorChaveMestra(chaveValidaSimulada = true),
            relogio = relogioDeTeste,
            caminhoPersonalizado = caminhoTemporario(),
        )

    override suspend fun criarRepositorioComChaveInvalida(): RepositorioItensPatrimoniais =
        RepositorioItensPatrimoniaisSQLCipher(
            provedorChaveMestra = FakeProvedorChaveMestra(chaveValidaSimulada = false),
            relogio = relogioDeTeste,
            caminhoPersonalizado = caminhoTemporario(),
        )

    override suspend fun encerrar(repositorio: RepositorioItensPatrimoniais) {
        repositorio.fechar()
    }

    private fun caminhoTemporario(): String =
        NSTemporaryDirectory() + "savro-teste-" + NSUUID().UUIDString + ".db"
}
