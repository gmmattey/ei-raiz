package io.savro.security

/**
 * Contrato comum de autenticação local do cofre (#118). Android implementa com `BiometricPrompt`
 * + credencial segura do dispositivo; iOS implementa com `LocalAuthentication`/`LAContext`
 * (Face ID, Touch ID ou código do dispositivo). Nenhum tipo de plataforma (`BiometricPrompt`,
 * `LAContext`, `NSError`) atravessa esta fronteira — só os tipos deste módulo.
 */
interface AutenticadorBiometrico {

    /** Consultado antes de mostrar o prompt, para decidir se vale a pena tentar. */
    suspend fun disponibilidade(): DisponibilidadeBiometria

    /**
     * Mostra o prompt nativo e suspende até o usuário concluir, cancelar, ou o sistema recusar.
     *
     * @param motivo texto exibido ao usuário explicando por que a autenticação é pedida — nunca
     *   contém dado patrimonial.
     * @param permitirCredencialDispositivo quando `true`, aceita código/PIN/padrão do aparelho
     *   como alternativa à biometria (reflete [PoliticaProtecao.Ativada.permitirCredencialDispositivo]).
     */
    suspend fun autenticar(motivo: String, permitirCredencialDispositivo: Boolean): ResultadoAutenticacao
}
