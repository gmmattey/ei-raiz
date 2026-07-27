package io.savro.database

import io.savro.common.Relogio

/**
 * Implementação real de [Relogio] no Android. Vive aqui (infra), não em `:shared:core:common`,
 * que é módulo puro e não pode chamar API de plataforma em nenhum source set.
 *
 * Público (não `internal`) desde a #118: `:shared:app` (androidMain) reaproveita a mesma
 * implementação para conectar o [GerenciadorCofre][io.savro.security.GerenciadorCofre] — um único
 * relógio real por processo, não uma cópia divergente por módulo.
 */
object RelogioDoSistemaAndroid : Relogio {
    override fun agoraEmEpocaMs(): Long = System.currentTimeMillis()
}
