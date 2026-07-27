package io.savro.database

import io.savro.common.Relogio

/**
 * Implementação real de [Relogio] no Android. Vive aqui (infra), não em `:shared:core:common`,
 * que é módulo puro e não pode chamar API de plataforma em nenhum source set.
 */
internal object RelogioDoSistemaAndroid : Relogio {
    override fun agoraEmEpocaMs(): Long = System.currentTimeMillis()
}
