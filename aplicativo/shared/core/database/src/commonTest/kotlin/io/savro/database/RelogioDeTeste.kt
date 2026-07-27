package io.savro.database

import io.savro.common.Relogio

/** Relógio determinístico para teste: cada chamada avança um milissegundo a partir da base. */
class RelogioDeTeste(private val baseEpocaMs: Long = 1_700_000_000_000L) : Relogio {
    private var contador = 0L

    override fun agoraEmEpocaMs(): Long {
        contador += 1
        return baseEpocaMs + contador
    }
}
