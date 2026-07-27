package io.savro.security

import platform.Foundation.NSUserDefaults

/**
 * [PreferenciasCofre] iOS: `NSUserDefaults` — mesmo raciocínio do lado Android, nenhum valor aqui
 * é material criptográfico (isso é o Keychain, via `ProvedorChaveMestraIOS`, #180).
 */
class PreferenciasCofreIOS(
    private val defaults: NSUserDefaults = NSUserDefaults.standardUserDefaults,
) : PreferenciasCofre {

    override suspend fun onboardingConcluido(): Boolean = defaults.boolForKey(CHAVE_ONBOARDING_CONCLUIDO)

    override suspend fun marcarOnboardingConcluido() {
        defaults.setBool(true, CHAVE_ONBOARDING_CONCLUIDO)
    }

    override suspend fun politicaProtecao(): PoliticaProtecao =
        if (defaults.boolForKey(CHAVE_PROTECAO_ATIVA)) {
            PoliticaProtecao.Ativada(
                permitirCredencialDispositivo = defaults.objectForKey(CHAVE_PERMITIR_CREDENCIAL)
                    ?.let { defaults.boolForKey(CHAVE_PERMITIR_CREDENCIAL) }
                    ?: true,
            )
        } else {
            PoliticaProtecao.Nenhuma
        }

    override suspend fun definirPoliticaProtecao(politica: PoliticaProtecao) {
        when (politica) {
            PoliticaProtecao.Nenhuma -> defaults.setBool(false, CHAVE_PROTECAO_ATIVA)
            is PoliticaProtecao.Ativada -> {
                defaults.setBool(true, CHAVE_PROTECAO_ATIVA)
                defaults.setBool(politica.permitirCredencialDispositivo, CHAVE_PERMITIR_CREDENCIAL)
            }
        }
    }

    override suspend fun timeoutInatividadeMs(): Long {
        val valor = defaults.doubleForKey(CHAVE_TIMEOUT)
        return if (valor > 0) valor.toLong() else PreferenciasCofrePadrao.TIMEOUT_INATIVIDADE_MS_PADRAO
    }

    override suspend fun definirTimeoutInatividadeMs(valor: Long) {
        defaults.setDouble(valor.toDouble(), CHAVE_TIMEOUT)
    }

    override suspend fun chaveInvalidadaPersistida(): Boolean = defaults.boolForKey(CHAVE_INVALIDADA)

    override suspend fun marcarChaveInvalidadaPersistida() {
        defaults.setBool(true, CHAVE_INVALIDADA)
    }

    private companion object {
        const val CHAVE_ONBOARDING_CONCLUIDO = "savro.onboarding_concluido"
        const val CHAVE_PROTECAO_ATIVA = "savro.protecao_ativa"
        const val CHAVE_PERMITIR_CREDENCIAL = "savro.permitir_credencial_dispositivo"
        const val CHAVE_TIMEOUT = "savro.timeout_inatividade_ms"
        const val CHAVE_INVALIDADA = "savro.chave_invalidada_persistida"
    }
}
