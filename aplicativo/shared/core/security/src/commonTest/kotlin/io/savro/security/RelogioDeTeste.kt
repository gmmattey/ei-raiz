package io.savro.security

import io.savro.common.Relogio

class RelogioDeTeste(private var agoraMs: Long = 0L) : Relogio {
    override fun agoraEmEpocaMs(): Long = agoraMs

    fun avancar(ms: Long) {
        agoraMs += ms
    }

    fun definir(ms: Long) {
        agoraMs = ms
    }
}
