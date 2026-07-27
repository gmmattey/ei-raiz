package io.savro.security

/** Resultado de checar se o aparelho consegue autenticar o usuário agora, antes de mostrar o prompt. */
sealed class DisponibilidadeBiometria {
    /** Biometria (ou, se permitido, credencial do dispositivo) pronta para uso. */
    data object Disponivel : DisponibilidadeBiometria()

    /** Aparelho não tem sensor biométrico nem código/PIN/padrão configurado — nada para checar. */
    data object SemHardware : DisponibilidadeBiometria()

    /** Sensor existe, mas nenhuma biometria foi cadastrada pelo usuário no sistema. */
    data object NaoConfigurada : DisponibilidadeBiometria()

    /** Indisponível agora por motivo transitório (atualização de segurança pendente, etc.). */
    data class TemporariamenteIndisponivel(val motivo: String) : DisponibilidadeBiometria()
}
