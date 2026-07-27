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
     * consecutivas) — sinal nativo de cada plataforma (`BiometricPrompt.ERROR_LOCKOUT` no Android,
     * `LAErrorBiometryLockout` no iOS), nunca uma contagem própria do Savro.
     */
    data class BloqueioTemporario(val tentarNovamenteEmEpocaMs: Long) : ResultadoAutenticacao()

    /** Biometria/credencial não disponível no momento da tentativa (ver [DisponibilidadeBiometria]). */
    data class Indisponivel(val motivo: String) : ResultadoAutenticacao()
}
