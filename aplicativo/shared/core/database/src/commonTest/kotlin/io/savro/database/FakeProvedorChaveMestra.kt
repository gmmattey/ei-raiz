package io.savro.database

import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.ProvedorChaveMestra
import kotlin.random.Random

/**
 * [ProvedorChaveMestra] em memória para o teste de contrato comum. Não toca Keystore/Keychain —
 * só simula os dois desfechos que a interface precisa cobrir: chave disponível e chave inválida.
 */
class FakeProvedorChaveMestra(
    private var chaveValidaSimulada: Boolean = true,
) : ProvedorChaveMestra {

    private val chave: ByteArray = Random(seed = 42).nextBytes(32)
    var vezesInvalidada: Int = 0
        private set

    override suspend fun obterOuCriarChave(): Resultado<ByteArray, ErroRepositorio> =
        if (chaveValidaSimulada) {
            Resultado.Sucesso(chave.copyOf())
        } else {
            Resultado.Falha(ErroRepositorio.ChaveInvalida("Chave simulada como inválida pelo teste"))
        }

    override suspend fun invalidarCacheEmMemoria() {
        vezesInvalidada += 1
    }
}
