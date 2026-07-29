package io.savro.security

/**
 * Contrato comum de autenticação local do cofre (#118). Android implementa com `BiometricPrompt`
 * + credencial segura do dispositivo; iOS implementa com `LocalAuthentication`/`LAContext`
 * (Face ID, Touch ID ou código do dispositivo). Nenhum tipo de plataforma (`BiometricPrompt`,
 * `LAContext`, `NSError`) atravessa esta fronteira — só os tipos deste módulo.
 */
interface AutenticadorBiometrico {

    /**
     * Consultado antes de mostrar o prompt (nunca dispara autenticação real —
     * `BiometricManager.canAuthenticate`/`LAContext.canEvaluatePolicy`), para decidir se a opção
     * deve aparecer habilitada e qual seria o desfecho de uma tentativa agora (#226).
     *
     * @param permitirCredencialDispositivo quando `true`, considera código/PIN/padrão do aparelho
     *   como alternativa válida (mesma combinação que [autenticar] usaria); quando `false`, checa
     *   só a biometria isolada. Chamado com os dois valores quando a UI precisa diferenciar as
     *   opções "Biometria" e "Credencial do aparelho" (ver `TelaEscolherProtecao`).
     */
    suspend fun disponibilidade(permitirCredencialDispositivo: Boolean): DisponibilidadeBiometria

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
