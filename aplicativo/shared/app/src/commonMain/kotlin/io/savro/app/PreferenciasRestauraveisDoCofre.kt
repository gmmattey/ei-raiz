package io.savro.app

import io.savro.backup.PreferenciasBackup
import io.savro.backup.PreferenciasRestauraveis
import io.savro.security.PreferenciasCofre

/**
 * Liga o contrato de preferências do backup (`:shared:core:backup`) ao armazenamento real de
 * preferências do cofre (`:shared:core:security`), sem que nenhum dos dois módulos precise
 * conhecer o outro — a costura acontece só aqui, no host compartilhado.
 *
 * Só o timeout de inatividade atravessa. `onboardingConcluido` e `chaveInvalidadaPersistida` são
 * estado desta instalação; a política de proteção depende de material criptográfico que existe
 * apenas no aparelho de origem (ver `ConteudoBackup`).
 */
class PreferenciasRestauraveisDoCofre(
    private val preferencias: PreferenciasCofre,
) : PreferenciasRestauraveis {

    override suspend fun ler(): PreferenciasBackup =
        PreferenciasBackup(timeoutInatividadeMs = preferencias.timeoutInatividadeMs())

    override suspend fun gravar(preferencias: PreferenciasBackup) {
        this.preferencias.definirTimeoutInatividadeMs(preferencias.timeoutInatividadeMs)
    }
}
