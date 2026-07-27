package io.savro.database

import io.savro.common.Relogio
import kotlinx.cinterop.ExperimentalForeignApi
import platform.posix.time

/**
 * Implementação real de [Relogio] no iOS — equivalente a [RelogioDoSistemaAndroid]. Faltava desde
 * a #180 porque `:shared:app`/`:iosApp` ainda não consumiam `:shared:core:database`; a #118 é
 * quem passa a fazer essa fiação (`RepositorioItensPatrimoniaisSQLCipher` exige um [Relogio] real,
 * sem valor padrão).
 *
 * `platform.posix.time` (segundos, convertido para ms) em vez de `NSDate().timeIntervalSince1970`
 * — a propriedade da API Foundation não resolveu no klib desta toolchain (`AutenticadorBiometricoIOS`,
 * #118, teve o mesmo problema, verificado localmente); perde precisão de subsegundo, irrelevante
 * para `criadoEmEpocaMs`/`atualizadoEmEpocaMs` e para o timeout de inatividade do cofre.
 */
object RelogioDoSistemaIOS : Relogio {
    @OptIn(ExperimentalForeignApi::class)
    override fun agoraEmEpocaMs(): Long = time(null) * 1000L
}
