package io.savro.security

/**
 * Preferências de configuração do cofre — nenhuma delas é material criptográfico nem dado
 * patrimonial (isso é `ProvedorChaveMestra`/`RepositorioItensPatrimoniais`, #180); é só estado de
 * app (onboarding concluído, política de proteção escolhida, timeout de inatividade, e o flag de
 * chave invalidada usado para não repetir tentativas inúteis contra o Keystore/Keychain).
 *
 * Android implementa com `SharedPreferences`; iOS com `NSUserDefaults`. Não precisa de cifra
 * própria — nenhum valor aqui, sozinho, abre o cofre.
 */
interface PreferenciasCofre {
    suspend fun onboardingConcluido(): Boolean
    suspend fun marcarOnboardingConcluido()

    suspend fun politicaProtecao(): PoliticaProtecao
    suspend fun definirPoliticaProtecao(politica: PoliticaProtecao)

    suspend fun timeoutInatividadeMs(): Long
    suspend fun definirTimeoutInatividadeMs(valor: Long)

    /**
     * `true` quando uma tentativa anterior já detectou [io.savro.domain.patrimonio.ErroRepositorio.ChaveInvalida]
     * — usado para ir direto a [EstadoCofre.RestauracaoNecessaria] em vez de repetir uma consulta
     * ao Keystore/Keychain que já se sabe permanentemente inválida.
     */
    suspend fun chaveInvalidadaPersistida(): Boolean
    suspend fun marcarChaveInvalidadaPersistida()
}

/** Valores padrão compartilhados pelas implementações de [PreferenciasCofre]. */
object PreferenciasCofrePadrao {
    const val TIMEOUT_INATIVIDADE_MS_PADRAO: Long = 60_000L
}
