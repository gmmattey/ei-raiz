package io.savro.security

/**
 * Resultado de checar, sem mostrar nenhum prompt, se o aparelho consegue autenticar o usuário
 * agora com a combinação de autenticadores pedida (ver [AutenticadorBiometrico.disponibilidade]).
 *
 * Os 8 casos (#226) cobrem tudo que a decisão de UX precisa sem que nenhuma plataforma decida por
 * conta própria se uma opção aparece, fica habilitada ou qual mensagem mostrar — Android e iOS só
 * reportam o estado real (`BiometricManager.canAuthenticate`/`LAContext.canEvaluatePolicy`); quem
 * decide fica em [DecisaoOpcaoProtecao] e na camada de UI (`:shared:app`).
 */
sealed class DisponibilidadeBiometria {

    /** Os autenticadores pedidos estão prontos para uso agora — pode mostrar o prompt. */
    data object Disponivel : DisponibilidadeBiometria()

    /** Aparelho não tem sensor biométrico nenhum (nem Face ID/Touch ID/impressão digital). */
    data object SemHardware : DisponibilidadeBiometria()

    /** Sensor existe, mas nenhuma biometria foi cadastrada pelo usuário no sistema. */
    data object NaoConfigurada : DisponibilidadeBiometria()

    /**
     * Aparelho não tem código/PIN/padrão/senha configurado no nível do sistema. Sem isso nem a
     * credencial do dispositivo nem (no iOS) a própria biometria funcionam — a Apple exige
     * passcode definido para cadastrar Face ID/Touch ID.
     */
    data object SemCredencialDispositivo : DisponibilidadeBiometria()

    /**
     * Sistema recusa novas tentativas até [tentarNovamenteEmEpocaMs] (quando conhecido) — sinal
     * nativo (`BiometricPrompt.ERROR_LOCKOUT`), nunca uma contagem própria do Savro. `null` quando
     * a plataforma sinaliza o bloqueio sem informar o horário exato de liberação.
     */
    data class BloqueadaTemporariamente(val tentarNovamenteEmEpocaMs: Long? = null) : DisponibilidadeBiometria()

    /**
     * Biometria bloqueada até o usuário confirmar a credencial do dispositivo pelo menos uma vez
     * (`BiometricPrompt.ERROR_LOCKOUT_PERMANENT` no Android, `LAErrorBiometryLockout` no iOS — no
     * iOS esse código não é temporizado, exige passcode para resetar).
     */
    data object BloqueadaPermanentemente : DisponibilidadeBiometria()

    /** Indisponível agora por motivo transitório de sistema, sem causa mais específica conhecida. */
    data object Indisponivel : DisponibilidadeBiometria()

    /** Retorno da plataforma que não mapeia para nenhum caso acima — nunca finge "disponível". */
    data class ErroDesconhecido(val motivo: String) : DisponibilidadeBiometria()
}
