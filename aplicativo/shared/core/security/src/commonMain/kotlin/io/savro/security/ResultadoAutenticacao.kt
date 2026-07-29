package io.savro.security

/** Desfecho de uma tentativa de autenticação via [AutenticadorBiometrico.autenticar]. */
sealed class ResultadoAutenticacao {
    data object Sucesso : ResultadoAutenticacao()

    /** Usuário cancelou o prompt (botão negativo, gesto do sistema) — não é credencial errada. */
    data object Cancelado : ResultadoAutenticacao()

    /** Credencial (biometria ou código do dispositivo) rejeitada pelo sistema. */
    data class FalhaCredencial(val motivo: String) : ResultadoAutenticacao()

    /**
     * O próprio sistema operacional bloqueou novas tentativas temporariamente (muitas falhas
     * consecutivas) — sinal nativo (`BiometricPrompt.ERROR_LOCKOUT` no Android; no iOS não existe
     * um equivalente temporizado real, ver [BloqueioPermanente]), nunca uma contagem própria do
     * Savro.
     */
    data class BloqueioTemporario(val tentarNovamenteEmEpocaMs: Long) : ResultadoAutenticacao()

    /**
     * Biometria bloqueada até o usuário confirmar a credencial do dispositivo pelo menos uma vez
     * (`BiometricPrompt.ERROR_LOCKOUT_PERMANENT` no Android, `LAErrorBiometryLockout` no iOS — o
     * único código de bloqueio biométrico do iOS, sem contrapartida temporizada real, por isso
     * mapeia para cá e não para [BloqueioTemporario]).
     */
    data object BloqueioPermanente : ResultadoAutenticacao()

    /** Biometria/credencial não disponível no momento da tentativa (ver [DisponibilidadeBiometria]). */
    data class Indisponivel(val motivo: String) : ResultadoAutenticacao()
}
