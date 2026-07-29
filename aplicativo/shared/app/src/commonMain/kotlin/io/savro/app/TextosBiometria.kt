package io.savro.app

import io.savro.app.recursos.Res
import io.savro.app.recursos.cofre_biometria_bloqueio_permanente_mensagem
import io.savro.app.recursos.cofre_biometria_bloqueio_permanente_titulo
import io.savro.app.recursos.cofre_biometria_indisponivel_mensagem
import io.savro.app.recursos.cofre_biometria_indisponivel_titulo
import io.savro.app.recursos.cofre_biometria_nao_configurada_mensagem
import io.savro.app.recursos.cofre_biometria_nao_configurada_titulo
import io.savro.app.recursos.cofre_biometria_sem_credencial_mensagem
import io.savro.app.recursos.cofre_biometria_sem_credencial_titulo
import io.savro.app.recursos.cofre_biometria_sem_hardware_mensagem
import io.savro.app.recursos.cofre_biometria_sem_hardware_titulo
import io.savro.app.recursos.cofre_bloqueio_temporario_mensagem
import io.savro.app.recursos.cofre_bloqueio_temporario_titulo
import io.savro.security.DisponibilidadeBiometria
import org.jetbrains.compose.resources.StringResource

/**
 * Título e mensagem coerentes com a causa real de indisponibilidade (#226, "hardware ausente não
 * sugere cadastre sua biometria") — usado tanto no painel de estado do cofre (`CofreScreens.kt`)
 * quanto na explicação inline de cada opção desabilitada (`CofreOnboarding.kt`, `AjustesScreens.kt`).
 * A decisão de habilitar/desabilitar/permitir fallback é de [io.savro.security.DecisaoOpcaoProtecao]
 * (commonMain de `:shared:core:security`, sem Compose) — aqui só a tradução para string.
 */
internal fun tituloIndisponibilidade(motivo: DisponibilidadeBiometria): StringResource = when (motivo) {
    DisponibilidadeBiometria.SemHardware -> Res.string.cofre_biometria_sem_hardware_titulo
    DisponibilidadeBiometria.NaoConfigurada -> Res.string.cofre_biometria_nao_configurada_titulo
    DisponibilidadeBiometria.SemCredencialDispositivo -> Res.string.cofre_biometria_sem_credencial_titulo
    DisponibilidadeBiometria.BloqueadaPermanentemente -> Res.string.cofre_biometria_bloqueio_permanente_titulo
    is DisponibilidadeBiometria.BloqueadaTemporariamente -> Res.string.cofre_bloqueio_temporario_titulo
    DisponibilidadeBiometria.Disponivel,
    DisponibilidadeBiometria.Indisponivel,
    is DisponibilidadeBiometria.ErroDesconhecido,
    -> Res.string.cofre_biometria_indisponivel_titulo
}

internal fun mensagemIndisponibilidade(motivo: DisponibilidadeBiometria): StringResource = when (motivo) {
    DisponibilidadeBiometria.SemHardware -> Res.string.cofre_biometria_sem_hardware_mensagem
    DisponibilidadeBiometria.NaoConfigurada -> Res.string.cofre_biometria_nao_configurada_mensagem
    DisponibilidadeBiometria.SemCredencialDispositivo -> Res.string.cofre_biometria_sem_credencial_mensagem
    DisponibilidadeBiometria.BloqueadaPermanentemente -> Res.string.cofre_biometria_bloqueio_permanente_mensagem
    is DisponibilidadeBiometria.BloqueadaTemporariamente -> Res.string.cofre_bloqueio_temporario_mensagem
    DisponibilidadeBiometria.Disponivel,
    DisponibilidadeBiometria.Indisponivel,
    is DisponibilidadeBiometria.ErroDesconhecido,
    -> Res.string.cofre_biometria_indisponivel_mensagem
}
