package io.savro.security

import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.ProvedorChaveMestra
import kotlin.random.Random

/** Mesma forma do fake usado em `:shared:core:database` (#180) — duplicado aqui de propósito: os
 * dois módulos não podem depender um do outro só para compartilhar um teste dobrável. */
class FakeProvedorChaveMestra(
    var chaveValidaSimulada: Boolean = true,
) : ProvedorChaveMestra {

    private val chave: ByteArray = Random(seed = 7).nextBytes(32)
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
